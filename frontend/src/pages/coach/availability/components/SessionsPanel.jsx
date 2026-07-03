// frontend/src/pages/coach/availability/components/SessionsPanel.jsx

import React from 'react'
import { Calendar, Dumbbell, Edit2, RefreshCw, Clock, Ban, Zap, Coffee, Users, CheckCircle } from 'lucide-react'
import { SessionRow } from './SessionRow'
import { toDateStr, calcSlots } from '../utils/helpers'

// ─── ICON BOX ─────────────────────────────────────────────────
function IconBox({ icon: Icon, color, size = 16 }) {
  return (
    <div style={{
      width: '34px', height: '34px', borderRadius: '9px',
      background: `${color}12`,
      border: `1px solid ${color}20`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <Icon size={size} color={color} />
    </div>
  )
}

// ─── PILL ────────────────────────────────────────────────────
function Pill({ children, color, dot, pulse }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '3px 10px', borderRadius: '99px',
      background: `${color}10`, border: `1px solid ${color}22`,
      fontSize: '10px', fontWeight: 700, color,
      letterSpacing: '0.02em', whiteSpace: 'nowrap',
    }}>
      {dot && (
        <span style={{
          width: '5px', height: '5px', borderRadius: '50%',
          background: color, flexShrink: 0,
          animation: pulse ? 'pulse-dot 2s infinite' : 'none',
        }} />
      )}
      {children}
    </span>
  )
}

// ─── ICON BUTTON ─────────────────────────────────────────────
function IconBtn({ onClick, icon: Icon, label, primary }) {
  return (
    <button
      onClick={onClick}
      style={{
        height: '32px',
        padding: '0 14px',
        borderRadius: '8px',
        border: primary ? 'none' : '1px solid var(--border)',
        background: primary ? '#C56A2A' : 'var(--surface)',
        color: primary ? '#fff' : 'var(--text-2)',
        fontSize: '11px', fontWeight: 700,
        cursor: 'pointer', fontFamily: 'inherit',
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        transition: 'opacity 0.15s, transform 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.opacity = '0.8'
        e.currentTarget.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.opacity = '1'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      <Icon size={12} />
      {label}
    </button>
  )
}

// ─── EMPTY STATE ─────────────────────────────────────────────
function EmptyState({ icon: Icon, iconColor = 'var(--text-3)', title, sub }) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '48px 20px', gap: '10px', textAlign: 'center',
    }}>
      <div style={{
        width: '52px', height: '52px', borderRadius: '14px',
        background: 'var(--surface-2)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={24} color={iconColor} />
      </div>
      <div>
        <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-2)', margin: 0 }}>{title}</p>
        <p style={{ fontSize: '12px', color: 'var(--text-3)', margin: '4px 0 0' }}>{sub}</p>
      </div>
    </div>
  )
}

