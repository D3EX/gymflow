// frontend/src/pages/coach/Classes.jsx

import { useEffect, useState } from 'react'
import api from "../../api/client"
import toast from 'react-hot-toast'
import { useAuthStore } from '../../stores/authStore'
import { 
  Edit, Trash2, Plus, MapPin, Users, 
  CalendarDays, Ban, CheckCircle2, Clock, 
  Calendar, X, Save, 
  TrendingUp, Search, Check, Eye, ChevronLeft, ChevronRight,
  User, Award
} from 'lucide-react'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const TYPE_OPTIONS = ['cardio', 'yoga', 'strength', 'boxing', 'pilates', 'spin', 'hiit']
const STATUS_FILTERS = ['All Classes', 'Upcoming', 'Active', 'Completed', 'Cancelled']

const emptyForm = {
  name: '',
  coach: '',
  day_of_week: 'Monday',
  time: '',
  end_time: '',
  max_capacity: 20,
  location: '',
  type: 'cardio',
  description: '',
  is_active: true,
}

const CLASS_IMAGES = {
  cardio: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop',
  yoga: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=300&fit=crop',
  strength: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop',
  boxing: 'https://images.unsplash.com/photo-1518611505868-48510c8f32f5?w=400&h=300&fit=crop',
  pilates: 'https://images.unsplash.com/photo-1516695570033-11af3e3f7b9a?w=400&h=300&fit=crop',
  spin: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop',
  hiit: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop',
}

const TYPE_COLORS = {
  cardio: { bg: '#C56A2A', light: 'rgba(255,90,31,0.12)' },
  yoga: { bg: '#8B5CF6', light: 'rgba(139,92,246,0.12)' },
  strength: { bg: '#F59E0B', light: 'rgba(245,158,11,0.12)' },
  boxing: { bg: '#EF4444', light: 'rgba(239,68,68,0.12)' },
  pilates: { bg: '#06B6D4', light: 'rgba(6,182,212,0.12)' },
  spin: { bg: '#F97316', light: 'rgba(249,115,22,0.12)' },
  hiit: { bg: '#C56A2A', light: 'rgba(255,90,31,0.12)' },
}

