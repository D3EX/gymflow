import { useState, useEffect } from 'react'
import { useTheme } from "../../contexts/ThemeContext"
import {
  Sun, Moon, Bell, Shield, Globe,
  Lock, Database, Save, RefreshCw, CheckCircle,
  DollarSign, Download, Palette, HardDrive,
  Building, Clock, CreditCard,
  Key, ChevronRight, ChevronLeft
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from "../../api/client"
import { COLORS, ThemeStyles } from '../../theme/GymTheme'

const C = COLORS

/* ─── section header ────────────────────────────────────────── */
function SectionHead({ icon: Icon, title, sub }) {
  return (
    <div className="settings-section-head" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24,
                  paddingBottom: 18, borderBottom: `1px solid ${C.line}` }}>
      <div className="settings-section-icon" style={{ width: 36, height: 36, borderRadius: 10, background: `${C.ember}18`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={17} color={C.ember} />
      </div>
      <div>
        <h2 className="settings-section-title" style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>{title}</h2>
        <p className="settings-section-sub" style={{ fontSize: 12, color: C.text3, margin: '3px 0 0' }}>{sub}</p>
      </div>
    </div>
  )
}

/* ─── toggle row ────────────────────────────────────────────── */
function ToggleRow({ label, desc, checked, onChange }) {
  return (
    <div className="settings-toggle-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '16px 18px', background: C.surface2, borderRadius: 12,
                  border: `1px solid ${checked ? C.ember + '40' : C.line}`,
                  transition: 'border-color .2s' }}>
      <div className="settings-toggle-text">
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

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function Settings() {
  const { isDark, toggleTheme } = useTheme()
  const [activeTab, setActiveTab] = useState('general')
  const [loading, setLoading]     = useState(false)
  const [saved, setSaved]         = useState(false)
  const [settings, setSettings]   = useState({
    gymName: 'GymFlow', gymEmail: 'contact@gymflow.com',
    gymPhone: '+213 123 456 789', gymAddress: '123 Fitness Street, Algiers',
    emailNotifications: true, expiryReminders: true,
    birthdayWishes: true, paymentReminders: true,
    twoFactorAuth: false, sessionTimeout: 30,
    currency: 'DZD', dateFormat: 'DD/MM/YYYY',
    compactView: false, autoBackup: true,
    language: 'en', timezone: 'Africa/Algiers',
    weekStart: 'monday', invoicePrefix: 'INV-', taxRate: 19,
  })

  const tabs = [
    { id: 'general',       label: 'General',       icon: Building   },
    { id: 'appearance',    label: 'Appearance',    icon: Palette    },
    { id: 'notifications', label: 'Notifications', icon: Bell       },
    { id: 'security',      label: 'Security',      icon: Shield     },
    { id: 'billing',       label: 'Billing',       icon: DollarSign },
    { id: 'backup',        label: 'Backup',        icon: HardDrive  },
  ]

  /* ── mobile pagination: tabs shown 2-by-2 ── */
  const [tabPage, setTabPage] = useState(0)
  const tabPairs = []
  for (let i = 0; i < tabs.length; i += 2) tabPairs.push(tabs.slice(i, i + 2))

  const selectTab = (id) => {
    setActiveTab(id)
    const idx = tabs.findIndex(t => t.id === id)
    setTabPage(Math.floor(idx / 2))
  }

  const set = (key, val) => { setSettings(p => ({ ...p, [key]: val })); setSaved(false) }

  const handleSave = async () => {
    setLoading(true)
    try {
      localStorage.setItem('gymSettings', JSON.stringify(settings))
      await new Promise(r => setTimeout(r, 500))
      setSaved(true)
      toast.success('Settings saved!')
      setTimeout(() => setSaved(false), 2000)
    } catch { toast.error('Failed to save') }
    finally  { setLoading(false) }
  }

  const handleReset = () => {
    if (!confirm('Reset all settings to default?')) return
    const def = {
      gymName: 'GymFlow', gymEmail: 'contact@gymflow.com',
      gymPhone: '+213 123 456 789', gymAddress: '123 Fitness Street, Algiers',
      emailNotifications: true, expiryReminders: true,
      birthdayWishes: true, paymentReminders: true,
      twoFactorAuth: false, sessionTimeout: 30,
      currency: 'DZD', dateFormat: 'DD/MM/YYYY',
      compactView: false, autoBackup: true,
      language: 'en', timezone: 'Africa/Algiers',
      weekStart: 'monday', invoicePrefix: 'INV-', taxRate: 19,
    }
    setSettings(def)
    localStorage.setItem('gymSettings', JSON.stringify(def))
    toast.success('Reset to default')
    setSaved(false)
  }

  const handleExport = async () => {
    const id = toast.loading('Exporting…')
    try {
      const [membersRes, paymentsRes] = await Promise.all([api.get('/members'), api.get('/payments')])
      const blob = new Blob([JSON.stringify({
        members: membersRes.data, payments: paymentsRes.data,
        settings, date: new Date().toISOString()
      }, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `gymflow-backup-${new Date().toISOString().split('T')[0]}.json`
      a.click(); URL.revokeObjectURL(url)
      toast.success('Exported!', { id })
    } catch { toast.error('Export failed', { id }) }
  }

  useEffect(() => {
    const saved = localStorage.getItem('gymSettings')
    if (saved) setSettings(JSON.parse(saved))
  }, [])

  return (
    <div className="gf-theme">
      <ThemeStyles />

      {/* ── mobile-only responsive styles (web layout untouched) ── */}
      <style>{`
        .mobile-page-header { display: none; }
        .mobile-tabs-pagination { display: none; }

        @media (max-width: 768px) {
          .desktop-page-header { display: none !important; }
          .mobile-page-header { display: block !important; }

          .mobile-header-row {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            gap: 10px !important;
          }
          .mobile-header-row .page-title { font-size: 22px !important; margin: 0 !important; }
          .mobile-header-btn {
            padding: 8px 12px !important;
            font-size: 12px !important;
            height: 36px !important;
            display: flex !important;
            align-items: center !important;
            gap: 6px !important;
            white-space: nowrap !important;
          }

          .settings-tabs-card { display: none !important; }
          .mobile-tabs-pagination { display: block !important; width: 100%; }
          .mobile-tabs-pagination .card { padding: 6px !important; }

          /* ── content cards ── */
          .settings-content-card {
            padding: 18px 16px !important;
            border-radius: 16px !important;
          }

          .settings-section-head {
            gap: 10px !important;
            margin-bottom: 18px !important;
            padding-bottom: 14px !important;
          }
          .settings-section-icon {
            width: 32px !important;
            height: 32px !important;
            border-radius: 9px !important;
          }
          .settings-section-title { font-size: 14.5px !important; }
          .settings-section-sub { font-size: 11.5px !important; }

          /* ── form grids collapse to single column ── */
          .settings-form-grid {
            grid-template-columns: 1fr !important;
            gap: 14px !important;
          }
          .settings-content-card .form-group { margin-bottom: 0 !important; }
          .settings-content-card .form-label { font-size: 12px !important; }
          .settings-content-card .form-input {
            font-size: 14px !important;
            height: 42px !important;
          }

          /* ── toggle rows ── */
          .settings-toggle-row {
            padding: 13px 14px !important;
            border-radius: 11px !important;
            gap: 10px !important;
          }
          .settings-toggle-text p:first-child { font-size: 12.5px !important; }
          .settings-toggle-text p:last-child {
            font-size: 10.5px !important;
            line-height: 1.4 !important;
          }
        }
      `}</style>

      {/* ── page header — desktop (untouched) ── */}
      <div className="page-header desktop-page-header">
        <div>
          <p style={{ fontSize: 11, color: C.ember, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 6 }}>
            Configuration
          </p>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Customize your gym management experience</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleReset} className="btn btn-secondary">
            <RefreshCw size={14} /> Reset
          </button>
          <button onClick={handleSave} className="btn btn-primary" disabled={loading}
            style={{ minWidth: 130, justifyContent: 'center' }}>
            {loading
              ? <><RefreshCw size={14} style={{ animation: 'gf-spin .8s linear infinite' }} /> Saving…</>
              : <><Save size={14} /> Save Changes</>
            }
          </button>
        </div>
      </div>

      {/* ── page header — mobile only ── */}
      <div className="mobile-page-header">
        <p style={{ fontSize: 11, color: C.ember, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 6 }}>
          Configuration
        </p>
        <div className="mobile-header-row">
          <h1 className="page-title">Settings</h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleReset} className="btn btn-secondary mobile-header-btn">
              <RefreshCw size={13} /> Reset
            </button>
            <button onClick={handleSave} className="btn btn-primary mobile-header-btn" disabled={loading}>
              {loading
                ? <RefreshCw size={13} style={{ animation: 'gf-spin .8s linear infinite' }} />
                : <><Save size={13} /> Save</>
              }
            </button>
          </div>
        </div>
        <p className="page-subtitle" style={{ marginTop: 6, marginBottom: 20 }}>Customize your gym management experience</p>
      </div>

      {/* ── success banner ── */}
      {saved && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '13px 18px', borderRadius: 12, marginBottom: 22,
          background: `${C.mint}0D`, border: `1px solid ${C.mint}40`,
        }}>
          <CheckCircle size={18} color={C.mint} />
          <span style={{ fontSize: 13, fontWeight: 600, color: C.mint }}>Settings saved successfully!</span>
        </div>
      )}

      {/* ── tabs — desktop (untouched) ── */}
      <div className="card settings-tabs-card" style={{ marginBottom: 24, padding: 6, display: 'inline-flex' }}>
        <div className="settings-tabs-grid" style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => selectTab(id)}
              className={`btn btn-sm ${activeTab === id ? 'btn-primary' : 'btn-ghost'}`}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', fontSize: 13 }}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── tabs — mobile only, paginated 2 by 2 ── */}
      <div className="card mobile-tabs-pagination" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setTabPage(p => Math.max(0, p - 1))}
            disabled={tabPage === 0}
            className="btn btn-sm btn-ghost"
            style={{ padding: '8px 10px', opacity: tabPage === 0 ? 0.35 : 1, flexShrink: 0 }}
          >
            <ChevronLeft size={16} />
          </button>

          <div style={{ display: 'flex', gap: 6, flex: 1 }}>
            {tabPairs[tabPage].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => selectTab(id)}
                className={`btn btn-sm ${activeTab === id ? 'btn-primary' : 'btn-ghost'}`}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                         gap: 6, padding: '10px 8px', fontSize: 12.5, fontWeight: 600 }}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setTabPage(p => Math.min(tabPairs.length - 1, p + 1))}
            disabled={tabPage === tabPairs.length - 1}
            className="btn btn-sm btn-ghost"
            style={{ padding: '8px 10px', opacity: tabPage === tabPairs.length - 1 ? 0.35 : 1, flexShrink: 0 }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          GENERAL
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'general' && (
        <div className="card settings-content-card" style={{ padding: '28px 30px' }}>
          <SectionHead icon={Building} title="General Information" sub="Basic information about your gym" />
          <div className="settings-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 18 }}>
            {[
              { label: 'Gym Name',      key: 'gymName',     type: 'text'  },
              { label: 'Email Address', key: 'gymEmail',    type: 'email' },
              { label: 'Phone Number',  key: 'gymPhone',    type: 'text'  },
              { label: 'Address',       key: 'gymAddress',  type: 'text'  },
            ].map(({ label, key, type }) => (
              <div className="form-group" key={key}>
                <label className="form-label">{label}</label>
                <input type={type} value={settings[key]}
                  onChange={e => set(key, e.target.value)} className="form-input" />
              </div>
            ))}
            <div className="form-group">
              <label className="form-label">Language</label>
              <select value={settings.language} onChange={e => set('language', e.target.value)} className="form-input">
                <option value="en">🇬🇧 English</option>
                <option value="fr">🇫🇷 Français</option>
                <option value="ar">🇸🇦 العربية</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Time Zone</label>
              <select value={settings.timezone} onChange={e => set('timezone', e.target.value)} className="form-input">
                <option value="Africa/Algiers">🌍 Africa/Algiers (GMT+1)</option>
                <option value="Europe/Paris">🌍 Europe/Paris</option>
                <option value="UTC">🌍 UTC</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          APPEARANCE
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'appearance' && (
        <div className="card settings-content-card" style={{ padding: '28px 30px' }}>
          <SectionHead icon={Palette} title="Appearance" sub="Customize how your dashboard looks" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* dark mode toggle — special button variant */}
            <div className="settings-toggle-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '16px 18px', background: C.surface2, borderRadius: 12,
                          border: `1px solid ${C.line}` }}>
              <div className="settings-toggle-text">
                <p style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: 0 }}>Dark Mode</p>
                <p style={{ fontSize: 11, color: C.text3, margin: '3px 0 0' }}>Switch between light and dark theme</p>
              </div>
              <button onClick={toggleTheme} className="btn btn-sm btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                {isDark ? <Sun size={13} /> : <Moon size={13} />}
                {isDark ? 'Light Mode' : 'Dark Mode'}
              </button>
            </div>

            <ToggleRow
              label="Compact View" desc="Reduce spacing to see more content"
              checked={settings.compactView} onChange={e => set('compactView', e.target.checked)}
            />

            <div className="form-group">
              <label className="form-label">Date Format</label>
              <select value={settings.dateFormat} onChange={e => set('dateFormat', e.target.value)} className="form-input">
                <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2024)</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2024)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (2024-12-31)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Week Starts On</label>
              <select value={settings.weekStart} onChange={e => set('weekStart', e.target.value)} className="form-input">
                <option value="monday">Monday</option>
                <option value="sunday">Sunday</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          NOTIFICATIONS
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'notifications' && (
        <div className="card settings-content-card" style={{ padding: '28px 30px' }}>
          <SectionHead icon={Bell} title="Notifications" sub="Choose what alerts you receive" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive important updates via email'         },
              { key: 'expiryReminders',    label: 'Expiry Reminders',    desc: 'Get alerted when memberships expire'         },
              { key: 'birthdayWishes',     label: 'Birthday Wishes',     desc: 'Automatically send birthday greetings'       },
              { key: 'paymentReminders',   label: 'Payment Reminders',   desc: 'Remind members about pending payments'       },
            ].map(({ key, label, desc }) => (
              <ToggleRow key={key} label={label} desc={desc}
                checked={settings[key]} onChange={e => set(key, e.target.checked)} />
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          SECURITY
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'security' && (
        <div className="card settings-content-card" style={{ padding: '28px 30px' }}>
          <SectionHead icon={Shield} title="Security" sub="Protect your account and data" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <ToggleRow
              label="Two-Factor Authentication" desc="Add an extra layer of security to your account"
              checked={settings.twoFactorAuth} onChange={e => set('twoFactorAuth', e.target.checked)}
            />
            <div className="form-group">
              <label className="form-label">Session Timeout</label>
              <select value={settings.sessionTimeout}
                onChange={e => set('sessionTimeout', parseInt(e.target.value))} className="form-input">
                <option value="15">15 minutes</option>
                <option value="30">30 minutes (Recommended)</option>
                <option value="60">1 hour</option>
                <option value="120">2 hours</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Password Policy</label>
              <select className="form-input">
                <option>Standard (8+ characters)</option>
                <option>Strong (12+ characters, symbols)</option>
                <option>Very Strong (16+ chars, numbers, symbols)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          BILLING
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'billing' && (
        <div className="card settings-content-card" style={{ padding: '28px 30px' }}>
          <SectionHead icon={DollarSign} title="Billing & Invoicing" sub="Configure your billing preferences" />
          <div className="settings-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 18 }}>
            <div className="form-group">
              <label className="form-label">Currency</label>
              <select value={settings.currency} onChange={e => set('currency', e.target.value)} className="form-input">
                <option value="DZD">🇩🇿 DZD — Algerian Dinar</option>
                <option value="USD">🇺🇸 USD — US Dollar</option>
                <option value="EUR">🇪🇺 EUR — Euro</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Tax Rate (%)</label>
              <input type="number" value={settings.taxRate}
                onChange={e => set('taxRate', parseFloat(e.target.value))} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Invoice Prefix</label>
              <input type="text" value={settings.invoicePrefix}
                onChange={e => set('invoicePrefix', e.target.value)} className="form-input" placeholder="INV-" />
            </div>
            <div className="form-group">
              <label className="form-label">Payment Terms</label>
              <select className="form-input">
                <option>Due on receipt</option>
                <option>Net 7 days</option>
                <option>Net 15 days</option>
                <option>Net 30 days</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          BACKUP
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'backup' && (
        <div className="card settings-content-card" style={{ padding: '28px 30px' }}>
          <SectionHead icon={HardDrive} title="Data & Backup" sub="Manage your data and export backups" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <ToggleRow
              label="Auto Backup" desc="Automatically backup your data daily"
              checked={settings.autoBackup} onChange={e => set('autoBackup', e.target.checked)}
            />
            <div className="form-group">
              <label className="form-label">Backup Frequency</label>
              <select className="form-input" disabled={!settings.autoBackup}>
                <option>Daily at 02:00 AM</option>
                <option>Weekly on Sunday</option>
                <option>Monthly on 1st</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Backup Location</label>
              <select className="form-input" disabled={!settings.autoBackup}>
                <option>Local Storage</option>
                <option>Cloud Backup (Coming Soon)</option>
              </select>
            </div>

            {/* last backup info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                          borderRadius: 12, background: C.surface2, border: `1px solid ${C.line}` }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: `${C.mint}18`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CheckCircle size={16} color={C.mint} />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: 0 }}>Last backup successful</p>
                <p style={{ fontSize: 11, color: C.text3, margin: '2px 0 0' }}>Today at 02:00 AM · 4.2 MB</p>
              </div>
            </div>

            <button onClick={handleExport} className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '13px', marginTop: 4 }}>
              <Download size={15} /> Export Data Now
            </button>
          </div>
        </div>
      )}
    </div>
  )
}