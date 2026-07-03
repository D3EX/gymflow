// frontend/src/pages/coach/availability/components/SettingsModal.jsx

import React from 'react'
import { Settings, X, Save } from 'lucide-react'

export function SettingsModal({
  isOpen,
  form,
  onClose,
  onChange,
  onSave,
  submitting,
}) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '9px',
              background: 'rgba(77, 158, 245, 0.12)',
              border: '1px solid rgba(77, 158, 245, 0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Settings size={15} color="var(--blue)" />
            </div>
            <div>
              <p style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: 'var(--text)' }}>
                Coach Settings
              </p>
              <p style={{ fontSize: '11px', color: 'var(--text-3)', margin: 0 }}>
                Configure your session preferences
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
          <div className="setting-item">
            <div>
              <div className="setting-label">Max Sessions Per Day</div>
              <div className="setting-desc">Maximum number of sessions you can have in one day</div>
            </div>
            <input
              type="number"
              className="setting-input"
              value={form.max_sessions_per_day}
              onChange={e => onChange({ ...form, max_sessions_per_day: parseInt(e.target.value) || 0 })}
              min="0"
              max="20"
            />
          </div>

          <div className="setting-item">
            <div>
              <div className="setting-label">Session Duration</div>
              <div className="setting-desc">Default length of a session (minutes)</div>
            </div>
            <input
              type="number"
              className="setting-input"
              value={form.session_duration}
              onChange={e => onChange({ ...form, session_duration: parseInt(e.target.value) || 0 })}
              min="15"
              max="180"
              step="15"
            />
          </div>

          <div className="setting-item">
            <div>
              <div className="setting-label">Buffer Between Sessions</div>
              <div className="setting-desc">Minutes between sessions (prep time)</div>
            </div>
            <input
              type="number"
              className="setting-input"
              value={form.buffer_between_sessions}
              onChange={e => onChange({ ...form, buffer_between_sessions: parseInt(e.target.value) || 0 })}
              min="0"
              max="60"
            />
          </div>

          <div className="setting-item">
            <div>
              <div className="setting-label">Auto-approve Bookings</div>
              <div className="setting-desc">Automatically approve session requests</div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.allow_auto_approval}
                onChange={e => onChange({ ...form, allow_auto_approval: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: 'var(--accent)' }}
              />
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>
                {form.allow_auto_approval ? 'Enabled' : 'Disabled'}
              </span>
            </label>
          </div>

          <div style={{ 
            marginTop: '12px', 
            padding: '12px 14px', 
            borderRadius: '10px', 
            background: 'rgba(77, 158, 245, 0.05)', 
            border: '1px solid rgba(77, 158, 245, 0.15)' 
          }}>
            <p style={{ fontSize: '11px', color: 'var(--text-3)', margin: 0 }}>
              These settings apply to all your sessions and affect how members book with you.
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-primary" disabled={submitting} onClick={onSave} style={{ flex: 1 }}>
            {submitting
              ? <><div className="spinner" style={{ width: '14px', height: '14px' }} /> Saving…</>
              : <><Save size={13} /> Save Settings</>
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