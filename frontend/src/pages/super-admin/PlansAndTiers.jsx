// frontend/src/pages/super-admin/PlansAndTiers.jsx

import { useEffect, useState } from 'react'
import api from "../../api/client"
import toast from 'react-hot-toast'
import {
  Shield, Zap, Star, Crown, Plus, Edit, Trash2, X, Save, RefreshCw,
  Users, DollarSign, Calendar, CheckCircle, AlertCircle
} from 'lucide-react'
import { COLORS, ThemeStyles } from '../../theme/GymTheme'
import Modal from "../../components/Modal"

const C = COLORS

/* ─── Style config for each tier ────────────────────────────── */
const TIER_STYLES = {
  basic: { 
    icon: Shield, 
    color: C.blue, 
    bg: `${C.blue}15`, 
    border: `${C.blue}40`,
    label: 'Basic'
  },
  pro: { 
    icon: Zap, 
    color: C.ember, 
    bg: `${C.ember}15`, 
    border: `${C.ember}40`,
    label: 'Pro'
  },
  premium: { 
    icon: Star, 
    color: C.amber, 
    bg: `${C.amber}15`, 
    border: `${C.amber}40`,
    label: 'Premium'
  },
  enterprise: { 
    icon: Crown, 
    color: '#a78bfa', 
    bg: '#a78bfa15', 
    border: '#a78bfa40',
    label: 'Enterprise'
  },
}

