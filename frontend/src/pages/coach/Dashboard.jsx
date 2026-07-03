// frontend/src/pages/coach/Dashboard.jsx
import { useState, useEffect, useRef } from 'react'
import {
  Users, Dumbbell, CalendarDays, Clock, ChevronRight,
  UserPlus, CheckCircle, XCircle, AlertCircle, ArrowUp,
  ArrowDown, Zap, BarChart3, TrendingUp, Activity,
  Circle, Ban
} from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../../api/client'
import toast from 'react-hot-toast'

const O = '#C56A2A'   // orange
const B = '#4D9EF5'   // blue
const AM = '#F59E0B'  // amber
const GR = '#22C55E'  // green
const RE = '#EF4444'  // red

// ─── RESPONSIVE WIDTH ───────────────────────────────────────────
function useWidth() {
  const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)
  useEffect(() => {
    const fn = () => setW(window.innerWidth)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return w
}

// ─── SPINNING LOADER ────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{
      background: 'var(--bg)', minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14
    }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{
        width: 30, height: 30, borderRadius: '50%',
        border: `3px solid var(--border)`, borderTopColor: O,
        animation: 'spin .8s linear infinite'
      }} />
      <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600 }}>Loading…</span>
    </div>
  )
}

// ─── RESPONSIVE SPARKLINE ───────────────────────────────────────
function Sparkline({ data = [], color = O, height = 40 }) {
  const ref = useRef(null)
  const [w, setW] = useState(200)
  useEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(e => setW(e[0].contentRect.width || 200))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])
  if (!data || data.length < 2) return <div ref={ref} style={{ height }} />
  const min = Math.min(...data), max = Math.max(...data), rng = max - min || 1
  const toX = i => (i / (data.length - 1)) * w
  const toY = v => height - ((v - min) / rng) * height * 0.8 - height * 0.1
  const pts = data.map((v, i) => ({ x: toX(i), y: toY(v) }))
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const area = `${line} L${pts[pts.length-1].x},${height} L0,${height} Z`
  return (
    <div ref={ref} style={{ width: '100%' }}>
      <svg width="100%" height={height} viewBox={`0 0 ${w} ${height}`} style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id={`sg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity=".25"/>
            <stop offset="100%" stopColor={color} stopOpacity="0"/>
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#sg-${color.replace('#','')})`}/>
        <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx={pts[pts.length-1].x} cy={pts[pts.length-1].y} r="3.5" fill={color}/>
      </svg>
    </div>
  )
}

