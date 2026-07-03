// frontend/src/pages/member/Schedule.jsx

import { useState, useEffect } from 'react'
import {
  MapPin, Award, ChevronLeft, ChevronRight, CalendarDays,
  Dumbbell, Flame, Sparkles, Target, CheckCircle2, Ban, Users, UserCheck, Zap, Loader2,
  Clock, Info, X, Calendar, User, TrendingUp, Shield
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../api/client'

const TYPE_STYLES = {
  cardio:   { color: 'var(--accent)', label: 'Cardio',      icon: Flame },
  yoga:     { color: 'var(--blue)',   label: 'Mind & Body', icon: Sparkles },
  strength: { color: 'var(--green)',  label: 'Strength',    icon: Dumbbell },
  boxing:   { color: 'var(--red)',    label: 'Boxing',      icon: Target },
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const WEEK_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate()
  )
}

// ✅ ADD: Helper to check if date is in the past
function isPastDate(date) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date < today
}

function SpotsBar({ spots, total }) {
  const filled = ((total - spots) / total) * 100
  const isFull = spots === 0
  const isAlmostFull = spots > 0 && spots <= 3
  const barColor = isFull ? 'var(--red)' : isAlmostFull ? 'var(--amber)' : 'var(--green)'
  return (
    <div style={{ width: '100%' }}>
      <div style={{ height: '3px', background: 'var(--border)', borderRadius: '99px', overflow: 'hidden' }}>
        <div style={{ width: `${filled}%`, height: '100%', background: barColor, borderRadius: '99px', transition: 'width .3s ease' }} />
      </div>
      <p style={{ fontSize: '10.5px', color: isFull ? 'var(--red)' : isAlmostFull ? 'var(--amber)' : 'var(--text-3)', fontWeight: 600, marginTop: '4px' }}>
        {isFull ? 'Class full' : `${spots} spot${spots === 1 ? '' : 's'} left`}
      </p>
    </div>
  )
}

const getTypeStyle = (type) => {
  return TYPE_STYLES[type] || TYPE_STYLES.cardio
}