// ─── MAIN PANEL ──────────────────────────────────────────────
export function SessionsPanel({
  selectedDate,
  selectedSessions,
  selectedAvail,
  selectedBreaks,
  isLoading,
  dateOverrides,
  onEditDate,
  onRefresh,
  onApprove,
  onReject,
  onComplete,
  onCancel,
}) {
  const shell = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    overflow: 'hidden',
    minHeight: '420px',
    maxHeight: '640px',
    display: 'flex',
    flexDirection: 'column',
  }

  // ── no date selected ──────────────────────────────────────
  if (!selectedDate) {
    return (
      <div style={shell}>
        <EmptyState
          icon={Calendar}
          title="Select a date"
          sub="Click any day on the calendar to see bookings"
        />
      </div>
    )
  }

  const dateStr = toDateStr(selectedDate)
  const isDayClosed = !selectedAvail || !selectedAvail.is_available
  const totalSessions     = selectedSessions.length
  const pendingSessions   = selectedSessions.filter(s => s.status === 'pending').length
  const confirmedSessions = selectedSessions.filter(s => ['scheduled', 'approved'].includes(s.status)).length

  const formattedDate = selectedDate.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
  const formattedYear = selectedDate.toLocaleDateString('en-GB', { year: 'numeric' })

  return (
    <div style={shell}>
      <style>{`
        @keyframes pulse-dot {
          0%,100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.75); }
        }
        .session-scroll::-webkit-scrollbar { width: 4px; }
        .session-scroll::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }
        .session-scroll::-webkit-scrollbar-track { background: transparent; }
      `}</style>

      {/* ── HEADER ─────────────────────────────────────────── */}
      <div style={{
        padding: '16px 18px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface-2)',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}>
        {/* Row 1: date + buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '11px', minWidth: 0 }}>
            <IconBox icon={Calendar} color="#FF5A1F" />
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text)', margin: 0, lineHeight: 1.2 }}>
                {formattedDate}
              </h3>
              <p style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-3)', margin: 0, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {formattedYear}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <IconBtn onClick={onRefresh}              icon={RefreshCw} label="Refresh" />
            <IconBtn onClick={() => onEditDate(selectedDate)} icon={Edit2}    label="Edit"    primary />
          </div>
        </div>

        {/* Row 2: status + stats badges */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
          {/* Left: availability + override + breaks */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {selectedAvail?.is_available ? (
              <Pill color="#22C55E" dot pulse>
                <Clock size={9} />
                {selectedAvail.start_time} – {selectedAvail.end_time}
                <span style={{
                  height: '12px', width: '1px',
                  background: 'rgba(34,197,94,0.3)',
                  display: 'inline-block', margin: '0 1px',
                }} />
                <span style={{ fontWeight: 800 }}>{calcSlots(selectedAvail.start_time, selectedAvail.end_time)} slots</span>
              </Pill>
            ) : (
              <Pill color="#EF4444">
                <Ban size={9} /> Closed
              </Pill>
            )}

            {dateOverrides[dateStr] && (
              <Pill color="#4D9EF5">
                <Zap size={9} /> Override
              </Pill>
            )}

            {selectedBreaks.length > 0 && selectedAvail?.is_available && (
              <>
                <span style={{ width: '1px', height: '16px', background: 'var(--border)', flexShrink: 0 }} />
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Coffee size={11} color="#F59E0B" />
                  {selectedBreaks.map((b, i) => (
                    <React.Fragment key={i}>
                      <span style={{
                        fontSize: '10px', fontWeight: 600, color: 'var(--text-2)',
                        background: 'rgba(245,158,11,0.08)',
                        border: '1px solid rgba(245,158,11,0.15)',
                        padding: '1px 7px', borderRadius: '99px',
                        display: 'inline-flex', alignItems: 'center', gap: '3px',
                      }}>
                        {b.start_time}–{b.end_time}
                        {b.is_recurring && <span style={{ fontSize: '8px', opacity: 0.5 }}>↻</span>}
                      </span>
                      {i < selectedBreaks.length - 1 && (
                        <span style={{ fontSize: '8px', color: 'var(--text-3)' }}>·</span>
                      )}
                    </React.Fragment>
                  ))}
                </span>
              </>
            )}
          </div>

          {/* Right: session counts */}
          {!isDayClosed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Pill color="#4D9EF5">
                <Users size={9} /> {totalSessions} total
              </Pill>
              {pendingSessions > 0 && (
                <Pill color="#F59E0B" dot pulse>
                  {pendingSessions} pending
                </Pill>
              )}
              {confirmedSessions > 0 && (
                <Pill color="#22C55E">
                  <CheckCircle size={9} /> {confirmedSessions} confirmed
                </Pill>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── CONTENT ────────────────────────────────────────── */}
      {isLoading && selectedSessions.length === 0 ? (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: '10px',
          color: 'var(--text-3)', fontSize: '12px',
        }}>
          <div className="spinner" style={{ width: '22px', height: '22px' }} />
          Loading sessions…
        </div>

      ) : isDayClosed ? (
        <EmptyState
          icon={Ban}
          iconColor="#EF4444"
          title="Day is closed"
          sub="No bookings accepted on this day"
        />

      ) : selectedSessions.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title="No sessions booked"
          sub="This day is open but completely free"
        />

      ) : (
        <div
          className="session-scroll"
          style={{
            flex: 1, overflowY: 'auto',
            padding: '12px 14px',
            display: 'flex', flexDirection: 'column', gap: '6px',
          }}
        >
          {selectedSessions.map(s => (
            <SessionRow
              key={s.id}
              session={s}
              onApprove={onApprove}
              onReject={onReject}
              onComplete={onComplete}
              onCancel={onCancel}
            />
          ))}
        </div>
      )}
    </div>
  )
}