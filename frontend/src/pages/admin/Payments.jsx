import { useEffect, useState, useRef } from 'react'
import api from '../../api/client'
import toast from 'react-hot-toast'
import {
  DollarSign, Plus, Eye, TrendingUp,
  CreditCard, Download, Search, CheckCircle, XCircle, Clock, Filter
} from 'lucide-react'
import { COLORS, ThemeStyles } from '../../theme/GymTheme'

const C = COLORS

/* ─── helpers ───────────────────────────────────────────────── */
function getStatusConfig(status) {
  return {
    paid:    { cls: 'badge-green', icon: <CheckCircle size={11} />, label: 'Paid'    },
    pending: { cls: 'badge-amber', icon: <Clock size={11} />,       label: 'Pending' },
    overdue: { cls: 'badge-red',   icon: <XCircle size={11} />,     label: 'Overdue' },
  }[status] || { cls: 'badge-amber', icon: null, label: status }
}

/* ─── Export to Excel (XLSX) ───────────────────────────────── */
function exportToExcel(payments) {
  if (!payments || payments.length === 0) {
    toast.error('No payments to export')
    return
  }

  // Create HTML table with styling for Excel
  const headers = [
    'Payment ID', 'Member Name', 'Member Email', 'Amount (DZD)',
    'Status', 'Payment Date', 'Notes'
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
              <x:Name>Payments</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        table {
          border-collapse: collapse;
          font-family: 'Segoe UI', Arial, sans-serif;
          font-size: 12px;
        }
        th {
          background: #fb7121;
          color: #ffffff;
          font-weight: 700;
          padding: 8px 12px;
          border: 1px solid #ddd;
          text-align: left;
        }
        td {
          padding: 6px 12px;
          border: 1px solid #ddd;
        }
        tr:nth-child(even) {
          background: #f9f9f9;
        }
        .status-paid {
          color: #22c55e;
          font-weight: 600;
        }
        .status-pending {
          color: #f59e0b;
          font-weight: 600;
        }
        .status-overdue {
          color: #ef4444;
          font-weight: 600;
        }
      </style>
    </head>
    <body>
      <h2>Payments Export</h2>
      <p>Exported on: ${new Date().toLocaleString()}</p>
      <table>
        <thead>
          <tr>
            ${headers.map(h => `<th>${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
  `

  payments.forEach(p => {
    const statusClass = `status-${p.status || 'pending'}`
    html += `
      <tr>
        <td>${p.id}</td>
        <td>${p.member?.user?.name || 'N/A'}</td>
        <td>${p.member?.user?.email || 'N/A'}</td>
        <td>${(p.amount || 0).toLocaleString()}</td>
        <td class="${statusClass}">${(p.status || 'pending').toUpperCase()}</td>
        <td>${p.payment_date || ''}</td>
        <td>${p.notes || ''}</td>
      </tr>
    `
  })

  html += `
        </tbody>
      </table>
      <p style="margin-top: 16px; color: #666; font-size: 11px;">
        Total Payments: ${payments.length} | Total Amount: ${payments.reduce((s, p) => s + (p.amount || 0), 0).toLocaleString()} DZD
      </p>
    </body>
    </html>
  `

  // Create and download the file
  const blob = new Blob([html], { 
    type: 'application/vnd.ms-excel;charset=utf-8' 
  })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `payments_export_${new Date().toISOString().split('T')[0]}.xls`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  toast.success(`Exported ${payments.length} payments to Excel`)
}

/* ─── stat card ─────────────────────────────────────────────── */
function StatCard({ icon: Icon, iconColor, label, value, isMobile }) {
  return (
    <div
      className="card"
      style={{ 
        padding: '18px 20px', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: isMobile ? 6 : 10,
        transition: 'border-color .2s, transform .2s', 
        cursor: 'default' 
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = iconColor; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = C.line;    e.currentTarget.style.transform = 'translateY(0)'    }}
    >
      <div style={{ 
        width: isMobile ? 28 : 34, 
        height: isMobile ? 28 : 34, 
        borderRadius: 9, 
        background: `${iconColor}18`,
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <Icon size={isMobile ? 14 : 16} color={iconColor} />
      </div>
      <div>
        <p style={{ 
          fontSize: isMobile ? 18 : 26, 
          fontWeight: 800, 
          color: C.text, 
          lineHeight: 1, 
          marginBottom: isMobile ? 2 : 4, 
          letterSpacing: '-0.02em' 
        }}>
          {value}
        </p>
        <p style={{ 
          fontSize: isMobile ? 10 : 11.5, 
          color: C.text2, 
          fontWeight: 600 
        }}>
          {label}
        </p>
      </div>
    </div>
  )
}

/* ─── avatar ────────────────────────────────────────────────── */
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

/* ─── Payment Detail Modal ──────────────────────────────────── */
function PaymentDetailModal({ payment, onClose }) {
  if (!payment) return null

  const status = getStatusConfig(payment.status)

  return (
    <div className="modal-overlay" onClick={onClose}>
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
              <CreditCard size={16} color={C.ember} />
            </div>
            <div>
              <h2 className="modal-title" style={{ fontSize: 16 }}>Payment Details</h2>
              <p style={{ fontSize: 11, color: C.text3, margin: '2px 0 0' }}>Transaction #{payment.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close">×</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: `1px solid ${C.line}` }}>
            <span style={{ fontSize: 13, color: C.text3 }}>Member</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{payment.member?.user?.name || 'N/A'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: `1px solid ${C.line}` }}>
            <span style={{ fontSize: 13, color: C.text3 }}>Email</span>
            <span style={{ fontSize: 13, color: C.text }}>{payment.member?.user?.email || 'N/A'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: `1px solid ${C.line}` }}>
            <span style={{ fontSize: 13, color: C.text3 }}>Amount</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{payment.amount.toLocaleString()} DZD</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: `1px solid ${C.line}` }}>
            <span style={{ fontSize: 13, color: C.text3 }}>Status</span>
            <span className={`badge ${status.cls}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              {status.icon} {status.label}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: `1px solid ${C.line}` }}>
            <span style={{ fontSize: 13, color: C.text3 }}>Payment Date</span>
            <span style={{ fontSize: 13, color: C.text }}>{payment.payment_date || '—'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: `1px solid ${C.line}` }}>
            <span style={{ fontSize: 13, color: C.text3 }}>Method</span>
            <span style={{ fontSize: 13, color: C.text }}>Cash</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: C.text3 }}>Notes</span>
            <span style={{ fontSize: 13, color: C.text, textAlign: 'right', maxWidth: '60%' }}>{payment.notes || 'No notes'}</span>
          </div>
        </div>

        <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.line}` }}>
          <button onClick={onClose} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function Payments() {
  const [payments, setPayments]   = useState([])
  const [members, setMembers]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [search, setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const PER_PAGE = 10
  const [formData, setFormData]   = useState({
    member_id: '', amount: '', status: 'paid',
    payment_date: new Date().toISOString().split('T')[0], notes: '',
  })
  const [memberSearch, setMemberSearch] = useState('')
  const [memberOpen, setMemberOpen] = useState(false)
  const memberRef = useRef(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => { 
    fetchData()
    
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const fetchData = async () => {
    try {
      const [paymentsRes, membersRes] = await Promise.all([
        api.get('/payments'),
        api.get('/members'),
      ])
      setPayments(paymentsRes.data)
      setMembers(membersRes.data)
    } catch { toast.error('Failed to fetch data') }
    finally  { setLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/payments', {
        ...formData,
        amount:    parseFloat(formData.amount),
        member_id: parseInt(formData.member_id),
      })
      toast.success('Payment recorded')
      setShowModal(false)
      setMemberOpen(false)
      setMemberSearch('')
      setFormData({ member_id: '', amount: '', status: 'paid',
                    payment_date: new Date().toISOString().split('T')[0], notes: '' })
      fetchData()
    } catch { toast.error('Failed to record payment') }
  }

  const handleViewPayment = (payment) => {
    setSelectedPayment(payment)
    setShowDetailModal(true)
  }

  const handleExport = () => {
    const dataToExport = filtered.length > 0 ? filtered : payments
    exportToExcel(dataToExport)
  }

  /* ── derived stats ── */
  const totalRevenue       = payments.reduce((s, p) => s + (p.status === 'paid'    ? p.amount : 0), 0)
  const pendingAmount      = payments.reduce((s, p) => s + (p.status === 'pending' ? p.amount : 0), 0)
  const overdueAmount      = payments.reduce((s, p) => s + (p.status === 'overdue' ? p.amount : 0), 0)
  const now                = new Date()
  const thisMonthPayments  = payments
    .filter(p => { const d = new Date(p.payment_date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() })
    .reduce((s, p) => s + (p.status === 'paid' ? p.amount : 0), 0)

  const filtered = payments.filter(p => {
    const name  = p.member?.user?.name?.toLowerCase()  || ''
    const email = p.member?.user?.email?.toLowerCase() || ''
    return (name.includes(search.toLowerCase()) || email.includes(search.toLowerCase())) &&
           (statusFilter === 'all' || p.status === statusFilter)
  })

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const fmt = v => `${v.toLocaleString()} DZD`

  if (loading) return (
    <div className="gf-theme"><ThemeStyles />
      <div className="loading"><div className="spinner" /><span>Loading payments…</span></div>
    </div>
  )

  return (
    <div className="gf-theme">
      <ThemeStyles />

      {/* ── Payment Detail Modal ── */}
      <PaymentDetailModal
        payment={selectedPayment}
        onClose={() => {
          setShowDetailModal(false)
          setSelectedPayment(null)
        }}
      />

      {/* ── page header ── */}
      <div className="page-header">
        <div>
          <p style={{ fontSize: 11, color: C.ember, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 6 }}>
            Finance
          </p>
          <h1 className="page-title">Payments</h1>
          <p className="page-subtitle">Manage and track member payments</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus size={15} /> Record Payment
        </button>
      </div>

      {/* ── stat cards - 2 columns on mobile, 4 on desktop ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? '10px' : 14, marginBottom: 22 }}>
        <StatCard isMobile={isMobile} icon={DollarSign}  iconColor={C.mint}  label="Total Revenue" value={fmt(totalRevenue)}      />
        <StatCard isMobile={isMobile} icon={TrendingUp}  iconColor={C.ember} label="This Month"    value={fmt(thisMonthPayments)} />
        <StatCard isMobile={isMobile} icon={Clock}       iconColor={C.amber} label="Pending"       value={fmt(pendingAmount)}     />
        <StatCard isMobile={isMobile} icon={XCircle}     iconColor={C.red}   label="Overdue"       value={fmt(overdueAmount)}     />
      </div>

      {/* ── filter bar - mobile: search bigger, buttons as icons ── */}
      <div className="card" style={{ marginBottom: 18, padding: isMobile ? '10px 12px' : 16 }}>
        <div style={{ 
          display: 'flex', 
          gap: isMobile ? '6px' : 12, 
          flexWrap: 'nowrap', 
          alignItems: 'center' 
        }}>
          {/* Search - Bigger priority */}
          <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
            <Search size={isMobile ? 16 : 14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: COLORS.text3, pointerEvents: 'none', zIndex: 2 }} />
            <input 
              type="text" 
              placeholder={isMobile ? "Search..." : "Search by member name or email…"} 
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }} 
              className="form-input" 
              style={{ 
                paddingLeft: '38px',
                width: '100%',
                minWidth: 0,
                height: isMobile ? '40px' : 'auto'
              }}
            />
          </div>
          
          {/* Status Filter - Icon only on mobile */}
          <select 
            value={statusFilter} 
            onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
            className="form-input" 
            style={{ 
              width: isMobile ? 'auto' : 140,
              minWidth: isMobile ? '36px' : 'auto',
              height: isMobile ? '40px' : 'auto',
              padding: isMobile ? '0 8px' : '0 12px',
              flexShrink: 0,
              appearance: isMobile ? 'none' : 'auto',
              background: isMobile ? 'transparent' : 'auto',
              border: isMobile ? 'none' : 'auto'
            }}
          >
            {isMobile ? (
              <option value="all">All</option>
            ) : (
              <>
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
              </>
            )}
            {isMobile && (
              <>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
              </>
            )}
          </select>

          {/* Export - Icon only on mobile */}
          <button 
            className="btn btn-ghost btn-sm" 
            onClick={handleExport}
            style={{
              padding: isMobile ? '6px 8px' : '8px 12px',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: isMobile ? '36px' : 'auto',
              height: isMobile ? '40px' : 'auto',
              borderRadius: isMobile ? '8px' : 'auto',
              border: isMobile ? '1px solid var(--border)' : 'none',
              background: isMobile ? 'var(--surface-2)' : 'transparent'
            }}
            title="Export to Excel"
          >
            <Download size={isMobile ? 18 : 14} />
            {!isMobile && <span style={{ marginLeft: '4px' }}>Export Excel</span>}
          </button>
          
          {/* Count */}
          {!isMobile && (
            <span style={{ fontSize: 11, color: C.text3, flexShrink: 0 }}>
              {filtered.length} / {payments.length}
            </span>
          )}
        </div>
      </div>

      {/* ── table - mobile: fixed using CSS Grid to prevent overflow ── */}
      <div className="card">
        <div className="table-wrap" style={{ overflowX: 'visible' }}>
          {isMobile ? (
            // Mobile: PERFECTLY ORGANIZED GRID - Fixed percentages for every row
            <div style={{ width: '100%', overflow: 'hidden' }}>
              
              {/* Table Header as Grid - Fixed layout */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '55% 30% 15%',
                padding: '12px 16px',
                borderBottom: `1px solid ${C.line}`,
                fontWeight: 700,
                fontSize: 11,
                color: C.text3,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                background: C.surface2,
                borderRadius: '8px 8px 0 0'
              }}>
                <div style={{ textAlign: 'left' }}>Member</div>
                <div style={{ textAlign: 'left' }}>Status</div>
                <div style={{ textAlign: 'center' }}>Actions</div>
              </div>

              {/* Table Rows as Grid - Exact same 55-30-15 structure */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {paginated.map(payment => {
                  const status = getStatusConfig(payment.status)
                  return (
                    <div key={payment.id} style={{
                      display: 'grid',
                      gridTemplateColumns: '55% 30% 15%',
                      padding: '12px 16px',
                      borderBottom: `1px solid ${C.line}`,
                      alignItems: 'center',
                      background: C.surface,
                      fontSize: 13
                    }}>
                      {/* Member Column - Fixed 55% */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar name={payment.member?.user?.name} />
                        <div style={{ overflow: 'hidden' }}>
                          <p style={{ 
                            fontWeight: 600, 
                            color: C.text, 
                            margin: 0, 
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {payment.member?.user?.name || 'N/A'}
                          </p>
                        </div>
                      </div>

                      {/* Status Column - Fixed 30% */}
                      <div style={{ textAlign: 'left' }}> 
                        <span className={`badge ${status.cls}`} style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: 4, 
                          fontSize: 10,
                          padding: '3px 8px'
                        }}>
                          {status.icon} {status.label}
                        </span>
                      </div>

                      {/* Actions Column - Fixed 15% */}
                      <div style={{ textAlign: 'center' }}>
                        <button
                          className="btn btn-sm btn-ghost"
                          onClick={() => handleViewPayment(payment)}
                          style={{
                            padding: '4px 6px',
                            borderRadius: 6,
                            border: 'none',
                            background: 'transparent',
                            color: C.text3,
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = C.ember
                            e.currentTarget.style.background = `${C.ember}18`
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = C.text3
                            e.currentTarget.style.background = 'transparent'
                          }}
                        >
                          <Eye size={18} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            // Desktop: Keep the standard Table
            <table>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Payment Date</th>
                  <th>Method</th>
                  <th>Notes</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(payment => {
                  const status = getStatusConfig(payment.status)
                  return (
                    <tr key={payment.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Avatar name={payment.member?.user?.name} />
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: 0 }}>
                              {payment.member?.user?.name || 'N/A'}
                            </p>
                            <p style={{ fontSize: 11, color: C.text3, margin: '2px 0 0' }}>
                              {payment.member?.user?.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <p style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: 0 }}>
                          {payment.amount.toLocaleString()}
                        </p>
                        <p style={{ fontSize: 11, color: C.text3, margin: '2px 0 0' }}>DZD</p>
                      </td>
                      <td>
                        <span className={`badge ${status.cls}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {status.icon} {status.label}
                        </span>
                      </td>
                      <td><span style={{ fontSize: 13, color: C.text }}>{payment.payment_date || '—'}</span></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <CreditCard size={12} color={C.text3} />
                          <span style={{ fontSize: 12, color: C.text3 }}>Cash</span>
                        </div>
                      </td>
                      <td><span style={{ fontSize: 12, color: C.text3 }}>{payment.notes || '—'}</span></td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-sm btn-ghost"
                          onClick={() => handleViewPayment(payment)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: 6,
                            border: 'none',
                            background: 'transparent',
                            color: C.text3,
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = C.ember
                            e.currentTarget.style.background = `${C.ember}18`
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = C.text3
                            e.currentTarget.style.background = 'transparent'
                          }}
                        >
                          <Eye size={13} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Pagination — outside the card */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', marginTop: '20px', flexWrap: 'wrap' }}>

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

      {/* ── Add Payment Modal ── */}
      {showModal && (() => {
        const selectedMember = members.find(m => String(m.id) === String(formData.member_id))
        const filteredMembers = members.filter(m =>
          m.user.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
          m.user.email.toLowerCase().includes(memberSearch.toLowerCase())
        )
        const label = (txt) => (
          <p style={{ fontSize: 11, fontWeight: 700, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 8px' }}>{txt}</p>
        )
        const inputStyle = {
          width: '100%', padding: '12px 14px', borderRadius: 10, fontSize: 14, fontWeight: 500,
          border: `1.5px solid ${C.line}`, background: C.surface2, color: C.text,
          outline: 'none', boxSizing: 'border-box', transition: 'all 0.2s', fontFamily: 'inherit',
        }
        const statusColors = { paid: '#22c55e', pending: C.amber, overdue: C.red }

        return (
          <div className="modal-overlay" onClick={() => { setShowModal(false); setMemberOpen(false); setMemberSearch('') }}>
            <div
              style={{ width: '100%', maxWidth: 560, background: C.surface, borderRadius: 16, display: 'flex', flexDirection: 'column', maxHeight: '92vh', overflow: 'hidden', border: `1px solid ${C.line}`, boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: `1px solid ${C.line}`, background: C.surface2, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 11, background: `linear-gradient(135deg, ${C.ember}, #ff9a56)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 3px 10px ${C.ember}50` }}>
                    <DollarSign size={18} color="#fff" />
                  </div>
                  <div>
                    <p style={{ fontSize: 17, fontWeight: 800, color: C.text, margin: 0, letterSpacing: '-0.02em' }}>Record Payment</p>
                    <p style={{ fontSize: 12, color: C.text3, margin: '2px 0 0' }}>Log a new member payment</p>
                  </div>
                </div>
                <button
                  onClick={() => { setShowModal(false); setMemberOpen(false); setMemberSearch('') }}
                  style={{ width: 32, height: 32, borderRadius: '50%', border: `1px solid ${C.line}`, background: 'transparent', color: C.text3, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}
                >×</button>
              </div>

              {/* Scrollable body */}
              <div style={{ overflowY: memberOpen ? 'hidden' : 'auto', flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Member picker — inline expand */}
                <div ref={memberRef}>
                  {label('Member *')}
                  <div
                    onClick={() => { setMemberOpen(o => !o); setTimeout(() => document.getElementById('pay-member-search')?.focus(), 50) }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', cursor: 'pointer',
                      borderRadius: memberOpen ? '10px 10px 0 0' : 10, minHeight: 48,
                      border: `1.5px solid ${memberOpen ? C.ember : C.line}`,
                      borderBottom: memberOpen ? `1px solid ${C.line}` : `1.5px solid ${memberOpen ? C.ember : C.line}`,
                      background: C.surface2, transition: 'all 0.15s',
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
                        ><Search size={0} /><span style={{ fontSize: 16, lineHeight: 1 }}>×</span></button>
                      </>
                    ) : (
                      <>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.surface3, border: `1px dashed ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Search size={14} color={C.text3} />
                        </div>
                        <span style={{ fontSize: 13, color: C.text3, flex: 1 }}>Search and select a member…</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={memberOpen ? C.ember : C.text3} strokeWidth="2" style={{ transition: 'transform 0.2s', transform: memberOpen ? 'rotate(180deg)' : 'none', flexShrink: 0 }}><polyline points="6 9 12 15 18 9"/></svg>
                      </>
                    )}
                  </div>

                  {memberOpen && (
                    <div style={{ border: `1.5px solid ${C.ember}`, borderTop: 'none', borderRadius: '0 0 10px 10px', background: C.surface, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: `1px solid ${C.line}`, background: C.surface2 }}>
                        <Search size={13} color={C.text3} style={{ flexShrink: 0 }} />
                        <input
                          id="pay-member-search"
                          type="text"
                          placeholder="Search by name or email…"
                          value={memberSearch}
                          onChange={e => setMemberSearch(e.target.value)}
                          style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: C.text, fontSize: 13 }}
                        />
                        {memberSearch && <button type="button" onClick={() => setMemberSearch('')} style={{ background: 'none', border: 'none', color: C.text3, cursor: 'pointer', display: 'flex', padding: 0, fontSize: 16 }}>×</button>}
                      </div>
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
                </div>

                {/* Amount + Status row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    {label('Amount (DZD) *')}
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={e => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="0"
                      required
                      style={inputStyle}
                      onFocus={e => { e.currentTarget.style.borderColor = C.ember; e.currentTarget.style.boxShadow = `0 0 0 3px ${C.ember}18` }}
                      onBlur={e => { e.currentTarget.style.borderColor = C.line; e.currentTarget.style.boxShadow = 'none' }}
                    />
                  </div>
                  <div>
                    {label('Status')}
                    <div style={{ display: 'flex', gap: 8 }}>
                      {['paid', 'pending', 'overdue'].map(s => {
                        const isSel = formData.status === s
                        const col = statusColors[s]
                        return (
                          <div
                            key={s}
                            onClick={() => setFormData({ ...formData, status: s })}
                            style={{
                              flex: 1, padding: '11px 6px', borderRadius: 10, cursor: 'pointer', textAlign: 'center',
                              border: `1.5px solid ${isSel ? col : C.line}`,
                              background: isSel ? `${col}15` : C.surface2,
                              transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => { if (!isSel) e.currentTarget.style.borderColor = `${col}60` }}
                            onMouseLeave={e => { if (!isSel) e.currentTarget.style.borderColor = C.line }}
                          >
                            <p style={{ fontSize: 11, fontWeight: 700, color: isSel ? col : C.text3, margin: 0, textTransform: 'capitalize' }}>{s}</p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Payment Date */}
                <div>
                  {label('Payment Date')}
                  <input
                    type="date"
                    value={formData.payment_date}
                    onChange={e => setFormData({ ...formData, payment_date: e.target.value })}
                    style={inputStyle}
                    onFocus={e => { e.currentTarget.style.borderColor = C.ember; e.currentTarget.style.boxShadow = `0 0 0 3px ${C.ember}18` }}
                    onBlur={e => { e.currentTarget.style.borderColor = C.line; e.currentTarget.style.boxShadow = 'none' }}
                  />
                </div>

                {/* Notes */}
                <div>
                  {label('Notes')}
                  <textarea
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Optional notes…"
                    rows={3}
                    style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }}
                    onFocus={e => { e.currentTarget.style.borderColor = C.ember; e.currentTarget.style.boxShadow = `0 0 0 3px ${C.ember}18` }}
                    onBlur={e => { e.currentTarget.style.borderColor = C.line; e.currentTarget.style.boxShadow = 'none' }}
                  />
                </div>

              </div>{/* end body */}

              {/* Footer */}
              <div style={{ padding: '16px 24px', borderTop: `1px solid ${C.line}`, background: C.surface2, flexShrink: 0, display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={handleSubmit}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg, ${C.ember}, #ff9a56)`, color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', boxShadow: `0 3px 12px ${C.ember}45`, letterSpacing: '-0.01em' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  <DollarSign size={15} /> Save Payment
                </button>
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setMemberOpen(false); setMemberSearch('') }}
                  style={{ padding: '13px 22px', borderRadius: 10, border: `1.5px solid ${C.line}`, background: 'transparent', color: C.text2, fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.ember; e.currentTarget.style.color = C.ember }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.line; e.currentTarget.style.color = C.text2 }}
                >Cancel</button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}