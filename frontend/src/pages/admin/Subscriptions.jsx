// frontend/src/pages/admin/Subscriptions.jsx

import { useEffect, useState, useRef } from 'react'
import api from "../../api/client"
import toast from 'react-hot-toast'
import {
  Calendar, Plus, AlertCircle, Users, DollarSign,
  Clock, CheckCircle, XCircle, Search, Download,
  Edit, Ban, RefreshCw, X, Save, Trash2, Calendar as CalendarIcon,
  AlertTriangle
} from 'lucide-react'
import { COLORS, ThemeStyles } from '../../theme/GymTheme'

const C = COLORS

/* ─── Export to Excel ───────────────────────────────────────── */
function exportToExcel(subscriptions) {
  if (!subscriptions || subscriptions.length === 0) {
    toast.error('No subscriptions to export')
    return
  }

  const headers = [
    'Subscription ID', 'Member Name', 'Member Email', 'Plan Name',
    'Price (DZD)', 'Duration (Days)', 'Start Date', 'End Date', 'Status', 'Days Left'
  ]

  let html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:x="urn:schemas-microsoft-com:office:excel"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="UTF-8">
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Subscriptions</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        table { border-collapse: collapse; font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; }
        th { background: #C56A2A; color: #ffffff; font-weight: 700; padding: 8px 12px; border: 1px solid #ddd; text-align: left; }
        td { padding: 6px 12px; border: 1px solid #ddd; }
        tr:nth-child(even) { background: #f9f9f9; }
        .status-active { color: #22c55e; font-weight: 600; }
        .status-expired { color: #ef4444; font-weight: 600; }
        .status-suspended { color: #f59e0b; font-weight: 600; }
        .expiring { color: #f59e0b; font-weight: 600; }
      </style>
    </head>
    <body>
      <h2>Subscriptions Export</h2>
      <p>Exported on: ${new Date().toLocaleString()}</p>
      <table>
        <thead>
          <tr>
            ${headers.map(h => `<th>${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
  `

  subscriptions.forEach(sub => {
    const statusClass = `status-${sub.status || 'active'}`
    const daysLeft = Math.ceil((new Date(sub.end_date) - new Date()) / 86400000)
    const isExpiring = daysLeft <= 7 && daysLeft > 0
    html += `
      <tr>
        <td>${sub.id}</td>
        <td>${sub.member?.user?.name || 'N/A'}</td>
        <td>${sub.member?.user?.email || 'N/A'}</td>
        <td>${sub.plan?.name || 'N/A'}</td>
        <td>${sub.plan?.price || 0}</td>
        <td>${sub.plan?.duration_days || 0}</td>
        <td>${sub.start_date || ''}</td>
        <td>${sub.end_date || ''}</td>
        <td class="${statusClass}">${(sub.status || 'active').toUpperCase()}</td>
        <td class="${isExpiring ? 'expiring' : ''}">${daysLeft > 0 ? daysLeft : 0}</td>
      </tr>
    `
  })

  html += `
        </tbody>
      </table>
      <p style="margin-top: 16px; color: #666; font-size: 11px;">
        Total Subscriptions: ${subscriptions.length}
      </p>
    </body>
    </html>
  `

  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `subscriptions_export_${new Date().toISOString().split('T')[0]}.xls`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  toast.success(`Exported ${subscriptions.length} subscriptions to Excel`)
}

/* ─── helpers ───────────────────────────────────────────────── */
function isExpiringSoon(endDate) {
  const daysLeft = Math.ceil((new Date(endDate) - new Date()) / 86400000)
  return { isExpiring: daysLeft <= 7 && daysLeft > 0, daysLeft }
}

function getStatusConfig(status) {
  return {
    active:    { cls: 'badge-green',  icon: <CheckCircle size={11} />, label: 'Active'    },
    expired:   { cls: 'badge-red',    icon: <XCircle size={11} />,     label: 'Expired'   },
    suspended: { cls: 'badge-amber',  icon: <Ban size={11} />,         label: 'Suspended' },
  }[status] || { cls: 'badge-amber', icon: null, label: status }
}

/* ─── stat card ─────────────────────────────────────────────── */
function StatCard({ icon: Icon, iconColor, label, value }) {
  return (
    <div
      className="card"
      style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 10,
               transition: 'border-color .2s, transform .2s', cursor: 'default' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = iconColor; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = C.line;    e.currentTarget.style.transform = 'translateY(0)'    }}
    >
      <div style={{ width: 34, height: 34, borderRadius: 9, background: `${iconColor}18`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={16} color={iconColor} />
      </div>
      <div>
        <p style={{ fontSize: 26, fontWeight: 800, color: C.text, lineHeight: 1, marginBottom: 4, letterSpacing: '-0.02em' }}>{value}</p>
        <p style={{ fontSize: 11.5, color: C.text2, fontWeight: 600 }}>{label}</p>
      </div>
    </div>
  )
}

/* ─── avatar initial ────────────────────────────────────────── */
function Avatar({ name }) {
  return (
    <div style={{
      width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
      background: `${C.ember}18`, border: `1px solid ${C.ember}30`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 13, fontWeight: 700, color: C.ember
    }}>
      {(name || '?').charAt(0).toUpperCase()}
    </div>
  )
}

/* ─── Action Button Component ───────────────────────────────── */
function ActionButton({ icon: Icon, label, onClick, color, disabled, loading }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 14px',
        fontSize: '12px',
        fontWeight: 600,
        borderRadius: 6,
        border: `1px solid ${color}40`,
        background: `${color}15`,
        color: color,
        cursor: (disabled || loading) ? 'not-allowed' : 'pointer',
        opacity: (disabled || loading) ? 0.5 : 1,
        transition: 'all 0.2s ease',
        fontFamily: 'inherit'
      }}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.background = color
          e.currentTarget.style.color = '#fff'
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.background = `${color}15`
          e.currentTarget.style.color = color
        }
      }}
    >
      {loading ? (
        <div className="spinner" style={{ width: 14, height: 14 }} />
      ) : (
        <Icon size={14} />
      )}
      {loading ? 'Processing...' : label}
    </button>
  )
}

/* ─── Delete Confirmation Modal ─────────────────────────────── */
function DeleteConfirmModal({ isOpen, onClose, onConfirm, memberName, isDeleting }) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={isDeleting ? undefined : onClose}>
      <div className="modal" style={{ width: '100%', maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <div
          style={{
            padding: '12px 8px 4px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'rgba(251, 113, 33, 0.10)',
              border: '1px solid rgba(251, 113, 33, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '22px',
            }}
          >
            <AlertTriangle size={30} color="#C56A2A" strokeWidth={2} />
          </div>

          <h3
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: C.text,
              margin: '0 0 10px',
            }}
          >
            Delete Subscription
          </h3>

          <p
            style={{
              fontSize: '14px',
              color: C.text3,
              lineHeight: 1.6,
              maxWidth: '320px',
              margin: '0 auto 28px',
            }}
          >
            Are you sure you want to delete the subscription for{' '}
            <span style={{ color: C.text, fontWeight: 600 }}>{memberName}</span>?
            This action cannot be undone.
          </p>

          <div
            style={{
              width: '100%',
              borderTop: `1px solid ${C.line}`,
              paddingTop: '20px',
              display: 'flex',
              justifyContent: 'center',
              gap: '12px',
            }}
          >
            <button
              onClick={onClose}
              className="btn btn-ghost"
              style={{ flex: '0 1 140px', fontWeight: 500 }}
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="btn"
              style={{
                flex: '0 1 140px',
                justifyContent: 'center',
                background: '#C56A2A',
                color: '#fff',
                border: 'none',
                fontWeight: 600,
                boxShadow: '0 2px 10px rgba(251, 113, 33, 0.35)',
                transition: 'background 0.15s, box-shadow 0.15s',
                cursor: isDeleting ? 'default' : 'pointer',
                opacity: isDeleting ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
              disabled={isDeleting}
              onMouseEnter={e => {
                if (!isDeleting) {
                  e.currentTarget.style.background = '#e5620f'
                  e.currentTarget.style.boxShadow = '0 2px 14px rgba(251, 113, 33, 0.45)'
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#C56A2A'
                e.currentTarget.style.boxShadow = '0 2px 10px rgba(251, 113, 33, 0.35)'
              }}
            >
              {isDeleting ? (
                <>
                  <div className="spinner" style={{ width: 16, height: 16 }} />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Renew Confirmation Modal with Scrollable Plans ───────── */
function RenewConfirmModal({ isOpen, onClose, onConfirm, subscription, plans, isRenewing }) {
  const [selectedPlanId, setSelectedPlanId] = useState(null)
  
  useEffect(() => {
    if (subscription && plans.length > 0) {
      setSelectedPlanId(subscription.plan_id)
    }
  }, [subscription, plans])

  if (!isOpen || !subscription) return null

  const daysLeft = Math.ceil((new Date(subscription.end_date) - new Date()) / 86400000)
  const selectedPlan = plans.find(p => p.id === selectedPlanId)
  
  const newEndDate = new Date(subscription.end_date)
  newEndDate.setDate(newEndDate.getDate() + (selectedPlan?.duration_days || 30))
  const newDaysLeft = Math.ceil((newEndDate - new Date()) / 86400000)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: '100%', maxWidth: 480, maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          borderBottom: `1px solid ${C.line}`,
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9,
              background: `${C.ember}18`,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <RefreshCw size={16} color={C.ember} />
            </div>
            <div>
              <h2 className="modal-title" style={{ fontSize: 16, margin: 0, color: C.text }}>Renew Subscription</h2>
              <p style={{ fontSize: 11, color: C.text3, margin: '2px 0 0' }}>Select a plan for renewal</p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close">×</button>
        </div>

        <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
          {/* Member Info */}
          <div style={{
            background: `${C.ember}10`,
            borderRadius: 8,
            padding: '14px',
            marginBottom: 14,
            border: `1px solid ${C.ember}25`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <Avatar name={subscription.member?.user?.name} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: 0 }}>
                  {subscription.member?.user?.name}
                </p>
                <p style={{ fontSize: 11, color: C.text3, margin: '2px 0 0' }}>
                  {subscription.member?.user?.email}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: `1px solid ${C.ember}20` }}>
              <div>
                <p style={{ fontSize: 9, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Current Plan
                </p>
                <p style={{ fontSize: 12, fontWeight: 600, color: C.text }}>
                  {subscription.plan?.name || 'N/A'}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 9, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Days Left
                </p>
                <p style={{ fontSize: 12, fontWeight: 600, color: daysLeft <= 7 ? C.red : C.text }}>
                  {daysLeft > 0 ? `${daysLeft} days` : 'Expired'}
                </p>
              </div>
            </div>
          </div>

          {/* Plan Selection - Scrollable */}
          <div>
            <label style={{
              fontSize: 11,
              fontWeight: 600,
              color: C.text2,
              display: 'block',
              marginBottom: 8,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Select Renewal Plan
            </label>
            
            <div style={{
              maxHeight: '200px',
              overflowY: 'auto',
              paddingRight: '4px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6
            }}>
              {plans.map((plan) => {
                const isSelected = selectedPlanId === plan.id
                const isCurrent = plan.id === subscription.plan_id
                const monthlyPrice = plan.price / (plan.duration_days / 30)
                
                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: `2px solid ${isSelected ? C.ember : C.line}`,
                      background: isSelected ? `${C.ember}10` : 'var(--surface-2)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      flexShrink: 0
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = C.ember
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = C.line
                      }
                    }}
                  >
                    <div style={{
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      border: `2px solid ${isSelected ? C.ember : C.line}`,
                      background: isSelected ? C.ember : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {isSelected && (
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff' }} />
                      )}
                    </div>
                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: 0 }}>
                          {plan.name}
                        </p>
                        {isCurrent && (
                          <span style={{
                            fontSize: 8,
                            padding: '1px 6px',
                            borderRadius: 99,
                            background: `${C.ember}20`,
                            color: C.ember,
                            fontWeight: 600
                          }}>
                            Current
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 10, color: C.text3, margin: '2px 0 0' }}>
                        {plan.duration_days} days · {plan.price.toLocaleString()} DZD
                        <span style={{ color: C.text3, fontSize: 9 }}>
                          {' '}(~{Math.round(monthlyPrice).toLocaleString()} DZD/mo)
                        </span>
                      </p>
                    </div>
                    
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: C.ember, margin: 0 }}>
                        {plan.price.toLocaleString()} DZD
                      </p>
                      <p style={{ fontSize: 9, color: C.text3, margin: '2px 0 0' }}>
                        {plan.duration_days}d
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* New End Date Preview */}
          {selectedPlan && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              background: `${C.green}10`,
              borderRadius: 8,
              border: `1px solid ${C.green}25`,
              marginTop: 12
            }}>
              <CalendarIcon size={15} color="#22c55e" />
              <div>
                <p style={{ fontSize: 11, color: C.text, margin: 0 }}>
                  New end date: <strong>{newEndDate.toLocaleDateString()}</strong>
                </p>
                <p style={{ fontSize: 10, color: C.text3, margin: '2px 0 0' }}>
                  {newDaysLeft > 0 ? `${newDaysLeft} days of access` : 'Will be extended'}
                </p>
              </div>
            </div>
          )}

          {/* Price Comparison */}
          {selectedPlan && selectedPlan.id !== subscription.plan_id && (
            <div style={{
              marginTop: 10,
              padding: '6px 12px',
              background: `${C.amber}10`,
              borderRadius: 6,
              border: `1px solid ${C.amber}20`,
              textAlign: 'center'
            }}>
              <p style={{ fontSize: 10, color: C.text3, margin: 0 }}>
                Changing from <strong>{subscription.plan?.name}</strong> to <strong style={{ color: C.ember }}>{selectedPlan.name}</strong>
                {selectedPlan.price > (subscription.plan?.price || 0) 
                  ? ` (+${(selectedPlan.price - (subscription.plan?.price || 0)).toLocaleString()} DZD)` 
                  : selectedPlan.price < (subscription.plan?.price || 0)
                  ? ` (${((subscription.plan?.price || 0) - selectedPlan.price).toLocaleString()} DZD saved)`
                  : ''}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons - Fixed at bottom */}
        <div style={{
          padding: '12px 20px',
          borderTop: `1px solid ${C.line}`,
          display: 'flex',
          gap: 10,
          flexShrink: 0,
          background: 'var(--surface)'
        }}>
          <button
            onClick={() => onConfirm(selectedPlanId)}
            className="btn"
            disabled={!selectedPlanId || isRenewing}
            style={{
              flex: 1,
              justifyContent: 'center',
              background: C.ember,
              color: '#fff',
              padding: '10px 20px',
              borderRadius: 8,
              border: 'none',
              fontSize: 13,
              fontWeight: 600,
              cursor: (!selectedPlanId || isRenewing) ? 'default' : 'pointer',
              opacity: (!selectedPlanId || isRenewing) ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            {isRenewing ? (
              <>
                <div className="spinner" style={{ width: 16, height: 16 }} />
                Renewing...
              </>
            ) : (
              <>
                <RefreshCw size={14} />
                Confirm Renewal
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="btn btn-ghost"
            style={{
              flex: 1,
              justifyContent: 'center',
              padding: '10px 20px',
              borderRadius: 8,
              border: `1px solid ${C.line}`,
              background: 'transparent',
              color: C.text2,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Create Subscription Modal ─────────────────────────────── */
function CreateSubscriptionModal({ members, plans, formData, setFormData, onSubmit, onClose }) {
  const [memberSearch, setMemberSearch] = useState('')
  const [memberOpen, setMemberOpen]     = useState(false)
  const memberRef = useRef(null)

  useEffect(() => {
    const handleClick = (e) => {
      if (memberRef.current && !memberRef.current.contains(e.target)) setMemberOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const selectedMember = members.find(m => String(m.id) === String(formData.member_id))
  const filteredMembers = members.filter(m =>
    m.user.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.user.email.toLowerCase().includes(memberSearch.toLowerCase())
  )

  const label = (txt) => (
    <p style={{ fontSize: 11, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 8px' }}>{txt}</p>
  )

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        style={{ width: '100%', maxWidth: 580, padding: 0, borderRadius: 16, display: 'flex', flexDirection: 'column', maxHeight: '92vh', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ══ Header ══ */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: `1px solid ${C.line}`, background: C.surface2, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: `linear-gradient(135deg, ${C.ember}, #ff9a56)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 3px 10px ${C.ember}50` }}>
              <Calendar size={18} color="#fff" />
            </div>
            <div>
              <p style={{ fontSize: 17, fontWeight: 800, color: C.text, margin: 0, letterSpacing: '-0.02em' }}>New Subscription</p>
              <p style={{ fontSize: 12, color: C.text3, margin: '2px 0 0' }}>Choose a member and assign a plan</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', border: `1px solid ${C.line}`, background: 'transparent', color: C.text3, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>×</button>
        </div>

        {/* ══ Scrollable body ══ */}
        <div style={{ overflowY: memberOpen ? 'hidden' : 'auto', flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: 22 }}>

          {/* ── Member picker — inline expand, no floating dropdown ── */}
          <div ref={memberRef}>
            {label('Member *')}

            {/* Trigger row */}
            <div
              onClick={() => { setMemberOpen(o => !o); setTimeout(() => document.getElementById('member-search-input')?.focus(), 50) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
                borderRadius: memberOpen ? '10px 10px 0 0' : 10, cursor: 'pointer',
                border: `1.5px solid ${memberOpen ? C.ember : C.line}`,
                borderBottom: memberOpen ? `1px solid ${C.line}` : `1.5px solid ${memberOpen ? C.ember : C.line}`,
                background: C.surface2, transition: 'all 0.15s', minHeight: 48,
              }}
            >
              {selectedMember ? (
                <>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${C.ember}20`, border: `1px solid ${C.ember}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: C.ember, flexShrink: 0 }}>
                    {selectedMember.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: 0 }}>{selectedMember.user.name}</p>
                    <p style={{ fontSize: 12, color: C.text3, margin: '1px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedMember.user.email}</p>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#22c55e', background: '#22c55e15', border: '1px solid #22c55e30', borderRadius: 5, padding: '2px 8px', textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0 }}>Selected</span>
                  <button type="button" onClick={e => { e.stopPropagation(); setFormData(f => ({ ...f, member_id: '' })); setMemberOpen(false) }}
                    style={{ background: 'none', border: 'none', color: C.text3, cursor: 'pointer', padding: 4, display: 'flex', flexShrink: 0 }}
                  ><X size={14} /></button>
                </>
              ) : (
                <>
                  <Users size={15} color={C.text3} style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: C.text3, flex: 1 }}>Search and select a member…</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={memberOpen ? C.ember : C.text3} strokeWidth="2" style={{ transition: 'transform 0.2s', transform: memberOpen ? 'rotate(180deg)' : 'none', flexShrink: 0 }}><polyline points="6 9 12 15 18 9"/></svg>
                </>
              )}
            </div>

            {/* Inline expanded panel — no floating, no z-index hell */}
            {memberOpen && (
              <div style={{ border: `1.5px solid ${C.ember}`, borderTop: 'none', borderRadius: '0 0 10px 10px', background: C.surface, overflow: 'hidden' }}>
                {/* Search */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: `1px solid ${C.line}`, background: C.surface2 }}>
                  <Search size={13} color={C.text3} style={{ flexShrink: 0 }} />
                  <input
                    id="member-search-input"
                    type="text"
                    placeholder="Search by name or email…"
                    value={memberSearch}
                    onChange={e => setMemberSearch(e.target.value)}
                    style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: C.text, fontSize: 13 }}
                  />
                  {memberSearch && <button type="button" onClick={() => setMemberSearch('')} style={{ background: 'none', border: 'none', color: C.text3, cursor: 'pointer', display: 'flex', padding: 0 }}><X size={13} /></button>}
                </div>
                {/* List — fixed height, scrollable */}
                <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                  {filteredMembers.length === 0 ? (
                    <p style={{ textAlign: 'center', color: C.text3, fontSize: 13, padding: '20px 0', margin: 0 }}>No members found</p>
                  ) : filteredMembers.map(m => {
                    const isSel = String(m.id) === String(formData.member_id)
                    return (
                      <div key={m.id}
                        onClick={() => { setFormData(f => ({ ...f, member_id: String(m.id) })); setMemberOpen(false); setMemberSearch('') }}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer', background: isSel ? `${C.ember}10` : 'transparent', borderBottom: `1px solid ${C.line}`, transition: 'background 0.1s' }}
                        onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = C.surface2 }}
                        onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent' }}
                      >
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: isSel ? `${C.ember}20` : C.surface3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: isSel ? C.ember : C.text3, flexShrink: 0 }}>
                          {m.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: isSel ? C.ember : C.text, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.user.name}</p>
                          <p style={{ fontSize: 11, color: C.text3, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.user.email}</p>
                        </div>
                        {isSel && <CheckCircle size={14} color={C.ember} style={{ flexShrink: 0 }} />}
                      </div>
                    )
                  })}
                </div>
                <div style={{ padding: '7px 14px', background: C.surface2, fontSize: 11, color: C.text3 }}>
                  {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''} available
                </div>
              </div>
            )}
            <input type="text" required value={formData.member_id} onChange={() => {}} style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', height: 0 }} />
          </div>

          {/* ── Plan picker — simple rows, always visible ── */}
          <div>
            {label('Select Plan *')}
            {plans.length === 0 ? (
              <p style={{ fontSize: 13, color: C.text3, padding: '12px 0' }}>No plans available</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {plans.map(p => {
                  const isSel = String(p.id) === String(formData.plan_id)
                  return (
                    <div
                      key={p.id}
                      onClick={() => setFormData(f => ({ ...f, plan_id: String(p.id) }))}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                        borderRadius: 10, cursor: 'pointer',
                        border: `1.5px solid ${isSel ? C.ember : C.line}`,
                        background: isSel ? `${C.ember}0C` : C.surface2,
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { if (!isSel) { e.currentTarget.style.borderColor = `${C.ember}50`; e.currentTarget.style.background = C.surface } }}
                      onMouseLeave={e => { if (!isSel) { e.currentTarget.style.borderColor = C.line; e.currentTarget.style.background = C.surface2 } }}
                    >
                      <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${isSel ? C.ember : C.line}`, background: isSel ? C.ember : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                        {isSel && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: isSel ? C.ember : C.text, margin: 0 }}>{p.name}</p>
                        <p style={{ fontSize: 12, color: C.text3, margin: '2px 0 0' }}>{p.duration_days} days</p>
                      </div>
                      <p style={{ fontSize: 16, fontWeight: 800, color: isSel ? C.ember : C.text, margin: 0, letterSpacing: '-0.02em' }}>
                        {(p.price || 0).toLocaleString()} <span style={{ fontSize: 11, fontWeight: 600, color: C.text3 }}>DZD</span>
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
            <input type="text" required value={formData.plan_id} onChange={() => {}} style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', height: 0 }} />
          </div>

          {/* ── Start Date ── */}
          <div>
            {label('Start Date *')}
            <input
              type="date"
              value={formData.start_date}
              onChange={e => setFormData(f => ({ ...f, start_date: e.target.value }))}
              required
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 10, fontSize: 14, fontWeight: 500,
                border: `1.5px solid ${C.line}`, background: C.surface2, color: C.text,
                outline: 'none', boxSizing: 'border-box', cursor: 'pointer', transition: 'all 0.2s',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = C.ember; e.currentTarget.style.boxShadow = `0 0 0 3px ${C.ember}18` }}
              onBlur={e => { e.currentTarget.style.borderColor = C.line; e.currentTarget.style.boxShadow = 'none' }}
            />
          </div>

        </div>{/* end scrollable body */}

        {/* ══ Footer ══ */}
        <div style={{ padding: '16px 24px', borderTop: `1px solid ${C.line}`, background: C.surface2, flexShrink: 0, display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={onSubmit}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg, ${C.ember}, #ff9a56)`, color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', boxShadow: `0 3px 12px ${C.ember}45`, letterSpacing: '-0.01em' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <Plus size={15} /> Create Subscription
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: '13px 22px', borderRadius: 10, border: `1.5px solid ${C.line}`, background: 'transparent', color: C.text2, fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.ember; e.currentTarget.style.color = C.ember }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.line; e.currentTarget.style.color = C.text2 }}
          >Cancel</button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState([])
  const [members, setMembers]             = useState([])
  const [plans, setPlans]                 = useState([])
  const [loading, setLoading]             = useState(true)
  const [showModal, setShowModal]         = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showRenewModal, setShowRenewModal] = useState(false)
  const [editingSubscription, setEditingSubscription] = useState(null)
  const [deletingSubscription, setDeletingSubscription] = useState(null)
  const [renewingSubscription, setRenewingSubscription] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [search, setSearch]               = useState('')
  const [statusFilter, setStatusFilter]   = useState('all')
  const [page, setPage] = useState(1)
  const PER_PAGE = 10
  const [formData, setFormData]           = useState({
    member_id: '', plan_id: '',
    start_date: new Date().toISOString().split('T')[0],
  })
  const [editFormData, setEditFormData]   = useState({
    status: 'active'
  })
  const [renewingId, setRenewingId]       = useState(null)
  const [updating, setUpdating]           = useState(false)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const [subsRes, membersRes, plansRes] = await Promise.all([
        api.get('/subscriptions'),
        api.get('/members'),
        api.get('/plans'),
      ])
      setSubscriptions(subsRes.data)
      setMembers(membersRes.data)
      setPlans(plansRes.data)
    } catch { toast.error('Failed to fetch data') }
    finally  { setLoading(false) }
  }

  const handleSubmit = async (e) => {
    e?.preventDefault()
    if (!formData.member_id || !formData.plan_id || !formData.start_date) {
      toast.error('Please fill in all required fields')
      return
    }
    try {
      await api.post('/subscriptions', {
        ...formData,
        member_id: parseInt(formData.member_id),
        plan_id:   parseInt(formData.plan_id),
      })
      toast.success('Subscription created')
      setShowModal(false)
      setFormData({ member_id: '', plan_id: '', start_date: new Date().toISOString().split('T')[0] })
      fetchData()
    } catch { toast.error('Failed to create subscription') }
  }

  const handleExport = () => {
    const dataToExport = filtered.length > 0 ? filtered : subscriptions
    exportToExcel(dataToExport)
  }

  const handleRenewClick = (sub) => {
    setRenewingSubscription(sub)
    setShowRenewModal(true)
  }

  const handleRenewConfirm = async (selectedPlanId) => {
    if (!renewingSubscription) return
    
    setRenewingId(renewingSubscription.id)
    try {
      const response = await api.post(`/subscriptions/${renewingSubscription.id}/renew`, {
        plan_id: selectedPlanId
      })
      toast.success(response.data?.message || 'Subscription renewed successfully!')
      setShowRenewModal(false)
      setRenewingSubscription(null)
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to renew subscription')
    } finally {
      setRenewingId(null)
    }
  }

  const handleEditClick = (sub) => {
    setEditingSubscription(sub)
    setEditFormData({
      status: sub.status || 'active'
    })
    setShowEditModal(true)
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!editingSubscription) return
    
    setUpdating(true)
    try {
      await api.put(`/subscriptions/${editingSubscription.id}`, {
        status: editFormData.status
      })
      toast.success('Subscription updated successfully!')
      setShowEditModal(false)
      setEditingSubscription(null)
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update subscription')
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteClick = (sub) => {
    setDeletingSubscription(sub)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingSubscription) return
    
    setIsDeleting(true)
    try {
      await api.delete(`/subscriptions/${deletingSubscription.id}`)
      toast.success(`Subscription deleted for ${deletingSubscription.member?.user?.name}`)
      setShowDeleteModal(false)
      setDeletingSubscription(null)
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete subscription')
    } finally {
      setIsDeleting(false)
    }
  }

  /* ── derived ── */
  const activeCount      = subscriptions.filter(s => s.status === 'active').length
  const expiredCount     = subscriptions.filter(s => s.status === 'expired').length
  const expiringSoonCount = subscriptions.filter(s => isExpiringSoon(s.end_date).isExpiring).length
  const monthlyRecurring = subscriptions.filter(s => s.status === 'active').reduce((sum, s) => sum + (s.plan?.price || 0), 0)

  const filtered = subscriptions.filter(sub => {
    const name = sub.member?.user?.name?.toLowerCase() || ''
    const plan = sub.plan?.name?.toLowerCase() || ''
    return (name.includes(search.toLowerCase()) || plan.includes(search.toLowerCase())) &&
           (statusFilter === 'all' || sub.status === statusFilter)
  })

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  if (loading) return (
    <div className="gf-theme"><ThemeStyles />
      <div className="loading"><div className="spinner" /><span>Loading subscriptions…</span></div>
    </div>
  )

  return (
    <div className="gf-theme">
      <ThemeStyles />

      {/* ── mobile-only responsive styles (web layout untouched) ── */}
      <style>{`
        .subs-mobile-list { display: none; }

        @media (max-width: 768px) {
        @media (max-width: 768px) {
          .subs-stat-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 10px !important;
          }
          .subs-stat-grid .card {
            padding: 14px 14px !important;
            gap: 8px !important;
          }
          .subs-stat-grid .card > div:first-child {
            width: 28px !important;
            height: 28px !important;
          }
          .subs-stat-grid p:first-of-type {
            font-size: 20px !important;
          }
          .subs-stat-grid p:last-of-type {
            font-size: 10.5px !important;
          }

          /* filter card: search bar full-width and bigger, controls wrap below */
          .subs-filter-bar {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 10px !important;
          }
          .subs-search-wrap {
            width: 100% !important;
            flex: none !important;
            min-width: 0 !important;
          }
          .subs-search-input {
            width: 100% !important;
            height: 48px !important;
            font-size: 15px !important;
            padding-left: 42px !important;
          }
          .subs-search-icon { width: 16px !important; height: 16px !important; }
          .subs-filter-controls {
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
            width: 100% !important;
          }
          .subs-status-select { flex: 1 !important; width: auto !important; }
          .subs-export-btn { flex-shrink: 0 !important; white-space: nowrap !important; }
          .subs-export-btn span.subs-export-label { display: none; }
          .subs-count { flex-shrink: 0; }

          /* table -> cards */
          .subs-table-wrap { display: none !important; }
          .subs-mobile-list { display: flex !important; flex-direction: column; gap: 14px; padding: 4px; }

          .subs-mcard {
            background: var(--surface-2, ${C.surface});
            border: 1px solid ${C.line};
            border-radius: 14px;
            padding: 16px;
          }
          .subs-mcard-top {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 10px;
            margin-bottom: 12px;
          }
          .subs-mcard-id {
            display: flex;
            align-items: center;
            gap: 10px;
            min-width: 0;
          }
          .subs-mcard-name { font-size: 15px; font-weight: 700; color: ${C.text}; margin: 0; }
          .subs-mcard-email {
            font-size: 12px; color: ${C.text3}; margin: 2px 0 0;
            overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          }
          .subs-mcard-plan { font-size: 12.5px; color: ${C.text3}; margin: 0 0 12px; }
          .subs-mcard-plan strong { color: ${C.text2}; font-weight: 600; }
          .subs-mcard-dates {
            display: flex;
            border: 1px solid ${C.line};
            border-radius: 10px;
            overflow: hidden;
            margin-bottom: 12px;
          }
          .subs-mcard-date-col {
            flex: 1;
            padding: 10px 12px;
            display: flex;
            align-items: center;
            gap: 8px;
            min-width: 0;
          }
          .subs-mcard-date-col + .subs-mcard-date-col { border-left: 1px solid ${C.line}; }
          .subs-mcard-date-label {
            font-size: 10.5px; color: ${C.text3}; font-weight: 600;
            text-transform: uppercase; letter-spacing: 0.04em; margin: 0 0 2px;
          }
          .subs-mcard-date-value { font-size: 13px; color: ${C.text}; font-weight: 600; margin: 0; }
          .subs-mcard-date-sub { font-size: 11px; color: ${C.text3}; margin: 1px 0 0; }
          .subs-mcard-actions { display: flex; gap: 8px; }
          .subs-mcard-actions button { flex: 1; justify-content: center; }
        }
      `}</style>

      {/* ── Renew Confirmation Modal ── */}
      <RenewConfirmModal
        isOpen={showRenewModal}
        onClose={() => {
          setShowRenewModal(false)
          setRenewingSubscription(null)
        }}
        onConfirm={handleRenewConfirm}
        subscription={renewingSubscription}
        plans={plans}
        isRenewing={renewingId !== null}
      />

      {/* ── Delete Confirmation Modal ── */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setDeletingSubscription(null)
        }}
        onConfirm={handleDeleteConfirm}
        memberName={deletingSubscription?.member?.user?.name || 'Unknown'}
        isDeleting={isDeleting}
      />

      {/* ── Edit Modal ── */}
      {showEditModal && editingSubscription && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" style={{ width: '100%', maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
              paddingBottom: 16,
              borderBottom: `1px solid ${C.line}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 9,
                  background: `${C.ember}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Edit size={16} color={C.ember} />
                </div>
                <div>
                  <h2 className="modal-title" style={{ fontSize: 16, margin: 0, color: C.text }}>
                    Edit Subscription
                  </h2>
                  <p style={{ fontSize: 11, color: C.text3, margin: '2px 0 0' }}>
                    {editingSubscription.member?.user?.name} · {editingSubscription.plan?.name}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowEditModal(false)} className="modal-close">×</button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="form-group mb-4">
                <label style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: C.text2,
                  display: 'block',
                  marginBottom: 6,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Status
                </label>
                
                <div style={{ position: 'relative' }}>
                  <select
                    value={editFormData.status}
                    onChange={e => setEditFormData({ ...editFormData, status: e.target.value })}
                    className="form-input"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      paddingRight: '40px',
                      borderRadius: 8,
                      border: `1px solid ${C.line}`,
                      background: 'var(--surface-2)',
                      color: C.text,
                      fontSize: 14,
                      outline: 'none',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                      cursor: 'pointer',
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = C.ember
                      e.currentTarget.style.boxShadow = `0 0 0 3px ${C.ember}25`
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = C.line
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="suspended">Suspended</option>
                  </select>
                  
                  <div style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    color: C.text3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </div>
                
                <p style={{
                  fontSize: 11,
                  color: C.text3,
                  marginTop: 6,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}>
                  <span>Current status: </span>
                  <span style={{
                    fontWeight: 600,
                    color: editFormData.status === 'active' ? '#22c55e' : 
                           editFormData.status === 'expired' ? '#ef4444' : '#f59e0b'
                  }}>
                    {editFormData.status.toUpperCase()}
                  </span>
                </p>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    padding: '12px 20px',
                    borderRadius: 8,
                    border: 'none',
                    background: C.ember,
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: updating ? 'default' : 'pointer',
                    opacity: updating ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!updating) e.currentTarget.style.opacity = '0.85'
                  }}
                  onMouseLeave={(e) => {
                    if (!updating) e.currentTarget.style.opacity = '1'
                  }}
                  disabled={updating}
                >
                  <Save size={16} />
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="btn btn-ghost"
                  style={{
                    padding: '12px 24px',
                    borderRadius: 8,
                    border: `1px solid ${C.line}`,
                    background: 'transparent',
                    color: C.text2,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = C.ember
                    e.currentTarget.style.color = C.ember
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = C.line
                    e.currentTarget.style.color = C.text2
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── page header ── */}
      <div className="page-header">
        <div>
          <p style={{ fontSize: 11, color: C.ember, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 6 }}>
            Management
          </p>
          <h1 className="page-title">Subscriptions</h1>
          <p className="page-subtitle">Manage member subscriptions and renewals</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus size={15} /> New Subscription
        </button>
      </div>

      {/* ── stat cards ── */}
      <div className="subs-stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 22 }}>
        <StatCard icon={Users}        iconColor={C.ember} label="Active Subscriptions" value={activeCount}                         />
        <StatCard icon={DollarSign}   iconColor={C.mint}  label="Monthly Recurring"    value={`${monthlyRecurring.toLocaleString()} DZD`} />
        <StatCard icon={AlertCircle}  iconColor={C.amber} label="Expiring Soon"        value={expiringSoonCount}                   />
        <StatCard icon={XCircle}      iconColor={C.red}   label="Expired"              value={expiredCount}                        />
      </div>

      {/* ── filter bar ── */}
      <div className="card" style={{ marginBottom: 18, padding: 16 }}>
        <div className="subs-filter-bar" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
<div className="subs-search-wrap" style={{ position: 'relative', flex: 1, minWidth: 180 }}>
  <Search className="subs-search-icon" size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: COLORS.text3, pointerEvents: 'none', zIndex: 2 }} />
  <input 
    type="text" 
    placeholder="Search by member name or email…" 
    value={search}
    onChange={e => { setSearch(e.target.value); setPage(1) }} 
    className="form-input subs-search-input" 
    style={{ paddingLeft: '38px' }}
  />
</div>
          <div className="subs-filter-controls">
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
              className="form-input subs-status-select" style={{ width: 140 }}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="suspended">Suspended</option>
            </select>
            <button className="btn btn-ghost btn-sm subs-export-btn" onClick={handleExport}>
              <Download size={14} /> <span className="subs-export-label">Export Excel</span>
            </button>
            <span className="subs-count" style={{ fontSize: 11, color: C.text3 }}>{filtered.length} / {subscriptions.length}</span>
          </div>
        </div>
      </div>

      {/* ── table ── */}
      <div className="card">
        <div className="table-wrap subs-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Plan</th>
                <th>Period</th>
                <th>Status</th>
                <th>End Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(sub => {
                const expiring = isExpiringSoon(sub.end_date)
                const status   = getStatusConfig(sub.status)
                const isRenewing = renewingId === sub.id
                return (
                  <tr key={sub.id} style={expiring.isExpiring ? { background: `${C.amber}08` } : {}}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar name={sub.member?.user?.name} />
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: 0 }}>
                            {sub.member?.user?.name || 'N/A'}
                          </p>
                          <p style={{ fontSize: 11, color: C.text3, margin: '2px 0 0' }}>
                            {sub.member?.user?.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: 0 }}>
                        {sub.plan?.name || 'N/A'}
                      </p>
                      <p style={{ fontSize: 11, color: C.text3, margin: '2px 0 0' }}>
                        {sub.plan?.price} DZD · {sub.plan?.duration_days}d
                      </p>
                    </td>
                    <td>
                      <p style={{ fontSize: 13, color: C.text, margin: 0 }}>{sub.start_date}</p>
                      <p style={{ fontSize: 11, color: C.text3, margin: '2px 0 0' }}>to {sub.end_date}</p>
                    </td>
                    <td>
                      <span className={`badge ${status.cls}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {status.icon} {status.label}
                      </span>
                      {expiring.isExpiring && (
                        <p style={{ fontSize: 11, color: C.amber, marginTop: 4, fontWeight: 600 }}>
                          {expiring.daysLeft}d left
                        </p>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Clock size={12} color={C.text3} />
                        <span style={{ fontSize: 13, color: C.text }}>{sub.end_date}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <ActionButton
                          icon={Edit}
                          label="Edit"
                          onClick={() => handleEditClick(sub)}
                          color={C.ember}
                        />
                        <ActionButton
                          icon={RefreshCw}
                          label="Renew"
                          onClick={() => handleRenewClick(sub)}
                          color="#22c55e"
                          disabled={sub.status !== 'active'}
                        />
                        <ActionButton
                          icon={Trash2}
                          label="Delete"
                          onClick={() => handleDeleteClick(sub)}
                          color={C.red}
                        />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* ── mobile cards (hidden on web, shown ≤768px) ── */}
        <div className="subs-mobile-list">
          {paginated.map(sub => {
            const expiring = isExpiringSoon(sub.end_date)
            const status   = getStatusConfig(sub.status)
            return (
              <div key={sub.id} className="subs-mcard">
                <div className="subs-mcard-top">
                  <div className="subs-mcard-id">
                    <Avatar name={sub.member?.user?.name} />
                    <div style={{ minWidth: 0 }}>
                      <p className="subs-mcard-name">{sub.member?.user?.name || 'N/A'}</p>
                      <p className="subs-mcard-email">{sub.member?.user?.email}</p>
                    </div>
                  </div>
                  <span className={`badge ${status.cls}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    {status.icon} {status.label}
                  </span>
                </div>

                <p className="subs-mcard-plan">
                  <strong>Plan:</strong> {sub.plan?.name || 'N/A'} · {sub.plan?.price || 0} DZD · {sub.plan?.duration_days || 0}d
                  {expiring.isExpiring && (
                    <span style={{ color: C.amber, fontWeight: 600 }}> · {expiring.daysLeft}d left</span>
                  )}
                </p>

                <div className="subs-mcard-dates">
                  <div className="subs-mcard-date-col">
                    <CalendarIcon size={15} color={C.text3} style={{ flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <p className="subs-mcard-date-label">Period</p>
                      <p className="subs-mcard-date-value">{sub.start_date}</p>
                      <p className="subs-mcard-date-sub">to {sub.end_date}</p>
                    </div>
                  </div>
                  <div className="subs-mcard-date-col">
                    <Clock size={15} color={C.text3} style={{ flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <p className="subs-mcard-date-label">End Date</p>
                      <p className="subs-mcard-date-value">{sub.end_date}</p>
                    </div>
                  </div>
                </div>

                <div className="subs-mcard-actions">
                  <ActionButton
                    icon={Edit}
                    label="Edit"
                    onClick={() => handleEditClick(sub)}
                    color={C.ember}
                  />
                  <ActionButton
                    icon={RefreshCw}
                    label="Renew"
                    onClick={() => handleRenewClick(sub)}
                    color="#22c55e"
                    disabled={sub.status !== 'active'}
                  />
                  <ActionButton
                    icon={Trash2}
                    label="Delete"
                    onClick={() => handleDeleteClick(sub)}
                    color={C.red}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div className="empty-state">
            <Calendar size={48} color={C.text3} style={{ margin: '0 auto 14px', display: 'block', opacity: 0.4 }} />
            <p style={{ color: C.text3, marginBottom: 14 }}>No subscriptions found</p>
            <button onClick={() => setShowModal(true)} className="btn btn-primary btn-sm">
              Create first subscription
            </button>
          </div>
        )}
      </div>

      {/* Pagination — outside the card */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', marginTop: '20px' }}>

          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              width: '36px', height: '36px', borderRadius: '8px',
              border: `1px solid ${C.line}`, background: C.surface,
              color: C.text, cursor: page === 1 ? 'not-allowed' : 'pointer',
              opacity: page === 1 ? 0.35 : 1, fontSize: '17px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => { if (page !== 1) e.currentTarget.style.borderColor = C.ember }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.line }}
          >‹</button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
            .reduce((acc, p, idx, arr) => {
              if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…')
              acc.push(p)
              return acc
            }, [])
            .map((item, idx) =>
              item === '…' ? (
                <span key={`el-${idx}`} style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: C.text3, letterSpacing: '1px' }}>···</span>
              ) : (
                <button
                  key={item}
                  onClick={() => setPage(item)}
                  style={{
                    width: '36px', height: '36px', borderRadius: '8px',
                    border: page === item ? 'none' : `1px solid ${C.line}`,
                    background: page === item ? C.ember : C.surface,
                    color: page === item ? '#fff' : C.text,
                    fontSize: '13px', fontWeight: page === item ? 700 : 500,
                    cursor: 'pointer', transition: 'all 0.15s',
                    boxShadow: page === item ? `0 2px 8px ${C.ember}55` : 'none',
                  }}
                  onMouseEnter={e => { if (page !== item) e.currentTarget.style.borderColor = C.ember }}
                  onMouseLeave={e => { if (page !== item) e.currentTarget.style.borderColor = C.line }}
                >{item}</button>
              )
            )}

          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              width: '36px', height: '36px', borderRadius: '8px',
              border: `1px solid ${C.line}`, background: C.surface,
              color: C.text, cursor: page === totalPages ? 'not-allowed' : 'pointer',
              opacity: page === totalPages ? 0.35 : 1, fontSize: '17px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => { if (page !== totalPages) e.currentTarget.style.borderColor = C.ember }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.line }}
          >›</button>

        </div>
      )}

      {/* ── Create Modal ── */}
      {showModal && (
        <CreateSubscriptionModal
          members={members}
          plans={plans}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}