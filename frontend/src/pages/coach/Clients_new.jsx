// frontend/src/pages/coach/Clients.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Search, Phone, Mail, Calendar,
  UserCheck, UserX, Clock, Loader2, 
  CheckCircle, X, Eye, TrendingUp, Filter,
  MessageSquare, User, Edit,
  Activity, Dumbbell, Apple, BarChart2, FileText,
  CreditCard, Target, Flame, Zap, Heart
} from 'lucide-react'
import api from '../../api/client'
import toast from 'react-hot-toast'

// ── CLIENT DETAIL PANEL ──────────────────────────────────────────────────────
function ClientDetailPanel({ client, onClose }) {
  const [activeTab, setActiveTab] = useState('overview')

  const tabs = [
    { id: 'overview',  label: 'Overview',  icon: Activity },
    { id: 'sessions',  label: 'Sessions',  icon: Calendar },
    { id: 'program',   label: 'Program',   icon: Dumbbell },
    { id: 'nutrition', label: 'Nutrition', icon: Apple },
    { id: 'progress',  label: 'Progress',  icon: BarChart2 },
    { id: 'notes',     label: 'Notes',     icon: FileText },
    { id: 'payments',  label: 'Payments',  icon: CreditCard },
  ]

  const name = client.user?.name || 'Unknown'
  const email = client.user?.email || '—'
  const phone = client.phone || '—'
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const progress = 40 + (client.id * 7 % 60)
  const attendance = 70 + (client.id * 4 % 30)

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'stretch' }}>
      <div onClick={onClose} style={{ flex: 1, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)', cursor: 'pointer' }} />
      <div style={{
        width: 'min(620px, 100vw)', background: 'var(--bg)',
        borderLeft: '1px solid var(--border)', display: 'flex',
        flexDirection: 'column', overflowY: 'auto',
        animation: 'slideIn 0.22s cubic-bezier(0.22,1,0.36,1)',
      }}>
        <style>{`
          @keyframes slideIn { from { transform: translateX(32px); opacity: 0; } to { transform: none; opacity: 1; } }
          @keyframes spin2 { to { transform: rotate(360deg); } }
        `}</style>

        {/* Panel header + tab bar */}
        <div style={{ padding: '20px 24px 0', borderBottom: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <button onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
              <X size={16} />
            </button>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#FFF0E6', color: '#C56A2A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '16px', flexShrink: 0, border: '2px solid #C56A2A' }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: '17px', color: 'var(--text)', lineHeight: 1.2 }}>{name}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>{email}</div>
            </div>
            <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '99px', background: 'rgba(34,197,94,0.12)', color: '#22C55E', flexShrink: 0 }}>Active</span>
          </div>

          <div style={{ display: 'flex', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {tabs.map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: '13px', fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#C56A2A' : 'var(--text-3)',
                  borderBottom: isActive ? '2px solid #C56A2A' : '2px solid transparent',
                  marginBottom: '-1px', whiteSpace: 'nowrap', transition: 'color 0.15s', flexShrink: 0,
                }}>
                  <Icon size={13} />{tab.label}
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          {activeTab === 'overview'  && <OverviewTab  client={client} progress={progress} attendance={attendance} phone={phone} />}
          {activeTab === 'sessions'  && <SessionsTab  />}
          {activeTab === 'program'   && <ProgramTab   client={client} />}
          {activeTab === 'nutrition' && <NutritionTab />}
          {activeTab === 'progress'  && <ProgressTab  progress={progress} attendance={attendance} />}
          {activeTab === 'notes'     && <NotesTab     />}
          {activeTab === 'payments'  && <PaymentsTab  />}
        </div>
      </div>
    </div>
  )
}

