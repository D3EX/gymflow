// frontend/src/pages/coach/ClientDetail.jsx

import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Mail, Phone, Activity, Calendar, Dumbbell,
  Apple, BarChart2, FileText, CreditCard,
  Target, Flame, Zap, Heart, Loader2, Plus, X,
  Calendar as CalendarIcon, Clock, Check, AlertCircle
} from 'lucide-react'
import api from '../../api/client'

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const TABS = [
  { id: 'overview',  label: 'Overview',  icon: Activity  },
  { id: 'sessions',  label: 'Sessions',  icon: Calendar  },
  { id: 'program',   label: 'Program',   icon: Dumbbell  },
  { id: 'nutrition', label: 'Nutrition', icon: Apple     },
  { id: 'progress',  label: 'Progress',  icon: BarChart2 },
  { id: 'notes',     label: 'Notes',     icon: FileText  },
  { id: 'payments',  label: 'Payments',  icon: CreditCard},
]

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

const STATUS_STYLES = {
  upcoming:  { bg: 'rgba(77,158,245,0.12)',  color: '#4D9EF5', label: 'Upcoming'  },
  completed: { bg: 'rgba(34,197,94,0.12)',   color: '#22C55E', label: 'Completed' },
  missed:    { bg: 'rgba(239,68,68,0.12)',   color: '#EF4444', label: 'Missed'    },
  cancelled: { bg: 'rgba(239,68,68,0.08)',   color: '#EF4444', label: 'Cancelled' },
  pending:   { bg: 'rgba(251,168,33,0.12)',  color: '#FBA821', label: 'Pending'   },
}

const PAYMENT_STATUS = {
  paid:    { bg: 'rgba(34,197,94,0.12)',   color: '#22C55E', label: 'Paid'    },
  overdue: { bg: 'rgba(239,68,68,0.12)',   color: '#EF4444', label: 'Overdue' },
  pending: { bg: 'rgba(251,168,33,0.12)',  color: '#FBA821', label: 'Pending' },
}

const getInitials = (name) =>
  name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?'

// ─── MODAL COMPONENT ────────────────────────────────────────────────────────

