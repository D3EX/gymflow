// frontend/src/pages/coach/availability/components/BreaksModal.jsx

import React from 'react'
import { Coffee, X, Save, Edit2 } from 'lucide-react'
import { DAYS } from '../utils/helpers'

export function BreaksModal({
  isOpen,
  breaks,
  form,
  editingBreak,
  onClose,
  onFormChange,
  onSave,
  onDelete,
  onEdit,
  submitting,
}) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-box-wide" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '9px',
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Coffee size={15} color="#F59E0B" />
            </div>
            <div>
              <p style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: 'var(--text)' }}>
                Manage Breaks
              </p>
              <p style={{ fontSize: '11px', color: 'var(--text-3)', margin: 0 }}>
                Add recurring or one-time breaks
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
          {/* Add/Edit Break Form */}
          <div style={{ 
            padding: '14px', 
            borderRadius: '10px', 
            background: 'var(--surface-2)', 
            border: '1px solid var(--border)',
            marginBottom: '16px'
          }}>
            <div className="av-break-form-grid" style={{ marginBottom: '10px' }}>
              <div>
                <label className="form-label">Day</label>
                <select
                  className="form-input"
                  value={form.day_of_week}
                  onChange={e => onFormChange({ ...form, day_of_week: e.target.value })}
                  disabled={!form.is_recurring}
                  style={{ opacity: form.is_recurring ? 1 : 0.5 }}
                >
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Start</label>
                <input
                  type="time"
                  className="form-input"
                  value={form.start_time}
                  onChange={e => onFormChange({ ...form, start_time: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">End</label>
                <input
                  type="time"
                  className="form-input"
                  value={form.end_time}
                  onChange={e => onFormChange({ ...form, end_time: e.target.value })}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.is_recurring}
                  onChange={e => onFormChange({ ...form, is_recurring: e.target.checked, date: e.target.checked ? null : form.date })}
                />
                Recurring (weekly)
              </label>
              {!form.is_recurring && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label className="form-label" style={{ margin: 0 }}>Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={form.date || ''}
                    onChange={e => onFormChange({ ...form, date: e.target.value })}
                    style={{ width: 'auto', padding: '6px 10px', fontSize: '12px' }}
                  />
                </div>
              )}
              <button
                className="btn-primary"
                disabled={submitting}
                onClick={onSave}
                style={{ padding: '6px 16px', fontSize: '12px', marginLeft: 'auto' }}
              >
                {submitting ? <div className="spinner" style={{ width: '12px', height: '12px' }} /> : <Save size={12} />}
                {editingBreak ? 'Update' : 'Add'}
              </button>
              {editingBreak && (
                <button
                  className="btn-secondary"
                  onClick={() => { onEdit(null); onFormChange({ day_of_week: 'Monday', start_time: '12:00', end_time: '13:00', is_recurring: true, date: null }) }}
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Breaks List */}
          <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Current Breaks ({breaks.filter(b => b.is_active !== false).length})
          </p>
          {breaks.filter(b => b.is_active !== false).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-3)', fontSize: '13px' }}>
              No breaks configured
            </div>
          ) : (
            breaks.filter(b => b.is_active !== false).map(b => (
              <div key={b.id} className="break-item">
                <div>
                  <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text)' }}>
                    {b.is_recurring ? b.day_of_week : b.date ? new Date(b.date).toLocaleDateString() : 'One-time'}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-2)', marginLeft: '8px' }}>
                    {b.start_time} – {b.end_time}
                  </span>
                  {b.is_recurring ? (
                    <span style={{ fontSize: '9px', color: 'var(--text-3)', marginLeft: '6px' }}>🔄 weekly</span>
                  ) : (
                    <span style={{ fontSize: '9px', color: 'var(--text-3)', marginLeft: '6px' }}>📅 one-time</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    className="btn-edit-sm"
                    onClick={() => onEdit(b)}
                    style={{ padding: '2px 8px', fontSize: '9px' }}
                  >
                    <Edit2 size={10} />
                  </button>
                  <button
                    className="btn-danger-ghost"
                    onClick={() => onDelete(b.id)}
                    style={{ padding: '2px 8px', fontSize: '9px' }}
                  >
                    <X size={10} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose} style={{ flex: 1 }}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}