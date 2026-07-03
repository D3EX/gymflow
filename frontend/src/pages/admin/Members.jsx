import { useEffect, useState } from 'react'
import api from "../../api/client"
import toast from 'react-hot-toast'
import { Edit, Trash2, UserPlus, Search, X, Users, Calendar, Activity, DollarSign, Filter, Download, Eye, Phone } from 'lucide-react'
import Modal from "../../components/Modal"
import { Link } from 'react-router-dom'

/* ─── Export to Excel ───────────────────────────────────────── */
function exportToExcel(members) {
  if (!members || members.length === 0) {
    toast.error('No members to export')
    return
  }

  const headers = [
    'Member ID', 'Name', 'Email', 'Phone', 'Age', 'Weight (kg)',
    'Height (cm)', 'Gender', 'Status', 'Joined Date'
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
              <x:Name>Members</x:Name>
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
        .status-active { color: #22c55e; font-weight: 600; }
        .status-inactive { color: #ef4444; font-weight: 600; }
        .status-suspended { color: #f59e0b; font-weight: 600; }
      </style>
    </head>
    <body>
      <h2>Members Export</h2>
      <p>Exported on: ${new Date().toLocaleString()}</p>
      <table>
        <thead>
          <tr>
            ${headers.map(h => `<th>${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
  `

  members.forEach(m => {
    const statusClass = `status-${m.status || 'active'}`
    html += `
      <tr>
        <td>${m.id}</td>
        <td>${m.user?.name || 'N/A'}</td>
        <td>${m.user?.email || 'N/A'}</td>
        <td>${m.phone || ''}</td>
        <td>${m.age || ''}</td>
        <td>${m.weight || ''}</td>
        <td>${m.height || ''}</td>
        <td>${m.gender || ''}</td>
        <td class="${statusClass}">${(m.status || 'active').toUpperCase()}</td>
        <td>${m.user?.created_at ? new Date(m.user.created_at).toLocaleDateString() : ''}</td>
      </tr>
    `
  })

  html += `
        </tbody>
      </table>
      <p style="margin-top: 16px; color: #666; font-size: 11px;">
        Total Members: ${members.length}
      </p>
    </body>
    </html>
  `

  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `members_export_${new Date().toISOString().split('T')[0]}.xls`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  toast.success(`Exported ${members.length} members to Excel`)
}

export default function Members() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const PER_PAGE = 10
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    age: '',
    weight: '',
    height: '',
    gender: 'male',
    status: 'active',
  })

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    try {
      const response = await api.get('/members')
      setMembers(response.data)
    } catch (error) {
      toast.error('Failed to fetch members')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (member = null) => {
    if (member) {
      setEditingMember(member)
      setFormData({
        name: member.user.name,
        email: member.user.email,
        password: '',
        phone: member.phone || '',
        age: member.age || '',
        weight: member.weight || '',
        height: member.height || '',
        gender: member.gender || 'male',
        status: member.status || 'active',
      })
    } else {
      setEditingMember(null)
      setFormData({
        name: '',
        email: '',
        password: '',
        phone: '',
        age: '',
        weight: '',
        height: '',
        gender: 'male',
        status: 'active',
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingMember(null)
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingMember) {
        const updateData = {
          name: formData.name,
          phone: formData.phone,
          age: parseInt(formData.age) || null,
          weight: parseFloat(formData.weight) || null,
          height: parseFloat(formData.height) || null,
          gender: formData.gender,
          status: formData.status,
        }
        await api.put(`/members/${editingMember.id}`, updateData)
        toast.success('Member updated')
      } else {
        await api.post('/members', {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          age: parseInt(formData.age) || null,
          weight: parseFloat(formData.weight) || null,
          height: parseFloat(formData.height) || null,
          gender: formData.gender,
        })
        toast.success('Member created')
      }
      handleCloseModal()
      fetchMembers()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed')
    }
  }

  const handleDelete = async (id, name) => {
    if (confirm(`Delete member "${name}"?`)) {
      try {
        await api.delete(`/members/${id}`)
        toast.success('Member deleted')
        fetchMembers()
      } catch (error) {
        toast.error('Failed to delete member')
      }
    }
  }

  const handleActivate = async (id, name) => {
    try {
      await api.put(`/members/${id}`, { status: 'active' })
      toast.success(`${name} activated`)
      fetchMembers()
    } catch (error) {
      toast.error('Failed to activate member')
    }
  }

  const handleExport = () => {
    const dataToExport = filteredMembers.length > 0 ? filteredMembers : members
    exportToExcel(dataToExport)
  }

  const activeCount = members.filter(m => m.status === 'active').length
  const pendingCount = members.filter(m => m.status === 'pending').length
  const inactiveCount = members.filter(m => m.status !== 'active' && m.status !== 'pending').length
  const totalRevenue = members.reduce((sum, m) => sum + (m.total_paid || 0), 0)

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.user.name.toLowerCase().includes(search.toLowerCase()) ||
      member.user.email.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalPages = Math.ceil(filteredMembers.length / PER_PAGE)
  const paginatedMembers = filteredMembers.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <span>Loading members...</span>
      </div>
    )
  }

  return (
    <div className="members-page">
      <style>{`
        /* ---- Mobile responsiveness for Members page ---- */
        .members-page .page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }
        .members-page .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        .members-page .search-filter-row {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .members-page .table-wrap {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        .members-page .mobile-member-list {
          display: none;
        }
        .members-page .pagination-row {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 4px;
          margin-top: 20px;
          flex-wrap: wrap;
        }

        @media (max-width: 900px) {
          .members-page .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .members-page .page-header {
            flex-direction: column;
            align-items: stretch;
          }
          .members-page .page-header > button {
            width: 100%;
            justify-content: center;
          }
          .members-page .page-title {
            font-size: 20px;
          }
          .members-page .stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            margin-bottom: 16px;
          }
          .members-page .stats-grid .card {
            padding: 12px !important;
          }
          .members-page .stats-grid .stat-value {
            font-size: 18px;
          }
          .members-page .stats-grid .stat-label {
            font-size: 10px;
          }
          .members-page .search-filter-row {
            flex-wrap: nowrap;
            gap: 8px;
          }
          .members-page .search-filter-row .search-wrap {
            flex: 1;
            min-width: 0;
          }
          .members-page .search-filter-row select {
            width: 110px !important;
            flex-shrink: 0;
            padding-left: 8px;
            padding-right: 8px;
          }
          .members-page .search-filter-row .export-btn {
            flex-shrink: 0;
            padding: 8px 10px;
          }
          .members-page .search-filter-row .export-btn .export-label {
            display: none;
          }
          /* Hide table, show card list */
          .members-page .table-wrap {
            display: none;
          }
          .members-page .mobile-member-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          .members-page .mobile-member-card {
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 14px;
          }
          .members-page .mobile-member-card .top-row {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 10px;
          }
          .members-page .mobile-member-card .info {
            min-width: 0;
            flex: 1;
          }
          .members-page .mobile-member-card .info .name-line {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
          }
          .members-page .mobile-member-card .email {
            font-size: 12px;
            color: var(--text-muted);
            overflow-wrap: anywhere;
          }
          .members-page .mobile-member-card .meta-row {
            font-size: 12px;
            color: var(--text-muted);
            margin-bottom: 10px;
          }
          .members-page .mobile-member-card .meta-row span {
            display: flex;
            align-items: center;
            gap: 5px;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .members-page .mobile-member-card .meta-row svg {
            flex-shrink: 0;
            opacity: 0.7;
          }
          .members-page .mobile-member-card .actions-row {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
          }
          .members-page .mobile-member-card .actions-row .btn {
            flex: 1;
            justify-content: center;
            min-width: 0;
          }
          .members-page .modal-form-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div className="page-header">
        <div>
          <p style={{ fontSize: 11, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, margin: '0 0 6px' }}>
            management
          </p>
          <h1 className="page-title">Members</h1>
          <p className="page-subtitle">Manage and track all gym members</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn btn-primary">
          <UserPlus size={18} />
          Add Member
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="card" style={{ padding: '16px' }}>
          <div className="flex items-center justify-between mb-2">
            <Users size={20} color="#fb7121" />
            <span className="text-xs text-muted">Total</span>
          </div>
          <div className="stat-value">{members.length}</div>
          <div className="stat-label">Total Members</div>
        </div>
        <div className="card" style={{ padding: '16px' }}>
          <div className="flex items-center justify-between mb-2">
            <Activity size={20} color="#34d399" />
            <span className="text-xs text-muted">Active</span>
          </div>
          <div className="stat-value">{activeCount}</div>
          <div className="stat-label">Active Members</div>
        </div>
        <div className="card" style={{ padding: '16px' }}>
          <div className="flex items-center justify-between mb-2">
            <Calendar size={20} color="#fbbf24" />
            <span className="text-xs text-muted">Pending</span>
          </div>
          <div className="stat-value">{pendingCount}</div>
          <div className="stat-label">Awaiting Approval</div>
        </div>
        <div className="card" style={{ padding: '16px' }}>
          <div className="flex items-center justify-between mb-2">
            <DollarSign size={20} color="#60a5fa" />
            <span className="text-xs text-muted">Revenue</span>
          </div>
          <div className="stat-value">${totalRevenue.toLocaleString()}</div>
          <div className="stat-label">Total Revenue</div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
        <div className="search-filter-row">
          <div className="search-wrap" style={{ flex: 1 }}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="form-input"
            />
          </div>
          <select 
            value={statusFilter} 
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="form-input" 
            style={{ width: '150px' }}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending Approval</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          {/* ✅ FIXED: Export button now works */}
          <button className="btn btn-ghost btn-sm export-btn" onClick={handleExport} title="Export Excel">
            <Download size={14} />
            <span className="export-label">Export Excel</span>
          </button>
        </div>
      </div>

      {/* Members Table (desktop/tablet) */}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Contact</th>
                <th>Stats</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedMembers.map((member) => (
                <tr key={member.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-surface-2 rounded-full flex items-center justify-center text-sm font-semibold" style={{ color: '#fb7121' }}>
                        {member.user.name.charAt(0)}
                      </div>
                      <div>
                        <Link to={`/dashboard/members/${member.id}`} className="font-medium hover:text-accent">
                          {member.user.name}
                        </Link>
                        <p className="text-xs text-muted">ID: #{member.id}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <p className="text-sm">{member.user.email}</p>
                    <p className="text-xs text-muted">{member.phone || 'No phone'}</p>
                  </td>
                  <td>
                    <div className="text-sm">{member.age ? `${member.age} yrs` : '-'}</div>
                    <div className="text-xs text-muted">{member.weight ? `${member.weight}kg` : '-'} / {member.height ? `${member.height}cm` : '-'}</div>
                  </td>
                  <td>
                    {member.status === 'pending' ? (
                      <span
                        className="badge"
                        style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}
                      >
                        Pending Approval
                      </span>
                    ) : (
                      <span className={`badge ${member.status === 'active' ? 'badge-green' : 'badge-red'}`}>
                        {member.status}
                      </span>
                    )}
                  </td>
                  <td className="text-sm text-muted">
                    {new Date(member.user.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <div className="flex gap-2">
                      {member.status === 'pending' && (
                        <button
                          onClick={() => handleActivate(member.id, member.user.name)}
                          className="btn btn-sm btn-primary"
                          title="Activate this member"
                        >
                          Activate
                        </button>
                      )}
                      <button onClick={() => handleOpenModal(member)} className="btn btn-sm btn-secondary" title="Edit">
                        <Edit size={14} />
                      </button>
                      <button onClick={() => handleDelete(member.id, member.user.name)} className="btn btn-sm btn-danger" title="Delete">
                        <Trash2 size={14} />
                      </button>
                      <Link to={`/dashboard/members/${member.id}`} className="btn btn-sm btn-secondary" title="View Profile">
                        <Eye size={14} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Members list (mobile) */}
        <div className="mobile-member-list">
          {paginatedMembers.map((member) => (
            <div className="mobile-member-card" key={member.id}>
              <div className="top-row">
                <div className="w-10 h-10 bg-surface-2 rounded-full flex items-center justify-center text-sm font-semibold" style={{ color: '#fb7121', flexShrink: 0 }}>
                  {member.user.name.charAt(0)}
                </div>
                <div className="info">
                  <div className="name-line">
                    <Link to={`/dashboard/members/${member.id}`} className="font-medium hover:text-accent">
                      {member.user.name}
                    </Link>
                    {member.status === 'pending' ? (
                      <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                        Pending
                      </span>
                    ) : (
                      <span className={`badge ${member.status === 'active' ? 'badge-green' : 'badge-red'}`}>
                        {member.status}
                      </span>
                    )}
                  </div>
                  <p className="email">{member.user.email}</p>
                </div>
              </div>

              <div className="meta-row">
                <span><Phone size={12} /> {member.phone || 'No phone'}</span>
              </div>

              <div className="actions-row">
                {member.status === 'pending' && (
                  <button
                    onClick={() => handleActivate(member.id, member.user.name)}
                    className="btn btn-sm btn-primary"
                  >
                    Activate
                  </button>
                )}
                <button onClick={() => handleOpenModal(member)} className="btn btn-sm btn-secondary" title="Edit">
                  <Edit size={14} />
                </button>
                <button onClick={() => handleDelete(member.id, member.user.name)} className="btn btn-sm btn-danger" title="Delete">
                  <Trash2 size={14} />
                </button>
                <Link to={`/dashboard/members/${member.id}`} className="btn btn-sm btn-secondary" title="View Profile">
                  <Eye size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
        
        {filteredMembers.length === 0 && (
          <div className="empty-state">
            <Users size={48} className="mx-auto mb-3 opacity-50" />
            <p>No members found</p>
            <button onClick={() => handleOpenModal()} className="btn btn-primary btn-sm mt-3">
              Add your first member
            </button>
          </div>
        )}
      </div>

      {/* Pagination — standalone, outside card */}
      {totalPages > 1 && (
        <div className="pagination-row">

          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              width: '36px', height: '36px', borderRadius: '8px',
              border: '1px solid var(--border)', background: 'var(--surface)',
              color: 'var(--text)', cursor: page === 1 ? 'not-allowed' : 'pointer',
              opacity: page === 1 ? 0.35 : 1, fontSize: '17px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => { if (page !== 1) e.currentTarget.style.borderColor = '#fb7121' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
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
                <span key={`el-${idx}`} style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: 'var(--text-muted)', letterSpacing: '1px' }}>···</span>
              ) : (
                <button
                  key={item}
                  onClick={() => setPage(item)}
                  style={{
                    width: '36px', height: '36px', borderRadius: '8px',
                    border: page === item ? 'none' : '1px solid var(--border)',
                    background: page === item ? '#fb7121' : 'var(--surface)',
                    color: page === item ? '#fff' : 'var(--text)',
                    fontSize: '13px', fontWeight: page === item ? 700 : 500,
                    cursor: 'pointer', transition: 'all 0.15s',
                    boxShadow: page === item ? '0 2px 8px rgba(251,113,33,0.35)' : 'none',
                  }}
                  onMouseEnter={e => { if (page !== item) e.currentTarget.style.borderColor = '#fb7121' }}
                  onMouseLeave={e => { if (page !== item) e.currentTarget.style.borderColor = 'var(--border)' }}
                >{item}</button>
              )
            )}

          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              width: '36px', height: '36px', borderRadius: '8px',
              border: '1px solid var(--border)', background: 'var(--surface)',
              color: 'var(--text)', cursor: page === totalPages ? 'not-allowed' : 'pointer',
              opacity: page === totalPages ? 0.35 : 1, fontSize: '17px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => { if (page !== totalPages) e.currentTarget.style.borderColor = '#fb7121' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
          >›</button>

        </div>
      )}

      {/* Modal Form */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        title={editingMember ? 'Edit Member' : 'Add New Member'}
        size="md"
      >
        <form onSubmit={handleSubmit}>
          <div className="grid-2 modal-form-grid" style={{ gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="form-input"
                required
                disabled={!!editingMember}
              />
            </div>
            
            {!editingMember && (
              <div className="form-group">
                <label className="form-label">Password *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
            )}
            
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Age</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Height (cm)</label>
              <input
                type="number"
                step="0.1"
                name="height"
                value={formData.height}
                onChange={handleChange}
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select name="gender" value={formData.gender} onChange={handleChange} className="form-input">
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            {editingMember && (
              <div className="form-group">
                <label className="form-label">Account Status</label>
                <select name="status" value={formData.status} onChange={handleChange} className="form-input">
                  <option value="pending">Pending Approval</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            )}
          </div>
          
          <div className="flex gap-3" style={{ marginTop: '24px' }}>
            <button type="submit" className="btn btn-primary">
              {editingMember ? 'Update Member' : 'Create Member'}
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