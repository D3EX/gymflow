// frontend/src/pages/admin/Reports.jsx

import { useEffect, useState, useMemo } from 'react'
import api from "../../api/client"
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line
} from 'recharts'
import {
  Download, TrendingUp, Users, DollarSign, Activity,
  ArrowUpRight, ArrowDownRight, BarChart2, LineChart as LineChartIcon,
  Layers, CreditCard, CheckCircle2, Clock, AlertCircle,
  FileSpreadsheet, FileText
} from 'lucide-react'
import toast from 'react-hot-toast'
import { COLORS, ThemeStyles } from '../../theme/GymTheme'

const C = COLORS

const SLICE_CONFIG = {
  week:    { label: 'This Week',    months: 1,  label2: 'last 7 days'   },
  month:   { label: 'This Month',   months: 1,  label2: 'last 30 days'  },
  quarter: { label: 'This Quarter', months: 3,  label2: 'last 3 months' },
  year:    { label: 'This Year',    months: 12, label2: 'year to date'  },
}

const ALL_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function sliceByPeriod(data, period) {
  if (!data?.length) return []
  return data.slice(-SLICE_CONFIG[period].months)
}

/* ─── stat row ──────────────────────────────────────────────── */
function StatRow({ label, value, sub, accent = false, progress = null, badge = null }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '12px 14px', borderRadius: 10,
      background: accent ? `${C.ember}0D` : C.surface2,
      border: `1px solid ${accent ? C.ember + '30' : C.line}`,
    }}>
      <span style={{ fontSize: 13, color: C.text3 }}>{label}</span>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
        {badge ?? (
          <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{value}</span>
        )}
        {sub && <span style={{ fontSize: 11, color: C.text3 }}>{sub}</span>}
        {progress !== null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
            <div style={{ width: 80, height: 4, borderRadius: 99, background: C.line, overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', borderRadius: 99, background: C.ember, transition: 'width .4s ease' }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{progress}%</span>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── payment bar ───────────────────────────────────────────── */
function PaymentBar({ icon: Icon, label, value, total, color }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}1A`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={14} color={color} />
          </div>
          <span style={{ fontSize: 13, color: C.text2 }}>{label}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: C.text }}>{value}</span>
          <span style={{ fontSize: 12, color: C.text3, minWidth: 34, textAlign: 'right' }}>{pct}%</span>
        </div>
      </div>
      <div style={{ height: 5, borderRadius: 99, background: C.line, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 99, background: color, transition: 'width .4s ease' }} />
      </div>
    </div>
  )
}

/* ─── chart section header ──────────────────────────────────── */
function ChartHeader({ icon: Icon, title, sub, right }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: `${C.ember}18`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={16} color={C.ember} />
        </div>
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: 0 }}>{title}</h3>
          <p style={{ fontSize: 11, color: C.text3, margin: '2px 0 0' }}>{sub}</p>
        </div>
      </div>
      {right}
    </div>
  )
}

/* ─── growth pill ───────────────────────────────────────────── */
function GrowthPill({ pct }) {
  const up = pct >= 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px',
                  borderRadius: 99, background: `${up ? C.mint : C.red}1A` }}>
      {up ? <ArrowUpRight size={12} color={C.mint} /> : <ArrowDownRight size={12} color={C.red} />}
      <span style={{ fontSize: 12, fontWeight: 700, color: up ? C.mint : C.red }}>
        {up ? '+' : ''}{pct}%
      </span>
    </div>
  )
}

/* ─── tooltip style ─────────────────────────────────────────── */
const ttStyle = {
  contentStyle: { background: C.surface2, border: `1px solid ${C.line}`, borderRadius: 10, fontSize: 12 },
  labelStyle: { color: C.text2 },
  itemStyle: { color: C.text },
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function Reports() {
  const [revenueDataFull, setRevenueDataFull]   = useState([])
  const [attendanceData, setAttendanceData]     = useState([])
  const [memberGrowthData, setMemberGrowthData] = useState([])
  const [stats, setStats]                       = useState(null)
  const [payments, setPayments]                 = useState([])
  const [loading, setLoading]                   = useState(true)
  const [selectedPeriod, setSelectedPeriod]     = useState('year')
  const [exporting, setExporting]               = useState(false)
  const [isMobile, setIsMobile]                 = useState(typeof window !== 'undefined' ? window.innerWidth <= 640 : false)

  useEffect(() => { fetchReports() }, [])

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 640)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const fetchReports = async () => {
    setLoading(true)
    try {
      const [revenueRes, statsRes, paymentsRes, membersRes, attendanceRes] = await Promise.all([
        api.get('/payments/monthly-revenue'),
        api.get('/dashboard/stats'),
        api.get('/payments'),
        api.get('/members'),
        api.get('/attendance'),
      ])

      const existing = revenueRes.data || []
      setRevenueDataFull(ALL_MONTHS.map(month => {
        const found = existing.find(d => d.month === month)
        return { month, revenue: found?.revenue || 0 }
      }))
      setStats(statsRes.data)
      setPayments(paymentsRes.data)

      const members = membersRes.data || []
      const byMonth = {}
      members.forEach(m => {
        const month = ALL_MONTHS[new Date(m.user?.created_at).getMonth()]
        byMonth[month] = (byMonth[month] || 0) + 1
      })
      let cum = 0
      setMemberGrowthData(ALL_MONTHS.map(month => { cum += byMonth[month] || 0; return { month, members: cum } }))

      const records = attendanceRes.data || []
      const aByMonth = {}
      records.forEach(r => {
        const month = ALL_MONTHS[new Date(r.check_in_time).getMonth()]
        aByMonth[month] = (aByMonth[month] || 0) + 1
      })
      setAttendanceData(ALL_MONTHS.map(month => ({ month, checkins: aByMonth[month] || 0 })))

    } catch {
      setRevenueDataFull(ALL_MONTHS.map(m => ({ month: m, revenue: 0 })))
      setMemberGrowthData(ALL_MONTHS.map(m => ({ month: m, members: 0 })))
      setAttendanceData(ALL_MONTHS.map(m => ({ month: m, checkins: 0 })))
    } finally { setLoading(false) }
  }

  const revenueData    = useMemo(() => sliceByPeriod(revenueDataFull,  selectedPeriod), [revenueDataFull,  selectedPeriod])
  const memberGrowth   = useMemo(() => sliceByPeriod(memberGrowthData, selectedPeriod), [memberGrowthData, selectedPeriod])
  const attendanceTrend = useMemo(() => sliceByPeriod(attendanceData,  selectedPeriod), [attendanceData,   selectedPeriod])

  const fmt = v => new Intl.NumberFormat('en-DZ', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 }).format(v)

  const totalRevenue       = revenueData.reduce((s, d) => s + (d.revenue || 0), 0)
  const nonZero            = revenueData.filter(d => d.revenue > 0)
  const averageMonthly     = totalRevenue / (nonZero.length || 1)
  const bestMonth          = revenueData.reduce((b, c) => (c.revenue || 0) > (b.revenue || 0) ? c : b, { month: '-', revenue: 0 })
  const growth             = revenueData.length > 1 && revenueData[revenueData.length - 2]?.revenue
    ? +((revenueData[revenueData.length - 1].revenue - revenueData[revenueData.length - 2].revenue) /
        (revenueData[revenueData.length - 2].revenue || 1) * 100).toFixed(1)
    : 0

  const paidCount    = payments.filter(p => p.status === 'paid').length
  const pendingCount = payments.filter(p => p.status === 'pending').length
  const overdueCount = payments.filter(p => p.status === 'overdue').length
  const totalPayments = paidCount + pendingCount + overdueCount

  const activeMembers      = stats?.active_subscriptions || 0
  const totalMembers       = stats?.total_members || 0
  const churnRate          = totalMembers > 0 ? ((totalMembers - activeMembers) / totalMembers * 100).toFixed(1) : 0
  const avgRevenuePerMember = totalMembers > 0 ? totalRevenue / totalMembers : 0
  const activeRate         = totalMembers > 0 ? Math.round((activeMembers / totalMembers) * 100) : 0

  const memberGrowthPct = memberGrowth.length > 1
    ? Math.round(((memberGrowth[memberGrowth.length - 1]?.members || 0) - (memberGrowth[memberGrowth.length - 2]?.members || 0)) /
                  (memberGrowth[memberGrowth.length - 2]?.members || 1) * 100)
    : 0

  const attendancePct = attendanceTrend.length > 1
    ? Math.round(((attendanceTrend[attendanceTrend.length - 1]?.checkins || 0) - (attendanceTrend[attendanceTrend.length - 2]?.checkins || 0)) /
                  (attendanceTrend[attendanceTrend.length - 2]?.checkins || 1) * 100)
    : 0

  // ─── EXPORT FUNCTIONS ──────────────────────────────────────

  const exportCSV = () => {
    setExporting(true)
    try {
      // Prepare data
      const rows = [
        ['Metric', 'Value'],
        ['Total Revenue', totalRevenue],
        ['Average Monthly', averageMonthly],
        ['Best Month', bestMonth.month],
        ['Best Month Revenue', bestMonth.revenue],
        ['Growth Rate', growth + '%'],
        ['Total Members', totalMembers],
        ['Active Members', activeMembers],
        ['Active Rate', activeRate + '%'],
        ['Churn Rate', churnRate + '%'],
        ['Revenue Per Member', avgRevenuePerMember],
        ['Total Payments', totalPayments],
        ['Paid', paidCount],
        ['Pending', pendingCount],
        ['Overdue', overdueCount],
        [''],
        ['Month', 'Revenue', 'Members', 'Check-ins'],
      ]

      // Add monthly data
      const maxLength = Math.max(revenueData.length, memberGrowth.length, attendanceTrend.length)
      for (let i = 0; i < maxLength; i++) {
        const month = revenueData[i]?.month || memberGrowth[i]?.month || attendanceTrend[i]?.month || ''
        const revenue = revenueData[i]?.revenue || 0
        const members = memberGrowth[i]?.members || 0
        const checkins = attendanceTrend[i]?.checkins || 0
        rows.push([month, revenue, members, checkins])
      }

      // Create CSV content
      const csvContent = rows.map(row => 
        row.map(cell => {
          if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"') || cell.includes('\n'))) {
            return `"${cell.replace(/"/g, '""')}"`
          }
          return cell
        }).join(',')
      ).join('\n')

      // Download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `report_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast.success('Report exported as CSV!')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export CSV')
    } finally {
      setExporting(false)
    }
  }

  const exportExcel = () => {
    setExporting(true)
    try {
      // Prepare data
      const rows = [
        ['Metric', 'Value'],
        ['Total Revenue', totalRevenue],
        ['Average Monthly', averageMonthly],
        ['Best Month', bestMonth.month],
        ['Best Month Revenue', bestMonth.revenue],
        ['Growth Rate', growth + '%'],
        ['Total Members', totalMembers],
        ['Active Members', activeMembers],
        ['Active Rate', activeRate + '%'],
        ['Churn Rate', churnRate + '%'],
        ['Revenue Per Member', avgRevenuePerMember],
        ['Total Payments', totalPayments],
        ['Paid', paidCount],
        ['Pending', pendingCount],
        ['Overdue', overdueCount],
        [''],
        ['Month', 'Revenue (DZD)', 'Members', 'Check-ins'],
      ]

      // Add monthly data
      const maxLength = Math.max(revenueData.length, memberGrowth.length, attendanceTrend.length)
      for (let i = 0; i < maxLength; i++) {
        const month = revenueData[i]?.month || memberGrowth[i]?.month || attendanceTrend[i]?.month || ''
        const revenue = revenueData[i]?.revenue || 0
        const members = memberGrowth[i]?.members || 0
        const checkins = attendanceTrend[i]?.checkins || 0
        rows.push([month, revenue, members, checkins])
      }

      // Create TSV content (Tab-separated for Excel compatibility)
      const tsvContent = rows.map(row => 
        row.map(cell => {
          if (typeof cell === 'string' && (cell.includes('\t') || cell.includes('\n'))) {
            return `"${cell.replace(/"/g, '""')}"`
          }
          return cell
        }).join('\t')
      ).join('\n')

      // Download as .xls (Excel can open tab-separated files)
      const blob = new Blob([tsvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `report_${new Date().toISOString().split('T')[0]}.xls`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast.success('Report exported as Excel!')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export Excel')
    } finally {
      setExporting(false)
    }
  }

  if (loading) return (
    <div className="gf-theme"><ThemeStyles />
      <div className="loading"><div className="spinner" /></div>
    </div>
  )

  return (
    <div className="gf-theme">
      <ThemeStyles />
      <style>{`
        .reports-header {
          display: flex; justify-content: space-between; align-items: flex-start;
          gap: 16px; flex-wrap: wrap;
        }
        .reports-export-buttons { display: flex; gap: 8px; flex-wrap: wrap; }
        .reports-period-selector {
          display: inline-flex; gap: 4px; max-width: 100%;
          overflow-x: auto; -webkit-overflow-scrolling: touch;
        }
        @media (max-width: 768px) {
          .reports-period-selector {
            display: flex; width: 100%; gap: 4px;
          }
          .reports-period-selector button {
            flex: 1 1 0; text-align: center; padding-left: 8px !important; padding-right: 8px !important;
          }
        }
        .kpi-grid {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px;
        }
        .charts-grid {
          display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; margin-bottom: 18px;
        }
        .metrics-grid {
          display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px;
        }
        .chart-card { padding: 22px 24px; }

        @media (max-width: 768px) {
          .kpi-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 18px; }
          .charts-grid { grid-template-columns: 1fr; gap: 14px; margin-bottom: 14px; }
          .metrics-grid { grid-template-columns: 1fr; gap: 14px; }
          .chart-card { padding: 16px !important; }
          .reports-header { flex-direction: column; align-items: stretch; }
          .reports-export-buttons { width: 100%; }
          .reports-export-buttons button { flex: 1; justify-content: center; }
          .kpi-card { padding: 14px 12px !important; }
          .kpi-card-value { font-size: 19px !important; }
        }

        @media (max-width: 420px) {
          .kpi-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
        }
      `}</style>

      {/* ── page header ── */}
      <div className="page-header reports-header">
        <div>
          <p style={{ fontSize: 11, color: C.ember, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 6 }}>
            Analytics
          </p>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Business insights and performance statistics</p>
        </div>
        <div className="reports-export-buttons">
          <button 
            className="btn btn-primary btn-sm" 
            onClick={exportCSV}
            disabled={exporting}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <FileText size={14} /> {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={exportExcel}
            disabled={exporting}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <FileSpreadsheet size={14} /> {exporting ? 'Exporting...' : 'Export Excel'}
          </button>
        </div>
      </div>

      {/* ── period selector ── */}
      <div className="card reports-period-selector" style={{ marginBottom: 24, padding: 6, marginTop: 16 }}>
        {['week', 'month', 'quarter', 'year'].map(p => (
          <button
            key={p} type="button"
            onClick={() => setSelectedPeriod(p)}
            className={`btn btn-sm ${selectedPeriod === p ? 'btn-primary' : 'btn-ghost'}`}
            style={{ textTransform: 'capitalize', padding: '6px 18px', whiteSpace: 'nowrap', flexShrink: 0 }}
          >{p}</button>
        ))}
      </div>

      {/* ── KPI cards ── */}
      <div className="kpi-grid">
        {[
          { icon: DollarSign, color: C.ember, value: fmt(totalRevenue),        label: 'Total Revenue',         sub: SLICE_CONFIG[selectedPeriod].label2, badge: <GrowthPill pct={growth} /> },
          { icon: Users,      color: C.mint,  value: activeMembers,             label: 'Active Members',        sub: `of ${totalMembers} total` },
          { icon: TrendingUp, color: C.ember, value: fmt(avgRevenuePerMember),  label: 'Avg Revenue / Member',  sub: 'per period' },
          { icon: Activity,   color: C.amber, value: `${churnRate}%`,           label: 'Churn Rate',            sub: 'member retention' },
        ].map(({ icon: Icon, color, value, label, sub, badge }) => (
          <div key={label} className="card kpi-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 10,
            transition: 'border-color .2s, transform .2s', cursor: 'default', minWidth: 0 }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.line; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: `${color}18`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={16} color={color} />
              </div>
              {badge}
            </div>
            <div style={{ minWidth: 0 }}>
              <p className="kpi-card-value" style={{ fontSize: 24, fontWeight: 800, color: C.text, lineHeight: 1.15, marginBottom: 4, letterSpacing: '-0.02em', wordBreak: 'break-word' }}>{value}</p>
              <p style={{ fontSize: 11.5, color: C.text2, fontWeight: 600, marginBottom: 2 }}>{label}</p>
              <p style={{ fontSize: 11, color: C.text3 }}>{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── charts row 1 ── */}
      <div className="charts-grid">

        {/* revenue area chart */}
        <div className="card chart-card">
          <ChartHeader
            icon={BarChart2} title="Revenue Trend"
            sub={`Monthly · ${SLICE_CONFIG[selectedPeriod].label}`}
            right={
              <div style={{ display: 'flex', gap: isMobile ? 14 : 20 }}>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Best Month</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{bestMonth.month}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 10, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg / Mo</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{fmt(averageMonthly)}</p>
                </div>
              </div>
            }
          />
          <ResponsiveContainer width="100%" height={isMobile ? 200 : 260}>
            <AreaChart data={revenueData} margin={isMobile ? { top: 4, right: 4, left: -16, bottom: 0 } : undefined}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.ember} stopOpacity={0.28} />
                  <stop offset="95%" stopColor={C.ember} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.line} vertical={false} />
              <XAxis dataKey="month" stroke={C.text3} tick={{ fontSize: isMobile ? 9 : 11, fill: C.text3 }}
                axisLine={false} tickLine={false} interval={isMobile ? 'preserveStartEnd' : 0} />
              <YAxis stroke={C.text3} tick={{ fontSize: isMobile ? 9 : 11, fill: C.text3 }} axisLine={false} tickLine={false}
                width={isMobile ? 34 : 50} tickFormatter={v => `${v/1000}k`} />
              <Tooltip {...ttStyle} formatter={v => [fmt(v), 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke={C.ember} strokeWidth={2.5} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* member growth bar chart */}
        <div className="card chart-card">
          <ChartHeader
            icon={Users} title="Member Growth"
            sub={`New members · ${SLICE_CONFIG[selectedPeriod].label}`}
            right={<GrowthPill pct={memberGrowthPct} />}
          />
          <ResponsiveContainer width="100%" height={isMobile ? 200 : 260}>
            <BarChart data={memberGrowth} margin={isMobile ? { top: 4, right: 4, left: -16, bottom: 0 } : undefined}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.line} vertical={false} />
              <XAxis dataKey="month" stroke={C.text3} tick={{ fontSize: isMobile ? 9 : 11, fill: C.text3 }}
                axisLine={false} tickLine={false} interval={isMobile ? 'preserveStartEnd' : 0} />
              <YAxis stroke={C.text3} tick={{ fontSize: isMobile ? 9 : 11, fill: C.text3 }} axisLine={false} tickLine={false}
                width={isMobile ? 28 : 40} />
              <Tooltip {...ttStyle} />
              <Bar dataKey="members" fill={C.ember} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── charts row 2 ── */}
      <div className="charts-grid">

        {/* payment distribution */}
        <div className="card chart-card">
          <ChartHeader icon={CreditCard} title="Payment Distribution" sub={`Status breakdown · ${SLICE_CONFIG[selectedPeriod].label}`} />
          <div style={{ textAlign: 'center', marginBottom: isMobile ? 20 : 28 }}>
            <p style={{ fontSize: isMobile ? 36 : 48, fontWeight: 800, letterSpacing: '-2px', color: C.text, margin: 0, lineHeight: 1 }}>{totalPayments}</p>
            <p style={{ fontSize: 12, color: C.text3, marginTop: 6 }}>Total Payments</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <PaymentBar icon={CheckCircle2} label="Paid"    value={paidCount}    total={totalPayments} color={C.mint}  />
            <PaymentBar icon={Clock}        label="Pending" value={pendingCount}  total={totalPayments} color={C.amber} />
            <PaymentBar icon={AlertCircle}  label="Overdue" value={overdueCount}  total={totalPayments} color={C.red}   />
          </div>
        </div>

        {/* attendance line chart */}
        <div className="card chart-card">
          <ChartHeader
            icon={LineChartIcon} title="Attendance Trend"
            sub={`Monthly check-ins · ${SLICE_CONFIG[selectedPeriod].label}`}
            right={<GrowthPill pct={attendancePct} />}
          />
          <ResponsiveContainer width="100%" height={isMobile ? 200 : 260}>
            <LineChart data={attendanceTrend} margin={isMobile ? { top: 4, right: 4, left: -16, bottom: 0 } : undefined}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.line} vertical={false} />
              <XAxis dataKey="month" stroke={C.text3} tick={{ fontSize: isMobile ? 9 : 11, fill: C.text3 }}
                axisLine={false} tickLine={false} interval={isMobile ? 'preserveStartEnd' : 0} />
              <YAxis stroke={C.text3} tick={{ fontSize: isMobile ? 9 : 11, fill: C.text3 }} axisLine={false} tickLine={false}
                width={isMobile ? 28 : 40} />
              <Tooltip {...ttStyle} />
              <Line type="monotone" dataKey="checkins" stroke={C.ember} strokeWidth={2.5}
                dot={{ fill: C.ember, r: isMobile ? 3 : 4, strokeWidth: 0 }} activeDot={{ r: isMobile ? 5 : 6, fill: C.ember }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── metrics summary ── */}
      <div className="metrics-grid">

        {/* revenue metrics */}
        <div className="card chart-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18,
                        paddingBottom: 14, borderBottom: `1px solid ${C.line}` }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${C.ember}18`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={17} color={C.ember} />
            </div>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: 0 }}>Revenue Metrics</h3>
              <p style={{ fontSize: 11, color: C.text3, margin: '2px 0 0' }}>Financial performance · {SLICE_CONFIG[selectedPeriod].label}</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <StatRow label="Total Revenue"   value={fmt(totalRevenue)}       accent />
            <StatRow label="Monthly Average" value={fmt(averageMonthly)}     />
            <StatRow label="Best Month"      value={bestMonth.month}         sub={fmt(bestMonth.revenue)} />
            <StatRow label="Growth Rate"     value=""
              badge={
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 10px',
                              borderRadius: 99, background: growth >= 0 ? `${C.mint}1A` : `${C.red}1A` }}>
                  {growth >= 0
                    ? <ArrowUpRight size={13} color={C.mint} />
                    : <ArrowDownRight size={13} color={C.red} />}
                  <span style={{ fontSize: 13, fontWeight: 700, color: growth >= 0 ? C.mint : C.red }}>
                    {growth >= 0 ? '+' : ''}{growth}%
                  </span>
                </div>
              }
            />
          </div>
        </div>

        {/* member metrics */}
        <div className="card chart-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18,
                        paddingBottom: 14, borderBottom: `1px solid ${C.line}` }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${C.mint}18`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={17} color={C.mint} />
            </div>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: 0 }}>Member Metrics</h3>
              <p style={{ fontSize: 11, color: C.text3, margin: '2px 0 0' }}>Engagement overview · {SLICE_CONFIG[selectedPeriod].label}</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <StatRow label="Total Members"       value={totalMembers}             />
            <StatRow label="Active Members"       value={activeMembers}            accent />
            <StatRow label="Active Rate"          value=""         progress={activeRate} />
            <StatRow label="Revenue Per Member"   value={fmt(avgRevenuePerMember)} />
          </div>
        </div>
      </div>
    </div>
  )
}