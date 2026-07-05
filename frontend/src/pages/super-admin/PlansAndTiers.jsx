// frontend/src/pages/super-admin/PlansAndTiers.jsx
//
// This page manages the SUPER ADMIN's subscription tiers — the plans sold
// TO GYMS (e.g. "Basic" = 2 coaches / 50 members / 5000 DZD). It is NOT
// related to the membership plans a gym sells to its own members (that's
// the gym-level "Plans" screen, backed by /api/plans).

import { useEffect, useState } from 'react'
import api from "../../api/client"
import toast from 'react-hot-toast'
import {
  Shield, Zap, Star, Crown, Plus, Edit, Trash2, X, Save, RefreshCw,
  Users, DollarSign, CheckCircle, AlertCircle
} from 'lucide-react'
import { COLORS, ThemeStyles } from '../../theme/GymTheme'
import Modal from "../../components/Modal"

const C = COLORS

/* ─── Style config for each tier (by key) ───────────────────── */
const TIER_STYLES = {
  basic: { icon: Shield, color: C.blue, bg: `${C.blue}15`, border: `${C.blue}40` },
  pro: { icon: Zap, color: C.ember, bg: `${C.ember}15`, border: `${C.ember}40` },
  premium: { icon: Star, color: C.amber, bg: `${C.amber}15`, border: `${C.amber}40` },
  enterprise: { icon: Crown, color: '#a78bfa', bg: '#a78bfa15', border: '#a78bfa40' },
}
const DEFAULT_STYLE = { icon: Shield, color: C.text2, bg: `${C.text2}15`, border: `${C.text2}40` }

function formatPrice(price) {
  if (price === null || price === undefined) return 'Contact us'
  return `${price.toLocaleString()} DZD`
}

// The seed data's "features" list often just restates the coach/member
// limits in prose (e.g. "Up to 2 coaches") which are already shown as
// stats above. Filter those out so the chip list only shows things that
// add new information.
function extraFeatures(features, maxCoaches, maxMembers) {
  const redundant = new Set([
    `up to ${maxCoaches} coach`, `up to ${maxCoaches} coaches`,
    `up to ${maxMembers} member`, `up to ${maxMembers} members`,
    'unlimited coaches', 'unlimited members',
  ].map(s => s.toLowerCase()))
  return (features || []).filter(f => !redundant.has(f.toLowerCase()))
}

