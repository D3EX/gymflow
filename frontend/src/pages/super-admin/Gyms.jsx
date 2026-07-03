// frontend/src/pages/super-admin/Gyms.jsx

import { useEffect, useState } from 'react'
import api from "../../api/client"
import toast from 'react-hot-toast'
import {
  Building, Plus, Search, Edit, Trash2, Ban, Check,
  ChevronDown, ChevronUp, Crown, Users, Award,
  RefreshCw, X, Save, Calendar
} from 'lucide-react'
import { COLORS, ThemeStyles } from '../../theme/GymTheme'
import Modal from "../../components/Modal"

const C = COLORS

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

function StatusBadge({ active }) {
  return active ? (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 20,
      background: `${C.mint}18`, color: C.mint,
      fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em'
    }}>
      <Check size={10} /> Active
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

      {expanded && (
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${C.line}` }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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

export default function Gyms() {
  const [gyms, setGyms] = useState([])
  const [tiers, setTiers] = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedGym, setSelectedGym] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    owner_name: '',
    owner_email: '',
    owner_password: '',
    subscription_tier: 'basic'
  })

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

  const filteredGyms = gyms.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    g.owner_email.toLowerCase().includes(search.toLowerCase())
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

      <div className="page-header">
        <div>
          <h1 className="page-title">Gyms</h1>
          <p className="page-subtitle">Manage all gyms in the system</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
          <Plus size={16} /> New Gym
        </button>
      </div>

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

      {/* Create Gym Modal */}
      {showCreateModal && (
        <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Gym" size="lg">
          <form onSubmit={(e) => {
            e.preventDefault()
            handleCreateGym(formData)
          }}>
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
              <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-ghost">
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Gym Modal */}
      {showEditModal && selectedGym && (
        <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setSelectedGym(null) }} title="Change Subscription Plan" size="md">
          <form onSubmit={(e) => {
            e.preventDefault()
            const form = e.target
            const tier = form.tier.value
            handleEditTier(selectedGym.id, tier)
          }}>
            <div className="form-group mb-4">
              <label className="form-label">Gym</label>
              <p style={{ fontSize: 14, fontWeight: 600, color: C.text, margin: 0 }}>
                {selectedGym.name}
              </p>
              <p style={{ fontSize: 12, color: C.text3, margin: '2px 0 0' }}>
                Current: <TierBadge tier={selectedGym.subscription_tier} />
              </p>
            </div>
            <div className="form-group mb-4">
              <label className="form-label">New Plan *</label>
              <select name="tier" defaultValue={selectedGym.subscription_tier} className="form-input" required>
                {Object.keys(tiers).map(key => (
                  <option key={key} value={key}>
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn btn-primary flex-1" disabled={submitting}>
                {submitting ? 'Updating...' : 'Update Plan'}
              </button>
              <button type="button" onClick={() => { setShowEditModal(false); setSelectedGym(null) }} className="btn btn-ghost">
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}