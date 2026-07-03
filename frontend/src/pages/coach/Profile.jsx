// frontend/src/pages/coach/Settings.jsx

import { useState, useEffect } from 'react'
import { Bell, Lock, User, Moon, Sun, Save, Users, Dumbbell, RefreshCw, CheckCircle, XCircle, UserCheck, Calendar, AlertCircle } from 'lucide-react'
import api from '../../api/client'
import toast from 'react-hot-toast'
import { useTheme } from '../../contexts/ThemeContext'

export default function CoachSettings() {
  const { isDark, toggleTheme } = useTheme()
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  })
  const [loading, setLoading] = useState(false)
  
  // Stats state
  const [stats, setStats] = useState({
    clients: { total: 0, active: 0 },
    programs: { total: 0, active: 0 },
    sessions: { total: 0, upcoming: 0, completed: 0 }
  })
  const [statsLoading, setStatsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch stats on mount
  useEffect(() => {
    console.log('🔵 Settings page mounted - fetching stats...')
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setStatsLoading(true)
    setError(null)
    console.log('🔄 Fetching stats...')
    
    try {
      // 1. Fetch clients
      console.log('📥 Fetching clients from /coach/clients...')
      let clients = []
      try {
        const clientsRes = await api.get('/coach/clients')
        console.log('✅ Clients response:', clientsRes.status, clientsRes.data)
        
        if (Array.isArray(clientsRes.data)) {
          clients = clientsRes.data
        } else if (clientsRes.data && clientsRes.data.data && Array.isArray(clientsRes.data.data)) {
          clients = clientsRes.data.data
        } else if (clientsRes.data && clientsRes.data.clients && Array.isArray(clientsRes.data.clients)) {
          clients = clientsRes.data.clients
        } else {
          const values = Object.values(clientsRes.data || {})
          const arrayVal = values.find(v => Array.isArray(v))
          if (arrayVal) clients = arrayVal
        }
        console.log('📊 Processed clients:', clients.length)
      } catch (e) {
        console.error('❌ Failed to fetch clients:', e)
      }

      // 2. Fetch programs
      console.log('📥 Fetching programs from /programs/coach...')
      let programs = []
      try {
        const programsRes = await api.get('/programs/coach')
        console.log('✅ Programs response:', programsRes.status, programsRes.data)
        
        if (Array.isArray(programsRes.data)) {
          programs = programsRes.data
        } else if (programsRes.data && programsRes.data.data && Array.isArray(programsRes.data.data)) {
          programs = programsRes.data.data
        } else if (programsRes.data && programsRes.data.programs && Array.isArray(programsRes.data.programs)) {
          programs = programsRes.data.programs
        } else {
          const values = Object.values(programsRes.data || {})
          const arrayVal = values.find(v => Array.isArray(v))
          if (arrayVal) programs = arrayVal
        }
        console.log('📊 Processed programs:', programs.length)
      } catch (e) {
        console.error('❌ Failed to fetch programs:', e)
        try {
          console.log('📥 Trying alternative: /programs...')
          const altRes = await api.get('/programs')
          console.log('✅ Alternative programs response:', altRes.data)
          if (Array.isArray(altRes.data)) {
            programs = altRes.data
          } else if (altRes.data && altRes.data.data) {
            programs = altRes.data.data
          }
        } catch (altErr) {
          console.error('❌ Alternative also failed:', altErr)
        }
      }

      // 3. Fetch sessions stats
      console.log('📥 Fetching sessions...')
      let sessions = { total: 0, upcoming: 0, completed: 0 }
      try {
        const today = new Date().toISOString().split('T')[0]
        const sessionsRes = await api.get(`/personal-sessions/coach/booked/admin/${today}`)
        console.log('✅ Sessions response:', sessionsRes.data)
        
        let allSessions = []
        if (Array.isArray(sessionsRes.data)) {
          allSessions = sessionsRes.data
        } else if (sessionsRes.data && sessionsRes.data.data) {
          allSessions = sessionsRes.data.data
        }
        
        sessions.total = allSessions.length
        sessions.upcoming = allSessions.filter(s => 
          s.status === 'scheduled' || s.status === 'approved' || s.status === 'pending'
        ).length
        sessions.completed = allSessions.filter(s => s.status === 'completed').length
        console.log('📊 Processed sessions:', sessions)
      } catch (e) {
        console.error('❌ Failed to fetch sessions:', e)
      }

      const newStats = {
        clients: {
          total: clients.length,
          active: clients.filter(c => c.status === 'active' || c.is_active !== false).length
        },
        programs: {
          total: programs.length,
          active: programs.filter(p => p.is_active === true || p.is_active === 1).length
        },
        sessions: sessions
      }
      
      console.log('📊 Final stats:', newStats)
      setStats(newStats)
      
    } catch (error) {
      console.error('❌ Error in fetchStats:', error)
      setError(error.message || 'Failed to load statistics')
      toast.error('Failed to load statistics')
    } finally {
      setStatsLoading(false)
      console.log('✅ Stats loading complete')
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('Passwords do not match')
      return
    }

    if (passwordData.new_password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    try {
      await api.put('/auth/change-password', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      })
      toast.success('Password changed successfully')
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      })
    } catch (error) {
      console.error('Error changing password:', error)
      toast.error(error.response?.data?.detail || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      background: 'var(--bg)',
      color: 'var(--text)',
      fontFamily: "'Inter', -apple-system, sans-serif",
      padding: '0',
      minHeight: '100vh',
      boxSizing: 'border-box',
    }}>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }
        ::-webkit-scrollbar-track { background: transparent; }
        
        .settings-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 24px;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
        }
        .settings-card:hover {
          border-color: rgba(249, 115, 22, 0.2);
        }
        
        .stat-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 16px 20px;
          transition: all 0.2s ease;
        }
        .stat-card:hover {
          border-color: rgba(249, 115, 22, 0.2);
          transform: translateY(-2px);
        }
        
        .form-input {
          width: 100%;
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: var(--surface-2);
          color: var(--text);
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
          font-family: inherit;
        }
        .form-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.15);
        }
        .form-input::placeholder {
          color: var(--text-3);
        }
        
        .form-label {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-3);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          display: block;
          margin-bottom: 6px;
        }
        
        .btn-primary {
          padding: 10px 20px;
          border-radius: 10px;
          border: none !important;
          background: #C56A2A !important;
          background-color: #C56A2A !important;
          color: #FFFFFF !important;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: inherit;
        }
        .btn-primary:hover:not(:disabled) {
          opacity: 0.85 !important;
          transform: translateY(-2px);
        }
        .btn-primary:disabled {
          opacity: 0.5 !important;
          cursor: not-allowed;
          transform: none !important;
        }
        
        .btn-secondary {
          padding: 10px 20px;
          border-radius: 10px;
          border: 1px solid var(--border) !important;
          background: transparent !important;
          color: var(--text-2) !important;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: inherit;
        }
        .btn-secondary:hover {
          border-color: var(--text) !important;
          color: var(--text) !important;
        }
        
        .toggle-track {
          width: 48px;
          height: 28px;
          border-radius: 99px;
          background: var(--border);
          position: relative;
          cursor: pointer;
          transition: background 0.2s;
          flex-shrink: 0;
        }
        .toggle-track.on {
          background: var(--accent);
        }
        .toggle-thumb {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #fff;
          position: absolute;
          top: 3px;
          left: 3px;
          transition: left 0.2s;
          box-shadow: 0 2px 4px rgba(0,0,0,0.15);
        }
        .toggle-thumb.on {
          left: 23px;
        }
        
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .settings-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        @media (max-width: 768px) {
          .settings-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Page Header */}
      <div style={{ marginBottom: 26 }}>
        <p style={{
          fontSize: '10px',
          color: 'var(--accent)',
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          fontWeight: 700,
          marginBottom: 6,
          marginTop: 0,
        }}>
          Account
        </p>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <h1 style={{
              fontSize: '30px',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              margin: 0,
              color: 'var(--text)',
            }}>
              Settings
            </h1>
            <p style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: 5, marginBottom: 0 }}>
              Manage your account preferences
            </p>
          </div>
          <button
            className="btn-secondary"
            onClick={fetchStats}
            style={{ padding: '8px 16px', fontSize: '12px' }}
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}


      {/* Error message if any */}
      {error && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '10px',
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          color: '#DC2626',
          fontSize: '13px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* ─── TWO COLUMN GRID FOR PASSWORD + NOTIFICATIONS ─── */}
      <div className="settings-grid">
        {/* Password Change */}
        <div className="settings-card">
          <h2 style={{
            fontSize: '15px',
            fontWeight: 750,
            color: 'var(--text)',
            margin: '0 0 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Lock size={16} color="#EF4444" />
            </div>
            Change Password
          </h2>
          <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
            <div>
              <label className="form-label">Current Password</label>
              <input
                type="password"
                value={passwordData.current_password}
                onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                className="form-input"
                required
              />
            </div>
            <div>
              <label className="form-label">New Password</label>
              <input
                type="password"
                value={passwordData.new_password}
                onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                className="form-input"
                required
                minLength={8}
              />
              <p style={{ fontSize: '11px', color: 'var(--text-3)', margin: '4px 0 0' }}>
                Must be at least 8 characters
              </p>
            </div>
            <div>
              <label className="form-label">Confirm New Password</label>
              <input
                type="password"
                value={passwordData.confirm_password}
                onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                className="form-input"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ alignSelf: 'flex-start', marginTop: 'auto' }}
            >
              <Save size={14} />
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Notifications */}
        <div className="settings-card">
          <h2 style={{
            fontSize: '15px',
            fontWeight: 750,
            color: 'var(--text)',
            margin: '0 0 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(245, 158, 11, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Bell size={16} color="#F59E0B" />
            </div>
            Notifications
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', margin: 0 }}>
                  New Client Assignments
                </p>
                <p style={{ fontSize: '11px', color: 'var(--text-3)', margin: '2px 0 0' }}>
                  Get notified when a client is assigned
                </p>
              </div>
              <div className="toggle-track on" style={{ width: '40px', height: '24px' }}>
                <div className="toggle-thumb on" style={{ width: '18px', height: '18px', top: '3px', left: '19px' }} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid var(--border)' }}>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', margin: 0 }}>
                  Client Progress Updates
                </p>
                <p style={{ fontSize: '11px', color: 'var(--text-3)', margin: '2px 0 0' }}>
                  Get notified when clients log progress
                </p>
              </div>
              <div className="toggle-track on" style={{ width: '40px', height: '24px' }}>
                <div className="toggle-thumb on" style={{ width: '18px', height: '18px', top: '3px', left: '19px' }} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid var(--border)' }}>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', margin: 0 }}>
                  Class Bookings
                </p>
                <p style={{ fontSize: '11px', color: 'var(--text-3)', margin: '2px 0 0' }}>
                  Get notified when members book your classes
                </p>
              </div>
              <div className="toggle-track on" style={{ width: '40px', height: '24px' }}>
                <div className="toggle-thumb on" style={{ width: '18px', height: '18px', top: '3px', left: '19px' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}