function OverviewTab({ client, progress, attendance, phone }) {
  const stats = [
    { label: 'Progress',   value: `${progress}%`, color: '#C56A2A', icon: Target },
    { label: 'Attendance', value: `${attendance}%`, color: '#22C55E', icon: Flame },
    { label: 'Sessions',   value: '24',            color: '#4D9EF5', icon: Zap },
    { label: 'Streak',     value: '8d',            color: '#A855F7', icon: Heart },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {stats.map((s, i) => {
          const Icon = s.icon
          return (
            <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0, background: s.color + '18', color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} />
              </div>
              <div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text)', lineHeight: 1.1 }}>{s.value}</div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '2px' }}>{s.label}</div>
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Contact</div>
        {[
          { icon: Mail,  label: 'Email', value: client.user?.email || '—' },
          { icon: Phone, label: 'Phone', value: phone },
        ].map((row, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderBottom: i === 0 ? '1px solid var(--border)' : 'none' }}>
            <row.icon size={14} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
            <span style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: 600, width: '48px', flexShrink: 0 }}>{row.label}</span>
            <span style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 500 }}>{row.value}</span>
          </div>
        ))}
      </div>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>Goal Progress</span>
          <span style={{ fontSize: '13px', fontWeight: 800, color: '#C56A2A' }}>{progress}%</span>
        </div>
        <div style={{ height: '8px', background: 'var(--surface-2)', borderRadius: '99px', overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg,#C56A2A,#fb7121)', borderRadius: '99px' }} />
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '8px' }}>On track — goal completion est. 6 weeks</div>
      </div>
    </div>
  )
}

