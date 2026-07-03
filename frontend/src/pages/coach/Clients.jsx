// frontend/src/pages/coach/Clients.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Search, Phone, Mail, Calendar,
  UserCheck, UserX, Clock, Loader2, UserPlus, 
  CheckCircle, X, Eye, TrendingUp, Filter,
  MessageSquare, User, Edit
} from 'lucide-react'
import api from '../../api/client'
import toast from 'react-hot-toast'

export default function CoachClients() {
  const [clients, setClients] = useState([])
  const [pendingClients, setPendingClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('approved')
  const [processingId, setProcessingId] = useState(null)
  const [page, setPage] = useState(1)
  const PER_PAGE = 5

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchClients(),
        fetchPendingClients()
      ])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchClients = async () => {
    try {
      const response = await api.get('/coach/clients')
      setClients(response.data || [])
    } catch (error) {
      console.error('Error fetching clients:', error)
      setClients([])
    }
  }

  const fetchPendingClients = async () => {
    try {
      const response = await api.get('/coach/clients/pending')
      setPendingClients(response.data || [])
    } catch (error) {
      console.error('Error fetching pending clients:', error)
      setPendingClients([])
    }
  }

  const handleApprove = async (assignmentId, clientName) => {
    setProcessingId(assignmentId)
    try {
      await api.post(`/coach/clients/approve/${assignmentId}`)
      toast.success(`${clientName} approved! 🎉`)
      await fetchAllData()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to approve')
    } finally {
      setProcessingId(null)
    }
  }

  const handleDecline = async (assignmentId, clientName) => {
    setProcessingId(assignmentId)
    try {
      await api.post(`/coach/clients/decline/${assignmentId}`)
      toast.success(`${clientName} declined`)
      await fetchPendingClients()
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to decline')
    } finally {
      setProcessingId(null)
    }
  }

  const filteredClients = clients.filter(client => {
    const searchLower = search.toLowerCase()
    const name = client.user?.name?.toLowerCase() || ''
    const email = client.user?.email?.toLowerCase() || ''
    const phone = client.phone?.toLowerCase() || ''
    
    return name.includes(searchLower) ||
           email.includes(searchLower) ||
           phone.includes(searchLower)
  })

  const filteredPending = pendingClients.filter(client => {
    const searchLower = search.toLowerCase()
    const name = client.client_name?.toLowerCase() || ''
    const email = client.client_email?.toLowerCase() || ''
    const phone = client.client_phone?.toLowerCase() || ''
    
    return name.includes(searchLower) ||
           email.includes(searchLower) ||
           phone.includes(searchLower)
  })

  const activeList = activeTab === 'approved' ? filteredClients : filteredPending
  const totalPages = Math.max(1, Math.ceil(activeList.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)

  useEffect(() => { setPage(1) }, [search, activeTab])

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
          border: '3px solid var(--border)',
          borderTopColor: 'var(--accent)',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ color: 'var(--text-3)', fontSize: '13px', fontWeight: 600 }}>Loading clients…</span>
      </div>
    )
  }

  const totalPending = pendingClients.length
  const totalApproved = clients.length
  const totalClients = totalApproved + totalPending

  const getInitials = (name) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  }

  const getAvatarStyle = (name) => {
    return { bg: '#FFF0E6', color: '#C56A2A' };
  }

  // ── DYNAMIC DATE ──
  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div style={{
      background: 'var(--bg)',
      color: 'var(--text)',
      fontFamily: "'Inter', -apple-system, sans-serif",
      padding: '0',
      minHeight: '100vh',
      boxSizing: 'border-box',
      maxWidth: '1440px',
      margin: '0 auto',
      overflowX: 'hidden',
    }}>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }
        ::-webkit-scrollbar-track { background: transparent; }

        /* ── ROW LAYOUT ── */
        .list-row {
          display: flex;
          align-items: center;
          padding: 18px 24px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          margin-bottom: 12px;
          gap: 0;
        }

        /* 1. LEFT COLUMN (FLEXIBLE) */
        .col-left {
          display: flex;
          align-items: center;
          gap: 16px;
          flex: 0.48;
          padding-right: 24px;
          border-right: 1px solid var(--border);
          min-width: 200px;
        }
        
        .client-avatar {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 16px;
          flex-shrink: 0;
          border: 2px solid #C56A2A; 
        }

        .client-details {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
          width: 100%;
        }

        .detail-top-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 2px;
          flex-wrap: wrap;
        }

        .client-name {
          font-size: 16px;
          font-weight: 700;
          color: var(--text);
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .status-pill {
          font-size: 10px;
          font-weight: 600;
          padding: 2px 10px;
          border-radius: 99px;
          display: inline-flex;
          align-items: center;
          background: rgba(255, 90, 31, 0.12);
          color: #C56A2A;
          flex-shrink: 0;
        }
        .status-pill.pending {
          background: rgba(77, 158, 245, 0.15);
          color: #4D9EF5;
        }

        .detail-sub-row {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 13px;
          color: var(--text-3);
        }
        .detail-sub-row span {
          display: flex;
          align-items: center;
          gap: 4px;
          min-width: 0;
        }
        .detail-sub-row span span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .detail-sub-row svg { width: 14px; height: 14px; flex-shrink: 0; }

        /* 2. MIDDLE COLUMN: Phone Number */
        .col-phone {
          display: flex;
          flex-direction: column;
          justify-content: center;
          width: 160px; 
          flex-shrink: 0;
          padding: 0 16px 0 24px;
          border-right: 1px solid var(--border);
        }
        .phone-number {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-2);
          line-height: 1.2;
          text-align: left;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: 100%;
        }
        .phone-label {
          font-size: 10px;
          font-weight: 600;
          color: var(--text-3);
          text-transform: uppercase;
          letter-spacing: 0.03em;
          margin-top: 2px;
        }

        /* 3. CENTER COLUMN (Stats) */
        .col-center {
          flex: 1; 
          padding: 0 24px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          align-items: center;
          max-width: 320px; 
          margin-left: auto; 
        }

        .stat-block {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }

        .stat-numbers {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          font-weight: 700;
          color: var(--text);
        }
        .stat-label {
          font-size: 10px;
          font-weight: 600;
          color: var(--text-3);
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .progress-track {
          width: 100%;
          height: 5px;
          background: var(--surface-2);
          border-radius: 99px;
          overflow: hidden;
          margin-top: 2px;
        }
        .progress-fill {
          height: 100%;
          background: #C56A2A;
          border-radius: 99px;
        }
        .progress-fill.blue {
          background: #4D9EF5;
        }

        /* 4. RIGHT COLUMN (Actions & Timestamp) */
        .col-right {
          display: flex;
          align-items: center;
          width: 280px; 
          flex-shrink: 0;
          padding-left: 24px;
          border-left: 1px solid var(--border);
          justify-content: space-between; 
          gap: 16px;
        }

        .timestamp {
          font-size: 12px;
          color: var(--text-2);
          white-space: nowrap;
          display: flex;
          flex-direction: column;
          line-height: 1.4;
          text-align: right;
        }
        .timestamp .sub {
          font-size: 11px;
          color: var(--text-3);
        }

        .action-group {
          display: flex;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
        }

        .flat-btn {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          border: 1px solid transparent;
          background: transparent;
          color: var(--text-3);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          padding: 0;
        }
        .flat-btn:hover {
          background: var(--surface-2);
          border-color: #C56A2A;
          color: #C56A2A;
        }
        .flat-btn svg { width: 16px; height: 16px; }

        /* ── STATS GRID ── */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 28px;
        }
        .stat-card-top {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          min-width: 0;
        }

        /* ── TOOLBAR ── */
        .toolbar {
          display: flex;
          align-items: center;
          gap: 0;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 6px 6px 6px 16px;
          margin-bottom: 28px;
          flex-wrap: wrap;
        }

        .toolbar-search {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
          min-width: 0;
          color: var(--text-3);
        }
        .toolbar-search input {
          flex: 1;
          min-width: 0;
          border: none;
          background: transparent;
          font-size: 14px;
          color: var(--text);
          outline: none;
          font-family: inherit;
        }

        .toolbar-divider {
          width: 1px;
          height: 20px;
          background: var(--border);
          margin: 0 12px;
          flex-shrink: 0;
        }

        .toolbar-select {
          border: none;
          background: transparent;
          color: var(--text-2);
          font-size: 13px;
          font-weight: 500;
          padding: 6px 8px 6px 4px;
          cursor: pointer;
          outline: none;
          font-family: inherit;
          flex-shrink: 0;
        }

        .btn-filter {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border: none;
          border-radius: 8px;
          background: var(--surface-2);
          color: var(--text-2);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          margin-left: auto;
          flex-shrink: 0;
          white-space: nowrap;
        }

        /* ── PAGINATION ── */
        .footer-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 16px;
          font-size: 13px;
          color: var(--text-3);
        }
        .pagination-group {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
        }
        .page-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--text-2);
          font-weight: 600;
          cursor: pointer;
          font-size: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }
        .page-btn:hover:not(.active):not(:disabled) {
          background: var(--surface-2);
        }
        .page-btn.active {
          background: #C56A2A;
          border-color: transparent;
          color: #fff;
          box-shadow: 0 2px 8px rgba(255,90,31,0.35);
        }
        .page-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 1200px) {
          .col-center { max-width: 280px; gap: 12px; padding: 0 16px; }
          .col-right { width: 240px; padding-left: 16px; }
        }
        @media (max-width: 1100px) {
          .list-row { flex-wrap: wrap; padding: 16px; gap: 12px; }
          .col-left { width: 100%; flex: none; padding-right: 0; border-right: none; border-bottom: 1px solid var(--border); padding-bottom: 12px; }
          .col-phone { width: 100%; padding: 12px 0; border-left: none; border-right: none; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); flex-direction: row; align-items: center; justify-content: center; gap: 8px; }
          .col-phone .phone-number { width: auto; text-align: center; }
          .col-phone .phone-label { margin-top: 0; }
          .col-center { width: 100%; max-width: 100%; margin-left: 0; border: none; padding: 12px 0; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
          .col-right { width: 100%; padding-left: 0; border-left: none; justify-content: space-between; padding-top: 12px; }

          /* Toolbar on mobile/tablet: ONLY search + "All Status" dropdown, on one line */
          .toolbar {
            display: flex;
            flex-direction: row;
            flex-wrap: nowrap;
            align-items: center;
            padding: 8px 8px 8px 14px;
            gap: 8px;
          }
          .toolbar-search {
            flex: 1 1 auto;
            min-width: 0;
          }
          .toolbar-search input {
            font-size: 13px;
          }
          .toolbar-divider {
            display: block;
            height: 20px;
            margin: 0 4px;
          }
          .toolbar-select {
            flex-shrink: 0;
            font-size: 12px;
            padding: 6px 4px;
            width: auto;
          }
          /* Hide the "All Programs" dropdown (disabled select) and the Filter button */
          .toolbar-select[disabled] {
            display: none;
          }
          .btn-filter {
            display: none;
          }

          .stats-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
          .list-row { padding: 14px; border-radius: 12px; }
          .col-left { gap: 12px; padding-bottom: 10px; }
          .client-avatar { width: 42px; height: 42px; border-radius: 11px; font-size: 13px; border-width: 1.5px; }
          .client-name { font-size: 14px; }
          .status-pill { font-size: 9px; padding: 2px 8px; }
          .detail-sub-row { font-size: 11.5px; }
          .col-phone { padding: 10px 0; }
          .phone-number { font-size: 12px; }
          .phone-label { font-size: 9px; }
          .col-center { grid-template-columns: 1fr 1fr; gap: 10px; padding: 10px 0; }
          .stat-numbers { font-size: 13px; }
          .stat-label { font-size: 9px; }
          .col-right { flex-wrap: wrap; gap: 10px; padding-top: 10px; }
          .timestamp { text-align: left; }
          .action-group { gap: 2px; margin-left: auto; }
          .flat-btn { width: 30px; height: 30px; }
          .flat-btn svg { width: 14px; height: 14px; }
          .stats-grid { gap: 10px; margin-bottom: 20px; }
          .stat-card-top { padding: 12px 14px; gap: 10px; }

          /* Keep search + All Status on one line, tightened further */
          .toolbar { padding: 6px 6px 6px 12px; gap: 6px; }
          .toolbar-search input { font-size: 12.5px; }
          .toolbar-select { font-size: 11.5px; padding: 6px 2px; }
        }
      `}</style>

      {/* ── TOP HEADER (MATCHING THE SCREENSHOT) ── */}
      <div style={{ marginBottom: '32px' }}>
        <p style={{ 
          fontSize: '12px', 
          color: '#C56A2A', 
          textTransform: 'uppercase', 
          letterSpacing: '0.12em', 
          fontWeight: 700, 
          margin: '0 0 4px 0' 
        }}>
          Coach Portal
        </p>
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: 800, 
          letterSpacing: '-0.02em', 
          margin: '0 0 4px 0', 
          color: 'var(--text)' 
        }}>
          My Clients
        </h1>
        <p style={{ 
          fontSize: '15px', 
          color: 'var(--text-3)', 
          margin: 0 
        }}>
          {dateString}
        </p>
      </div>

      {/* ── STATS ROW ── */}
      <div className="stats-grid">
        {[
          { label: 'Total Clients', value: totalClients, icon: UserCheck, color: '#C56A2A', bg: 'rgba(255,90,31,0.12)' },
          { label: 'Active Members', value: totalApproved, icon: UserCheck, color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
          { label: 'Pending Requests', value: totalPending, icon: Clock, color: '#4D9EF5', bg: 'rgba(77,158,245,0.12)' },
          { label: 'New This Month', value: clients.filter(c => { const d = new Date(c.created_at); const n = new Date(); return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear(); }).length, icon: TrendingUp, color: '#A855F7', bg: 'rgba(168,85,247,0.12)' }
        ].map((s, i) => (
          <div key={i} className="stat-card-top">
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: s.bg, color: s.color, flexShrink: 0 }}>
              <s.icon size={20} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text)', lineHeight: '1.1' }}>{s.value}</div>
              <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-3)', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── FILTER TOOLBAR ── */}
      <div className="toolbar">
        <div className="toolbar-search">
          <Search size={16} />
          <input 
            type="text" 
            placeholder="Search clients by name, email or phone..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
          {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', padding: '4px' }}><X size={14} /></button>}
        </div>
        
        <div className="toolbar-divider" />
        
        <select className="toolbar-select" value={activeTab} onChange={(e) => { setActiveTab(e.target.value); setSearch(''); }}>
          <option value="approved">All Status</option>
          <option value="approved">Active</option>
          <option value="pending">Pending</option>
        </select>

        <div className="toolbar-divider" />

        <select className="toolbar-select" disabled style={{ opacity: 0.6 }}>
          <option>All Programs</option>
        </select>

        <button className="btn-filter">
          <Filter size={14} /> Filter
        </button>
      </div>

      {/* ─── CLIENT LIST ─── */}
      {activeTab === 'approved' ? (
        <div>
          {filteredClients.length === 0 ? (
             <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: '14px' }}>
                <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-2)', margin: 0 }}>No active clients found</p>
                <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '6px' }}>Try adjusting your search or filters.</p>
             </div>
          ) : (
            filteredClients.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE).map(client => {
              const progress = 40 + (client.id * 7 % 60);
              const attendance = 70 + (client.id * 4 % 30);
              const lastCheckin = Math.floor(Math.random() * 3) + 1;
              const avatarStyle = getAvatarStyle(client.user?.name);

              return (
                <div key={client.id} className="list-row">
                  
                  {/* COLUMN 1: User Info */}
                  <div className="col-left">
                    <div className="client-avatar" style={{ background: avatarStyle.bg, color: avatarStyle.color }}>
                      {getInitials(client.user?.name)}
                    </div>
                    <div className="client-details">
                      <div className="detail-top-row">
                        <span className="client-name">{client.user?.name || 'Unknown Member'}</span>
                        <span className="status-pill">{client.is_active !== false ? 'Active' : 'Inactive'}</span>
                      </div>
                      <div className="detail-sub-row">
                        <span><Mail size={14} /> <span>{client.user?.email || 'email@example.com'}</span></span>
                      </div>
                    </div>
                  </div>

                  {/* COLUMN 2: Phone */}
                  <div className="col-phone">
                    <span className="phone-number">{client.phone || '+213 555 67 89'}</span>
                    <span className="phone-label">Phone</span>
                  </div>

                  {/* COLUMN 3: Stats */}
                  <div className="col-center">
                    <div className="stat-block">
                      <div className="stat-numbers"><span>{progress}%</span></div>
                      <div className="stat-label">Progress</div>
                      <div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
                    </div>
                    
                    <div className="stat-block">
                      <div className="stat-numbers"><span>{attendance}%</span></div>
                      <div className="stat-label">Attendance</div>
                      <div className="progress-track"><div className="progress-fill blue" style={{ width: `${attendance}%` }} /></div>
                    </div>
                  </div>

                  {/* COLUMN 4: Far Right */}
                  <div className="col-right">
                    <div className="timestamp">
                      <span>{lastCheckin} days ago</span>
                      <span className="sub">Last Check-in</span>
                    </div>
                    
                    <div className="action-group">
                      <button className="flat-btn" title="Message"><MessageSquare size={16} /></button>
                      <button className="flat-btn" title="Chat"><User size={16} /></button>
                      <Link to={`/coach/clients/${client.id}`} className="flat-btn" title="Edit Profile"><Edit size={16} /></Link>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      ) : (
        <div>
          {filteredPending.length === 0 ? (
             <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: '14px' }}>
                <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-2)', margin: 0 }}>No pending requests</p>
                <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '6px' }}>You're all caught up!</p>
             </div>
          ) : (
            filteredPending.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE).map(req => (
              <div key={req.id} className="list-row" style={{ borderColor: 'rgba(77,158,245,0.2)' }}>
                <div className="col-left">
                  <div className="client-avatar" style={{ background: 'rgba(77,158,245,0.15)', color: '#4D9EF5', borderColor: '#4D9EF5' }}>
                    {getInitials(req.client_name)}
                  </div>
                  <div className="client-details">
                    <div className="detail-top-row">
                      <span className="client-name">{req.client_name || 'Unknown'}</span>
                      <span className="status-pill pending">Pending</span>
                    </div>
                    <div className="detail-sub-row">
                      <span><Mail size={14} /> <span>{req.client_email || '—'}</span></span>
                    </div>
                  </div>
                </div>

                <div className="col-phone">
                  <span className="phone-number">{req.client_phone || '—'}</span>
                  <span className="phone-label">Phone</span>
                </div>

                <div className="col-center" style={{ gridTemplateColumns: '1fr 1fr', gap: '0', marginLeft: 'auto', maxWidth: '160px' }}>
                  <div className="stat-block">
                    <div className="stat-numbers" style={{ color: 'var(--text-3)', fontSize: '12px' }}>Pending</div>
                    <div className="stat-label">Status</div>
                  </div>
                  <div className="stat-block" style={{ alignItems: 'flex-end', textAlign: 'right' }}>
                    <div className="stat-numbers" style={{ color: 'var(--text-3)', fontSize: '12px' }}>Awaiting</div>
                    <div className="stat-label">Decision</div>
                  </div>
                </div>

                <div className="col-right">
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    <button 
                      onClick={() => handleApprove(req.id, req.client_name)} 
                      disabled={processingId === req.id}
                      style={{ padding: '6px 18px', borderRadius: '8px', border: 'none', background: '#22C55E', color: '#fff', fontWeight: 600, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      {processingId === req.id ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <UserCheck size={14} />} Approve
                    </button>
                    <button 
                      onClick={() => handleDecline(req.id, req.client_name)} 
                      disabled={processingId === req.id}
                      style={{ padding: '6px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-3)', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── FOOTER / PAGINATION ── */}
      <div className="footer-actions">
        {totalPages > 1 && (
          <div className="pagination-group">
            <button
              className="page-btn"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={safePage === 1}
            >‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                className={`page-btn ${n === safePage ? 'active' : ''}`}
                onClick={() => setPage(n)}
              >
                {n}
              </button>
            ))}
            <button
              className="page-btn"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
            >›</button>
          </div>
        )}
      </div>
    </div>
  )
}