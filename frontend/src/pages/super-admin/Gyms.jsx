// frontend/src/pages/super-admin/Gyms.jsx

import { useEffect, useRef, useState } from 'react'
import api from "../../api/client"
import toast from 'react-hot-toast'
import {
  Building, Plus, Search, Edit, Ban, Check,
  Crown, Users, Calendar, X, Mail,
  Eye, ChevronLeft, ChevronRight
} from 'lucide-react'
import { COLORS, ThemeStyles } from '../../theme/GymTheme'
import Modal from "../../components/Modal"

const C = COLORS
const PAGE_SIZE = 6

const TIER_META = {
  basic: { bg: `${C.blue}18`, color: C.blue, label: 'Basic' },
  pro: { bg: `${C.ember}18`, color: C.ember, label: 'Pro' },
  premium: { bg: `${C.amber}18`, color: C.amber, label: 'Premium' },
  enterprise: { bg: '#a78bfa18', color: '#a78bfa', label: 'Enterprise' },
}

function usageColor(pct) {
  return pct >= 90 ? C.red : pct >= 70 ? C.amber : C.mint
}

/* ─── Stats Card ────────────────────────────────────────────── */
function StatCard({ icon: Icon, iconColor, label, value, sub }) {
  return (
    <div className="gy-stat-card card">
      <div className="gy-stat-decoration" style={{ color: iconColor }}>
        <Icon size={72} strokeWidth={1.5} />
      </div>
      <div className="gy-stat-top">
        <div className="gy-stat-icon" style={{ background: `${iconColor}15`, color: iconColor }}>
          <Icon size={16} />
        </div>
        <span className="gy-stat-sub">{sub}</span>
      </div>
      <div>
        <p className="gy-stat-value">{value}</p>
        <p className="gy-stat-label">{label}</p>
      </div>
    </div>
  )
}

/* ─── Tier Badge ────────────────────────────────────────────── */
function TierBadge({ tier }) {
  const t = TIER_META[tier] || TIER_META.basic
  return (
    <span className="gy-badge" style={{ background: t.bg, color: t.color }}>
      <Crown size={10} /> {t.label}
    </span>
  )
}

/* ─── Status Badge ───────────────────────────────────────────── */
function StatusBadge({ active }) {
  return active ? (
    <span className="gy-badge" style={{ background: `${C.mint}18`, color: C.mint }}>
      <Check size={10} /> Active
    </span>
  ) : (
    <span className="gy-badge" style={{ background: `${C.red}18`, color: C.red }}>
      <Ban size={10} /> Suspended
    </span>
  )
}

/* ─── Usage Bar (used in Details modal) ─────────────────────── */
function UsageBar({ label, used, limit }) {
  const pct = limit > 0 ? Math.round((used / limit) * 100) : 0
  const color = usageColor(pct)
  return (
    <div className="gy-usage-block">
      <div className="gy-usage-top">
        <span className="gy-usage-label">{label}</span>
        <span className="gy-usage-value" style={{ color }}>{used} / {limit}</span>
      </div>
      <div className="gy-usage-track">
        <div className="gy-usage-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="gy-usage-pct">{pct}% of limit used</span>
    </div>
  )
}

