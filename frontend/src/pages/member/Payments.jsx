// frontend/src/pages/member/Payments.jsx

import { useEffect, useState } from 'react'
import api from '../../api/client'
import {
  CreditCard, Download, CheckCircle, Clock, XCircle,
  Search, Receipt, Wallet, AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_CONFIG = {
  paid:    { icon: CheckCircle, color: 'var(--green)',  label: 'Paid' },
  pending: { icon: Clock,       color: 'var(--amber)', label: 'Pending' },
  overdue: { icon: XCircle,     color: 'var(--red)',   label: 'Overdue' },
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending
  const Icon = cfg.icon
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '99px',
      background: `${cfg.color}1A`, color: cfg.color,
    }}>
      <Icon size={11} />
      {cfg.label}
    </span>
  )
}

export default function MemberPayments() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [exporting, setExporting] = useState(false)

  useEffect(() => { fetchPayments() }, [])

  const fetchPayments = async () => {
    setLoading(true)
    try {
      console.log('📊 Fetching payments...')
      const res = await api.get('/payments/my')
      console.log('✅ Payments response:', res.data)
      
      setPayments(res.data || [])
      
    } catch (error) {
      console.error('❌ Error fetching payments:', error)
      console.error('❌ Error response:', error.response?.data)
      
      if (error.response?.status === 401) {
        toast.error('Please login again')
      } else if (error.response?.status === 403) {
        toast.error('You don\'t have permission to view payments')
      } else {
        toast.error('Failed to load payment history')
      }
      
      setPayments([])
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date) => {
    if (!date) return '—'
    try {
      return new Date(date).toLocaleDateString('en-GB', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      })
    } catch {
      return '—'
    }
  }

  const formatCurrency = (value) => {
    if (value === undefined || value === null) return 'DZD 0'
    return new Intl.NumberFormat('en-DZ', { 
      style: 'currency', 
      currency: 'DZD', 
      minimumFractionDigits: 0 
    }).format(value)
  }

  // Export functionality
  const handleExport = async () => {
    setExporting(true)
    try {
      const dataToExport = filteredPayments.length > 0 ? filteredPayments : payments
      
      if (dataToExport.length === 0) {
        toast.error('No payments to export')
        return
      }

      // Create CSV data
      const headers = ['Date', 'Amount', 'Status', 'Notes']
      const rows = dataToExport.map(p => [
        formatDate(p.payment_date),
        formatCurrency(p.amount),
        p.status || 'pending',
        p.notes || ''
      ])

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n')

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `payments_export_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success(`Exported ${dataToExport.length} payments successfully!`)
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export payments')
    } finally {
      setExporting(false)
    }
  }

  // Alternative: Export as JSON
  const handleExportJSON = async () => {
    setExporting(true)
    try {
      const dataToExport = filteredPayments.length > 0 ? filteredPayments : payments
      
      if (dataToExport.length === 0) {
        toast.error('No payments to export')
        return
      }

      const jsonString = JSON.stringify(dataToExport, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `payments_export_${new Date().toISOString().split('T')[0]}.json`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success(`Exported ${dataToExport.length} payments as JSON!`)
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export payments')
    } finally {
      setExporting(false)
    }
  }

  const totalPaid = payments.filter((p) => p.status === 'paid').reduce((s, p) => s + (p.amount || 0), 0)
  const totalPending = payments.filter((p) => p.status === 'pending').reduce((s, p) => s + (p.amount || 0), 0)
  const overdueCount = payments.filter((p) => p.status === 'overdue').length

  const filteredPayments = payments.filter((p) => {
    const matchesSearch = (p.notes || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.status || '').toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div style={{
        background: 'var(--bg)', 
        minHeight: '100vh', 
        display: 'flex',
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: '14px',
      }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%',
          border: `3px solid var(--border)`, borderTopColor: 'var(--accent)',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ color: 'var(--text-3)', fontSize: '13px', fontWeight: 600 }}>Loading payments…</span>
      </div>
    )
  }

  return (
    <div className="payments-page" style={{
      background: 'var(--bg)',
      color: 'var(--text)',
      fontFamily: "'Inter', -apple-system, sans-serif",
      padding: '2px',
      minHeight: '100vh',
      boxSizing: 'border-box',
    }}>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }
        .payment-row { transition: background 0.12s ease; }
        .payment-row:hover { background: var(--surface-2) !important; }
        input::placeholder { color: var(--text-3); }

        /* ---- Header ---- */
        .payments-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 14px;
          margin-bottom: 22px;
        }
        .payments-header-actions {
          display: flex;
          gap: 10px;
        }
        .payments-header-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 10px 18px;
          border-radius: 9px;
          border: 1px solid var(--border);
          font-size: 13px;
          font-weight: 700;
          white-space: nowrap;
        }

        /* ---- Stats grid ---- */
        .payments-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }
        .payments-stat-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 18px;
        }

        /* ---- Search & filter ---- */
        .payments-search-row {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .payments-search-box {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--surface-2);
          border-radius: 9px;
          padding: 0 12px;
          border: 1px solid var(--border);
          min-width: 180px;
        }
        .payments-status-select {
          width: 140px;
          font-size: 13px;
          padding: 10px 12px;
          border-radius: 9px;
          border: 1px solid var(--border);
          background: var(--surface-2);
          color: var(--text);
          flex-shrink: 0;
        }

        /* ---- Desktop table ---- */
        .payments-table-desktop { display: block; }
        .payments-table-mobile { display: none; }
        .payments-table-head-row,
        .payments-table-body-row {
          display: grid;
          grid-template-columns: 1fr 160px 110px 1fr;
          align-items: center;
        }
        .payments-table-head-row {
          padding: 12px 18px;
          border-bottom: 1px solid var(--border);
          background: var(--surface-2);
        }
        .payments-table-body-row {
          padding: 15px 18px;
        }

        /* =========================================================
           MOBILE (≤ 640px)
           ========================================================= */
        @media (max-width: 640px) {
          .payments-header {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
            margin-bottom: 18px;
          }
          .payments-header-actions {
            gap: 8px;
          }
          .payments-header-btn {
            flex: 1;
            padding: 10px 10px;
            font-size: 12px;
          }
          .payments-header-btn span.btn-label-full { display: none; }
          .payments-header-btn span.btn-label-short { display: inline; }

          /* Show only 2 stat cards, in one row */
          .payments-stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }
          .payments-stat-card:nth-child(3) {
            display: none;
          }
          .payments-stat-card {
            padding: 14px;
          }
          .payments-stat-card .stat-value {
            font-size: 17px;
          }

          /* Search bar stays on one line */
          .payments-search-row {
            flex-wrap: nowrap;
          }
          .payments-search-box {
            min-width: 0;
            padding: 0 10px;
          }
          .payments-search-box input {
            font-size: 12.5px;
          }
          .payments-status-select {
            width: auto;
            max-width: 96px;
            font-size: 12px;
            padding: 10px 8px;
          }

          /* Swap table for stacked cards */
          .payments-table-desktop { display: none; }
          .payments-table-mobile { display: block; }
        }
      `}</style>

      {/* Header */}
      <div className="payments-header">
        <div>
          <p style={{ 
            fontSize: '11px', 
            color: 'var(--accent)', 
            textTransform: 'uppercase', 
            letterSpacing: '0.12em', 
            fontWeight: 700, 
            marginBottom: '6px' 
          }}>
            Billing
          </p>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: 800, 
            letterSpacing: '-0.02em', 
            margin: 0,
            color: 'var(--text)'
          }}>
            Payments
          </h1>
          <p style={{ 
            fontSize: '13px', 
            color: 'var(--text-3)', 
            marginTop: '4px' 
          }}>
            Your transaction history
          </p>
        </div>
        <div className="payments-header-actions">
          <button
            className="payments-header-btn"
            onClick={handleExportJSON}
            disabled={exporting}
            style={{
              background: 'var(--surface-2)', 
              color: 'var(--text)',
              cursor: exporting ? 'not-allowed' : 'pointer',
              opacity: exporting ? 0.7 : 1,
            }}
          >
            <Download size={14} />
            <span className="btn-label-full">{exporting ? 'Exporting...' : 'Export JSON'}</span>
            <span className="btn-label-short">JSON</span>
          </button>
          <button
            className="payments-header-btn"
            onClick={handleExport}
            disabled={exporting}
            style={{
              background: 'var(--accent)', 
              color: 'white',
              cursor: exporting ? 'not-allowed' : 'pointer',
              opacity: exporting ? 0.7 : 1,
            }}
          >
            <Download size={14} />
            <span className="btn-label-full">{exporting ? 'Exporting...' : 'Export CSV'}</span>
            <span className="btn-label-short">CSV</span>
          </button>
        </div>
      </div>

      {/* Overdue alert */}
      {overdueCount > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '13px 16px', borderRadius: '10px', marginBottom: '20px',
          background: 'var(--red)12', border: `1px solid var(--red)3D`,
        }}>
          <AlertCircle size={16} color="var(--red)" />
          <p style={{ fontSize: '13px', color: 'var(--text-2)' }}>
            You have <strong style={{ color: 'var(--red)' }}>{overdueCount} overdue payment{overdueCount > 1 ? 's' : ''}</strong>. Contact admin to resolve.
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="payments-stats-grid">
        {[
          { icon: Wallet, color: 'var(--green)', value: formatCurrency(totalPaid), label: 'Total paid', sub: `${payments.filter((p) => p.status === 'paid').length} transactions` },
          { icon: Clock, color: 'var(--amber)', value: formatCurrency(totalPending), label: 'Pending', sub: `${payments.filter((p) => p.status === 'pending').length} transactions` },
          { icon: Receipt, color: 'var(--blue)', value: payments.length, label: 'All time', sub: 'Total transactions' },
        ].map(({ icon: Icon, color, value, label, sub }) => (
          <div key={label} className="payments-stat-card">
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              marginBottom: '12px' 
            }}>
              <div style={{ 
                width: '34px', height: '34px', borderRadius: '9px', 
                background: `${color}1F`, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <Icon size={16} color={color} />
              </div>
              <span style={{ 
                fontSize: '10.5px', 
                color: 'var(--text-3)', 
                textTransform: 'uppercase', 
                letterSpacing: '0.06em', 
                fontWeight: 700 
              }}>
                {label}
              </span>
            </div>
            <p className="stat-value" style={{ 
              fontSize: '20px', 
              fontWeight: 800, 
              letterSpacing: '-0.02em',
              color: 'var(--text)'
            }}>
              {value}
            </p>
            <p style={{ 
              fontSize: '11px', 
              color: 'var(--text-3)', 
              marginTop: '3px' 
            }}>
              {sub}
            </p>
          </div>
        ))}
      </div>

      {/* Search & filter */}
      <div style={{ 
        background: 'var(--surface)', 
        border: `1px solid var(--border)`, 
        borderRadius: '14px', 
        padding: '14px 16px', 
        marginBottom: '16px' 
      }}>
        <div className="payments-search-row">
          <div className="payments-search-box">
            <Search size={14} color="var(--text-3)" />
            <input
              type="text"
              placeholder="Search payments…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: 'none', border: 'none', outline: 'none',
                fontSize: '13px', color: 'var(--text)', padding: '10px 0', width: '100%',
              }}
            />
          </div>
          <select
            className="payments-status-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={{ 
        background: 'var(--surface)', 
        border: `1px solid var(--border)`, 
        borderRadius: '16px', 
        overflow: 'hidden' 
      }}>
        {filteredPayments.length > 0 ? (
          <div>
            {/* ---- Desktop grid table ---- */}
            <div className="payments-table-desktop">
              <div className="payments-table-head-row">
                {['Date', 'Amount', 'Status', 'Notes'].map((h) => (
                  <span key={h} style={{ 
                    fontSize: '10.5px', color: 'var(--text-3)', 
                    textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 
                  }}>
                    {h}
                  </span>
                ))}
              </div>

              {filteredPayments.map((payment, idx) => (
                <div
                  key={payment.id || idx}
                  className="payment-row payments-table-body-row"
                  style={{
                    borderBottom: idx < filteredPayments.length - 1 ? `1px solid var(--border)` : 'none',
                  }}
                >
                  <p style={{ 
                    fontSize: '13px', 
                    fontWeight: 600, 
                    margin: 0,
                    color: 'var(--text)'
                  }}>
                    {payment.payment_date ? formatDate(payment.payment_date) : '—'}
                  </p>
                  <p style={{ 
                    fontSize: '14px', 
                    fontWeight: 800, 
                    letterSpacing: '-0.01em', 
                    margin: 0,
                    color: 'var(--text)'
                  }}>
                    {formatCurrency(payment.amount)}
                  </p>
                  <div>
                    <StatusBadge status={payment.status || 'pending'} />
                  </div>
                  <p style={{ 
                    fontSize: '12px', 
                    color: 'var(--text-3)', 
                    margin: 0 
                  }}>
                    {payment.notes || '—'}
                  </p>
                </div>
              ))}
            </div>

            {/* ---- Mobile stacked cards ---- */}
            <div className="payments-table-mobile">
              {filteredPayments.map((payment, idx) => (
                <div
                  key={payment.id || idx}
                  className="payment-row"
                  style={{
                    padding: '14px 16px',
                    borderBottom: idx < filteredPayments.length - 1 ? `1px solid var(--border)` : 'none',
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '10px',
                  }}>
                    <div>
                      <p style={{
                        fontSize: '10px', color: 'var(--text-3)',
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                        fontWeight: 700, marginBottom: '3px',
                      }}>
                        {payment.payment_date ? formatDate(payment.payment_date) : '—'}
                      </p>
                      <p style={{
                        fontSize: '16px', fontWeight: 800,
                        letterSpacing: '-0.01em', margin: 0,
                        color: 'var(--text)',
                      }}>
                        {formatCurrency(payment.amount)}
                      </p>
                    </div>
                    <StatusBadge status={payment.status || 'pending'} />
                  </div>
                  <p style={{
                    fontSize: '12px', color: 'var(--text-3)',
                    marginTop: '8px', marginBottom: 0,
                  }}>
                    {payment.notes || '—'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <CreditCard size={36} color="var(--text-3)" style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <p style={{ 
              fontSize: '14px', 
              color: 'var(--text-2)', 
              fontWeight: 600 
            }}>
              {search || statusFilter !== 'all' ? 'No matching payments' : 'No payments yet'}
            </p>
            <p style={{ 
              fontSize: '12px', 
              color: 'var(--text-3)', 
              marginTop: '4px' 
            }}>
              {search ? 'Try a different search term.' : 'Your payment history will appear here.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}