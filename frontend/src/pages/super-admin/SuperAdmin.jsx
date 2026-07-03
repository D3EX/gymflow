// frontend/src/pages/super-admin/SuperAdmin.jsx

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from "../../api/client"
import toast from 'react-hot-toast'
import {
  Building, Users, CheckCircle, Ban, Crown, Settings,
  Activity, TrendingUp, RefreshCw, ChevronRight,
  Calendar, Radio
} from 'lucide-react'
import { COLORS, ThemeStyles } from '../../theme/GymTheme'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

const C = COLORS

/* ─── Stat Card ─────────────────────────────────────────────── */
function StatCard({ icon: Icon, iconColor, label, value, sub }) {
  return (
    <div className="sa-stat-card card">
      <div className="sa-stat-top">
        <div className="sa-stat-icon" style={{ background: `${iconColor}15` }}>
          <Icon size={18} color={iconColor} />
        </div>
        <span className="sa-stat-sub">{sub}</span>
      </div>
      <div>
        <p className="sa-stat-value">{value}</p>
        <p className="sa-stat-label">{label}</p>
      </div>
    </div>
  )
}

/* ─── Quick Action Card ─────────────────────────────────────── */
function ActionCard({ icon: Icon, iconColor, title, desc, onClick }) {
  return (
    <button className="sa-action-card" onClick={onClick}>
      <div className="sa-action-icon" style={{ background: `${iconColor}15` }}>
        <Icon size={20} color={iconColor} />
      </div>
      <div className="sa-action-copy">
        <span className="sa-action-title">{title}</span>
        <span className="sa-action-desc">{desc}</span>
      </div>
      <ChevronRight size={16} color={C.text3} className="sa-action-arrow" />
    </button>
  )
}