function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null

  const sizeStyles = {
    sm: { width: '400px' },
    md: { width: '480px' },
    lg: { width: '560px' }
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      animation: 'fadeIn 0.2s ease'
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
      <div style={{
        ...sizeStyles[size],
        background: 'var(--surface)',
        borderRadius: '16px',
        border: '1px solid var(--border)',
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflow: 'auto',
        animation: 'slideUp 0.25s ease'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text)', margin: 0 }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-3)', padding: '4px',
              transition: 'color 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [client, setClient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [refreshing, setRefreshing] = useState(false)
  const [modal, setModal] = useState(null) // 'session' | 'program' | 'meal' | 'invoice'

  const fetchClient = useCallback(async () => {
    try {
      setRefreshing(true)
      const res = await api.get(`/coach/clients/${id}/detail`)
      setClient(res.data)
      setError(null)
    } catch (err) {
      console.error('Error fetching client:', err)
      setError(err.response?.data?.detail || 'Failed to load client data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [id])

  useEffect(() => {
    fetchClient()
  }, [fetchClient])

  if (loading) {
    return (
      <div style={{
        background: 'var(--bg)', minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '14px'
      }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%',
          border: '3px solid var(--border)', borderTopColor: '#C56A2A',
          animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ color: 'var(--text-3)', fontSize: '13px', fontWeight: 600 }}>
          Loading client…
        </span>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        background: 'var(--bg)', minHeight: '100vh',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: '16px', padding: '24px'
      }}>
        <AlertCircle size={48} style={{ color: '#EF4444' }} />
        <h2 style={{ color: 'var(--text)', fontSize: '20px', fontWeight: 700 }}>
          Error Loading Client
        </h2>
        <p style={{ color: 'var(--text-3)', fontSize: '14px', textAlign: 'center' }}>
          {error}
        </p>
        <button
          onClick={() => navigate('/coach/clients')}
          style={{
            padding: '10px 24px', borderRadius: '8px',
            background: '#C56A2A', color: '#fff',
            border: 'none', fontWeight: 700, fontSize: '14px',
            cursor: 'pointer', fontFamily: 'inherit'
          }}
        >
          Back to Clients
        </button>
      </div>
    )
  }

  if (!client) {
    return (
      <div style={{
        background: 'var(--bg)', minHeight: '100vh',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: '16px'
      }}>
        <h2 style={{ color: 'var(--text)', fontSize: '20px', fontWeight: 700 }}>
          Client Not Found
        </h2>
        <button
          onClick={() => navigate('/coach/clients')}
          style={{
            padding: '10px 24px', borderRadius: '8px',
            background: '#C56A2A', color: '#fff',
            border: 'none', fontWeight: 700, fontSize: '14px',
            cursor: 'pointer', fontFamily: 'inherit'
          }}
        >
          Back to Clients
        </button>
      </div>
    )
  }

  const name = client.name || 'Unknown'
  const email = client.email || '—'
  const phone = client.phone || '—'
  const initials = getInitials(name)

  return (
    <div style={{
      background: 'var(--bg)', color: 'var(--text)',
      fontFamily: "'Inter', -apple-system, sans-serif",
      minHeight: '100vh', maxWidth: '1440px', margin: '0 auto',
      
    }}>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }
        ::-webkit-scrollbar-track { background: transparent; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes spin2 { to { transform: rotate(360deg); } }
        .refresh-btn { transition: transform 0.3s ease; }
        .refresh-btn.spinning { animation: spin 0.8s linear infinite; }
        input, select, textarea {
          font-family: inherit;
        }
      `}</style>

      {/* ── TOP HEADER ── */}
      <div style={{ marginBottom: '28px' }}>
        <button
          onClick={() => navigate('/coach/clients')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-3)', fontSize: '13px', fontWeight: 600,
            padding: '0 0 18px 0', fontFamily: 'inherit',
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#C56A2A'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
        >
          <ArrowLeft size={14} /> Back to Clients
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <p style={{
              fontSize: '10px', color: '#C56A2A', textTransform: 'uppercase',
              letterSpacing: '0.12em', fontWeight: 700, margin: '0 0 4px 0'
            }}>
              Coach Portal
            </p>
            <h1 style={{
              fontSize: '32px', fontWeight: 800, letterSpacing: '-0.02em',
              margin: '0 0 4px 0', color: 'var(--text)'
            }}>
              Client Profile
            </h1>
            <p style={{ fontSize: '15px', color: 'var(--text-3)', margin: 0 }}>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long', month: 'long', day: 'numeric'
              })}
            </p>
          </div>
          <button
            onClick={fetchClient}
            className="refresh-btn"
            disabled={refreshing}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 16px', borderRadius: '8px',
              background: 'var(--surface)', border: '1px solid var(--border)',
              color: 'var(--text-3)', fontWeight: 600, fontSize: '13px',
              cursor: 'pointer', fontFamily: 'inherit',
              transition: 'all 0.15s'
            }}
            onMouseEnter={e => {
              if (!refreshing) e.currentTarget.style.borderColor = '#C56A2A'
            }}
            onMouseLeave={e => {
              if (!refreshing) e.currentTarget.style.borderColor = 'var(--border)'
            }}
          >
            <Loader2 size={14} className={refreshing ? 'spinning' : ''} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* ── PROFILE CARD ── */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '16px', padding: '24px 28px', marginBottom: '24px',
        display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap',
      }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '18px', flexShrink: 0,
          background: '#FFF0E6', color: '#C56A2A', border: '2px solid #C56A2A',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: '20px',
        }}>
          {initials}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text)' }}>
              {name}
            </span>
            <span style={{
              fontSize: '10px', fontWeight: 700, padding: '3px 10px',
              borderRadius: '99px',
              background: client.status === 'active' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
              color: client.status === 'active' ? '#22C55E' : '#EF4444',
            }}>
              {client.status === 'active' ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '20px', marginTop: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Mail size={13} /> {email}
            </span>
            <span style={{ fontSize: '13px', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Phone size={13} /> {phone}
            </span>
            {client.membership_plan && (
              <span style={{ fontSize: '13px', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Target size={13} /> {client.membership_plan}
              </span>
            )}
          </div>
        </div>

        {/* Quick stats */}
        <div style={{ display: 'flex', gap: '32px', flexShrink: 0 }}>
          {[
            { label: 'Progress',   value: `${Math.round(client.progress || 0)}%`, color: '#C56A2A' },
            { label: 'Attendance', value: `${Math.round(client.attendance_rate || 0)}%`, color: '#22C55E' },
            { label: 'Sessions',   value: client.session_count || 0, color: '#4D9EF5' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '22px', fontWeight: 900, color: s.color, lineHeight: 1.1 }}>
                {s.value}
              </div>
              <div style={{
                fontSize: '10px', fontWeight: 600, color: 'var(--text-3)',
                textTransform: 'uppercase', letterSpacing: '0.05em',
                marginTop: '3px'
              }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── TAB BAR ── */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '12px', padding: '4px', marginBottom: '24px',
        display: 'flex', gap: '2px', overflowX: 'auto', scrollbarWidth: 'none',
      }}>
        {TABS.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                padding: '9px 16px', borderRadius: '8px',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                fontSize: '13px', fontWeight: isActive ? 700 : 500,
                color: isActive ? '#C56A2A' : 'var(--text-3)',
                background: isActive ? 'rgba(255,90,31,0.1)' : 'transparent',
                whiteSpace: 'nowrap', flexShrink: 0,
                transition: 'all 0.15s',
              }}
            >
              <Icon size={14} />{tab.label}
            </button>
          )
        })}
      </div>

      {/* ── TAB CONTENT ── */}
      <div>
        {activeTab === 'overview' && <OverviewTab client={client} onOpenModal={setModal} />}
        {activeTab === 'sessions' && <SessionsTab client={client} onOpenModal={setModal} />}
        {activeTab === 'program' && <ProgramTab client={client} onOpenModal={setModal} />}
        {activeTab === 'nutrition' && <NutritionTab client={client} onOpenModal={setModal} />}
        {activeTab === 'progress' && <ProgressTab client={client} onOpenModal={setModal} onRefresh={fetchClient} />}
        {activeTab === 'notes' && <NotesTab clientId={client.id} />}
        {activeTab === 'payments' && <PaymentsTab client={client} onOpenModal={setModal} />}
      </div>

      {/* ── MODALS ── */}
      <Modal
        isOpen={modal === 'session'}
        onClose={() => setModal(null)}
        title="Schedule Session"
        size="lg"
      >
        <ScheduleSessionForm clientId={client.id} onClose={() => setModal(null)} onSuccess={fetchClient} />
      </Modal>

      <Modal
        isOpen={modal === 'program'}
        onClose={() => setModal(null)}
        title="Assign Program"
        size="lg"
      >
        <AssignProgramForm clientId={client.id} onClose={() => setModal(null)} onSuccess={fetchClient} />
      </Modal>

      <Modal
        isOpen={modal === 'meal'}
        onClose={() => setModal(null)}
        title="Assign Meal Plan"
        size="lg"
      >
        <AssignMealPlanForm clientId={client.id} onClose={() => setModal(null)} onSuccess={fetchClient} />
      </Modal>

      <Modal
        isOpen={modal === 'invoice'}
        onClose={() => setModal(null)}
        title="Create Invoice"
        size="md"
      >
        <CreateInvoiceForm clientId={client.id} onClose={() => setModal(null)} onSuccess={fetchClient} />
      </Modal>

      <Modal
        isOpen={modal === 'measurement'}
        onClose={() => setModal(null)}
        title="Log Measurement"
        size="md"
      >
        <LogMeasurementForm clientId={client.id} onClose={() => setModal(null)} onSuccess={fetchClient} />
      </Modal>
    </div>
  )
}

// ── OVERVIEW TAB ─────────────────────────────────────────────────────────────

function OverviewTab({ client, onOpenModal }) {
  const recentSessions = (client.sessions || []).slice(0, 5)
  const nextSession = client.next_session
  const program = client.program

  const kpis = [
    { label: 'Progress',   value: `${Math.round(client.progress || 0)}%`,        color: '#C56A2A', icon: Target,   sub: 'program complete'      },
    { label: 'Attendance', value: `${Math.round(client.attendance_rate || 0)}%`, color: '#22C55E', icon: Flame,    sub: 'last 30 days'          },
    { label: 'Sessions',   value: client.session_count || 0,                     color: '#4D9EF5', icon: Zap,      sub: 'total completed'       },
    { label: 'Streak',     value: `${client.streak || 0}d`,                      color: '#A855F7', icon: Heart,    sub: 'current streak'        },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* ── KPI row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {kpis.map((s, i) => {
          const Icon = s.icon
          return (
            <div key={i} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '12px', padding: '18px 20px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: s.color + '18', color: s.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <Icon size={17} />
                </div>
              </div>
              <div style={{ fontSize: '28px', fontWeight: 900, color: s.color, lineHeight: 1, letterSpacing: '-0.02em', marginBottom: '4px' }}>
                {s.value}
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginBottom: '2px' }}>{s.label}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{s.sub}</div>
            </div>
          )
        })}
      </div>

      {/* ── Main 2-col ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '16px', alignItems: 'stretch' }}>

        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Next session highlight */}
          {nextSession ? (
            <div style={{
              background: 'var(--surface)', border: '1px solid rgba(255,90,31,0.3)',
              borderRadius: '12px', padding: '20px 24px',
              display: 'flex', alignItems: 'center', gap: '20px'
            }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px',
                background: 'rgba(255,90,31,0.12)', color: '#C56A2A',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <CalendarIcon size={22} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#C56A2A', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
                  Next Session
                </div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text)', marginBottom: '3px' }}>
                  {new Date(nextSession.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>
                  {nextSession.time} · {nextSession.duration || 60} min · {nextSession.type || 'Training'}
                </div>
              </div>
              <button
                onClick={() => onOpenModal('session')}
                style={{
                  padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(255,90,31,0.3)',
                  background: 'rgba(255,90,31,0.08)', color: '#C56A2A',
                  fontWeight: 700, fontSize: '12px', cursor: 'pointer',
                  fontFamily: 'inherit', flexShrink: 0, transition: 'all 0.15s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#C56A2A'; e.currentTarget.style.color = '#fff' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,90,31,0.08)'; e.currentTarget.style.color = '#C56A2A' }}
              >
                + Schedule
              </button>
            </div>
          ) : (
            <div style={{
              background: 'var(--surface)', border: '1px dashed var(--border)',
              borderRadius: '12px', padding: '20px 24px',
              display: 'flex', alignItems: 'center', gap: '16px'
            }}>
              <CalendarIcon size={20} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
              <span style={{ fontSize: '13px', color: 'var(--text-3)', flex: 1 }}>No upcoming sessions scheduled</span>
              <button
                onClick={() => onOpenModal('session')}
                style={{
                  padding: '7px 14px', borderRadius: '8px', border: 'none',
                  background: '#C56A2A', color: '#fff', fontWeight: 700,
                  fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0
                }}
              >
                + Schedule
              </button>
            </div>
          )}

          {/* Program status */}
          {program ? (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '5px' }}>Active Program</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text)' }}>{program.name}</div>
                  {program.description && <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '3px' }}>{program.description}</div>}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: '#C56A2A', lineHeight: 1 }}>{Math.round(program.progress || 0)}%</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', marginTop: '2px' }}>done</div>
                </div>
              </div>
              <div style={{ height: '8px', background: 'var(--surface-2)', borderRadius: '99px', overflow: 'hidden', marginBottom: '10px' }}>
                <div style={{
                  width: `${Math.min(100, program.progress || 0)}%`,
                  height: '100%', background: 'linear-gradient(90deg,#C56A2A,#fb7121)',
                  borderRadius: '99px', transition: 'width 0.6s ease'
                }} />
              </div>
              {(program.current_week || program.total_weeks) && (
                <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                  Week <span style={{ fontWeight: 700, color: 'var(--text-2)' }}>{program.current_week || 0}</span> of <span style={{ fontWeight: 700, color: 'var(--text-2)' }}>{program.total_weeks || 0}</span>
                </div>
              )}
            </div>
          ) : (
            <div style={{
              background: 'var(--surface)', border: '1px dashed var(--border)',
              borderRadius: '12px', padding: '20px 24px',
              display: 'flex', alignItems: 'center', gap: '16px'
            }}>
              <Dumbbell size={20} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
              <span style={{ fontSize: '13px', color: 'var(--text-3)', flex: 1 }}>No program assigned yet</span>
              <button
                onClick={() => onOpenModal('program')}
                style={{
                  padding: '7px 14px', borderRadius: '8px', border: 'none',
                  background: '#C56A2A', color: '#fff', fontWeight: 700,
                  fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0
                }}
              >
                + Assign
              </button>
            </div>
          )}

          {/* Recent sessions — flex:1 fills remaining height to match sidebar bottom */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '12px', overflow: 'hidden',
            flex: 1, display: 'flex', flexDirection: 'column'
          }}>
            <div style={{
              padding: '14px 20px', borderBottom: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              flexShrink: 0
            }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>Recent Sessions</span>
              <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>{(client.sessions || []).length} total</span>
            </div>
            {recentSessions.length === 0 ? (
              <div style={{ padding: '0px', textAlign: 'center', color: 'var(--text-3)', fontSize: '13px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                No sessions yet
              </div>
            ) : (
              recentSessions.map((s, i) => {
                const st = STATUS_STYLES[s.status] || STATUS_STYLES.upcoming
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '14px',
                    padding: '12px 20px',
                    borderBottom: i < recentSessions.length - 1 ? '1px solid var(--border)' : 'none'
                  }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: st.color, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{s.type}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>
                        {new Date(s.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · {s.time} · {s.duration}min
                      </div>
                    </div>
                    <span style={{
                      fontSize: '10px', fontWeight: 700, padding: '3px 9px',
                      borderRadius: '99px', background: st.bg, color: st.color, flexShrink: 0
                    }}>{st.label}</span>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right sidebar — stretches to match left column height */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Contact */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Contact
            </div>
            {[
              { Icon: Mail,  label: 'Email', value: client.email || '—' },
              { Icon: Phone, label: 'Phone', value: client.phone || '—' },
            ].map((row, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                borderBottom: i === 0 ? '1px solid var(--border)' : 'none'
              }}>
                <row.Icon size={13} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>{row.label}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Details */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Details
            </div>
            {[
              { label: 'Member Since', value: new Date(client.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) },
              { label: 'Plan', value: client.membership_plan || 'No active plan' },
              { label: 'Status', value: client.status === 'active' ? 'Active' : 'Inactive', color: client.status === 'active' ? '#22C55E' : '#EF4444' },
            ].map((row, i, arr) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 16px', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none'
              }}>
                <span style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: 600 }}>{row.label}</span>
                <span style={{ fontSize: '13px', color: row.color || 'var(--text)', fontWeight: 600 }}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* Quick actions — flex:1 so it grows to fill remaining sidebar height */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '12px', overflow: 'hidden',
            flex: 1, display: 'flex', flexDirection: 'column'
          }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>
              Quick Actions
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              {[
                { label: 'Schedule Session', icon: CalendarIcon, action: 'session', color: '#C56A2A' },
                { label: 'Assign Program',   icon: Dumbbell,     action: 'program', color: '#4D9EF5' },
                { label: 'Assign Meal Plan', icon: Apple,        action: 'meal',    color: '#22C55E' },
                { label: 'Create Invoice',   icon: CreditCard,   action: 'invoice', color: '#A855F7' },
              ].map((a, i, arr) => {
                const Icon = a.icon
                return (
                  <button key={i} onClick={() => onOpenModal(a.action)} style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '0 16px', flex: 1, background: 'none', border: 'none',
                    borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                    cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '8px',
                      background: a.color + '18', color: a.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      <Icon size={13} />
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{a.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>      
    </div>
  )
}

// ── SESSIONS TAB ─────────────────────────────────────────────────────────────

function SessionsTab({ client, onOpenModal }) {
  const sessions = client.sessions || []
  const PER_PAGE = 6
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(sessions.length / PER_PAGE))
  const paginated = sessions.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>Session History</span>
          {sessions.length > 0 && (
            <span style={{ fontSize: '12px', color: 'var(--text-3)', marginLeft: '10px' }}>
              {sessions.length} total
            </span>
          )}
        </div>
        <button
          onClick={() => onOpenModal('session')}
          style={{
            padding: '8px 18px', borderRadius: '8px', border: 'none',
            background: '#C56A2A', color: '#fff', fontWeight: 700,
            fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: '6px',
            transition: 'background 0.15s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#E04E18'}
          onMouseLeave={e => e.currentTarget.style.background = '#C56A2A'}
        >
          <Plus size={14} /> Schedule Session
        </button>
      </div>

      {sessions.length === 0 ? (
        <div style={{
          background: 'var(--surface)', border: '1px dashed var(--border)',
          borderRadius: '12px', padding: '32px 20px', textAlign: 'center'
        }}>
          <Calendar size={32} style={{ color: 'var(--text-3)', marginBottom: '12px' }} />
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-2)', marginBottom: '6px' }}>
            No sessions recorded
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>
            Schedule a session to get started
          </div>
        </div>
      ) : (
        <>
          {/* Session list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
            {paginated.map((s, i) => {
              const st = STATUS_STYLES[s.status] || STATUS_STYLES.upcoming
              return (
                <div key={i} style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: '12px', padding: '16px 20px',
                  display: 'flex', alignItems: 'center', gap: '16px'
                }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: st.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>{s.type}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '3px' }}>
                      {new Date(s.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      {' · '}{s.time}
                      {' · '}{s.duration} min
                    </div>
                  </div>
                  <span style={{
                    fontSize: '11px', fontWeight: 700, padding: '4px 12px',
                    borderRadius: '99px', background: st.bg, color: st.color, flexShrink: 0
                  }}>
                    {st.label}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {/* Prev */}
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  width: '34px', height: '34px', borderRadius: '8px', border: '1px solid var(--border)',
                  background: 'var(--surface)', color: page === 1 ? 'var(--text-3)' : 'var(--text)',
                  cursor: page === 1 ? 'not-allowed' : 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit',
                  opacity: page === 1 ? 0.4 : 1, transition: 'all 0.15s', fontSize: '16px', fontWeight: 700
                }}
              >‹</button>

              {/* Page numbers */}
              {Array.from({ length: totalPages }, (_, k) => k + 1).map(n => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  style={{
                    width: '34px', height: '34px', borderRadius: '8px', fontFamily: 'inherit',
                    border: n === page ? 'none' : '1px solid var(--border)',
                    background: n === page ? '#C56A2A' : 'var(--surface)',
                    color: n === page ? '#fff' : 'var(--text-3)',
                    fontWeight: n === page ? 700 : 500, fontSize: '13px',
                    cursor: 'pointer', transition: 'all 0.15s'
                  }}
                >
                  {n}
                </button>
              ))}

              {/* Next */}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  width: '34px', height: '34px', borderRadius: '8px', border: '1px solid var(--border)',
                  background: 'var(--surface)', color: page === totalPages ? 'var(--text-3)' : 'var(--text)',
                  cursor: page === totalPages ? 'not-allowed' : 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit',
                  opacity: page === totalPages ? 0.4 : 1, transition: 'all 0.15s', fontSize: '16px', fontWeight: 700
                }}
              >›</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── PROGRAM TAB ──────────────────────────────────────────────────────────────

function ProgramTab({ client, onOpenModal }) {
  const program = client.program
  
  if (!program) {
    return (
      <div style={{
        background: 'var(--surface)', border: '1px dashed var(--border)',
        borderRadius: '12px', padding: '48px 32px', textAlign: 'center'
      }}>
        <Dumbbell size={48} style={{ color: 'var(--text-3)', marginBottom: '16px' }} />
        <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-2)', marginBottom: '8px' }}>
          No active program
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>
          {client.name} doesn't have an active program assigned.
        </div>
        <button
          onClick={() => onOpenModal('program')}
          style={{
            marginTop: '20px', padding: '10px 24px', borderRadius: '8px',
            border: 'none', background: '#C56A2A', color: '#fff',
            fontWeight: 700, fontSize: '14px', cursor: 'pointer',
            fontFamily: 'inherit', display: 'flex', alignItems: 'center',
            gap: '6px', marginLeft: 'auto', marginRight: 'auto',
            transition: 'background 0.15s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#E04E18'}
          onMouseLeave={e => e.currentTarget.style.background = '#C56A2A'}
        >
          <Plus size={14} /> Assign Program
        </button>
      </div>
    )
  }

  const weeks = program.weeks || []
  const pct = Math.min(100, Math.round(program.progress || 0))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Program header */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '12px', padding: '',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#C56A2A', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>
              Active Program
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text)', marginBottom: '4px' }}>
              {program.name}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>
              {program.description || 'No description provided'}
              {program.coach_name && <span style={{ marginLeft: '8px' }}>· Coach: {program.coach_name}</span>}
            </div>
          </div>
          <div style={{ flexShrink: 0, textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 900, color: '#C56A2A', lineHeight: 1 }}>{pct}%</div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '4px' }}>Complete</div>
          </div>
        </div>
        <div style={{ height: '8px', background: 'var(--surface-2)', borderRadius: '99px', overflow: 'hidden', marginBottom: '12px' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: '#C56A2A', borderRadius: '99px', transition: 'width 0.6s ease' }} />
        </div>
        <div style={{ display: 'flex', gap: '20px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-2)' }}>{weeks.length}</span> weeks
          </span>
          <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-2)' }}>
              {weeks.reduce((acc, w) => acc + (w.days || []).filter(d => !d.is_rest_day).length, 0)}
            </span> total workout days
          </span>
        </div>
      </div>

      {/* Week cards */}
      {weeks.length === 0 ? (
        <div style={{
          background: 'var(--surface)', border: '1px dashed var(--border)',
          borderRadius: '12px', padding: '32px', textAlign: 'center',
          color: 'var(--text-3)', fontSize: '13px'
        }}>
          No weeks defined in this program yet
        </div>
      ) : (
        weeks.map((w, i) => {
          const workoutDays = (w.days || []).filter(d => !d.is_rest_day)
          const restCount = (w.days || []).filter(d => d.is_rest_day).length
          return (
            <div key={i} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '12px', overflow: 'hidden'
            }}>
              {/* Week header */}
              <div style={{
                padding: '12px 20px', borderBottom: '1px solid var(--border)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'var(--surface-2)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    fontSize: '11px', fontWeight: 700, padding: '3px 10px',
                    borderRadius: '99px', background: 'rgba(255,90,31,0.12)', color: '#C56A2A'
                  }}>
                    Week {w.week_number}
                  </span>
                  {w.focus && (
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>{w.focus}</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                    <span style={{ fontWeight: 700, color: '#C56A2A' }}>{workoutDays.length}</span> workouts
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-2)' }}>{restCount}</span> rest
                  </span>
                </div>
              </div>

              {/* Day pills row */}
              <div style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: workoutDays.some(d => d.exercises && d.exercises.length > 0) ? '16px' : '0' }}>
                  {DAY_LABELS.map((label, j) => {
                    const day = (w.days || [])[j]
                    const isRest = !day || day.is_rest_day
                    return (
                      <div key={j} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: isRest ? 'var(--text-3)' : '#C56A2A', textTransform: 'uppercase' }}>
                          {label}
                        </div>
                        <div style={{
                          width: '100%', height: '52px', borderRadius: '8px',
                          background: isRest ? 'var(--surface-2)' : 'rgba(255,90,31,0.1)',
                          border: `1px solid ${isRest ? 'var(--border)' : 'rgba(255,90,31,0.35)'}`,
                          display: 'flex', flexDirection: 'column',
                          alignItems: 'center', justifyContent: 'center', gap: '3px'
                        }}>
                          {isRest ? (
                            <span style={{ fontSize: '9px', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Rest</span>
                          ) : (
                            <>
                              <Dumbbell size={12} style={{ color: '#C56A2A' }} />
                              {day.exercises && day.exercises.length > 0 && (
                                <span style={{ fontSize: '9px', fontWeight: 700, color: '#C56A2A' }}>{day.exercises.length} ex</span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Exercise tags per workout day */}
                {workoutDays.some(d => d.exercises && d.exercises.length > 0) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '4px', borderTop: '1px solid var(--border)' }}>
                    {workoutDays.filter(d => d.exercises && d.exercises.length > 0).map((d, di) => (
                      <div key={di} style={{ paddingTop: di === 0 ? '10px' : '0' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                          {d.day_of_week}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {d.exercises.map((ex, ei) => (
                            <span key={ei} style={{
                              fontSize: '12px', color: 'var(--text-2)', fontWeight: 500,
                              padding: '4px 10px', borderRadius: '6px',
                              background: 'var(--surface-2)', border: '1px solid var(--border)'
                            }}>
                              {typeof ex === 'string' ? ex : ex.name}
                              {ex.sets && ex.reps && (
                                <span style={{ color: 'var(--text-3)', marginLeft: '5px' }}>{ex.sets}×{ex.reps}</span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

// ── NUTRITION TAB ────────────────────────────────────────────────────────────

function NutritionTab({ client, onOpenModal }) {
  const nutrition = client.nutrition || { has_plan: false }
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' })
  const [activeDay, setActiveDay] = useState(today)

  if (!nutrition.has_plan) {
    return (
      <div style={{
        background: 'var(--surface)', border: '1px dashed var(--border)',
        borderRadius: '12px', padding: '48px 32px', textAlign: 'center'
      }}>
        <Apple size={48} style={{ color: 'var(--text-3)', marginBottom: '16px' }} />
        <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-2)', marginBottom: '8px' }}>
          No meal plan assigned
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>
          Assign a meal plan to track nutrition goals
        </div>
        <button
          onClick={() => onOpenModal('meal')}
          style={{
            marginTop: '20px', padding: '10px 24px', borderRadius: '8px',
            border: 'none', background: '#C56A2A', color: '#fff',
            fontWeight: 700, fontSize: '14px', cursor: 'pointer',
            fontFamily: 'inherit', display: 'flex', alignItems: 'center',
            gap: '6px', marginLeft: 'auto', marginRight: 'auto',
            transition: 'background 0.15s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#E04E18'}
          onMouseLeave={e => e.currentTarget.style.background = '#C56A2A'}
        >
          <Plus size={14} /> Assign Meal Plan
        </button>
      </div>
    )
  }

  const days = nutrition.days || []
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const dayShort  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  const currentDay = days.find(d => d.day === activeDay) || {
    day: activeDay, meals: [], total_calories: 0,
    total_protein: 0, total_carbs: 0, total_fat: 0,
    water: 0, water_goal: nutrition.water_goal || 2.5
  }

  const macros = [
    { label: 'Protein', current: currentDay.total_protein, target: nutrition.target_calories ? Math.round(nutrition.target_calories * 0.08) : 160, unit: 'g', color: '#C56A2A' },
    { label: 'Carbs',   current: currentDay.total_carbs,   target: nutrition.target_calories ? Math.round(nutrition.target_calories * 0.125) : 250, unit: 'g', color: '#4D9EF5' },
    { label: 'Fat',     current: currentDay.total_fat,     target: nutrition.target_calories ? Math.round(nutrition.target_calories * 0.044) : 80,  unit: 'g', color: '#A855F7' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Day switcher */}
      <div style={{
        background: 'var(--surface-2)', border: '1px solid var(--border)',
        borderRadius: '12px', padding: '5px', display: 'flex', gap: '4px'
      }}>
        {dayNames.map((day, i) => {
          const isActive = activeDay === day
          const isToday = day === today
          const dayData = days.find(d => d.day === day)
          const hasMeals = dayData && dayData.meals.length > 0
          return (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              style={{
                position: 'relative',
                flex: 1, height: '40px', borderRadius: '8px',
                border: isActive ? 'none' : '1px solid var(--border)',
                cursor: 'pointer', fontFamily: 'inherit',
                background: isActive ? '#C56A2A' : 'var(--surface)',
                boxShadow: isActive ? '0 2px 8px rgba(255,90,31,0.35)' : 'none',
                transition: 'all 0.15s',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '5px'
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--surface-2)' }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'var(--surface)' }}
            >
              {isToday && (
                <span style={{
                  position: 'absolute', top: '4px', right: '6px',
                  width: '4px', height: '4px', borderRadius: '50%',
                  background: isActive ? '#fff' : '#C56A2A'
                }} />
              )}
              <span style={{
                fontSize: '12px', fontWeight: 700, lineHeight: 1,
                color: isActive ? '#fff' : 'var(--text-2)'
              }}>
                {dayShort[i]}
              </span>
              <div style={{
                width: '5px', height: '5px', borderRadius: '50%',
                background: hasMeals ? (isActive ? '#fff' : '#22C55E') : 'var(--border)'
              }} />
            </button>
          )
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', alignItems: 'stretch' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Calories card */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '12px', padding: '20px 24px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>
                {activeDay === today ? "Today's" : `${activeDay}'s`} Calories
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>
                Target: {nutrition.target_calories || 2000} kcal
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '36px', fontWeight: 900, color: '#C56A2A', lineHeight: 1.1 }}>
                {currentDay.total_calories || 0}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>kcal logged</div>
            </div>
          </div>

          {/* Macro bars */}
          {macros.map((m, i) => (
            <div key={i} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '12px', padding: '16px 20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>{m.label}</span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: m.color }}>
                  {Math.round(m.current)}{m.unit} <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>/ {m.target}{m.unit}</span>
                </span>
              </div>
              <div style={{ height: '8px', background: 'var(--surface-2)', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{
                  width: `${Math.min(100, m.target > 0 ? (m.current / m.target) * 100 : 0)}%`,
                  height: '100%', background: m.color, borderRadius: '99px',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          ))}

          {/* Water */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '12px', padding: '16px 20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>Water</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#4D9EF5' }}>
                {currentDay.water || 0}L <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>/ {currentDay.water_goal || 2.5}L</span>
              </span>
            </div>
            <div style={{ height: '8px', background: 'var(--surface-2)', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{
                width: `${Math.min(100, ((currentDay.water || 0) / (currentDay.water_goal || 2.5)) * 100)}%`,
                height: '100%', background: '#4D9EF5', borderRadius: '99px',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        </div>

        {/* Meals list */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '12px', padding: '18px',
          display: 'flex', flexDirection: 'column',
          height: '100%', overflow: 'hidden'
        }}>
          <div style={{
            fontSize: '15px', fontWeight: 700, color: 'var(--text)',
            marginBottom: '12px', flexShrink: 0
          }}>
            {activeDay === today ? "Today's" : `${activeDay}'s`} Meals
          </div>
          <div style={{
            display: 'flex', flexDirection: 'column', gap: '10px',
            flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: '2px'
          }}>
            {(currentDay.meals || []).length === 0 ? (
              <div style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--surface-2)', border: '1px dashed var(--border)',
                borderRadius: '10px', padding: '24px', textAlign: 'center',
                color: 'var(--text-3)', fontSize: '13px'
              }}>
                No meals logged
              </div>
            ) : (
              currentDay.meals.map((meal, i) => {
                const chips = [
                  { label: `${meal.calories || 0} kcal`, color: '#C56A2A', bg: 'rgba(255,90,31,0.12)' },
                  ...(meal.protein ? [{ label: `P ${meal.protein}g`, color: 'var(--text-2)', bg: 'var(--surface)' }] : []),
                  ...(meal.carbs ? [{ label: `C ${meal.carbs}g`, color: 'var(--text-2)', bg: 'var(--surface)' }] : []),
                  ...(meal.fat ? [{ label: `F ${meal.fat}g`, color: 'var(--text-2)', bg: 'var(--surface)' }] : []),
                ]
                return (
                  <div key={i} style={{
                    background: 'var(--surface-2)', border: '1px solid var(--border)',
                    borderRadius: '10px', padding: '14px 16px', flexShrink: 0
                  }}>
                    {/* Header row: meal type + done checkbox */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{
                        fontSize: '10px', fontWeight: 700, color: '#C56A2A',
                        textTransform: 'uppercase', letterSpacing: '0.05em'
                      }}>
                        {meal.meal_type || 'Meal'}
                      </span>
                      <div style={{
                        width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                        background: meal.done ? '#22C55E' : 'var(--surface)',
                        border: '2px solid', borderColor: meal.done ? '#22C55E' : 'var(--border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {meal.done && <Check size={11} color="#fff" />}
                      </div>
                    </div>

                    {/* Meal name */}
                    <div style={{
                      fontSize: '14px', fontWeight: 700, color: 'var(--text)',
                      marginBottom: '10px', wordBreak: 'break-word'
                    }}>
                      {meal.name}
                    </div>

                    {/* Macro chips */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {chips.map((c, ci) => (
                        <span key={ci} style={{
                          fontSize: '11px', fontWeight: 700, color: c.color,
                          background: c.bg, border: c.bg === 'var(--surface)' ? '1px solid var(--border)' : 'none',
                          borderRadius: '6px', padding: '3px 8px', whiteSpace: 'nowrap'
                        }}>
                          {c.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── PROGRESS TAB ─────────────────────────────────────────────────────────────

function ProgressTab({ client, onOpenModal, onRefresh }) {
  const progressData = client.progress_data || {}
  const weightData = progressData.weight || []
  const bodyFatData = progressData.body_fat || []

  const renderChart = (data, label, unit, color) => {
    if (!data || data.length < 2) {
      return (
        <div style={{
          height: '140px', display: 'flex', alignItems: 'center',
          justifyContent: 'center', color: 'var(--text-3)', fontSize: '13px'
        }}>
          Not enough data to display chart
        </div>
      )
    }

    const W = 560, H = 140
    const PAD = { top: 12, right: 16, bottom: 28, left: 44 }
    const innerW = W - PAD.left - PAD.right
    const innerH = H - PAD.top - PAD.bottom

    const values = data.map(d => d.value)
    const rawMin = Math.min(...values)
    const rawMax = Math.max(...values)
    // Nice padding so line doesn't hug edges
    const spread = Math.max(rawMax - rawMin, 1)
    const min = rawMin - spread * 0.15
    const max = rawMax + spread * 0.15

    const toX = i => PAD.left + (i / (data.length - 1)) * innerW
    const toY = v => PAD.top + innerH - ((v - min) / (max - min)) * innerH

    const points = data.map((d, i) => ({ x: toX(i), y: toY(d.value), date: d.date, value: d.value }))
    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
    const areaPath = linePath + ` L${points[points.length-1].x.toFixed(1)},${(PAD.top + innerH).toFixed(1)} L${PAD.left},${(PAD.top + innerH).toFixed(1)} Z`

    // Y-axis grid: 4 lines
    const gridSteps = 4
    const gridLines = Array.from({ length: gridSteps + 1 }, (_, k) => {
      const v = min + (max - min) * (k / gridSteps)
      return { y: toY(v), label: v.toFixed(1) }
    })

    // X-axis date labels: show first, mid, last
    const xLabels = [0, Math.floor(data.length / 2), data.length - 1]
      .filter((v, i, a) => a.indexOf(v) === i)
      .map(i => ({ x: toX(i), label: new Date(data[i].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }))

    const gradId = `grad_${label.replace(/\s/g, '')}`

    return (
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines + Y labels */}
        {gridLines.map((g, k) => (
          <g key={k}>
            <line
              x1={PAD.left} y1={g.y.toFixed(1)}
              x2={PAD.left + innerW} y2={g.y.toFixed(1)}
              stroke="var(--border)" strokeWidth="1" strokeDasharray="4 4"
            />
            <text
              x={PAD.left - 6} y={g.y.toFixed(1)}
              textAnchor="end" dominantBaseline="middle"
              fontSize="10" fill="var(--text-3)" fontFamily="inherit"
            >
              {g.label}
            </text>
          </g>
        ))}

        {/* Area fill */}
        <path d={areaPath} fill={`url(#${gradId})`} />

        {/* Line */}
        <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points */}
        {points.map((p, j) => {
          const isLast = j === points.length - 1
          return (
            <g key={j}>
              <circle cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r={isLast ? 5 : 3.5}
                fill={isLast ? color : 'var(--surface)'}
                stroke={color} strokeWidth={isLast ? 0 : 2}
                opacity={isLast ? 1 : 0.7}
              />
            </g>
          )
        })}

        {/* X-axis labels */}
        {xLabels.map((xl, k) => (
          <text
            key={k} x={xl.x.toFixed(1)} y={H - 4}
            textAnchor="middle" fontSize="10"
            fill="var(--text-3)" fontFamily="inherit"
          >
            {xl.label}
          </text>
        ))}
      </svg>
    )
  }

  const statsCards = [
    { label: 'Program Progress', value: `${Math.round(client.progress || 0)}%`, sub: 'of current program completed', color: '#C56A2A', pct: Math.round(client.progress || 0) },
    { label: 'Attendance Rate',  value: `${Math.round(client.attendance_rate || 0)}%`, sub: 'sessions attended (last 30 days)', color: '#22C55E', pct: Math.round(client.attendance_rate || 0) },
    { label: 'Total Sessions',   value: String(client.session_count || 0), sub: 'sessions completed to date', color: '#4D9EF5', pct: Math.min(100, ((client.session_count || 0) / 50) * 100) },
    { label: 'Current Weight',   value: weightData.length > 0 ? weightData[weightData.length-1].value + ' kg' : '—', sub: weightData.length > 1 ? ((weightData[weightData.length-1].value - weightData[0].value) > 0 ? '+' : '') + (weightData[weightData.length-1].value - weightData[0].value).toFixed(1) + ' kg from start' : 'no data yet', color: '#A78BFA', pct: 100 },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* ── Header row with Log button ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text)' }}>Progress Tracking</div>
          <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>Log and monitor client measurements over time</div>
        </div>
        <button
          onClick={() => onOpenModal('measurement')}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '9px 18px', borderRadius: '9px', border: 'none',
            background: '#C56A2A', color: '#fff',
            fontSize: '13px', fontWeight: 700, cursor: 'pointer',
            fontFamily: 'inherit', transition: 'background 0.15s',
            boxShadow: '0 4px 12px rgba(255,90,31,0.35)',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#E04E18'}
          onMouseLeave={e => e.currentTarget.style.background = '#C56A2A'}
        >
          <Plus size={15} /> Log Measurement
        </button>
      </div>
      <div style={{ display: 'flex', gap: '16px' }}>
        {statsCards.map((s, i) => (
          <div key={i} style={{
            flex: 1,
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '12px', padding: '20px 24px',
            display: 'flex', flexDirection: 'column', gap: '12px'
          }}>
            {/* Top row: big number left, icon right */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '36px', fontWeight: 900, color: s.color, lineHeight: 1, letterSpacing: '-0.02em' }}>
                {s.value}
              </div>
            </div>
            {/* Label + sub */}
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', marginBottom: '2px' }}>
                {s.label}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>
                {s.sub}
              </div>
            </div>
            {/* Progress bar at bottom */}
            <div style={{ height: '6px', background: 'var(--surface-2)', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{
                width: `${Math.min(100, s.pct)}%`, height: '100%',
                background: s.color, borderRadius: '99px', transition: 'width 0.6s ease'
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Weight chart ── */}
      {/* ── Charts side by side ── */}
      {(weightData.length > 0 || bodyFatData.length > 0) && (
        <div style={{ display: 'flex', gap: '16px' }}>
          {weightData.length > 0 && (
            <div style={{
              flex: 1, minWidth: 0,
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '12px', padding: '20px 24px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>Weight</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '3px' }}>
                    {weightData.length} measurement{weightData.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#C56A2A', lineHeight: 1 }}>
                    {weightData[weightData.length - 1]?.value || 0} kg
                  </div>
                  {weightData.length > 1 && (() => {
                    const diff = (weightData[weightData.length - 1].value - weightData[0].value).toFixed(1)
                    const isDown = parseFloat(diff) < 0
                    return (
                      <div style={{ fontSize: '12px', fontWeight: 600, color: isDown ? '#22C55E' : '#EF4444', marginTop: '3px' }}>
                        {parseFloat(diff) > 0 ? '+' : ''}{diff} kg from start
                      </div>
                    )
                  })()}
                </div>
              </div>
              {renderChart(weightData, 'weight', 'kg', '#C56A2A')}
            </div>
          )}

          {bodyFatData.length > 0 && (
            <div style={{
              flex: 1, minWidth: 0,
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '12px', padding: '20px 24px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>Body Fat</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '3px' }}>
                    {bodyFatData.length} measurement{bodyFatData.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#4D9EF5', lineHeight: 1 }}>
                    {bodyFatData[bodyFatData.length - 1]?.value || 0}%
                  </div>
                  {bodyFatData.length > 1 && (() => {
                    const diff = (bodyFatData[bodyFatData.length - 1].value - bodyFatData[0].value).toFixed(1)
                    const isDown = parseFloat(diff) < 0
                    return (
                      <div style={{ fontSize: '12px', fontWeight: 600, color: isDown ? '#22C55E' : '#EF4444', marginTop: '3px' }}>
                        {parseFloat(diff) > 0 ? '+' : ''}{diff}% from start
                      </div>
                    )
                  })()}
                </div>
              </div>
              {renderChart(bodyFatData, 'bodyfat', '%', '#4D9EF5')}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {weightData.length === 0 && bodyFatData.length === 0 && (
        <div style={{
          background: 'var(--surface)', border: '1px dashed var(--border)',
          borderRadius: '12px', padding: '48px 32px', textAlign: 'center'
        }}>
          <BarChart2 size={40} style={{ color: 'var(--text-3)', marginBottom: '12px' }} />
          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-2)', marginBottom: '6px' }}>
            No measurements yet
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>
            Weight and body fat data will appear here once recorded
          </div>
        </div>
      )}
    </div>
  )
}

// ── NOTES TAB ─────────────────────────────────────────────────────────────────

function NotesTab({ clientId }) {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [page, setPage] = useState(1)
  const editorRef = useCallback(node => { if (node) node.focus() }, [])
  const PER_PAGE = 3

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.get(`/coach/clients/${clientId}/notes`)
      setNotes(res.data)
    } catch (err) {
      console.error('Error fetching notes:', err)
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => { fetchNotes() }, [fetchNotes])

  const execCmd = (cmd, value = null) => {
    document.execCommand(cmd, false, value)
    document.getElementById('note-editor')?.focus()
  }

  const addNote = async () => {
    const editor = document.getElementById('note-editor')
    const html = editor?.innerHTML?.trim()
    if (!html || html === '<br>') return
    try {
      setSaving(true)
      const res = await api.post(`/coach/clients/${clientId}/notes`, { text: html, pinned: false })
      setNotes(prev => [res.data, ...prev])
      if (editor) editor.innerHTML = ''
      setPage(1)
    } catch (err) {
      console.error('Error adding note:', err)
    } finally {
      setSaving(false)
    }
  }

  const togglePin = async (noteId, currentPinned) => {
    try {
      await api.put(`/coach/notes/${noteId}`, { pinned: !currentPinned })
      setNotes(prev => prev.map(n => n.id === noteId ? { ...n, pinned: !currentPinned } : n))
    } catch (err) { console.error(err) }
  }

  const deleteNote = async (noteId) => {
    if (!window.confirm('Delete this note?')) return
    try {
      await api.delete(`/coach/notes/${noteId}`)
      setNotes(prev => prev.filter(n => n.id !== noteId))
    } catch (err) { console.error(err) }
  }

  const sortedNotes = [...notes].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
  const totalPages = Math.max(1, Math.ceil(sortedNotes.length / PER_PAGE))
  const paginated = sortedNotes.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const COLORS = ['#C56A2A','#EF4444','#22C55E','#4D9EF5','#A78BFA','#F59E0B','#EC4899']

  const ToolBtn = ({ cmd, val, title, children, active }) => (
    <button
      onMouseDown={e => { e.preventDefault(); execCmd(cmd, val) }}
      title={title}
      style={{
        background: active ? 'rgba(255,90,31,0.15)' : 'none',
        border: 'none', cursor: 'pointer', padding: '5px 7px',
        borderRadius: '5px', color: active ? '#C56A2A' : 'var(--text-3)',
        fontSize: '13px', fontWeight: 700, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s', fontFamily: 'inherit'
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,90,31,0.1)'; e.currentTarget.style.color = '#C56A2A' }}
      onMouseLeave={e => { e.currentTarget.style.background = active ? 'rgba(255,90,31,0.15)' : 'none'; e.currentTarget.style.color = active ? '#C56A2A' : 'var(--text-3)' }}
    >
      {children}
    </button>
  )

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>

      {/* ── Left: notes list ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>Coaching Notes</span>
          {notes.length > 0 && (
            <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>{notes.length} total</span>
          )}
        </div>

        {loading ? (
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '12px', padding: '40px', textAlign: 'center', color: 'var(--text-3)'
          }}>
            <Loader2 size={24} style={{ animation: 'spin 0.8s linear infinite', margin: '0 auto 12px', display: 'block' }} />
            Loading notes…
          </div>
        ) : notes.length === 0 ? (
          <div style={{
            background: 'var(--surface)', border: '1px dashed var(--border)',
            borderRadius: '12px', padding: '40px', textAlign: 'center', color: 'var(--text-3)'
          }}>
            <FileText size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.4 }} />
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '4px' }}>No notes yet</div>
            <div style={{ fontSize: '12px' }}>Write your first coaching note →</div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
              {paginated.map(note => (
                <div key={note.id} style={{
                  background: 'var(--surface)', borderRadius: '12px', padding: '16px 18px',
                  border: note.pinned ? '1px solid rgba(255,90,31,0.35)' : '1px solid var(--border)',
                  borderLeft: note.pinned ? '3px solid #C56A2A' : undefined,
                  position: 'relative'
                }}>
                  <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '4px' }}>
                    <button onClick={() => togglePin(note.id, note.pinned)} title={note.pinned ? 'Unpin' : 'Pin'}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: note.pinned ? '#C56A2A' : 'var(--text-3)', padding: '4px' }}>
                      <Target size={13} />
                    </button>
                    <button onClick={() => deleteNote(note.id)} title="Delete"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: '4px' }}>
                      <X size={13} />
                    </button>
                  </div>
                  {note.pinned && (
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#C56A2A', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                      ★ Pinned
                    </div>
                  )}
                  <div
                    style={{ fontSize: '14px', color: 'var(--text)', lineHeight: 1.65, paddingRight: '56px' }}
                    dangerouslySetInnerHTML={{ __html: note.text }}
                  />
                  <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '10px' }}>
                    {new Date(note.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  style={{
                    width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--border)',
                    background: 'var(--surface)', color: 'var(--text)', cursor: page === 1 ? 'not-allowed' : 'pointer',
                    opacity: page === 1 ? 0.4 : 1, fontSize: '16px', fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit'
                  }}>‹</button>
                {Array.from({ length: totalPages }, (_, k) => k + 1).map(n => (
                  <button key={n} onClick={() => setPage(n)}
                    style={{
                      width: '32px', height: '32px', borderRadius: '8px', fontFamily: 'inherit',
                      border: n === page ? 'none' : '1px solid var(--border)',
                      background: n === page ? '#C56A2A' : 'var(--surface)',
                      color: n === page ? '#fff' : 'var(--text-3)',
                      fontWeight: n === page ? 700 : 500, fontSize: '13px', cursor: 'pointer'
                    }}>{n}</button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  style={{
                    width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--border)',
                    background: 'var(--surface)', color: 'var(--text)', cursor: page === totalPages ? 'not-allowed' : 'pointer',
                    opacity: page === totalPages ? 0.4 : 1, fontSize: '16px', fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit'
                  }}>›</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Right: rich editor ── */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '12px', overflow: 'hidden',
        position: 'sticky', top: '24px',
        display: 'flex', flexDirection: 'column'
      }}>
        {/* Editor title */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>
          Add Note
        </div>

        {/* Toolbar */}
        <div style={{
          padding: '6px 10px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: '2px', flexWrap: 'wrap',
          background: 'var(--surface-2)'
        }}>
          <ToolBtn cmd="bold" title="Bold"><b>B</b></ToolBtn>
          <ToolBtn cmd="italic" title="Italic"><i>I</i></ToolBtn>
          <ToolBtn cmd="underline" title="Underline"><u>U</u></ToolBtn>
          <ToolBtn cmd="strikeThrough" title="Strikethrough"><s>S</s></ToolBtn>

          <div style={{ width: '1px', height: '18px', background: 'var(--border)', margin: '0 4px' }} />

          <ToolBtn cmd="insertUnorderedList" title="Bullet list">• list</ToolBtn>
          <ToolBtn cmd="insertOrderedList" title="Numbered list">1. list</ToolBtn>

          <div style={{ width: '1px', height: '18px', background: 'var(--border)', margin: '0 4px' }} />

          <ToolBtn cmd="formatBlock" val="h3" title="Heading">H</ToolBtn>
          <ToolBtn cmd="formatBlock" val="p" title="Paragraph">¶</ToolBtn>

          <div style={{ width: '1px', height: '18px', background: 'var(--border)', margin: '0 4px' }} />

          {/* Color swatches */}
          {COLORS.map(c => (
            <button
              key={c}
              onMouseDown={e => { e.preventDefault(); execCmd('foreColor', c) }}
              title={c}
              style={{
                width: '16px', height: '16px', borderRadius: '50%',
                background: c, border: '2px solid transparent',
                cursor: 'pointer', flexShrink: 0, transition: 'transform 0.1s'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.25)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            />
          ))}

          <div style={{ width: '1px', height: '18px', background: 'var(--border)', margin: '0 4px' }} />

          <ToolBtn cmd="removeFormat" title="Clear formatting">✕ fmt</ToolBtn>
        </div>

        {/* Editable area */}
        <div
          id="note-editor"
          contentEditable
          suppressContentEditableWarning
          data-placeholder="Write a coaching note…"
          style={{
            flex: 1,
            minHeight: '220px',
            padding: '14px 16px',
            color: 'var(--text)',
            fontSize: '14px',
            lineHeight: 1.7,
            outline: 'none',
            overflowY: 'auto',
          }}
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) addNote()
          }}
        />
        <style>{`
          #note-editor:empty:before {
            content: attr(data-placeholder);
            color: var(--text-3);
            pointer-events: none;
          }
          #note-editor h3 { margin: 0 0 6px; font-size: 15px; font-weight: 700; }
          #note-editor ul, #note-editor ol { padding-left: 20px; margin: 4px 0; }
          #note-editor li { margin: 2px 0; }
        `}</style>

        {/* Footer */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '10px 14px', borderTop: '1px solid var(--border)',
          background: 'var(--surface-2)'
        }}>
          <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>⌘+Enter to save</span>
          <button
            onClick={addNote}
            disabled={saving}
            style={{
              padding: '8px 20px', borderRadius: '8px', border: 'none',
              background: '#C56A2A', color: '#fff',
              fontWeight: 700, fontSize: '13px', cursor: 'pointer',
              fontFamily: 'inherit', display: 'flex', alignItems: 'center',
              gap: '7px', transition: 'background 0.15s',
              opacity: saving ? 0.7 : 1
            }}
            onMouseEnter={e => { if (!saving) e.currentTarget.style.background = '#E04E18' }}
            onMouseLeave={e => e.currentTarget.style.background = '#C56A2A'}
          >
            {saving && <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} />}
            Save Note
          </button>
        </div>
      </div>
    </div>
  )
}

// ── PAYMENTS TAB ─────────────────────────────────────────────────────────────

function PaymentsTab({ client, onOpenModal }) {
  const payments = client.payments || []
  
  const total = payments.reduce((s, p) => s + p.amount, 0)
  const revenue = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0)
  const overdue = payments.filter(p => p.status === 'overdue').reduce((s, p) => s + p.amount, 0)
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
        {[
          { label: 'Total Revenue', value: total, color: '#C56A2A' },
          { label: 'Collected', value: revenue, color: '#22C55E' },
          { label: 'Overdue', value: overdue, color: '#EF4444' },
        ].map((s, i) => (
          <div key={i} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '12px', padding: '18px 20px'
          }}>
            <div style={{
              fontSize: '11px', fontWeight: 700, color: 'var(--text-3)',
              textTransform: 'uppercase', letterSpacing: '0.05em',
              marginBottom: '8px'
            }}>
              {s.label}
            </div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: s.color }}>
              {s.value.toLocaleString()} <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-3)' }}>DZD</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0' }}>
        <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>Invoices</span>
        <button
          onClick={() => onOpenModal('invoice')}
          style={{
            padding: '8px 18px', borderRadius: '8px', border: 'none',
            background: '#C56A2A', color: '#fff', fontWeight: 700,
            fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: '6px',
            transition: 'background 0.15s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#E04E18'}
          onMouseLeave={e => e.currentTarget.style.background = '#C56A2A'}
        >
          <Plus size={14} /> New Invoice
        </button>
      </div>

      {payments.length === 0 ? (
        <div style={{
          background: 'var(--surface)', border: '1px dashed var(--border)',
          borderRadius: '12px', padding: '32px', textAlign: 'center',
          color: 'var(--text-3)'
        }}>
          No payment records found
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {payments.map((p, i) => {
            const s = PAYMENT_STATUS[p.status] || PAYMENT_STATUS.pending
            return (
              <div key={i} style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: '12px', padding: '16px 20px',
                display: 'flex', alignItems: 'center', gap: '16px'
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
                    {p.description || `Payment #${p.id}`}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '3px' }}>
                    {p.invoice_id || `INV-${String(p.id).padStart(3, '0')}`}
                    {' · '}
                    {new Date(p.date).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric'
                    })}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text)' }}>
                    {p.amount.toLocaleString()} DZD
                  </div>
                  <span style={{
                    fontSize: '11px', fontWeight: 700, padding: '3px 10px',
                    borderRadius: '99px', background: s.bg, color: s.color
                  }}>
                    {s.label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── MODAL FORMS ────────────────────────────────────────────────────────────

function ScheduleSessionForm({ clientId, onClose, onSuccess }) {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [duration, setDuration] = useState('60')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!date || !time) return

    try {
      setSubmitting(true)
      // Calculate end time
      const [hours, minutes] = time.split(':').map(Number)
      const durationMins = parseInt(duration)
      const totalMinutes = hours * 60 + minutes + durationMins
      const endHours = Math.floor(totalMinutes / 60)
      const endMinutes = totalMinutes % 60
      const endTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`

      await api.post(`/personal-sessions/book`, {
        date: date,
        time: time,
        end_time: endTime,
        notes: notes
      })

      onSuccess()
      onClose()
    } catch (err) {
      console.error('Error scheduling session:', err)
      alert('Failed to schedule session. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-3)', marginBottom: '6px' }}>
          Date
        </label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          required
          style={{
            width: '100%', padding: '10px 14px', borderRadius: '8px',
            border: '1px solid var(--border)', background: 'var(--surface-2)',
            color: 'var(--text)', fontSize: '14px', outline: 'none'
          }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-3)', marginBottom: '6px' }}>
            Start Time
          </label>
          <input
            type="time"
            value={time}
            onChange={e => setTime(e.target.value)}
            required
            style={{
              width: '100%', padding: '10px 14px', borderRadius: '8px',
              border: '1px solid var(--border)', background: 'var(--surface-2)',
              color: 'var(--text)', fontSize: '14px', outline: 'none'
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-3)', marginBottom: '6px' }}>
            Duration (minutes)
          </label>
          <select
            value={duration}
            onChange={e => setDuration(e.target.value)}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: '8px',
              border: '1px solid var(--border)', background: 'var(--surface-2)',
              color: 'var(--text)', fontSize: '14px', outline: 'none'
            }}
          >
            <option value="30">30 min</option>
            <option value="45">45 min</option>
            <option value="60">60 min</option>
            <option value="90">90 min</option>
          </select>
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-3)', marginBottom: '6px' }}>
          Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          placeholder="Any special instructions or focus areas..."
          style={{
            width: '100%', padding: '10px 14px', borderRadius: '8px',
            border: '1px solid var(--border)', background: 'var(--surface-2)',
            color: 'var(--text)', fontSize: '14px', outline: 'none',
            fontFamily: 'inherit', resize: 'vertical'
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
        <button
          type="button"
          onClick={onClose}
          style={{
            padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border)',
            background: 'transparent', color: 'var(--text-3)', fontWeight: 600,
            fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit'
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: '10px 24px', borderRadius: '8px', border: 'none',
            background: '#C56A2A', color: '#fff', fontWeight: 700,
            fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: '8px',
            opacity: submitting ? 0.7 : 1
          }}
        >
          {submitting && <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />}
          Schedule Session
        </button>
      </div>
    </form>
  )
}

function AssignProgramForm({ clientId, onClose, onSuccess }) {
  const [programId, setProgramId] = useState('')
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const res = await api.get('/programs/coach')
        setPrograms(res.data)
      } catch (err) {
        console.error('Error fetching programs:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchPrograms()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!programId) return

    try {
      setSubmitting(true)
      // This would be the endpoint to assign a program
      // You'll need to implement this in the backend
      await api.post(`/programs/assign`, {
        client_id: clientId,
        program_id: programId
      })
      onSuccess()
      onClose()
    } catch (err) {
      console.error('Error assigning program:', err)
      alert('Failed to assign program. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-3)' }}>
        <Loader2 size={24} style={{ animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        Loading programs…
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-3)', marginBottom: '6px' }}>
          Select Program
        </label>
        <select
          value={programId}
          onChange={e => setProgramId(e.target.value)}
          required
          style={{
            width: '100%', padding: '10px 14px', borderRadius: '8px',
            border: '1px solid var(--border)', background: 'var(--surface-2)',
            color: 'var(--text)', fontSize: '14px', outline: 'none'
          }}
        >
          <option value="">Choose a program…</option>
          {programs.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
        <button
          type="button"
          onClick={onClose}
          style={{
            padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border)',
            background: 'transparent', color: 'var(--text-3)', fontWeight: 600,
            fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit'
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || !programId}
          style={{
            padding: '10px 24px', borderRadius: '8px', border: 'none',
            background: '#C56A2A', color: '#fff', fontWeight: 700,
            fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: '8px',
            opacity: (submitting || !programId) ? 0.7 : 1
          }}
        >
          {submitting && <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />}
          Assign Program
        </button>
      </div>
    </form>
  )
}

function AssignMealPlanForm({ clientId, onClose, onSuccess }) {
  const [weekStart, setWeekStart] = useState('')
  const [calorieGoal, setCalorieGoal] = useState('2000')
  const [submitting, setSubmitting] = useState(false)

  // Set default to current week
  useEffect(() => {
    const today = new Date()
    const day = today.getDay()
    const diff = today.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(today.setDate(diff))
    setWeekStart(monday.toISOString().split('T')[0])
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!weekStart) return

    try {
      setSubmitting(true)
      await api.post(`/coach/clients/${clientId}/meal-plan`, {
        week_start: weekStart,
        daily_calorie_goal: parseInt(calorieGoal),
        daily_water_goal: 2.5
      })
      onSuccess()
      onClose()
    } catch (err) {
      console.error('Error assigning meal plan:', err)
      alert('Failed to assign meal plan. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-3)', marginBottom: '6px' }}>
          Week Starting
        </label>
        <input
          type="date"
          value={weekStart}
          onChange={e => setWeekStart(e.target.value)}
          required
          style={{
            width: '100%', padding: '10px 14px', borderRadius: '8px',
            border: '1px solid var(--border)', background: 'var(--surface-2)',
            color: 'var(--text)', fontSize: '14px', outline: 'none'
          }}
        />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-3)', marginBottom: '6px' }}>
          Daily Calorie Goal
        </label>
        <input
          type="number"
          value={calorieGoal}
          onChange={e => setCalorieGoal(e.target.value)}
          min="1000"
          max="5000"
          required
          style={{
            width: '100%', padding: '10px 14px', borderRadius: '8px',
            border: '1px solid var(--border)', background: 'var(--surface-2)',
            color: 'var(--text)', fontSize: '14px', outline: 'none'
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
        <button
          type="button"
          onClick={onClose}
          style={{
            padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border)',
            background: 'transparent', color: 'var(--text-3)', fontWeight: 600,
            fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit'
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: '10px 24px', borderRadius: '8px', border: 'none',
            background: '#C56A2A', color: '#fff', fontWeight: 700,
            fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: '8px',
            opacity: submitting ? 0.7 : 1
          }}
        >
          {submitting && <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />}
          Assign Meal Plan
        </button>
      </div>
    </form>
  )
}

function CreateInvoiceForm({ clientId, onClose, onSuccess }) {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!amount || !description) return

    try {
      setSubmitting(true)
      await api.post(`/payments`, {
        member_id: parseInt(clientId),
        amount: parseFloat(amount),
        status: 'pending',
        notes: description,
        payment_date: new Date().toISOString().split('T')[0]
      })
      onSuccess()
      onClose()
    } catch (err) {
      console.error('Error creating invoice:', err)
      alert('Failed to create invoice. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-3)', marginBottom: '6px' }}>
          Amount (DZD)
        </label>
        <input
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          min="1"
          step="100"
          required
          style={{
            width: '100%', padding: '10px 14px', borderRadius: '8px',
            border: '1px solid var(--border)', background: 'var(--surface-2)',
            color: 'var(--text)', fontSize: '14px', outline: 'none'
          }}
        />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-3)', marginBottom: '6px' }}>
          Description
        </label>
        <input
          type="text"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="e.g., Monthly Coaching - July 2026"
          required
          style={{
            width: '100%', padding: '10px 14px', borderRadius: '8px',
            border: '1px solid var(--border)', background: 'var(--surface-2)',
            color: 'var(--text)', fontSize: '14px', outline: 'none'
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
        <button
          type="button"
          onClick={onClose}
          style={{
            padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border)',
            background: 'transparent', color: 'var(--text-3)', fontWeight: 600,
            fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit'
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || !amount || !description}
          style={{
            padding: '10px 24px', borderRadius: '8px', border: 'none',
            background: '#C56A2A', color: '#fff', fontWeight: 700,
            fontSize: '14px', cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: '8px',
            opacity: (submitting || !amount || !description) ? 0.7 : 1
          }}
        >
          {submitting && <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />}
          Create Invoice
        </button>
      </div>
    </form>
  )
}

// ── LOG MEASUREMENT FORM ─────────────────────────────────────────────────────

function LogMeasurementForm({ clientId, onClose, onSuccess }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [weight, setWeight] = useState('')
  const [bodyFat, setBodyFat] = useState('')
  const [muscleMass, setMuscleMass] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!weight && !bodyFat && !muscleMass) {
      alert('Please enter at least one measurement.')
      return
    }
    setSubmitting(true)
    try {
      await api.post('/coach/progress', {
        client_id: parseInt(clientId),
        date,
        weight: weight ? parseFloat(weight) : null,
        body_fat: bodyFat ? parseFloat(bodyFat) : null,
        muscle_mass: muscleMass ? parseFloat(muscleMass) : null,
        notes: notes || null,
      })
      onSuccess()
      onClose()
    } catch (err) {
      console.error('Failed to log measurement:', err)
      alert(err.response?.data?.detail || 'Failed to save measurement.')
    } finally {
      setSubmitting(false)
    }
  }

  const fieldStyle = {
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    border: '1px solid var(--border)', background: 'var(--surface-2)',
    color: 'var(--text)', fontSize: '14px', outline: 'none',
    fontFamily: 'inherit', boxSizing: 'border-box',
  }
  const labelStyle = {
    display: 'block', fontSize: '12px', fontWeight: 700,
    color: 'var(--text-3)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em'
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Date */}
      <div>
        <label style={labelStyle}>Date</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} required style={fieldStyle} />
      </div>

      {/* Measurements row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
        <div>
          <label style={labelStyle}>Weight (kg)</label>
          <input
            type="number" step="0.1" min="0" max="500"
            value={weight} onChange={e => setWeight(e.target.value)}
            placeholder="e.g. 82.5" style={fieldStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Body Fat (%)</label>
          <input
            type="number" step="0.1" min="0" max="100"
            value={bodyFat} onChange={e => setBodyFat(e.target.value)}
            placeholder="e.g. 18.0" style={fieldStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Muscle Mass (kg)</label>
          <input
            type="number" step="0.1" min="0" max="200"
            value={muscleMass} onChange={e => setMuscleMass(e.target.value)}
            placeholder="e.g. 42.0" style={fieldStyle}
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label style={labelStyle}>Notes (optional)</label>
        <textarea
          value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Any observations about this measurement..."
          rows={3}
          style={{ ...fieldStyle, resize: 'vertical', lineHeight: 1.5 }}
        />
      </div>

      {/* Info banner */}
      <div style={{
        padding: '10px 14px', borderRadius: '8px',
        background: 'rgba(255,90,31,0.08)', border: '1px solid rgba(255,90,31,0.2)',
        fontSize: '12px', color: 'var(--text-3)', lineHeight: 1.5,
      }}>
        💡 Logging weight will also update the client's profile weight to keep everything in sync.
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button
          type="button" onClick={onClose}
          style={{
            padding: '10px 20px', borderRadius: '8px',
            border: '1px solid var(--border)', background: 'transparent',
            color: 'var(--text-3)', fontWeight: 600, fontSize: '14px',
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Cancel
        </button>
        <button
          type="submit" disabled={submitting}
          style={{
            padding: '10px 24px', borderRadius: '8px', border: 'none',
            background: submitting ? 'var(--surface-2)' : '#C56A2A',
            color: submitting ? 'var(--text-3)' : '#fff',
            fontWeight: 700, fontSize: '14px', cursor: submitting ? 'default' : 'pointer',
            fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px',
            transition: 'all 0.15s',
          }}
        >
          {submitting && <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />}
          Save Measurement
        </button>
      </div>
    </form>
  )
}