export default function MemberSchedule() {
  const [loading, setLoading] = useState(true)
  const [classes, setClasses] = useState([])
  const [booked,  setBooked]  = useState(new Set())
  const [selectedClass, setSelectedClass] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date(); d.setHours(0,0,0,0); return d
  })
  const [calMonth, setCalMonth] = useState(() => {
    const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d
  })

  useEffect(() => { 
    fetchClasses()
    fetchBookings()
  }, [])

  // ✅ ADD: Auto-select next available day with classes when classes load
  useEffect(() => {
    if (classes.length > 0) {
      const nextAvailable = findNextAvailableDay(classes, new Date())
      setSelectedDate(nextAvailable)
    }
  }, [classes])

  const fetchClasses = async () => {
    try {
      setLoading(true)
      const res = await api.get('/schedule/classes')
      setClasses(res.data || [])
    } catch {
      toast.error('Failed to load classes')
      setClasses([])
    } finally {
      setLoading(false)
    }
  }

  const fetchBookings = async () => {
    try {
      const res = await api.get('/schedule/my-bookings')
      setBooked(new Set(res.data.map(b => b.class_id)))
    } catch (err) {
      console.log('Could not fetch bookings:', err.message)
    }
  }

  // ✅ ADD: Helper to find the next available day with classes
  function findNextAvailableDay(classes, fromDate) {
    const today = new Date(fromDate)
    today.setHours(0, 0, 0, 0)
    
    // Check up to 14 days ahead
    for (let i = 0; i < 14; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(today.getDate() + i)
      const dayName = checkDate.toLocaleString('en-US', { weekday: 'long' })
      const hasClasses = classes.filter(c => c.day_of_week === dayName && !isPastDate(checkDate)).length > 0
      if (hasClasses) {
        return checkDate
      }
    }
    return today
  }

  const selectedDayName = selectedDate.toLocaleString('en-US', { weekday: 'long' })
  const getDayClasses   = (dayName) => classes.filter(c => c.day_of_week === dayName)
  const todayName       = new Date().toLocaleString('en-US', { weekday: 'long' })

  const calYear     = calMonth.getFullYear()
  const calMonthIdx = calMonth.getMonth()
  const monthLabel  = calMonth.toLocaleString('default', { month: 'long' })
  const daysInMonth = new Date(calYear, calMonthIdx + 1, 0).getDate()
  const firstDay    = new Date(calYear, calMonthIdx, 1).getDay()
  const calDays     = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  const getWeekDates = () => {
    const dow    = selectedDate.getDay()
    const offset = dow === 0 ? -6 : 1 - dow
    return DAYS.map((_, i) => {
      const d = new Date(selectedDate)
      d.setDate(selectedDate.getDate() + offset + i)
      d.setHours(0,0,0,0)
      return d
    })
  }
  const weekDates = getWeekDates()

  const prevCalMonth = () => setCalMonth(new Date(calYear, calMonthIdx - 1, 1))
  const nextCalMonth = () => setCalMonth(new Date(calYear, calMonthIdx + 1, 1))

  const goToToday = () => {
    const t = new Date(); t.setHours(0,0,0,0)
    setSelectedDate(t)
    setCalMonth(new Date(t.getFullYear(), t.getMonth(), 1))
  }

  const handleDayTab = (date) => {
    if (isPastDate(date)) {
      toast.error("Can't select past dates")
      return
    }
    setSelectedDate(new Date(date))
  }

  const handleCalClick = (day) => {
    const d = new Date(calYear, calMonthIdx, day); d.setHours(0,0,0,0)
    if (isPastDate(d)) {
      toast.error("Can't select past dates")
      return
    }
    setSelectedDate(d)
  }

  const handleBook = async (cls) => {
    if (cls.spots_left === 0) { toast.error('Class is full'); return }
    if (booked.has(cls.id))   { toast('Already booked');     return }
    try {
      await api.post(`/schedule/classes/${cls.id}/book`)
      setBooked(prev => new Set([...prev, cls.id]))
      setClasses(prev => prev.map(c => c.id === cls.id ? { ...c, spots_left: c.spots_left - 1 } : c))
      toast.success(`Booked ${cls.name}`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to book class')
    }
  }

  const openClassDetail = (cls) => {
    setSelectedClass(cls)
    setShowDetailModal(true)
  }

  const closeClassDetail = () => {
    setShowDetailModal(false)
    setSelectedClass(null)
  }

  if (loading) return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px' }}>
      <Loader2 size={32} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <span style={{ color: 'var(--text-3)', fontSize: '13px', fontWeight: 600 }}>Loading schedule…</span>
    </div>
  )

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text)', fontFamily: "'Inter', -apple-system, sans-serif", padding: '2px', minHeight: '100vh', boxSizing: 'border-box' }}>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }
        button { font-family: inherit; }
        .day-tab:hover { opacity: 0.85; }
        .cal-day:hover { background: var(--surface-2) !important; }
        .nav-btn:hover { background: var(--surface-3) !important; }
        .class-card {
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .class-card:hover {
          border-color: var(--accent)55 !important;
          box-shadow: 0 0 0 1px var(--accent)22;
        }
        .msched-class-time-inline {
          display: none;
        }
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.75);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
          animation: fadeIn 0.2s ease;
        }
        .modal-content {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 18px;
          max-width: 480px;
          width: 100%;
          max-height: 90vh;
          overflow: hidden;
          box-shadow: 0 24px 64px rgba(0,0,0,0.5);
          animation: slideUp 0.25s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ── Mobile responsiveness only — desktop rules above are untouched ── */
        @media (max-width: 768px) {
          .msched-main-layout {
            grid-template-columns: 1fr !important;
            gap: 14px !important;
          }
          .msched-schedule-panel {
            order: 1;
            height: auto !important;
            max-height: none !important;
          }
          .msched-calendar-panel {
            order: 2;
            height: auto !important;
            max-height: none !important;
          }
          .msched-class-list {
            max-height: 58vh !important;
          }
          .msched-stats-grid {
            gap: 8px !important;
          }
          .msched-stats-grid > div {
            padding: 12px 10px !important;
            gap: 8px !important;
          }
          .msched-stats-grid .msched-stat-icon {
            width: 30px !important;
            height: 30px !important;
            flex-shrink: 0;
          }
          .msched-stats-grid .msched-stat-value {
            font-size: 17px !important;
          }
          .msched-stats-grid .msched-stat-label {
            font-size: 9px !important;
          }
          .msched-day-tabs {
            padding: 10px !important;
          }
          .class-card {
            padding: 12px !important;
            gap: 10px !important;
          }
          .msched-class-time {
            display: none !important;
          }
          .msched-class-time-inline {
            display: inline-flex !important;
            align-items: center !important;
          }
          .msched-class-info {
            min-width: 0 !important;
          }
          .msched-class-info .msched-spots-bar-wrap {
            max-width: none !important;
          }
          .msched-book-btn {
            padding: 8px 14px !important;
            font-size: 11px !important;
          }
          .modal-overlay {
            padding: 0 !important;
            align-items: flex-end !important;
          }
          .modal-content {
            max-height: 90vh !important;
            border-radius: 18px 18px 0 0 !important;
            max-width: 100% !important;
          }
          .msched-modal-header {
            padding: 16px 18px !important;
          }
          .msched-modal-body {
            padding: 18px !important;
          }
          .msched-modal-quick-stats {
            grid-template-columns: 1fr 1fr !important;
          }
          .msched-modal-loc-cap {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 420px) {
          .day-tab {
            min-width: unset !important;
          }
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <p style={{ fontSize: '11px', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, marginBottom: '6px' }}>Class Schedule</p>
        <h1 style={{ fontSize: '30px', fontWeight: 800, letterSpacing: '-0.02em', margin: 0, fontFamily: "'Sora', 'Inter', sans-serif", color: 'var(--text)' }}>Plan your week</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>Reserve a spot before the room fills up.</p>
      </div>

      {/* Stats */}
      <div className="msched-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { icon: Users,     color: 'var(--accent)', value: classes.length,                  label: 'This week' },
          { icon: UserCheck, color: 'var(--green)',  value: booked.size,                     label: 'Your bookings' },
          { icon: Zap,       color: 'var(--amber)',  value: getDayClasses(todayName).length, label: 'Today' },
        ].map(({ icon: Icon, color, value, label }) => (
          <div key={label} style={{ background: 'var(--surface)', border: `1px solid var(--border)`, borderRadius: '14px', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div className="msched-stat-icon" style={{ width: '38px', height: '38px', borderRadius: '10px', background: `${color}1F`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={18} color={color} />
            </div>
            <div>
              <p className="msched-stat-value" style={{ fontSize: '22px', fontWeight: 800, lineHeight: 1, letterSpacing: '-0.02em', color: 'var(--text)' }}>{value}</p>
              <p className="msched-stat-label" style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '4px', fontWeight: 500 }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main layout */}
      <div className="msched-main-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '16px', alignItems: 'start' }}>

        {/* ── Left: schedule ── */}
        <div className="msched-schedule-panel" style={{ background: 'var(--surface)', border: `1px solid var(--border)`, borderRadius: '16px', overflow: 'hidden', height: '454px', maxHeight: '454px', display: 'flex', flexDirection: 'column' }}>

          {/* Day tabs - ✅ Filter past dates */}
          <div className="msched-day-tabs" style={{ display: 'flex', gap: '6px', padding: '14px', borderBottom: `1px solid var(--border)`, overflowX: 'auto', flexShrink: 0 }}>
            {weekDates.map((date, idx) => {
              const dayName  = DAYS[idx]
              const count    = getDayClasses(dayName).length
              const isPast   = isPastDate(date)
              
              // Skip past dates with no classes
              if (isPast && count === 0) return null
              
              const isActive = isSameDay(date, selectedDate)
              const isToday  = isSameDay(date, new Date())
              
              return (
                <button
                  key={dayName}
                  onClick={() => handleDayTab(date)}
                  className="day-tab"
                  style={{
                    display: 'flex',
                    alignItems: 'stretch',
                    borderRadius: '12px',
                    border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                    background: isActive ? 'var(--surface-2)' : 'var(--surface)',
                    cursor: isPast ? 'default' : 'pointer',
                    overflow: 'hidden',
                    flexShrink: 0,
                    transition: 'all .15s ease',
                    padding: 0,
                    opacity: isPast && count > 0 ? 0.4 : 1,
                  }}
                >
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    justifyContent: 'center',
                    padding: '10px 14px',
                    gap: '2px',
                  }}>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      color: isActive ? 'var(--text)' : 'var(--text-3)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      whiteSpace: 'nowrap',
                    }}>
                      {dayName.slice(0, 3)}
                    </span>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: count > 0 ? (isActive ? 'var(--accent)' : 'var(--text-3)') : 'var(--text-3)',
                      whiteSpace: 'nowrap',
                    }}>
                      {count > 0 ? `${count} class${count === 1 ? '' : 'es'}` : 'No classes'}
                    </span>
                  </div>

                  <div style={{
                    background: isActive ? 'var(--accent)' : 'var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '10px 14px',
                    minWidth: '48px',
                    gap: '1px',
                  }}>
                    <span style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      color: isActive ? 'var(--bg)' : 'var(--text-3)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}>
                      {date.toLocaleString('default', { month: 'short' })}
                    </span>
                    <span style={{
                      fontSize: '20px',
                      fontWeight: 800,
                      color: isActive ? 'var(--bg)' : 'var(--text-2)',
                      lineHeight: 1,
                    }}>
                      {date.getDate()}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Day header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px 18px 4px', flexShrink: 0 }}>
            <CalendarDays size={15} color="var(--accent)" />
            <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: 'var(--text)' }}>{selectedDayName}</h3>
            <span style={{ fontSize: '10px', color: 'var(--text-3)', marginLeft: '4px' }}>
              {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
            <span style={{ fontSize: '10.5px', color: 'var(--text-3)', marginLeft: 'auto', fontWeight: 600 }}>
              {getDayClasses(selectedDayName).length} class{getDayClasses(selectedDayName).length === 1 ? '' : 'es'}
            </span>
          </div>

          {/* Class list */}
          <div className="msched-class-list" style={{ padding: '12px 18px 18px', flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {getDayClasses(selectedDayName).length > 0 ? (
              getDayClasses(selectedDayName).map((cls) => {
                const typeStyle = getTypeStyle(cls.type)
                const TypeIcon  = typeStyle.icon
                const isBooked  = booked.has(cls.id)
                const isFull    = cls.spots_left === 0
                return (
                  <div
                    key={cls.id}
                    className="class-card"
                    onClick={() => openClassDetail(cls)}
                    style={{
                      display: 'flex',
                      gap: '14px',
                      padding: '14px',
                      borderRadius: '12px',
                      background: 'var(--surface-2)',
                      border: `1px solid ${isBooked ? 'var(--green)55' : 'var(--border)'}`,
                      alignItems: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    {/* Time */}
                    <div className="msched-class-time" style={{ width: '64px', flexShrink: 0, textAlign: 'center', borderRight: `1px solid var(--border)`, paddingRight: '14px' }}>
                      <p style={{ fontSize: '13px', fontWeight: 800, lineHeight: 1.2, color: 'var(--text)' }}>{cls.time}</p>
                      <p style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '2px' }}>{cls.end_time}</p>
                    </div>
                    {/* Info */}
                    <div className="msched-class-info" style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '7px', background: `${typeStyle.color}1F`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <TypeIcon size={12} color={typeStyle.color} />
                        </div>
                        <p style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: 'var(--text)' }}>{cls.name}</p>
                        <span style={{ fontSize: '9.5px', padding: '2px 8px', borderRadius: '99px', background: `${typeStyle.color}1F`, color: typeStyle.color, fontWeight: 700 }}>{typeStyle.label}</span>
                        <span style={{ fontSize: '10.5px', color: 'var(--text-3)', fontWeight: 700 }} className="msched-class-time-inline">
                          {cls.time}
                        </span>
                        {isBooked && (
                          <span style={{ fontSize: '9.5px', padding: '2px 8px', borderRadius: '99px', background: 'var(--green)1F', color: 'var(--green)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <CheckCircle2 size={10} /> Booked
                          </span>
                        )}
                        {isFull && !isBooked && (
                          <span style={{ fontSize: '9.5px', padding: '2px 8px', borderRadius: '99px', background: 'var(--red)1F', color: 'var(--red)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Ban size={10} /> Full
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: 'var(--text-3)', marginBottom: '8px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Award size={11} color="var(--text-3)" /> {cls.coach}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={11} color="var(--text-3)" /> {cls.location}</span>
                      </div>
                      <div className="msched-spots-bar-wrap" style={{ maxWidth: '220px' }}>
                        <SpotsBar spots={cls.spots_left} total={cls.max_capacity} />
                      </div>
                    </div>
                    {/* Book btn */}
                    <button
                      className="msched-book-btn"
                      onClick={(e) => { e.stopPropagation(); handleBook(cls); }}
                      disabled={isFull || isBooked}
                      style={{ padding: '9px 18px', borderRadius: '8px', border: 'none', fontSize: '12px', fontWeight: 700, cursor: isFull || isBooked ? 'default' : 'pointer', flexShrink: 0, background: isBooked || isFull ? 'var(--border)' : 'var(--accent)', color: isBooked || isFull ? 'var(--text-3)' : 'var(--bg)', opacity: isFull && !isBooked ? 0.7 : 1, transition: 'opacity 0.2s' }}
                      onMouseEnter={(e) => { if (!isFull && !isBooked) e.currentTarget.style.opacity = '0.85' }}
                      onMouseLeave={(e) => { if (!isFull && !isBooked) e.currentTarget.style.opacity = '1' }}
                    >
                      {isBooked ? 'Booked' : isFull ? 'Full' : 'Book'}
                    </button>
                  </div>
                )
              })
            ) : (
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <CalendarDays size={26} color="var(--text-3)" style={{ marginBottom: '10px', opacity: 0.5 }} />
                <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-2)' }}>No classes scheduled</p>
                <p style={{ fontSize: '11.5px', color: 'var(--text-3)', marginTop: '3px' }}>Pick another day to see what's on.</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Right: calendar ── */}
        <div className="msched-calendar-panel" style={{ background: 'var(--surface)', border: `1px solid var(--border)`, borderRadius: '16px', padding: '18px', height: '454px', maxHeight: '454px', display: 'flex', flexDirection: 'column' }}>

          {/* Month nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <button onClick={prevCalMonth} className="nav-btn" style={navBtnStyle}><ChevronLeft size={14} /></button>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>{monthLabel} {calYear}</span>
            <button onClick={nextCalMonth} className="nav-btn" style={navBtnStyle}><ChevronRight size={14} /></button>
          </div>

          <button
            onClick={goToToday}
            style={{ width: '100%', padding: '8px', marginBottom: '14px', borderRadius: '8px', border: 'none', background: 'var(--accent)', color: 'var(--bg)', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer', transition: 'opacity 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            Jump to today
          </button>

          {/* Weekday labels */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '6px' }}>
            {WEEK_LABELS.map((d, i) => (
              <div key={i} style={{ textAlign: 'center', fontSize: '10px', color: 'var(--text-3)', fontWeight: 700 }}>{d}</div>
            ))}
          </div>

          {/* Calendar grid - ✅ Past dates are dimmed and not clickable */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
            {calDays.map((day, index) => {
              if (day === null) return <div key={`e-${index}`} style={{ aspectRatio: '1' }} />

              const date        = new Date(calYear, calMonthIdx, day)
              const isSelected  = isSameDay(date, selectedDate)
              const isTodayDate = isSameDay(date, new Date())
              const isPast      = isPastDate(date)
              const dayName     = date.toLocaleString('en-US', { weekday: 'long' })
              const hasClasses  = getDayClasses(dayName).length > 0

              return (
                <div
                  key={day}
                  className="cal-day"
                  onClick={() => {
                    if (!isPast) handleCalClick(day)
                  }}
                  style={{
                    aspectRatio: '1',
                    borderRadius: '8px',
                    cursor: isPast ? 'default' : 'pointer',
                    opacity: isPast ? 0.25 : 1,
                    background: isSelected ? 'var(--accent)' : 'transparent',
                    border: `1.5px solid ${isSelected ? 'var(--accent)' : isTodayDate ? 'var(--accent)77' : 'transparent'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all .12s ease',
                  }}
                >
                  <span style={{ 
                    fontSize: '11px', 
                    fontWeight: isTodayDate || isSelected ? 800 : 500, 
                    color: isSelected ? 'var(--bg)' : isTodayDate ? 'var(--accent)' : isPast ? 'var(--text-3)' : 'var(--text)' 
                  }}>
                    {day}
                  </span>
                  {hasClasses && !isPast && (
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', marginTop: '2px', background: isSelected ? 'var(--bg)' : 'var(--accent)' }} />
                  )}
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: `1px solid var(--border)`, display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--text-3)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)' }} /> Has classes
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', border: `1.5px solid var(--accent)77` }} /> Today
            </span>
          </div>
        </div>
      </div>

      {/* ── Class Detail Modal ── */}
      {showDetailModal && selectedClass && (
        <div className="modal-overlay" onClick={closeClassDetail}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="msched-modal-header" style={{
              padding: '20px 24px',
              borderBottom: `1px solid var(--border)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--surface-2)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: `${getTypeStyle(selectedClass.type).color}1F`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {(() => {
                    const Icon = getTypeStyle(selectedClass.type).icon
                    return <Icon size={18} color={getTypeStyle(selectedClass.type).color} />
                  })()}
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text)' }}>{selectedClass.name}</h3>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: getTypeStyle(selectedClass.type).color,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}>
                    {getTypeStyle(selectedClass.type).label}
                  </span>
                </div>
              </div>
              <button
                onClick={closeClassDetail}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-3)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'var(--surface-3)'
                  e.currentTarget.style.color = 'var(--text)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--text-3)'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="msched-modal-body" style={{ padding: '24px' }}>
              {/* Quick stats */}
              <div className="msched-modal-quick-stats" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '10px',
                marginBottom: '20px',
              }}>
                {[
                  { label: 'Time', value: `${selectedClass.time} - ${selectedClass.end_time}`, icon: Clock },
                  { label: 'Coach', value: selectedClass.coach, icon: User },
                  { label: 'Day', value: selectedClass.day_of_week, icon: Calendar },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} style={{
                    padding: '12px',
                    borderRadius: '10px',
                    background: 'var(--surface-2)',
                    border: `1px solid var(--border)`,
                    textAlign: 'center',
                  }}>
                    <Icon size={14} color="var(--text-3)" style={{ margin: '0 auto 4px', display: 'block' }} />
                    <p style={{ fontSize: '10px', color: 'var(--text-3)', fontWeight: 600, marginBottom: '2px' }}>{label}</p>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)' }}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Location & Capacity */}
              <div className="msched-modal-loc-cap" style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
                marginBottom: '16px',
              }}>
                <div style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: 'var(--surface-2)',
                  border: `1px solid var(--border)`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}>
                  <MapPin size={16} color="var(--text-3)" />
                  <div>
                    <p style={{ fontSize: '9px', color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Location</p>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{selectedClass.location || 'Main Studio'}</p>
                  </div>
                </div>
                <div style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: 'var(--surface-2)',
                  border: `1px solid var(--border)`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}>
                  <Users size={16} color="var(--text-3)" />
                  <div>
                    <p style={{ fontSize: '9px', color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Capacity</p>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                      {selectedClass.spots_left} / {selectedClass.max_capacity} spots left
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              {selectedClass.description && (
                <div style={{
                  padding: '14px 16px',
                  borderRadius: '10px',
                  background: 'var(--surface-2)',
                  border: `1px solid var(--border)`,
                  marginBottom: '16px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <Info size={14} color="var(--text-3)" />
                    <p style={{ fontSize: '10px', color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Description</p>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6, margin: 0 }}>{selectedClass.description}</p>
                </div>
              )}

              {/* Action button */}
              <button
                onClick={() => {
                  handleBook(selectedClass)
                  closeClassDetail()
                }}
                disabled={selectedClass.spots_left === 0 || booked.has(selectedClass.id)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: selectedClass.spots_left === 0 || booked.has(selectedClass.id) ? 'default' : 'pointer',
                  background: booked.has(selectedClass.id) ? 'var(--green)55' : selectedClass.spots_left === 0 ? 'var(--border)' : 'var(--accent)',
                  color: booked.has(selectedClass.id) ? 'var(--text)' : selectedClass.spots_left === 0 ? 'var(--text-3)' : 'var(--bg)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (!selectedClass.spots_left === 0 && !booked.has(selectedClass.id)) {
                    e.currentTarget.style.opacity = '0.85'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!selectedClass.spots_left === 0 && !booked.has(selectedClass.id)) {
                    e.currentTarget.style.opacity = '1'
                  }
                }}
              >
                {booked.has(selectedClass.id) ? 'Already Booked' : selectedClass.spots_left === 0 ? 'Class Full' : 'Book This Class'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const navBtnStyle = {
  width: '26px', height: '26px',
  borderRadius: '7px',
  border: `1px solid var(--border)`,
  background: 'transparent',
  color: 'var(--text-2)',
  cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'all 0.2s ease',
}