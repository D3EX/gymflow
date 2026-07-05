from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import date, datetime, timedelta
from ..database import get_db
from ..models.models import (
    User, Member, Program, ProgramWeek, ProgramDay, Exercise, 
    ExerciseLibrary, CoachClient
)
from ..schemas.schemas import (
    ProgramCreate, ProgramUpdate, ProgramWeekCreate, ProgramWeekUpdate,
    ProgramDayCreate, ProgramDayUpdate, ExerciseCreate, ExerciseUpdate,
    ProgramOut, ProgramWeekOut, ProgramDayOut, ExerciseOut,
    ExerciseLibraryCreate, ExerciseLibraryOut
)
from ..utils.auth import get_current_user, require_admin, require_role

router = APIRouter(prefix="/api/programs", tags=["Programs"])


# ============================================================
# HELPER — ownership / lock checks
# ============================================================

def _is_coach_program(program: Program) -> bool:
    """A program is coach-owned when member_id is set AND coach_name is non-empty."""
    return bool(program.coach_name and program.coach_name.strip())


def _assert_member_can_edit_program(program: Program):
    """Raise 403 if the program was created by a coach (member read-only)."""
    if _is_coach_program(program):
        raise HTTPException(
            status_code=403,
            detail="This program was assigned by your coach and cannot be modified"
        )


def _get_program_for_week(week_id: int, db: Session) -> Program:
    week = db.query(ProgramWeek).filter(ProgramWeek.id == week_id).first()
    if not week:
        raise HTTPException(status_code=404, detail="Week not found")
    program = db.query(Program).filter(Program.id == week.program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    return program


def _get_program_for_day(day_id: int, db: Session) -> Program:
    day = db.query(ProgramDay).filter(ProgramDay.id == day_id).first()
    if not day:
        raise HTTPException(status_code=404, detail="Day not found")
    return _get_program_for_week(day.week_id, db)


def _get_program_for_exercise(exercise_id: int, db: Session) -> Program:
    ex = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    if not ex:
        raise HTTPException(status_code=404, detail="Exercise not found")
    return _get_program_for_day(ex.day_id, db)


# ============================================================
# ADMIN ENDPOINTS
# ============================================================

@router.get("/", response_model=List[ProgramOut])
def get_all_programs(
    member_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    """ADMIN: Get all programs, optionally filtered"""
    query = db.query(Program)
    if member_id:
        query = query.filter(Program.member_id == member_id)
    if is_active is not None:
        query = query.filter(Program.is_active == is_active)
    return query.order_by(Program.created_at.desc()).all()


@router.get("/coach", response_model=List[ProgramOut])
def get_coach_programs(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["coach", "admin"]))
):
    """COACH/ADMIN: Get programs for the current coach"""
    if current_user.role == "admin":
        programs = db.query(Program).order_by(Program.created_at.desc()).all()
    else:
        programs = db.query(Program).filter(
            Program.coach_name == current_user.name
        ).order_by(Program.created_at.desc()).all()
    return programs


@router.post("/coach", response_model=ProgramOut)
def create_coach_program(
    data: ProgramCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["coach", "admin"]))
):
    """COACH/ADMIN: Create a new program and assign to a client"""
    if data.client_id:
        client_member = db.query(Member).filter(Member.id == data.client_id).first()
        if not client_member:
            raise HTTPException(status_code=404, detail="Client not found")
        
        if current_user.role == "coach":
            coach_client = db.query(CoachClient).filter(
                CoachClient.coach_id == current_user.id,
                CoachClient.client_id == data.client_id,
                CoachClient.is_active == True
            ).first()
            if not coach_client:
                raise HTTPException(status_code=403, detail="This client is not assigned to you")

    program = Program(
        member_id=data.client_id,
        name=data.name,
        description=data.description,
        start_date=data.start_date,
        end_date=data.end_date,
        coach_name=current_user.name,   # always use authenticated coach's name
        is_active=True
    )
    db.add(program)
    db.commit()
    db.refresh(program)
    return program