/* ─── Gym Details Modal ──────────────────────────────────────── */
function GymDetailsModal({ isOpen, onClose, gym }) {
  if (!gym) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="lg">
      <div style={{ padding: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: `${C.ember}15`, color: C.ember,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <Building size={22} />
            </div>
            <div style={{ minWidth: 0 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>{gym.name}</h2>
              <p style={{ fontSize: 12, color: C.text3, margin: '4px 0 0' }}>{gym.owner_email}</p>
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                <TierBadge tier={gym.subscription_tier} />
                <StatusBadge active={gym.is_active} />
              </div>
            </div>
          </div>
          <button onClick={onClose} className="modal-close">×</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <div style={{ background: C.surface2, borderRadius: 10, padding: '16px' }}>
            <UsageBar label="Coaches" used={gym.coaches.used} limit={gym.coaches.limit} />
          </div>
          <div style={{ background: C.surface2, borderRadius: 10, padding: '16px' }}>
            <UsageBar label="Members" used={gym.members.used} limit={gym.members.limit} />
          </div>
        </div>

        <div style={{ padding: '16px', borderRadius: 10, background: C.surface2, border: `1px solid ${C.line}`, marginBottom: '10px' }}>
          <p style={{ fontSize: 12, color: C.text2, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={14} color={C.text3} />
            Created: {new Date(gym.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
    </Modal>
  )
}

/* ─── Gym Row (list item) ───────────────────────────────────── */
const FALLBACK_GYM_IMAGE = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=400&q=70&auto=format&fit=crop'

function GymRow({ gym, onEdit, onSuspend, onActivate, onViewDetails }) {
  const joined = new Date(gym.created_at).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric'
  })
  const coachPct = gym.coaches.limit > 0 ? Math.round((gym.coaches.used / gym.coaches.limit) * 100) : 0
  const memberPct = gym.members.limit > 0 ? Math.round((gym.members.used / gym.members.limit) * 100) : 0

  return (
    <div className="gy-row card" onClick={() => onViewDetails(gym)}>
      <div
        className="gy-row-thumb"
        style={{ backgroundImage: `url(${gym.cover_image || FALLBACK_GYM_IMAGE})` }}
      >
        {gym.is_active && <span className="gy-row-dot" title="Active" />}
      </div>

      <div className="gy-row-main">
        <div className="gy-row-top">
          <div className="gy-row-title-wrap">
            <h3 className="gy-row-name" title={gym.name}>{gym.name}</h3>
            <div className="gy-row-badges">
              <TierBadge tier={gym.subscription_tier} />
              <StatusBadge active={gym.is_active} />
            </div>
            <p className="gy-row-owner">
              <Mail size={12} /> <span>{gym.owner_email}</span>
            </p>
          </div>
          <div className="gy-row-top-right">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(gym) }}
              title="Change Plan"
              className="gy-icon-btn"
            >
              <Edit size={14} />
            </button>
            {gym.is_active ? (
              <button
                onClick={(e) => { e.stopPropagation(); onSuspend(gym) }}
                title="Suspend Gym"
                className="gy-icon-btn gy-icon-btn-red"
              >
                <Ban size={14} />
              </button>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); onActivate(gym) }}
                title="Activate Gym"
                className="gy-icon-btn gy-icon-btn-mint"
              >
                <Check size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="gy-row-usage-panel">
          <div className="gy-usage-block">
            <div className="gy-usage-top">
              <span className="gy-usage-label">Coaches</span>
              <span className="gy-usage-value" style={{ color: usageColor(coachPct) }}>
                {gym.coaches.used} / {gym.coaches.limit}
              </span>
            </div>
            <div className="gy-usage-track">
              <div className="gy-usage-fill" style={{ width: `${coachPct}%`, background: usageColor(coachPct) }} />
            </div>
            <span className="gy-usage-pct">{coachPct}% of limit used</span>
          </div>

          <div className="gy-usage-divider" />

          <div className="gy-usage-block">
            <div className="gy-usage-top">
              <span className="gy-usage-label">Members</span>
              <span className="gy-usage-value" style={{ color: usageColor(memberPct) }}>
                {gym.members.used} / {gym.members.limit}
              </span>
            </div>
            <div className="gy-usage-track">
              <div className="gy-usage-fill" style={{ width: `${memberPct}%`, background: usageColor(memberPct) }} />
            </div>
            <span className="gy-usage-pct">{memberPct}% of limit used</span>
          </div>
        </div>

        <div className="gy-row-footer">
          <span className="gy-row-joined"><Calendar size={12} /> Joined on {joined}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onViewDetails(gym) }}
            className="gy-details-btn-solid"
          >
            View Full Details <ChevronRight size={14} />
          </button>
        </div>
      </div>
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
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-3">
          <button type="submit" className="btn btn-primary flex-1" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Gym'}
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
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-3">
          <button type="submit" className="btn btn-primary flex-1" disabled={submitting || tier === gym.subscription_tier}>
            {submitting ? 'Updating...' : 'Update Plan'}
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
export default function Gyms() {
  const [gyms, setGyms] = useState([])
  const [tiers, setTiers] = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // all | active | suspended
  const [tierFilter, setTierFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedGym, setSelectedGym] = useState(null)
  const [selectedGymForDetails, setSelectedGymForDetails] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter, tierFilter])

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
      console.error('Failed to fetch gyms:', error)
      toast.error('Failed to load gyms')
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

  // Stats
  const totalGyms = gyms.length
  const activeGyms = gyms.filter(g => g.is_active).length
  const suspendedGyms = gyms.filter(g => !g.is_active).length
  const totalMembers = gyms.reduce((sum, g) => sum + g.members.used, 0)

  const tierOptions = Object.keys(tiers)

  const filteredGyms = gyms.filter(g => {
    const matchesSearch =
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.owner_email.toLowerCase().includes(search.toLowerCase())
    const matchesStatus =
      statusFilter === 'all' ? true : statusFilter === 'active' ? g.is_active : !g.is_active
    const matchesTier =
      tierFilter === 'all' ? true : g.subscription_tier === tierFilter
    return matchesSearch && matchesStatus && matchesTier
  })

  const hasActiveFilters = statusFilter !== 'all' || tierFilter !== 'all' || search.trim() !== ''

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setTierFilter('all')
  }

  const totalPages = Math.max(1, Math.ceil(filteredGyms.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginatedGyms = filteredGyms.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  if (loading) {
    return (
      <div className="gf-theme">
        <ThemeStyles />
        <div className="loading"><div className="spinner" /></div>
      </div>
    )
  }

  return (
    <div className="gf-theme">
      <ThemeStyles />
      <GymsMobileStyles />

      {/* ── Page Header ── */}
      <div className="page-header gy-header">
        <div>
          <h1 className="page-title">Gyms</h1>
          <p className="page-subtitle">Manage all gyms in the system</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary gy-new-btn">
          <Plus size={16} /> New Gym
        </button>
      </div>

      {/* ── Stats Grid ── */}
      <div className="gy-stats-grid">
        <StatCard icon={Building} iconColor={C.ember} label="Total Gyms" value={totalGyms} sub="In System" />
        <StatCard icon={Check} iconColor={C.mint} label="Active Gyms" value={activeGyms} sub="Online Now" />
        <StatCard icon={Ban} iconColor={C.red} label="Suspended" value={suspendedGyms} sub="Offline" />
        <StatCard icon={Users} iconColor={C.blue} label="Total Members" value={totalMembers.toLocaleString()} sub="Across All" />
      </div>

      {/* ── Search + Filters ── */}
      <div className="card gy-filter-card">
        <div className="gy-search-filters-row">
          <div className="gy-search-input-wrap">
            <Search size={14} className="gy-search-icon" />
            <input
              type="text"
              placeholder="Search by gym name or owner email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="form-input gy-search-input"
            />
            {search && (
              <button
                type="button"
                className="gy-search-clear"
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="gy-tier-select"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>

          <select
            value={tierFilter}
            onChange={e => setTierFilter(e.target.value)}
            className="gy-tier-select"
          >
            <option value="all">All plans</option>
            {tierOptions.map(key => (
              <option key={key} value={key}>
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button onClick={clearFilters} className="gy-clear-btn">
              <X size={12} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Gym Rows List ── */}
      <div className="gy-list">
        {paginatedGyms.map(gym => (
          <GymRow
            key={gym.id}
            gym={gym}
            onEdit={(g) => { setSelectedGym(g); setShowEditModal(true) }}
            onSuspend={handleSuspend}
            onActivate={handleActivate}
            onViewDetails={(g) => { setSelectedGymForDetails(g); setShowDetailModal(true) }}
          />
        ))}
      </div>

      {filteredGyms.length === 0 && (
        <div className="empty-state">
          <Building size={48} color={C.text3} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.4 }} />
          <p style={{ color: C.text3, marginBottom: 14 }}>
            {gyms.length === 0 ? 'No gyms found' : 'No gyms match your filters'}
          </p>
          {gyms.length === 0 ? (
            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary btn-sm">
              Create your first gym
            </button>
          ) : (
            <button onClick={clearFilters} className="btn btn-ghost btn-sm">
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* ── Pagination ── */}
      {filteredGyms.length > 0 && (
        <div className="gy-pagination">
          {totalPages > 1 && (
            <div className="gy-pagination-controls">
              <button
                className="gy-page-btn"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                aria-label="Previous page"
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                <button
                  key={n}
                  className={`gy-page-btn ${n === currentPage ? 'gy-page-btn-active' : ''}`}
                  onClick={() => setPage(n)}
                >
                  {n}
                </button>
              ))}
              <button
                className="gy-page-btn"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                aria-label="Next page"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Details Modal ── */}
      <GymDetailsModal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedGymForDetails(null) }}
        gym={selectedGymForDetails}
      />

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

/* ═══════════════════════════════════════════════════════════════
   SCOPED STYLES
═══════════════════════════════════════════════════════════════ */
function GymsMobileStyles() {
  return (
    <style>{`
      .gy-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; }

      .gy-badge {
        display: inline-flex; align-items: center; gap: 4px;
        padding: 3px 10px; border-radius: 20px;
        font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;
        white-space: nowrap;
      }

      /* ---- stats ---- */
      .gy-stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
      .gy-stat-card {
        position: relative; overflow: hidden;
        padding: 18px 20px; display: flex; flex-direction: column; gap: 6px;
        border: 1px solid ${C.line}; transition: transform .2s, border-color .2s; cursor: default;
      }
      .gy-stat-card:hover { transform: translateY(-2px); }
      .gy-stat-decoration {
        position: absolute; bottom: -14px; right: -10px;
        opacity: 0.08; pointer-events: none; line-height: 0;
      }
      .gy-stat-top { display: flex; align-items: center; justify-content: space-between; position: relative; z-index: 1; }
      .gy-stat-icon { width: 36px; height: 36px; border-radius: 9px; display: flex; align-items: center; justify-content: center; }
      .gy-stat-sub { font-size: 10px; color: ${C.text3}; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; }
      .gy-stat-value { font-size: 24px; font-weight: 800; color: ${C.text}; line-height: 1; margin-bottom: 2px; letter-spacing: -0.02em; position: relative; z-index: 1; }
      .gy-stat-label { font-size: 11.5px; color: ${C.text2}; font-weight: 600; position: relative; z-index: 1; }

      /* ---- filter card ---- */
      .gy-filter-card { margin-bottom: 20px; padding: 14px 16px; }
      .gy-search-filters-row {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }

      /* ---- search input ---- */
      .gy-search-input-wrap {
        position: relative;
        flex: 1;
        min-width: 260px;
        max-width: 990px;
      }
      .gy-search-icon {
        position: absolute;
        left: 16px;
        top: 50%;
        transform: translateY(-50%);
        color: ${C.text3};
        pointer-events: none;
        z-index: 2;
        transition: color .2s ease;
      }
      .gy-search-input {
        padding-left: 46px !important;
        padding-right: 40px !important;
        padding-top: 13px !important;
        padding-bottom: 13px !important;
        font-size: 14px !important;
        background: ${C.surface2} !important;
        border: 1px solid ${C.line} !important;
        border-radius: 10px !important;
        width: 100% !important;
        transition: border-color .2s ease, box-shadow .2s ease, background .2s ease;
      }
      .gy-search-input::placeholder { color: ${C.text3}; }
      .gy-search-input:hover { border-color: ${C.ember}55 !important; }
      .gy-search-input:focus {
        border-color: ${C.ember} !important;
        box-shadow: 0 0 0 3px ${C.ember}22 !important;
        background: ${C.surface} !important;
        outline: none !important;
      }
      .gy-search-input-wrap:focus-within .gy-search-icon { color: ${C.ember}; }
      .gy-search-clear {
        position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
        width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;
        border: none; background: ${C.surface2}; color: ${C.text3}; border-radius: 6px;
        cursor: pointer; transition: all .15s ease; z-index: 2;
      }
      .gy-search-clear:hover { background: ${C.red}15; color: ${C.red}; }

      .gy-tier-select {
        background: ${C.surface2}; border: 1px solid ${C.line}; color: ${C.text};
        font-size: 12px; font-weight: 600; padding: 10px 12px; border-radius: 10px;
        cursor: pointer; font-family: inherit; min-width: 140px;
        transition: border-color .15s ease;
      }
      .gy-tier-select:hover { border-color: ${C.ember}55; }
      .gy-tier-select:focus { border-color: ${C.ember}; outline: none; }

      .gy-clear-btn {
        display: flex; align-items: center; gap: 4px;
        background: transparent; border: none; color: ${C.text3};
        font-size: 11px; font-weight: 600; cursor: pointer; padding: 8px 10px;
        border-radius: 8px; transition: all .15s; font-family: inherit;
        white-space: nowrap;
      }
      .gy-clear-btn:hover { color: ${C.red}; background: ${C.red}10; }

      /* ---- gym list (rows) ---- */
      .gy-list { display: flex; flex-direction: column; gap: 16px; }

      .gy-row {
        position: relative; overflow: hidden;
        display: flex; gap: 20px; padding: 22px 24px;
        border: 1px solid ${C.line}; background: ${C.surface}; border-radius: 14px;
        cursor: pointer; transition: transform .2s, box-shadow .2s, border-color .2s;
      }
      .gy-row:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(0,0,0,0.32); border-color: ${C.ember}55; }

      .gy-row-thumb {
        position: relative; flex-shrink: 0; align-self: stretch;
        width: 220px; min-height: 100%; border-radius: 12px;
        background-size: cover; background-position: center; background-color: ${C.surface2};
        border: 1px solid ${C.line};
      }
      .gy-row-dot {
        position: absolute; top: 8px; right: 8px;
        width: 11px; height: 11px; border-radius: 50%;
        background: ${C.mint}; border: 2.5px solid ${C.surface};
        box-shadow: 0 0 0 2px ${C.mint}25;
      }

      .gy-row-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 16px; }

      .gy-row-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
      .gy-row-title-wrap { min-width: 0; display: flex; flex-direction: column; gap: 8px; }
      .gy-row-name {
        font-size: 18px; font-weight: 700; color: ${C.text}; margin: 0; letter-spacing: -0.01em;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 360px;
      }
      .gy-row-badges { display: flex; gap: 6px; flex-wrap: wrap; }
      .gy-row-owner {
        display: flex; align-items: center; gap: 6px; font-size: 12.5px; color: ${C.text3}; margin: 0;
      }
      .gy-row-owner span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

      .gy-row-top-right { display: flex; align-items: flex-start; gap: 8px; flex-shrink: 0; }

      .gy-row-usage-panel {
        display: flex; align-items: stretch; gap: 0;
        background: ${C.surface2}; border: 1px solid ${C.line}; border-radius: 12px;
        padding: 14px 18px;
      }
      .gy-usage-block { flex: 1; display: flex; flex-direction: column; gap: 6px; min-width: 0; }
      .gy-usage-divider { width: 1px; background: ${C.line}; margin: 0 18px; }
      .gy-usage-top { display: flex; justify-content: space-between; align-items: baseline; font-size: 11.5px; }
      .gy-usage-label { color: ${C.text3}; font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em; font-size: 10px; }
      .gy-usage-value { font-weight: 700; font-size: 12.5px; }
      .gy-usage-track { height: 5px; border-radius: 99px; background: ${C.line}50; overflow: hidden; }
      .gy-usage-fill { height: 100%; border-radius: 99px; transition: width .4s ease; }
      .gy-usage-pct { font-size: 10px; color: ${C.text3}; }

      .gy-row-footer {
        display: flex; align-items: center; justify-content: space-between; gap: 12px;
      }
      .gy-row-joined { display: flex; align-items: center; gap: 6px; font-size: 11.5px; color: ${C.text3}; flex-shrink: 0; }
      .gy-details-btn-solid {
        display: flex; align-items: center; gap: 6px;
        background: transparent; border: 1px solid ${C.line}; color: ${C.text2};
        font-size: 11.5px; font-weight: 600; cursor: pointer;
        padding: 8px 16px; border-radius: 9px; transition: all .2s; font-family: inherit;
      }
      .gy-details-btn-solid:hover { border-color: ${C.ember}; color: ${C.ember}; background: ${C.ember}10; }

      /* ---- icon buttons ---- */
      .gy-icon-btn {
        width: 32px; height: 32px; border-radius: 8px; border: 1px solid ${C.line};
        background: transparent; color: ${C.text2}; cursor: pointer;
        display: flex; align-items: center; justify-content: center; transition: all .2s; flex-shrink: 0;
      }
      .gy-icon-btn:hover { border-color: ${C.ember}; color: ${C.ember}; background: ${C.ember}10; }
      .gy-icon-btn-red:hover { border-color: ${C.red}; color: ${C.red}; background: ${C.red}10; }
      .gy-icon-btn-mint:hover { border-color: ${C.mint}; color: ${C.mint}; background: ${C.mint}10; }

      /* ---- icon buttons + kebab menu ---- */
      /* ---- pagination ---- */
      .gy-pagination {
        display: flex; align-items: center; justify-content: space-between;
        gap: 12px; margin-top: 20px; flex-wrap: wrap;
      }
      .gy-pagination-info { font-size: 11.5px; color: ${C.text3}; font-weight: 600; }
      .gy-pagination-controls { display: flex; align-items: center; gap: 6px; }
      .gy-page-btn {
        min-width: 30px; height: 30px; padding: 0 8px;
        border-radius: 8px; border: 1px solid ${C.line}; background: ${C.surface2};
        color: ${C.text2}; font-size: 12px; font-weight: 700; cursor: pointer;
        display: flex; align-items: center; justify-content: center; transition: all .15s;
      }
      .gy-page-btn:hover:not(:disabled) { border-color: ${C.ember}; color: ${C.ember}; }
      .gy-page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
      .gy-page-btn-active { background: ${C.ember}; border-color: ${C.ember}; color: #fff; }

      /* ═══ MOBILE ═══ */
      @media (max-width: 1024px) {
        .gy-search-filters-row { flex-direction: column; align-items: stretch !important; gap: 10px !important; }
        .gy-search-input-wrap { max-width: none !important; }
        .gy-tier-select { width: 100%; }
      }

      @media (max-width: 768px) {
        .gy-header { flex-direction: column !important; align-items: stretch !important; gap: 12px !important; }
        .gy-new-btn { width: 100% !important; justify-content: center !important; }

        .gy-stats-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; margin-bottom: 18px !important; }
        .gy-stat-card { padding: 14px 16px !important; }
        .gy-stat-value { font-size: 19px !important; }

        .gy-filter-card { padding: 12px !important; margin-bottom: 16px !important; }
        .gy-clear-btn { justify-content: center !important; width: 100% !important; border: 1px dashed ${C.line} !important; }

        .gy-row { flex-direction: column; padding: 18px; }
        .gy-row-thumb { width: 100%; height: 100px; }
        .gy-row-name { max-width: none; }
        .gy-row-top { flex-direction: column; gap: 10px; }
        .gy-row-top-right { width: 100%; justify-content: space-between; }
        .gy-row-usage-panel { flex-direction: column; padding: 14px; gap: 14px; }
        .gy-usage-divider { display: none; }
        .gy-row-footer { flex-direction: column; align-items: stretch; gap: 10px; }
        .gy-details-btn-solid { justify-content: center; }

        .gy-pagination { flex-direction: column; align-items: stretch; }
        .gy-pagination-controls { justify-content: center; flex-wrap: wrap; }
      }

      @media (max-width: 420px) {
        .gy-stats-grid { grid-template-columns: 1fr 1fr !important; }
      }
    `}</style>
  )
}