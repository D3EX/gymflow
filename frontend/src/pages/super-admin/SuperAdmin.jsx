// frontend/src/pages/super-admin/SuperAdmin.jsx

import { useEffect, useState } from 'react'
import api from "../../api/client"
import toast from 'react-hot-toast'
import {
  Building, Users, UserPlus, Shield, AlertCircle, CheckCircle,
  Search, Plus, Edit, Trash2, Eye, Download, Filter,
  DollarSign, TrendingUp, Calendar, Clock, Ban, Check,
  ChevronDown, ChevronUp, X, Save, RefreshCw, BarChart3,
  Crown, Target, Package, Activity, Settings, Globe,
  Lock, Unlock, Star, Award, Zap
} from 'lucide-react'
import Modal from "../../components/Modal"
import { COLORS, ThemeStyles } from '../../theme/GymTheme'

const C = COLORS

/* ─── Stat Card ─────────────────────────────────────────────── */
function StatCard({ icon: Icon, iconColor, label, value, sub, accent = false }) {
  return (
    <div
      className="card"
      style={{
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        border: accent ? `2px solid ${iconColor}` : `1px solid ${C.line}`,
        transition: 'border-color .2s, transform .2s',
        cursor: 'default',
        background: accent ? `${iconColor}05` : C.surface
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          width: 34, height: 34, borderRadius: 9,
          background: `${iconColor}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Icon size={16} color={iconColor} />
        </div>
        <span style={{ fontSize: 10, color: C.text3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {sub}
        </span>
      </div>
      <div>
        <p style={{ fontSize: 26, fontWeight: 800, color: C.text, lineHeight: 1, marginBottom: 4, letterSpacing: '-0.02em' }}>
          {value}
        </p>
        <p style={{ fontSize: 11.5, color: C.text2, fontWeight: 600 }}>{label}</p>
      </div>
    </div>
  )
}

/* ─── Tier Badge ────────────────────────────────────────────── */
function TierBadge({ tier }) {
  const colors = {
    basic: { bg: `${C.blue}18`, color: C.blue, label: 'Basic' },
    pro: { bg: `${C.ember}18`, color: C.ember, label: 'Pro' },
    premium: { bg: `${C.amber}18`, color: C.amber, label: 'Premium' },
    enterprise: { bg: '#a78bfa18', color: '#a78bfa', label: 'Enterprise' },
  }
  const t = colors[tier] || colors.basic
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 20,
      background: t.bg, color: t.color,
      fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em'
    }}>
      <Crown size={10} /> {t.label}
    </span>
  )
}

/* ─── Status Badge ───────────────────────────────────────────── */
function StatusBadge({ active }) {
  return active ? (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 20,
      background: `${C.mint}18`, color: C.mint,
      fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em'
    }}>
      <CheckCircle size={10} /> Active
    </span>
  ) : (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 20,
      background: `${C.red}18`, color: C.red,
      fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em'
    }}>
      <Ban size={10} /> Suspended
    </span>
  )
}

/* ─── Gym Card ───────────────────────────────────────────────── */
function GymCard({ gym, onEdit, onSuspend, onActivate }) {
  const [expanded, setExpanded] = useState(false)
  
  const coachPct = gym.coaches.limit > 0 ? Math.round((gym.coaches.used / gym.coaches.limit) * 100) : 0
  const memberPct = gym.members.limit > 0 ? Math.round((gym.members.used / gym.members.limit) * 100) : 0
  
  const coachColor = coachPct >= 90 ? C.red : coachPct >= 70 ? C.amber : C.mint
  const memberColor = memberPct >= 90 ? C.red : memberPct >= 70 ? C.amber : C.mint

  return (
    <div
      className="card"
      style={{
        padding: '20px',
        transition: 'transform .2s, box-shadow .2s',
        border: `1px solid ${C.line}`,
        cursor: 'pointer'
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.4)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: `${C.ember}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0
          }}>
            <Building size={18} color={C.ember} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {gym.name}
              </h3>
              <TierBadge tier={gym.subscription_tier} />
              <StatusBadge active={gym.is_active} />
            </div>
            <p style={{ fontSize: 12, color: C.text3, margin: '2px 0 0' }}>
              Owner: {gym.owner_email}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(gym) }}
            style={{
              width: 30, height: 30, borderRadius: 8,
              border: `1px solid ${C.line}`,
              background: 'transparent',
              color: C.text2,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all .2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.ember; e.currentTarget.style.color = C.ember }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.line; e.currentTarget.style.color = C.text2 }}
          >
            <Edit size={14} />
          </button>
          {gym.is_active ? (
            <button
              onClick={(e) => { e.stopPropagation(); onSuspend(gym) }}
              style={{
                width: 30, height: 30, borderRadius: 8,
                border: `1px solid ${C.line}`,
                background: 'transparent',
                color: C.text2,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all .2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.red; e.currentTarget.style.color = C.red }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.line; e.currentTarget.style.color = C.text2 }}
            >
              <Ban size={14} />
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onActivate(gym) }}
              style={{
                width: 30, height: 30, borderRadius: 8,
                border: `1px solid ${C.line}`,
                background: 'transparent',
                color: C.text2,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all .2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.mint; e.currentTarget.style.color = C.mint }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.line; e.currentTarget.style.color = C.text2 }}
            >
              <Check size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Expand/Collapse Toggle */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4px 0',
        marginTop: '8px',
        borderTop: `1px solid ${C.line}30`
      }}>
        {expanded ? <ChevronUp size={14} color={C.text3} /> : <ChevronDown size={14} color={C.text3} />}
        <span style={{ fontSize: 10, color: C.text3, marginLeft: 4 }}>
          {expanded ? 'Hide details' : 'Show details'}
        </span>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${C.line}` }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {/* Coaches */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                <span style={{ color: C.text3 }}>Coaches</span>
                <span style={{ fontWeight: 700, color: coachColor }}>
                  {gym.coaches.used} / {gym.coaches.limit}
                </span>
              </div>
              <div style={{ height: 6, borderRadius: 99, background: C.line, overflow: 'hidden' }}>
                <div style={{ width: `${coachPct}%`, height: '100%', borderRadius: 99, background: coachColor, transition: 'width .4s ease' }} />
              </div>
            </div>
            {/* Members */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                <span style={{ color: C.text3 }}>Members</span>
                <span style={{ fontWeight: 700, color: memberColor }}>
                  {gym.members.used} / {gym.members.limit}
                </span>
              </div>
              <div style={{ height: 6, borderRadius: 99, background: C.line, overflow: 'hidden' }}>
                <div style={{ width: `${memberPct}%`, height: '100%', borderRadius: 99, background: memberColor, transition: 'width .4s ease' }} />
              </div>
            </div>
          </div>
          <div style={{ marginTop: '12px', fontSize: 11, color: C.text3, display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Calendar size={12} /> Created: {new Date(gym.created_at).toLocaleDateString()}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Users size={12} /> {gym.members.used} members
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Award size={12} /> {gym.coaches.used} coaches
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Tier Comparison Table ─────────────────────────────────── */
function TierTable({ tiers }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', fontSize: 13 }}>
        <thead>
          <tr>
            <th>Plan</th>
            <th>Max Coaches</th>
            <th>Max Members</th>
            <th>Price</th>
            <th>Features</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(tiers).map(([key, tier]) => (
            <tr key={key}>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontWeight: 700, textTransform: 'capitalize' }}>{key}</span>
                  {key === 'premium' && <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 99, background: `${C.amber}18`, color: C.amber }}>Best Value</span>}
                  {key === 'enterprise' && <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 99, background: '#a78bfa18', color: '#a78bfa' }}>Max</span>}
                </div>
              </td>
              <td>{tier.max_coaches}</td>
              <td>{tier.max_members}</td>
              <td>{tier.price ? `${tier.price} DZD` : 'Custom'}</td>
              <td>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {tier.features?.slice(0, 2).map((f, i) => (
                    <span key={i} style={{
                      fontSize: 10, padding: '2px 8px', borderRadius: 99,
                      background: C.surface2, color: C.text2
                    }}>
                      {f}
                    </span>
                  ))}
                  {tier.features?.length > 2 && (
                    <span style={{ fontSize: 10, color: C.text3 }}>+{tier.features.length - 2} more</span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ─── Create Gym Modal ──────────────────────────────────────── */
function CreateGymModal({ isOpen, onClose, onSubmit, tiers, submitting }) {
  const [formData, setFormData] = useState({
    name: '',
    owner_name: '',
    owner_email: '',
    owner_password: '',
    subscription_tier: 'basic'
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Gym" size="lg">
      <form onSubmit={handleSubmit}>
        <div className="form-group mb-4">
          <label className="form-label">Gym Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            className="form-input"
            required
            placeholder="e.g., Fitness First Algiers"
          />
        </div>

        <div className="grid-2 mb-4" style={{ gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Owner Full Name *</label>
            <input
              type="text"
              value={formData.owner_name}
              onChange={e => setFormData({ ...formData, owner_name: e.target.value })}
              className="form-input"
              required
              placeholder="e.g., John Doe"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Owner Email *</label>
            <input
              type="email"
              value={formData.owner_email}
              onChange={e => setFormData({ ...formData, owner_email: e.target.value })}
              className="form-input"
              required
              placeholder="owner@gym.com"
            />
          </div>
        </div>

        <div className="grid-2 mb-4" style={{ gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Owner Password *</label>
            <input
              type="password"
              value={formData.owner_password}
              onChange={e => setFormData({ ...formData, owner_password: e.target.value })}
              className="form-input"
              required
              placeholder="Min 8 characters"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Subscription Plan *</label>
            <select
              value={formData.subscription_tier}
              onChange={e => setFormData({ ...formData, subscription_tier: e.target.value })}
              className="form-input"
              required
            >
              {Object.keys(tiers).map(key => (
                <option key={key} value={key}>
                  {key.charAt(0).toUpperCase() + key.slice(1)} — {tiers[key].max_members} members, {tiers[key].max_coaches} coaches
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3" style={{ marginTop: 8 }}>
          <button
            type="submit"
            className="btn btn-primary flex-1"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <RefreshCw size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
                Creating...
              </>
            ) : (
              <>
                <Building size={14} /> Create Gym
              </>
            )}
          </button>
          <button type="button" onClick={onClose} className="btn btn-ghost">
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  )
}

/* ─── Edit Gym Tier Modal ───────────────────────────────────── */
function EditGymModal({ isOpen, onClose, onSubmit, gym, tiers, submitting }) {
  const [tier, setTier] = useState('')

  useEffect(() => {
    if (gym) setTier(gym.subscription_tier)
  }, [gym])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(gym.id, tier)
  }

  if (!gym) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Change Subscription Plan" size="md">
      <form onSubmit={handleSubmit}>
        <div className="form-group mb-4">
          <label className="form-label">Gym</label>
          <p style={{ fontSize: 14, fontWeight: 600, color: C.text, margin: 0 }}>
            {gym.name}
          </p>
          <p style={{ fontSize: 12, color: C.text3, margin: '2px 0 0' }}>
            Current: <TierBadge tier={gym.subscription_tier} />
          </p>
        </div>

        <div className="form-group mb-4">
          <label className="form-label">New Plan *</label>
          <select
            value={tier}
            onChange={e => setTier(e.target.value)}
            className="form-input"
            required
          >
            {Object.keys(tiers).map(key => (
              <option key={key} value={key}>
                {key.charAt(0).toUpperCase() + key.slice(1)} — {tiers[key].max_members} members, {tiers[key].max_coaches} coaches
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="btn btn-primary flex-1"
            disabled={submitting || tier === gym.subscription_tier}
          >
            {submitting ? (
              <>
                <RefreshCw size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
                Updating...
              </>
            ) : (
              <>
                <Save size={14} /> Update Plan
              </>
            )}
          </button>
          <button type="button" onClick={onClose} className="btn btn-ghost">
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  )
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function SuperAdmin() {
  const [gyms, setGyms] = useState([])
  const [tiers, setTiers] = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedGym, setSelectedGym] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('gyms')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [gymsRes, tiersRes] = await Promise.all([
        api.get('/super-admin/gyms'),
        api.get('/super-admin/tiers')
      ])
      setGyms(gymsRes.data)
      setTiers(tiersRes.data)
    } catch (error) {
      console.error('Failed to fetch super admin data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGym = async (data) => {
    setSubmitting(true)
    try {
      await api.post('/super-admin/gyms', data)
      toast.success('Gym created successfully!')
      setShowCreateModal(false)
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create gym')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditTier = async (gymId, tier) => {
    setSubmitting(true)
    try {
      await api.put(`/super-admin/gyms/${gymId}/tier`, { subscription_tier: tier })
      toast.success('Subscription plan updated successfully!')
      setShowEditModal(false)
      setSelectedGym(null)
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update plan')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSuspend = async (gym) => {
    if (!confirm(`Suspend gym "${gym.name}"? Members will lose access.`)) return
    try {
      await api.put(`/super-admin/gyms/${gym.id}/suspend`)
      toast.success(`Gym "${gym.name}" suspended`)
      fetchData()
    } catch (error) {
      toast.error('Failed to suspend gym')
    }
  }

  const handleActivate = async (gym) => {
    try {
      await api.put(`/super-admin/gyms/${gym.id}/activate`)
      toast.success(`Gym "${gym.name}" activated`)
      fetchData()
    } catch (error) {
      toast.error('Failed to activate gym')
    }
  }

  // Derived stats
  const totalGyms = gyms.length
  const activeGyms = gyms.filter(g => g.is_active).length
  const suspendedGyms = gyms.filter(g => !g.is_active).length
  const totalMembers = gyms.reduce((sum, g) => sum + g.members.used, 0)
  const totalCoaches = gyms.reduce((sum, g) => sum + g.coaches.used, 0)
  const totalCapacity = gyms.reduce((sum, g) => sum + g.members.limit, 0)

  const filteredGyms = gyms.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    g.owner_email.toLowerCase().includes(search.toLowerCase())
  )

  const tierBreakdown = {}
  Object.keys(tiers).forEach(tier => {
    tierBreakdown[tier] = gyms.filter(g => g.subscription_tier === tier).length
  })

  if (loading) {
    return (
      <div className="gf-theme">
        <ThemeStyles />
        <div className="loading">
          <div className="spinner" />
          <span>Loading super admin dashboard...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="gf-theme">
      <ThemeStyles />

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .super-admin-tabs {
          display: flex;
          gap: 4px;
          padding: 4px;
          background: ${C.surface2};
          border-radius: 12px;
          margin-bottom: 20px;
        }

        @media (max-width: 768px) {
          .super-admin-stats {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 10px !important;
          }
          .super-admin-tabs {
            flex-wrap: wrap;
          }
          .super-admin-tabs button {
            flex: 1;
            justify-content: center;
            padding: 8px 12px !important;
            font-size: 12px !important;
          }
        }

        @media (max-width: 480px) {
          .super-admin-stats {
            grid-template-columns: 1fr 1fr !important;
            gap: 8px !important;
          }
        }
      `}</style>

      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <p style={{ fontSize: 11, color: C.ember, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 6 }}>
            Super Admin
          </p>
          <h1 className="page-title">Gym Management</h1>
          <p className="page-subtitle">Manage all gyms, subscription plans, and system health</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
            <Plus size={16} /> New Gym
          </button>
          <button onClick={fetchData} className="btn btn-ghost">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="super-admin-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        <StatCard icon={Building} iconColor={C.ember} label="Total Gyms" value={totalGyms} sub="All" />
        <StatCard icon={CheckCircle} iconColor={C.mint} label="Active Gyms" value={activeGyms} sub="Online" />
        <StatCard icon={Ban} iconColor={C.red} label="Suspended" value={suspendedGyms} sub="Offline" />
        <StatCard icon={Users} iconColor={C.blue} label="Total Members" value={totalMembers.toLocaleString()} sub={`/ ${totalCapacity.toLocaleString()} capacity`} />
      </div>

      {/* ── Tabs ── */}
      <div className="super-admin-tabs">
        {[
          { id: 'gyms', label: 'Gyms', icon: Building },
          { id: 'tiers', label: 'Plans & Tiers', icon: Crown },
          { id: 'overview', label: 'System Overview', icon: Activity },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`btn btn-sm ${activeTab === id ? 'btn-primary' : 'btn-ghost'}`}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px' }}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════
          GYMS TAB
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'gyms' && (
        <>
          {/* Search Bar */}
          <div className="card" style={{ marginBottom: '16px', padding: '14px' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
                <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: C.text3, pointerEvents: 'none', zIndex: 2 }} />
                <input
                  type="text"
                  placeholder="Search by gym name or owner email..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '38px' }}
                />
              </div>
              <span style={{ fontSize: 11, color: C.text3, flexShrink: 0 }}>
                {filteredGyms.length} / {gyms.length} gyms
              </span>
            </div>
          </div>

          {/* Gym Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 16 }}>
            {filteredGyms.map(gym => (
              <GymCard
                key={gym.id}
                gym={gym}
                onEdit={(g) => { setSelectedGym(g); setShowEditModal(true) }}
                onSuspend={handleSuspend}
                onActivate={handleActivate}
              />
            ))}
          </div>

          {filteredGyms.length === 0 && (
            <div className="empty-state">
              <Building size={48} color={C.text3} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.4 }} />
              <p style={{ color: C.text3, marginBottom: 14 }}>No gyms found</p>
              <button onClick={() => setShowCreateModal(true)} className="btn btn-primary btn-sm">
                Create your first gym
              </button>
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════
          TIERS TAB
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'tiers' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16, marginBottom: 20 }}>
            {Object.entries(tiers).map(([key, tier]) => {
              const colors = {
                basic: { bg: `${C.blue}18`, color: C.blue, icon: Shield },
                pro: { bg: `${C.ember}18`, color: C.ember, icon: Zap },
                premium: { bg: `${C.amber}18`, color: C.amber, icon: Star },
                enterprise: { bg: '#a78bfa18', color: '#a78bfa', icon: Crown },
              }
              const t = colors[key] || colors.basic
              const Icon = t.icon
              const count = tierBreakdown[key] || 0

              return (
                <div key={key} className="card" style={{ padding: '20px', border: `1px solid ${t.color}40` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: t.bg, color: t.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0, textTransform: 'capitalize' }}>
                        {key}
                      </h3>
                      <p style={{ fontSize: 11, color: C.text3, margin: '2px 0 0' }}>
                        {count} gym{count !== 1 ? 's' : ''} on this plan
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                    <div style={{ background: C.surface2, borderRadius: 8, padding: '10px', textAlign: 'center' }}>
                      <p style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: 0 }}>{tier.max_members}</p>
                      <p style={{ fontSize: 10, color: C.text3, margin: '2px 0 0' }}>Max Members</p>
                    </div>
                    <div style={{ background: C.surface2, borderRadius: 8, padding: '10px', textAlign: 'center' }}>
                      <p style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: 0 }}>{tier.max_coaches}</p>
                      <p style={{ fontSize: 10, color: C.text3, margin: '2px 0 0' }}>Max Coaches</p>
                    </div>
                  </div>

                  {tier.price && (
                    <p style={{ fontSize: 12, color: C.text2, textAlign: 'center' }}>
                      {tier.price.toLocaleString()} DZD / month
                    </p>
                  )}

                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.line}` }}>
                    <p style={{ fontSize: 9, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>
                      Features
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {tier.features?.map((f, i) => (
                        <span key={i} style={{
                          fontSize: 10, padding: '2px 8px', borderRadius: 99,
                          background: C.surface2, color: C.text2
                        }}>
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Comparison Table */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <BarChart3 size={16} color={C.ember} />
              <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: 0 }}>Plan Comparison</h3>
            </div>
            <TierTable tiers={tiers} />
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════
          OVERVIEW TAB
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14, marginBottom: 20 }}>
            <div className="card" style={{ padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <Users size={18} color={C.ember} />
                <p style={{ fontSize: 12, color: C.text2 }}>Total Members</p>
              </div>
              <p style={{ fontSize: 28, fontWeight: 800, color: C.text, margin: 0 }}>{totalMembers.toLocaleString()}</p>
              <p style={{ fontSize: 11, color: C.text3, margin: '2px 0 0' }}>Across {totalGyms} gyms</p>
            </div>

            <div className="card" style={{ padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <Award size={18} color={C.mint} />
                <p style={{ fontSize: 12, color: C.text2 }}>Total Coaches</p>
              </div>
              <p style={{ fontSize: 28, fontWeight: 800, color: C.text, margin: 0 }}>{totalCoaches.toLocaleString()}</p>
              <p style={{ fontSize: 11, color: C.text3, margin: '2px 0 0' }}>Across {totalGyms} gyms</p>
            </div>

            <div className="card" style={{ padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <Target size={18} color={C.amber} />
                <p style={{ fontSize: 12, color: C.text2 }}>Utilization Rate</p>
              </div>
              <p style={{ fontSize: 28, fontWeight: 800, color: C.text, margin: 0 }}>
                {totalCapacity > 0 ? Math.round((totalMembers / totalCapacity) * 100) : 0}%
              </p>
              <p style={{ fontSize: 11, color: C.text3, margin: '2px 0 0' }}>
                {totalMembers.toLocaleString()} / {totalCapacity.toLocaleString()} capacity
              </p>
            </div>

            <div className="card" style={{ padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <TrendingUp size={18} color={C.blue} />
                <p style={{ fontSize: 12, color: C.text2 }}>Tier Distribution</p>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {Object.entries(tierBreakdown).map(([tier, count]) => (
                  <span key={tier} style={{
                    fontSize: 10, padding: '2px 8px', borderRadius: 99,
                    background: `${C.ember}15`, color: C.ember
                  }}>
                    {tier}: {count}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Globe size={16} color={C.ember} />
              <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: 0 }}>System Health</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
              <div style={{ background: C.surface2, borderRadius: 10, padding: '14px' }}>
                <p style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>
                  Total Gyms
                </p>
                <p style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: 0 }}>{totalGyms}</p>
              </div>
              <div style={{ background: C.surface2, borderRadius: 10, padding: '14px' }}>
                <p style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>
                  Active Gyms
                </p>
                <p style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: 0 }}>{activeGyms}</p>
              </div>
              <div style={{ background: C.surface2, borderRadius: 10, padding: '14px' }}>
                <p style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>
                  Suspended
                </p>
                <p style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: 0 }}>{suspendedGyms}</p>
              </div>
              <div style={{ background: C.surface2, borderRadius: 10, padding: '14px' }}>
                <p style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>
                  Avg Members/Gym
                </p>
                <p style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: 0 }}>
                  {totalGyms > 0 ? Math.round(totalMembers / totalGyms).toLocaleString() : 0}
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Create Gym Modal ── */}
      <CreateGymModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateGym}
        tiers={tiers}
        submitting={submitting}
      />

      {/* ── Edit Gym Modal ── */}
      <EditGymModal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setSelectedGym(null) }}
        onSubmit={handleEditTier}
        gym={selectedGym}
        tiers={tiers}
        submitting={submitting}
      />
    </div>
  )
}