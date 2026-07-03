// frontend/src/pages/super-admin/Settings.jsx

import { useEffect, useState } from 'react'
import { useTheme } from "../../contexts/ThemeContext"
import {
  Sun, Moon, Shield, Save, RefreshCw, CheckCircle,
  HardDrive, Building, Key, ChevronRight, ChevronLeft,
  Globe, Palette, Bell, Lock, Database, DollarSign
} from 'lucide-react'
import toast from 'react-hot-toast'
import { COLORS, ThemeStyles } from '../../theme/GymTheme'

const C = COLORS

function ToggleRow({ label, desc, checked, onChange }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '16px 18px', background: C.surface2, borderRadius: 12,
      border: `1px solid ${checked ? C.ember + '40' : C.line}`,
      transition: 'border-color .2s'
    }}>
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: 0 }}>{label}</p>
        <p style={{ fontSize: 11, color: C.text3, margin: '3px 0 0' }}>{desc}</p>
      </div>
      <label style={{ position: 'relative', display: 'inline-block', width: 42, height: 24, flexShrink: 0 }}>
        <input type="checkbox" checked={checked} onChange={onChange}
          style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
        <span style={{
          position: 'absolute', inset: 0, borderRadius: 99, cursor: 'pointer',
          background: checked ? C.ember : C.line, transition: 'background .2s'
        }} />
        <span style={{
          position: 'absolute', top: 3, left: checked ? 21 : 3, width: 18, height: 18,
          borderRadius: '50%', background: '#fff', transition: 'left .2s',
          boxShadow: '0 1px 4px rgba(0,0,0,0.3)'
        }} />
      </label>
    </div>
  )
}

export default function SuperAdminSettings() {
  const { isDark, toggleTheme } = useTheme()
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [settings, setSettings] = useState({
    autoBackup: true,
    twoFactorAuth: false,
    sessionTimeout: 30,
    language: 'en',
    timezone: 'Africa/Algiers',
    maintenanceMode: false,
  })

  const set = (key, val) => { setSettings(p => ({ ...p, [key]: val })); setSaved(false) }

  const handleSave = async () => {
    setLoading(true)
    try {
      localStorage.setItem('superAdminSettings', JSON.stringify(settings))
      await new Promise(r => setTimeout(r, 500))
      setSaved(true)
      toast.success('Settings saved!')
      setTimeout(() => setSaved(false), 2000)
    } catch { toast.error('Failed to save') }
    finally { setLoading(false) }
  }

  useEffect(() => {
    const saved = localStorage.getItem('superAdminSettings')
    if (saved) setSettings(JSON.parse(saved))
  }, [])

  return (
    <div className="gf-theme">
      <ThemeStyles />

      <div className="page-header">
        <div>
          <h1 className="page-title">Super Admin Settings</h1>
          <p className="page-subtitle">System-wide configuration</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleSave} className="btn btn-primary" disabled={loading}>
            {loading ? <><RefreshCw size={14} style={{ animation: 'spin .8s linear infinite' }} /> Saving…</> : <><Save size={14} /> Save Changes</>}
          </button>
        </div>
      </div>

      {saved && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '13px 18px', borderRadius: 12, marginBottom: 22,
          background: `${C.mint}0D`, border: `1px solid ${C.mint}40`
        }}>
          <CheckCircle size={18} color={C.mint} />
          <span style={{ fontSize: 13, fontWeight: 600, color: C.mint }}>Settings saved successfully!</span>
        </div>
      )}

      <div className="card" style={{ padding: '28px 30px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, paddingBottom: 18, borderBottom: `1px solid ${C.line}` }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `${C.ember}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Shield size={17} color={C.ember} />
          </div>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>Security</h2>
            <p style={{ fontSize: 12, color: C.text3, margin: '3px 0 0' }}>System-wide security settings</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <ToggleRow
            label="Maintenance Mode"
            desc="Disable all non-admin access during maintenance"
            checked={settings.maintenanceMode}
            onChange={e => set('maintenanceMode', e.target.checked)}
          />
          <ToggleRow
            label="Two-Factor Authentication"
            desc="Require 2FA for all super admin accounts"
            checked={settings.twoFactorAuth}
            onChange={e => set('twoFactorAuth', e.target.checked)}
          />
          <div className="form-group">
            <label className="form-label">Session Timeout</label>
            <select value={settings.sessionTimeout}
              onChange={e => set('sessionTimeout', parseInt(e.target.value))} className="form-input">
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="120">2 hours</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '28px 30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, paddingBottom: 18, borderBottom: `1px solid ${C.line}` }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `${C.mint}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <HardDrive size={17} color={C.mint} />
          </div>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>System</h2>
            <p style={{ fontSize: 12, color: C.text3, margin: '3px 0 0' }}>Global preferences</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <ToggleRow
            label="Auto Backup"
            desc="Automatically backup all gym data daily"
            checked={settings.autoBackup}
            onChange={e => set('autoBackup', e.target.checked)}
          />
          <div className="form-group">
            <label className="form-label">Language</label>
            <select value={settings.language} onChange={e => set('language', e.target.value)} className="form-input">
              <option value="en">🇬🇧 English</option>
              <option value="fr">🇫🇷 Français</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Time Zone</label>
            <select value={settings.timezone} onChange={e => set('timezone', e.target.value)} className="form-input">
              <option value="Africa/Algiers">🌍 Africa/Algiers (GMT+1)</option>
              <option value="UTC">🌍 UTC</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}