// frontend/src/pages/coach/availability/components/CancelConfirm.jsx

import React from 'react'
import { AlertTriangle, Ban } from 'lucide-react'

export function CancelConfirm({
  isOpen,
  session,
  selectedDate,
  onClose,
  onConfirm,
  cancelling,
}) {
  if (!isOpen || !session) return null

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={onClose}>
      <div className="modal-box modal-box-sm" onClick={e => e.stopPropagation()}>
        <div style={{ padding: '28px 24px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{
            width: '50px', height: '50px', borderRadius: '14px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px',
          }}>
            <AlertTriangle size={22} color="#EF4444" />
          </div>
          <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text)', margin: '0 0 6px' }}>
            Cancel this session?
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-3)', margin: '0 0 16px', lineHeight: 1.5 }}>
            This cannot be undone. The member will be notified.
          </p>

          <div style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: '10px',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            textAlign: 'left',
          }}>
            <div className="av-session-avatar">
              {session.client_name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{session.client_name}</p>
              <p style={{ fontSize: 11, color: 'var(--text-3)', margin: '2px 0 0' }}>
                {selectedDate?.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} · {session.time} – {session.end_time}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
            <button className="btn-secondary" onClick={onClose} style={{ flex: 1 }}>
              Keep it
            </button>
            <button className="btn-danger" disabled={cancelling} onClick={onConfirm} style={{ flex: 1 }}>
              {cancelling
                ? <><div className="spinner spinner-white" style={{ width: '14px', height: '14px' }} /> Cancelling</>
                : <><Ban size={12} /> Yes, cancel</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}