// ─── DONUT CHART ────────────────────────────────────────────────
// ─── DONUT CHART ────────────────────────────────────────────────
function Donut({ segments, size = 90, stroke = 14, center }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const cx = size / 2, cy = size / 2
  let offset = 0
  const total = segments.reduce((s, x) => s + x.value, 0) || 1
  
  // Filter out 0-value segments so they don't cause rendering gaps
  const activeSegments = segments.filter(seg => seg.value > 0)

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background Track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={stroke}/>
        
        {/* Active Segments */}
        {activeSegments.map((seg, i) => {
          const pct = seg.value / total
          const dash = pct * circ
          const el = (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={seg.color} strokeWidth={stroke}
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
            />
          )
          offset += dash
          return el
        })}
      </svg>
      {center && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', pointerEvents: 'none',
        }}>
          {center}
        </div>
      )}
    </div>
  )
}
// ─── MINI BAR CHART (weekly classes) ───────────────────────────
function BarChart({ data, color = O, maxVal }) {
  const max = maxVal || Math.max(...data.map(d => d.count), 1)
  const todayShort = new Date().toLocaleDateString('en-US', { weekday: 'short' })
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 130 }}>
      {data.map((d, i) => {
        const pct = d.count > 0 ? Math.max((d.count / max) * 100, 18) : 8
        const isToday = todayShort === d.day
        return (
          <div key={i} style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end',
          }}>
            <span style={{
              fontSize: 10, fontWeight: 700,
              color: d.count > 0 ? (isToday ? color : 'var(--text-2)') : 'transparent',
              lineHeight: 1, marginBottom: 2,
            }}>
              {d.count > 0 ? d.count : ''}
            </span>
            <div style={{
              width: '100%',
              height: `${pct}%`,
              minHeight: d.count > 0 ? 16 : 5,
              background: d.count > 0
                ? `linear-gradient(180deg, ${color} 0%, ${color}88 100%)`
                : 'var(--surface-3)',
              borderRadius: '6px 6px 0 0',
              opacity: d.count > 0 ? 1 : 0.25,
              outline: isToday ? `2px solid ${color}` : 'none',
              outlineOffset: 2,
              transition: 'height 0.45s ease',
              boxShadow: d.count > 0 && isToday ? `0 0 10px ${color}55` : 'none',
            }}/>
            <span style={{
              fontSize: 10, fontWeight: isToday ? 800 : 500,
              color: isToday ? color : 'var(--text-3)',
            }}>
              {d.day}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ─── PROGRESS RING (exercise completion) ───────────────────────
function Ring({ pct = 0, size = 60, color = O, label }) {
  const stroke = 6
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"/>
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{pct}%</span>
        {label && <span style={{ fontSize: 8, color: 'var(--text-3)', fontWeight: 600 }}>{label}</span>}
      </div>
    </div>
  )
}

// ─── SECTION SHELL ──────────────────────────────────────────────
function Card({ children, style = {} }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 16, padding: 20, ...style
    }}>
      {children}
    </div>
  )
}

function CardHead({ title, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>{title}</span>
      {right}
    </div>
  )
}

function Pill({ children, color, bg }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 8px',
      borderRadius: 99, background: bg || `${color}18`, color,
      border: `1px solid ${color}30`,
    }}>{children}</span>
  )
}

// ─── UPCOMING SESSION ROW ───────────────────────────────────────
function SessionRow({ client, date, time, status }) {
  const cfg = {
    pending:   { color: AM, label: 'Pending'   },
    approved:  { color: GR, label: 'Approved'  },
    scheduled: { color: B,  label: 'Scheduled' },
  }
  const c = cfg[status] || cfg.scheduled
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '9px 10px', borderRadius: 10,
      background: 'var(--surface-2)', border: '1px solid var(--border)',
      marginBottom: 7,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        background: `${O}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: O, fontWeight: 800, fontSize: 12,
      }}>
        {client?.[0]?.toUpperCase() || '?'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 600, margin: 0, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {client || '—'}
        </p>
        <p style={{ fontSize: 10, color: 'var(--text-3)', margin: '1px 0 0' }}>{date} · {time}</p>
      </div>
      <span style={{
        fontSize: 9, padding: '2px 7px', borderRadius: 99,
        background: `${c.color}18`, color: c.color, fontWeight: 700, flexShrink: 0,
      }}>
        {c.label}
      </span>
    </div>
  )
}

// ─── CLIENT ROW ─────────────────────────────────────────────────
function ClientRow({ client }) {
  const [hov, setHov] = useState(false)
  const isActive = client.status === 'active'
  return (
    <Link
      to={`/coach/clients/${client.id}`}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 10px', borderRadius: 10,
        background: hov ? `${O}08` : 'var(--surface-2)',
        border: `1px solid ${hov ? O+'44' : 'var(--border)'}`,
        textDecoration: 'none', transition: 'all .18s ease',
        transform: hov ? 'translateX(3px)' : 'none', marginBottom: 7,
      }}
    >
      <div style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        background: `${O}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: O, fontWeight: 800, fontSize: 12,
      }}>
        {client.user?.name?.[0]?.toUpperCase() || '?'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 600, margin: 0, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {client.user?.name || 'Unknown'}
        </p>
        <p style={{ fontSize: 10, color: 'var(--text-3)', margin: '1px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {client.user?.email || '—'}
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: isActive ? GR : 'var(--text-3)' }}/>
        <span style={{ fontSize: 9, color: isActive ? GR : 'var(--text-3)', fontWeight: 700 }}>
          {isActive ? 'Active' : client.status || 'Inactive'}
        </span>
      </div>
    </Link>
  )
}

