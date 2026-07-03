// frontend/src/pages/coach/availability/components/SessionRow.jsx

import React from 'react'
import { Clock, Check, X, Ban, Calendar } from 'lucide-react'

// ─── CONSTANTS ───────────────────────────────────────────────
const STATUS = {
  pending:   { bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.2)',  color: '#F59E0B', dot: '#F59E0B', label: 'Pending' },
  approved:  { bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.18)',  color: '#22C55E', dot: '#22C55E', label: 'Approved' },
  scheduled: { bg: 'rgba(77,158,245,0.08)', border: 'rgba(77,158,245,0.18)', color: '#4D9EF5', dot: '#4D9EF5', label: 'Scheduled' },
  completed: { bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.18)',  color: '#22C55E', dot: '#22C55E', label: 'Completed' },
  cancelled: { bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.18)',  color: '#EF4444', dot: '#EF4444', label: 'Cancelled' },
  rejected:  { bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.18)',  color: '#EF4444', dot: '#EF4444', label: 'Rejected' },
}

// ─── ACTION BUTTON ────────────────────────────────────────────
function Btn({ onClick, bg, border, color, children, ghost }) {
  return (
    <button
      onClick={onClick}
      style={{
        height: '28px',
        padding: '0 12px',
        borderRadius: '7px',
        border: ghost ? `1px solid ${border}` : 'none',
        background: ghost ? bg : bg,
        color: ghost ? color : color,
        fontSize: '11px',
        fontWeight: 700,
        cursor: 'pointer',
        fontFamily: 'inherit',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        transition: 'opacity 0.15s, transform 0.15s',
        whiteSpace: 'nowrap',
        letterSpacing: '0.01em',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.opacity = '0.75'
        e.currentTarget.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.opacity = '1'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {children}
    </button>
  )
}

// ─── SESSION ROW ─────────────────────────────────────────────
export function SessionRow({ session, onApprove, onReject, onComplete, onCancel }) {
  const st = STATUS[session.status] || STATUS.scheduled
  const active = !['completed', 'cancelled', 'rejected'].includes(session.status)
  const timeDisplay = session.time && session.end_time
    ? `${session.time} – ${session.end_time}`
    : session.time || ''

  return (
    <div
      className="av-session-grid"
      style={{
        padding: '11px 14px',
        borderRadius: '10px',
        border: '1px solid var(--border)',
        background: 'var(--surface)',
        transition: 'border-color 0.15s, background 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(249,115,22,0.25)'
        e.currentTarget.style.background = 'var(--surface-2)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.background = 'var(--surface)'
      }}
    >
      {/* Avatar */}
      <div style={{
        width: '38px', height: '38px', borderRadius: '50%',
        background: 'rgba(249,115,22,0.1)',
        border: '1px solid rgba(249,115,22,0.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '13px', fontWeight: 800, color: '#FF5A1F',
        flexShrink: 0, textTransform: 'uppercase',
      }}>
        {session.client_name?.[0]?.toUpperCase() || '?'}
      </div>

      {/* Info */}
      <div className="av-session-info-cell" style={{ minWidth: 0 }}>
        {/* Name + badges row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '3px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>
            {session.client_name || 'Unknown Client'}
          </span>

          {/* Status dot + label */}
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            fontSize: '10px', fontWeight: 700,
            padding: '2px 8px', borderRadius: '99px',
            background: st.bg, border: `1px solid ${st.border}`, color: st.color,
            letterSpacing: '0.02em',
          }}>
            <span style={{
              width: '5px', height: '5px', borderRadius: '50%',
              background: st.dot, flexShrink: 0,
              animation: session.status === 'pending' ? 'pulse-dot 2s infinite' : 'none',
            }} />
            {st.label}
          </span>

          {/* Recurring */}
          {session.is_recurring && (
            <span style={{
              fontSize: '9px', fontWeight: 700,
              padding: '2px 7px', borderRadius: '99px',
              background: 'rgba(139,92,246,0.1)',
              border: '1px solid rgba(139,92,246,0.2)',
              color: '#8B5CF6',
              letterSpacing: '0.04em', textTransform: 'uppercase',
              display: 'inline-flex', alignItems: 'center', gap: '3px',
            }}>
              <Calendar size={8} /> Recurring
            </span>
          )}
        </div>

        {/* Time + notes row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {timeDisplay && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              fontSize: '11px', fontWeight: 600, color: 'var(--text-3)',
            }}>
              <Clock size={10} color="var(--text-3)" />
              {timeDisplay}
            </span>
          )}
          {session.notes && (
            <>
              <span style={{ color: 'var(--border)', fontSize: '10px' }}>·</span>
              <span style={{
                fontSize: '11px', color: 'var(--text-3)', fontStyle: 'italic',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                maxWidth: '200px',
              }}>
                {session.notes}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="av-session-actions-cell" style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
        {session.status === 'pending' && (
          <>
            <Btn
              onClick={() => onApprove(session.id)}
              bg="rgba(34,197,94,0.12)" border="rgba(34,197,94,0.25)" color="#16A34A" ghost
            >
              <Check size={10} /> Approve
            </Btn>
            <Btn
              onClick={() => onReject(session.id)}
              bg="rgba(239,68,68,0.08)" border="rgba(239,68,68,0.2)" color="#EF4444" ghost
            >
              <X size={10} /> Reject
            </Btn>
          </>
        )}

        {(session.status === 'scheduled' || session.status === 'approved') && (
          <Btn
            onClick={() => onComplete(session.id)}
            bg="rgba(77,158,245,0.1)" border="rgba(77,158,245,0.22)" color="#4D9EF5" ghost
          >
            <Check size={10} /> Done
          </Btn>
        )}

        {active && (
          <Btn
            onClick={() => onCancel(session)}
            bg="rgba(239,68,68,0.06)" border="rgba(239,68,68,0.18)" color="#EF4444" ghost
          >
            <Ban size={10} /> Cancel
          </Btn>
        )}
      </div>
    </div>
  )
}