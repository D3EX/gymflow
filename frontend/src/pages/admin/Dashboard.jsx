import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from "../../api/client"
import { useAuthStore } from "../../stores/authStore"
import {
  TrendingUp, Users, Calendar,
  DollarSign, Activity, RefreshCw,
  ChevronRight, UserPlus, Clock,
  Award, CheckCircle, PieChart as PieChartIcon,
  Gift, AlertTriangle, CreditCard,
  Cake, Coffee, Dumbbell, Tag, Shirt, Sparkles, Star, Search, UserCheck, X
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'
import toast from 'react-hot-toast'

/* ─── Custom Tooltip ──────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '10px',
      padding: '10px 14px',
      fontSize: '12px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.18)'
    }}>
      <p style={{ color: 'var(--text-2)', marginBottom: 6, fontWeight: 600 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, margin: '2px 0' }}>
          {p.name}: <strong>{p.name === 'Revenue' ? `${(p.value / 1000).toFixed(1)}k DZD` : p.value}</strong>
        </p>
      ))}
    </div>
  )
}

/* ─── Stat Card ───────────────────────────────────────────── */
const StatCard = ({ icon: Icon, iconColor, label, value, sub, subRed, subGreen }) => (
  <div className="stat-card" style={{
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '14px',
    padding: '18px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    transition: 'border-color .2s, transform .2s',
    cursor: 'default'
  }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = iconColor; e.currentTarget.style.transform = 'translateY(-2px)' }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)' }}
  >
    <div className="stat-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <div style={{
        width: 34, height: 34, borderRadius: '9px',
        background: `${iconColor}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
      }}>
        <Icon size={16} color={iconColor} />
      </div>
      <span className="stat-card-label" style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', textAlign: 'right' }}>{label}</span>
    </div>
    <div>
      <p className="stat-card-value" style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', lineHeight: 1, marginBottom: 6 }}>{value}</p>
      {sub && (
        <p className="stat-card-sub" style={{ fontSize: 11, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
          {subGreen && <span style={{ color: '#34d399', fontWeight: 600 }}>{subGreen}</span>}
          {subRed && <><span style={{ color: 'var(--text-3)' }}>/</span><span style={{ color: '#f87171', fontWeight: 600 }}>{subRed}</span></>}
          {!subGreen && !subRed && sub}
        </p>
      )}
    </div>
  </div>
)

/* ─── Section Header ──────────────────────────────────────── */
const SectionHeader = ({ icon: Icon, iconColor, title, right }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 10,
    marginBottom: 16, paddingBottom: 14,
    borderBottom: '1px solid var(--border)'
  }}>
    <div style={{
      width: 30, height: 30, borderRadius: 8,
      background: `${iconColor}15`,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <Icon size={14} color={iconColor} />
    </div>
    <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{title}</h3>
    {right && <div style={{ marginLeft: 'auto' }}>{right}</div>}
  </div>
)

/* ─── Pill Badge ──────────────────────────────────────────── */
const Pill = ({ text, color, bg }) => (
  <span style={{
    fontSize: 10, fontWeight: 600, padding: '3px 9px',
    borderRadius: 20, background: bg, color, letterSpacing: '0.02em'
  }}>{text}</span>
)

const statusPill = (status) => {
  const map = {
    active: { color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
    pending: { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
    expired: { color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
  }
  const s = map[status] || map.active
  return <Pill text={status} color={s.color} bg={s.bg} />
}

/* ═══════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [revenueData, setRevenueData] = useState([])
  const [recentMembers, setRecentMembers] = useState([])
  const [expiringSubs, setExpiringSubs] = useState([])
  const [topMembers, setTopMembers] = useState([])
  const [birthdays, setBirthdays] = useState([])
  const [loading, setLoading] = useState(true)
  const [chartPeriod, setChartPeriod] = useState('monthly')
  const [showGiftModal, setShowGiftModal] = useState(false)
  const [showAllBirthdays, setShowAllBirthdays] = useState(false)
  const [selectedBirthdayMember, setSelectedBirthdayMember] = useState(null)
  
  // Modal states
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const [showAttendanceModal, setShowAttendanceModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  
  // Form data states
  const [memberFormData, setMemberFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    age: '',
    weight: '',
    height: '',
    gender: 'male',
  })
  
  const [subscriptionFormData, setSubscriptionFormData] = useState({
    member_id: '',
    plan_id: '',
    start_date: new Date().toISOString().split('T')[0],
  })
  
  const [paymentFormData, setPaymentFormData] = useState({
    member_id: '',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    notes: '',
  })
  
  // Data for dropdowns
  const [members, setMembers] = useState([])
  const [plans, setPlans] = useState([])
  const [checkinMembers, setCheckinMembers] = useState([])
  const [checkingIn, setCheckingIn] = useState(false)
  const [selectedCheckinMember, setSelectedCheckinMember] = useState(null)
  const [searchMember, setSearchMember] = useState('')
  
  const { user } = useAuthStore()

  const giftOptions = [
    { id: 'free_days', name: '5 days free', icon: <Calendar size={18} />, description: 'Added to their membership', color: '#34d399', bg: 'rgba(52,211,153,0.08)' },
    { id: 'supplement', name: 'Supplement pack', icon: <Coffee size={18} />, description: 'Free protein or supplement', color: '#C56A2A', bg: 'rgba(251,113,33,0.08)' },
    { id: 'discount', name: '20% off renewal', icon: <Tag size={18} />, description: 'Applied to next payment', color: '#60a5fa', bg: 'rgba(96,165,250,0.08)' },
    { id: 'personal_training', name: 'Free PT session', icon: <Dumbbell size={18} />, description: '1-on-1 personal training', color: '#a78bfa', bg: 'rgba(167,139,250,0.08)' },
    { id: 'gym_merch', name: 'Gym merch', icon: <Shirt size={18} />, description: 'T-shirt or towel', color: '#fbbf24', bg: 'rgba(251,191,36,0.08)' },
    { id: 'smoothie', name: 'Free smoothie', icon: <Coffee size={18} />, description: 'At the gym café', color: '#34d399', bg: 'rgba(52,211,153,0.08)' },
  ]

  useEffect(() => { 
    fetchData()
    fetchMembersForModals()
    fetchPlans()
  }, [])

// frontend/src/pages/admin/Dashboard.jsx

// Replace the fetchData function with this updated version:

const fetchData = async () => {
  setLoading(true)
  try {
    const [statsRes, revenueRes, membersRes, subsRes] = await Promise.all([
      api.get('/dashboard/stats'),
      api.get('/payments/monthly-revenue'),
      api.get('/members'),
      api.get('/subscriptions/expiring?days=7'),
    ])
    
    setStats(statsRes.data)
    
    const allMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const existing = revenueRes.data || []
    setRevenueData(allMonths.map(month => {
      const e = existing.find(d => d.month === month)
      return { month, revenue: e?.revenue || 0, attendance: 0 }
    }))
    
    setRecentMembers(membersRes.data.slice(0, 5))
    
    // ✅ FIX: Properly handle expiring subscriptions
    console.log('📊 Raw expiring subscriptions:', subsRes.data)
    
    const today = new Date()
    const expiringData = subsRes.data || []
    
    // Format the expiring subscriptions
    const formattedExpiring = expiringData
      .filter(sub => {
        if (!sub.end_date) return false
        const endDate = new Date(sub.end_date)
        const days = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24))
        return days > 0 && days <= 7 && sub.status === 'active'
      })
      .map(sub => ({
        id: sub.id,
        member_id: sub.member_id,
        member_name: sub.member_name || sub.member?.user?.name || 'Unknown Member',
        plan: sub.plan || sub.plan_name || 'Plan',
        end_date: sub.end_date,
        daysLeft: Math.ceil((new Date(sub.end_date) - today) / (1000 * 60 * 60 * 24)),
        amount: sub.amount || sub.plan?.price || 0,
        status: sub.status,
        member: sub.member
      }))
    
    console.log('📊 Formatted expiring subscriptions:', formattedExpiring)
    setExpiringSubs(formattedExpiring)
    
    await fetchTopActiveMembers()
    await fetchRealBirthdays()
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    toast.error('Failed to load dashboard data')
  } finally {
    setLoading(false)
  }
}

  const fetchMembersForModals = async () => {
    try {
      const response = await api.get('/members')
      setMembers(response.data)
      setCheckinMembers(response.data)
    } catch (error) {
      console.error('Failed to fetch members')
    }
  }

  const fetchPlans = async () => {
    try {
      const response = await api.get('/plans')
      setPlans(response.data)
    } catch (error) {
      console.error('Failed to fetch plans')
    }
  }

  const fetchTopActiveMembers = async () => {
    try {
      const [attendanceRes, membersRes] = await Promise.all([api.get('/attendance'), api.get('/members')])
      const counts = {}
      attendanceRes.data.forEach(r => { counts[r.member_id] = (counts[r.member_id] || 0) + 1 })
      setTopMembers(membersRes.data.map(m => ({ id: m.id, name: m.user.name, visits: counts[m.id] || 0 }))
        .sort((a, b) => b.visits - a.visits).slice(0, 3))
    } catch { setTopMembers([]) }
  }

  const fetchRealBirthdays = async () => {
    try {
      const today = new Date()
      const res = await api.get('/members')
      setBirthdays(res.data.filter(m => {
        if (!m.date_of_birth) return false
        const d = new Date(m.date_of_birth)
        return d.getMonth() === today.getMonth() && d.getDate() === today.getDate()
      }).map(m => ({ id: m.id, name: m.user.name, day: 'Today', membership: 'Active', email: m.user.email, isReal: true })))
    } catch { setBirthdays([]) }
  }

  const fmt = (v) => new Intl.NumberFormat('en-DZ', { style: 'currency', currency: 'DZD', minimumFractionDigits: 0 }).format(v)

  const handleWish = (member) => { setSelectedBirthdayMember(member); setShowGiftModal(true) }

  const handleSendGift = async (gift) => {
    toast.success(`Gift sent to ${selectedBirthdayMember.name} — ${gift.name}`)
    if (selectedBirthdayMember.isReal) {
      try { await api.post(`/notifications/birthday/${selectedBirthdayMember.id}?gift_type=${gift.id}`) } catch {}
    }
    setBirthdays(birthdays.filter(b => b.id !== selectedBirthdayMember.id))
    setShowGiftModal(false); setSelectedBirthdayMember(null)
  }

  const handleSendWishesOnly = async () => {
    toast.success(`Birthday wishes sent to ${selectedBirthdayMember.name}!`)
    if (selectedBirthdayMember.isReal) {
      try { await api.post(`/notifications/birthday/${selectedBirthdayMember.id}`) } catch {}
    }
    setBirthdays(birthdays.filter(b => b.id !== selectedBirthdayMember.id))
    setShowGiftModal(false); setSelectedBirthdayMember(null)
  }

  const handleWishAll = async () => {
    toast.success(`Sending wishes to all ${birthdays.length} members!`)
    for (const b of birthdays) {
      if (b.isReal) try { await api.post(`/notifications/birthday/${b.id}`) } catch {}
    }
    setBirthdays([]); setShowAllBirthdays(false)
  }

  // Member CRUD operations
  const handleMemberSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/members', {
        name: memberFormData.name,
        email: memberFormData.email,
        password: memberFormData.password,
        phone: memberFormData.phone,
        age: parseInt(memberFormData.age) || null,
        weight: parseFloat(memberFormData.weight) || null,
        height: parseFloat(memberFormData.height) || null,
        gender: memberFormData.gender,
      })
      toast.success('Member created successfully')
      setShowMemberModal(false)
      setMemberFormData({
        name: '',
        email: '',
        password: '',
        phone: '',
        age: '',
        weight: '',
        height: '',
        gender: 'male',
      })
      fetchData()
      fetchMembersForModals()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create member')
    }
  }

  const handleMemberChange = (e) => {
    setMemberFormData({ ...memberFormData, [e.target.name]: e.target.value })
  }

  // Subscription operations
  const handleSubscriptionSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/subscriptions', {
        ...subscriptionFormData,
        member_id: parseInt(subscriptionFormData.member_id),
        plan_id: parseInt(subscriptionFormData.plan_id),
      })
      toast.success('Subscription created successfully')
      setShowSubscriptionModal(false)
      setSubscriptionFormData({
        member_id: '',
        plan_id: '',
        start_date: new Date().toISOString().split('T')[0],
      })
      fetchData()
    } catch (error) {
      toast.error('Failed to create subscription')
    }
  }

  // Attendance check-in
  const handleCheckIn = async () => {
    if (!selectedCheckinMember) {
      toast.error('Please select a member')
      return
    }
    
    setCheckingIn(true)
    try {
      await api.post('/attendance', { member_id: selectedCheckinMember.id })
      toast.success(`${selectedCheckinMember.user.name} checked in successfully`)
      fetchData()
      setSelectedCheckinMember(null)
      setSearchMember('')
      setShowAttendanceModal(false)
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to record check-in')
    } finally {
      setCheckingIn(false)
    }
  }

  // Payment operations
  const handlePaymentSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/payments', {
        ...paymentFormData,
        member_id: parseInt(paymentFormData.member_id),
        amount: parseFloat(paymentFormData.amount),
      })
      toast.success('Payment recorded successfully')
      setShowPaymentModal(false)
      setPaymentFormData({
        member_id: '',
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'cash',
        notes: '',
      })
      fetchData()
    } catch (error) {
      toast.error('Failed to record payment')
    }
  }

  const filteredCheckinMembers = checkinMembers.filter(member => 
    member.user.name.toLowerCase().includes(searchMember.toLowerCase()) ||
    member.user.email.toLowerCase().includes(searchMember.toLowerCase())
  )

  const membershipData = [
    { name: 'Monthly', value: 45, color: '#C56A2A' },
    { name: '3 Months', value: 30, color: '#34d399' },
    { name: '6 Months', value: 15, color: '#60a5fa' },
    { name: 'Yearly', value: 10, color: '#fbbf24' },
  ]

  const weeklyData = [
    { day: 'Mon', revenue: 12500, attendance: 45 },
    { day: 'Tue', revenue: 14800, attendance: 52 },
    { day: 'Wed', revenue: 13200, attendance: 48 },
    { day: 'Thu', revenue: 15600, attendance: 58 },
    { day: 'Fri', revenue: 18900, attendance: 65 },
    { day: 'Sat', revenue: 16700, attendance: 62 },
    { day: 'Sun', revenue: 14200, attendance: 51 },
  ]

  const dailyData = [
    { hour: '6am', revenue: 3200, attendance: 12 },
    { hour: '9am', revenue: 8500, attendance: 34 },
    { hour: '12pm', revenue: 12400, attendance: 48 },
    { hour: '3pm', revenue: 15600, attendance: 62 },
    { hour: '6pm', revenue: 18900, attendance: 78 },
    { hour: '9pm', revenue: 14300, attendance: 56 },
  ]

  const chartData = chartPeriod === 'daily' ? dailyData : chartPeriod === 'weekly' ? weeklyData : revenueData
  const chartXKey = chartPeriod === 'daily' ? 'hour' : chartPeriod === 'weekly' ? 'day' : 'month'
  const chartTitle = chartPeriod === 'daily' ? 'Hourly overview' : chartPeriod === 'weekly' ? 'Weekly overview' : 'Monthly overview'
  const totalRevenue = revenueData.reduce((s, i) => s + (i.revenue || 0), 0)

  if (loading) return <div className="loading"><div className="spinner" /></div>

  const medalColor = ['#fbbf24', '#94a3b8', '#cd7f32']

  return (
    <div className="dashboard-root">
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }

        /* ── Stat cards grid ── */
        .stat-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin-bottom: 24px;
        }


        /* ── Three-col section row ── */
        .three-col {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 16px;
        }

        /* ── Two-col section row ── */
        .two-col {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-bottom: 12px;
        }

        /* ── Chart header ── */
        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 22px;
          flex-wrap: wrap;
          gap: 10px;
        }

        /* ── Action buttons row ── */
        .action-buttons {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        /* ── Tablet (≤ 900px) ── */
        @media (max-width: 900px) {
          .three-col {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        /* ── Mobile (≤ 600px) ── */
        @media (max-width: 600px) {
          .chart-card {
            padding: 14px 12px !important;
          }
          .chart-legend {
            gap: 12px;
            margin-bottom: 10px !important;
          }
          .chart-legend span {
            font-size: 10px !important;
          }
          .chart-header h3 {
            font-size: 13px !important;
          }
          .chart-header p {
            font-size: 11px !important;
          }
          /* Period toggle buttons — smaller on mobile */
          .chart-header button {
            padding: 4px 8px !important;
            font-size: 11px !important;
          }
          .stat-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }

          /* Stat card internals — compact, icon+label on same row */
          .stat-card {
            padding: 12px 10px !important;
            gap: 8px !important;
          }
          .stat-card-header {
            flex-direction: row !important;
            align-items: center !important;
            justify-content: flex-start !important;
            gap: 6px !important;
          }
          .stat-card-label {
            font-size: 9px !important;
            letter-spacing: 0.02em !important;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .stat-card-value {
            font-size: 20px !important;
          }
          .stat-card-sub {
            font-size: 10px !important;
          }

          .three-col {
            grid-template-columns: 1fr;
          }

          .two-col {
            grid-template-columns: 1fr;
          }

          .action-buttons {
            width: 100%;
          }

          .action-buttons .btn {
            flex: 1 1 calc(50% - 4px);
            justify-content: center;
            font-size: 11px;
          }

          .chart-header {
            flex-wrap: nowrap;
            align-items: center;
            gap: 8px;
          }
        }


      `}</style>
      {/* ── Page header ─────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p style={{ fontSize: 11, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, margin: '0 0 6px' }}>
            Overview
          </p>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)', margin: 0, lineHeight: 1.15 }}>Dashboard</h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)', margin: '4px 0 0' }}>
            Track members, revenue, and activity at a glance
          </p>
        </div>
        <div className="action-buttons">
          <button onClick={() => setShowMemberModal(true)} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <UserPlus size={13} /> Add member
          </button>
          <button onClick={() => setShowSubscriptionModal(true)} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <CreditCard size={13} /> New subscription
          </button>
          <button onClick={() => setShowPaymentModal(true)} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <DollarSign size={13} /> Record payment
          </button>
          <button onClick={() => setShowAttendanceModal(true)} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <CheckCircle size={13} /> Check-in
          </button>
        </div>
      </div>

      {/* ── Stat cards ──────────────────────────────────── */}
      <div className="stat-grid">
        <StatCard icon={Users} iconColor="#C56A2A" label="Members" value={stats?.total_members || 0}
          sub="active / expired"
          subGreen={`${stats?.active_subscriptions || 0} active`}
          subRed={`${stats?.expired_subscriptions || 0} expired`} />
        <StatCard icon={DollarSign} iconColor="#34d399" label="Revenue MTD"
          value={fmt(stats?.monthly_revenue || 0)}
          sub={`${fmt(totalRevenue)} YTD`} />
        <StatCard icon={Calendar} iconColor="#fbbf24" label="Today's check-ins"
          value={stats?.todays_attendance || 0}
          sub="visits today" />
        <StatCard icon={CreditCard} iconColor="#60a5fa" label="Active memberships"
          value={stats?.active_subscriptions || 0}
          sub={`${expiringSubs.length} expiring within 7 days`} />
        <StatCard icon={TrendingUp} iconColor="#a78bfa" label="New this month"
          value={stats?.new_registrations_this_month || 0}
          sub="new registrations" />
        <StatCard icon={Award} iconColor="#fbbf24" label="Staff"
          value={stats?.total_staff || 0}
          sub="active team members" />
      </div>

      {/* ── Revenue chart ────────────────────────────────── */}
      <div className="chart-card" style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 16, padding: '22px 24px', marginBottom: 24
      }}>
        <div className="chart-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9,
              background: 'rgba(251,113,33,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <TrendingUp size={16} color="#C56A2A" />
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Revenue &amp; attendance</h3>
              <p style={{ fontSize: 12, color: 'var(--text-2)', margin: '3px 0 0' }}>{chartTitle}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4, background: 'var(--surface-2)', borderRadius: 9, padding: 3 }}>
            {['daily', 'weekly', 'monthly'].map(p => (
              <button key={p} onClick={() => setChartPeriod(p)} style={{
                padding: '5px 12px', borderRadius: 7, border: 'none',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: chartPeriod === p ? '#C56A2A' : 'transparent',
                color: chartPeriod === p ? '#fff' : 'var(--text-2)',
                transition: 'all .15s'
              }}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="chart-legend" style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: '#C56A2A' }} />
            <span style={{ fontSize: 11, color: 'var(--text-2)' }}>Revenue (DZD)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: '#34d399' }} />
            <span style={{ fontSize: 11, color: 'var(--text-2)' }}>Attendance</span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={typeof window !== "undefined" && window.innerWidth < 600 ? 180 : 260}>
          <BarChart data={chartData} barGap={4} barCategoryGap="28%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey={chartXKey} stroke="transparent" tick={{ fontSize: 11, fill: 'var(--text-2)' }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" stroke="transparent" tick={{ fontSize: 11, fill: 'var(--text-2)' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
            <YAxis yAxisId="right" orientation="right" stroke="transparent" tick={{ fontSize: 11, fill: 'var(--text-2)' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill="#C56A2A" radius={[5, 5, 0, 0]} />
            <Bar yAxisId="right" dataKey="attendance" name="Attendance" fill="#34d399" radius={[5, 5, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Three-column row ─────────────────────────────── */}
      <div className="three-col">
        {/* Most active members */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <SectionHeader icon={Award} iconColor="#C56A2A" title="Most active"
            right={<span style={{ fontSize: 11, color: 'var(--text-3)' }}>This month</span>} />
          <div style={{ flex: 1 }}>
            {topMembers.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {topMembers.map((m, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px', borderRadius: 10,
                    background: i === 0 ? 'rgba(251,191,36,0.06)' : 'transparent',
                    border: i === 0 ? '1px solid rgba(251,191,36,0.15)' : '1px solid transparent',
                  }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                      background: `${medalColor[i]}22`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 700, color: medalColor[i]
                    }}>{i + 1}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: 0 }}>{m.name}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-3)', margin: 0 }}>ID #{m.id}</p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: 16, fontWeight: 700, color: '#C56A2A', margin: 0, lineHeight: 1 }}>{m.visits}</p>
                      <p style={{ fontSize: 10, color: 'var(--text-3)', margin: '2px 0 0' }}>visits</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '28px 0' }}>
                <Activity size={28} color="var(--text-3)" style={{ margin: '0 auto 10px', opacity: .4 }} />
                <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>No activity yet</p>
              </div>
            )}
          </div>
          {topMembers.length > 0 && (
            <p style={{ fontSize: 10, color: 'var(--text-3)', textAlign: 'center', marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--border)', marginBottom: 0 }}>
              Ranked by total check-ins
            </p>
          )}
        </div>

        {/* Birthdays today */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <SectionHeader icon={Gift} iconColor="#34d399" title="Birthdays today"
            right={birthdays.length > 3 ? <button onClick={() => setShowAllBirthdays(true)} style={{ fontSize: 11, color: '#C56A2A', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>View all ({birthdays.length})</button> : null} />
          <div style={{ flex: 1 }}>
            {birthdays.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {birthdays.slice(0, 3).map(b => (
                  <div key={b.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 10,
                    background: 'rgba(52,211,153,0.05)',
                    border: '1px solid rgba(52,211,153,0.15)'
                  }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                      background: 'rgba(251,113,33,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Gift size={15} color="#C56A2A" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: 0 }}>{b.name}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-3)', margin: 0 }}>Birthday today</p>
                    </div>
                    <button onClick={() => handleWish(b)} style={{
                      flexShrink: 0, padding: '6px 12px',
                      borderRadius: 8, border: 'none',
                      background: '#C56A2A', color: '#fff',
                      fontSize: 11, fontWeight: 600, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}>
                      <Gift size={12} /> Send gift
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '28px 0' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(96,165,250,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <Gift size={20} color="#60a5fa" style={{ opacity: .5 }} />
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>No birthdays today</p>
              </div>
            )}
          </div>
          {birthdays.length > 3 && (
            <button onClick={() => setShowAllBirthdays(true)} style={{
              width: '100%', padding: '8px 0', borderRadius: 8, marginTop: 14,
              border: '1px dashed var(--border)', background: 'none',
              color: 'var(--text-2)', fontSize: 12, cursor: 'pointer',
            }}>
              + {birthdays.length - 3} more
            </button>
          )}
        </div>

        {/* Plan distribution */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px' }}>
          <SectionHeader icon={PieChartIcon} iconColor="#60a5fa" title="Plan distribution"
            right={<span style={{ fontSize: 11, color: 'var(--text-3)' }}>Active members</span>} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="130" height="130" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" fill="none" stroke="#C56A2A" strokeWidth="14"
                  strokeDasharray="107.44 131.32" strokeDashoffset="0" transform="rotate(-90 50 50)" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#34d399" strokeWidth="14"
                  strokeDasharray="71.63 167.13" strokeDashoffset="-107.44" transform="rotate(-90 50 50)" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#60a5fa" strokeWidth="14"
                  strokeDasharray="35.81 202.95" strokeDashoffset="-179.07" transform="rotate(-90 50 50)" />
                <circle cx="50" cy="50" r="38" fill="none" stroke="#fbbf24" strokeWidth="14"
                  strokeDasharray="23.88 214.88" strokeDashoffset="-214.88" transform="rotate(-90 50 50)" />
                <circle cx="50" cy="50" r="26" fill="var(--surface)" />
                <text x="50" y="47" textAnchor="middle" fill="var(--text)" fontSize="10" fontWeight="700">{stats?.active_subscriptions || 0}</text>
                <text x="50" y="58" textAnchor="middle" fill="#888" fontSize="7">members</text>
              </svg>
            </div>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {membershipData.map(item => (
                <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: item.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{item.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 60, height: 4, background: 'var(--surface-2)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ width: `${item.value}%`, height: '100%', background: item.color, borderRadius: 99 }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: item.color, minWidth: 28, textAlign: 'right' }}>{item.value}%</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ width: '100%', paddingTop: 10, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Most popular plan</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#C56A2A' }}>Monthly</span>
            </div>
          </div>
        </div>
      </div>

      <div className="two-col">
        {/* Recent members */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <SectionHeader icon={Users} iconColor="#C56A2A" title="Recent members"
            right={<Pill text="Last 5 joined" color="var(--text-2)" bg="var(--surface-2)" />} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {(recentMembers.length > 0 ? recentMembers : []).map((m, i) => {
                const name = m.user?.name || '?'
                const email = m.user?.email || ''
                const status = m.status || 'active'
                return (
                  <div key={m.id || i} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px', borderRadius: 10, cursor: 'default',
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg, #C56A2A 0%, #ff9a56 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 700, color: '#fff'
                    }}>{name[0].toUpperCase()}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: 0 }}>{name}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-3)', margin: 0 }}>{email}</p>
                    </div>
                    {statusPill(status)}
                  </div>
                )
              })}
            </div>
          </div>
          <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
            <Link to="/dashboard/members" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              fontSize: 11, color: 'var(--text-2)', fontWeight: 500, textDecoration: 'none',
            }}>
              View all members <ChevronRight size={12} />
            </Link>
          </div>
        </div>

{/* Expiring soon */}
<div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '20px', display: 'flex', flexDirection: 'column', height: '100%' }}>
  <SectionHeader icon={AlertTriangle} iconColor="#C56A2A" title="Expiring soon"
    right={<Pill text={`${expiringSubs.length} members`} color="#C56A2A" bg="rgba(251,113,33,0.1)" />} />
  
  <div style={{ flex: 1 }}>
    {expiringSubs.length > 0 ? (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {expiringSubs.slice(0, 5).map((sub, i) => {
          const days = sub.daysLeft || 0
          const isUrgent = days <= 3
          const accent = isUrgent ? '#C56A2A' : '#34d399'
          const memberName = sub.member_name || sub.member?.user?.name || 'Member'
          const plan = sub.plan || 'Plan'
          const amount = sub.amount || 0
          
          return (
            <div key={sub.id || i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 10px',
              borderRadius: '8px',
              background: isUrgent ? 'rgba(251,113,33,0.04)' : 'transparent',
              border: isUrgent ? '1px solid rgba(251,113,33,0.08)' : '1px solid transparent',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: `linear-gradient(135deg, ${accent} 0%, ${accent}80 100%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: '#fff'
              }}>{memberName.charAt(0).toUpperCase()}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{memberName}</p>
                  <span style={{ fontSize: 8, fontWeight: 500, padding: '1px 6px', borderRadius: 4, background: `${accent}15`, color: accent }}>{plan}</span>
                </div>
                <p style={{ fontSize: 10, color: 'var(--text-3)', margin: 0 }}>
                  Expires in <strong style={{ color: accent }}>{days} days</strong>
                  {days <= 3 && <span style={{ marginLeft: 4, fontSize: 8, color: '#C56A2A' }}>⚠️</span>}
                </p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                  {amount > 0 ? `${amount.toLocaleString()} DZD` : '—'}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    ) : (
      <div style={{ textAlign: 'center', padding: '28px 0' }}>
        <CheckCircle size={28} color="#34d399" style={{ margin: '0 auto 10px', opacity: .6 }} />
        <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>No expiring memberships</p>
        <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>All memberships are up to date</p>
      </div>
    )}
  </div>
  
  <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
    <Link to="/dashboard/subscriptions" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      fontSize: 11, color: 'var(--text-2)', fontWeight: 500, textDecoration: 'none',
    }}>
      View all subscriptions <ChevronRight size={12} />
    </Link>
  </div>
</div>
      </div>

      {/* ── Member Modal ────────────────────────────────────── */}
      {showMemberModal && (
        <div className="modal-overlay" onClick={() => setShowMemberModal(false)}>
          <div className="modal" style={{ maxWidth: 600, width: '90%' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(251,113,33,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserPlus size={16} color="#C56A2A" />
                </div>
                <h2 className="modal-title" style={{ margin: 0, fontSize: 16 }}>Add New Member</h2>
              </div>
              <button onClick={() => setShowMemberModal(false)} className="modal-close">×</button>
            </div>
            <form onSubmit={handleMemberSubmit}>
              <div className="grid-2" style={{ gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input type="text" name="name" value={memberFormData.name} onChange={handleMemberChange} className="form-input" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input type="email" name="email" value={memberFormData.email} onChange={handleMemberChange} className="form-input" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <input type="password" name="password" value={memberFormData.password} onChange={handleMemberChange} className="form-input" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input type="text" name="phone" value={memberFormData.phone} onChange={handleMemberChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Age</label>
                  <input type="number" name="age" value={memberFormData.age} onChange={handleMemberChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Weight (kg)</label>
                  <input type="number" step="0.1" name="weight" value={memberFormData.weight} onChange={handleMemberChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Height (cm)</label>
                  <input type="number" step="0.1" name="height" value={memberFormData.height} onChange={handleMemberChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select name="gender" value={memberFormData.gender} onChange={handleMemberChange} className="form-input">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3" style={{ marginTop: '24px' }}>
                <button type="submit" className="btn btn-primary">Create Member</button>
                <button type="button" onClick={() => setShowMemberModal(false)} className="btn btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Subscription Modal ────────────────────────────────── */}
      {showSubscriptionModal && (
        <div className="modal-overlay" onClick={() => setShowSubscriptionModal(false)}>
          <div className="modal" style={{ maxWidth: 500, width: '90%' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(52,211,153,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CreditCard size={16} color="#34d399" />
                </div>
                <h2 className="modal-title" style={{ margin: 0, fontSize: 16 }}>New Subscription</h2>
              </div>
              <button onClick={() => setShowSubscriptionModal(false)} className="modal-close">×</button>
            </div>
            <form onSubmit={handleSubscriptionSubmit}>
              <div className="form-group mb-4">
                <label className="form-label">Member *</label>
                <select value={subscriptionFormData.member_id} onChange={(e) => setSubscriptionFormData({ ...subscriptionFormData, member_id: e.target.value })} className="form-input" required>
                  <option value="">Select member...</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>{member.user.name} - {member.user.email}</option>
                  ))}
                </select>
              </div>
              <div className="form-group mb-4">
                <label className="form-label">Plan *</label>
                <select value={subscriptionFormData.plan_id} onChange={(e) => setSubscriptionFormData({ ...subscriptionFormData, plan_id: e.target.value })} className="form-input" required>
                  <option value="">Select plan...</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>{plan.name} - {plan.price} DZD ({plan.duration_days} days)</option>
                  ))}
                </select>
              </div>
              <div className="form-group mb-6">
                <label className="form-label">Start Date *</label>
                <input type="date" value={subscriptionFormData.start_date} onChange={(e) => setSubscriptionFormData({ ...subscriptionFormData, start_date: e.target.value })} className="form-input" required />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn btn-primary">Create Subscription</button>
                <button type="button" onClick={() => setShowSubscriptionModal(false)} className="btn btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Attendance Check-in Modal ──────────────────────────── */}
      {showAttendanceModal && (
        <div className="modal-overlay" onClick={() => setShowAttendanceModal(false)}>
          <div className="modal" style={{ maxWidth: 500, width: '90%' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(251,113,33,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserCheck size={16} color="#C56A2A" />
                </div>
                <h2 className="modal-title" style={{ margin: 0, fontSize: 16 }}>Check In Member</h2>
              </div>
              <button onClick={() => setShowAttendanceModal(false)} className="modal-close">×</button>
            </div>
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label">Find Member</label>
              <div className="search-wrap">
                <Search size={16} />
                <input type="text" placeholder="Search by name or email..." value={searchMember} onChange={(e) => setSearchMember(e.target.value)} className="form-input" autoFocus />
              </div>
            </div>
            <div style={{ maxHeight: 400, overflowY: 'auto', marginBottom: '20px' }}>
              {filteredCheckinMembers.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {filteredCheckinMembers.map((member) => (
                    <div key={member.id} onClick={() => setSelectedCheckinMember(member)} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '12px',
                      borderRadius: 10, cursor: 'pointer',
                      background: selectedCheckinMember?.id === member.id ? 'rgba(251,113,33,0.1)' : 'var(--surface-2)',
                      border: selectedCheckinMember?.id === member.id ? '1px solid #C56A2A' : '1px solid transparent'
                    }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%',
                        background: selectedCheckinMember?.id === member.id ? '#C56A2A' : 'var(--surface-3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 700, color: selectedCheckinMember?.id === member.id ? '#fff' : '#C56A2A'
                      }}>{member.user.name.charAt(0).toUpperCase()}</div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{member.user.name}</p>
                        <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>{member.user.email}</p>
                      </div>
                      {selectedCheckinMember?.id === member.id && <CheckCircle size={18} color="#C56A2A" />}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <p style={{ color: 'var(--text-3)' }}>No members found</p>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={handleCheckIn} className="btn btn-primary flex-1" disabled={!selectedCheckinMember || checkingIn}>
                {checkingIn ? 'Checking in...' : 'Check In'}
              </button>
              <button onClick={() => setShowAttendanceModal(false)} className="btn btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Payment Modal ────────────────────────────────────── */}
      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal" style={{ maxWidth: 500, width: '90%' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(96,165,250,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <DollarSign size={16} color="#60a5fa" />
                </div>
                <h2 className="modal-title" style={{ margin: 0, fontSize: 16 }}>Record Payment</h2>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="modal-close">×</button>
            </div>
            <form onSubmit={handlePaymentSubmit}>
              <div className="form-group mb-4">
                <label className="form-label">Member *</label>
                <select value={paymentFormData.member_id} onChange={(e) => setPaymentFormData({ ...paymentFormData, member_id: e.target.value })} className="form-input" required>
                  <option value="">Select member...</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>{member.user.name} - {member.user.email}</option>
                  ))}
                </select>
              </div>
              <div className="form-group mb-4">
                <label className="form-label">Amount (DZD) *</label>
                <input type="number" step="0.01" value={paymentFormData.amount} onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: e.target.value })} className="form-input" required />
              </div>
              <div className="form-group mb-4">
                <label className="form-label">Payment Date *</label>
                <input type="date" value={paymentFormData.payment_date} onChange={(e) => setPaymentFormData({ ...paymentFormData, payment_date: e.target.value })} className="form-input" required />
              </div>
              <div className="form-group mb-4">
                <label className="form-label">Payment Method</label>
                <select value={paymentFormData.payment_method} onChange={(e) => setPaymentFormData({ ...paymentFormData, payment_method: e.target.value })} className="form-input">
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>
              <div className="form-group mb-6">
                <label className="form-label">Notes</label>
                <textarea value={paymentFormData.notes} onChange={(e) => setPaymentFormData({ ...paymentFormData, notes: e.target.value })} className="form-input" rows="2" />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn btn-primary">Record Payment</button>
                <button type="button" onClick={() => setShowPaymentModal(false)} className="btn btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── All birthdays modal ──────────────────────────── */}
      {showAllBirthdays && birthdays.length > 0 && (
        <div className="modal-overlay" onClick={() => setShowAllBirthdays(false)}>
          <div className="modal" style={{ maxWidth: 500, width: '90%' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(251,113,33,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Gift size={16} color="#C56A2A" />
                </div>
                <div>
                  <h2 className="modal-title" style={{ margin: 0, fontSize: 16 }}>Birthday celebrations</h2>
                  <p style={{ fontSize: 11, color: 'var(--text-3)', margin: '2px 0 0' }}>{birthdays.length} member{birthdays.length !== 1 ? 's' : ''} today</p>
                </div>
              </div>
              <button onClick={() => setShowAllBirthdays(false)} className="modal-close">×</button>
            </div>
            <div style={{ maxHeight: 380, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {birthdays.map(b => (
                <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, background: 'rgba(52,211,153,0.04)', border: '1px solid rgba(52,211,153,0.12)' }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(251,113,33,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Gift size={16} color="#C56A2A" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: 0 }}>{b.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-3)', margin: '2px 0 0' }}>{b.email}</p>
                  </div>
                  <button onClick={() => { setShowAllBirthdays(false); handleWish(b) }} style={{
                    padding: '6px 14px', borderRadius: 8, border: 'none',
                    background: '#C56A2A', color: '#fff',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0
                  }}>
                    <Gift size={12} /> Wish
                  </button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
              <button onClick={handleWishAll} className="btn btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Gift size={13} /> Wish all ({birthdays.length})
              </button>
              <button onClick={() => setShowAllBirthdays(false)} className="btn btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Gift modal ───────────────────────────────────── */}
      {showGiftModal && selectedBirthdayMember && (
        <div className="modal-overlay" onClick={() => setShowGiftModal(false)}>
          <div className="modal" style={{ maxWidth: 580, width: '90%' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(251,113,33,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Gift size={18} color="#C56A2A" />
                </div>
                <div>
                  <h2 className="modal-title" style={{ margin: 0, fontSize: 15 }}>Choose a gift for {selectedBirthdayMember.name}</h2>
                  <p style={{ fontSize: 11, color: 'var(--text-3)', margin: '3px 0 0' }}>Select a gift to celebrate their special day</p>
                </div>
              </div>
              <button onClick={() => setShowGiftModal(false)} className="modal-close">×</button>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px', borderRadius: 12, marginBottom: 20,
              background: 'rgba(251,113,33,0.06)',
              border: '1px solid rgba(251,113,33,0.18)'
            }}>
              <Cake size={22} color="#C56A2A" />
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: 0 }}> Happy birthday, {selectedBirthdayMember.name}!</p>
                <p style={{ fontSize: 11, color: 'var(--text-3)', margin: '2px 0 0' }}>Pick a gift to send alongside your wishes</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 20 }}>
              {giftOptions.map(g => (
                <button key={g.id} onClick={() => handleSendGift(g)} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px',
                  background: g.bg, border: `1px solid ${g.color}22`,
                  borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: `${g.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: g.color, flexShrink: 0 }}>
                    {g.icon}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', margin: 0 }}>{g.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-3)', margin: '2px 0 0' }}>{g.description}</p>
                  </div>
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 14, borderTop: '1px solid var(--border)' }}>
              <button onClick={() => setShowGiftModal(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleSendWishesOnly} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={13} /> Send wishes only
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}