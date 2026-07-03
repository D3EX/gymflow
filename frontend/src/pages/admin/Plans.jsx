// frontend/src/pages/admin/Plans.jsx

import { useEffect, useState } from 'react'
import api from "../../api/client"
import toast from 'react-hot-toast'
import { Edit, Trash2, Plus, DollarSign, Users, TrendingUp, Zap, Package, BarChart3, ArrowUpRight } from 'lucide-react'
import Modal from "../../components/Modal"
import { COLORS, ThemeStyles } from '../../theme/GymTheme'

export default function Plans() {
  const [plans, setPlans] = useState([])
  const [subscriptions, setSubscriptions] = useState([])
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    duration_days: '',
    description: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [plansRes, subsRes] = await Promise.all([
        api.get('/plans'),
        api.get('/subscriptions')
      ])
      setPlans(plansRes.data)
      setSubscriptions(subsRes.data)
    } catch (error) {
      toast.error('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (plan = null) => {
    if (plan) {
      setEditingPlan(plan)
      setFormData({
        name: plan.name,
        price: plan.price,
        duration_days: plan.duration_days,
        description: plan.description || '',
      })
    } else {
      setEditingPlan(null)
      setFormData({
        name: '',
        price: '',
        duration_days: '',
        description: '',
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingPlan(null)
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingPlan) {
        await api.put(`/plans/${editingPlan.id}`, formData)
        toast.success('Plan updated')
      } else {
        await api.post('/plans', formData)
        toast.success('Plan created')
      }
      handleCloseModal()
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed')
    }
  }

  const handleDelete = async (id, name) => {
    if (confirm(`Delete plan "${name}"?`)) {
      try {
        await api.delete(`/plans/${id}`)
        toast.success('Plan deleted')
        fetchData()
      } catch (error) {
        toast.error('Failed to delete plan')
      }
    }
  }

  const getSubscribersForPlan = (planId) => {
    return subscriptions.filter(s => s.plan_id === planId && s.status === 'active').length
  }

  const getRevenueForPlan = (plan) => {
    const subscribers = getSubscribersForPlan(plan.id)
    return subscribers * plan.price
  }

  const totalSubscribers = plans.reduce((sum, plan) => sum + getSubscribersForPlan(plan.id), 0)
  const mostPopular = plans.reduce((max, plan) => {
    const subs = getSubscribersForPlan(plan.id)
    return subs > (getSubscribersForPlan(max.id) || 0) ? plan : max
  }, plans[0] || { name: 'None' })
  const monthlyRevenue = plans.reduce((sum, plan) => sum + getRevenueForPlan(plan), 0)

  const chartData = plans.map(plan => ({
    name: plan.name,
    subscribers: getSubscribersForPlan(plan.id),
    price: plan.price,
    duration: plan.duration_days,
    revenue: getRevenueForPlan(plan)
  })).sort((a, b) => b.subscribers - a.subscribers)

  const maxSubscribers = Math.max(...chartData.map(d => d.subscribers), 1)
  const growthRate = 12.5
  const projectedRevenue = monthlyRevenue * 1.125

  if (loading) {
    return (
      <div className="gf-theme">
        <ThemeStyles />
        <div className="loading">
          <div className="spinner"></div>
          <span>Loading plans...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="gf-theme plans-page">
      <ThemeStyles />
      <style>{`
        .plans-page .page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }
        .plans-page .stats-grid-3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin-bottom: 20px;
        }
        .plans-page .main-grid {
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 16px;
        }
        .plans-page .plans-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          align-content: start;
        }
        .plans-page .sidebar-col {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .plans-page .table-wrap {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        .plans-page .mobile-plan-list {
          display: none;
        }
        .plans-page .modal-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }

        @media (max-width: 900px) {
          .plans-page .main-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .plans-page .page-header {
            flex-direction: column;
            align-items: stretch;
          }
          .plans-page .page-header > button {
            width: 100%;
            justify-content: center;
          }
          .plans-page .page-title {
            font-size: 20px;
          }
          .plans-page .stats-grid-3 {
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            margin-bottom: 16px;
          }
          .plans-page .stats-grid-3 .card {
            padding: 10px !important;
          }
          .plans-page .stats-grid-3 .stat-value {
            font-size: 15px;
          }
          .plans-page .stats-grid-3 .stat-label {
            font-size: 10px;
          }
          .plans-page .stats-grid-3 .stat-sub {
            display: none;
          }

          .plans-page .plans-grid {
            grid-template-columns: 1fr;
          }
          .plans-page .table-wrap {
            display: none;
          }
          .plans-page .mobile-plan-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          .plans-page .mobile-plan-card {
            border: 1px solid ${COLORS.line};
            border-radius: 12px;
            padding: 14px;
          }
          .plans-page .mobile-plan-card .top-line {
            display: flex;
            align-items: baseline;
            justify-content: space-between;
            gap: 8px;
            margin-bottom: 8px;
          }
          .plans-page .mobile-plan-card .meta-row {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 6px 12px;
            font-size: 12px;
            color: ${COLORS.text3};
          }
          .plans-page .mobile-plan-card .meta-row span {
            display: flex;
            align-items: center;
            gap: 5px;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .plans-page .modal-stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
      <div className="page-header">
        <div>
          <p style={{ fontSize: '11px', color: COLORS.ember, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, marginBottom: '6px' }}>
            Management
          </p>
          <h1 className="page-title">Membership Plans</h1>
          <p className="page-subtitle">Manage and track subscription plans</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn btn-primary">
          <Plus size={18} />
          Add Plan
        </button>
      </div>

      {/* TOP ROW: 3 Stats Cards */}
      <div className="stats-grid-3">
        <div className="card" style={{ padding: '18px' }}>
          <div className="flex items-center justify-between mb-2">
            <Package size={20} color={COLORS.ember} />
          </div>
          <div className="stat-value">{plans.length}</div>
          <div className="stat-label">Total Plans</div>
          <div className="stat-sub">active plans</div>
        </div>
        <div className="card" style={{ padding: '18px' }}>
          <div className="flex items-center justify-between mb-2">
            <Users size={20} color={COLORS.mint} />
          </div>
          <div className="stat-value">{totalSubscribers}</div>
          <div className="stat-label">Total Subscribers</div>
          <div className="stat-sub">active members</div>
        </div>
        <div className="card" style={{ padding: '18px' }}>
          <div className="flex items-center justify-between mb-2">
            <DollarSign size={20} color={COLORS.blue} />
          </div>
          <div className="stat-value">{monthlyRevenue.toLocaleString()} DZD</div>
          <div className="stat-label">Monthly Revenue</div>
          <div className="stat-sub">from all plans</div>
        </div>
      </div>

      {/* MAIN CONTENT: 2 Columns */}
      <div className="main-grid">

        {/* LEFT: Plans Grid - 2 columns */}
        <div className="plans-grid">
          {plans.map((plan) => {
            const subscribers = getSubscribersForPlan(plan.id)
            const isPopular = subscribers === Math.max(...plans.map(p => getSubscribersForPlan(p.id)), 0) && plans.length > 0
            const pricePerDay = (plan.price / plan.duration_days).toFixed(0)

            return (
              <div
                key={plan.id}
                className="card"
                style={{
                  padding: '20px',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  border: isPopular ? `2px solid ${COLORS.ember}` : `1px solid ${COLORS.line}`,
                  position: 'relative',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  minHeight: '260px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.45)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
                onClick={() => {
                  setSelectedPlan(plan)
                  setShowDetailsModal(true)
                }}
              >
                {isPopular && (
                  <div style={{
                    position: 'absolute',
                    top: '-10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: COLORS.ember,
                    color: COLORS.ink,
                    fontSize: '10px',
                    fontWeight: '700',
                    padding: '3px 12px',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    zIndex: 10,
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                  }}>
                    <Zap size={10} />
                    Most Popular
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px', color: COLORS.text }}>{plan.name}</h3>
                    <p style={{ fontSize: '12px', color: COLORS.text3 }}>
                      {plan.duration_days} days • {pricePerDay} DZD/day
                    </p>
                  </div>
                  <div className="flex gap-2" style={{ flexShrink: 0, marginLeft: '8px' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleOpenModal(plan) }}
                      className="btn btn-sm btn-ghost"
                      style={{ width: 28, height: 28, padding: 0, minWidth: 28 }}
                      title="Edit"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(plan.id, plan.name) }}
                      className="btn btn-sm btn-danger"
                      style={{ width: 28, height: 28, padding: 0, minWidth: 28 }}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: '6px' }}>
                  <span style={{ fontSize: '28px', fontWeight: '800', color: COLORS.ember }}>
                    {plan.price.toLocaleString()}
                  </span>
                  <span style={{ fontSize: '14px', color: COLORS.text2 }}> DZD</span>
                </div>

                <div className="flex items-center gap-2" style={{ marginBottom: '8px' }}>
                  <Users size={14} color={COLORS.text3} />
                  <span style={{ fontSize: '13px', color: COLORS.text2 }}>
                    {subscribers} active subscribers
                  </span>
                </div>

                {plan.description && (
                  <p style={{
                    fontSize: '12px',
                    color: COLORS.text3,
                    lineHeight: '1.4',
                    marginBottom: '10px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    minHeight: '34px',
                  }}>
                    {plan.description}
                  </p>
                )}
                {!plan.description && (
                  <div style={{ minHeight: '34px' }} />
                )}

                <div style={{ marginTop: 'auto', paddingTop: '6px' }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedPlan(plan); setShowDetailsModal(true) }}
                    className="btn btn-sm"
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: `1px solid ${COLORS.ember}`,
                      color: COLORS.ember,
                      padding: '8px 0',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = COLORS.ember
                      e.currentTarget.style.color = COLORS.ink
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = COLORS.ember
                    }}
                  >
                    View Details
                  </button>
                </div>
              </div>
            )
          })}

          {plans.length === 0 && (
            <div className="card" style={{ padding: '40px', textAlign: 'center', gridColumn: '1 / -1' }}>
              <Package size={48} color={COLORS.text3} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <p style={{ fontSize: '14px', color: COLORS.text2, fontWeight: 600 }}>No plans created yet</p>
              <p style={{ fontSize: '12px', color: COLORS.text3, marginTop: '4px' }}>Create your first membership plan</p>
              <button onClick={() => handleOpenModal()} className="btn btn-primary" style={{ marginTop: '16px' }}>
                <Plus size={14} /> Add Plan
              </button>
            </div>
          )}
        </div>

        {/* RIGHT: Subscribers per Plan Chart + Insights */}
        <div className="sidebar-col">

          {/* Chart Card - Reduced height */}
          <div className="card" style={{ padding: '16px 20px' }}>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
              <BarChart3 size={16} color={COLORS.ember} />
              <h3 className="text-sm font-semibold">Subscribers per Plan</h3>
            </div>
            <div className="space-y-3">
              {chartData.map((item, idx) => {
                const percentage = (item.subscribers / maxSubscribers) * 100
                return (
                  <div key={idx}>
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-xs font-medium">{item.name}</span>
                      <span className="text-xs font-semibold" style={{ color: COLORS.ember }}>{item.subscribers}</span>
                    </div>
                    <div className="w-full h-5 bg-surface-2 rounded-lg overflow-hidden">
                      <div
                        className="h-full rounded-lg flex items-center justify-end px-2 text-xs font-medium"
                        style={{
                          width: `${percentage}%`,
                          background: `linear-gradient(90deg, ${COLORS.ember}, #ff8c42)`,
                          minWidth: '30px',
                          color: COLORS.ink,
                          paddingRight: '6px',
                        }}
                      >
                        {percentage > 15 && `${Math.round(percentage)}%`}
                      </div>
                    </div>
                    <div className="flex justify-between mt-0.5">
                      <span className="text-xs text-muted">{item.price.toLocaleString()} DZD</span>
                      <span className="text-xs text-muted">{item.duration} days</span>
                    </div>
                  </div>
                )
              })}
              {chartData.length === 0 && (
                <div className="text-center py-4 text-muted">
                  <p>No plans available</p>
                </div>
              )}
            </div>
          </div>

          {/* Revenue Insights Card */}
          <div className="card" style={{ padding: '16px 20px' }}>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
              <TrendingUp size={16} color={COLORS.mint} />
              <h3 className="text-sm font-semibold">Revenue Insights</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted">Avg Revenue/Subscriber</span>
                <span className="text-sm font-semibold">
                  {totalSubscribers > 0 ? Math.round(monthlyRevenue / totalSubscribers).toLocaleString() : 0} DZD
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted">Most Popular Plan</span>
                <span className="text-sm font-semibold" style={{ color: COLORS.ember }}>
                  {mostPopular.name !== 'None' ? mostPopular.name : '-'}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-border">
                <span className="text-xs text-muted">Projected Next Month</span>
                <div className="flex items-center gap-1">
                  <ArrowUpRight size={14} color={COLORS.mint} />
                  <span className="text-sm font-semibold text-green-500">{projectedRevenue.toLocaleString()} DZD</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted">Growth Rate</span>
                <span className="text-sm font-semibold text-green-500">+{growthRate}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Plan Comparison Table */}
      <div className="card" style={{ marginTop: '16px', padding: '20px' }}>
        <h3 className="text-lg font-semibold mb-4">Plan Comparison</h3>
        <div className="table-wrap">
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Plan</th>
                <th>Price</th>
                <th>Duration</th>
                <th>Daily Cost</th>
                <th>Subscribers</th>
                <th>Monthly Revenue</th>
              </tr>
            </thead>
            <tbody>
              {plans.map(plan => {
                const subscribers = getSubscribersForPlan(plan.id)
                const revenue = subscribers * plan.price
                return (
                  <tr key={plan.id}>
                    <td className="font-medium">{plan.name}</td>
                    <td>{plan.price.toLocaleString()} DZD</td>
                    <td>{plan.duration_days} days</td>
                    <td>{(plan.price / plan.duration_days).toFixed(0)} DZD</td>
                    <td>{subscribers}</td>
                    <td>{revenue.toLocaleString()} DZD</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Plan Comparison (mobile) */}
        <div className="mobile-plan-list">
          {plans.map(plan => {
            const subscribers = getSubscribersForPlan(plan.id)
            const revenue = subscribers * plan.price
            return (
              <div className="mobile-plan-card" key={plan.id}>
                <div className="top-line">
                  <span style={{ fontWeight: 600 }}>{plan.name}</span>
                  <span style={{ fontWeight: 700, color: COLORS.ember }}>{revenue.toLocaleString()} DZD</span>
                </div>
                <div className="meta-row">
                  <span><DollarSign size={12} /> {plan.price.toLocaleString()} DZD</span>
                  <span><Zap size={12} /> {plan.duration_days} days</span>
                  <span><TrendingUp size={12} /> {(plan.price / plan.duration_days).toFixed(0)} DZD/day</span>
                  <span><Users size={12} /> {subscribers} subs</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Plan Details Modal */}
      {showDetailsModal && selectedPlan && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal" style={{ maxWidth: '600px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="modal-title">{selectedPlan.name}</h2>
              <button onClick={() => setShowDetailsModal(false)} className="modal-close">×</button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '32px', fontWeight: '800', color: COLORS.ember }}>
                  {selectedPlan.price.toLocaleString()}
                </span>
                <span style={{ fontSize: '16px', color: COLORS.text2 }}> DZD</span>
                <span style={{ fontSize: '14px', color: COLORS.text3, marginLeft: '8px' }}>
                  / {selectedPlan.duration_days} days
                </span>
              </div>

              {selectedPlan.description && (
                <p style={{ marginBottom: '16px', lineHeight: '1.5', color: COLORS.text2 }}>{selectedPlan.description}</p>
              )}

              <div className="modal-stats-grid">
                <div className="stat-card" style={{ padding: '12px', textAlign: 'center' }}>
                  <Users size={18} color={COLORS.mint} className="mx-auto mb-1" />
                  <div className="stat-value" style={{ fontSize: '20px' }}>{getSubscribersForPlan(selectedPlan.id)}</div>
                  <div className="stat-label">Subscribers</div>
                </div>
                <div className="stat-card" style={{ padding: '12px', textAlign: 'center' }}>
                  <DollarSign size={18} color={COLORS.ember} className="mx-auto mb-1" />
                  <div className="stat-value" style={{ fontSize: '20px' }}>{getRevenueForPlan(selectedPlan).toLocaleString()} DZD</div>
                  <div className="stat-label">Revenue</div>
                </div>
                <div className="stat-card" style={{ padding: '12px', textAlign: 'center' }}>
                  <TrendingUp size={18} color={COLORS.amber} className="mx-auto mb-1" />
                  <div className="stat-value" style={{ fontSize: '20px' }}>{(selectedPlan.price / selectedPlan.duration_days).toFixed(0)} DZD</div>
                  <div className="stat-label">Daily Cost</div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setShowDetailsModal(false); handleOpenModal(selectedPlan) }} className="btn btn-primary flex-1">
                Edit Plan
              </button>
              <button onClick={() => setShowDetailsModal(false)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Plan Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingPlan ? 'Edit Plan' : 'Add New Plan'}
        size="md"
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Plan Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="form-input"
              required
              placeholder="e.g., Monthly Premium"
            />
          </div>

          <div className="grid-2" style={{ gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Price (DZD) *</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="form-input"
                required
                placeholder="0"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Duration (days) *</label>
              <input
                type="number"
                name="duration_days"
                value={formData.duration_days}
                onChange={handleChange}
                className="form-input"
                required
                placeholder="30"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="form-input"
              rows="3"
              placeholder="What's included in this plan?"
            />
          </div>

          <div className="flex gap-3" style={{ marginTop: '24px' }}>
            <button type="submit" className="btn btn-primary">
              {editingPlan ? 'Update Plan' : 'Create Plan'}
            </button>
            <button type="button" onClick={handleCloseModal} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}