function SessionsTab() {
  const sessions = [
    { type: 'Strength Training',      date: 'Today, 10:00 AM',   status: 'upcoming',  duration: '60 min' },
    { type: 'HIIT Cardio',            date: 'Jun 24, 9:00 AM',   status: 'completed', duration: '45 min' },
    { type: 'Flexibility & Mobility', date: 'Jun 22, 11:00 AM',  status: 'completed', duration: '50 min' },
    { type: 'Strength Training',      date: 'Jun 20, 9:00 AM',   status: 'completed', duration: '60 min' },
    { type: 'Rest Day Check-in',      date: 'Jun 18, 10:00 AM',  status: 'missed',    duration: '15 min' },
  ]
  const st = { upcoming: { bg: 'rgba(77,158,245,0.12)', color: '#4D9EF5', label: 'Upcoming' }, completed: { bg: 'rgba(34,197,94,0.12)', color: '#22C55E', label: 'Completed' }, missed: { bg: 'rgba(239,68,68,0.12)', color: '#EF4444', label: 'Missed' } }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>Session History</span>
        <button style={{ fontSize: '12px', fontWeight: 600, color: '#C56A2A', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>+ Schedule New</button>
      </div>
      {sessions.map((s, i) => {
        const style = st[s.status]
        return (
          <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: style.color, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{s.type}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>{s.date} · {s.duration}</div>
            </div>
            <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 9px', borderRadius: '99px', background: style.bg, color: style.color, flexShrink: 0 }}>{style.label}</span>
          </div>
        )
      })}
    </div>
  )
}

function ProgramTab({ client }) {
  const weeks = [
    { week: 'Week 1', days: ['Strength','Cardio','Rest','Strength','HIIT','Rest','Rest'], done: 7 },
    { week: 'Week 2', days: ['Strength','Cardio','Rest','Strength','HIIT','Rest','Rest'], done: 7 },
    { week: 'Week 3', days: ['Strength','Mobility','Rest','Strength','HIIT','Rest','Rest'], done: 5 },
    { week: 'Week 4', days: ['Strength','Cardio','Rest','Strength','HIIT','Rest','Rest'], done: 2 },
  ]
  const typeColor = { Strength: '#C56A2A', Cardio: '#4D9EF5', HIIT: '#A855F7', Mobility: '#22C55E', Rest: 'var(--border)' }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px 16px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>12-Week Strength Program</div>
        <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Phase 1 of 3 · Week 3 / 12</div>
        <div style={{ height: '6px', background: 'var(--surface-2)', borderRadius: '99px', marginTop: '10px', overflow: 'hidden' }}>
          <div style={{ width: '25%', height: '100%', background: 'linear-gradient(90deg,#C56A2A,#fb7121)', borderRadius: '99px' }} />
        </div>
      </div>
      {weeks.map((w, i) => (
        <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)' }}>{w.week}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>{w.done}/7 days</span>
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {w.days.map((d, j) => (
              <div key={j} title={d} style={{ flex: 1, height: '28px', borderRadius: '6px', background: j < w.done ? (typeColor[d] || '#C56A2A') : 'var(--surface-2)', opacity: d === 'Rest' ? 0.3 : 1 }} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
            {[...new Set(w.days.filter(d => d !== 'Rest'))].map((type, j) => (
              <span key={j} style={{ fontSize: '10px', fontWeight: 600, color: typeColor[type] || 'var(--text-3)' }}>● {type}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function NutritionTab() {
  const macros = [
    { label: 'Protein', val: 165, target: 180, unit: 'g', color: '#C56A2A' },
    { label: 'Carbs',   val: 220, target: 250, unit: 'g', color: '#4D9EF5' },
    { label: 'Fat',     val: 68,  target: 80,  unit: 'g', color: '#A855F7' },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>Today's Calories</div>
          <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>Target: 2,200 kcal</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#C56A2A', lineHeight: 1.1 }}>1,843</div>
          <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>kcal logged</div>
        </div>
      </div>
      {macros.map((m, i) => (
        <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>{m.label}</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: m.color }}>{m.val}{m.unit} <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>/ {m.target}{m.unit}</span></span>
          </div>
          <div style={{ height: '6px', background: 'var(--surface-2)', borderRadius: '99px', overflow: 'hidden' }}>
            <div style={{ width: `${(m.val / m.target) * 100}%`, height: '100%', background: m.color, borderRadius: '99px' }} />
          </div>
        </div>
      ))}
      <div style={{ textAlign: 'center', padding: '24px', background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: '12px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-2)' }}>No meal plan assigned</div>
        <button style={{ marginTop: '10px', padding: '7px 18px', borderRadius: '8px', border: 'none', background: '#C56A2A', color: '#fff', fontWeight: 700, fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
          Assign Meal Plan
        </button>
      </div>
    </div>
  )
}

function ProgressTab({ progress, attendance }) {
  const metrics = [
    { label: 'Weight',   values: [84, 83.2, 82.5, 81.8, 81.1, 80.6], unit: 'kg', color: '#C56A2A' },
    { label: 'Body Fat', values: [22, 21.4, 20.8, 20.2, 19.8, 19.3], unit: '%',  color: '#4D9EF5' },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {metrics.map((m, i) => {
        const min = Math.min(...m.values), max = Math.max(...m.values), range = max - min || 1
        const last = m.values[m.values.length - 1], first = m.values[0]
        const delta = (last - first).toFixed(1)
        return (
          <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>{m.label}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>Last 6 weeks</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: m.color }}>{last}{m.unit}</div>
                <div style={{ fontSize: '11px', color: delta < 0 ? '#22C55E' : '#EF4444', fontWeight: 600 }}>{delta > 0 ? '+' : ''}{delta}{m.unit}</div>
              </div>
            </div>
            <svg viewBox="0 0 200 48" width="100%" height="48" style={{ overflow: 'visible' }}>
              <defs>
                <linearGradient id={`g${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={m.color} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={m.color} stopOpacity="0" />
                </linearGradient>
              </defs>
              {(() => {
                const pts = m.values.map((v, j) => ({ x: (j / (m.values.length - 1)) * 200, y: 44 - ((v - min) / range) * 40 }))
                const line = pts.map(p => `${p.x},${p.y}`).join(' ')
                const area = `M${pts[0].x},${pts[0].y} ` + pts.slice(1).map(p => `L${p.x},${p.y}`).join(' ') + ` L${pts[pts.length-1].x},48 L${pts[0].x},48 Z`
                return (<>
                  <path d={area} fill={`url(#g${i})`} />
                  <polyline points={line} fill="none" stroke={m.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx={pts[pts.length-1].x} cy={pts[pts.length-1].y} r="4" fill={m.color} />
                </>)
              })()}
            </svg>
          </div>
        )
      })}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {[
          { label: 'Program Progress', value: `${progress}%`, sub: 'of 12-week program', color: '#C56A2A' },
          { label: 'Attendance Rate',  value: `${attendance}%`, sub: 'this month',       color: '#22C55E' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px' }}>
            <div style={{ fontSize: '22px', fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)', marginTop: '2px' }}>{s.label}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{s.sub}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function NotesTab() {
  const [notes, setNotes] = useState([
    { id: 1, text: 'Client is responding well to progressive overload. Increased bench press by 5kg this week.', date: 'Jun 24, 2026', pinned: true },
    { id: 2, text: 'Mentioned lower back discomfort after deadlifts. Monitor form closely next session. Suggested mobility work.', date: 'Jun 22, 2026', pinned: false },
    { id: 3, text: 'Initial assessment complete. Goal: lose 8kg in 12 weeks. Starting weight 84kg, body fat 22%.', date: 'Jun 10, 2026', pinned: false },
  ])
  const [newNote, setNewNote] = useState('')
  const [saving, setSaving] = useState(false)

  const addNote = () => {
    if (!newNote.trim()) return
    setSaving(true)
    setTimeout(() => {
      setNotes(prev => [{ id: Date.now(), text: newNote.trim(), date: 'Today', pinned: false }, ...prev])
      setNewNote('')
      setSaving(false)
    }, 400)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <textarea
          value={newNote}
          onChange={e => setNewNote(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) addNote() }}
          placeholder="Add a coaching note… (⌘+Enter to save)"
          rows={3}
          style={{ width: '100%', padding: '12px 14px', border: 'none', background: 'transparent', color: 'var(--text)', fontFamily: 'inherit', fontSize: '13px', resize: 'none', outline: 'none' }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 12px', borderTop: '1px solid var(--border)', background: 'var(--surface-2)' }}>
          <button
            onClick={addNote}
            disabled={!newNote.trim() || saving}
            style={{ padding: '6px 16px', borderRadius: '7px', border: 'none', background: newNote.trim() ? '#C56A2A' : 'var(--border)', color: newNote.trim() ? '#fff' : 'var(--text-3)', fontWeight: 700, fontSize: '12px', cursor: newNote.trim() ? 'pointer' : 'default', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {saving && <Loader2 size={12} style={{ animation: 'spin2 0.8s linear infinite' }} />}
            Save Note
          </button>
        </div>
      </div>
      {notes.map(note => (
        <div key={note.id} style={{ background: 'var(--surface)', borderRadius: '10px', padding: '14px', borderLeft: note.pinned ? '3px solid #C56A2A' : '1px solid var(--border)', border: note.pinned ? undefined : '1px solid var(--border)' }}>
          {note.pinned && <div style={{ fontSize: '10px', fontWeight: 700, color: '#C56A2A', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>★ Pinned</div>}
          <div style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.6 }}>{note.text}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '8px' }}>{note.date}</div>
        </div>
      ))}
    </div>
  )
}

function PaymentsTab() {
  const payments = [
    { id: 'INV-001', amount: 12000, status: 'paid',    date: 'Jun 1, 2026',  desc: 'Monthly Coaching — June' },
    { id: 'INV-002', amount: 12000, status: 'paid',    date: 'May 1, 2026',  desc: 'Monthly Coaching — May' },
    { id: 'INV-003', amount: 12000, status: 'overdue', date: 'Apr 1, 2026',  desc: 'Monthly Coaching — April' },
    { id: 'INV-004', amount: 3000,  status: 'paid',    date: 'Mar 15, 2026', desc: 'Nutrition Plan (one-time)' },
  ]
  const stMap = {
    paid:    { bg: 'rgba(34,197,94,0.12)',  color: '#22C55E', label: 'Paid' },
    overdue: { bg: 'rgba(239,68,68,0.12)', color: '#EF4444', label: 'Overdue' },
    pending: { bg: 'rgba(251,168,33,0.12)', color: '#FBA821', label: 'Pending' },
  }
  const total = payments.reduce((s, p) => s + p.amount, 0)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>Total Revenue</div>
          <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>All time</div>
        </div>
        <div style={{ fontSize: '28px', fontWeight: 900, color: '#C56A2A' }}>
          {total.toLocaleString()} <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-3)' }}>DZD</span>
        </div>
      </div>
      {payments.map((p, i) => {
        const s = stMap[p.status]
        return (
          <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{p.desc}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>{p.id} · {p.date}</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text)' }}>{p.amount.toLocaleString()} DZD</div>
              <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '99px', background: s.bg, color: s.color }}>{s.label}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function CoachClients() {
  const [clients, setClients] = useState([])
  const [pendingClients, setPendingClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('approved')
  const [processingId, setProcessingId] = useState(null)
  const [selectedClient, setSelectedClient] = useState(null)

  useEffect(() => { fetchAllData() }, [])

  const fetchAllData = async () => {
    setLoading(true)
    try { await Promise.all([fetchClients(), fetchPendingClients()]) }
    catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const fetchClients = async () => {
    try { const r = await api.get('/coach/clients'); setClients(r.data || []) }
    catch { setClients([]) }
  }

  const fetchPendingClients = async () => {
    try { const r = await api.get('/coach/clients/pending'); setPendingClients(r.data || []) }
    catch { setPendingClients([]) }
  }

  const handleApprove = async (id, name) => {
    setProcessingId(id)
    try { await api.post(`/coach/clients/approve/${id}`); toast.success(`${name} approved! 🎉`); await fetchAllData() }
    catch (e) { toast.error(e.response?.data?.detail || 'Failed to approve') }
    finally { setProcessingId(null) }
  }

  const handleDecline = async (id, name) => {
    setProcessingId(id)
    try { await api.post(`/coach/clients/decline/${id}`); toast.success(`${name} declined`); await fetchPendingClients() }
    catch (e) { toast.error(e.response?.data?.detail || 'Failed to decline') }
    finally { setProcessingId(null) }
  }

  const filteredClients = clients.filter(c => {
    const s = search.toLowerCase()
    return (c.user?.name?.toLowerCase() || '').includes(s) || (c.user?.email?.toLowerCase() || '').includes(s) || (c.phone?.toLowerCase() || '').includes(s)
  })

  const filteredPending = pendingClients.filter(c => {
    const s = search.toLowerCase()
    return (c.client_name?.toLowerCase() || '').includes(s) || (c.client_email?.toLowerCase() || '').includes(s) || (c.client_phone?.toLowerCase() || '').includes(s)
  })

  if (loading) return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px' }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <span style={{ color: 'var(--text-3)', fontSize: '13px', fontWeight: 600 }}>Loading clients…</span>
    </div>
  )

  const totalPending = pendingClients.length
  const totalApproved = clients.length
  const totalClients = totalApproved + totalPending
  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?'
  const dateString = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--text)', fontFamily: "'Inter', -apple-system, sans-serif", padding: '0', minHeight: '100vh', boxSizing: 'border-box', maxWidth: '1440px', margin: '0 auto' }}>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }
        ::-webkit-scrollbar-track { background: transparent; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .list-row { display: flex; align-items: center; padding: 18px 24px; background: var(--surface); border: 1px solid var(--border); border-radius: 14px; margin-bottom: 12px; gap: 0; cursor: pointer; transition: border-color 0.15s, box-shadow 0.15s; }
        .list-row:hover { border-color: rgba(255,90,31,0.5); box-shadow: 0 0 0 1px rgba(255,90,31,0.1); }

        .col-left { display: flex; align-items: center; gap: 16px; flex: 0.48; padding-right: 24px; border-right: 1px solid var(--border); min-width: 200px; }
        .client-avatar { width: 52px; height: 52px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; flex-shrink: 0; border: 2px solid #C56A2A; }
        .client-details { display: flex; flex-direction: column; gap: 2px; min-width: 0; width: 100%; }
        .detail-top-row { display: flex; align-items: center; gap: 10px; margin-bottom: 2px; flex-wrap: wrap; }
        .client-name { font-size: 16px; font-weight: 700; color: var(--text); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .status-pill { font-size: 10px; font-weight: 600; padding: 2px 10px; border-radius: 99px; display: inline-flex; align-items: center; background: rgba(255,90,31,0.12); color: #C56A2A; flex-shrink: 0; }
        .status-pill.pending { background: rgba(77,158,245,0.15); color: #4D9EF5; }
        .detail-sub-row { display: flex; align-items: center; gap: 4px; font-size: 13px; color: var(--text-3); }
        .detail-sub-row span { display: flex; align-items: center; gap: 4px; }
        .detail-sub-row svg { width: 14px; height: 14px; flex-shrink: 0; }

        .col-phone { display: flex; flex-direction: column; justify-content: center; width: 160px; flex-shrink: 0; padding: 0 16px 0 24px; border-right: 1px solid var(--border); }
        .phone-number { font-size: 13px; font-weight: 500; color: var(--text-2); line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; }
        .phone-label { font-size: 10px; font-weight: 600; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.03em; margin-top: 2px; }

        .col-center { flex: 1; padding: 0 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: center; max-width: 320px; margin-left: auto; }
        .stat-block { display: flex; flex-direction: column; gap: 4px; }
        .stat-numbers { display: flex; justify-content: space-between; font-size: 14px; font-weight: 700; color: var(--text); }
        .stat-label { font-size: 10px; font-weight: 600; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.03em; }
        .progress-track { width: 100%; height: 5px; background: var(--surface-2); border-radius: 99px; overflow: hidden; margin-top: 2px; }
        .progress-fill { height: 100%; background: #C56A2A; border-radius: 99px; }

        .col-right { display: flex; align-items: center; width: 200px; flex-shrink: 0; padding-left: 24px; border-left: 1px solid var(--border); justify-content: space-between; gap: 16px; }
        .timestamp { font-size: 12px; color: var(--text-2); white-space: nowrap; display: flex; flex-direction: column; line-height: 1.4; }
        .timestamp .sub { font-size: 11px; color: var(--text-3); }
        .action-group { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
        .flat-btn { width: 34px; height: 34px; border-radius: 8px; border: 1px solid transparent; background: transparent; color: var(--text-3); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s ease; padding: 0; text-decoration: none; }
        .flat-btn:hover { background: var(--surface-2); border-color: #C56A2A; color: #C56A2A; }
        .flat-btn svg { width: 16px; height: 16px; }

        .toolbar { display: flex; align-items: center; gap: 0; background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 6px 6px 6px 16px; margin-bottom: 28px; flex-wrap: wrap; }
        .toolbar-search { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 160px; color: var(--text-3); }
        .toolbar-search input { flex: 1; border: none; background: transparent; font-size: 14px; color: var(--text); outline: none; font-family: inherit; }
        .toolbar-divider { width: 1px; height: 20px; background: var(--border); margin: 0 12px; }
        .toolbar-select { border: none; background: transparent; color: var(--text-2); font-size: 13px; font-weight: 500; padding: 6px 8px 6px 4px; cursor: pointer; outline: none; font-family: inherit; }
        .btn-filter { display: flex; align-items: center; gap: 6px; padding: 8px 16px; border: none; border-radius: 8px; background: var(--surface-2); color: var(--text-2); font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; margin-left: auto; }

        @media (max-width: 1100px) {
          .list-row { flex-wrap: wrap; padding: 16px; gap: 12px; }
          .col-left { width: 100%; flex: none; padding-right: 0; border-right: none; border-bottom: 1px solid var(--border); padding-bottom: 12px; }
          .col-phone { width: 100%; padding: 12px 0; border: none; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); flex-direction: row; align-items: center; justify-content: center; gap: 8px; }
          .col-center { width: 100%; max-width: 100%; margin-left: 0; padding: 12px 0; }
          .col-right { width: 100%; padding-left: 0; border-left: none; justify-content: space-between; padding-top: 12px; }
        }
      `}</style>

      {/* HEADER */}
      <div style={{ marginBottom: '32px' }}>
        <p style={{ fontSize: '10px', color: '#C56A2A', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, margin: '0 0 4px 0' }}>Coach Portal</p>
        <h1 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 4px 0', color: 'var(--text)' }}>My Clients</h1>
        <p style={{ fontSize: '15px', color: 'var(--text-3)', margin: 0 }}>{dateString}</p>
      </div>

      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: 'Total Clients',    value: totalClients,  icon: UserCheck,  color: '#C56A2A', bg: 'rgba(255,90,31,0.12)' },
          { label: 'Active Members',   value: totalApproved, icon: UserCheck,  color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
          { label: 'Pending Requests', value: totalPending,  icon: Clock,      color: '#4D9EF5', bg: 'rgba(77,158,245,0.12)' },
          { label: 'New This Month',   value: clients.filter(c => { const d = new Date(c.created_at); const n = new Date(); return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear() }).length, icon: TrendingUp, color: '#A855F7', bg: 'rgba(168,85,247,0.12)' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: s.bg, color: s.color, flexShrink: 0 }}><s.icon size={20} /></div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text)', lineHeight: 1.1 }}>{s.value}</div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-3)', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* TOOLBAR */}
      <div className="toolbar">
        <div className="toolbar-search">
          <Search size={16} />
          <input type="text" placeholder="Search clients by name, email or phone..." value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', padding: '4px' }}><X size={14} /></button>}
        </div>
        <div className="toolbar-divider" />
        {/* FIXED dropdown — unique values for each option */}
        <select className="toolbar-select" value={activeTab} onChange={e => { setActiveTab(e.target.value); setSearch('') }}>
          <option value="approved">Active</option>
          <option value="pending">Pending {totalPending > 0 ? `(${totalPending})` : ''}</option>
        </select>
        <div className="toolbar-divider" />
        <select className="toolbar-select" disabled style={{ opacity: 0.6 }}><option>All Programs</option></select>
        <button className="btn-filter"><Filter size={14} /> Filter</button>
      </div>

      {/* LIST */}
      {activeTab === 'approved' ? (
        <div>
          {filteredClients.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: '14px' }}>
              <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-2)', margin: 0 }}>No active clients found</p>
              <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '6px' }}>Try adjusting your search or filters.</p>
            </div>
          ) : filteredClients.map(client => {
            const progress = 40 + (client.id * 7 % 60)
            const attendance = 70 + (client.id * 4 % 30)
            const lastCheckin = (client.id * 3 % 7) + 1
            return (
              <div key={client.id} className="list-row" onClick={() => setSelectedClient(client)}>
                <div className="col-left">
                  <div className="client-avatar" style={{ background: '#FFF0E6', color: '#C56A2A' }}>{getInitials(client.user?.name)}</div>
                  <div className="client-details">
                    <div className="detail-top-row">
                      <span className="client-name">{client.user?.name || 'Unknown Member'}</span>
                      <span className="status-pill">{client.is_active !== false ? 'Active' : 'Inactive'}</span>
                    </div>
                    <div className="detail-sub-row"><span><Mail size={14} /> {client.user?.email || 'email@example.com'}</span></div>
                  </div>
                </div>
                <div className="col-phone">
                  <span className="phone-number">{client.phone || '+213 555 67 89'}</span>
                  <span className="phone-label">Phone</span>
                </div>
                <div className="col-center">
                  <div className="stat-block">
                    <div className="stat-numbers"><span>{progress}%</span></div>
                    <div className="stat-label">Progress</div>
                    <div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
                  </div>
                  <div className="stat-block">
                    <div className="stat-numbers"><span>{attendance}%</span></div>
                    <div className="stat-label">Attendance</div>
                  </div>
                </div>
                <div className="col-right">
                  <div className="timestamp">
                    <span>{lastCheckin} days ago</span>
                    <span className="sub">Last Check-in</span>
                  </div>
                  <div className="action-group" onClick={e => e.stopPropagation()}>
                    <button className="flat-btn" title="Message"><MessageSquare size={16} /></button>
                    <button className="flat-btn" title="View profile" onClick={e => { e.stopPropagation(); setSelectedClient(client) }}><Eye size={16} /></button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div>
          {filteredPending.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: '14px' }}>
              <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-2)', margin: 0 }}>No pending requests</p>
              <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '6px' }}>You're all caught up!</p>
            </div>
          ) : filteredPending.map(req => (
            <div key={req.id} className="list-row" style={{ borderColor: 'rgba(77,158,245,0.2)' }}>
              <div className="col-left">
                <div className="client-avatar" style={{ background: 'rgba(77,158,245,0.15)', color: '#4D9EF5', borderColor: '#4D9EF5' }}>{getInitials(req.client_name)}</div>
                <div className="client-details">
                  <div className="detail-top-row">
                    <span className="client-name">{req.client_name || 'Unknown'}</span>
                    <span className="status-pill pending">Pending</span>
                  </div>
                  <div className="detail-sub-row"><span><Mail size={14} /> {req.client_email || '—'}</span></div>
                </div>
              </div>
              <div className="col-phone">
                <span className="phone-number">{req.client_phone || '—'}</span>
                <span className="phone-label">Phone</span>
              </div>
              <div className="col-center" style={{ maxWidth: '160px' }}>
                <div className="stat-block">
                  <div className="stat-numbers" style={{ color: 'var(--text-3)', fontSize: '12px' }}>Pending</div>
                  <div className="stat-label">Status</div>
                </div>
                <div className="stat-block" style={{ alignItems: 'flex-end', textAlign: 'right' }}>
                  <div className="stat-numbers" style={{ color: 'var(--text-3)', fontSize: '12px' }}>Awaiting</div>
                  <div className="stat-label">Decision</div>
                </div>
              </div>
              <div className="col-right">
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%', justifyContent: 'flex-end' }}>
                  <button onClick={() => handleApprove(req.id, req.client_name)} disabled={processingId === req.id}
                    style={{ padding: '6px 18px', borderRadius: '8px', border: 'none', background: '#22C55E', color: '#fff', fontWeight: 600, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit' }}>
                    {processingId === req.id ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <UserCheck size={14} />} Approve
                  </button>
                  <button onClick={() => handleDecline(req.id, req.client_name)} disabled={processingId === req.id}
                    style={{ padding: '6px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-3)', fontWeight: 600, fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
                    Decline
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedClient && <ClientDetailPanel client={selectedClient} onClose={() => setSelectedClient(null)} />}
    </div>
  )
}