/* ─── Custom Chart Tooltip ──────────────────────────────────── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.line}`,
      borderRadius: '10px',
      padding: '10px 14px',
      fontSize: '12px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.18)'
    }}>
      <p style={{ color: C.text2, marginBottom: 6, fontWeight: 600 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, margin: '2px 0' }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function SuperAdmin() {
  const [gyms, setGyms] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/super-admin/gyms')
      setGyms(res.data)
    } catch (error) {
      console.error('Failed to fetch super admin data:', error)
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  // Stats
  const totalGyms = gyms.length
  const activeGyms = gyms.filter(g => g.is_active).length
  const suspendedGyms = gyms.filter(g => !g.is_active).length
  const totalMembers = gyms.reduce((sum, g) => sum + g.members.used, 0)
  const totalCoaches = gyms.reduce((sum, g) => sum + g.coaches.used, 0)

  const activePct = totalGyms > 0 ? Math.round((activeGyms / totalGyms) * 100) : 0
  const suspendedPct = totalGyms > 0 ? Math.round((suspendedGyms / totalGyms) * 100) : 0

  // Mock data for the chart (Replace with real API endpoint later)
  const chartData = [
    { month: 'Jan', members: 400, revenue: 2400 },
    { month: 'Feb', members: 600, revenue: 3800 },
    { month: 'Mar', members: 900, revenue: 5200 },
    { month: 'Apr', members: 1200, revenue: 6800 },
    { month: 'May', members: 1500, revenue: 8200 },
    { month: 'Jun', members: 1800, revenue: 9500 },
  ]

  // Mock Recent Activity
  const recentActivity = [
    { id: 1, action: 'New Gym Created', target: 'Iron Paradise Gym', time: '2 hours ago', type: 'success' },
    { id: 2, action: 'Plan Upgraded', target: 'FitZone Algiers (Premium)', time: '5 hours ago', type: 'info' },
    { id: 3, action: 'Gym Suspended', target: 'Old School Gym', time: '1 day ago', type: 'warning' },
  ]

  if (loading) {
    return (
      <div className="gf-theme">
        <ThemeStyles />
        <SuperAdminMobileStyles />
        <div className="loading">
          <div className="spinner" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="gf-theme">
      <ThemeStyles />
      <SuperAdminMobileStyles />

      {/* ── Page Header ── */}
      <div className="page-header sa-header">
        <div>
          <div className="sa-eyebrow">
            <Radio size={11} className="sa-eyebrow-dot" />
            <span>Super Admin · Live</span>
          </div>
          <h1 className="page-title">System Overview</h1>
          <p className="page-subtitle">High-level analytics and quick navigation</p>
        </div>
        <button onClick={fetchData} className="btn btn-ghost sa-refresh-btn">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* ── Stats Grid ── */}
      <div className="sa-stats-grid">
        <StatCard icon={Building} iconColor={C.ember} label="Total Gyms" value={totalGyms} sub="All" />
        <StatCard icon={CheckCircle} iconColor={C.mint} label="Active Gyms" value={activeGyms} sub={`${activePct}%`} />
        <StatCard icon={Ban} iconColor={C.red} label="Suspended" value={suspendedGyms} sub={`${suspendedPct}%`} />
        <StatCard icon={Users} iconColor={C.blue} label="Total Members" value={totalMembers.toLocaleString()} sub="All Gyms" />
      </div>

      {/* ── Quick Actions ── */}
      <div className="sa-section-label">Manage</div>
      <div className="sa-actions-grid">
        <ActionCard
          icon={Building}
          iconColor={C.ember}
          title="Manage Gyms"
          desc={`${totalGyms} gym${totalGyms === 1 ? '' : 's'} registered`}
          onClick={() => navigate('/dashboard/super-admin/gyms')}
        />
        <ActionCard
          icon={Crown}
          iconColor={C.amber}
          title="Plans & Tiers"
          desc="Pricing and feature limits"
          onClick={() => navigate('/dashboard/super-admin/tiers')}
        />
        <ActionCard
          icon={Settings}
          iconColor={C.blue}
          title="System Settings"
          desc="Platform-wide configuration"
          onClick={() => navigate('/dashboard/super-admin/settings')}
        />
      </div>

      {/* ── Main Chart Row ── */}
      <div className="card sa-chart-card">
        <div className="sa-chart-header">
          <div className="sa-chart-title-group">
            <div className="sa-chart-icon">
              <TrendingUp size={16} color={C.ember} />
            </div>
            <div>
              <h3 className="sa-chart-title">System Growth</h3>
              <p className="sa-chart-subtitle">Member &amp; revenue trends</p>
            </div>
          </div>
          <span className="sa-chart-range">Last 6 months</span>
        </div>

        <div className="sa-chart-body">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.ember} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={C.ember} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorMembers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.mint} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={C.mint} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.line} vertical={false} />
              <XAxis dataKey="month" stroke={C.text3} tick={{ fontSize: 11, fill: C.text3 }} axisLine={false} tickLine={false} />
              <YAxis stroke={C.text3} tick={{ fontSize: 11, fill: C.text3 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" name="Revenue (k DZD)" stroke={C.ember} strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
              <Area type="monotone" dataKey="members" name="Active Members" stroke={C.mint} strokeWidth={2} fillOpacity={1} fill="url(#colorMembers)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Secondary Row (Health + Activity) ── */}
      <div className="sa-secondary-grid">

        {/* Left: System Health */}
        <div className="card sa-health-card">
          <div className="sa-card-header">
            <Activity size={16} color={C.blue} />
            <h3 className="sa-card-title">Gym Health Overview</h3>
          </div>
          <div className="sa-health-rows">
            <div>
              <div className="sa-health-row-top">
                <span className="sa-health-row-label">Active Gyms</span>
                <span className="sa-health-row-value" style={{ color: C.mint }}>{activeGyms} / {totalGyms}</span>
              </div>
              <div className="sa-progress-track">
                <div className="sa-progress-fill" style={{ width: `${activePct}%`, background: C.mint }} />
              </div>
            </div>
            <div>
              <div className="sa-health-row-top">
                <span className="sa-health-row-label">Suspended Gyms</span>
                <span className="sa-health-row-value" style={{ color: C.red }}>{suspendedGyms} / {totalGyms}</span>
              </div>
              <div className="sa-progress-track">
                <div className="sa-progress-fill" style={{ width: `${suspendedPct}%`, background: C.red }} />
              </div>
            </div>
            <div className="sa-health-footer">
              <span className="sa-health-footer-row">
                <Users size={14} color={C.text3} /> <strong>{totalMembers.toLocaleString()}</strong>&nbsp;members across all gyms
              </span>
              <span className="sa-health-footer-row">
                <Crown size={14} color={C.text3} /> <strong>{totalCoaches.toLocaleString()}</strong>&nbsp;coaches active
              </span>
            </div>
          </div>
        </div>

        {/* Right: Recent Activity */}
        <div className="card sa-activity-card">
          <div className="sa-card-header">
            <Calendar size={16} color={C.amber} />
            <h3 className="sa-card-title">Recent Activity</h3>
          </div>
          <div className="sa-activity-list">
            {recentActivity.map((item) => (
              <div key={item.id} className="sa-activity-item">
                <div
                  className="sa-activity-badge"
                  style={{
                    background: item.type === 'success' ? `${C.mint}20` : item.type === 'warning' ? `${C.red}20` : `${C.blue}20`,
                    color: item.type === 'success' ? C.mint : item.type === 'warning' ? C.red : C.blue,
                  }}
                >
                  {item.type === 'success' ? <CheckCircle size={14} /> : item.type === 'warning' ? <Ban size={14} /> : <Crown size={14} />}
                </div>
                <div className="sa-activity-copy">
                  <p className="sa-activity-action">{item.action}</p>
                  <p className="sa-activity-target">{item.target}</p>
                </div>
                <span className="sa-activity-time">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   SCOPED STYLES — layout polish (desktop-safe) + mobile overrides
═══════════════════════════════════════════════════════════════ */
function SuperAdminMobileStyles() {
  return (
    <style>{`
      /* ---- base layout (applies at all sizes, replaces old inline layout) ---- */
      .sa-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
      }
      .sa-eyebrow {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 11px;
        color: ${C.ember};
        text-transform: uppercase;
        letter-spacing: 0.12em;
        font-weight: 700;
        margin-bottom: 6px;
      }
      .sa-eyebrow-dot { color: ${C.mint}; }

      .sa-section-label {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: ${C.text3};
        margin: 4px 0 10px;
      }

      .sa-stats-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
        margin-bottom: 28px;
      }
      .sa-stat-card {
        padding: 20px 24px;
        display: flex;
        flex-direction: column;
        gap: 6px;
        border: 1px solid ${C.line};
        transition: transform .2s, border-color .2s;
        cursor: default;
        position: relative;
        overflow: hidden;
      }
      .sa-stat-card:hover { transform: translateY(-2px); }
      .sa-stat-top { display: flex; align-items: center; justify-content: space-between; }
      .sa-stat-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
      .sa-stat-sub { font-size: 10px; color: ${C.text3}; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }
      .sa-stat-value { font-size: 28px; font-weight: 800; color: ${C.text}; line-height: 1; margin-bottom: 2px; letter-spacing: -0.02em; }
      .sa-stat-label { font-size: 12px; color: ${C.text2}; font-weight: 600; }

      .sa-actions-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
        margin-bottom: 28px;
      }
      .sa-action-card {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 16px 18px;
        border-radius: 14px;
        border: 1px solid ${C.line};
        background: ${C.surface};
        cursor: pointer;
        text-align: left;
        transition: transform .2s, border-color .2s, background .2s;
        font-family: inherit;
      }
      .sa-action-card:hover {
        transform: translateY(-2px);
        border-color: ${C.ember};
        background: ${C.surface2};
      }
      .sa-action-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
      .sa-action-copy { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; }
      .sa-action-title { font-size: 13px; font-weight: 700; color: ${C.text}; }
      .sa-action-desc { font-size: 11px; color: ${C.text3}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .sa-action-arrow { flex-shrink: 0; transition: transform .2s; }
      .sa-action-card:hover .sa-action-arrow { transform: translateX(2px); }

      .sa-chart-card { padding: 24px; margin-bottom: 28px; }
      .sa-chart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
      .sa-chart-title-group { display: flex; align-items: center; gap: 10px; }
      .sa-chart-icon { width: 32px; height: 32px; border-radius: 8px; background: ${C.ember}15; display: flex; align-items: center; justify-content: center; }
      .sa-chart-title { font-size: 14px; font-weight: 700; color: ${C.text}; margin: 0; }
      .sa-chart-subtitle { font-size: 11px; color: ${C.text3}; margin: 2px 0 0; }
      .sa-chart-range { font-size: 11px; font-weight: 600; color: ${C.text2}; padding: 4px 12px; background: ${C.surface2}; border-radius: 20px; white-space: nowrap; }
      .sa-chart-body { height: 220px; width: 100%; }

      .sa-secondary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 32px; }
      .sa-health-card, .sa-activity-card { padding: 20px 24px; }
      .sa-card-header { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
      .sa-card-title { font-size: 13px; font-weight: 700; color: ${C.text}; margin: 0; }

      .sa-health-rows { display: flex; flex-direction: column; gap: 14px; }
      .sa-health-row-top { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px; }
      .sa-health-row-label { color: ${C.text3}; }
      .sa-health-row-value { font-weight: 700; }
      .sa-progress-track { height: 6px; border-radius: 99px; background: ${C.surface2}; overflow: hidden; }
      .sa-progress-fill { height: 100%; border-radius: 99px; transition: width .3s ease; }
      .sa-health-footer { margin-top: 4px; display: flex; flex-direction: column; gap: 8px; font-size: 12px; color: ${C.text2}; border-top: 1px solid ${C.line}; padding-top: 12px; }
      .sa-health-footer-row { display: flex; align-items: center; gap: 6px; }

      .sa-activity-list { display: flex; flex-direction: column; gap: 12px; }
      .sa-activity-item { display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid ${C.line}; font-size: 13px; }
      .sa-activity-item:last-child { border-bottom: none; padding-bottom: 0; }
      .sa-activity-badge { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
      .sa-activity-copy { flex: 1; min-width: 0; }
      .sa-activity-action { font-weight: 600; color: ${C.text}; margin: 0; }
      .sa-activity-target { font-size: 11px; color: ${C.text3}; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .sa-activity-time { font-size: 10px; color: ${C.text3}; white-space: nowrap; flex-shrink: 0; }

      /* ═══ MOBILE ═══ */
      @media (max-width: 768px) {
        .sa-header {
          flex-direction: column !important;
          align-items: stretch !important;
          gap: 12px !important;
        }
        .sa-refresh-btn {
          width: 100% !important;
          justify-content: center !important;
        }

        .sa-stats-grid {
          grid-template-columns: repeat(2, 1fr) !important;
          gap: 10px !important;
          margin-bottom: 20px !important;
        }
        .sa-stat-card {
          padding: 14px 16px !important;
          gap: 4px !important;
        }
        .sa-stat-icon { width: 32px !important; height: 32px !important; }
        .sa-stat-value { font-size: 20px !important; }
        .sa-stat-label { font-size: 11px !important; }

        .sa-actions-grid {
          grid-template-columns: 1fr !important;
          gap: 10px !important;
          margin-bottom: 20px !important;
        }
        .sa-action-card { padding: 14px !important; }

        .sa-chart-card { padding: 16px !important; margin-bottom: 20px !important; }
        .sa-chart-header { gap: 8px !important; margin-bottom: 14px !important; }
        .sa-chart-range { font-size: 10px !important; padding: 3px 10px !important; }
        .sa-chart-body { height: 180px !important; }

        .sa-secondary-grid {
          grid-template-columns: 1fr !important;
          gap: 14px !important;
          margin-bottom: 24px !important;
        }
        .sa-health-card, .sa-activity-card { padding: 16px !important; }

        .sa-activity-target { max-width: 140px !important; }
      }

      @media (max-width: 420px) {
        .sa-stats-grid { grid-template-columns: 1fr 1fr !important; }
        .sa-stat-value { font-size: 18px !important; }
        .sa-activity-time { display: none !important; }
      }
    `}</style>
  )
}