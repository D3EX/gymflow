import { useEffect, useState } from 'react'
import api from "../../api/client"
import toast from 'react-hot-toast'
import { Calendar, CheckCircle, Users, Clock, Search, Download, UserCheck, Activity, TrendingUp, UserPlus, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import Modal from "../../components/Modal"

/* ─── Export to Excel ───────────────────────────────────────── */
function exportToExcel(attendance, dateFilter) {
  if (!attendance || attendance.length === 0) {
    toast.error('No attendance records to export')
    return
  }

  const headers = [
    'Member ID', 'Member Name', 'Email', 'Phone', 
    'Check-in Time', 'Check-in Date', 'Status'
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
              <x:Name>Attendance</x:Name>
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
        th { background: #fb7121; color: #ffffff; font-weight: 700; padding: 8px 12px; border: 1px solid #ddd; text-align: left; }
        td { padding: 6px 12px; border: 1px solid #ddd; }
        tr:nth-child(even) { background: #f9f9f9; }
        .status-present { color: #22c55e; font-weight: 600; }
      </style>
    </head>
    <body>
      <h2>Attendance Report</h2>
      <p>Date: ${dateFilter}</p>
      <p>Exported on: ${new Date().toLocaleString()}</p>
      <table>
        <thead>
          <tr>
            ${headers.map(h => `<th>${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
  `

  attendance.forEach(record => {
    const checkInDate = new Date(record.check_in_time)
    html += `
      <tr>
        <td>${record.member?.id || 'N/A'}</td>
        <td>${record.member?.user?.name || 'N/A'}</td>
        <td>${record.member?.user?.email || 'N/A'}</td>
        <td>${record.member?.phone || ''}</td>
        <td>${checkInDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
        <td>${checkInDate.toLocaleDateString()}</td>
        <td class="status-present">PRESENT</td>
      </tr>
    `
  })

  html += `
        </tbody>
      </table>
      <p style="margin-top: 16px; color: #666; font-size: 11px;">
        Total Check-ins: ${attendance.length}
      </p>
    </body>
    </html>
  `

  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `attendance_export_${dateFilter}.xls`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  toast.success(`Exported ${attendance.length} attendance records to Excel`)
}

export default function Attendance() {
  const [attendance, setAttendance] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMember, setSelectedMember] = useState(null)
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0])
  const [search, setSearch] = useState('')
  const [searchMember, setSearchMember] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [checkingIn, setCheckingIn] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)

  useEffect(() => {
    fetchData()
    
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [dateFilter])

  const fetchData = async () => {
    try {
      const [attendanceRes, membersRes] = await Promise.all([
        api.get('/attendance', { params: { date_filter: dateFilter } }),
        api.get('/members'),
      ])
      setAttendance(attendanceRes.data)
      setMembers(membersRes.data)
    } catch (error) {
      toast.error('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckIn = async () => {
    if (!selectedMember) {
      toast.error('Please select a member')
      return
    }
    
    setCheckingIn(true)
    try {
      await api.post('/attendance', { member_id: selectedMember.id })
      toast.success(`${selectedMember.user.name} checked in`)
      fetchData()
      setSelectedMember(null)
      setSearchMember('')
      setIsModalOpen(false)
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to record check-in')
    } finally {
      setCheckingIn(false)
    }
  }

  const handleExport = () => {
    const dataToExport = filteredAttendance.length > 0 ? filteredAttendance : attendance
    exportToExcel(dataToExport, dateFilter)
  }

  const checkedInIds = new Set(attendance.map(a => a.member_id))
  const notCheckedInMembers = members.filter(m => !checkedInIds.has(m.id))
  
  const todayCount = attendance.length
  const checkedInCount = checkedInIds.size
  const attendanceRate = members.length > 0 ? Math.round((todayCount / members.length) * 100) : 0

  const filteredMembers = notCheckedInMembers.filter(member => 
    member.user.name.toLowerCase().includes(searchMember.toLowerCase()) ||
    member.user.email.toLowerCase().includes(searchMember.toLowerCase())
  )

  const filteredAttendance = attendance.filter(record => 
    record.member?.user?.name?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <span>Loading attendance...</span>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <p style={{ fontSize: 11, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, margin: '0 0 6px' }}>
            management
          </p>
          <h1 className="page-title">Attendance</h1>
          <p className="page-subtitle">Track member check-ins and attendance history</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
          <UserPlus size={18} />
          Check In Member
        </button>
      </div>

      {/* Stats Cards - 2 columns on mobile, 4 on desktop */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? '10px' : '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '16px' }}>
          <div className="flex items-center justify-between mb-2">
            <UserCheck size={20} color="#34d399" />
            <span className="text-xs text-muted">Today</span>
          </div>
          <div className="stat-value">{todayCount}</div>
          <div className="stat-label">Checked In Today</div>
        </div>
        <div className="card" style={{ padding: '16px' }}>
          <div className="flex items-center justify-between mb-2">
            <Users size={20} color="#fb7121" />
            <span className="text-xs text-muted">Unique</span>
          </div>
          <div className="stat-value">{checkedInCount}</div>
          <div className="stat-label">Unique Members</div>
        </div>
        <div className="card" style={{ padding: '16px' }}>
          <div className="flex items-center justify-between mb-2">
            <TrendingUp size={20} color="#60a5fa" />
            <span className="text-xs text-muted">Rate</span>
          </div>
          <div className="stat-value">{attendanceRate}%</div>
          <div className="stat-label">Attendance Rate</div>
        </div>
        <div className="card" style={{ padding: '16px' }}>
          <div className="flex items-center justify-between mb-2">
            <Calendar size={20} color="#fbbf24" />
            <span className="text-xs text-muted">Date</span>
          </div>
          <div className="stat-value">{dateFilter}</div>
          <div className="stat-label">Selected Date</div>
        </div>
      </div>

      {/* Search and Filter Bar - Everything in one line on mobile */}
      <div className="card" style={{ marginBottom: '20px', padding: isMobile ? '10px 12px' : '16px' }}>
        <div style={{ 
          display: 'flex', 
          gap: isMobile ? '6px' : '12px', 
          flexWrap: 'nowrap',
          alignItems: 'center'
        }}>
          {/* Search Bar - Priority (flex: 1) */}
          <div className="search-wrap" style={{ flex: 1, minWidth: 0 }}>
            <Search size={16} style={{ flexShrink: 0 }} />
            <input
              type="text"
              placeholder={isMobile ? "Search..." : "Search by member name..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input"
              style={{ 
                paddingLeft: '36px',
                minWidth: 0,
                width: '100%'
              }}
            />
          </div>
          
          {/* Date Picker - Calendar icon only on mobile */}
          {isMobile ? (
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                style={{
                  padding: '6px 8px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'var(--surface-2)',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '38px',
                  width: '38px'
                }}
              >
                <Calendar size={18} />
              </button>
              {showDatePicker && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  right: 0,
                  zIndex: 10,
                  background: 'var(--surface)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  padding: '8px',
                  border: '1px solid var(--border)'
                }}>
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => {
                      setDateFilter(e.target.value)
                      setShowDatePicker(false)
                    }}
                    className="form-input"
                    style={{ width: '150px' }}
                    autoFocus
                  />
                </div>
              )}
            </div>
          ) : (
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="form-input"
              style={{ 
                width: '180px',
                flexShrink: 0
              }}
            />
          )}
          
          {/* Export Button - Icon only on mobile */}
          <button 
            className="btn btn-ghost btn-sm" 
            onClick={handleExport}
            style={{
              padding: isMobile ? '6px 8px' : '8px 12px',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: isMobile ? '32px' : 'auto',
              height: isMobile ? '38px' : 'auto',
              borderRadius: '8px'
            }}
            title="Export to Excel"
          >
            <Download size={isMobile ? 18 : 14} />
            {!isMobile && <span style={{ marginLeft: '4px' }}>Export Excel</span>}
          </button>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="card">
        <div className="table-wrap" style={{ overflowX: isMobile ? 'auto' : 'visible' }}>
          <table className="w-full" style={{ minWidth: isMobile ? '600px' : 'auto' }}>
            <thead>
              <tr>
                <th className="text-left py-3 px-4">Member</th>
                <th className="text-left py-3 px-4">Contact</th>
                <th className="text-left py-3 px-4">Check-in Time</th>
                <th className="text-left py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredAttendance.map((record) => (
                <tr key={record.id} className="border-t border-border hover:bg-surface-2 transition">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-surface-2 rounded-full flex items-center justify-center text-sm font-semibold" style={{ color: '#fb7121' }}>
                        {record.member?.user?.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <Link to={`/dashboard/members/${record.member?.id}`} className="font-medium hover:text-accent">
                          {record.member?.user?.name || 'N/A'}
                        </Link>
                        <p className="text-xs text-muted">ID: #{record.member?.id || 'N/A'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-sm">{record.member?.user?.email || 'N/A'}</p>
                    <p className="text-xs text-muted">{record.member?.phone || 'No phone'}</p>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <Clock size={14} className="text-muted" />
                      <span className="text-sm">
                        {new Date(record.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-muted mt-1">{new Date(record.check_in_time).toLocaleDateString()}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className="badge badge-green">Present</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredAttendance.length === 0 && (
          <div className="empty-state">
            <Calendar size={48} className="mx-auto mb-3 opacity-50" />
            <p>No attendance records found for {dateFilter}</p>
            <button onClick={() => setDateFilter(new Date().toISOString().split('T')[0])} className="btn btn-primary btn-sm mt-3">
              View Today
            </button>
          </div>
        )}
      </div>

      {/* Modal for Check-in */}
      <Modal isOpen={isModalOpen} onClose={() => {
        setIsModalOpen(false)
        setSelectedMember(null)
        setSearchMember('')
      }} title="Check In Member" size="md">
        <div style={{ display: 'flex', flexDirection: 'column', height: '500px', maxHeight: '70vh' }}>
          {/* Search Input - Fixed at top */}
          <div className="form-group" style={{ marginBottom: '20px', flexShrink: 0 }}>
            <label className="form-label">Find Member</label>
            <div className="search-wrap">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchMember}
                onChange={(e) => setSearchMember(e.target.value)}
                className="form-input"
                autoFocus
              />
            </div>
          </div>

          {/* Member List - Scrollable area */}
          <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px', minHeight: 0 }}>
            {(searchMember ? filteredMembers : notCheckedInMembers).length > 0 ? (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <p className="text-xs font-semibold text-muted uppercase tracking-wider">
                    {searchMember ? 'SEARCH RESULTS' : 'READY TO CHECK IN'}
                  </p>
                  <p className="text-xs text-muted">
                    {(searchMember ? filteredMembers : notCheckedInMembers).length} members
                  </p>
                </div>
                <div className="space-y-2">
                  {(searchMember ? filteredMembers : notCheckedInMembers).map((member) => (
                    <div
                      key={member.id}
                      onClick={() => setSelectedMember(member)}
                      className={`group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                        selectedMember?.id === member.id 
                          ? 'bg-accent/10 border-2 border-accent' 
                          : 'bg-surface-2 border-2 border-transparent hover:border-accent/30 hover:bg-surface-3'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                        selectedMember?.id === member.id 
                          ? 'bg-accent text-white' 
                          : 'bg-surface-3 text-accent'
                      }`}>
                        {member.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{member.user.name}</p>
                        <p className="text-xs text-muted">{member.user.email}</p>
                      </div>
                      {selectedMember?.id === member.id ? (
                        <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                          <CheckCircle size={14} className="text-white" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-border group-hover:border-accent/50 transition-all" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-2 flex items-center justify-center">
                  <CheckCircle size={28} className="text-muted" />
                </div>
                <p className="text-sm font-medium text-muted">No members found</p>
                <p className="text-xs text-muted mt-1">
                  {searchMember ? 'Try a different name or email' : 'All members have checked in today'}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons - Fixed at bottom */}
          <div className="flex gap-3 pt-3 border-t border-border" style={{ flexShrink: 0 }}>
            <button 
              onClick={handleCheckIn} 
              className="flex-1 btn btn-primary"
              disabled={!selectedMember || checkingIn}
              style={{
                opacity: !selectedMember || checkingIn ? 0.5 : 1,
                cursor: !selectedMember || checkingIn ? 'not-allowed' : 'pointer'
              }}
            >
              {checkingIn ? (
                <>
                  <div className="spinner" style={{ width: '16px', height: '16px', marginRight: '8px' }} />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  Check In {selectedMember?.user?.name ? `• ${selectedMember.user.name.split(' ')[0]}` : ''}
                </>
              )}
            </button>
            <button 
              onClick={() => {
                setIsModalOpen(false)
                setSelectedMember(null)
                setSearchMember('')
              }} 
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>

          {/* Selected Member Preview */}
          {selectedMember && !checkingIn && (
            <div className="mt-3 pt-2 border-t border-border" style={{ flexShrink: 0 }}>
              <p className="text-xs text-muted text-center">
                Ready to check in: <span className="text-accent font-medium">{selectedMember.user.name}</span>
              </p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}