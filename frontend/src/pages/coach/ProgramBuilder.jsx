// frontend/src/pages/coach/ProgramBuilder.jsx
import { useState, useEffect, useCallback } from 'react'
import {
  Dumbbell, Plus, ArrowLeft, Loader2, Edit2, Users,
  Save, X, Activity, Layers, Trash2, Check, Calendar, MoreVertical
} from 'lucide-react'
import api from '../../api/client'
import toast from 'react-hot-toast'
import {
  LoadingSpinner,
  WeekCard,
  AddExerciseModal,
  ExerciseItem
} from './components'

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function ProgramBuilder({ program: initialProgram, clients, onBack, onRefreshList }) {
  const [program, setProgram] = useState(initialProgram)
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false)

  const [openWeeks, setOpenWeeks] = useState({})
  const [selectedDayId, setSelectedDayId] = useState(null)

  const [addingWeek, setAddingWeek] = useState(false)
  const [weekFocus, setWeekFocus] = useState('')
  const [savingWeek, setSavingWeek] = useState(false)

  const [addingDayWeekId, setAddingDayWeekId] = useState(null)
  const [selectedDayName, setSelectedDayName] = useState('')
  const [savingDay, setSavingDay] = useState(false)

  const [savingEx, setSavingEx] = useState(false)
  const [togglingExercise, setTogglingExercise] = useState(null)

  const [editingMeta, setEditingMeta] = useState(false)
  const [meta, setMeta] = useState({ 
    name: program.name, 
    description: program.description || '', 
    client_id: program.member_id || '' 
  })
  const [savingMeta, setSavingMeta] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const res = await api.get(`/programs/${program.id}`)
      setProgram(res.data)
    } catch {
      try {
        const res = await api.get('/programs/coach')
        const found = res.data.find(p => p.id === program.id)
        if (found) setProgram(found)
      } catch {}
    }
  }, [program.id])

  useEffect(() => { refresh() }, [])

  useEffect(() => {
    if (!selectedDayId && program.weeks?.length) {
      const firstWeek = program.weeks[0]
      if (firstWeek?.days?.length) {
        setSelectedDayId(firstWeek.days[0].id)
        setOpenWeeks({ [firstWeek.id]: true })
      }
    }
  }, [program.weeks])

  const selectedDay = program.weeks?.flatMap(w => w.days || []).find(d => d.id === selectedDayId)
  const selectedWeek = program.weeks?.find(w => w.days?.some(d => d.id === selectedDayId))

  const toggleWeek = (id) => setOpenWeeks(p => ({ ...p, [id]: !p[id] }))

  const addWeek = async () => {
    const n = (program.weeks?.length || 0) + 1
    setSavingWeek(true)
    try {
      const res = await api.post('/programs/weeks', { program_id: program.id, week_number: n, focus: weekFocus || null })
      toast.success(`Week ${n} added`)
      setAddingWeek(false); setWeekFocus('')
      await refresh()
      setOpenWeeks(p => ({ ...p, [res.data.id]: true }))
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed') }
    finally { setSavingWeek(false) }
  }

  const deleteWeek = async (id, e) => {
    e.stopPropagation()
    if (!confirm('Remove this week and all its content?')) return
    try {
      await api.delete(`/programs/weeks/${id}`)
      toast.success('Week removed')
      if (selectedWeek?.id === id) setSelectedDayId(null)
      refresh()
    } catch { toast.error('Failed') }
  }

  const addDay = async (weekId) => {
    if (!selectedDayName) return
    setSavingDay(true)
    try {
      const res = await api.post('/programs/days', { week_id: weekId, day_of_week: selectedDayName, is_rest_day: false })
      toast.success(`${selectedDayName} added`)
      setAddingDayWeekId(null); setSelectedDayName('')
      await refresh()
      setSelectedDayId(res.data.id)
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed') }
    finally { setSavingDay(false) }
  }

  const deleteDay = async (id) => {
    if (!confirm('Remove this day and all exercises?')) return
    try {
      await api.delete(`/programs/days/${id}`)
      toast.success('Day removed')
      if (selectedDayId === id) setSelectedDayId(null)
      refresh()
    } catch { toast.error('Failed') }
  }

  const toggleRest = async () => {
    if (!selectedDay) return
    try { await api.put(`/programs/days/${selectedDay.id}/rest`); refresh() }
    catch (err) { toast.error(err.response?.data?.detail || 'Failed') }
  }

  const addExercise = async (data) => {
    if (!data.name.trim()) return
    setSavingEx(true)
    try {
      await api.post('/programs/exercises', {
        day_id: selectedDay.id,
        name: data.name.trim(),
        sets: data.sets || null, reps: data.reps || null,
        weight: data.weight || null, duration: data.duration || null,
        targets: data.targets || [], notes: data.notes || null,
        is_custom: data.is_custom || false,
      })
      toast.success('Exercise added')
      setShowAddExerciseModal(false)
      refresh()
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed') }
    finally { setSavingEx(false) }
  }

  const editExercise = async (id, data) => {
    try {
      await api.put(`/programs/exercises/${id}`, {
        name: data.name.trim(), sets: data.sets || null, reps: data.reps || null,
        weight: data.weight || null, duration: data.duration || null,
        targets: data.targets || [], notes: data.notes || null, is_custom: data.is_custom,
      })
      toast.success('Exercise updated'); refresh()
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed') }
  }

  const deleteExercise = async (id) => {
    if (!confirm('Remove exercise?')) return
    try { await api.delete(`/programs/exercises/${id}`); toast.success('Removed'); refresh() }
    catch (err) { toast.error(err.response?.data?.detail || 'Failed') }
  }

  const toggleExercise = async (id) => {
    setTogglingExercise(id)
    try {
      await api.put(`/programs/exercises/${id}/toggle`)
      await refresh()
    } catch (err) { 
      toast.error(err.response?.data?.detail || 'Failed to toggle exercise') 
    } finally { 
      setTogglingExercise(null) 
    }
  }

  const saveMeta = async () => {
    setSavingMeta(true)
    try {
      await api.put(`/programs/coach/${program.id}`, {
        name: meta.name, description: meta.description,
        client_id: meta.client_id ? parseInt(meta.client_id) : null,
      })
      toast.success('Program updated')
      setEditingMeta(false); refresh(); onRefreshList()
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed') }
    finally { setSavingMeta(false) }
  }

  const totalEx = program.weeks?.reduce((s, w) => s + (w.days?.reduce((s2, d) => s2 + (d.exercises?.length || 0), 0) || 0), 0) || 0
  const doneEx = program.weeks?.reduce((s, w) => s + (w.days?.reduce((s2, d) => s2 + (d.exercises?.filter(e => e.done)?.length || 0), 0) || 0), 0) || 0
  const totalDays = program.weeks?.reduce((s, w) => s + (w.days?.length || 0), 0) || 0
  const clientName = clients.find(c => c.id === program.member_id)?.user?.name || (program.member_id ? `Client #${program.member_id}` : 'Unassigned')
  const exCount = selectedDay?.exercises?.length || 0
  const doneCount = selectedDay?.exercises?.filter(e => e.done)?.length || 0

  const displayedExercises = selectedDay?.exercises || []

  const CARD_HEIGHT = 'calc(100vh - 380px)'
  const CARD_MIN_HEIGHT = '485px'

  return (
    <div style={{
      background: 'var(--bg)',
      color: 'var(--text)',
      fontFamily: "'Inter', -apple-system, sans-serif",
      padding: '0',
      minHeight: '100vh',
      boxSizing: 'border-box',
    }}>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb:hover { background: var(--text-3); }
        .form-input {
          width: 100%;
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: var(--surface-2);
          color: var(--text);
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
          font-family: inherit;
        }
        .form-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent)22;
        }
        .form-input::placeholder {
          color: var(--text-3);
        }
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 10px;
          border-radius: 99px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.03em;
        }
        .badge-active {
          background: rgba(34, 217, 138, 0.12);
          color: var(--green);
          border: 1px solid rgba(34, 217, 138, 0.28);
        }
        .badge-inactive {
          background: var(--surface-2);
          color: var(--text-3);
          border: 1px solid var(--border);
        }
        .badge-rest {
          background: rgba(77, 158, 245, 0.14);
          color: var(--blue);
          border: 1px solid rgba(77, 158, 245, 0.3);
        }
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.82);
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
          animation: fadeIn 0.15s ease;
        }
        .modal-box {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          width: 100%;
          max-height: 88vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 32px 80px rgba(0,0,0,0.7);
        }
        .modal-bar {
          height: 3px;
          background: linear-gradient(90deg, var(--accent), var(--accent-light));
          flex-shrink: 0;
        }
        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 22px;
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
        }
        .modal-body {
          overflow-y: auto;
          padding: 22px;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .modal-footer {
          display: flex;
          gap: 8px;
          padding: 14px 22px;
          border-top: 1px solid var(--border);
          flex-shrink: 0;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .program-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 18px;
          cursor: pointer;
          transition: border-color 0.18s, transform 0.14s;
          overflow: hidden;
          position: relative;
        }
        .program-card:hover {
          border-color: rgba(249, 115, 22, 0.45);
          transform: translateY(-2px);
        }
        .program-card:hover::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 18px;
          pointer-events: none;
          box-shadow: inset 0 0 0 1px rgba(249, 115, 22, 0.25);
        }
        .program-card-bar {
          height: 3px;
          background: linear-gradient(90deg, var(--accent), var(--accent-light));
        }
        .program-card-body {
          padding: 20px 22px 18px;
        }
        .filter-tabs {
          display: flex;
          gap: 4px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 4px;
        }
        .filter-tab {
          padding: 5px 13px;
          border-radius: 7px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          border: none;
          background: transparent;
          color: var(--text-3);
          font-family: inherit;
          transition: all 0.12s;
        }
        .filter-tab.active {
          background: var(--accent);
          color: #fff;
          box-shadow: 0 2px 8px var(--accent-glow);
        }
        .filter-tab:not(.active):hover {
          color: var(--text-2);
          background: var(--surface-2);
        }
        .btn-primary {
          padding: 10px 20px;
          border-radius: 10px;
          border: none !important;
          background: #C56A2A !important;
          background-color: #C56A2A !important;
          color: #FFFFFF !important;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: inherit;
        }
        .btn-primary:hover:not(:disabled) {
          opacity: 0.85 !important;
          transform: translateY(-2px);
        }
        .btn-primary:disabled {
          opacity: 0.5 !important;
          cursor: not-allowed;
          transform: none !important;
        }
        .btn-secondary {
          padding: 10px 20px;
          border-radius: 10px;
          border: 1px solid var(--border) !important;
          background: transparent !important;
          color: var(--text-2) !important;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: inherit;
        }
        .btn-secondary:hover {
          border-color: var(--text) !important;
          color: var(--text) !important;
        }
        .btn-orange {
          padding: 8px 18px;
          border-radius: 8px;
          border: none !important;
          background: #C56A2A !important;
          background-color: #C56A2A !important;
          color: #FFFFFF !important;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: inherit;
        }
        .btn-orange:hover {
          opacity: 0.85 !important;
          transform: translateY(-2px);
        }
        .card-scroll {
          overflow-y: auto;
          flex: 1;
          min-height: 0;
          -webkit-overflow-scrolling: touch;
        }
        .card-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .card-scroll::-webkit-scrollbar-thumb {
          background: var(--border);
          border-radius: 99px;
        }
        .card-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .card-scroll::-webkit-scrollbar-thumb:hover {
          background: var(--text-3);
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .pb-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 20px;
          align-items: start;
        }
        .pb-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          height: ${CARD_HEIGHT};
          min-height: ${CARD_MIN_HEIGHT};
        }
        .fields-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }
        @media (max-width: 860px) {
          .pb-grid {
            grid-template-columns: 1fr;
          }
          .pb-card {
            height: 62vh;
            min-height: 340px;
            max-height: 62vh;
          }
        }
        @media (max-width: 480px) {
          .fields-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        .stats-panel {
          display: flex;
          flex-direction: column;
        }
        .stats-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 11px 0;
          min-width: 0;
        }
        .stats-row + .stats-row,
        .stats-grid-row + .stats-row,
        .stats-row + .stats-grid-row {
          border-top: 1px solid var(--border);
        }
        .stats-icon {
          width: 32px;
          height: 32px;
          border-radius: 9px;
          background: var(--surface-3);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .stats-label {
          margin: 0;
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--text-3);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .stats-value {
          margin: 2px 0 0;
          font-size: 13px;
          font-weight: 700;
          color: var(--text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .stats-grid-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
        }
        .stats-grid-cell {
          padding: 12px 0;
          text-align: center;
        }
        .stats-grid-cell + .stats-grid-cell {
          border-left: 1px solid var(--border);
        }
        .stats-num {
          font-size: 19px;
          font-weight: 800;
          letter-spacing: -0.03em;
          color: var(--text);
          margin: 0;
        }
        .stats-sub {
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          color: var(--text-3);
          margin-top: 2px;
        }
        .pb-header-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .pb-header-title-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1 1 auto;
          min-width: 0;
        }
        .pb-header-title {
          font-size: 22px;
          font-weight: 700;
          margin: 0;
          color: var(--text);
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .pb-header-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
      `}</style>

      {/* Header Card */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        overflow: 'hidden',
        marginBottom: 24,
      }}>
        <div style={{ 
          height: '4px', 
          background: `linear-gradient(90deg, ${program.is_active ? 'var(--accent)' : 'var(--text-3)'}, ${program.is_active ? 'var(--accent-light)' : 'var(--border)'})` 
        }} />
        
        <div style={{ padding: '20px 24px' }}>
          {/* Row 1: Icon + Title + Status + Menu (wraps to 2 rows on small screens) */}
          <div className="pb-header-row">
            <div className="pb-header-title-wrap">
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'var(--accent)1A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Dumbbell size={18} color="var(--accent)" />
              </div>

              <h1 className="pb-header-title" title={program.name}>
                {program.name}
              </h1>
            </div>

            <div className="pb-header-meta">
              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                {/* Back Button */}
                <button
                  onClick={onBack}
                  title="Back to Programs"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-2)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--text-2)'; e.currentTarget.style.color = 'var(--text)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)' }}
                >
                  <ArrowLeft size={16} />
                </button>

                {/* Overflow Menu */}
                <button
                  onClick={() => setEditingMeta(true)}
                  title="Edit program"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-2)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--text-2)'; e.currentTarget.style.color = 'var(--text)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)' }}
                >
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Description */}
          {program.description && (
            <p
              title={program.description}
              style={{
                fontSize: '13px',
                color: 'var(--text-2)',
                margin: '14px 0 0',
                lineHeight: 1.6,
                wordBreak: 'break-word',
                paddingLeft: 12,
                borderLeft: '2px solid var(--border)',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {program.description}
            </p>
          )}

          {/* Stats Panel — one unified card instead of stacked boxes */}
          <div className="stats-panel" style={{ marginTop: 18 }}>
            <div className="stats-row">
              <div className="stats-icon"><Users size={15} color="var(--text-2)" /></div>
              <div style={{ minWidth: 0 }}>
                <p className="stats-label">Member</p>
                <p className="stats-value">{clientName}</p>
              </div>
            </div>

            <div className="stats-grid-row">
              <div className="stats-grid-cell">
                <p className="stats-num">{program.weeks?.length || 0}</p>
                <p className="stats-sub">Week{(program.weeks?.length || 0) !== 1 ? 's' : ''}</p>
              </div>
              <div className="stats-grid-cell">
                <p className="stats-num">{totalEx}</p>
                <p className="stats-sub">Exercise{totalEx !== 1 ? 's' : ''}</p>
              </div>
            </div>

            {totalEx > 0 && (() => {
              const pct = Math.round((doneEx / totalEx) * 100)
              const r = 13
              const circumference = 2 * Math.PI * r
              return (
                <div className="stats-row">
                  <svg width={32} height={32} viewBox="0 0 32 32" style={{ flexShrink: 0 }}>
                    <circle cx={16} cy={16} r={r} fill="none" stroke="var(--border)" strokeWidth={4} />
                    <circle
                      cx={16} cy={16} r={r} fill="none"
                      stroke="var(--accent)" strokeWidth={4}
                      strokeDasharray={circumference}
                      strokeDashoffset={circumference * (1 - pct / 100)}
                      strokeLinecap="round"
                      transform="rotate(-90 16 16)"
                    />
                    <text x={16} y={20} textAnchor="middle" fontSize="8.5" fontWeight="800" fill="var(--text)">
                      {pct}%
                    </text>
                  </svg>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                      <p className="stats-label">Progress</p>
                      <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)', margin: 0 }}>{pct}% done</p>
                    </div>
                    <div style={{ height: 5, borderRadius: 99, background: 'var(--surface-3)', overflow: 'hidden', marginTop: 6 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent)', borderRadius: 99, transition: 'width 0.3s' }} />
                    </div>
                  </div>
                </div>
              )
            })()}

            <div className="stats-row">
              <div className="stats-icon"><Calendar size={15} color="var(--text-2)" /></div>
              <div>
                <p className="stats-label">Created on</p>
                <p className="stats-value">
                  {program.created_at ? new Date(program.created_at).toLocaleDateString() : '—'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two-Column Layout */}
      <div className="pb-grid">

        {/* Day Detail Card */}
        <div className="pb-card">
          {!selectedDay ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              gap: 12,
              opacity: 0.4,
              padding: '20px',
            }}>
              <Layers size={48} color="var(--text-3)" />
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-3)', margin: 0 }}>
                {program.weeks?.length === 0 ? 'Add a week to get started' : 'Select a day from the sidebar'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* Day header */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: 12, 
                flexWrap: 'wrap',
                padding: '20px 22px 14px 22px',
                borderBottom: '1px solid var(--border)',
                flexShrink: 0,
              }}>
                <div style={{ flex: 1 }}>
                  <p style={{
                    fontSize: '10px',
                    color: 'var(--accent)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    margin: '0 0 5px',
                  }}>
                    Week {selectedWeek?.week_number}
                    {selectedWeek?.focus && selectedWeek.focus.toLowerCase() !== `week ${selectedWeek.week_number}`.toLowerCase()
                      ? ` · ${selectedWeek.focus}` : ''}
                  </p>
                  <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0, letterSpacing: '-0.025em' }}>{selectedDay.day_of_week}</h2>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  {!selectedDay.is_rest_day && exCount > 0 && (
                    <span style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: 600 }}>{doneCount}/{exCount} done</span>
                  )}
                  {selectedDay.is_rest_day && <span className="badge badge-rest"><Activity size={10} /> Rest</span>}
                  <button
                    onClick={toggleRest}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '5px 12px',
                      borderRadius: '7px',
                      background: 'transparent',
                      border: '1px solid var(--border)',
                      color: 'var(--text-3)',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      fontFamily: 'inherit',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-3)' }}
                  >
                    {selectedDay.is_rest_day ? <><Dumbbell size={12} /> Training</> : <><Activity size={12} /> Rest</>}
                  </button>
                  <button
                    onClick={() => deleteDay(selectedDay.id)}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'transparent',
                      color: 'var(--text-3)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(242,89,89,0.5)'; e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.background = 'rgba(242,89,89,0.1)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.background = 'transparent' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Exercises */}
              <div className="card-scroll" style={{ padding: '14px 22px 0 22px' }}>
                {selectedDay.is_rest_day ? (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 1,
                    minHeight: '370px',
                    padding: '44px 20px',
                    textAlign: 'center',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    background: 'var(--bg)',
                    opacity: 0.7,
                  }}>
                    <Activity size={34} color="var(--blue)" style={{ marginBottom: 10 }} />
                    <p style={{ fontSize: '14px', color: 'var(--text-2)', margin: 0 }}>Rest day — no exercises</p>
                  </div>
                ) : (
                  <>
                    {selectedDay.exercises?.length === 0 ? (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '305px',
                        flex: 1,
                        padding: '44px 20px',
                        textAlign: 'center',
                        border: '1px dashed var(--border)',
                        borderRadius: 14,
                        marginBottom: 14,
                        background: 'var(--bg)',
                      }}>
                        <Dumbbell size={32} color="var(--text-3)" style={{ marginBottom: 12, opacity: 0.35 }} />
                        <p style={{ fontSize: '13px', color: 'var(--text-3)', margin: '0 0 16px' }}>No exercises yet</p>
                      </div>
                    ) : (
                      displayedExercises.map(ex => (
                        <ExerciseItem 
                          key={ex.id} 
                          ex={ex}
                          onDelete={deleteExercise} 
                          onToggle={toggleExercise} 
                          onEdit={editExercise}
                          isToggling={togglingExercise === ex.id}
                        />
                      ))
                    )}
                  </>
                )}
              </div>

              {/* Add Exercise Button */}
              {selectedDay && !selectedDay.is_rest_day && (
                <div style={{ 
                  flexShrink: 0, 
                  padding: '12px 22px 18px 22px',
                  borderTop: '1px solid var(--border)',
                  marginTop: 'auto',
                  background: 'var(--surface)',
                }}>
                  <button
                    className="btn-orange"
                    onClick={() => setShowAddExerciseModal(true)}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    <Plus size={14} /> Add Exercise
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Weeks Sidebar */}
        <div className="pb-card">
          <div style={{
            padding: '13px 16px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.09em' }}>
              Weeks
            </span>
            {addingWeek ? (
              <div style={{ display: 'flex', gap: 5, flex: 1, marginLeft: 10 }}>
                <input
                  className="form-input"
                  value={weekFocus}
                  onChange={e => setWeekFocus(e.target.value)}
                  placeholder="Focus…"
                  onKeyDown={e => e.key === 'Enter' && addWeek()}
                  style={{ fontSize: '11px', padding: '5px 9px' }}
                />
                <button
                  onClick={addWeek}
                  disabled={savingWeek}
                  style={{
                    padding: '5px 9px',
                    borderRadius: '7px',
                    border: 'none',
                    background: '#C56A2A',
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'opacity 0.15s',
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  {savingWeek ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={11} />}
                </button>
                <button
                  onClick={() => { setAddingWeek(false); setWeekFocus('') }}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '7px',
                    border: '1px solid var(--border)',
                    background: 'transparent',
                    color: 'var(--text-3)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={11} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAddingWeek(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 9px',
                  borderRadius: 7,
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  color: 'var(--text-3)',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.12s',
                }}
                onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
                onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-3)' }}
              >
                <Plus size={12} /> Add week
              </button>
            )}
          </div>

          {/* Weeks List */}
          <div className="card-scroll" style={{ padding: '12px' }}>
            {program.weeks?.length === 0 && (
              <p style={{ fontSize: '12px', color: 'var(--text-3)', padding: '28px 0', textAlign: 'center' }}>No weeks yet.</p>
            )}

            {program.weeks?.map(week => {
              const usedDays = week.days?.map(d => d.day_of_week) || []
              const availDays = DAY_NAMES.filter(d => !usedDays.includes(d))
              const isOpen = !!openWeeks[week.id]

              return (
                <WeekCard
                  key={week.id}
                  week={week}
                  isOpen={isOpen}
                  onToggle={toggleWeek}
                  onDelete={deleteWeek}
                  onSelectDay={setSelectedDayId}
                  selectedDayId={selectedDayId}
                  addingDayWeekId={addingDayWeekId}
                  setAddingDayWeekId={setAddingDayWeekId}
                  selectedDayName={selectedDayName}
                  setSelectedDayName={setSelectedDayName}
                  savingDay={savingDay}
                  addDay={addDay}
                  availDays={availDays}
                />
              )
            })}
          </div>
        </div>
      </div>

      {/* Add Exercise Modal */}
      <AddExerciseModal
        isOpen={showAddExerciseModal}
        onClose={() => setShowAddExerciseModal(false)}
        onSave={addExercise}
        selectedDay={selectedDay}
        saving={savingEx}
      />

      {/* Edit Meta Modal */}
      {editingMeta && (
        <div className="modal-overlay" onClick={() => setEditingMeta(false)}>
          <div className="modal-box" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div className="modal-bar" />
            <div className="modal-header">
              <h3 style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: 750,
                color: 'var(--text)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}>
                <Edit2 size={15} color="var(--accent)" /> Edit Program Info
              </h3>
              <button
                onClick={() => setEditingMeta(false)}
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '7px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.12s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text-2)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)' }}
              >
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <div>
                <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>
                  Program Name *
                </label>
                <input
                  className="form-input"
                  value={meta.name}
                  onChange={e => setMeta(p => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div>
                <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>
                  Description
                </label>
                <textarea
                  className="form-input"
                  value={meta.description}
                  onChange={e => setMeta(p => ({ ...p, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div>
                <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>
                  Assign to Client
                </label>
                <select
                  className="form-input"
                  value={meta.client_id}
                  onChange={e => setMeta(p => ({ ...p, client_id: e.target.value }))}
                >
                  <option value="">Unassigned</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.user?.name || `Client #${c.id}`}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-primary"
                disabled={savingMeta || !meta.name.trim()}
                onClick={saveMeta}
              >
                {savingMeta ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
                Save
              </button>
              <button
                className="btn-secondary"
                onClick={() => setEditingMeta(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}