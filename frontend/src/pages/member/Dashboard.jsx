// frontend/src/pages/member/Dashboard.jsx

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/client'
import { useAuthStore } from '../../stores/authStore'
import {
  User, CreditCard, Award, Bell,
  UserCheck, Crown, Activity, ArrowRight, CheckCircle,
  TrendingUp, Flame, Target, Calendar, Clock,
  Dumbbell, Zap, Coffee,
  BarChart3
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'

function StatCard({ icon: Icon, iconColor, label, value, sub }) {
  return (
    <div className="stat-card" style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '14px',
      padding: '18px',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
      position: 'relative',
      overflow: 'hidden',
      transition: 'border-color 0.2s, transform 0.2s',
      cursor: 'default',
      minWidth: 0,
    }}
    onMouseEnter={e => {
      e.currentTarget.style.transform = 'translateY(-2px)'
      e.currentTarget.style.borderColor = iconColor
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.borderColor = 'var(--border)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '10px',
          background: `${iconColor}1F`, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Icon size={18} color={iconColor} />
        </div>
        <span style={{ fontSize: '10.5px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
          {label}
        </span>
      </div>
      <div style={{ minWidth: 0 }}>
        <p className="stat-value" style={{ fontSize: '26px', fontWeight: 800, lineHeight: 1, letterSpacing: '-0.02em', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value}
        </p>
        <p className="stat-sub" style={{ fontSize: '11.5px', color: 'var(--text-3)', marginTop: '6px' }}>{sub}</p>
      </div>
    </div>
  )
}

function QuickAction({ to, icon: Icon, iconColor, label }) {
  const [hover, setHover] = useState(false)
  return (
    <Link
      to={to}
      className="quick-action-btn"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '13px 14px', borderRadius: '10px',
        background: hover ? 'var(--accent-glow)' : 'var(--surface-2)',
        border: `1px solid ${hover ? 'var(--accent)' : 'var(--border)'}`,
        textDecoration: 'none', color: 'var(--text)',
        transition: 'all 0.15s ease',
      }}
    >
      <div style={{
        width: '32px', height: '32px', borderRadius: '9px',
        background: `${iconColor}1F`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
      }}>
        <Icon size={15} color={iconColor} />
      </div>
      <span style={{ fontSize: '13px', fontWeight: 600, flex: 1 }}>{label}</span>
      <ArrowRight size={14} color="var(--text-3)" />
    </Link>
  )
}

function CustomTooltip({ active, payload, label }) {
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
      <p style={{ color: 'var(--text-2)', marginBottom: '4px', fontWeight: 600 }}>{label}</p>
      <p style={{ color: 'var(--accent)', margin: 0 }}>Check-ins: <strong>{payload[0]?.value || 0}</strong></p>
    </div>
  )
}

export default function MemberDashboard() {
  const [memberData, setMemberData] = useState(null)
  const [attendance, setAttendance] = useState([])
  const [weeklyData, setWeeklyData] = useState([])
  const [upcomingClasses, setUpcomingClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalCheckins: 0,
    thisMonth: 0,
    streak: 0,
    daysLeft: 0,
    isActive: false,
    planName: '—',
    planPrice: 0,
    todayCheckins: 0
  })
  const { user } = useAuthStore()
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  )

  useEffect(() => { 
    fetchMemberData() 
  }, [])

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const fetchMemberData = async () => {
    setLoading(true)
    try {
      const memberRes = await api.get('/members/my')
      const attendanceRes = await api.get('/attendance/my')
      
      try {
        const classesRes = await api.get('/schedule/classes')
        const mappedClasses = (classesRes.data || []).map(cls => ({
          id: cls.id,
          name: cls.name,
          coach: cls.coach,
          time: cls.time,
          end_time: cls.end_time,
          day: cls.day_of_week,
          day_of_week: cls.day_of_week,
          spots: cls.spots_left,
          spots_left: cls.spots_left,
          max_capacity: cls.max_capacity,
          location: cls.location,
          type: cls.type
        }))
        setUpcomingClasses(mappedClasses)
      } catch (error) {
        console.error('Failed to fetch classes:', error)
        setUpcomingClasses([])
      }
      
      const member = memberRes.data
      const attendanceData = attendanceRes.data || []
      
      setMemberData(member)
      setAttendance(attendanceData)
      
      const totalCheckins = attendanceData.length
      const now = new Date()
      const thisMonth = attendanceData.filter(a => {
        const d = new Date(a.check_in_time)
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      }).length
      
      let streak = 0
      if (attendanceData.length > 0) {
        const today = new Date()
        const checkinDates = new Set()
        attendanceData.forEach(a => {
          checkinDates.add(new Date(a.check_in_time).toDateString())
        })
        let currentDate = new Date(today)
        while (checkinDates.has(currentDate.toDateString())) {
          streak++
          currentDate.setDate(currentDate.getDate() - 1)
        }
      }
      
      const todayStr = new Date().toDateString()
      const todayCheckins = attendanceData.filter(a => 
        new Date(a.check_in_time).toDateString() === todayStr
      ).length
      
      const membership = member?.membership
      const isActive = membership !== null && membership !== undefined
      const daysLeft = member?.days_left || 0
      const planName = membership?.plan?.name || '—'
      const planPrice = membership?.plan?.price || 0
      
      setStats({
        totalCheckins,
        thisMonth,
        streak,
        daysLeft,
        isActive,
        planName,
        planPrice,
        todayCheckins
      })
      
      generateWeeklyData(attendanceData)
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  const generateWeeklyData = (attendanceData) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const today = new Date()
    
    const dayOfWeek = today.getDay()
    const diff = (dayOfWeek === 0 ? 6 : dayOfWeek - 1)
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - diff)
    
    const weekData = days.map((day, index) => {
      const date = new Date(weekStart)
      date.setDate(weekStart.getDate() + index)
      const dateStr = date.toDateString()
      
      const count = attendanceData.filter(a => {
        const checkDate = new Date(a.check_in_time)
        return checkDate.toDateString() === dateStr
      }).length
      
      return { day, checkins: count }
    })
    
    setWeeklyData(weekData)
  }

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

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
        color: 'var(--text)',
      }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%',
          border: '3px solid var(--border)',
          borderTopColor: 'var(--accent)',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ color: 'var(--text-3)', fontSize: '13px', fontWeight: 600 }}>Loading your dashboard…</span>
      </div>
    )
  }

  const { totalCheckins, thisMonth, streak, daysLeft, isActive, planName, planPrice, todayCheckins } = stats
  const displayClasses = upcomingClasses.slice(0, 4)
  const hasMoreClasses = upcomingClasses.length > 4

  return (
    <div style={{
      background: 'var(--bg)',
      color: 'var(--text)',
      fontFamily: "'Inter', -apple-system, sans-serif",
      minHeight: '100vh',
      boxSizing: 'border-box',
    }}>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }
        ::-webkit-scrollbar-track { background: transparent; }
        .dashboard-card { transition: all 0.2s ease; }
        .dashboard-card:hover { border-color: var(--accent) !important; transform: translateY(-2px); }
        .class-list { max-height: 220px; overflow-y: auto; padding-right: 4px; }
        .class-list::-webkit-scrollbar { width: 3px; }
        .class-list::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }
        .class-list::-webkit-scrollbar-track { background: transparent; }

        .quick-action-btn { min-height: 44px; }

        /* Mobile Quick Actions - User scrollable horizontal */
        @media (max-width: 768px) {
          .quick-actions-card {
            order: 2;
          }
          
          .weekly-chart-card {
            order: 3;
          }
          
          .stats-grid-1 {
            order: 1;
          }
          
          .mobile-actions {
            display: block !important;
          }
          
          .desktop-actions {
            display: none !important;
          }
        }

        @media (max-width: 768px) {
          .main-grid {
            display: flex !important;
            flex-direction: column !important;
          }
          
          .main-grid > *:nth-child(1) {
            order: 2;
          }
          
          .main-grid > *:nth-child(2) {
            order: 1;
          }
        }

        /* ===== Tablet & Mobile ===== */
        @media (max-width: 768px) {
          .dashboard-header {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 16px !important;
            margin-bottom: 18px !important;
          }
          .dash-title { font-size: 22px !important; }
          .dashboard-header-actions { width: 100% !important; }
          .dash-checkin-btn {
            width: 100% !important;
            justify-content: center !important;
            padding: 13px 18px !important;
          }

          .stats-grid-1 {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 10px !important;
            margin-bottom: 12px !important;
          }
          .stats-grid-2 {
            display: none !important;
          }
          .stat-card { padding: 14px !important; gap: 10px !important; }
          .stat-value { font-size: 20px !important; }
          .stat-sub { font-size: 10.5px !important; }

          .main-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
            margin-bottom: 12px !important;
          }
  .weekly-chart-card {
    min-height: unset !important;
    height: 170px !important;
    padding: 16px !important;
  }
          .weekly-chart-area { height: 170px !important; }
          .quick-actions-card { padding: 16px !important; }

          .bottom-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .bottom-card { max-height: none !important; padding: 16px !important; }
          .class-list { max-height: 260px !important; }
        }

        /* ===== Small phones ===== */
        @media (max-width: 420px) {
          .stats-grid-1, .stats-grid-2 {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 8px !important;
          }
          .stat-card { padding: 12px !important; }
          .stat-value { font-size: 18px !important; }
          .weekly-chart-area { height: 150px !important; }
        }

        /* Mobile horizontal scroll styles - user scrollable */
        .mobile-actions-scroll {
          display: flex;
          overflow-x: auto;
          gap: 10px;
          padding: 4px 0 12px 0;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          position: relative;
        }
        
        .mobile-actions-scroll::-webkit-scrollbar {
          height: 4px;
        }
        
        .mobile-actions-scroll::-webkit-scrollbar-thumb {
          background: var(--border);
          border-radius: 99px;
        }
        
        .mobile-actions-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .mobile-action-item {
          flex: 0 0 auto;
          scroll-snap-align: start;
          min-width: 140px;
          max-width: 160px;
        }

        .mobile-actions-wrapper {
          position: relative;
          overflow: hidden;
        }
        
        .mobile-actions-wrapper::after {
          content: '';
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: 30px;
          background: linear-gradient(to right, transparent, var(--surface));
          pointer-events: none;
          z-index: 1;
        }
        
        .mobile-actions-wrapper::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 30px;
          background: linear-gradient(to left, transparent, var(--surface));
          pointer-events: none;
          z-index: 1;
        }
      `}</style>

      {/* Header */}
      <div className="dashboard-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: '11px', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, marginBottom: '6px' }}>
            Member Portal
          </p>
          <h1 className="dash-title" style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', margin: 0, color: 'var(--text)' }}>
            Welcome back, {user?.name?.split(' ')[0] || 'Athlete'}  
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="dashboard-header-actions" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link to="/member/checkin" className="dash-checkin-btn" style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '11px 22px', borderRadius: '9px',
            background: 'var(--accent)',
            color: 'var(--bg)',
            textDecoration: 'none', fontSize: '13px', fontWeight: 700,
          }}>
            <UserCheck size={16} />
            Check in
          </Link>
        </div>
      </div>

      {/* Membership Expiry Banner */}
      {isActive && daysLeft <= 7 && daysLeft > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '13px 16px', borderRadius: '10px', marginBottom: '20px',
          background: 'var(--amber)14', border: '1px solid var(--amber)44'
        }}>
          <Bell size={16} color="var(--amber)" />
          <p style={{ fontSize: '13px', color: 'var(--text-2)' }}>
            Your membership expires in <strong style={{ color: 'var(--amber)' }}>{daysLeft} days</strong> — contact admin to renew.
          </p>
        </div>
      )}

      {/* Stats Row 1 */}
      <div className="stats-grid-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
        <StatCard
          icon={Award}
          iconColor="var(--green)"
          label="Status"
          value={isActive ? 'Active' : 'Inactive'}
          sub={isActive ? `${daysLeft}d remaining` : 'No membership'}
        />
        <StatCard
          icon={Flame}
          iconColor="var(--accent)"
          label="Streak"
          value={`${streak}d`}
          sub={streak > 0 ? 'Keep it going!' : 'Start your streak today'}
        />
        <StatCard
          icon={TrendingUp}
          iconColor="var(--blue)"
          label="This month"
          value={thisMonth}
          sub={`${totalCheckins} total sessions`}
        />
        <StatCard
          icon={Crown}
          iconColor="var(--amber)"
          label="Plan"
          value={planName}
          sub={isActive ? `${planPrice.toLocaleString()} DZD/mo` : 'No active plan'}
        />
      </div>

      {/* Stats Row 2 - Quick Stats */}
      <div className="stats-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
        <div className="dashboard-card" style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          minWidth: 0,
        }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '10px',
            background: 'var(--blue)1F',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Calendar size={18} color="var(--blue)" />
          </div>
          <div className="mini-stat-text" style={{ minWidth: 0 }}>
            <p style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)' }}>{todayCheckins}</p>
            <p style={{ fontSize: '11px', color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Today's check-ins</p>
          </div>
        </div>
        <div className="dashboard-card" style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          minWidth: 0,
        }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '10px',
            background: 'var(--green)1F',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Dumbbell size={18} color="var(--green)" />
          </div>
          <div className="mini-stat-text" style={{ minWidth: 0 }}>
            <p style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)' }}>{totalCheckins}</p>
            <p style={{ fontSize: '11px', color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Total sessions</p>
          </div>
        </div>
        <div className="dashboard-card" style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          minWidth: 0,
        }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '10px',
            background: 'rgba(167,139,250,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Zap size={18} color="#A78BFA" />
          </div>
          <div className="mini-stat-text" style={{ minWidth: 0 }}>
            <p style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)' }}>{streak > 0 ? `${streak}d` : '0d'}</p>
            <p style={{ fontSize: '11px', color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Current streak</p>
          </div>
        </div>
        <div className="dashboard-card" style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          minWidth: 0,
        }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '10px',
            background: 'var(--amber)1F',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Clock size={18} color="var(--amber)" />
          </div>
          <div className="mini-stat-text" style={{ minWidth: 0 }}>
            <p style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)' }}>
              {isActive ? `${daysLeft}d` : '—'}
            </p>
            <p style={{ fontSize: '11px', color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Days remaining</p>
          </div>
        </div>
      </div>

      {/* Main Content: 2 columns - WEEKLY ACTIVITY UNTOUCHED */}
      <div className="main-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
        
{/* Weekly Activity Chart - FIXED BOTTOM ROW GAP */}
<div className="weekly-chart-card" style={{
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '16px',
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  minHeight: '280px',
}}>
  <div style={{ 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    marginBottom: '12px',
    flexShrink: 0,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{
        width: '32px', height: '32px', borderRadius: '9px',
        background: 'var(--blue)1F',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <BarChart3 size={16} color="var(--blue)" />
      </div>
      <h3 style={{ fontSize: '14.5px', fontWeight: 700, margin: 0, color: 'var(--text)' }}>Weekly Activity</h3>
    </div>
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '8px',
      padding: '4px 12px',
      borderRadius: '8px',
      background: 'var(--surface-2)',
      border: '1px solid var(--border)',
    }}>
      <Activity size={12} color="var(--accent)" />
      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)' }}>
        {totalCheckins} total
      </span>
    </div>
  </div>
  
  <div style={{ 
    flex: 1, 
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
  }}>
    <div className="weekly-chart-area" style={{ flex: 1, minHeight: 0 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={weeklyData}
          barSize={isMobile ? 32 : 40}
          barGap={isMobile ? 4 : 6}
          margin={
  isMobile
    ? { top: 0, right: 0, left: -20, bottom: -10 }
    : { top: 4, right: 8, left: 0, bottom: 0 }
}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis 
            dataKey="day" 
            stroke="transparent" 
            tick={{ fontSize: isMobile ? 9 : 11, fill: 'var(--text-3)', fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
            padding={{ left: 0, right: 0 }}
            interval={0}
          />
          <YAxis 
            stroke="transparent" 
            tick={{ fontSize: isMobile ? 9 : 10, fill: 'var(--text-3)' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            domain={[0, 'dataMax + 1']}
            width={isMobile ? 20 : 30}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Bar 
            dataKey="checkins" 
            name="Check-ins" 
            fill="var(--accent)"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
    
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: '4px',
      paddingTop: '4px',
      borderTop: '1px solid var(--border)',
      flexShrink: 0,
      paddingLeft: isMobile ? '4px' : '0',
      paddingRight: isMobile ? '4px' : '0',
    }}>
      {weeklyData.map((day, idx) => {
        const isToday = idx === new Date().getDay() - 1
        const hasCheckin = day.checkins > 0
        return (
          <div key={idx} style={{ 
            textAlign: 'center',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1px',
          }}>
            <div style={{
              fontSize: isMobile ? '13px' : '14px',
              fontWeight: 800,
              color: isToday ? 'var(--accent)' : hasCheckin ? 'var(--green)' : 'var(--text-3)',
              lineHeight: 1,
            }}>
              {day.checkins}
            </div>
            <div style={{
              fontSize: isMobile ? '8px' : '9px',
              color: isToday ? 'var(--accent)' : 'var(--text-3)',
              fontWeight: isToday ? 700 : 500,
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
              lineHeight: 1,
            }}>
              {day.day}
            </div>
            {isToday && (
              <div style={{
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                background: 'var(--accent)',
                marginTop: '1px',
              }} />
            )}
          </div>
        )
      })}
    </div>
  </div>
</div>

        {/* Right: Quick Actions - WITH HORIZONTAL SCROLL ON MOBILE */}
        <div className="quick-actions-card" style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <p style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: '14px' }}>
            Quick Actions
          </p>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '8px', 
            flex: 1,
            overflow: 'hidden',
          }}>
            {/* Desktop view - vertical layout (UNCHANGED) */}
            <div className="desktop-actions" style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}>
              <QuickAction to="/member/checkin" icon={UserCheck} iconColor="var(--green)" label="Check in" />
              <QuickAction to="/member/membership" icon={Crown} iconColor="var(--accent)" label="Membership" />
              <QuickAction to="/member/payments" icon={CreditCard} iconColor="var(--blue)" label="Payments" />
              <QuickAction to="/member/profile" icon={User} iconColor="var(--amber)" label="Profile" />
              <QuickAction to="/member/nutrition" icon={Coffee} iconColor="var(--green)" label="Nutrition" />
              <QuickAction to="/member/program" icon={Dumbbell} iconColor="var(--accent)" label="Workout Program" />
            </div>

            {/* Mobile view - horizontal scroll (USER SCROLLABLE) */}
            <div className="mobile-actions" style={{
              display: 'none',
            }}>
              <div className="mobile-actions-wrapper">
                <div className="mobile-actions-scroll">
                  <div className="mobile-action-item">
                    <QuickAction to="/member/checkin" icon={UserCheck} iconColor="var(--green)" label="Check in" />
                  </div>
                  <div className="mobile-action-item">
                    <QuickAction to="/member/membership" icon={Crown} iconColor="var(--accent)" label="Membership" />
                  </div>
                  <div className="mobile-action-item">
                    <QuickAction to="/member/payments" icon={CreditCard} iconColor="var(--blue)" label="Payments" />
                  </div>
                  <div className="mobile-action-item">
                    <QuickAction to="/member/profile" icon={User} iconColor="var(--amber)" label="Profile" />
                  </div>
                  <div className="mobile-action-item">
                    <QuickAction to="/member/nutrition" icon={Coffee} iconColor="var(--green)" label="Nutrition" />
                  </div>
                  <div className="mobile-action-item">
                    <QuickAction to="/member/program" icon={Dumbbell} iconColor="var(--accent)" label="Workout Program" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: 2 columns - UNCHANGED */}
      <div className="bottom-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        
        {/* Upcoming Classes */}
        <div className="bottom-card" style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '320px',
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            marginBottom: '12px',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '9px',
                background: 'rgba(167,139,250,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Calendar size={16} color="#A78BFA" />
              </div>
              <h3 style={{ fontSize: '14.5px', fontWeight: 700, margin: 0, color: 'var(--text)' }}>Upcoming Classes</h3>
              {upcomingClasses.length > 0 && (
                <span style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '99px',
                  background: 'var(--surface-2)',
                  color: 'var(--text-3)',
                  border: '1px solid var(--border)',
                }}>
                  {upcomingClasses.length}
                </span>
              )}
            </div>
            <Link to="/member/schedule" style={{ fontSize: '12px', color: 'var(--accent)', textDecoration: 'none', fontWeight: 700 }}>
              View all →
            </Link>
          </div>

          {upcomingClasses.length > 0 ? (
            <div className="class-list" style={{ flex: 1, minHeight: 0 }}>
              {displayClasses.map((cls, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  marginBottom: idx < displayClasses.length - 1 ? '8px' : '0',
                  borderRadius: '10px',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--accent)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border)'
                }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'var(--accent)1A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Clock size={14} color="var(--accent)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ 
                      fontSize: '12px', 
                      fontWeight: 600, 
                      color: 'var(--text)',
                      margin: 0,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {cls.name}
                    </p>
                    <p style={{ 
                      fontSize: '10px', 
                      color: 'var(--text-3)',
                      margin: '2px 0 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      flexWrap: 'wrap',
                    }}>
                      <span>{cls.day}</span>
                      <span>•</span>
                      <span>{cls.time}</span>
                      <span>•</span>
                      <span>{cls.location || 'Studio'}</span>
                    </p>
                  </div>
                  <span style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '99px',
                    background: cls.spots > 3 ? 'var(--green)1A' : cls.spots > 0 ? 'var(--amber)1A' : 'var(--red)1A',
                    color: cls.spots > 3 ? 'var(--green)' : cls.spots > 0 ? 'var(--amber)' : 'var(--red)',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}>
                    {cls.spots > 0 ? `${cls.spots} spots` : 'Full'}
                  </span>
                </div>
              ))}
              {hasMoreClasses && (
                <div style={{
                  textAlign: 'center',
                  padding: '6px 0',
                  color: 'var(--text-3)',
                  fontSize: '11px',
                  fontWeight: 600,
                  borderTop: '1px solid var(--border)',
                  marginTop: '8px',
                }}>
                  + {upcomingClasses.length - 4} more classes
                </div>
              )}
            </div>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '30px 0', 
              color: 'var(--text-3)',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Calendar size={28} style={{ margin: '0 auto 10px', opacity: 0.4, color: 'var(--text-3)' }} />
              <p style={{ fontSize: '13px', color: 'var(--text-2)' }}>No upcoming classes</p>
            </div>
          )}
        </div>

        {/* Recent Check-ins */}
        <div className="bottom-card" style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '320px',
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            marginBottom: '12px',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '9px',
                background: 'var(--green)1F',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Activity size={16} color="var(--green)" />
              </div>
              <h3 style={{ fontSize: '14.5px', fontWeight: 700, margin: 0, color: 'var(--text)' }}>Recent Activity</h3>
            </div>
            <Link to="/member/checkin" style={{ fontSize: '12px', color: 'var(--green)', textDecoration: 'none', fontWeight: 700 }}>
              View all →
            </Link>
          </div>

          {attendance.length > 0 ? (
            <div style={{ 
              flex: 1, 
              minHeight: 0,
              overflowY: 'auto',
              paddingRight: '4px',
            }}>
              {attendance.slice(0, 5).map((record, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  marginBottom: idx < 4 ? '8px' : '0',
                  borderRadius: '10px',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'var(--green)14',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <CheckCircle size={14} color="var(--green)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '12px', fontWeight: 600, margin: 0, color: 'var(--text)' }}>
                      Gym session
                    </p>
                    <p style={{ fontSize: '10px', color: 'var(--text-3)', margin: '2px 0 0' }}>
                      {formatDate(record.check_in_time)}
                    </p>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {formatTime(record.check_in_time)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: '30px 0', 
              color: 'var(--text-3)',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Target size={28} style={{ margin: '0 auto 10px', opacity: 0.4, color: 'var(--text-3)' }} />
              <p style={{ fontSize: '13px', color: 'var(--text-2)' }}>No sessions yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}