/* ─── Plan Card ────────────────────────────────────────────── */
function PlanCard({ plan, onEdit, onDelete }) {
  const style = TIER_STYLES[plan.tier_key] || TIER_STYLES.basic
  const Icon = style.icon

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
        position: 'relative'
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: style.bg, color: style.color,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Icon size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: C.text, margin: 0, textTransform: 'capitalize' }}>
              {plan.name}
            </h3>
            <p style={{ fontSize: 12, color: C.text3, margin: 0 }}>
              {plan.duration_days} days
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => onEdit(plan)}
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
            onClick={() => onDelete(plan)}
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

      {/* Price */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontSize: 28, fontWeight: 800, color: C.text }}>
            {plan.price?.toLocaleString()}
          </span>
          <span style={{ fontSize: 13, color: C.text3, fontWeight: 500 }}>DZD</span>
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: C.text3, marginTop: 2 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Users size={12} /> {plan.subscriber_count || 0} subscribers
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Calendar size={12} /> {plan.duration_days} days
          </span>
        </div>
      </div>

      {/* Description */}
      {plan.description && (
        <p style={{ fontSize: 12, color: C.text2, lineHeight: 1.5, marginBottom: '12px' }}>
          {plan.description}
        </p>
      )}

      {/* Features (Visible + Editable) */}
      <div style={{ marginTop: 'auto' }}>
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 6, 
          paddingTop: '12px', 
          borderTop: `1px solid ${C.line}` 
        }}>
          {(plan.features || []).map((f, i) => (
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
          {(plan.features || []).length === 0 && (
            <span style={{ fontSize: 11, color: C.text3, fontStyle: 'italic' }}>
              No features listed
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Plan Modal (Create / Edit) ────────────────────────────── */
function PlanModal({ isOpen, onClose, onSubmit, plan, isEditing, submitting }) {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    duration_days: '',
    description: '',
    features: ''
  })

  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name || '',
        price: plan.price || '',
        duration_days: plan.duration_days || '',
        description: plan.description || '',
        features: (plan.features || []).join(', ')
      })
    } else {
      setFormData({
        name: '',
        price: '',
        duration_days: '',
        description: '',
        features: ''
      })
    }
  }, [plan, isOpen])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      price: parseFloat(formData.price) || 0,
      duration_days: parseInt(formData.duration_days) || 30,
      features: formData.features.split(',').map(f => f.trim()).filter(Boolean)
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Plan' : 'Create New Plan'} size="lg">
      <form onSubmit={handleSubmit}>
        {/* Name */}
        <div className="form-group mb-4">
          <label className="form-label">Plan Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            className="form-input"
            required
            placeholder="e.g. Premium Monthly"
          />
        </div>

        {/* Price + Duration */}
        <div className="grid-2 mb-4" style={{ gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Price (DZD) *</label>
            <input
              type="number"
              value={formData.price}
              onChange={e => setFormData({ ...formData, price: e.target.value })}
              className="form-input"
              required
              placeholder="15000"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Duration (Days) *</label>
            <input
              type="number"
              value={formData.duration_days}
              onChange={e => setFormData({ ...formData, duration_days: e.target.value })}
              className="form-input"
              required
              placeholder="30"
            />
          </div>
        </div>

        {/* Features */}
        <div className="form-group mb-4">
          <label className="form-label">Features (comma separated)</label>
          <input
            type="text"
            value={formData.features}
            onChange={e => setFormData({ ...formData, features: e.target.value })}
            className="form-input"
            placeholder="24/7 Access, Personal Trainer, Group Classes"
          />
          <p style={{ fontSize: 10, color: C.text3, marginTop: 4 }}>
            Separate each feature with a comma.
          </p>
        </div>

        {/* Description */}
        <div className="form-group mb-4">
          <label className="form-label">Description</label>
          <textarea
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            className="form-input"
            rows="2"
            placeholder="Brief description of the plan..."
          />
        </div>

        <div className="flex gap-3">
          <button type="submit" className="btn btn-primary flex-1" disabled={submitting}>
            {submitting ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Plan')}
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
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    setLoading(true)
    try {
      const res = await api.get('/plans')
      setPlans(res.data)
    } catch (error) {
      console.error('Failed to fetch plans:', error)
      toast.error('Failed to load plans')
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePlan = async (data) => {
    setSubmitting(true)
    console.log("🔥 SENDING TO CREATE:", data.features)
    try {
      await api.post('/plans', data)
      toast.success('Plan created successfully!')
      setShowCreateModal(false)
      fetchPlans()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create plan')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditPlan = async (data) => {
    setSubmitting(true)
    try {
      await api.put(`/plans/${selectedPlan.id}`, data)
      toast.success('Plan updated successfully!')
      setShowEditModal(false)
      setSelectedPlan(null)
      fetchPlans()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update plan')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeletePlan = async (plan) => {
    if (!confirm(`Are you sure you want to delete "${plan.name}"?`)) return
    try {
      await api.delete(`/plans/${plan.id}`)
      toast.success('Plan deleted')
      fetchPlans()
    } catch (error) {
      toast.error('Failed to delete plan')
    }
  }

  // Stats
  const totalPlans = plans.length
  const totalSubscribers = plans.reduce((sum, p) => sum + (p.subscriber_count || 0), 0)
  const mrr = plans.reduce((sum, p) => sum + ((p.price || 0) * (p.subscriber_count || 0)), 0)

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

      {/* Page Header - Responsive */}
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
          <p className="page-subtitle">Manage subscription plans</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={fetchPlans} className="btn btn-ghost btn-sm">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
            <Plus size={16} /> New Plan
          </button>
        </div>
      </div>

      {/* Stats Row - Responsive */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
        gap: 14, 
        marginBottom: 24 
      }}>
        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <Shield size={16} color={C.ember} />
            <span style={{ fontSize: 11, color: C.text3, fontWeight: 600 }}>Total Plans</span>
          </div>
          <p style={{ fontSize: 24, fontWeight: 800, color: C.text, margin: 0 }}>{totalPlans}</p>
        </div>
        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <Users size={16} color={C.blue} />
            <span style={{ fontSize: 11, color: C.text3, fontWeight: 600 }}>Subscribers</span>
          </div>
          <p style={{ fontSize: 24, fontWeight: 800, color: C.text, margin: 0 }}>{totalSubscribers}</p>
        </div>
        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <DollarSign size={16} color={C.mint} />
            <span style={{ fontSize: 11, color: C.text3, fontWeight: 600 }}>Monthly Revenue</span>
          </div>
          <p style={{ fontSize: 24, fontWeight: 800, color: C.text, margin: 0 }}>{mrr.toLocaleString()} DZD</p>
        </div>
      </div>

      {/* Plan Cards Grid - Responsive */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
        gap: 16 
      }}>
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            onEdit={(p) => { setSelectedPlan(p); setShowEditModal(true) }}
            onDelete={handleDeletePlan}
          />
        ))}
        {plans.length === 0 && (
          <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
            <AlertCircle size={48} color={C.text3} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.4 }} />
            <p style={{ color: C.text3, marginBottom: 14 }}>No plans created yet</p>
            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary btn-sm">
              Create your first plan
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <PlanModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreatePlan}
        isEditing={false}
        submitting={submitting}
      />

      <PlanModal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setSelectedPlan(null) }}
        onSubmit={handleEditPlan}
        plan={selectedPlan}
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
          
          .card h3 {
            font-size: 16px !important;
          }
          
          .card .price {
            font-size: 24px !important;
          }
        }
        
        @media (max-width: 480px) {
          .stats-row {
            grid-template-columns: 1fr !important;
          }
          
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