export default function CoachClasses() {
  const { user } = useAuthStore()
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClass, setEditingClass] = useState(null)
  const [formData, setFormData] = useState(emptyForm)
  const [statusFilter, setStatusFilter] = useState('All Classes')
  const [submitting, setSubmitting] = useState(false)
  const [selectedClassForMembers, setSelectedClassForMembers] = useState(null)
  const [classBookings, setClassBookings] = useState({})
  const [loadingBookings, setLoadingBookings] = useState(false)
  const [membersModalOpen, setMembersModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  useEffect(() => {
    fetchClasses()
  }, [])

  const fetchClasses = async () => {
    setLoading(true)
    try {
      const res = await api.get('/schedule/classes/coach')
      const classesData = res.data || []
      setClasses(classesData)
      await fetchAllClassBookings(classesData)
    } catch (error) {
      console.error('Error fetching classes:', error)
      toast.error('Failed to fetch classes')
      setClasses([])
    } finally {
      setLoading(false)
    }
  }

  const fetchAllClassBookings = async (classesData) => {
    setLoadingBookings(true)
    try {
      const bookings = {}
      for (const cls of classesData) {
        try {
          const response = await api.get(`/schedule/classes/${cls.id}/bookings`)
          bookings[cls.id] = response.data || []
        } catch (error) {
          bookings[cls.id] = []
        }
      }
      setClassBookings(bookings)
    } catch (error) {
      console.error('Error fetching class bookings:', error)
    } finally {
      setLoadingBookings(false)
    }
  }

  const fetchClassBookings = async (classId) => {
    try {
      const response = await api.get(`/schedule/classes/${classId}/bookings`)
      setClassBookings(prev => ({
        ...prev,
        [classId]: response.data || []
      }))
    } catch (error) {
      console.error('Error fetching class bookings:', error)
    }
  }

  const openMembersModal = async (cls) => {
    setSelectedClassForMembers(cls)
    setMembersModalOpen(true)
    if (!classBookings[cls.id]) {
      await fetchClassBookings(cls.id)
    }
  }

  const closeMembersModal = () => {
    setMembersModalOpen(false)
    setSelectedClassForMembers(null)
  }

  const handleOpenModal = (cls = null) => {
    if (cls) {
      setEditingClass(cls)
      setFormData({
        name: cls.name,
        coach: cls.coach || user?.name || '',
        day_of_week: cls.day_of_week,
        time: cls.time,
        end_time: cls.end_time,
        max_capacity: cls.max_capacity,
        location: cls.location || '',
        type: cls.type || 'cardio',
        description: cls.description || '',
        is_active: cls.is_active,
      })
    } else {
      setEditingClass(null)
      setFormData({
        ...emptyForm,
        coach: user?.name || '',
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingClass(null)
    setSubmitting(false)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      const payload = {
        ...formData,
        max_capacity: parseInt(formData.max_capacity) || 20,
        coach: user?.name || formData.coach,
      }
      
      if (editingClass) {
        await api.put(`/schedule/classes/${editingClass.id}`, payload)
        toast.success('Class updated successfully!')
      } else {
        await api.post('/schedule/classes', payload)
        toast.success('Class created successfully!')
      }
      handleCloseModal()
      fetchClasses()
    } catch (error) {
      console.error('Error saving class:', error)
      toast.error(error.response?.data?.detail || 'Operation failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id, name) => {
    if (confirm(`Delete class "${name}"? This cannot be undone.`)) {
      try {
        await api.delete(`/schedule/classes/${id}`)
        toast.success('Class deleted')
        fetchClasses()
      } catch (error) {
        toast.error('Failed to delete class')
      }
    }
  }

  const handleToggleActive = async (cls) => {
    const newActive = !cls.is_active
    try {
      await api.put(`/schedule/classes/${cls.id}`, {
        name: cls.name,
        coach: cls.coach,
        day_of_week: cls.day_of_week,
        time: cls.time,
        end_time: cls.end_time,
        max_capacity: cls.max_capacity,
        location: cls.location || '',
        type: cls.type || 'cardio',
        description: cls.description || '',
        is_active: newActive,
      })
      setClasses(prev => prev.map(c => c.id === cls.id ? { ...c, is_active: newActive } : c))
      toast.success(newActive ? 'Class activated' : 'Class deactivated')
    } catch (error) {
      console.error('Error toggling class status:', error)
      toast.error(error.response?.data?.detail || 'Failed to update class status')
    }
  }

  const getTypeColor = (type) => {
    return TYPE_COLORS[type] || TYPE_COLORS.cardio
  }

  const filteredClasses = classes.filter(cls => {
    const matchesSearch = cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         cls.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (cls.location || '').toLowerCase().includes(searchQuery.toLowerCase())
    
    if (statusFilter === 'All Classes') return matchesSearch
    if (statusFilter === 'Upcoming') return matchesSearch && cls.is_active
    if (statusFilter === 'Active') return matchesSearch && cls.is_active
    if (statusFilter === 'Completed') return matchesSearch && !cls.is_active
    if (statusFilter === 'Cancelled') return matchesSearch && !cls.is_active
    return matchesSearch
  }).sort((a, b) => {
    const dayDiff = DAYS.indexOf(a.day_of_week) - DAYS.indexOf(b.day_of_week)
    if (dayDiff !== 0) return dayDiff
    return (a.time || '').localeCompare(b.time || '')
  })

  const totalPages = Math.ceil(filteredClasses.length / itemsPerPage)
  const paginatedClasses = filteredClasses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalClasses = classes.length
  const activeClasses = classes.filter(c => c.is_active).length
  const totalParticipants = classes.reduce((sum, c) => sum + (c.max_capacity - (c.spots_left || 0)), 0)
  const avgAttendance = totalClasses > 0 
    ? Math.round(classes.reduce((sum, c) => sum + (c.max_capacity - (c.spots_left || 0)), 0) / totalClasses)
    : 0

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
          borderTopColor: '#C56A2A',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ color: 'var(--text-3)', fontSize: '13px', fontWeight: 600 }}>Loading classes…</span>
      </div>
    )
  }

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
        
        .form-input {
          width: 100%;
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: var(--surface-2);
          color: var(--text);
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }
        .form-input:focus {
          border-color: #C56A2A;
          box-shadow: 0 0 0 3px rgba(255,90,31,0.15);
        }
        .form-input::placeholder {
          color: var(--text-3);
        }
        select.form-input {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2355556a' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 36px;
          cursor: pointer;
        }
        textarea.form-input {
          resize: vertical;
          min-height: 80px;
          font-family: inherit;
        }
        .grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
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

        .btn-secondary {
          padding: 10px 22px;
          border-radius: 10px;
          border: 1px solid var(--border) !important;
          background: transparent !important;
          color: var(--text-2) !important;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: inherit;
        }
        .btn-secondary:hover {
          border-color: var(--text) !important;
          color: var(--text) !important;
          background: var(--surface-2) !important;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.75);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
          animation: fadeIn 0.2s ease;
        }
        .modal-content {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 18px;
          max-width: 560px;
          width: 100%;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 24px 64px rgba(0,0,0,0.4);
          animation: slideUp 0.25s ease;
        }
        .modal-body {
          flex: 1;
          overflow-y: auto;
          padding: 20px 24px;
        }
        .modal-actions {
          display: flex;
          gap: 12px;
          padding: 16px 24px;
          border-top: 1px solid var(--border);
          background: var(--surface-2);
          border-radius: 0 0 18px 18px;
          flex-shrink: 0;
        }
        .form-group {
          margin-bottom: 16px;
        }
        .form-label {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-3);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          display: block;
          margin-bottom: 5px;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* ─── CLASS LIST ITEM DESIGN ─── */
        .class-list-item {
          display: flex;
          align-items: stretch; /* Stretch to fill height */
          padding: 12px 12px; /* Reduced padding to bring image closer to border */
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          transition: all 0.2s ease;
          cursor: default;
          gap: 0; /* Removed gap between image and text to reduce padding */
        }
        .class-list-item:hover {
          border-color: rgba(255,90,31,0.3);
          box-shadow: 0 4px 16px rgba(0,0,0,0.06);
          transform: translateY(-2px);
        }

        /* ─── BIGGER IMAGE ─── */
        .class-image {
          width: 180px;
          height: 110px;
          border-radius: 10px;
          object-fit: cover;
          flex-shrink: 0;
          background: var(--surface-2);
          border: 1px solid var(--border);
        }

        .class-content-wrapper {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          min-width: 0;
          padding-left: 16px; /* Added space between image and text */
        }

        .class-left-section {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 2;
          min-width: 0;
        }

        .class-name {
          font-size: 17px;
          font-weight: 700;
          color: var(--text);
          margin: 0;
          letter-spacing: -0.01em;
        }
        
        .class-type-tag {
          font-size: 12px;
          font-weight: 700;
          background: transparent !important;
          padding: 0;
        }

        .class-schedule-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 13px;
          color: var(--text-2);
          margin-top: 4px;
        }
        
        .class-schedule-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .class-schedule-item svg {
          color: var(--text-3);
          width: 14px;
          height: 14px;
        }

        .class-metrics-section {
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

        .class-actions-right {
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
          background: rgba(34, 197, 94, 0.12);
          color: #22C55E;
          white-space: nowrap;
        }

        .action-buttons {
          display: flex;
          gap: 2px;
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
        .icon-btn.success:hover {
          background: rgba(34,197,94,0.1);
          color: #22C55E;
        }
        .icon-btn.danger:hover {
          background: rgba(239,68,68,0.1);
          color: #EF4444;
        }

        /* ─── FILTERS ─── */
        .filter-tabs {
          display: flex;
          gap: 4px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 4px;
        }
        .filter-tab {
          padding: 7px 16px;
          border-radius: 7px;
          border: none;
          background: transparent;
          color: var(--text-3);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
          font-family: inherit;
        }
        .filter-tab:hover:not(.active) {
          color: var(--text-2);
          background: var(--surface-2);
        }
        .filter-tab.active {
          background: #C56A2A;
          color: #ffffff;
          box-shadow: 0 2px 8px rgba(255,90,31,0.3);
        }

        .filter-select-mobile {
          display: none;
        }

        .search-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 14px;
          border: 1px solid var(--border);
          border-radius: 10px;
          background: var(--surface);
          transition: border-color 0.2s;
          height: 40px;
        }
        .search-bar:focus-within {
          border-color: #C56A2A;
          box-shadow: 0 0 0 3px rgba(255,90,31,0.1);
        }
        .search-bar input {
          flex: 1;
          border: none;
          background: transparent;
          color: var(--text);
          font-size: 13px;
          outline: none;
          font-family: inherit;
          min-width: 120px;
          padding: 8px 0;
        }
        .search-bar input::placeholder {
          color: var(--text-3);
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

        .stat-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 16px 18px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-width: 0;
          transition: all 0.2s ease;
        }
        .stat-card:hover {
          border-color: rgba(255,90,31,0.2);
          box-shadow: 0 4px 16px rgba(0,0,0,0.06);
          transform: translateY(-2px);
        }
        .stat-card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
        }
        .stat-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .stat-value {
          font-size: 26px;
          font-weight: 800;
          color: var(--text);
          letter-spacing: -0.02em;
          line-height: 1;
        }
        .stat-label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .member-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 10px;
          background: var(--surface-2);
          border: 1px solid var(--border);
          transition: all 0.15s ease;
        }
        .member-item:hover {
          border-color: rgba(255,90,31,0.3);
          background: var(--surface-3);
        }
        .member-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255,90,31,0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 700;
          color: #C56A2A;
          flex-shrink: 0;
        }
        .member-name {
          font-size: 14px;
          font-weight: 600;
          color: var(--text);
        }
        .member-status {
          font-size: 10px;
          padding: 2px 10px;
          border-radius: 99px;
          background: rgba(34,197,94,0.1);
          color: #22C55E;
          font-weight: 600;
          margin-left: auto;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border);
          background: var(--surface-2);
          flex-shrink: 0;
          border-radius: 18px 18px 0 0;
        }

        @media (max-width: 1024px) {
          .class-content-wrapper {
            flex-wrap: wrap;
          }
          .class-left-section {
            flex: 1 1 100%;
          }
          .class-metrics-section {
            padding-left: 0;
          }
        }

        @media (max-width: 768px) {
          /* ─── Compact mobile card ─── */
          .class-list-item {
            flex-direction: column;
            align-items: stretch;
            padding: 0;
            overflow: hidden;
            position: relative;
          }
          .class-image {
            width: 100%;
            height: 128px;
            border-radius: 0;
            border: none;
          }
          .class-type-tag {
            position: absolute;
            top: 10px;
            left: 10px;
            background: rgba(10,10,10,0.65) !important;
            color: #ffffff !important;
            padding: 4px 9px !important;
            border-radius: 6px;
            font-size: 10px;
            letter-spacing: 0.02em;
            backdrop-filter: blur(4px);
            z-index: 2;
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
          .class-content-wrapper {
            display: flex;
            flex-wrap: wrap;
            align-items: stretch;
            padding: 10px 14px 12px;
            gap: 0;
            margin-top: 0;
          }
          .class-left-section {
            flex: 1 1 100%;
            gap: 3px;
          }
          .class-name {
            font-size: 15px;
          }
          .class-schedule-row {
            font-size: 12px;
            gap: 3px;
            margin-top: 3px;
          }
          .class-schedule-item svg {
            width: 12px;
            height: 12px;
          }
          .class-metrics-section {
            flex: 1 1 auto;
            justify-content: flex-start;
            gap: 14px;
            padding-top: 10px;
            margin-top: 8px;
            border-top: 1px solid var(--border);
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
          .class-actions-right {
            flex: 0 0 auto;
            justify-content: flex-end;
            width: auto;
            gap: 0;
            padding-top: 10px;
            margin-top: 8px;
            border-top: 1px solid var(--border);
          }
          .icon-btn {
            width: 28px;
            height: 28px;
          }
          .stat-cards {
            grid-template-columns: 1fr 1fr !important;
            gap: 10px !important;
          }
          .stat-card {
            padding: 14px 16px;
            gap: 8px;
          }
          .stat-icon {
            width: 32px;
            height: 32px;
            border-radius: 8px;
          }
          .stat-value {
            font-size: 22px;
          }
          .stat-label {
            font-size: 10px;
          }
          /* ─── Filters: dropdown replaces tab row ─── */
          .filters-row {
            flex-wrap: nowrap !important;
          }
          .filter-tabs {
            display: none;
          }
          .filter-select-mobile {
            display: flex;
            flex: 0 0 auto;
            width: auto;
            min-width: 116px;
            height: 40px;
            padding: 0 30px 0 12px;
            border-radius: 10px;
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
            border-color: #C56A2A;
            box-shadow: 0 0 0 3px rgba(255,90,31,0.15);
          }
          .search-bar {
            flex: 1;
            width: auto;
            min-width: 0;
            max-width: none !important;
          }
          .search-bar input {
            min-width: 0;
          }
          .grid-2 {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .stat-cards {
            grid-template-columns: 1fr 1fr !important;
          }
          .stat-card {
            padding: 12px 14px;
            gap: 6px;
          }
          .stat-icon {
            width: 28px;
            height: 28px;
            border-radius: 8px;
          }
          .stat-value {
            font-size: 19px;
          }
          .stat-label {
            font-size: 9px;
          }
          .class-name {
            font-size: 16px;
          }
          .search-bar input {
            min-width: 0;
          }
        }
      `}</style>

      {/* ─── HEADER ─── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <div>
            <p style={{
              fontSize: 10,
              color: '#C56A2A',
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              fontWeight: 700,
              margin: '0 0 4px',
            }}>
              Schedule
            </p>
            <h1 style={{
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              margin: '0 0 4px',
              color: 'var(--text)',
            }}>
              My Classes
            </h1>
            <p style={{
              fontSize: 13,
              color: 'var(--text-3)',
              margin: 0,
            }}>
              {totalClasses} class{totalClasses !== 1 ? 'es' : ''} · {activeClasses} active
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="btn-primary"
          >
            <Plus size={16} />
            Create New Class
          </button>
        </div>
      </div>

      {/* ─── STATS CARDS ─── */}
      <div className="stat-cards" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '14px',
        marginBottom: '28px',
      }}>
        {[
          { icon: CalendarDays, value: totalClasses, label: 'Total Classes', color: '#C56A2A', bg: 'rgba(255,90,31,0.12)' },
          { icon: Users, value: totalParticipants, label: 'Participants', color: '#4D9EF5', bg: 'rgba(77,158,245,0.12)' },
          { icon: Clock, value: activeClasses, label: 'Active Now', color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
          { icon: TrendingUp, value: avgAttendance, label: 'Avg Attendance', color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
        ].map((stat, i) => (
          <div key={i} className="stat-card">
            <div className="stat-card-top">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-icon" style={{ background: stat.bg }}>
                <stat.icon size={18} color={stat.color} />
              </div>
            </div>
            <div className="stat-label" style={{ color: stat.color }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ─── FILTERS + SEARCH ─── */}
      <div className="filters-row" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        marginBottom: '20px',
        flexWrap: 'wrap',
      }}>
        <div className="filter-tabs">
          {STATUS_FILTERS.map(filter => (
            <button
              key={filter}
              className={`filter-tab ${statusFilter === filter ? 'active' : ''}`}
              onClick={() => {
                setStatusFilter(filter)
                setCurrentPage(1)
              }}
            >
              {filter}
            </button>
          ))}
        </div>
        <select
          className="filter-select-mobile"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setCurrentPage(1)
          }}
        >
          {STATUS_FILTERS.map(filter => (
            <option key={filter} value={filter}>{filter}</option>
          ))}
        </select>
        <div className="search-bar" style={{ maxWidth: '280px', width: '100%' }}>
          <Search size={16} color="var(--text-3)" />
          <input
            type="text"
            placeholder="Search classes..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: '4px', display: 'flex' }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ─── CLASSES LIST ─── */}
      {classes.length === 0 ? (
        <div style={{
          background: 'var(--surface)',
          border: '1px dashed var(--border)',
          borderRadius: '16px',
          padding: '80px 20px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '320px',
        }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: 'var(--surface-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <CalendarDays size={32} color="var(--text-3)" style={{ opacity: 0.5 }} />
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-2)', margin: '0 0 8px' }}>
            No classes created yet
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--text-3)', margin: '0 0 24px', maxWidth: '400px' }}>
            Get started by creating your first class to begin building your schedule.
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="btn-primary"
            style={{ margin: '0 auto' }}
          >
            <Plus size={16} />
            Create Class
          </button>
        </div>
      ) : filteredClasses.length === 0 ? (
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '60px 20px',
          textAlign: 'center',
        }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: 'var(--surface-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px',
          }}>
            <Search size={28} color="var(--text-3)" style={{ opacity: 0.4 }} />
          </div>
          <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-2)', margin: '0 0 4px' }}>
            No matches found
          </p>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', margin: 0 }}>
            Try adjusting your search or filters.
          </p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {paginatedClasses.map((cls) => {
              const spotsLeft = cls.spots_left || 0
              const bookedCount = cls.max_capacity - spotsLeft
              const attendancePercent = Math.round((bookedCount / cls.max_capacity) * 100)
              const typeColor = getTypeColor(cls.type)

              return (
                <div key={cls.id} className="class-list-item">
                  <img 
                    src={CLASS_IMAGES[cls.type] || CLASS_IMAGES.cardio}
                    alt={cls.name}
                    className="class-image"
                  />
                  
                  <div className="class-content-wrapper">
                    <div className="class-left-section">
                      <p className="class-name">{cls.name}</p>
                      <span className="class-type-tag" style={{ color: typeColor.bg }}>
                        {cls.type.toUpperCase()}
                      </span>
                      <div className="class-schedule-row">
                        <span className="class-schedule-item">
                          <Calendar size={14} />
                          {cls.day_of_week} · {cls.time} - {cls.end_time}
                        </span>
                        <span className="class-schedule-item">
                          <MapPin size={14} />
                          {cls.location || 'Studio 1'}
                        </span>
                      </div>
                    </div>

                    <div className="class-metrics-section">
                      <div className="metric-block">
                        <span className="num">{bookedCount}</span>
                        <span className="label">Participants</span>
                      </div>
                      <div className="metric-divider" />
                      <div className="metric-block">
                        <span className="num">{attendancePercent}%</span>
                        <span className="label">Attendance</span>
                      </div>
                    </div>

                    <div className="class-actions-right">
                      <span className="status-badge">
                        {cls.is_active ? 'Upcoming' : 'Inactive'}
                      </span>
                      
                      <div className="action-buttons">
                        {bookedCount > 0 && (
                          <button onClick={() => openMembersModal(cls)} className="icon-btn primary" title="View members">
                            <Eye size={16} />
                          </button>
                        )}
                        <button onClick={() => handleOpenModal(cls)} className="icon-btn primary" title="Edit class">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleToggleActive(cls)} className="icon-btn success" title={cls.is_active ? 'Deactivate' : 'Activate'}>
                          {cls.is_active ? <Ban size={16} /> : <CheckCircle2 size={16} />}
                        </button>
                        <button onClick={() => handleDelete(cls.id, cls.name)} className="icon-btn danger" title="Delete class">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i + 1}
                  className={`pagination-btn ${currentPage === i + 1 ? 'active' : ''}`}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}


        </>
      )}

      {/* ─── MEMBERS MODAL ─── */}
      {membersModalOpen && selectedClassForMembers && (
        <div className="modal-overlay" onClick={closeMembersModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: 'var(--text)' }}>
                  Class Members
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-3)', margin: '2px 0 0' }}>
                  {selectedClassForMembers.name}
                </p>
              </div>
              <button
                onClick={closeMembersModal}
                style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  border: 'none', background: 'transparent',
                  color: 'var(--text-3)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'var(--surface-3)'
                  e.currentTarget.style.color = 'var(--text)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--text-3)'
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {loadingBookings ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    border: '3px solid var(--border)',
                    borderTopColor: '#C56A2A',
                    animation: 'spin 0.8s linear infinite',
                    margin: '0 auto 12px',
                  }} />
                  <p style={{ fontSize: '13px', color: 'var(--text-3)' }}>Loading members...</p>
                </div>
              ) : (classBookings[selectedClassForMembers.id] || []).length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  border: '1px dashed var(--border)',
                  borderRadius: '12px',
                }}>
                  <Users size={32} color="var(--text-3)" style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                  <p style={{ fontSize: '14px', color: 'var(--text-2)', fontWeight: 600, margin: 0 }}>No members booked</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '4px' }}>This class has no bookings yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(classBookings[selectedClassForMembers.id] || []).map((booking, idx) => (
                    <div key={idx} className="member-item">
                      <div className="member-avatar">
                        {booking.member_name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <span className="member-name">
                        {booking.member_name || 'Unknown Member'}
                      </span>
                      <span className="member-status">
                        <Check size={10} style={{ display: 'inline', marginRight: '4px' }} />
                        Booked
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button
                onClick={closeMembersModal}
                className="btn-secondary"
                style={{ flex: 1 }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── CREATE/EDIT MODAL ─── */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: 'var(--text)' }}>
                  {editingClass ? 'Edit Class' : 'Create New Class'}
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-3)', margin: '2px 0 0' }}>
                  {editingClass ? `Update "${editingClass.name}"` : 'Add a new class to your schedule'}
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  border: 'none', background: 'transparent',
                  color: 'var(--text-3)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'var(--surface-3)'
                  e.currentTarget.style.color = 'var(--text)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--text-3)'
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                <label className="form-label">Class Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="form-input"
                  required
                  placeholder="e.g., Morning HIIT, Yoga Flow"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Coach</label>
                <input
                  type="text"
                  className="form-input"
                  value={user?.name || ''}
                  disabled
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Class Type *</label>
                  <select name="type" value={formData.type} onChange={handleChange} className="form-input" required>
                    {TYPE_OPTIONS.map(t => (
                      <option key={t} value={t}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Day of Week *</label>
                  <select name="day_of_week" value={formData.day_of_week} onChange={handleChange} className="form-input" required>
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Start Time *</label>
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Time *</label>
                  <input
                    type="time"
                    name="end_time"
                    value={formData.end_time}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Max Capacity *</label>
                  <input
                    type="number"
                    name="max_capacity"
                    value={formData.max_capacity}
                    onChange={handleChange}
                    className="form-input"
                    required
                    min="1"
                    max="100"
                    placeholder="20"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Studio 2, Main Floor"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="form-input"
                  rows="2"
                  placeholder="What should members expect?"
                />
              </div>

              {editingClass && (
                <div className="form-group" style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: formData.is_active ? 'rgba(34,197,94,0.06)' : 'rgba(107,114,128,0.04)',
                  border: `1px solid ${formData.is_active ? 'rgba(34,197,94,0.2)' : 'var(--border)'}`,
                }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', margin: 0 }}>
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleChange}
                      style={{
                        width: '18px', height: '18px',
                        accentColor: '#C56A2A',
                        cursor: 'pointer',
                      }}
                    />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>
                      {formData.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </label>
                </div>
              )}
            </form>

            <div className="modal-actions">
              <button
                type="submit"
                className="btn-primary"
                disabled={submitting}
                style={{ flex: 1 }}
                onClick={(e) => {
                  e.preventDefault()
                  handleSubmit(e)
                }}
              >
                {submitting ? (
                  <>
                    <div style={{
                      width: '16px', height: '16px', borderRadius: '50%',
                      border: '2px solid #FFFFFF',
                      borderTopColor: 'transparent',
                      animation: 'spin 0.8s linear infinite',
                    }} />
                    {editingClass ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    {editingClass ? 'Update Class' : 'Create Class'}
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleCloseModal}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}