/* ─── Tier Card ────────────────────────────────────────────── */
function TierCard({ tier, gymCount, onEdit, onDelete }) {
  const style = TIER_STYLES[tier.key] || DEFAULT_STYLE
  const Icon = style.icon
  const features = extraFeatures(tier.features, tier.max_coaches, tier.max_members)

  return (
    <div
      className="card"
      style={{
        padding: '24px',
        border: `1px solid ${style.border}`,
        background: C.surface,
        transition: 'transform .2s, box-shadow .2s',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
    >
      {/* Header — fixed height so it lines up across cards */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', minHeight: 52, marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: style.bg, color: style.color,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <Icon size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: C.text, margin: 0 }}>
              {tier.name}
            </h3>
            <p style={{ fontSize: 11, color: C.text3, margin: 0, fontFamily: 'monospace' }}>
              key: {tier.key}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <button
            onClick={() => onEdit(tier)}
            style={{
              width: 32, height: 32, borderRadius: 8,
              border: `1px solid ${C.line}`,
              background: 'transparent',
              color: C.text2,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all .2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = style.color; e.currentTarget.style.color = style.color }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.line; e.currentTarget.style.color = C.text2 }}
          >
            <Edit size={14} />
          </button>
          <button
            onClick={() => onDelete(tier)}
            style={{
              width: 32, height: 32, borderRadius: 8,
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
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Price — fixed height so it lines up across cards (Contact us vs X DZD) */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, minHeight: 34 }}>
        <span style={{ fontSize: 26, fontWeight: 800, color: C.text }}>
          {formatPrice(tier.price)}
        </span>
        {tier.price !== null && (
          <span style={{ fontSize: 12, color: C.text3, fontWeight: 500 }}>/ month</span>
        )}
      </div>

      {/* Limits — always exactly 2 numbers, so this box is naturally identical height */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 10,
        marginTop: 14,
        padding: '12px 14px',
        borderRadius: 10,
        background: C.surface2,
        border: `1px solid ${C.line}`,
      }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.text, lineHeight: 1.2 }}>{tier.max_coaches}</div>
          <div style={{ fontSize: 11, color: C.text3, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Users size={11} /> coaches
          </div>
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.text, lineHeight: 1.2 }}>{tier.max_members}</div>
          <div style={{ fontSize: 11, color: C.text3, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Users size={11} /> members
          </div>
        </div>
      </div>

      <div style={{ fontSize: 11, color: C.text3, marginTop: 10, minHeight: 16 }}>
        {gymCount} gym{gymCount === 1 ? '' : 's'} currently on this tier
      </div>

      {/* Features — this is the only section that grows/shrinks; it fills
          whatever space is left so the card bottom edge still lines up,
          instead of the card itself resizing to fit the feature count. */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        marginTop: 16,
        paddingTop: '14px',
        borderTop: `1px solid ${C.line}`,
      }}>
        {features.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignContent: 'flex-start' }}>
            {features.map((f, i) => (
              <span
                key={i}
                style={{
                  fontSize: 11,
                  padding: '4px 12px',
                  borderRadius: 20,
                  background: C.surface2,
                  color: C.text2,
                  border: `1px solid ${C.line}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <CheckCircle size={10} color={style.color} /> {f}
              </span>
            ))}
          </div>
        ) : (
          <span style={{ fontSize: 11, color: C.text3, fontStyle: 'italic' }}>
            No extra features listed
          </span>
        )}
      </div>
    </div>
  )
}

/* ─── Tier Modal (Create / Edit) ────────────────────────────── */
function TierModal({ isOpen, onClose, onSubmit, tier, isEditing, submitting }) {
  const [formData, setFormData] = useState({
    key: '',
    name: '',
    price: '',
    max_coaches: '',
    max_members: '',
    features: '',
    unlimitedPrice: false,
  })

  useEffect(() => {
    if (tier) {
      setFormData({
        key: tier.key || '',
        name: tier.name || '',
        price: tier.price ?? '',
        max_coaches: tier.max_coaches ?? '',
        max_members: tier.max_members ?? '',
        features: (tier.features || []).join(', '),
        unlimitedPrice: tier.price === null,
      })
    } else {
      setFormData({
        key: '', name: '', price: '', max_coaches: '', max_members: '',
        features: '', unlimitedPrice: false,
      })
    }
  }, [tier, isOpen])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      key: formData.key.trim().toLowerCase().replace(/\s+/g, '_'),
      name: formData.name,
      price: formData.unlimitedPrice ? null : (parseFloat(formData.price) || 0),
      max_coaches: parseInt(formData.max_coaches) || 0,
      max_members: parseInt(formData.max_members) || 0,
      features: formData.features.split(',').map(f => f.trim()).filter(Boolean),
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Tier' : 'Create New Tier'} size="lg">
      <form onSubmit={handleSubmit}>
        <div className="grid-2 mb-4" style={{ gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Display Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="form-input"
              required
              placeholder="e.g. Pro"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Key *</label>
            <input
              type="text"
              value={formData.key}
              onChange={e => setFormData({ ...formData, key: e.target.value })}
              className="form-input"
              required
              disabled={isEditing}
              placeholder="e.g. pro"
            />
            <p style={{ fontSize: 10, color: C.text3, marginTop: 4 }}>
              Lowercase, no spaces. Used internally, can't be changed after creation.
            </p>
          </div>
        </div>

        <div className="grid-2 mb-4" style={{ gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Max Coaches *</label>
            <input
              type="number"
              value={formData.max_coaches}
              onChange={e => setFormData({ ...formData, max_coaches: e.target.value })}
              className="form-input"
              required
              min="0"
              placeholder="5"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Max Members *</label>
            <input
              type="number"
              value={formData.max_members}
              onChange={e => setFormData({ ...formData, max_members: e.target.value })}
              className="form-input"
              required
              min="0"
              placeholder="200"
            />
          </div>
        </div>

        <div className="form-group mb-4">
          <label className="form-label">Price (DZD / month)</label>
          <input
            type="number"
            value={formData.price}
            onChange={e => setFormData({ ...formData, price: e.target.value })}
            className="form-input"
            placeholder="15000"
            disabled={formData.unlimitedPrice}
            required={!formData.unlimitedPrice}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 12, color: C.text2, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={formData.unlimitedPrice}
              onChange={e => setFormData({ ...formData, unlimitedPrice: e.target.checked })}
            />
            "Contact us" pricing (no fixed price, e.g. Enterprise)
          </label>
        </div>

        <div className="form-group mb-4">
          <label className="form-label">Features (comma separated)</label>
          <input
            type="text"
            value={formData.features}
            onChange={e => setFormData({ ...formData, features: e.target.value })}
            className="form-input"
            placeholder="Advanced reporting, Priority support, Custom branding"
          />
          <p style={{ fontSize: 10, color: C.text3, marginTop: 4 }}>
            Separate each feature with a comma.
          </p>
        </div>

        <div className="flex gap-3">
          <button type="submit" className="btn btn-primary flex-1" disabled={submitting}>
            {submitting ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Tier')}
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
export default function PlansAndTiers() {
  const [tiers, setTiers] = useState([])
  const [gyms, setGyms] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedTier, setSelectedTier] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [tiersRes, gymsRes] = await Promise.all([
        api.get('/super-admin/tiers'),
        api.get('/super-admin/gyms'),
      ])
      setTiers(tiersRes.data)
      setGyms(gymsRes.data)
    } catch (error) {
      console.error('Failed to fetch tiers:', error)
      toast.error('Failed to load tiers')
    } finally {
      setLoading(false)
    }
  }

  const gymCountForTier = (key) => gyms.filter(g => g.subscription_tier === key).length

  const handleCreateTier = async (data) => {
    setSubmitting(true)
    try {
      await api.post('/super-admin/tiers', data)
      toast.success('Tier created successfully!')
      setShowCreateModal(false)
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create tier')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditTier = async (data) => {
    setSubmitting(true)
    try {
      const { key, ...rest } = data // key can't change once created
      await api.put(`/super-admin/tiers/${selectedTier.id}`, rest)
      toast.success('Tier updated successfully!')
      setShowEditModal(false)
      setSelectedTier(null)
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update tier')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteTier = async (tier) => {
    if (!confirm(`Are you sure you want to delete "${tier.name}"?`)) return
    try {
      await api.delete(`/super-admin/tiers/${tier.id}`)
      toast.success('Tier deleted')
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete tier')
    }
  }

  // Stats
  const totalTiers = tiers.length
  const totalGymsSubscribed = gyms.length
  const mrr = tiers.reduce((sum, t) => sum + ((t.price || 0) * gymCountForTier(t.key)), 0)

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

      {/* Page Header */}
      <div className="page-header" style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '24px'
      }}>
        <div>
          <p style={{ fontSize: 11, color: C.ember, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 6 }}>
            Management
          </p>
          <h1 className="page-title" style={{ fontSize: 'clamp(24px, 3vw, 32px)' }}>Plans & Tiers</h1>
          <p className="page-subtitle">Subscription tiers you sell to gyms — coach &amp; member limits, pricing</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={fetchData} className="btn btn-ghost btn-sm">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
            <Plus size={16} /> New Tier
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 14,
        marginBottom: 24
      }}>
        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <Shield size={16} color={C.ember} />
            <span style={{ fontSize: 11, color: C.text3, fontWeight: 600 }}>Total Tiers</span>
          </div>
          <p style={{ fontSize: 24, fontWeight: 800, color: C.text, margin: 0 }}>{totalTiers}</p>
        </div>
        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <Users size={16} color={C.blue} />
            <span style={{ fontSize: 11, color: C.text3, fontWeight: 600 }}>Gyms Subscribed</span>
          </div>
          <p style={{ fontSize: 24, fontWeight: 800, color: C.text, margin: 0 }}>{totalGymsSubscribed}</p>
        </div>
        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <DollarSign size={16} color={C.mint} />
            <span style={{ fontSize: 11, color: C.text3, fontWeight: 600 }}>Monthly Revenue (from gyms)</span>
          </div>
          <p style={{ fontSize: 24, fontWeight: 800, color: C.text, margin: 0 }}>{mrr.toLocaleString()} DZD</p>
        </div>
      </div>

      {/* Tier Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 16,
      }}>
        {tiers.map((tier) => (
          <TierCard
            key={tier.id}
            tier={tier}
            gymCount={gymCountForTier(tier.key)}
            onEdit={(t) => { setSelectedTier(t); setShowEditModal(true) }}
            onDelete={handleDeleteTier}
          />
        ))}
        {tiers.length === 0 && (
          <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
            <AlertCircle size={48} color={C.text3} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.4 }} />
            <p style={{ color: C.text3, marginBottom: 14 }}>No tiers created yet</p>
            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary btn-sm">
              Create your first tier
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <TierModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateTier}
        isEditing={false}
        submitting={submitting}
      />

      <TierModal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setSelectedTier(null) }}
        onSubmit={handleEditTier}
        tier={selectedTier}
        isEditing={true}
        submitting={submitting}
      />

      {/* Responsive Styles */}
      <style jsx>{`
        @media (max-width: 768px) {
          .page-header {
            flex-direction: column !important;
            align-items: flex-start !important;
          }

          .page-header > div:last-child {
            width: 100%;
            justify-content: flex-start;
          }

          .btn {
            padding: 8px 12px;
            font-size: 13px;
          }

          .card {
            padding: 16px !important;
          }
        }

        @media (max-width: 480px) {
          .grid-2 {
            grid-template-columns: 1fr !important;
          }

          .flex {
            flex-direction: column;
          }

          .flex.gap-3 {
            gap: 8px;
          }
        }
      `}</style>
    </div>
  )
}