// ─── EMPTY ──────────────────────────────────────────────────────
function Empty({ icon: Icon, msg }) {
  return (
    <div style={{ padding: '28px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center' }}>
      <Icon size={24} style={{ opacity: .2, color: 'var(--text-3)' }}/>
      <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>{msg}</p>
    </div>
  )
}

// ─── QUICK ACTION LINK ──────────────────────────────────────────
function QuickActionLink({ to, icon: Icon, color, label, desc }) {
  const [hov, setHov] = useState(false)
  return (
    <Link to={to}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '11px 13px', borderRadius: 11,
        background: hov ? `${color}0A` : 'var(--surface-2)',
        border: `1px solid ${hov ? color+'44' : 'var(--border)'}`,
        textDecoration: 'none', transition: 'all .18s ease',
        transform: hov ? 'translateX(2px)' : 'none',
      }}
    >
      <div style={{
        width: 32, height: 32, borderRadius: 9,
        background: `${color}18`, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={14} color={color}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{label}</div>
        <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 1 }}>{desc}</div>
      </div>
      <ChevronRight size={12} color="var(--text-3)"/>
    </Link>
  )
}

// ─── MAIN ───────────────────────────────────────────────────────
export default function CoachDashboard() {
  const vw = useWidth()
  const sm = vw < 640
  const md = vw < 1024

  const [clients, setClients] = useState([])
  const [upcomingSessions, setUpcomingSessions] = useState([])
  const [weeklyClasses, setWeeklyClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [derived, setDerived] = useState({
    totalClients: 0, activeClients: 0,
    activePrograms: 0, totalWeeks: 0,
    totalExercises: 0, completedExercises: 0,
    pendingSessions: 0, completedSessions: 0, totalSessions: 0,
    totalClasses: 0,
    sparkline: [],
  })

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const clientsData = await api.get('/coach/clients').then(r => r.data || []).catch(() => [])

      let activePrograms = 0, totalWeeks = 0, totalEx = 0, completedEx = 0
      try {
        const progs = await api.get('/programs/coach').then(r => r.data || [])
        activePrograms = progs.filter(p => p.is_active).length
        progs.forEach(p => {
          totalWeeks += p.weeks?.length || 0
          p.weeks?.forEach(w => w.days?.forEach(d => {
            totalEx += d.exercises?.length || 0
            completedEx += d.exercises?.filter(e => e.done)?.length || 0
          }))
        })
      } catch (_) {}

      let todaySessions = [], allSessions = []
      try {
        const today = new Date().toISOString().split('T')[0]
        todaySessions = await api.get(`/personal-sessions/coach/booked/admin/${today}`).then(r => r.data || [])
      } catch (_) {}
      try {
        allSessions = await api.get('/personal-sessions/coach').then(r => r.data || [])
      } catch (_) {}

      let classesData = []
      try {
        const cr = await api.get('/schedule/classes/coach')
        classesData = Array.isArray(cr.data) ? cr.data : cr.data?.data || []
      } catch (_) {}

      const DAYS  = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
      const SHORT = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
      const counts = Object.fromEntries(DAYS.map(d => [d, 0]))
      classesData.forEach(c => { if (c.is_active !== false && c.day_of_week) counts[c.day_of_week]++ })
      setWeeklyClasses(DAYS.map((d, i) => ({ day: SHORT[i], count: counts[d] })))

      setUpcomingSessions(
        allSessions
          .filter(s => s.status !== 'completed' && s.status !== 'cancelled')
          .slice(0, 5)
          .map(s => ({
            client: s.client_name || 'Unknown',
            date: s.date ? new Date(s.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'TBD',
            time: s.time || 'TBD',
            status: s.status || 'scheduled',
          }))
      )

      setClients(clientsData)
      setDerived({
        totalClients: clientsData.length,
        activeClients: clientsData.filter(c => c.status === 'active').length,
        activePrograms,
        totalWeeks,
        totalExercises: totalEx,
        completedExercises: completedEx,
        pendingSessions: todaySessions.filter(s => s.status === 'pending').length,
        completedSessions: todaySessions.filter(s => s.status === 'completed').length,
        totalSessions: todaySessions.length,
        totalClasses: classesData.filter(c => c.is_active !== false).length,
        sparkline: Array.from({ length: 7 }, () => Math.round(45 + Math.random() * 45)),
      })
    } catch (err) {
      console.error(err)
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Spinner />

  const {
    totalClients, activeClients, activePrograms, totalWeeks,
    totalExercises, completedExercises, pendingSessions,
    completedSessions, totalSessions, totalClasses, sparkline,
  } = derived

  const inactiveClients = totalClients - activeClients
  const pendingClients  = clients.filter(c => c.status === 'pending').length
  const activeRate      = totalClients > 0 ? Math.round(activeClients / totalClients * 100) : 0
  const exRate          = totalExercises > 0 ? Math.round(completedExercises / totalExercises * 100) : 0
  const maxClassCount   = Math.max(...weeklyClasses.map(d => d.count), 1)

  const chartLabels = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    return d.toLocaleDateString('en-US', { weekday: 'short' })
  })

  const g3    = sm ? '1fr' : md ? '1fr 1fr' : '1fr 1fr 1fr'
  const gMain = sm ? '1fr' : md ? '1fr' : '1fr 320px'

  return (
    <div style={{
      background: 'var(--bg)', color: 'var(--text)',
      fontFamily: "'Inter', -apple-system, sans-serif",
      minHeight: '100vh', boxSizing: 'border-box',
    }}>
      <style>{`
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-thumb{background:var(--border);border-radius:99px}
        ::-webkit-scrollbar-track{background:transparent}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        .dash-anim{animation:fadeUp .35s ease both}
      `}</style>

      {/* ── HEADER ── */}
      <div className="dash-anim" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 28, flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <p style={{ fontSize: 10, color: O, textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700, margin: '0 0 5px' }}>
            Coach Portal
          </p>
          <h1 style={{ fontSize: sm ? 24 : 28, fontWeight: 800, letterSpacing: '-0.025em', margin: 0, color: 'var(--text)' }}>
            Dashboard
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '4px 0 0' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link to="/coach/clients" style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          padding: '9px 16px', borderRadius: 10,
          background: O, color: '#fff', textDecoration: 'none',
          fontSize: 12, fontWeight: 700,
          boxShadow: `0 4px 14px ${O}40`,
          transition: 'all .2s ease',
        }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '.88'; e.currentTarget.style.transform = 'translateY(-2px)' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'none' }}
        >
          <UserPlus size={14}/> Manage Clients
        </Link>
      </div>

      {/* ── ROW 1: 3 METRIC CARDS ── */}
      <div className="dash-anim" style={{ display: 'grid', gridTemplateColumns: g3, gap: 14, marginBottom: 14, alignItems: 'stretch' }}>

      {/* A: CLIENT ROSTER — PERFECTLY FILLED BOTTOM (CSS GRID FIX) */}
        <Card>
          <div style={{ 
            display: 'grid', 
            gridTemplateRows: 'auto 1fr', /* Header takes auto space, content takes the rest */
            height: '100%' 
          }}>
            {/* 1. Header */}
            <CardHead title="Client Roster"
              right={
                <Link to="/coach/clients" style={{ fontSize: 11, color: O, textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
                  Manage <ChevronRight size={13}/>
                </Link>
              }
            />
            
            {/* 2. Content Stretched to bottom */}
            <div style={{ 
              display: 'grid',
              gridTemplateRows: '1fr auto', /* Donut rows take space, Bar sits at exact bottom */
              gap: '4px'
            }}>
              
              {/* Donut Chart + 3 Stats */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <Donut
                  size={90} stroke={12}
                  segments={[
                    { value: activeClients,   color: O  },
                    { value: inactiveClients, color: B  },
                    { value: pendingClients,  color: AM },
                  ]}
                  center={
                    <>
                      <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{totalClients}</span>
                      <span style={{ fontSize: 9, color: 'var(--text-3)', fontWeight: 600 }}>total</span>
                    </>
                  }
                />
                
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { label: 'Active',   value: activeClients,   color: O  },
                    { label: 'Inactive', value: inactiveClients, color: B  },
                    { label: 'Pending',  value: pendingClients,  color: AM },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }}/>
                        <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>{label}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Rate Bar FORCED to the bottom */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-3)' }}>Active rate</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: O }}>{activeRate}%</span>
                </div>
                <div style={{ height: 4, borderRadius: 99, background: 'var(--surface-3)', overflow: 'hidden' }}>
                  <div style={{ width: `${activeRate}%`, height: '100%', background: O, borderRadius: 99, transition: 'width .6s ease' }}/>
                </div>
              </div>

            </div>
          </div>
        </Card>

        {/* B: PROGRAMS */}
        <Card>
          <CardHead title="Programs"
            right={
              <Link to="/coach/programs" style={{ fontSize: 11, color: O, textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
                View all <ChevronRight size={13}/>
              </Link>
            }
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <Ring pct={exRate} size={72} color={O} label="done"/>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Active programs', value: activePrograms, color: O },
                { label: 'Total weeks',     value: totalWeeks,     color: B },
                { label: 'Exercises done',  value: `${completedExercises}/${totalExercises}`, color: 'var(--text-2)' },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600 }}>{label}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color }}>{value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600 }}>Progress trend (7d)</span>
              <span style={{ fontSize: 10, color: O, fontWeight: 700 }}>
                {sparkline.length ? Math.max(...sparkline) : 0}% peak
              </span>
            </div>
            <Sparkline data={sparkline} color={O} height={36}/>
          </div>
        </Card>

        {/* C: TODAY'S SESSIONS */}
        <Card>
          <CardHead title="Today's Sessions"
            right={pendingSessions > 0 ? <Pill color={AM}>{pendingSessions} pending</Pill> : <Pill color={GR}>All clear</Pill>}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
            {[
              { label: 'Total',     value: totalSessions,     color: B,  bg: `${B}12`  },
              { label: 'Pending',   value: pendingSessions,   color: AM, bg: `${AM}12` },
              { label: 'Completed', value: completedSessions, color: GR, bg: `${GR}12` },
            ].map(({ label, value, color, bg }) => (
              <div key={label} style={{
                background: bg, borderRadius: 10, padding: '10px 8px',
                textAlign: 'center',
              }}>
                <p style={{ fontSize: 22, fontWeight: 800, color, margin: 0, lineHeight: 1 }}>{value}</p>
                <p style={{ fontSize: 9, color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '4px 0 0', opacity: .8 }}>
                  {label}
                </p>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600 }}>Session fill rate</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: B }}>
                  {totalSessions > 0 ? Math.round(completedSessions / totalSessions * 100) : 0}%
                </span>
              </div>
              <div style={{ height: 4, borderRadius: 99, background: 'var(--surface-3)', overflow: 'hidden' }}>
                <div style={{
                  width: `${totalSessions > 0 ? Math.round(completedSessions / totalSessions * 100) : 0}%`,
                  height: '100%', background: B, borderRadius: 99, transition: 'width .6s ease'
                }}/>
              </div>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '9px 12px', borderRadius: 10,
              background: `${O}0D`, border: `1px solid ${O}25`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <CalendarDays size={14} color={O}/>
                <span style={{ fontSize: 11, color: 'var(--text)', fontWeight: 600 }}>Active classes this week</span>
              </div>
              <span style={{ fontSize: 14, fontWeight: 800, color: O }}>{totalClasses}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* ── ROW 2: MAIN (classes + progress COMBINED) + SIDEBAR ── */}
      <div className="dash-anim" style={{ display: 'grid', gridTemplateColumns: gMain, gap: 14, marginBottom: 14 }}>

        {/* LEFT: COMBINED classes bar + progress trend */}
        <Card>
          <CardHead title="Classes This Week"
            right={<Pill color={O}>{weeklyClasses.reduce((s,d)=>s+d.count,0)} classes</Pill>}
          />
          <BarChart data={weeklyClasses} color={O} maxVal={maxClassCount}/>
          <div style={{
            display: 'flex', gap: 14, marginTop: 10,
            paddingBottom: 20, borderBottom: '1px solid var(--border)',
          }}>
            {[{ label: 'Has classes', color: O }, { label: 'No classes', color: 'var(--surface-3)' }].map(({ label, color }) => (
              <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--text-3)' }}>
                <div style={{ width: 9, height: 9, borderRadius: 3, background: color }}/>
                {label}
              </span>
            ))}
            <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <div style={{ width: 9, height: 9, borderRadius: 3, outline: `2px solid ${O}`, outlineOffset: 1 }}/>
              Today
            </span>
          </div>

          {/* Client Progress Trend */}
          <div style={{ paddingTop: 20 }}>
            <CardHead title="Client Progress Trend"
              right={
                <div style={{ display: 'flex', gap: 10 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-3)' }}>
                    Avg: <strong style={{ color: 'var(--text)' }}>
                      {sparkline.length ? Math.round(sparkline.reduce((a,b)=>a+b,0)/sparkline.length) : 0}%
                    </strong>
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--text-3)' }}>
                    Peak: <strong style={{ color: O }}>{sparkline.length ? Math.max(...sparkline) : 0}%</strong>
                  </span>
                </div>
              }
            />
            <Sparkline data={sparkline} color={O} height={110}/>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              {chartLabels.map((l, i) => (
                <span key={i} style={{ fontSize: 9, color: 'var(--text-3)', fontWeight: 600, flex: 1, textAlign: 'center' }}>{l}</span>
              ))}
            </div>
          </div>
        </Card>

        {/* RIGHT: Upcoming sessions + recent clients */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card style={{ flex: 1 }}>
            <CardHead title="Upcoming Sessions"
              right={upcomingSessions.length > 0 ? <Pill color={B}>{upcomingSessions.length}</Pill> : null}
            />
            {upcomingSessions.length > 0
              ? upcomingSessions.map((s, i) => <SessionRow key={i} {...s}/>)
              : <Empty icon={CalendarDays} msg="No upcoming sessions"/>
            }
          </Card>

          <Card>
            <CardHead title="Recent Clients"
              right={
                <Link to="/coach/clients" style={{ fontSize: 11, color: O, textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
                  All <ChevronRight size={13}/>
                </Link>
              }
            />
            {clients.length > 0
              ? clients.slice(0, 4).map(c => <ClientRow key={c.id} client={c}/>)
              : <Empty icon={Users} msg="No clients yet"/>
            }
          </Card>
        </div>
      </div>

      {/* ── ROW 3: QUICK ACTIONS ── */}
      <div className="dash-anim">
        <Card>
          <CardHead title="Quick Actions"/>
          <div style={{ display: 'grid', gridTemplateColumns: sm ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 10 }}>
            <QuickActionLink to="/coach/clients"  icon={Users}        color={B}  label="Clients"  desc="Manage roster"/>
            <QuickActionLink to="/coach/programs" icon={Dumbbell}     color={O}  label="Programs" desc="Build plans"/>
            <QuickActionLink to="/coach/classes"  icon={CalendarDays} color={O}  label="Classes"  desc="Schedule sessions"/>
            <QuickActionLink to="/coach/profile"  icon={Activity}     color={AM} label="Profile"  desc="Your info"/>
          </div>
        </Card>
      </div>
    </div>
  )
}