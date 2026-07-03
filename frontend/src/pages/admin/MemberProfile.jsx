import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from "../../api/client"
import toast from 'react-hot-toast'
import { 
  User, Mail, Phone, Calendar, Dumbbell, CreditCard, 
  Activity, Clock, ArrowLeft, Edit, Trash2, 
  CheckCircle, AlertCircle, TrendingUp, Award
} from 'lucide-react'

export default function MemberProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [member, setMember] = useState(null)
  const [subscriptions, setSubscriptions] = useState([])
  const [payments, setPayments] = useState([])
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMemberData()
  }, [id])

  const fetchMemberData = async () => {
    try {
      const [memberRes, subsRes, paymentsRes, attendanceRes] = await Promise.all([
        api.get(`/members/${id}`),
        api.get('/subscriptions'),
        api.get('/payments'),
        api.get('/attendance')
      ])
      setMember(memberRes.data)
      setSubscriptions(subsRes.data.filter(s => s.member_id === parseInt(id)))
      setPayments(paymentsRes.data.filter(p => p.member_id === parseInt(id)))
      setAttendance(attendanceRes.data.filter(a => a.member_id === parseInt(id)))
    } catch (error) {
      toast.error('Failed to load member data')
      navigate('/dashboard/members')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date) => new Date(date).toLocaleDateString('en-GB')
  const formatCurrency = (value) => new Intl.NumberFormat('en-DZ', { style: 'currency', currency: 'DZD' }).format(value)

  if (loading) return <div className="loading"><div className="spinner" /></div>
  if (!member) return <div className="empty-state"><p>Member not found</p></div>

  const totalPaid = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0)
  const attendanceRate = attendance.length > 0 ? Math.round((attendance.length / 30) * 100) : 0

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => navigate('/dashboard/members')} className="btn btn-ghost btn-sm">
            <ArrowLeft size={18} />
            Back
          </button>
          <div>
            <h1 className="page-title">{member.user.name}</h1>
            <p className="page-subtitle">Member since {formatDate(member.user.created_at)}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Link to={`/dashboard/members/${id}/edit`} className="btn btn-primary">
            <Edit size={18} />
            Edit Profile
          </Link>
        </div>
      </div>

      <div className="grid-2">
        {/* Member Info Card */}
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '20px' }}>Personal Information</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail size={16} className="text-muted" />
              <span>{member.user.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone size={16} className="text-muted" />
              <span>{member.phone || 'Not provided'}</span>
            </div>
            <div className="flex items-center gap-3">
              <Calendar size={16} className="text-muted" />
              <span>Age: {member.age || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-3">
              <Dumbbell size={16} className="text-muted" />
              <span>{member.weight ? `${member.weight} kg` : 'N/A'} / {member.height ? `${member.height} cm` : 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Stats Card */}
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '20px' }}>Statistics</h3>
          <div className="grid-2" style={{ gap: '16px' }}>
            <div className="text-center">
              <div className="stat-value">{subscriptions.filter(s => s.status === 'active').length}</div>
              <div className="stat-label">Active Subs</div>
            </div>
            <div className="text-center">
              <div className="stat-value">{attendance.length}</div>
              <div className="stat-label">Total Check-ins</div>
            </div>
            <div className="text-center">
              <div className="stat-value">{formatCurrency(totalPaid)}</div>
              <div className="stat-label">Total Paid</div>
            </div>
            <div className="text-center">
              <div className="stat-value">{attendanceRate}%</div>
              <div className="stat-label">Attendance Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card mt-6">
        <h3 className="card-title" style={{ marginBottom: '20px' }}>Recent Activity</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Date</th><th>Type</th><th>Description</th><th>Amount</th></tr></thead>
            <tbody>
              {[...payments, ...attendance].sort((a,b) => new Date(b.created_at || b.check_in_time) - new Date(a.created_at || a.check_in_time)).slice(0, 5).map((item, idx) => (
                <tr key={idx}>
                  <td>{formatDate(item.payment_date || item.check_in_time)}</td>
                  <td>{item.amount ? 'Payment' : 'Check-in'}</td>
                  <td>{item.amount ? `Payment for subscription` : `Member checked in`}</td>
                  <td>{item.amount ? formatCurrency(item.amount) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
