// frontend/src/pages/coach/Programs.jsx
import { useState, useEffect } from 'react'
import { useAuthStore } from '../../stores/authStore'
import {
  Dumbbell, Plus, Search, Users, Edit2, Copy, Trash2, X,
  Loader2, Calendar, Clock, BarChart3, ChevronRight, Target,
  TrendingUp, MoreHorizontal, Layers, Zap, ArrowUpRight, CalendarDays,
  AlertTriangle
} from 'lucide-react'
import api from '../../api/client'
import toast from 'react-hot-toast'
import ProgramBuilder from './ProgramBuilder'
import { LoadingSpinner, EmptyState } from './components'

export default function CoachPrograms() {
  const { user } = useAuthStore()
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [clients, setClients] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [builderProgram, setBuilderProgram] = useState(null)
  const [openMenu, setOpenMenu] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [page, setPage] = useState(1)
  const PER_PAGE = 6

  const [formData, setFormData] = useState({
    name: '', description: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 56 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    coach_name: user?.name || '',
    client_id: ''
  })

  // ─── RANDOM PROGRAM IMAGES ───
  const PROGRAM_IMAGES = [
    'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1517931524326-bdd55a541177?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1584735935682-2f2f84a94c41?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=400&h=300&fit=crop',
  ]

  useEffect(() => {
    fetchPrograms()
    fetchClients()
    if (user?.name) setFormData(p => ({ ...p, coach_name: user.name }))
  }, [user])

  useEffect(() => {
    const close = () => setOpenMenu(null)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [])

  const fetchPrograms = async () => {
    setLoading(true)
    try {
      const res = await api.get('/programs/coach')
      setPrograms(res.data || [])
    } catch {
      toast.error('Failed to load programs')
      setPrograms([])
    } finally { setLoading(false) }
  }

  const fetchClients = async () => {
    try {
      const res = await api.get('/coach/clients')
      setClients(res.data || [])
    } catch {}
  }

  const handleCreate = async () => {
    if (!formData.name.trim()) return
    setSubmitting(true)
    try {
      const res = await api.post('/programs/coach', {
        name: formData.name.trim(),
        description: formData.description || null,
        start_date: formData.start_date,
        end_date: formData.end_date,
        coach_name: formData.coach_name || user?.name || 'Coach',
        client_id: formData.client_id ? parseInt(formData.client_id) : null,
      })
      toast.success('Program created!')
      setShowCreateModal(false)
      setFormData({
        name: '', description: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 56 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        coach_name: user?.name || '',
        client_id: ''
      })
      await fetchPrograms()
      setBuilderProgram(res.data)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed')
    } finally { setSubmitting(false) }
  }

  const handleDelete = (id, name, e) => {
    e?.stopPropagation()
    setOpenMenu(null)
    setDeleteTarget({ id, name })
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await api.delete(`/programs/coach/${deleteTarget.id}`)
      toast.success('Deleted')
      fetchPrograms()
    } catch {
      toast.error('Failed')
    } finally {
      setDeleteTarget(null)
    }
  }

  const handleDuplicate = async (prog, e) => {
    e?.stopPropagation()
    setOpenMenu(null)
    try {
      await api.post('/programs/coach', {
        name: `${prog.name} (Copy)`,
        description: prog.description,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 56 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        coach_name: user?.name || prog.coach_name,
        client_id: prog.member_id || null,
      })
      toast.success('Duplicated!')
      fetchPrograms()
    } catch { toast.error('Failed') }
  }

  const totalPrograms = programs.length
  const activePrograms = programs.filter(p => p.is_active).length
  const inactivePrograms = programs.filter(p => !p.is_active).length
  const assignedPrograms = programs.filter(p => p.member_id).length

  const filtered = programs.filter(p => {
    const q = search.toLowerCase()
    const matchName = p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q) || p.coach_name?.toLowerCase().includes(q)
    const matchStatus = filterStatus === 'all' || (filterStatus === 'active' && p.is_active) || (filterStatus === 'inactive' && !p.is_active)
    return matchName && matchStatus
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  useEffect(() => { setPage(1) }, [search, filterStatus])

  if (builderProgram) {
    return (
      <ProgramBuilder
        program={builderProgram}
        clients={clients}
        onBack={() => { setBuilderProgram(null); fetchPrograms() }}
        onRefreshList={fetchPrograms}
      />
    )
  }

  if (loading) {
    return (
      <div style={{ background: 'var(--bg)', color: 'var(--text)', fontFamily: "'Inter', -apple-system, sans-serif", minHeight: '100vh' }}>
        <LoadingSpinner />
      </div>
    )
  }

  const stats = [
    { label: 'Total', value: totalPrograms, icon: Layers, color: 'var(--accent)', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.2)' },
    { label: 'Active', value: activePrograms, icon: Zap, color: '#22C55E', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.2)' },
    { label: 'Inactive', value: inactivePrograms, icon: Clock, color: 'var(--text-3)', bg: 'rgba(107,114,128,0.07)', border: 'var(--border)' },
    { label: 'Assigned', value: assignedPrograms, icon: Users, color: '#4D9EF5', bg: 'rgba(77,158,245,0.1)', border: 'rgba(77,158,245,0.2)' },
  ]

  // Generate initials-based avatar color from program name
  const getAvatarColor = (name) => {
    const colors = [
      { bg: 'rgba(249,115,22,0.15)', color: 'var(--accent)' },
      { bg: 'rgba(77,158,245,0.15)', color: '#4D9EF5' },
      { bg: 'rgba(34,197,94,0.15)', color: '#22C55E' },
      { bg: 'rgba(168,85,247,0.15)', color: '#A855F7' },
      { bg: 'rgba(244,63,94,0.15)', color: '#F43F5E' },
      { bg: 'rgba(20,184,166,0.15)', color: '#14B8A6' },
    ]
    const idx = (name?.charCodeAt(0) || 0) % colors.length
    return colors[idx]
  }

  return (
    <div style={{
      background: 'var(--bg)',
      color: 'var(--text)',
      fontFamily: "'Inter', -apple-system, sans-serif",
      minHeight: '100vh',
      boxSizing: 'border-box',
      maxWidth: '1440px',
      margin: '0 auto',
      overflowX: 'hidden',
    }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }

        /* ── Form inputs ── */
        .p-input {
          width: 100%;
          padding: 9px 13px;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: var(--surface-2);
          color: var(--text);
          font-size: 13.5px;
          outline: none;
          transition: border-color 0.18s, box-shadow 0.18s;
          font-family: inherit;
        }
        .p-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(249,115,22,0.14);
        }
        .p-input::placeholder { color: var(--text-3); }
        .p-label {
          display: block;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          color: var(--text-3);
          margin-bottom: 6px;
        }

        .btn-primary {
          padding: 10px 22px;
          border-radius: 10px;
          border: none !important;
          background: #C56A2A !important;
          color: #FFFFFF !important;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: inherit;
        }
        .btn-primary:hover:not(:disabled) {
          opacity: 0.85 !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 14px rgba(255,90,31,0.35);
        }
        .btn-primary:disabled {
          opacity: 0.5 !important;
          cursor: not-allowed;
          transform: none !important;
        }

        .btn-cta {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 9px 18px;
          border-radius: 8px;
          border: none;
          background: var(--accent);
          color: #fff;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: opacity 0.15s, transform 0.15s, box-shadow 0.15s;
          box-shadow: 0 1px 4px rgba(249,115,22,0.25);
          white-space: nowrap;
          letter-spacing: -0.01em;
        }
        .btn-cta:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(249,115,22,0.35);
        }
        .btn-cta:active:not(:disabled) { transform: translateY(0); opacity: 0.95; }
        .btn-cta:disabled { opacity: 0.45; cursor: not-allowed; }

        .btn-ghost {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 9px 16px;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: transparent;
          color: var(--text-2);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          font-family: inherit;
          transition: background 0.15s, border-color 0.15s, color 0.15s;
          white-space: nowrap;
        }
        .btn-ghost:hover {
          background: var(--surface-2);
          border-color: var(--text-3);
          color: var(--text);
        }

        /* ── CLASS LIST ITEM DESIGN (MATCHING CLASSES.JSX) ── */
        .program-list-item {
          display: flex;
          align-items: stretch;
          padding: 12px 12px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          transition: all 0.2s ease;
          cursor: pointer;
          gap: 0;
          margin-bottom: 12px;
        }
        .program-list-item:hover {
          border-color: rgba(255,90,31,0.3);
          box-shadow: 0 4px 16px rgba(0,0,0,0.06);
          transform: translateY(-2px);
        }

        .program-image {
          width: 180px;
          height: 110px;
          border-radius: 10px;
          object-fit: cover;
          flex-shrink: 0;
          background: var(--surface-2);
          border: 1px solid var(--border);
        }

        .program-content-wrapper {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          min-width: 0;
          padding-left: 16px;
        }

        .program-left-section {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 2;
          min-width: 0;
        }

        .program-name {
          font-size: 17px;
          font-weight: 700;
          color: var(--text);
          margin: 0;
          letter-spacing: -0.01em;
        }
        
        .program-type-tag {
          font-size: 12px;
          font-weight: 700;
          background: transparent !important;
          padding: 0;
          color: var(--text-3);
        }

        .program-schedule-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 13px;
          color: var(--text-2);
          margin-top: 4px;
        }
        
        .program-schedule-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .program-schedule-item svg {
          color: var(--text-3);
          width: 14px;
          height: 14px;
        }

        .program-metrics-section {
          display: flex;
          align-items: center;
          gap: 24px;
          flex-shrink: 0;
        }

        .metric-block {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .metric-block .num {
          font-size: 16px;
          font-weight: 700;
          color: var(--text);
          line-height: 1.2;
        }
        .metric-block .label {
          font-size: 11px;
          font-weight: 500;
          color: var(--text-3);
        }

        .metric-divider {
          width: 1px;
          height: 28px;
          background: var(--border);
        }

        .program-actions-right {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-shrink: 0;
        }

        .status-badge {
          padding: 4px 14px;
          border-radius: 99px;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
          border: 1px solid transparent;
        }
        .status-active {
          background: rgba(34,197,94,0.12);
          color: #22C55E;
        }
        .status-inactive {
          background: var(--surface-2);
          color: var(--text-3);
          border-color: var(--border);
        }

        /* ── CLEAN ACTION BUTTONS ── */
        .action-buttons {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .icon-btn {
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 8px;
          background: transparent;
          color: var(--text-3);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
          padding: 0;
        }
        .icon-btn:hover {
          background: var(--surface-2);
          color: var(--text-2);
        }
        .icon-btn.primary:hover {
          background: rgba(255,90,31,0.1);
          color: #C56A2A;
        }
        .icon-btn.danger:hover {
          background: rgba(239,68,68,0.1);
          color: #EF4444;
        }

        .open-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 5px 14px;
          border-radius: 6px;
          border: 1px solid var(--border);
          background: transparent;
          color: var(--text-2);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .open-btn:hover {
          background: rgba(255,90,31,0.06);
          border-color: rgba(255,90,31,0.35);
          color: var(--accent);
        }

        .dropdown-wrap { position: relative; display: inline-block; }
        .dropdown-menu {
          position: absolute;
          right: 0;
          top: calc(100% + 6px);
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 10px;
          box-shadow: 0 12px 40px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.15);
          z-index: 100;
          min-width: 148px;
          overflow: hidden;
          animation: dropIn 0.12s ease;
        }
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes dropInUp {
          from { opacity: 0; transform: translateY(6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 9px 14px;
          font-size: 12.5px;
          font-weight: 500;
          cursor: pointer;
          color: var(--text-2);
          background: transparent;
          border: none;
          width: 100%;
          font-family: inherit;
          text-align: left;
          transition: background 0.1s, color 0.1s;
        }
        .dropdown-item:hover { background: var(--surface-2); color: var(--text); }
        .dropdown-item.red { color: #F25959; }
        .dropdown-item.red:hover { background: rgba(242,89,89,0.08); color: #F25959; }
        .dropdown-divider { height: 1px; background: var(--border); margin: 3px 0; }

        /* ── Filter tabs ── */
        .filter-tabs {
          display: flex;
          gap: 4px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 4px;
        }
        .filter-tab {
          padding: 6px 14px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          background: transparent;
          color: var(--text-3);
          font-family: inherit;
          transition: background 0.12s, color 0.12s;
        }
        .filter-tab.active {
          background: #C56A2A;
          color: #fff;
          box-shadow: 0 1px 6px rgba(255,90,31,0.3);
        }
        .filter-tab:not(.active):hover { color: var(--text-2); background: var(--surface-2); }

        .filter-select-mobile {
          display: none;
        }

        /* ── Stat strip ── */
        .stat-strip {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }
        .stat-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 16px 18px;
          display: flex;
          align-items: center;
          gap: 14px;
          transition: border-color 0.15s, transform 0.15s;
        }
        .stat-card:hover {
          transform: translateY(-1px);
        }
        .stat-icon-wrap {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border: 1px solid transparent;
        }
        .stat-value {
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.04em;
          line-height: 1;
          margin-bottom: 2px;
        }
        .stat-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-3);
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        /* ── Empty state ── */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 24px;
          color: var(--text-3);
          text-align: center;
          background: var(--surface);
          border: 1px dashed var(--border);
          border-radius: 16px;
          min-height: 320px;
        }
        .empty-icon-wrap {
          width: 64px;
          height: 64px;
          border-radius: 16px;
          background: var(--surface-2);
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }

        /* ── Modal ── */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
          animation: fadeIn 0.14s ease;
        }
        .modal-box {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          width: 100%;
          max-width: 480px;
          max-height: 90vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 24px 80px rgba(0,0,0,0.5);
          animation: slideUp 0.2s ease;
        }
        .modal-accent { height: 2px; background: linear-gradient(90deg, var(--accent), #FF8A5C); flex-shrink: 0; }
        .modal-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
        }
        .modal-body {
          overflow-y: auto;
          padding: 20px;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .modal-footer {
          display: flex; gap: 8px;
          padding: 14px 20px;
          border-top: 1px solid var(--border);
          flex-shrink: 0;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.975); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Responsive ── */
        @media (max-width: 1024px) {
          .program-content-wrapper { flex-wrap: wrap; }
          .program-left-section { flex: 1 1 100%; }
          .program-metrics-section { padding-left: 0; }
        }
        @media (max-width: 900px) {
          .stat-strip { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
          /* ─── Compact mobile card ─── */
          .program-list-item {
            flex-direction: column;
            align-items: stretch;
            padding: 0;
            overflow: visible;
            position: relative;
          }
          .program-image {
            width: 100%;
            height: 128px;
            border-radius: 13px 13px 0 0;
            border: none;
          }
          .status-badge {
            position: absolute;
            top: 10px;
            right: 10px;
            z-index: 2;
            padding: 3px 10px;
            font-size: 10px;
            backdrop-filter: blur(4px);
          }
          .status-active {
            background: rgba(34,197,94,0.85);
            color: #fff;
          }
          .status-inactive {
            background: rgba(10,10,10,0.6);
            color: #fff;
            border-color: transparent;
          }
          .program-content-wrapper {
            display: flex;
            flex-wrap: wrap;
            align-items: stretch;
            padding: 10px 14px 16px;
            gap: 0;
            margin-top: 0;
          }
          .program-left-section {
            flex: 1 1 100%;
            gap: 3px;
          }
          .program-name {
            font-size: 15px;
          }
          .program-type-tag {
            font-size: 12px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            display: block;
            max-width: 100%;
          }
          .program-schedule-row {
            font-size: 12px;
            gap: 3px;
            margin-top: 3px;
          }
          .program-schedule-item svg {
            width: 12px;
            height: 12px;
          }
          .program-metrics-section {
            flex: 1 1 100%;
            width: 100%;
            justify-content: space-between;
            gap: 8px;
            padding-top: 10px;
            margin-top: 8px;
            border-top: 1px solid var(--border);
          }
          .program-metrics-section .metric-block {
            flex: 1;
          }
          .metric-block .num {
            font-size: 14px;
          }
          .metric-block .label {
            font-size: 10px;
          }
          .metric-divider {
            height: 20px;
          }
          .program-actions-right {
            flex: 1 1 100%;
            justify-content: space-between;
            width: 100%;
            gap: 8px;
            margin-top: 12px;
          }
          .action-buttons {
            width: 100%;
            gap: 8px;
          }
          .open-btn {
            flex: 1;
            justify-content: center;
            padding: 9px 14px;
            background: var(--accent) !important;
            border-color: transparent !important;
            color: #fff !important;
            font-weight: 700;
          }
          .open-btn svg {
            color: #fff !important;
          }
          .dropdown-wrap {
            flex-shrink: 0;
          }
          .dropdown-menu {
            top: auto;
            bottom: calc(100% + 6px);
            animation: dropInUp 0.12s ease;
          }
          .icon-btn {
            width: 34px;
            height: 34px;
            border: 1px solid var(--border);
            border-radius: 8px;
          }
          .stat-strip {
            grid-template-columns: repeat(2, 1fr);
          }
          /* ─── Toolbar: dropdown replaces tab row ─── */
          .toolbar-row {
            flex-wrap: nowrap !important;
          }
          .filter-tabs {
            display: none;
          }
          .filter-select-mobile {
            display: flex;
            flex: 0 0 auto;
            width: auto;
            min-width: 96px;
            height: 38px;
            padding: 0 28px 0 12px;
            border-radius: 8px;
            border: 1px solid var(--border);
            background: var(--surface);
            color: var(--text);
            font-size: 12px;
            font-weight: 600;
            font-family: inherit;
            appearance: none;
            -webkit-appearance: none;
            background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2355556a' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
            background-repeat: no-repeat;
            background-position: right 10px center;
            cursor: pointer;
          }
          .filter-select-mobile:focus {
            outline: none;
            border-color: var(--accent);
            box-shadow: 0 0 0 3px rgba(249,115,22,0.14);
          }
        }
        @media (max-width: 480px) {
          .stat-strip { grid-template-columns: repeat(2, 1fr); }
          .program-metrics-section { gap: 16px; }
        }

        .pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          margin-top: 24px;
        }
        .pagination-btn {
          width: 36px;
          height: 36px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--surface);
          color: var(--text-2);
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: inherit;
        }
        .pagination-btn.active {
          background: #C56A2A;
          color: #ffffff;
          border-color: transparent;
          box-shadow: 0 2px 8px rgba(255,90,31,0.35);
        }
        .pagination-btn:hover:not(:disabled):not(.active) {
          border-color: var(--text);
          color: var(--text);
          background: var(--surface-2);
        }
        .pagination-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
      `}</style>

      {/* ── Header ── */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: '10px', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.16em', fontWeight: 700, marginBottom: 8, marginTop: 0 }}>
          Training
        </p>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.03em', margin: 0, color: 'var(--text)' }}>
              Programs
            </h1>
            <p style={{ fontSize: '12.5px', color: 'var(--text-3)', marginTop: 4, marginBottom: 0, fontWeight: 400 }}>
              {programs.length} program{programs.length !== 1 ? 's' : ''} · Manage and assign training plans
            </p>
          </div>
          <button className="btn-cta" onClick={() => setShowCreateModal(true)}>
            <Plus size={14} /> New program
          </button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="stat-strip">
        {stats.map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon-wrap" style={{ background: s.bg, borderColor: s.border }}>
              <s.icon size={16} color={s.color} />
            </div>
            <div>
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="toolbar-row" style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'var(--surface)',
          borderRadius: 8,
          padding: '0 12px',
          border: '1px solid var(--border)',
          minWidth: 0,
          transition: 'border-color 0.18s',
          height: 38,
        }}
          onFocusCapture={e => e.currentTarget.style.borderColor = 'var(--accent)'}
          onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          <Search size={13} color="var(--text-3)" style={{ flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search programs…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ background: 'none', border: 'none', outline: 'none', fontSize: '13px', color: 'var(--text)', width: '100%', minWidth: 0, fontFamily: 'inherit', padding: 0 }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 0, display: 'flex', alignItems: 'center', flexShrink: 0 }}
            >
              <X size={13} />
            </button>
          )}
        </div>
        <div className="filter-tabs">
          {['all', 'active', 'inactive'].map(f => (
            <button key={f} className={`filter-tab ${filterStatus === f ? 'active' : ''}`} onClick={() => setFilterStatus(f)}>
              {f === 'all' ? `All (${programs.length})` : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <select
          className="filter-select-mobile"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="all">All ({programs.length})</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* ── Programs List ── */}
      {programs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon-wrap">
            <Dumbbell size={26} style={{ opacity: 0.4 }} />
          </div>
          <div style={{ fontWeight: 650, fontSize: 16, color: 'var(--text-2)', marginBottom: 6 }}>
            No programs created yet
          </div>
          <div style={{ fontSize: 13, marginBottom: 20, maxWidth: 280, lineHeight: 1.6 }}>
            Get started by creating your first program to begin structuring your training plans.
          </div>
          <button
            className="btn-primary"
            onClick={() => setShowCreateModal(true)}
            style={{ margin: '0 auto' }}
          >

            Create program
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state" style={{ minHeight: 200, padding: 40 }}>
          <div style={{ fontWeight: 650, fontSize: 16, color: 'var(--text-2)', marginBottom: 6 }}>
            No programs match your search
          </div>
          <div style={{ fontSize: 13, marginBottom: 16, maxWidth: 280, lineHeight: 1.6 }}>
            Try adjusting your search or filters.
          </div>
          <button className="btn-ghost" onClick={() => { setSearch(''); setFilterStatus('all') }} style={{ margin: '0 auto' }}>
            Clear filters
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {paginated.map(prog => {
            const clientName = clients.find(c => c.id === prog.member_id)?.user?.name
            const totalWeeks = prog.weeks?.length || 0
            const totalDays = prog.weeks?.reduce((s, w) => s + (w.days?.length || 0), 0) || 0
            const totalEx = prog.weeks?.reduce((s, w) => s + (w.days?.reduce((s2, d) => s2 + (d.exercises?.length || 0), 0) || 0), 0) || 0
            const doneEx = prog.weeks?.reduce((s, w) => s + (w.days?.reduce((s2, d) => s2 + (d.exercises?.filter(e => e.done)?.length || 0), 0) || 0), 0) || 0
            const pct = totalEx > 0 ? Math.round((doneEx / totalEx) * 100) : 0

            const startDate = prog.start_date ? new Date(prog.start_date) : null
            const endDate = prog.end_date ? new Date(prog.end_date) : null
            const diffDays = startDate && endDate ? Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) : null
            const durationWeeks = diffDays ? Math.round(diffDays / 7) : null

            // Determine consistent random image based on program ID
            const randomImage = PROGRAM_IMAGES[prog.id % PROGRAM_IMAGES.length];

            const avatarColor = getAvatarColor(prog.name)
            const initials = prog.name
              ? prog.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
              : '?'

            return (
              <div key={prog.id} className="program-list-item" onClick={() => setBuilderProgram(prog)}>
                <img 
                  src={randomImage} 
                  alt={prog.name}
                  className="program-image"
                />
                
                <div className="program-content-wrapper">
                  <div className="program-left-section">
                    <p className="program-name">{prog.name}</p>
                    <span className="program-type-tag" style={{ color: prog.is_active ? 'var(--accent)' : 'var(--text-3)' }}>
                      {prog.description || 'No description'}
                    </span>
                    <div className="program-schedule-row">
                      <span className="program-schedule-item">
                        <Calendar size={14} />
                        {startDate?.toLocaleDateString() || 'Start'} - {endDate?.toLocaleDateString() || 'End'}
                      </span>
                      <span className="program-schedule-item">
                        <Users size={14} />
                        {clientName || 'Unassigned'}
                      </span>
                    </div>
                  </div>

                  <div className="program-metrics-section">
                    <div className="metric-block">
                      <span className="num">{totalWeeks}</span>
                      <span className="label">Weeks</span>
                    </div>
                    <div className="metric-divider" />
                    <div className="metric-block">
                      <span className="num">{totalEx}</span>
                      <span className="label">Exercises</span>
                    </div>
                    <div className="metric-divider" />
                    <div className="metric-block">
                      <span className="num" style={{ color: pct > 0 ? 'var(--accent)' : 'var(--text-3)' }}>{pct}%</span>
                      <span className="label">Progress</span>
                    </div>
                  </div>

                  <div className="program-actions-right" onClick={e => e.stopPropagation()}>
                    <span className={`status-badge ${prog.is_active ? 'status-active' : 'status-inactive'}`}>
                      {prog.is_active ? 'Active' : 'Inactive'}
                    </span>
                    
                    <div className="action-buttons">
                      {/* Distinct "Open" Button */}
                      <button className="open-btn" onClick={() => setBuilderProgram(prog)}>
                        Open <ChevronRight size={12} />
                      </button>
                      
                      {/* Distinct "Three Dots" Menu */}
                      <div className="dropdown-wrap">
                        <button
                          className="icon-btn"
                          title="More options"
                          onClick={e => { e.stopPropagation(); setOpenMenu(openMenu === prog.id ? null : prog.id) }}
                        >
                          <MoreHorizontal size={16} />
                        </button>
                        {openMenu === prog.id && (
                          <div className="dropdown-menu" onClick={e => e.stopPropagation()}>
                            {/* Added Edit Button */}
                            <button className="dropdown-item" onClick={() => { setBuilderProgram(prog); setOpenMenu(null) }}>
                              <Edit2 size={13} /> Edit
                            </button>
                            <button className="dropdown-item" onClick={e => handleDuplicate(prog, e)}>
                              <Copy size={13} /> Duplicate
                            </button>
                            <div className="dropdown-divider" />
                            <button className="dropdown-item red" onClick={e => handleDelete(prog.id, prog.name, e)}>
                              <Trash2 size={13} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={safePage === 1}
          >‹</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
            <button
              key={n}
              className={`pagination-btn ${n === safePage ? 'active' : ''}`}
              onClick={() => setPage(n)}
            >
              {n}
            </button>
          ))}
          <button
            className="pagination-btn"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
          >›</button>
        </div>
      )}

      {/* ── Create Modal ── */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-accent" />
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={15} color="var(--accent)" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
                    New program
                  </h3>
                  <p style={{ margin: 0, fontSize: 11.5, color: 'var(--text-3)', marginTop: 1 }}>
                    Set up a training plan
                  </p>
                </div>
              </div>
              <button
                className="row-action"
                onClick={() => setShowCreateModal(false)}
              >
                <X size={15} />
              </button>
            </div>
            <div className="modal-body">
              <div>
                <label className="p-label">Program name *</label>
                <input
                  className="p-input"
                  value={formData.name}
                  onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g., Summer Shred 2025"
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                  autoFocus
                />
              </div>
              <div>
                <label className="p-label">Description</label>
                <textarea
                  className="p-input"
                  value={formData.description}
                  onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                  rows={3}
                  placeholder="Goals and overview of this program…"
                  style={{ resize: 'vertical', lineHeight: 1.5 }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="p-label">Start date</label>
                  <input type="date" className="p-input" value={formData.start_date} onChange={e => setFormData(p => ({ ...p, start_date: e.target.value }))} />
                </div>
                <div>
                  <label className="p-label">End date</label>
                  <input type="date" className="p-input" value={formData.end_date} onChange={e => setFormData(p => ({ ...p, end_date: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="p-label">Assign to client</label>
                <select
                  className="p-input"
                  value={formData.client_id}
                  onChange={e => setFormData(p => ({ ...p, client_id: e.target.value }))}
                >
                  <option value="">Unassigned — save as template</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.user?.name || `Client #${c.id}`}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-cta"
                style={{ flex: 1 }}
                disabled={submitting || !formData.name.trim()}
                onClick={handleCreate}
              >
                {submitting
                  ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Creating…</>
                  : <><Plus size={14} /> Create & open builder</>
                }
              </button>
              <button className="btn-ghost" onClick={() => setShowCreateModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── DELETE CONFIRMATION MODAL ─── */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
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
                  background: 'rgba(249, 115, 22, 0.10)',
                  border: '1px solid rgba(249, 115, 22, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '22px',
                }}
              >
                <AlertTriangle size={30} color="var(--accent)" strokeWidth={2} />
              </div>

              <h3
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'var(--text)',
                  margin: '0 0 10px',
                }}
              >
                Delete Program
              </h3>

              <p
                style={{
                  fontSize: '14px',
                  color: 'var(--text-3)',
                  lineHeight: 1.6,
                  maxWidth: '320px',
                  margin: '0 auto 28px',
                }}
              >
                Are you sure you want to delete{' '}
                <span style={{ color: 'var(--text)', fontWeight: 600 }}>
                  {deleteTarget?.name || 'this program'}
                </span>
                ? This cannot be undone.
              </p>

              <div
                style={{
                  width: '100%',
                  borderTop: '1px solid var(--border)',
                  paddingTop: '20px',
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '12px',
                }}
              >
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="btn-ghost"
                  style={{ flex: '0 1 140px' }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="btn-cta"
                  style={{ flex: '0 1 140px', justifyContent: 'center' }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}