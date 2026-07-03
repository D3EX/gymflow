// frontend/src/pages/member/CheckIn.jsx
import { useState, useEffect, useRef } from 'react'
import api from '../../api/client'
import { UserCheck, CheckCircle, Calendar, Zap, Activity, Flame, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

function StatPill({ icon: Icon, iconColor, label, value, sub }) {
  return (
    <div className="stat-pill" style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '14px',
      padding: '18px',
      textAlign: 'center',
      flex: 1,
    }}>
      <div style={{
        width: '38px', height: '38px', borderRadius: '50%',
        background: `${iconColor}1F`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 10px',
      }}>
        <Icon size={18} color={iconColor} />
      </div>
      <p style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1, color: 'var(--text)' }}>
        {value}
      </p>
      <p style={{ fontSize: '12px', color: 'var(--text-2)', marginTop: '5px', fontWeight: 600 }}>
        {label}
      </p>
      {sub && <p style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>{sub}</p>}
    </div>
  )
}

export default function MemberCheckIn() {
  const [loading, setLoading] = useState(false)
  const [todayCheckins, setTodayCheckins] = useState([])
  const [recentCheckins, setRecentCheckins] = useState([])
  const [checkinStatus, setCheckinStatus] = useState(null)
  const checkInInFlight = useRef(false)

  useEffect(() => {
    fetchCheckins()
  }, [])

  const fetchCheckins = async () => {
    try {
      const res = await api.get('/attendance/my')
      const today = new Date().toDateString()
      const todayData = res.data.filter((a) =>
        new Date(a.check_in_time).toDateString() === today
      )
      setTodayCheckins(todayData)
      setRecentCheckins(res.data.slice(0, 5))
      setCheckinStatus(todayData.length > 0 ? 'checked-in' : 'not-checked-in')
    } catch (error) {
      console.error('[GymFlow] fetchCheckins failed:', error)
    }
  }

  const handleCheckIn = async () => {
    if (checkInInFlight.current || loading || checkinStatus === 'checked-in') return
    checkInInFlight.current = true

    setLoading(true)
    try {
      await api.post('/attendance/my-checkin')
      toast.success("Checked in — let's get it!")
      setCheckinStatus('checked-in')
      await fetchCheckins()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Check-in failed')
    } finally {
      setLoading(false)
      checkInInFlight.current = false
    }
  }

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })

  const isCheckedIn = checkinStatus === 'checked-in'

  return (
    <div style={{
      background: 'var(--bg)',
      color: 'var(--text)',
      fontFamily: "'Inter', -apple-system, sans-serif",
      padding: '2px',
      minHeight: '100vh',
      boxSizing: 'border-box',
    }}>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }

        /* ============================================================
           RESPONSIVE / MOBILE LAYOUT
           ============================================================ */
        @media (max-width: 560px) {
          .stats-grid {
            display: flex !important;
            gap: 8px !important;
          }
          .stat-pill {
            padding: 12px 8px !important;
          }
          .stat-pill div:first-child {
            width: 30px !important;
            height: 30px !important;
          }
          .stat-pill div:first-child svg {
            width: 14px !important;
            height: 14px !important;
          }
          .stat-pill p:first-of-type {
            font-size: 18px !important;
          }
          .stat-pill p:nth-of-type(2) {
            font-size: 10px !important;
          }
          .stat-pill p:nth-of-type(3) {
            font-size: 9px !important;
          }

          .hero-card {
            padding: 30px 20px !important;
          }
          .hero-icon {
            width: 72px !important;
            height: 72px !important;
          }
          .hero-icon svg {
            width: 36px !important;
            height: 36px !important;
          }
          .session-item {
            flex-wrap: wrap !important;
          }
          .session-time {
            margin-left: auto !important;
          }
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: '22px' }}>
        <p style={{
          fontSize: '11px',
          color: 'var(--accent)',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          fontWeight: 700,
          marginBottom: '6px',
        }}>
          Attendance
        </p>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 800,
          letterSpacing: '-0.02em',
          margin: 0,
          color: 'var(--text)',
        }}>
          Check-in
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>
          Track every session, build your streak
        </p>
      </div>

      {/* Stats - Changed to flex display via CSS class */}
      <div className="stats-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px',
        marginBottom: '16px',
      }}>
        <StatPill
          icon={Flame}
          iconColor="var(--accent)"
          value={recentCheckins.length}
          label="Total sessions"
          sub="All time"
        />
        <StatPill
          icon={Zap}
          iconColor="var(--amber)"
          value={`${Math.min(recentCheckins.length, 30)}d`}
          label="Current streak"
          sub="Keep it going"
        />
        <StatPill
          icon={Activity}
          iconColor="var(--green)"
          value={todayCheckins.length}
          label="Today"
          sub={todayCheckins.length > 0 ? 'Session logged ✓' : 'No session yet'}
        />
      </div>

      {/* Hero card */}
      <div className="hero-card" style={{
        padding: '40px 32px',
        textAlign: 'center',
        marginBottom: '16px',
        borderRadius: '18px',
        position: 'relative',
        overflow: 'hidden',
        border: `1px solid ${isCheckedIn ? 'color-mix(in srgb, var(--green) 27%, transparent)' : 'var(--border)'}`,
        background: isCheckedIn
          ? 'linear-gradient(135deg, color-mix(in srgb, var(--green) 10%, transparent) 0%, var(--surface) 60%)'
          : 'var(--surface)',
      }}>
        {isCheckedIn && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            height: '3px', background: 'var(--green)',
          }} />
        )}

        <div className="hero-icon" style={{
          width: '88px', height: '88px', borderRadius: '50%',
          margin: '0 auto 20px',
          background: isCheckedIn
            ? 'color-mix(in srgb, var(--green) 12%, transparent)'
            : 'color-mix(in srgb, var(--accent) 10%, transparent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `2px solid ${isCheckedIn
            ? 'color-mix(in srgb, var(--green) 27%, transparent)'
            : 'color-mix(in srgb, var(--accent) 20%, transparent)'}`,
        }}>
          {isCheckedIn
            ? <CheckCircle size={44} color="var(--green)" />
            : <UserCheck size={44} color="var(--accent)" />}
        </div>

        {isCheckedIn ? (
          <>
            <h2 style={{
              fontSize: '26px', fontWeight: 800,
              color: 'var(--green)', letterSpacing: '-0.02em', margin: 0,
            }}>
              Checked In
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-2)', marginTop: '8px' }}>
              Checked in at{' '}
              <strong style={{ color: 'var(--text)' }}>
                {todayCheckins.length > 0 ? formatTime(todayCheckins[0].check_in_time) : '—'}
              </strong>
            </p>
            {todayCheckins.length > 1 && (
              <p style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '4px' }}>
                {todayCheckins.length} sessions today
              </p>
            )}
          </>
        ) : (
          <>
            <h2 style={{
              fontSize: '26px', fontWeight: 800,
              letterSpacing: '-0.02em', margin: 0, color: 'var(--text)',
            }}>
              Ready to train?
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-2)', marginTop: '8px', marginBottom: '24px' }}>
              You haven't checked in yet today.
            </p>
            <button
              onClick={handleCheckIn}
              disabled={loading}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '13px 30px', borderRadius: '10px', border: 'none',
                background: 'var(--accent)', color: 'var(--bg)',
                fontSize: '15px', fontWeight: 700,
                cursor: loading ? 'default' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'opacity 0.2s',
              }}
            >
              <UserCheck size={18} />
              {loading ? 'Logging…' : 'Check in now'}
            </button>
          </>
        )}
      </div>

      {/* Recent sessions */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '9px',
            background: 'color-mix(in srgb, var(--green) 10%, transparent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Calendar size={16} color="var(--green)" />
          </div>
          <h3 style={{ fontSize: '14.5px', fontWeight: 700, margin: 0, color: 'var(--text)' }}>
            Recent sessions
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {recentCheckins.length > 0 ? (
            recentCheckins.map((record, idx) => (
              <div key={idx} className="session-item" style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 14px', borderRadius: '10px',
                background: 'var(--surface-2)', border: '1px solid var(--border)',
              }}>
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: 'var(--green)', flexShrink: 0,
                }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '13px', fontWeight: 700, margin: 0, color: 'var(--text)' }}>
                    Gym session
                  </p>
                  <p style={{ fontSize: '11px', color: 'var(--text-3)', margin: 0 }}>
                    {formatDate(record.check_in_time)}
                  </p>
                </div>
                <div className="session-time" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-3)' }}>
                  <Clock size={12} />
                  <span style={{
                    fontSize: '12px', fontWeight: 700,
                    fontVariantNumeric: 'tabular-nums', color: 'var(--text-3)',
                  }}>
                    {formatTime(record.check_in_time)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <Activity size={32} color="var(--text-3)" style={{ margin: '0 auto 10px', opacity: 0.4 }} />
              <p style={{ fontSize: '14px', color: 'var(--text-2)', fontWeight: 600 }}>No sessions yet</p>
              <p style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '4px' }}>
                Your workout history will appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}