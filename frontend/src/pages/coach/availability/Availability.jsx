// frontend/src/pages/coach/availability/Availability.jsx

import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { RefreshCw, Coffee, Settings } from 'lucide-react'
import { useAvailability } from './hooks/useAvailability'
import { useSessions } from './hooks/useSessions'
import { useBreaks } from './hooks/useBreaks'
import { useSettings } from './hooks/useSettings'
import { Header } from './components/Header'
import { StatsCards } from './components/StatsCards'
import { Calendar } from './components/Calendar'
import { SessionsPanel } from './components/SessionsPanel'
import { DayEditModal } from './components/DayEditModal'
import { BreaksModal } from './components/BreaksModal'
import { SettingsModal } from './components/SettingsModal'
import { CancelConfirm } from './components/CancelConfirm'
import { today, toDateStr, calcSlots, isSameDay } from './utils/helpers'

export default function CoachAvailability() {
  // ── Hooks ──
  const {
    availability,
    loading,
    dateOverrides,
    getDayAvail,
    getDateAvail,
    createOverride,
    updateOverride,
    deleteOverride,
    fetchAllData,
    setLoading,
  } = useAvailability()

  const {
    daySessionsMap,
    fetchingDates,
    fetchSessionsForDate,
    cancelSession,
    approveSession,
    rejectSession,
    completeSession,
    refreshDate,
  } = useSessions()

  const {
    breaks,
    fetchBreaks,
    getBreaksForDate,
    createBreak,
    updateBreak,
    deleteBreak,
  } = useBreaks()

  const {
    settings,
    fetchSettings,
    updateSettings,
  } = useSettings()

  // ── State ──
  const [currentMonth, setCurrentMonth] = useState(() => { const d = new Date(); d.setDate(1); return d })
  
  // ─── FIX: Set default selected date to TODAY ───
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    // Only set if today is not in the past (for booking purposes)
    return today
  })

  // Day edit modal
  const [showDayEdit, setShowDayEdit] = useState(false)
  const [dayEditForm, setDayEditForm] = useState({ 
    day: '', 
    date: null,
    start_time: '09:00', 
    end_time: '17:00', 
    is_available: true, 
    id: null,
    is_override: false
  })
  const [submitting, setSubmitting] = useState(false)

  // Break modal
  const [showBreaksModal, setShowBreaksModal] = useState(false)
  const [breakForm, setBreakForm] = useState({
    day_of_week: 'Monday',
    start_time: '12:00',
    end_time: '13:00',
    is_recurring: true,
    date: null
  })
  const [editingBreak, setEditingBreak] = useState(null)
  const [submittingBreak, setSubmittingBreak] = useState(false)

  // Settings modal
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [settingsForm, setSettingsForm] = useState({
    max_sessions_per_day: 8,
    session_duration: 60,
    buffer_between_sessions: 15,
    allow_auto_approval: true
  })
  const [submittingSettings, setSubmittingSettings] = useState(false)

  // Cancel confirm
  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancelling, setCancelling] = useState(false)

  const [todayStr] = useState(toDateStr(today()))
  const [initialLoad, setInitialLoad] = useState(true)

  // ── Effects ──
  useEffect(() => {
    const loadData = async () => {
      await fetchAllData()
      await fetchBreaks()
      await fetchSettings()
      setInitialLoad(false)
    }
    loadData()
  }, [])

  // Pre-fetch dates in view
  useEffect(() => {
    if (initialLoad) return
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const todayDate = today()

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d)
      if (date < todayDate) continue
      const dateStr = toDateStr(date)
      if (!(dateStr in daySessionsMap)) {
        fetchSessionsForDate(date)
      }
    }
  }, [currentMonth, daySessionsMap, fetchSessionsForDate, initialLoad])

  // Load sessions for selected date
  useEffect(() => {
    if (selectedDate) fetchSessionsForDate(selectedDate)
  }, [selectedDate, fetchSessionsForDate])

  // ── Calendar Data ──
  const getCalendarDays = useCallback(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDow = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const todayDate = today()
    const cells = []

    const leadingBlanks = (firstDow === 0 ? 6 : firstDow - 1)
    for (let i = 0; i < leadingBlanks; i++) cells.push(null)

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d)
      const dateStr = toDateStr(date)
      const isPast = date < todayDate
      const avail = getDateAvail(date)
      const isOpen = !!avail && avail.is_available
      const sessions = daySessionsMap[dateStr] || []
      const dayBreaks = getBreaksForDate(date)
      cells.push({
        date, dateStr, d,
        isPast,
        isToday: dateStr === todayStr,
        isOpen: !isPast && isOpen,
        hasBookings: !isPast && sessions.length > 0,
        bookingCount: sessions.length,
        isSelected: selectedDate ? isSameDay(date, selectedDate) : false,
        avail: avail,
        isOverride: !!dateOverrides[dateStr],
        hasBreaks: dayBreaks.length > 0,
        breakCount: dayBreaks.length,
      })
    }
    return cells
  }, [currentMonth, dateOverrides, daySessionsMap, getDateAvail, getBreaksForDate, selectedDate, todayStr])

  // ── Handlers ──
  const handleDateClick = (date) => {
    if (date < today()) return
    setSelectedDate(date)
  }

  const handleMonthChange = (newMonth) => {
    const newDate = new Date(currentMonth)
    newDate.setMonth(newMonth)
    setCurrentMonth(newDate)
  }

  const openDayEdit = (date, e) => {
    e?.stopPropagation()
    const dateStr = toDateStr(date)
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' })
    const avail = getDateAvail(date)
    const isOverride = !!dateOverrides[dateStr]
    
    setDayEditForm({
      day: dayName,
      date: date,
      start_time: avail?.start_time || '09:00',
      end_time: avail?.end_time || '17:00',
      is_available: avail?.is_available ?? true,
      id: avail?.id || null,
      is_override: isOverride,
    })
    setShowDayEdit(true)
  }

  const handleDaySave = async () => {
    setSubmitting(true)
    try {
      const dateStr = toDateStr(dayEditForm.date)
      
      if (dayEditForm.id && dayEditForm.is_override) {
        await updateOverride(
          dayEditForm.id,
          dayEditForm.start_time,
          dayEditForm.end_time,
          dayEditForm.is_available
        )
        toast.success(`Updated override for ${dayEditForm.day} (${dateStr})`)
      } else {
        await createOverride(
          dayEditForm.date,
          dayEditForm.start_time,
          dayEditForm.end_time,
          dayEditForm.is_available
        )
        toast.success(`Created override for ${dayEditForm.day} (${dateStr})`)
      }
      
      setShowDayEdit(false)
      await fetchAllData()
      await fetchBreaks()
      
      if (selectedDate) {
        refreshDate(selectedDate)
      }
    } catch (err) {
      console.error('Error saving override:', err)
      toast.error(err.response?.data?.detail || 'Failed to save availability')
    }
    finally { setSubmitting(false) }
  }

  const handleRemoveOverride = async () => {
    if (!dayEditForm.id || !dayEditForm.is_override) return
    if (!confirm(`Remove override for ${dayEditForm.day} (${toDateStr(dayEditForm.date)})?`)) return
    
    setSubmitting(true)
    try {
      await deleteOverride(dayEditForm.id)
      toast.success('Override removed - using default schedule')
      setShowDayEdit(false)
      await fetchAllData()
      await fetchBreaks()
      if (selectedDate) {
        refreshDate(selectedDate)
      }
    } catch (err) {
      console.error('Error removing override:', err)
      toast.error(err.response?.data?.detail || 'Failed to remove override')
    }
    finally { setSubmitting(false) }
  }

  // ── Break handlers ──
  const handleAddBreak = async () => {
    if (breakForm.start_time >= breakForm.end_time) {
      toast.error('Start time must be before end time')
      return
    }

    setSubmittingBreak(true)
    try {
      if (editingBreak) {
        await updateBreak(editingBreak.id, breakForm)
        toast.success('Break updated')
      } else {
        await createBreak(breakForm)
        toast.success('Break added')
      }

      setShowBreaksModal(false)
      setEditingBreak(null)
      setBreakForm({
        day_of_week: 'Monday',
        start_time: '12:00',
        end_time: '13:00',
        is_recurring: true,
        date: null
      })
      await fetchBreaks()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save break')
    }
    finally { setSubmittingBreak(false) }
  }

  const handleDeleteBreak = async (id) => {
    if (!confirm('Delete this break?')) return
    try {
      await deleteBreak(id)
      toast.success('Break deleted')
      await fetchBreaks()
    } catch (err) {
      toast.error('Failed to delete break')
    }
  }

  const openEditBreak = (breakItem) => {
    setEditingBreak(breakItem)
    setBreakForm({
      day_of_week: breakItem.day_of_week || 'Monday',
      start_time: breakItem.start_time,
      end_time: breakItem.end_time,
      is_recurring: breakItem.is_recurring,
      date: breakItem.date || null
    })
    setShowBreaksModal(true)
  }

  // ── Settings handlers ──
  const handleSaveSettings = async () => {
    setSubmittingSettings(true)
    try {
      await updateSettings(settingsForm)
      toast.success('Settings updated')
      setShowSettingsModal(false)
      await fetchSettings()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save settings')
    }
    finally { setSubmittingSettings(false) }
  }

  // ── Session action handlers ──
  const handleApprove = async (sessionId) => {
    try {
      await approveSession(sessionId)
      toast.success('Session approved')
      refreshDate(selectedDate)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to approve')
    }
  }

  const handleReject = async (sessionId) => {
    const reason = prompt('Reason for rejection:')
    try {
      await rejectSession(sessionId, reason || '')
      toast.success('Session rejected')
      refreshDate(selectedDate)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to reject')
    }
  }

  const handleComplete = async (sessionId) => {
    try {
      await completeSession(sessionId)
      toast.success('Session completed')
      refreshDate(selectedDate)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to complete')
    }
  }

  const handleCancelSession = (session) => {
    setCancelTarget(session)
  }

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return
    setCancelling(true)
    try {
      await cancelSession(cancelTarget.id)
      toast.success('Session cancelled')
      refreshDate(selectedDate)
      setCancelTarget(null)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to cancel session')
    }
    finally { setCancelling(false) }
  }

  // ── Render ──
  const calendarDays = getCalendarDays()
  const selectedDateStr = selectedDate ? toDateStr(selectedDate) : null
  const selectedSessions = selectedDateStr ? (daySessionsMap[selectedDateStr] || []) : []
  const selectedAvail = selectedDate ? getDateAvail(selectedDate) : null
  const selectedBreaks = selectedDate ? getBreaksForDate(selectedDate) : []
  const isLoadingSelected = selectedDateStr ? fetchingDates.has(selectedDateStr) : false

  const totalBookingsThisMonth = Object.values(daySessionsMap).reduce((s, arr) => s + arr.length, 0)
  const openDays = availability.filter(a => a.is_available).length
  const overrideCount = Object.keys(dateOverrides).length
  const totalBreaks = breaks.filter(b => b.is_active !== false).length

  if (loading && initialLoad) {
    return (
      <div style={{
        background: 'var(--bg)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '14px',
      }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%',
          border: '3px solid var(--border)',
          borderTopColor: 'var(--accent)',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ color: 'var(--text-3)', fontSize: '13px', fontWeight: 600 }}>Loading schedule…</span>
      </div>
    )
  }

  return (
    <div
      className="av-page-wrap"
      style={{
        background: 'var(--bg)',
        color: 'var(--text)',
        fontFamily: "'Inter', -apple-system, sans-serif",
        minHeight: '100vh',
        boxSizing: 'border-box',
        maxWidth: '1400px',
        margin: '0 auto',
      }}
    >
      <style>{`
        /* ─── All the CSS styles from the original file ─── */
        * { box-sizing: border-box; }

        /* ─── Action buttons row (Refresh / Breaks / Settings) ───
           Sits under the stat cards. Right-aligned on desktop,
           wraps to full width on mobile. */
        .av-action-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: flex-end;
          margin-bottom: 20px;
        }
        @media (max-width: 640px) {
          .av-action-row { justify-content: flex-start; }
          .av-action-row .btn-ghost { flex: 1 1 auto; justify-content: center; }
        }

        /* ─── Page shell ─── */
        .av-page-wrap { padding: 0; }

        /* ─── Main content layout: sessions + calendar ───
           Desktop: sessions panel left (flexible), calendar fixed 380px right.
           Mobile: single column, calendar shown first so people pick a date
           before scrolling to that date's sessions. */
        .av-content-grid {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 20px;
          align-items: start;
        }
        @media (max-width: 900px) {
          .av-content-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          .av-content-grid > *:nth-child(1) { order: 2; }
          .av-content-grid > *:nth-child(2) { order: 1; }
        }

        /* ─── Stat cards row ───
           Desktop: 5 equal-width cards in one row.
           Mobile: 2-column grid so labels/numbers stay legible. */
        .av-stats-row {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        @media (max-width: 640px) {
          .av-stats-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
          }
          .av-stats-row > .av-stat-card:nth-child(5) { display: none; }
          .av-stat-card { padding: 12px 14px; }
          .av-stat-card .av-stat-icon { width: 22px !important; height: 22px !important; }
          .av-stat-card .av-stat-label { font-size: 9px !important; letter-spacing: 0.02em !important; }
          .av-stat-card .av-stat-value { font-size: 18px !important; }
        }

        /* ─── Session row ───
           Desktop: avatar | info | actions in one row.
           Mobile: avatar+info on top, actions wrap onto their own row
           instead of forcing horizontal overflow. */
        .av-session-grid {
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: 14px;
        }
        @media (max-width: 560px) {
          .av-session-grid {
            grid-template-columns: auto 1fr;
            row-gap: 10px;
          }
          .av-session-actions-cell {
            grid-column: 1 / -1;
            flex-wrap: wrap;
            flex-shrink: 1 !important;
          }
        }

        /* ─── Breaks modal form (day / start / end) ───
           Mobile: drop to 2 columns, day picker spans full width. */
        .av-break-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10px;
        }
        @media (max-width: 480px) {
          .av-break-form-grid { grid-template-columns: 1fr 1fr; }
          .av-break-form-grid > :first-child { grid-column: span 2; }
        }

        /* ─── Modals: reclaim width on small screens ─── */
        @media (max-width: 480px) {
          .modal-overlay { padding: 10px; }
          .modal-box, .modal-box-sm, .modal-box-wide { max-width: 100%; }
        }

        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }
        ::-webkit-scrollbar-track { background: transparent; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        
        .av-stat-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 16px 20px;
          transition: all 0.2s ease;
        }
        .av-stat-card:hover {
          border-color: rgba(249, 115, 22, 0.3);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .av-cal-day {
          position: relative;
          aspect-ratio: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          border: 1.5px solid transparent;
          background: var(--surface-2);
          color: var(--text);
          transition: all 0.15s ease;
          padding: 0;
          gap: 1px;
          font-family: inherit;
        }
        .av-cal-day:hover:not(.av-cal-past):not(.av-cal-closed) {
          border-color: rgba(249, 115, 22, 0.4);
          transform: scale(1.05);
        }
        .av-cal-day:hover.av-cal-closed:not(.av-cal-past) {
          border-color: rgba(239, 68, 68, 0.3);
        }
        .av-cal-past {
          opacity: 0.3;
          color: var(--text-3);
          cursor: not-allowed;
        }
        .av-cal-closed {
          background: var(--surface-2);
          color: var(--text-3);
          opacity: 0.6;
          cursor: pointer;
        }
        .av-cal-open {
          background: var(--surface-2);
          color: var(--text);
          cursor: pointer;
        }
        .av-cal-today {
          border-color: rgba(249, 115, 22, 0.4) !important;
          background: rgba(249, 115, 22, 0.08);
        }
        .av-cal-selected {
          background: var(--accent) !important;
          color: #fff !important;
          border-color: var(--accent) !important;
          box-shadow: 0 4px 16px rgba(249, 115, 22, 0.35);
          transform: scale(1.05);
        }
        .av-cal-selected .av-cal-day-number { color: #fff !important; }
        
        .av-cal-override {
          border-color: var(--blue) !important;
          background: rgba(77, 158, 245, 0.08) !important;
        }
        
        .av-cal-break {
          border-color: #F59E0B !important;
          background: rgba(245, 158, 11, 0.08) !important;
        }
        
        .av-status-open { color: var(--accent); }
        .av-status-closed { color: var(--text-3); }
        .av-status-break { color: #F59E0B; }
        
        .av-booking-dot {
          background: var(--accent);
          color: #fff;
          font-size: 8px;
          font-weight: 800;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
        }
        .av-booking-dot-legend {
          display: inline-flex;
          width: 18px;
          height: 18px;
          font-size: 8px;
        }
        
        .av-override-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: var(--blue);
          border: 1.5px solid var(--surface);
          font-size: 7px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-weight: 800;
        }
        
        .av-break-badge {
          position: absolute;
          bottom: -4px;
          right: -4px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #F59E0B;
          border: 1.5px solid var(--surface);
          font-size: 7px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-weight: 800;
        }
        
        .av-session-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 16px;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: var(--surface-2);
          transition: all 0.15s ease;
        }
        .av-session-row:hover {
          border-color: rgba(249, 115, 22, 0.3);
          background: var(--surface-3);
        }
        
        .av-session-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          flex-shrink: 0;
          background: rgba(249, 115, 22, 0.12);
          color: var(--accent);
          border: 1px solid rgba(249, 115, 22, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 800;
        }
        
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
          animation: fadeIn 0.2s ease;
        }
        .modal-box {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 18px;
          width: 100%;
          max-width: 520px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 24px 64px rgba(0,0,0,0.5);
          animation: slideUp 0.25s ease;
          overflow: hidden;
        }
        .modal-box-sm { max-width: 380px; }
        .modal-box-wide { max-width: 600px; }
        
        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border);
          background: var(--surface-2);
          flex-shrink: 0;
        }
        .modal-body {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
        }
        .modal-footer {
          display: flex;
          gap: 8px;
          padding: 14px 20px;
          border-top: 1px solid var(--border);
          background: var(--surface-2);
          flex-shrink: 0;
        }
        .modal-footer .btn-primary { flex: 1; }
        
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
          box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.15);
        }
        .form-label {
          font-size: 10px;
          font-weight: 700;
          color: var(--text-3);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          display: block;
          margin-bottom: 4px;
        }
        
        .btn-primary {
          padding: 10px 20px;
          border-radius: 10px;
          border: none !important;
          background: var(--accent) !important;
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
        
        .btn-danger {
          padding: 10px 20px;
          border-radius: 10px;
          border: none !important;
          background: #EF4444 !important;
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
        .btn-danger:hover:not(:disabled) {
          opacity: 0.85 !important;
          transform: translateY(-2px);
        }
        .btn-danger:disabled {
          opacity: 0.5 !important;
          cursor: not-allowed;
        }
        
        .btn-ghost {
          padding: 8px 16px;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: var(--surface-2);
          color: var(--text-2);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: inherit;
        }
        .btn-ghost:hover {
          border-color: var(--text-3);
          color: var(--text);
          background: var(--surface-3);
        }
        
        .btn-danger-ghost {
          padding: 4px 12px;
          border-radius: 6px;
          border: 1px solid rgba(239, 68, 68, 0.2);
          background: rgba(239, 68, 68, 0.08);
          color: #EF4444;
          font-size: 10px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-family: inherit;
        }
        .btn-danger-ghost:hover {
          background: rgba(239, 68, 68, 0.16);
          transform: translateY(-1px);
        }
        
        .btn-edit-sm {
          padding: 4px 10px;
          border-radius: 6px;
          border: 1px solid var(--border);
          background: var(--surface-2);
          color: var(--text-2);
          font-size: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-family: inherit;
        }
        .btn-edit-sm:hover {
          border-color: var(--accent);
          color: var(--accent);
          background: rgba(249, 115, 22, 0.08);
        }
        
        .spinner {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          border: 2px solid var(--border);
          border-top-color: var(--accent);
          animation: spin 0.8s linear infinite;
          flex-shrink: 0;
        }
        .spinner-white { border-color: rgba(255,255,255,0.3); border-top-color: #fff; }
        
        .toggle-track {
          width: 34px;
          height: 18px;
          border-radius: 99px;
          background: var(--border);
          position: relative;
          transition: background 0.2s;
          flex-shrink: 0;
        }
        .toggle-track.on { background: var(--accent); }
        .toggle-track.off { background: #d1d5db; }
        .toggle-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #fff;
          position: absolute;
          top: 3px;
          left: 3px;
          transition: left 0.2s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        .toggle-thumb.on { left: 19px; }
        
        .override-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 8px;
          border-radius: 99px;
          font-size: 9px;
          font-weight: 700;
          background: rgba(77, 158, 245, 0.12);
          color: var(--blue);
          border: 1px solid rgba(77, 158, 245, 0.2);
        }
        
        .break-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 8px;
          border-radius: 99px;
          font-size: 9px;
          font-weight: 700;
          background: rgba(245, 158, 11, 0.12);
          color: #F59E0B;
          border: 1px solid rgba(245, 158, 11, 0.2);
        }
        
        .break-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          border-radius: 8px;
          background: var(--surface-2);
          border: 1px solid var(--border);
          margin-bottom: 8px;
        }
        .break-item:hover {
          border-color: #F59E0B40;
        }
        
        .setting-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid var(--border);
        }
        .setting-item:last-child { border-bottom: none; }
        .setting-label { font-size: 13px; font-weight: 600; color: var(--text); }
        .setting-desc { font-size: 11px; color: var(--text-3); }
        .setting-input {
          width: 80px;
          padding: 6px 10px;
          border-radius: 6px;
          border: 1px solid var(--border);
          background: var(--surface-2);
          color: var(--text);
          font-size: 13px;
          text-align: center;
        }
        .setting-input:focus {
          border-color: var(--accent);
          outline: none;
        }
      `}</style>

      <Header />

      <StatsCards
        openDays={openDays}
        overrideCount={overrideCount}
        totalBreaks={totalBreaks}
        totalBookings={totalBookingsThisMonth}
        availability={availability}
      />

      <div className="av-action-row">
        <button
          className="btn-ghost"
          onClick={() => {
            fetchAllData()
            fetchBreaks()
            fetchSettings()
          }}
        >
          <RefreshCw size={13} />
          Refresh
        </button>
        <button className="btn-ghost" onClick={() => setShowBreaksModal(true)}>
          <Coffee size={13} />
          Breaks
        </button>
        <button className="btn-ghost" onClick={() => setShowSettingsModal(true)}>
          <Settings size={13} />
          Settings
        </button>
      </div>

      <div className="av-content-grid">
        <SessionsPanel
          selectedDate={selectedDate}
          selectedSessions={selectedSessions}
          selectedAvail={selectedAvail}
          selectedBreaks={selectedBreaks}
          isLoading={isLoadingSelected}
          dateOverrides={dateOverrides}
          onEditDate={openDayEdit}
          onRefresh={() => refreshDate(selectedDate)}
          onApprove={handleApprove}
          onReject={handleReject}
          onComplete={handleComplete}
          onCancel={handleCancelSession}
        />

        <Calendar
          currentMonth={currentMonth}
          calendarDays={calendarDays}
          selectedDate={selectedDate}
          onMonthChange={handleMonthChange}
          onDateClick={handleDateClick}
        />
      </div>

      <DayEditModal
        isOpen={showDayEdit}
        form={dayEditForm}
        onClose={() => setShowDayEdit(false)}
        onChange={setDayEditForm}
        onSave={handleDaySave}
        onRemoveOverride={handleRemoveOverride}
        selectedBreaks={selectedBreaks}
        submitting={submitting}
        onManageBreaks={() => { setShowDayEdit(false); setShowBreaksModal(true) }}
      />

      <BreaksModal
        isOpen={showBreaksModal}
        breaks={breaks}
        form={breakForm}
        editingBreak={editingBreak}
        onClose={() => { setShowBreaksModal(false); setEditingBreak(null) }}
        onFormChange={setBreakForm}
        onSave={handleAddBreak}
        onDelete={handleDeleteBreak}
        onEdit={openEditBreak}
        submitting={submittingBreak}
      />

      <SettingsModal
        isOpen={showSettingsModal}
        form={settingsForm}
        onClose={() => setShowSettingsModal(false)}
        onChange={setSettingsForm}
        onSave={handleSaveSettings}
        submitting={submittingSettings}
      />

      <CancelConfirm
        isOpen={!!cancelTarget}
        session={cancelTarget}
        selectedDate={selectedDate}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleConfirmCancel}
        cancelling={cancelling}
      />
    </div>
  )
}