// frontend/src/pages/coach/availability/components/DayEditModal.jsx

import React from 'react'
import { Clock, X, Zap, AlertTriangle, Save, Coffee, Edit2, RefreshCw, CalendarDays } from 'lucide-react'
import { toDateStr, calcSlots } from '../utils/helpers'

export function DayEditModal({
  isOpen,
  form,
  onClose,
  onChange,
  onSave,
  onRemoveOverride,
  selectedBreaks,
  submitting,
  onManageBreaks,
}) {
  if (!isOpen) return null

  const dateStr = form.date ? toDateStr(form.date) : ''

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '9px',
              background: 'rgba(249, 115, 22, 0.12)',
              border: '1px solid rgba(249, 115, 22, 0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Clock size={15} color="var(--accent)" />
            </div>
            <div>
              <p style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: 'var(--text)' }}>
                {form.day} · {dateStr}
              </p>
              <p style={{ fontSize: '11px', color: 'var(--text-3)', margin: 0 }}>
                {form.is_override ? 'Custom override for this date' : 'Default schedule pattern'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '28px', height: '28px', borderRadius: '7px',
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text-3)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-3)'; e.currentTarget.style.color = 'var(--text)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)' }}
          >
            <X size={14} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label className="form-label">Start time</label>
              <input
                type="time"
                className="form-input"
                value={form.start_time}
                onChange={e => onChange({ ...form, start_time: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">End time</label>
              <input
                type="time"
                className="form-input"
                value={form.end_time}
                onChange={e => onChange({ ...form, end_time: e.target.value })}
              />
            </div>
          </div>

          {calcSlots(form.start_time, form.end_time) > 0 ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: '9px',
              background: 'rgba(249, 115, 22, 0.08)',
              border: '1px solid rgba(249, 115, 22, 0.2)',
              marginBottom: '16px',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--text)',
            }}>
              <Zap size={12} color="var(--accent)" />
              <span>{form.start_time} – {form.end_time} · {calcSlots(form.start_time, form.end_time)} slots available</span>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: '9px',
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              marginBottom: '16px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#92400e',
            }}>
              <AlertTriangle size={12} color="#F59E0B" />
              <span>Invalid time range — no slots available</span>
            </div>
          )}

          <div style={{ marginTop: '4px' }}>
            <label className="form-label">Status</label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '10px',
                border: form.is_available ? '1px solid rgba(249, 115, 22, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                background: form.is_available ? 'rgba(249, 115, 22, 0.08)' : 'rgba(239, 68, 68, 0.05)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                userSelect: 'none',
              }}
              onClick={() => onChange({ ...form, is_available: !form.is_available })}
            >
              <div className={`toggle-track ${form.is_available ? 'on' : 'off'}`}>
                <div className={`toggle-thumb ${form.is_available ? 'on' : 'off'}`} />
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                  {form.is_available ? 'Open for bookings' : 'Closed'}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-3)', margin: 0 }}>
                  {form.is_available ? 'Members can book sessions on this day' : 'No new bookings accepted'}
                </p>
              </div>
            </div>
          </div>

          {selectedBreaks.length > 0 && (
            <div style={{ marginTop: '14px', padding: '12px 14px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
              <p style={{ fontSize: '10px', fontWeight: 700, color: '#92400e', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <Coffee size={10} style={{ display: 'inline', marginRight: '4px' }} /> Breaks on this day
              </p>
              {selectedBreaks.map((b, i) => (
                <span key={i} style={{
                  fontSize: '11px',
                  color: '#92400e',
                  background: 'rgba(245, 158, 11, 0.1)',
                  padding: '2px 10px',
                  borderRadius: '99px',
                  fontWeight: 600,
                  marginRight: '6px',
                  display: 'inline-block'
                }}>
                  {b.start_time}–{b.end_time} {b.is_recurring ? <RefreshCw size={8} style={{ display: 'inline', verticalAlign: 'middle' }} /> : <CalendarDays size={8} style={{ display: 'inline', verticalAlign: 'middle' }} />}
                </span>
              ))}
              <button
                type="button"
                onClick={onManageBreaks}
                style={{
                  display: 'block',
                  marginTop: '6px',
                  padding: '2px 10px',
                  borderRadius: '4px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--blue)',
                  fontSize: '10px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontFamily: 'inherit'
                }}
              >
                Manage breaks →
              </button>
            </div>
          )}

          {form.is_override && (
            <div style={{ marginTop: '14px', padding: '12px 14px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <p style={{ fontSize: '11px', color: 'var(--text-3)', margin: 0 }}>
                This is a custom override for this specific date.
              </p>
              <button
                type="button"
                onClick={onRemoveOverride}
                disabled={submitting}
                style={{
                  marginTop: '8px',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  background: 'transparent',
                  color: '#EF4444',
                  fontSize: '10px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                Remove override (use default)
              </button>
            </div>
          )}

          {!form.is_override && form.date && (
            <div style={{ marginTop: '14px', padding: '12px 14px', borderRadius: '10px', background: 'rgba(77, 158, 245, 0.05)', border: '1px solid rgba(77, 158, 245, 0.2)' }}>
              <p style={{ fontSize: '11px', color: 'var(--text-3)', margin: 0 }}>
                Saving will create a custom override for <strong>{dateStr}</strong> only.
                <br />Other {form.day}s will use the default schedule.
              </p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-primary" disabled={submitting} onClick={onSave} style={{ flex: 1 }}>
            {submitting
              ? <><div className="spinner" style={{ width: '14px', height: '14px' }} /> Saving…</>
              : <><Save size={13} /> {form.is_override ? 'Update override' : 'Create override'}</>
            }
          </button>
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}