@router.put("/coach/{program_id}", response_model=ProgramOut)
def update_coach_program(
    program_id: int,
    data: ProgramUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["coach", "admin"]))
):
    """COACH/ADMIN: Update a program"""
    program = db.query(Program).filter(Program.id == program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    
    if current_user.role == "coach" and program.coach_name != current_user.name:
        raise HTTPException(status_code=403, detail="You don't own this program")
    
    if data.name is not None:
        program.name = data.name
    if data.description is not None:
        program.description = data.description
    if data.start_date is not None:
        program.start_date = data.start_date
    if data.end_date is not None:
        program.end_date = data.end_date
    if data.coach_name is not None:
        program.coach_name = data.coach_name
    if data.is_active is not None:
        program.is_active = data.is_active

    # client_id can legitimately be sent as null (to unassign the program),
    # so we check whether the field was included in the request at all,
    # rather than just checking truthiness — otherwise "unassign" (null)
    # and "field not sent" are indistinguishable and unassign silently does nothing.
    payload = data.dict(exclude_unset=True)
    if "client_id" in payload:
        new_client_id = payload["client_id"]
        if new_client_id:
            client_member = db.query(Member).filter(Member.id == new_client_id).first()
            if not client_member:
                raise HTTPException(status_code=404, detail="Client not found")
            if current_user.role == "coach":
                coach_client = db.query(CoachClient).filter(
                    CoachClient.coach_id == current_user.id,
                    CoachClient.client_id == new_client_id,
                    CoachClient.is_active == True
                ).first()
                if not coach_client:
                    raise HTTPException(status_code=403, detail="This client is not assigned to you")
            program.member_id = new_client_id
        else:
            program.member_id = None

    db.commit()
    db.refresh(program)
    return program


@router.delete("/coach/{program_id}")
def delete_coach_program(
    program_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["coach", "admin"]))
):
    """COACH/ADMIN: Delete a program"""
    program = db.query(Program).filter(Program.id == program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    
    if current_user.role == "coach" and program.coach_name != current_user.name:
        raise HTTPException(status_code=403, detail="You don't own this program")
    
    db.delete(program)
    db.commit()
    return {"message": "Program deleted"}


# ============================================================
# EXERCISE LIBRARY
# ============================================================

@router.get("/exercises/library", response_model=List[ExerciseLibraryOut])
def get_exercise_library(
    category: Optional[str] = None,
    muscle_group: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get available exercises from the library"""
    query = db.query(ExerciseLibrary)
    if category and category != 'all':
        query = query.filter(ExerciseLibrary.category == category)
    if muscle_group and muscle_group != 'all':
        query = query.filter(ExerciseLibrary.muscle_groups.contains([muscle_group]))
    return query.order_by(ExerciseLibrary.name).all()


@router.post("/exercises/library", response_model=ExerciseLibraryOut)
def add_exercise_to_library(
    data: ExerciseLibraryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """ADMIN/COACH: Add a new exercise to the library"""
    if current_user.role not in ["admin", "coach"]:
        raise HTTPException(status_code=403, detail="Only coaches can add exercises")

    exercise = ExerciseLibrary(
        name=data.name,
        category=data.category,
        muscle_groups=data.muscle_groups or [],
        default_sets=data.default_sets,
        default_reps=data.default_reps,
        instructions=data.instructions
    )
    db.add(exercise)
    db.commit()
    db.refresh(exercise)
    return exercise


@router.delete("/exercises/library/{exercise_id}")
def delete_library_exercise(
    exercise_id: int,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    """ADMIN: Delete an exercise from the library"""
    exercise = db.query(ExerciseLibrary).filter(ExerciseLibrary.id == exercise_id).first()
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    db.delete(exercise)
    db.commit()
    return {"message": "Exercise deleted from library"}


# ============================================================
# MEMBER PROGRAM ENDPOINTS
# ============================================================

@router.get("/my", response_model=ProgramOut)
def get_my_program(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    MEMBER: Get current member's active program.
    Coach-assigned program takes priority over member's own program.
    """
    member = db.query(Member).filter(Member.user_id == current_user.id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    # Coach-assigned program takes priority
    coach_assignment = db.query(CoachClient).filter(
        CoachClient.client_id == member.id,
        CoachClient.is_active == True
    ).first()

    if coach_assignment:
        coach = db.query(User).filter(User.id == coach_assignment.coach_id).first()
        if coach:
            program = db.query(Program).filter(
                Program.member_id == member.id,
                Program.coach_name == coach.name,
                Program.is_active == True
            ).first()
            if program:
                return program

    # Fall back to member's own program
    program = db.query(Program).filter(
        Program.member_id == member.id,
        Program.is_active == True,
        Program.coach_name == ""
    ).first()

    if not program:
        raise HTTPException(status_code=404, detail="No active program found")

    return program


@router.post("/my", response_model=ProgramOut)
def create_my_program(
    data: ProgramCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """MEMBER: Create their own program"""
    member = db.query(Member).filter(Member.user_id == current_user.id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    # Deactivate any existing own active program
    existing = db.query(Program).filter(
        Program.member_id == member.id,
        Program.is_active == True,
        Program.coach_name == ""
    ).first()
    if existing:
        existing.is_active = False

    program = Program(
        member_id=member.id,
        name=data.name,
        description=data.description,
        start_date=data.start_date,
        end_date=data.end_date,
        coach_name="",   # member's own program always has empty coach_name
        is_active=True
    )
    db.add(program)
    db.commit()
    db.refresh(program)
    return program


@router.get("/my/progress")
def get_my_program_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """MEMBER: Get quick program progress stats"""
    member = db.query(Member).filter(Member.user_id == current_user.id).first()
    if not member:
        return {"has_program": False}

    program = db.query(Program).filter(
        Program.member_id == member.id,
        Program.is_active == True
    ).first()

    if not program:
        return {"has_program": False}

    total_exercises = 0
    completed_exercises = 0

    for week in program.weeks:
        for day in week.days:
            for exercise in day.exercises:
                total_exercises += 1
                if exercise.done:
                    completed_exercises += 1

    progress = 0
    if total_exercises > 0:
        progress = round((completed_exercises / total_exercises) * 100)

    current_week = 0
    for week in program.weeks:
        if week.week_number > current_week:
            current_week = week.week_number

    return {
        "has_program": True,
        "program_name": program.name,
        "is_coach_program": _is_coach_program(program),
        "total_exercises": total_exercises,
        "completed_exercises": completed_exercises,
        "progress": progress,
        "total_weeks": len(program.weeks),
        "current_week": current_week
    }


@router.get("/my/{program_id}", response_model=ProgramOut)
def get_my_program_by_id(
    program_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """MEMBER: Get a specific program the member has access to."""
    member = db.query(Member).filter(Member.user_id == current_user.id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    program = db.query(Program).filter(
        Program.id == program_id,
        Program.member_id == member.id
    ).first()

    if not program:
        raise HTTPException(status_code=404, detail="Program not found")

    return program


@router.get("/coach/available")
def get_available_programs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """MEMBER: Get all programs available to the member."""
    member = db.query(Member).filter(Member.user_id == current_user.id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    programs = db.query(Program).filter(
        Program.member_id == member.id
    ).order_by(Program.created_at.desc()).all()

    return programs


@router.get("/has-coach")
def has_coach(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """MEMBER: Check if the member has an assigned coach"""
    member = db.query(Member).filter(Member.user_id == current_user.id).first()
    if not member:
        return {"has_coach": False}

    coach_assignment = db.query(CoachClient).filter(
        CoachClient.client_id == member.id,
        CoachClient.is_active == True
    ).first()

    # Also check if the coach has assigned a program
    has_program = False
    if coach_assignment:
        coach = db.query(User).filter(User.id == coach_assignment.coach_id).first()
        if coach:
            has_program = db.query(Program).filter(
                Program.member_id == member.id,
                Program.coach_name == coach.name,
                Program.is_active == True
            ).count() > 0

    return {
        "has_coach": coach_assignment is not None,
        "has_coach_program": has_program,
        "coach_id": coach_assignment.coach_id if coach_assignment else None
    }


@router.post("/", response_model=ProgramOut)
def create_program(
    data: ProgramCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """MEMBER: Create a new program (legacy endpoint)"""
    member = db.query(Member).filter(Member.user_id == current_user.id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    existing = db.query(Program).filter(
        Program.member_id == member.id,
        Program.is_active == True,
        Program.coach_name == ""
    ).first()
    if existing:
        existing.is_active = False

    program = Program(
        member_id=member.id,
        name=data.name,
        description=data.description,
        start_date=data.start_date,
        end_date=data.end_date,
        coach_name="",
        is_active=True
    )
    db.add(program)
    db.commit()
    db.refresh(program)
    return program


# ============================================================
# WEEKS
# ============================================================

@router.post("/weeks", response_model=ProgramWeekOut)
def create_week(
    data: ProgramWeekCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new week — blocked for coach programs"""
    program = db.query(Program).filter(Program.id == data.program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")

    # Only coach/admin can add weeks to coach programs
    if _is_coach_program(program):
        if current_user.role not in ["coach", "admin"]:
            raise HTTPException(status_code=403, detail="Coach programs can only be modified by a coach")
        if current_user.role == "coach" and program.coach_name != current_user.name:
            raise HTTPException(status_code=403, detail="You don't own this program")

    existing = db.query(ProgramWeek).filter(
        ProgramWeek.program_id == data.program_id,
        ProgramWeek.week_number == data.week_number
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Week {data.week_number} already exists")

    week = ProgramWeek(
        program_id=data.program_id,
        week_number=data.week_number,
        focus=data.focus or f"Week {data.week_number}"
    )
    db.add(week)
    db.commit()
    db.refresh(week)
    return week


@router.put("/weeks/{week_id}", response_model=ProgramWeekOut)
def update_week(
    week_id: int,
    data: ProgramWeekUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a week — blocked for coach programs"""
    week = db.query(ProgramWeek).filter(ProgramWeek.id == week_id).first()
    if not week:
        raise HTTPException(status_code=404, detail="Week not found")

    program = db.query(Program).filter(Program.id == week.program_id).first()
    if _is_coach_program(program):
        if current_user.role not in ["coach", "admin"]:
            raise HTTPException(status_code=403, detail="Coach programs can only be modified by a coach")

    if data.focus is not None:
        week.focus = data.focus

    db.commit()
    db.refresh(week)
    return week


@router.delete("/weeks/{week_id}")
def delete_week(
    week_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a week — blocked for coach programs"""
    week = db.query(ProgramWeek).filter(ProgramWeek.id == week_id).first()
    if not week:
        raise HTTPException(status_code=404, detail="Week not found")

    program = db.query(Program).filter(Program.id == week.program_id).first()
    if _is_coach_program(program):
        if current_user.role not in ["coach", "admin"]:
            raise HTTPException(status_code=403, detail="Coach programs can only be modified by a coach")

    db.delete(week)
    db.commit()
    return {"message": "Week deleted"}


# ============================================================
# DAYS
# ============================================================

@router.post("/days", response_model=ProgramDayOut)
def create_day(
    data: ProgramDayCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new day — blocked for coach programs"""
    week = db.query(ProgramWeek).filter(ProgramWeek.id == data.week_id).first()
    if not week:
        raise HTTPException(status_code=404, detail="Week not found")

    program = db.query(Program).filter(Program.id == week.program_id).first()
    if _is_coach_program(program):
        if current_user.role not in ["coach", "admin"]:
            raise HTTPException(status_code=403, detail="Coach programs can only be modified by a coach")

    existing = db.query(ProgramDay).filter(
        ProgramDay.week_id == data.week_id,
        ProgramDay.day_of_week == data.day_of_week
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"{data.day_of_week} already exists in this week")

    day = ProgramDay(
        week_id=data.week_id,
        day_of_week=data.day_of_week,
        is_rest_day=data.is_rest_day or False
    )
    db.add(day)
    db.commit()
    db.refresh(day)
    return day


@router.put("/days/{day_id}/rest", response_model=ProgramDayOut)
def toggle_rest_day(
    day_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Toggle rest day — blocked for coach programs"""
    day = db.query(ProgramDay).filter(ProgramDay.id == day_id).first()
    if not day:
        raise HTTPException(status_code=404, detail="Day not found")

    program = _get_program_for_week(day.week_id, db)
    if _is_coach_program(program):
        if current_user.role not in ["coach", "admin"]:
            raise HTTPException(status_code=403, detail="Coach programs can only be modified by a coach")

    day.is_rest_day = not day.is_rest_day
    if day.is_rest_day:
        for exercise in day.exercises:
            db.delete(exercise)

    db.commit()
    db.refresh(day)
    return day


@router.delete("/days/{day_id}")
def delete_day(
    day_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a day — blocked for coach programs"""
    day = db.query(ProgramDay).filter(ProgramDay.id == day_id).first()
    if not day:
        raise HTTPException(status_code=404, detail="Day not found")

    program = _get_program_for_week(day.week_id, db)
    if _is_coach_program(program):
        if current_user.role not in ["coach", "admin"]:
            raise HTTPException(status_code=403, detail="Coach programs can only be modified by a coach")

    db.delete(day)
    db.commit()
    return {"message": "Day deleted"}


# ============================================================
# EXERCISES
# ============================================================

@router.post("/exercises", response_model=ExerciseOut)
def create_exercise(
    data: ExerciseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add an exercise — blocked for coach programs"""
    day = db.query(ProgramDay).filter(ProgramDay.id == data.day_id).first()
    if not day:
        raise HTTPException(status_code=404, detail="Day not found")

    if day.is_rest_day:
        raise HTTPException(status_code=400, detail="Cannot add exercises to a rest day")

    program = _get_program_for_week(day.week_id, db)
    if _is_coach_program(program):
        if current_user.role not in ["coach", "admin"]:
            raise HTTPException(status_code=403, detail="Coach programs can only be modified by a coach")

    exercise = Exercise(
        day_id=data.day_id,
        name=data.name,
        sets=data.sets,
        reps=data.reps,
        weight=data.weight,
        duration=data.duration,
        targets=data.targets or [],
        notes=data.notes,
        is_custom=data.is_custom or False
    )
    db.add(exercise)
    db.commit()
    db.refresh(exercise)
    return exercise


@router.put("/exercises/{exercise_id}/toggle")
def toggle_exercise(
    exercise_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Toggle exercise done status.
    ✅ Always allowed — member can check off exercises on coach programs.
    """
    exercise = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")

    # Verify the member actually has access to this exercise
    program = _get_program_for_exercise(exercise_id, db)
    member = db.query(Member).filter(Member.user_id == current_user.id).first()
    if member and program.member_id != member.id:
        if current_user.role not in ["coach", "admin"]:
            raise HTTPException(status_code=403, detail="Access denied")

    exercise.done = not exercise.done
    db.commit()

    return {
        "success": True,
        "exercise_id": exercise.id,
        "done": exercise.done,
        "message": "Exercise completed!" if exercise.done else "Exercise unmarked"
    }


@router.put("/exercises/{exercise_id}", response_model=ExerciseOut)
def update_exercise(
    exercise_id: int,
    data: ExerciseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an exercise — blocked for coach programs"""
    exercise = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")

    program = _get_program_for_exercise(exercise_id, db)
    if _is_coach_program(program):
        if current_user.role not in ["coach", "admin"]:
            raise HTTPException(status_code=403, detail="Coach programs can only be modified by a coach")

    if data.name is not None:
        exercise.name = data.name
    if data.sets is not None:
        exercise.sets = data.sets
    if data.reps is not None:
        exercise.reps = data.reps
    if data.weight is not None:
        exercise.weight = data.weight
    if data.duration is not None:
        exercise.duration = data.duration
    if data.targets is not None:
        exercise.targets = data.targets
    if data.notes is not None:
        exercise.notes = data.notes
    if data.is_custom is not None:
        exercise.is_custom = data.is_custom

    db.commit()
    db.refresh(exercise)
    return exercise


@router.delete("/exercises/{exercise_id}")
def delete_exercise(
    exercise_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an exercise — blocked for coach programs"""
    exercise = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")

    program = _get_program_for_exercise(exercise_id, db)
    if _is_coach_program(program):
        if current_user.role not in ["coach", "admin"]:
            raise HTTPException(status_code=403, detail="Coach programs can only be modified by a coach")

    db.delete(exercise)
    db.commit()
    return {"message": "Exercise deleted"}


# ============================================================
# ADMIN PARAMETERIZED ENDPOINTS (MUST BE LAST)
# ============================================================

@router.get("/{program_id}", response_model=ProgramOut)
def get_program(
    program_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["coach", "admin"]))
):
    """COACH/ADMIN: Get a specific program with full detail"""
    program = db.query(Program).filter(Program.id == program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")

    if current_user.role == "coach" and program.coach_name != current_user.name:
        raise HTTPException(status_code=403, detail="You don't own this program")

    return program


@router.put("/{program_id}", response_model=ProgramOut)
def update_program(
    program_id: int,
    data: ProgramUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """MEMBER: Update own program metadata — blocked for coach programs"""
    program = db.query(Program).filter(Program.id == program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")

    _assert_member_can_edit_program(program)

    if data.name is not None:
        program.name = data.name
    if data.description is not None:
        program.description = data.description
    if data.start_date is not None:
        program.start_date = data.start_date
    if data.end_date is not None:
        program.end_date = data.end_date
    if data.is_active is not None:
        program.is_active = data.is_active

    db.commit()
    db.refresh(program)
    return program


@router.delete("/{program_id}")
def delete_program(
    program_id: int,
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    """ADMIN: Delete a program"""
    program = db.query(Program).filter(Program.id == program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")

    db.delete(program)
    db.commit()
    return {"message": "Program deleted"}