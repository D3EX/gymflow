# backend/seed_exercises.py
import sys
import os

# Add the current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models.models import ExerciseLibrary

def seed_exercises():
    db = SessionLocal()
    
    exercises = [
        # ─── CARDIO EXERCISES ──────────────────────────────────────────
        {
            "name": "Battle Ropes",
            "category": "cardio",
            "muscle_groups": ["shoulders", "biceps", "triceps", "core"],
            "default_sets": "3",
            "default_reps": "30s",
            "instructions": "Alternate waves with ropes for 30 second intervals"
        },
        {
            "name": "Rowing Machine",
            "category": "cardio",
            "muscle_groups": ["back", "legs", "core"],
            "default_sets": "1",
            "default_reps": "15 min",
            "instructions": "Drive through legs, pull with back"
        },
        {
            "name": "Stationary Bike",
            "category": "cardio",
            "muscle_groups": ["legs"],
            "default_sets": "1",
            "default_reps": "20 min",
            "instructions": "Maintain steady cadence, adjust resistance"
        },
        {
            "name": "Treadmill Run",
            "category": "cardio",
            "muscle_groups": ["legs"],
            "default_sets": "1",
            "default_reps": "30 min",
            "instructions": "Maintain consistent pace, use incline"
        },
        {
            "name": "Burpees",
            "category": "cardio",
            "muscle_groups": ["chest", "shoulders", "legs", "core"],
            "default_sets": "3",
            "default_reps": "10",
            "instructions": "Jump up, drop to push-up, jump back up"
        },
        {
            "name": "Jump Rope",
            "category": "cardio",
            "muscle_groups": ["legs", "core"],
            "default_sets": "3",
            "default_reps": "60s",
            "instructions": "Keep light on feet, turn rope with wrists"
        },
        {
            "name": "Stair Climber",
            "category": "cardio",
            "muscle_groups": ["legs", "glutes"],
            "default_sets": "1",
            "default_reps": "20 min",
            "instructions": "Maintain steady pace, don't hold rails"
        },

        # ─── STRENGTH - CHEST ──────────────────────────────────────────
        {
            "name": "Bench Press",
            "category": "strength",
            "muscle_groups": ["chest", "shoulders", "triceps"],
            "default_sets": "4",
            "default_reps": "10",
            "instructions": "Keep feet planted, drive through heels"
        },
        {
            "name": "Incline Bench Press",
            "category": "strength",
            "muscle_groups": ["chest", "shoulders", "triceps"],
            "default_sets": "3",
            "default_reps": "10",
            "instructions": "Set bench to 30-45 degrees"
        },
        {
            "name": "Decline Bench Press",
            "category": "strength",
            "muscle_groups": ["chest", "shoulders", "triceps"],
            "default_sets": "3",
            "default_reps": "10",
            "instructions": "Set bench to decline position"
        },
        {
            "name": "Dumbbell Press",
            "category": "strength",
            "muscle_groups": ["chest", "shoulders", "triceps"],
            "default_sets": "3",
            "default_reps": "10",
            "instructions": "Control the descent, squeeze chest at top"
        },
        {
            "name": "Cable Flyes",
            "category": "strength",
            "muscle_groups": ["chest", "shoulders"],
            "default_sets": "3",
            "default_reps": "12",
            "instructions": "Keep slight bend in elbows, squeeze chest"
        },
        {
            "name": "Dumbbell Flyes",
            "category": "strength",
            "muscle_groups": ["chest"],
            "default_sets": "3",
            "default_reps": "12",
            "instructions": "Slight bend in elbows, open arms wide"
        },
        {
            "name": "Push-ups",
            "category": "strength",
            "muscle_groups": ["chest", "shoulders", "triceps", "core"],
            "default_sets": "3",
            "default_reps": "15",
            "instructions": "Keep body straight, lower to 90 degrees"
        },
        {
            "name": "Dips",
            "category": "strength",
            "muscle_groups": ["chest", "shoulders", "triceps"],
            "default_sets": "3",
            "default_reps": "10",
            "instructions": "Keep body straight, lower to 90 degrees"
        },

        # ─── STRENGTH - SHOULDERS ──────────────────────────────────────
        {
            "name": "Shoulder Press",
            "category": "strength",
            "muscle_groups": ["shoulders"],
            "default_sets": "3",
            "default_reps": "10",
            "instructions": "Keep core tight, don't arch back"
        },
        {
            "name": "Lateral Raises",
            "category": "strength",
            "muscle_groups": ["shoulders"],
            "default_sets": "3",
            "default_reps": "15",
            "instructions": "Don't swing, use controlled movement"
        },
        {
            "name": "Front Raises",
            "category": "strength",
            "muscle_groups": ["shoulders"],
            "default_sets": "3",
            "default_reps": "12",
            "instructions": "Keep arms straight, raise to shoulder height"
        },
        {
            "name": "Face Pulls",
            "category": "strength",
            "muscle_groups": ["shoulders", "back"],
            "default_sets": "3",
            "default_reps": "15",
            "instructions": "Pull towards face, squeeze shoulder blades"
        },
        {
            "name": "Arnold Press",
            "category": "strength",
            "muscle_groups": ["shoulders"],
            "default_sets": "3",
            "default_reps": "10",
            "instructions": "Rotate palms outward as you press"
        },
        {
            "name": "Rear Delt Flyes",
            "category": "strength",
            "muscle_groups": ["shoulders", "back"],
            "default_sets": "3",
            "default_reps": "15",
            "instructions": "Bend forward, raise arms to sides"
        },
        {
            "name": "Upright Rows",
            "category": "strength",
            "muscle_groups": ["shoulders"],
            "default_sets": "3",
            "default_reps": "12",
            "instructions": "Pull bar to chin, keep close to body"
        },
        {
            "name": "Shrugs",
            "category": "strength",
            "muscle_groups": ["shoulders"],
            "default_sets": "3",
            "default_reps": "15",
            "instructions": "Shrug shoulders up, hold at top"
        },

        # ─── STRENGTH - BACK ───────────────────────────────────────────
        {
            "name": "Deadlifts",
            "category": "strength",
            "muscle_groups": ["back", "legs", "glutes"],
            "default_sets": "3",
            "default_reps": "8",
            "instructions": "Keep back straight, hinge at hips"
        },
        {
            "name": "Pull-ups",
            "category": "strength",
            "muscle_groups": ["back", "biceps"],
            "default_sets": "3",
            "default_reps": "8",
            "instructions": "Use full range of motion, don't kip"
        },
        {
            "name": "Lat Pulldowns",
            "category": "strength",
            "muscle_groups": ["back", "biceps"],
            "default_sets": "3",
            "default_reps": "12",
            "instructions": "Pull down to chest, squeeze lats"
        },
        {
            "name": "Bent Over Rows",
            "category": "strength",
            "muscle_groups": ["back", "biceps"],
            "default_sets": "3",
            "default_reps": "10",
            "instructions": "Keep back straight, pull to lower chest"
        },
        {
            "name": "Seated Cable Rows",
            "category": "strength",
            "muscle_groups": ["back", "core"],
            "default_sets": "3",
            "default_reps": "12",
            "instructions": "Drive elbows back, squeeze shoulder blades"
        },
        {
            "name": "T-Bar Rows",
            "category": "strength",
            "muscle_groups": ["back", "biceps"],
            "default_sets": "3",
            "default_reps": "10",
            "instructions": "Keep back flat, pull to chest"
        },
        {
            "name": "Good Mornings",
            "category": "strength",
            "muscle_groups": ["back", "glutes", "core"],
            "default_sets": "3",
            "default_reps": "12",
            "instructions": "Hinge at hips, keep back straight"
        },
        {
            "name": "Back Extensions",
            "category": "strength",
            "muscle_groups": ["back", "glutes"],
            "default_sets": "3",
            "default_reps": "15",
            "instructions": "Extend up, squeeze glutes at top"
        },

        # ─── STRENGTH - BICEPS ─────────────────────────────────────────
        {
            "name": "Dumbbell Curls",
            "category": "strength",
            "muscle_groups": ["biceps"],
            "default_sets": "3",
            "default_reps": "12",
            "instructions": "Keep elbows fixed, don't swing"
        },
        {
            "name": "Barbell Curls",
            "category": "strength",
            "muscle_groups": ["biceps"],
            "default_sets": "3",
            "default_reps": "12",
            "instructions": "Keep elbows pinned to sides"
        },
        {
            "name": "Hammer Curls",
            "category": "strength",
            "muscle_groups": ["biceps"],
            "default_sets": "3",
            "default_reps": "12",
            "instructions": "Palms facing each other"
        },
        {
            "name": "Preacher Curls",
            "category": "strength",
            "muscle_groups": ["biceps"],
            "default_sets": "3",
            "default_reps": "12",
            "instructions": "Use preacher bench, full contraction"
        },
        {
            "name": "Concentration Curls",
            "category": "strength",
            "muscle_groups": ["biceps"],
            "default_sets": "3",
            "default_reps": "12",
            "instructions": "Rest arm on thigh, curl up"
        },
        {
            "name": "Cable Curls",
            "category": "strength",
            "muscle_groups": ["biceps"],
            "default_sets": "3",
            "default_reps": "12",
            "instructions": "Keep constant tension on muscle"
        },

        # ─── STRENGTH - TRICEPS ────────────────────────────────────────
        {
            "name": "Tricep Pushdowns",
            "category": "strength",
            "muscle_groups": ["triceps"],
            "default_sets": "3",
            "default_reps": "12",
            "instructions": "Keep elbows pinned to sides"
        },
        {
            "name": "Skull Crushers",
            "category": "strength",
            "muscle_groups": ["triceps"],
            "default_sets": "3",
            "default_reps": "12",
            "instructions": "Lower bar to forehead, extend arms"
        },
        {
            "name": "Tricep Dips",
            "category": "strength",
            "muscle_groups": ["triceps"],
            "default_sets": "3",
            "default_reps": "12",
            "instructions": "Use parallel bars or bench, keep close to body"
        },
        {
            "name": "Overhead Tricep Extensions",
            "category": "strength",
            "muscle_groups": ["triceps"],
            "default_sets": "3",
            "default_reps": "12",
            "instructions": "Dumbbell behind head, extend up"
        },
        {
            "name": "Close Grip Bench Press",
            "category": "strength",
            "muscle_groups": ["triceps", "chest"],
            "default_sets": "3",
            "default_reps": "10",
            "instructions": "Hands shoulder width apart, focus on triceps"
        },

        # ─── STRENGTH - CORE ───────────────────────────────────────────
        {
            "name": "Planks",
            "category": "strength",
            "muscle_groups": ["core"],
            "default_sets": "3",
            "default_reps": "60s",
            "instructions": "Keep body in straight line, engage core"
        },
        {
            "name": "Russian Twists",
            "category": "strength",
            "muscle_groups": ["core"],
            "default_sets": "3",
            "default_reps": "15",
            "instructions": "Keep core tight, rotate smoothly"
        },
        {
            "name": "Cable Crunches",
            "category": "strength",
            "muscle_groups": ["core"],
            "default_sets": "3",
            "default_reps": "15",
            "instructions": "Crunch down, squeeze abs"
        },
        {
            "name": "Hanging Leg Raises",
            "category": "strength",
            "muscle_groups": ["core"],
            "default_sets": "3",
            "default_reps": "12",
            "instructions": "Hang from bar, raise legs to parallel"
        },
        {
            "name": "Ab Wheel Rollouts",
            "category": "strength",
            "muscle_groups": ["core"],
            "default_sets": "3",
            "default_reps": "10",
            "instructions": "Roll out as far as possible, keep core tight"
        },
        {
            "name": "Sit-ups",
            "category": "strength",
            "muscle_groups": ["core"],
            "default_sets": "3",
            "default_reps": "20",
            "instructions": "Keep feet anchored, come up to 90 degrees"
        },
        {
            "name": "Bicycle Crunches",
            "category": "strength",
            "muscle_groups": ["core"],
            "default_sets": "3",
            "default_reps": "15",
            "instructions": "Alternate elbows to opposite knees"
        },
        {
            "name": "Dead Bug",
            "category": "strength",
            "muscle_groups": ["core"],
            "default_sets": "3",
            "default_reps": "10",
            "instructions": "Opposite arm and leg extend, keep back flat"
        },

        # ─── STRENGTH - LEGS ───────────────────────────────────────────
        {
            "name": "Squats",
            "category": "strength",
            "muscle_groups": ["legs", "glutes"],
            "default_sets": "4",
            "default_reps": "12",
            "instructions": "Keep chest up, go to parallel"
        },
        {
            "name": "Lunges",
            "category": "strength",
            "muscle_groups": ["legs", "glutes"],
            "default_sets": "3",
            "default_reps": "12",
            "instructions": "Keep front knee behind toes"
        },
        {
            "name": "Leg Press",
            "category": "strength",
            "muscle_groups": ["legs", "glutes"],
            "default_sets": "3",
            "default_reps": "12",
            "instructions": "Keep lower back flat, don't lock knees"
        },
        {
            "name": "Leg Curls",
            "category": "strength",
            "muscle_groups": ["legs"],
            "default_sets": "3",
            "default_reps": "15",
            "instructions": "Focus on hamstring contraction"
        },
        {
            "name": "Leg Extensions",
            "category": "strength",
            "muscle_groups": ["legs"],
            "default_sets": "3",
            "default_reps": "15",
            "instructions": "Full extension, pause at top"
        },
        {
            "name": "Bulgarian Split Squats",
            "category": "strength",
            "muscle_groups": ["legs", "glutes"],
            "default_sets": "3",
            "default_reps": "10",
            "instructions": "Rear foot elevated, lunge down"
        },
        {
            "name": "Step-ups",
            "category": "strength",
            "muscle_groups": ["legs", "glutes"],
            "default_sets": "3",
            "default_reps": "12",
            "instructions": "Step onto platform, drive through heel"
        },
        {
            "name": "Calf Raises",
            "category": "strength",
            "muscle_groups": ["legs"],
            "default_sets": "3",
            "default_reps": "20",
            "instructions": "Push through balls of feet, squeeze at top"
        },

        # ─── STRENGTH - GLUTES ─────────────────────────────────────────
        {
            "name": "Glute Bridges",
            "category": "strength",
            "muscle_groups": ["glutes", "core"],
            "default_sets": "3",
            "default_reps": "15",
            "instructions": "Push through heels, squeeze glutes at top"
        },
        {
            "name": "Hip Thrusts",
            "category": "strength",
            "muscle_groups": ["glutes", "core"],
            "default_sets": "3",
            "default_reps": "12",
            "instructions": "Barbell on hips, thrust up"
        },
        {
            "name": "Kettlebell Swings",
            "category": "strength",
            "muscle_groups": ["back", "legs", "glutes", "core"],
            "default_sets": "3",
            "default_reps": "15",
            "instructions": "Hinge at hips, drive through glutes"
        },
        {
            "name": "Donkey Kicks",
            "category": "strength",
            "muscle_groups": ["glutes"],
            "default_sets": "3",
            "default_reps": "15",
            "instructions": "On all fours, kick leg up squeezing glutes"
        },
        {
            "name": "Clamshells",
            "category": "strength",
            "muscle_groups": ["glutes"],
            "default_sets": "3",
            "default_reps": "15",
            "instructions": "On side, open knees like a clam"
        },
        {
            "name": "Side Lunges",
            "category": "strength",
            "muscle_groups": ["legs", "glutes"],
            "default_sets": "3",
            "default_reps": "12",
            "instructions": "Step to side, keep chest up"
        },

        # ─── COMPOUND EXERCISES ────────────────────────────────────────
        {
            "name": "Clean and Press",
            "category": "strength",
            "muscle_groups": ["shoulders", "legs", "core", "back"],
            "default_sets": "3",
            "default_reps": "8",
            "instructions": "Explosive movement, catch in rack position"
        },
        {
            "name": "Thrusters",
            "category": "strength",
            "muscle_groups": ["shoulders", "legs", "core"],
            "default_sets": "3",
            "default_reps": "10",
            "instructions": "Squat then press overhead in one fluid movement"
        },
        {
            "name": "Barbell Squats",
            "category": "strength",
            "muscle_groups": ["legs", "glutes", "core"],
            "default_sets": "4",
            "default_reps": "8",
            "instructions": "Bar on upper back, chest up"
        },
        {
            "name": "Snatch",
            "category": "strength",
            "muscle_groups": ["shoulders", "legs", "back", "core"],
            "default_sets": "3",
            "default_reps": "5",
            "instructions": "Explosive lift from floor to overhead"
        },
        {
            "name": "Turkish Get-up",
            "category": "strength",
            "muscle_groups": ["shoulders", "core", "legs", "glutes"],
            "default_sets": "3",
            "default_reps": "1",
            "instructions": "Start lying down, get to standing with weight overhead"
        },
        {
            "name": "Farmer's Walk",
            "category": "strength",
            "muscle_groups": ["core", "legs", "glutes", "shoulders"],
            "default_sets": "3",
            "default_reps": "30s",
            "instructions": "Walk with heavy weights in each hand, keep shoulders back"
        },
    ]

    added = 0
    skipped = 0
    
    for ex in exercises:
        existing = db.query(ExerciseLibrary).filter(ExerciseLibrary.name == ex["name"]).first()
        if not existing:
            db.add(ExerciseLibrary(**ex))
            added += 1
            print(f"✅ Added: {ex['name']}")
        else:
            skipped += 1
            print(f"⏭️  Skipped: {ex['name']} (already exists)")

    db.commit()
    db.close()
    
    print(f"\n{'='*50}")
    print(f"📊 SUMMARY:")
    print(f"  ✅ Added: {added} exercises")
    print(f"  ⏭️  Skipped: {skipped} exercises")
    print(f"{'='*50}")

if __name__ == "__main__":
    print("🏋️  Seeding Exercise Library...\n")
    seed_exercises()
    print("\n✅ Done!")