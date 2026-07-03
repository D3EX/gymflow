// frontend/src/pages/admin/Classes.jsx

import { useEffect, useState, useRef } from 'react'
import api from "../../api/client"
import toast from 'react-hot-toast'
import { 
  Edit, Trash2, Plus, Dumbbell, MapPin, Award, Users, 
  CalendarDays, Ban, CheckCircle2, UserCircle, Clock, 
  Calendar, Info, X, Save, Sparkles, Target, 
  TrendingUp, Shield, Zap, AlertCircle, ChevronDown,
  Search, Check, MoreVertical
} from 'lucide-react'
import Modal from "../../components/Modal"
import { COLORS, ThemeStyles } from '../../theme/GymTheme'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const TYPE_OPTIONS = ['cardio', 'yoga', 'strength', 'boxing', 'pilates', 'spin', 'hiit']

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

// ─── Custom Coach Select Component ───
function CoachSelect({ value, onChange, coaches, loading, error }) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredCoaches = coaches.filter(coach =>
    coach.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (coach.specialty && coach.specialty.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const selectedCoach = coaches.find(c => c.user.name === value)

  const handleSelect = (coach) => {
    onChange({ target: { name: 'coach', value: coach.user.name } })
    setIsOpen(false)
    setSearchTerm('')
  }

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
      {/* Selected value display */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderRadius: '10px',
          border: `1px solid ${isOpen ? COLORS.ember : COLORS.line}`,
          background: isOpen ? COLORS.surface : COLORS.surface2,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          minHeight: '42px',
          boxShadow: isOpen ? `0 0 0 3px ${COLORS.ember}22` : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
          <UserCircle size={16} color={selectedCoach ? COLORS.ember : COLORS.text3} />
          <span style={{
            color: selectedCoach ? COLORS.text : COLORS.text3,
            fontSize: '13px',
            fontWeight: selectedCoach ? 600 : 400,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {selectedCoach ? (
              <>
                {selectedCoach.user.name}
                {selectedCoach.specialty && (
                  <span style={{ 
                    fontSize: '11px', 
                    color: COLORS.text3, 
                    marginLeft: '6px',
                    fontWeight: 400,
                  }}>
                    ({selectedCoach.specialty})
                  </span>
                )}
              </>
            ) : (
              'Select a coach...'
            )}
          </span>
        </div>
        <ChevronDown 
          size={16} 
          color={COLORS.text3}
          style={{ 
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s ease',
            flexShrink: 0,
            marginLeft: '8px',
          }}
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          right: 0,
          background: COLORS.surface,
          border: `1px solid ${COLORS.line}`,
          borderRadius: '12px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
          zIndex: 1000,
          maxHeight: '280px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Search input */}
          <div style={{
            padding: '10px 12px',
            borderBottom: `1px solid ${COLORS.line}`,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: COLORS.surface2,
          }}>
            <Search size={14} color={COLORS.text3} />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search coaches..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                outline: 'none',
                color: COLORS.text,
                fontSize: '13px',
                fontWeight: 500,
              }}
              autoFocus
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: COLORS.text3,
                  cursor: 'pointer',
                  padding: '2px',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Coaches list */}
          <div style={{
            overflowY: 'auto',
            flex: 1,
            padding: '4px',
          }}>
            {loading ? (
              <div style={{
                padding: '20px',
                textAlign: 'center',
                color: COLORS.text3,
                fontSize: '13px',
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: `2px solid ${COLORS.line}`,
                  borderTopColor: COLORS.ember,
                  animation: 'spin 0.8s linear infinite',
                  margin: '0 auto 8px',
                }} />
                Loading coaches...
              </div>
            ) : filteredCoaches.length === 0 ? (
              <div style={{
                padding: '20px',
                textAlign: 'center',
                color: COLORS.text3,
                fontSize: '13px',
              }}>
                {searchTerm ? 'No coaches found' : error || 'No coaches available'}
              </div>
            ) : (
              filteredCoaches.map((coach) => {
                const isSelected = coach.user.name === value
                return (
                  <div
                    key={coach.id}
                    onClick={() => handleSelect(coach)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: isSelected ? COLORS.emberBg : 'transparent',
                      transition: 'all 0.15s ease',
                      border: isSelected ? `1px solid ${COLORS.ember}44` : '1px solid transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = COLORS.surface2
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'transparent'
                      }
                    }}
                  >
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: isSelected ? COLORS.ember : COLORS.surface3,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      color: isSelected ? '#fff' : COLORS.text3,
                      fontSize: '12px',
                      fontWeight: 700,
                    }}>
                      {coach.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: isSelected ? 700 : 600,
                        color: isSelected ? COLORS.ember : COLORS.text,
                      }}>
                        {coach.user.name}
                      </div>
                      {coach.specialty && (
                        <div style={{
                          fontSize: '11px',
                          color: COLORS.text3,
                          marginTop: '1px',
                        }}>
                          {coach.specialty}
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <Check size={16} color={COLORS.ember} style={{ flexShrink: 0 }} />
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '8px 12px',
            borderTop: `1px solid ${COLORS.line}`,
            background: COLORS.surface2,
            fontSize: '11px',
            color: COLORS.text3,
            textAlign: 'center',
          }}>
            {filteredCoaches.length} coach{filteredCoaches.length !== 1 ? 'es' : ''} available
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

// ─── Mobile Class Card Component (matches the design) ───
function ClassCard({ cls, onEdit, onDelete, onToggleActive, getTypeColor }) {
  const booked = cls.max_capacity - (cls.spots_left ?? cls.max_capacity)
  const percentage = cls.max_capacity > 0 ? Math.round((booked / cls.max_capacity) * 100) : 0

  return (
    <div className="card" style={{
      padding: '16px',
      borderRadius: '12px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      background: COLORS.surface,
      border: `1px solid ${COLORS.line}`,
    }}>
      {/* Header: Title + Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '16px', fontWeight: 700, color: COLORS.text }}>{cls.name}</span>
          </div>
          <span 
            className="type-badge"
            style={{
              background: `${getTypeColor(cls.type)}1A`,
              color: getTypeColor(cls.type),
              marginTop: '4px',
              display: 'inline-block',
            }}
          >
            {cls.type}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => onToggleActive(cls)}
            className={`status-pill ${cls.is_active ? 'active' : 'inactive'}`}
            style={{
              cursor: 'pointer',
              border: 'none',
              padding: '3px 10px',
              fontSize: '10px',
            }}
          >
            <span style={{ 
              width: '6px', 
              height: '6px', 
              borderRadius: '50%', 
              background: cls.is_active ? COLORS.mint : COLORS.text3,
              display: 'inline-block',
              marginRight: '4px'
            }} />
            {cls.is_active ? 'Active' : 'Inactive'}
          </button>
          <button style={{
            background: 'none',
            border: 'none',
            color: COLORS.text3,
            cursor: 'pointer',
            padding: '2px',
          }}>
            <MoreVertical size={18} />
          </button>
        </div>
      </div>

      {/* Details Grid: Day/Time | Coach/Location */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '6px 12px',
        marginTop: '2px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: COLORS.text2 }}>
          <Calendar size={14} color={COLORS.text3} />
          <span>{cls.day_of_week}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: COLORS.text2 }}>
          <Award size={14} color={COLORS.text3} />
          <span>{cls.coach}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: COLORS.text2 }}>
          <Clock size={14} color={COLORS.text3} />
          <span>{cls.time} – {cls.end_time}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: COLORS.text2 }}>
          <MapPin size={14} color={COLORS.text3} />
          <span>{cls.location || '—'}</span>
        </div>
      </div>

      {/* Capacity Progress Bar */}
      <div style={{ 
        marginTop: '2px', 
        padding: '8px 0', 
        borderTop: `1px solid ${COLORS.line}33`,
        borderBottom: `1px solid ${COLORS.line}33`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Users size={14} color={COLORS.text3} />
          <span style={{ fontSize: '13px', fontWeight: 600, color: COLORS.text }}>
            {booked} / {cls.max_capacity}
          </span>
          <span style={{ fontSize: '11px', color: COLORS.text3, marginLeft: 'auto' }}>
            {percentage}% booked
          </span>
        </div>
        <div style={{
          width: '100%',
          height: '6px',
          borderRadius: '99px',
          background: COLORS.surface3,
          overflow: 'hidden',
          position: 'relative',
        }}>
          <div style={{
            width: `${percentage}%`,
            height: '100%',
            borderRadius: '99px',
            background: percentage >= 80 ? COLORS.red : percentage >= 50 ? COLORS.amber : COLORS.mint,
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>

      {/* Actions: Edit + Delete */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '2px' }}>
        <button 
          onClick={() => onEdit(cls)} 
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: `1px solid ${COLORS.line}`,
            background: COLORS.surface2,
            color: COLORS.text2,
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = COLORS.ember + '44'
            e.currentTarget.style.color = COLORS.ember
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = COLORS.line
            e.currentTarget.style.color = COLORS.text2
          }}
        >
          <Edit size={14} /> Edit
        </button>
        <button 
          onClick={() => onDelete(cls.id, cls.name)} 
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: `1px solid ${COLORS.line}`,
            background: COLORS.surface2,
            color: COLORS.text2,
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = COLORS.red + '44'
            e.currentTarget.style.color = COLORS.red
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = COLORS.line
            e.currentTarget.style.color = COLORS.text2
          }}
        >
          <Trash2 size={14} color={COLORS.red} /> Delete
        </button>
      </div>
    </div>
  )
}

export default function Classes() {
  const [classes, setClasses] = useState([])
  const [coaches, setCoaches] = useState([])
  const [loading, setLoading] = useState(true)
  const [coachesLoading, setCoachesLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClass, setEditingClass] = useState(null)
  const [formData, setFormData] = useState(emptyForm)
  const [dayFilter, setDayFilter] = useState('all')
  const [page, setPage] = useState(1)
  const PER_PAGE = 10
  const [submitting, setSubmitting] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    fetchData()
    fetchCoaches()
    
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const fetchData = async () => {
    try {
      const res = await api.get('/schedule/classes/admin')
      setClasses(res.data)
    } catch (error) {
      toast.error('Failed to fetch classes')
    } finally {
      setLoading(false)
    }
  }

  const fetchCoaches = async () => {
    setCoachesLoading(true)
    try {
      const res = await api.get('/staff/coaches')
      setCoaches(res.data)
      console.log('Coaches fetched:', res.data)
    } catch (error) {
      console.error('Failed to fetch coaches:', error)
      try {
        const staffRes = await api.get('/staff')
        const coachStaff = staffRes.data.filter(s => s.role === 'coach')
        setCoaches(coachStaff)
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError)
        setCoaches([])
      }
    } finally {
      setCoachesLoading(false)
    }
  }

  const handleOpenModal = (cls = null) => {
    if (cls) {
      setEditingClass(cls)
      setFormData({
        name: cls.name,
        coach: cls.coach,
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
      setFormData(emptyForm)
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
      }
      
      if (editingClass) {
        await api.put(`/schedule/classes/${editingClass.id}`, payload)
        toast.success('Class updated successfully!')
      } else {
        await api.post('/schedule/classes', payload)
        toast.success('Class created successfully!')
      }
      handleCloseModal()
      fetchData()
    } catch (error) {
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
        fetchData()
      } catch (error) {
        toast.error('Failed to delete class')
      }
    }
  }

  const handleToggleActive = async (cls) => {
    try {
      await api.put(`/schedule/classes/${cls.id}`, { is_active: !cls.is_active })
      toast.success(cls.is_active ? 'Class deactivated' : 'Class activated')
      fetchData()
    } catch (error) {
      toast.error('Failed to update class')
    }
  }

  const filteredClasses = dayFilter === 'all'
    ? classes
    : classes.filter(c => c.day_of_week === dayFilter)

  const sortedClasses = [...filteredClasses].sort((a, b) => {
    const dayDiff = DAYS.indexOf(a.day_of_week) - DAYS.indexOf(b.day_of_week)
    if (dayDiff !== 0) return dayDiff
    return (a.time || '').localeCompare(b.time || '')
  })

  const totalPages = Math.ceil(sortedClasses.length / PER_PAGE)
  const paginatedClasses = sortedClasses.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const activeCount = classes.filter(c => c.is_active).length
  const totalCapacity = classes.reduce((sum, c) => sum + (c.max_capacity || 0), 0)
  const totalBooked = classes.reduce((sum, c) => sum + ((c.max_capacity || 0) - (c.spots_left ?? c.max_capacity)), 0)

  const getTypeColor = (type) => {
    const colors = {
      cardio: COLORS.ember,
      yoga: '#A78BFA',
      strength: COLORS.mint,
      boxing: COLORS.red,
      pilates: '#60A5FA',
      spin: '#F59E0B',
      hiit: '#EC4899',
    }
    return colors[type] || COLORS.ember
  }

  if (loading) {
    return (
      <div className="gf-theme">
        <ThemeStyles />
        <div className="loading">
          <div className="spinner"></div>
          <span>Loading classes...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="gf-theme">
      <ThemeStyles />
      
      <style>{`
        .modal-form .form-group {
          margin-bottom: 18px;
        }
        .modal-form label {
          font-size: 11px;
          font-weight: 700;
          color: ${COLORS.text3};
          text-transform: uppercase;
          letter-spacing: 0.06em;
          display: block;
          margin-bottom: 5px;
        }
        .modal-form .form-input {
          width: 100%;
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px solid ${COLORS.line};
          background: ${COLORS.surface2};
          color: ${COLORS.text};
          font-size: 13px;
          outline: none;
          transition: all 0.2s ease;
          box-sizing: border-box;
          font-family: inherit;
        }
        .modal-form .form-input:focus {
          border-color: ${COLORS.ember};
          box-shadow: 0 0 0 3px ${COLORS.ember}22;
          background: ${COLORS.surface};
        }
        .modal-form .form-input::placeholder {
          color: ${COLORS.text3};
        }
        .modal-form .form-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .modal-form select.form-input {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2355556a' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 36px;
          cursor: pointer;
        }
        .modal-form textarea.form-input {
          resize: vertical;
          min-height: 80px;
          font-family: inherit;
        }
        .modal-form .grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        .modal-form .form-hint {
          font-size: 11px;
          color: ${COLORS.text3};
          margin-top: 4px;
        }
        .modal-form .form-hint svg {
          display: inline;
          vertical-align: middle;
          margin-right: 4px;
        }
        .btn-primary {
          padding: 10px 22px;
          border-radius: 10px;
          border: none !important;
          background: ${COLORS.ember} !important;
          color: #FFFFFF !important;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .btn-primary:hover:not(:disabled) {
          opacity: 0.85 !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px ${COLORS.ember}33;
        }
        .btn-primary:disabled {
          opacity: 0.5 !important;
          cursor: not-allowed;
        }
        .btn-secondary {
          padding: 10px 22px;
          border-radius: 10px;
          border: 1px solid ${COLORS.line} !important;
          background: transparent !important;
          color: ${COLORS.text2} !important;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .btn-secondary:hover {
          border-color: ${COLORS.text} !important;
          color: ${COLORS.text} !important;
        }
        .modal-header-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 10px;
          border-radius: 99px;
          font-size: 10px;
          font-weight: 700;
          border: 1px solid transparent;
        }
        .status-pill.active {
          background: ${COLORS.mint}1A;
          color: ${COLORS.mint};
          border-color: ${COLORS.mint}33;
        }
        .status-pill.inactive {
          background: ${COLORS.text3}1A;
          color: ${COLORS.text3};
          border-color: ${COLORS.text3}33;
        }
        .type-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 10px;
          border-radius: 99px;
          text-transform: capitalize;
        }
        .day-filter-mobile {
          display: flex;
          flex-wrap: nowrap;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          gap: 6px;
          padding-bottom: 4px;
        }
        .day-filter-mobile::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      <div className="page-header">
        <div>
          <p style={{ 
            fontSize: '11px', 
            color: COLORS.ember, 
            textTransform: 'uppercase', 
            letterSpacing: '0.12em', 
            fontWeight: 700, 
            marginBottom: '6px' 
          }}>
            Management
          </p>
          <h1 className="page-title">Classes</h1>
          <p className="page-subtitle">Create and manage the gym's class schedule</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn btn-primary">
          <Plus size={18} />
          Add Class
        </button>
      </div>

      {/* Stats - 2 columns on mobile, 4 on desktop */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? '10px' : '14px', marginBottom: '20px' }}>
        <div className="card" style={{ padding: '18px' }}>
          <div className="flex items-center justify-between mb-2">
            <Dumbbell size={20} color={COLORS.ember} />
          </div>
          <div className="stat-value">{classes.length}</div>
          <div className="stat-label">Total Classes</div>
        </div>
        <div className="card" style={{ padding: '18px' }}>
          <div className="flex items-center justify-between mb-2">
            <CheckCircle2 size={20} color={COLORS.mint} />
          </div>
          <div className="stat-value">{activeCount}</div>
          <div className="stat-label">Active</div>
        </div>
        <div className="card" style={{ padding: '18px' }}>
          <div className="flex items-center justify-between mb-2">
            <Users size={20} color={COLORS.blue} />
          </div>
          <div className="stat-value">{totalBooked}/{totalCapacity}</div>
          <div className="stat-label">Spots Booked</div>
        </div>
        <div className="card" style={{ padding: '18px' }}>
          <div className="flex items-center justify-between mb-2">
            <CalendarDays size={20} color={COLORS.amber} />
          </div>
          <div className="stat-value">{new Set(classes.map(c => c.day_of_week)).size}</div>
          <div className="stat-label">Days Covered</div>
        </div>
      </div>

      {/* Day filter - horizontal scroll on mobile */}
      <div className={isMobile ? "day-filter-mobile" : ""} style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: isMobile ? 'nowrap' : 'wrap' }}>
        <button
          onClick={() => { setDayFilter('all'); setPage(1) }}
          className={dayFilter === 'all' ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
          style={{ flexShrink: 0 }}
        >
          All days
        </button>
        {DAYS.map(day => (
          <button
            key={day}
            onClick={() => { setDayFilter(day); setPage(1) }}
            className={dayFilter === day ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
            style={{ flexShrink: 0 }}
          >
            {day.slice(0, 3)}
          </button>
        ))}
      </div>

      {/* Desktop: Table, Mobile: Full-width Cards */}
      {isMobile ? (
        // Mobile: Cards in full-width (1 column like the design)
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          {paginatedClasses.map(cls => (
            <ClassCard 
              key={cls.id} 
              cls={cls} 
              onEdit={handleOpenModal} 
              onDelete={handleDelete} 
              onToggleActive={handleToggleActive}
              getTypeColor={getTypeColor}
            />
          ))}
          {sortedClasses.length === 0 && (
            <div className="empty-state" style={{ padding: '40px 0', textAlign: 'center' }}>
              <Ban size={26} color={COLORS.text3} style={{ marginBottom: '10px', opacity: 0.5 }} />
              <p>No classes {dayFilter !== 'all' ? `on ${dayFilter}` : 'yet'}</p>
            </div>
          )}
        </div>
      ) : (
        // Desktop: Table
        <div className="card" style={{ padding: '20px' }}>
          <div className="table-wrap">
            <table style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Day</th>
                  <th>Time</th>
                  <th>Coach</th>
                  <th>Location</th>
                  <th>Capacity</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedClasses.map(cls => (
                  <tr key={cls.id}>
                    <td className="font-medium">
                      <div className="flex items-center gap-2">
                        <span>{cls.name}</span>
                        <span 
                          className="type-badge"
                          style={{
                            background: `${getTypeColor(cls.type)}1A`,
                            color: getTypeColor(cls.type),
                          }}
                        >
                          {cls.type}
                        </span>
                      </div>
                    </td>
                    <td>{cls.day_of_week}</td>
                    <td>{cls.time} – {cls.end_time}</td>
                    <td>
                      <span className="flex items-center gap-1">
                        <Award size={12} color={COLORS.text3} /> {cls.coach}
                      </span>
                    </td>
                    <td>
                      <span className="flex items-center gap-1">
                        <MapPin size={12} color={COLORS.text3} /> {cls.location || '—'}
                      </span>
                    </td>
                    <td>{(cls.max_capacity - (cls.spots_left ?? cls.max_capacity))}/{cls.max_capacity}</td>
                    <td>
                      <button
                        onClick={() => handleToggleActive(cls)}
                        className={`status-pill ${cls.is_active ? 'active' : 'inactive'}`}
                        style={{
                          cursor: 'pointer',
                          border: 'none',
                        }}
                      >
                        {cls.is_active ? <CheckCircle2 size={10} /> : <Ban size={10} />}
                        {cls.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td>
                      <div className="flex gap-2 justify-end">
                        <button 
                          onClick={() => handleOpenModal(cls)} 
                          className="btn btn-ghost btn-sm" 
                          title="Edit"
                          style={{
                            padding: '6px 10px',
                            borderRadius: '8px',
                            border: '1px solid transparent',
                            background: 'transparent',
                            color: COLORS.text2,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.borderColor = COLORS.ember + '44'
                            e.currentTarget.style.color = COLORS.ember
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.borderColor = 'transparent'
                            e.currentTarget.style.color = COLORS.text2
                          }}
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          onClick={() => handleDelete(cls.id, cls.name)} 
                          className="btn btn-ghost btn-sm" 
                          title="Delete"
                          style={{
                            padding: '6px 10px',
                            borderRadius: '8px',
                            border: '1px solid transparent',
                            background: 'transparent',
                            color: COLORS.text2,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.borderColor = COLORS.red + '44'
                            e.currentTarget.style.color = COLORS.red
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.borderColor = 'transparent'
                            e.currentTarget.style.color = COLORS.text2
                          }}
                        >
                          <Trash2 size={14} color={COLORS.red} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {sortedClasses.length === 0 && (
              <div className="empty-state" style={{ padding: '40px 0', textAlign: 'center' }}>
                <Ban size={26} color={COLORS.text3} style={{ marginBottom: '10px', opacity: 0.5 }} />
                <p>No classes {dayFilter !== 'all' ? `on ${dayFilter}` : 'yet'}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', marginTop: '20px', flexWrap: 'wrap' }}>

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
            onMouseEnter={e => { if (page !== 1) e.currentTarget.style.borderColor = COLORS.ember }}
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
                    background: page === item ? COLORS.ember : 'var(--surface)',
                    color: page === item ? '#fff' : 'var(--text)',
                    fontSize: '13px', fontWeight: page === item ? 700 : 500,
                    cursor: 'pointer', transition: 'all 0.15s',
                    boxShadow: page === item ? `0 2px 8px ${COLORS.ember}55` : 'none',
                  }}
                  onMouseEnter={e => { if (page !== item) e.currentTarget.style.borderColor = COLORS.ember }}
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
            onMouseEnter={e => { if (page !== totalPages) e.currentTarget.style.borderColor = COLORS.ember }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
          >›</button>

        </div>
      )}

      {/* ── Enhanced Add/Edit Class Modal ── */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title=""
        size="lg"
        customHeader={
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '20px 24px',
            borderBottom: `1px solid ${COLORS.line}`,
            background: COLORS.surface2,
            borderRadius: '18px 18px 0 0',
          }}>
            <div 
              className="modal-header-icon"
              style={{
                background: `${COLORS.ember}1A`,
                color: COLORS.ember,
              }}
            >
              {editingClass ? <Edit size={20} /> : <Sparkles size={20} />}
            </div>
            <div>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: 800, 
                color: COLORS.text, 
                margin: 0,
                letterSpacing: '-0.02em',
              }}>
                {editingClass ? 'Edit Class' : 'Create New Class'}
              </h3>
              <p style={{ 
                fontSize: '12px', 
                color: COLORS.text3, 
                margin: '2px 0 0',
              }}>
                {editingClass 
                  ? `Update "${editingClass.name}" details` 
                  : 'Add a new class to the schedule'}
              </p>
            </div>
            <button
              onClick={handleCloseModal}
              style={{
                marginLeft: 'auto',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: 'none',
                background: 'transparent',
                color: COLORS.text3,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = COLORS.surface3
                e.currentTarget.style.color = COLORS.text
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = COLORS.text3
              }}
            >
              <X size={18} />
            </button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="modal-form" style={{ padding: '24px' }}>
          {/* Class Name */}
          <div className="form-group">
            <label>
              <Target size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
              Class Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="form-input"
              required
              placeholder="e.g., Morning HIIT, Yoga Flow, Strength Training"
            />
          </div>

          {/* Coach + Type */}
          <div className="grid-2">
            <div className="form-group">
              <label>
                <UserCircle size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                Coach *
              </label>
              {/* ✅ Modern Custom Coach Select */}
              <CoachSelect
                value={formData.coach}
                onChange={handleChange}
                coaches={coaches}
                loading={coachesLoading}
                error={coaches.length === 0 && !coachesLoading ? 'No coaches available' : null}
              />
              {coaches.length === 0 && !coachesLoading && (
                <p className="form-hint" style={{ color: COLORS.amber }}>
                  <AlertCircle size={12} />
                  No coaches found. Please add staff with role 'coach' first.
                </p>
              )}
            </div>

            <div className="form-group">
              <label>
                <Zap size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                Class Type *
              </label>
              <select name="type" value={formData.type} onChange={handleChange} className="form-input" required>
                {TYPE_OPTIONS.map(t => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Day + Capacity */}
          <div className="grid-2">
            <div className="form-group">
              <label>
                <Calendar size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                Day of Week *
              </label>
              <select name="day_of_week" value={formData.day_of_week} onChange={handleChange} className="form-input" required>
                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>
                <Users size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                Max Capacity *
              </label>
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
          </div>

          {/* Start + End Time */}
          <div className="grid-2">
            <div className="form-group">
              <label>
                <Clock size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                Start Time *
              </label>
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
              <label>
                <Clock size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                End Time *
              </label>
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

          {/* Location */}
          <div className="form-group">
            <label>
              <MapPin size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g., Studio 2, Main Floor, Outdoor Area"
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label>
              <Info size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="form-input"
              rows="3"
              placeholder="What should members expect from this class? Equipment needed? Intensity level?"
            />
          </div>

          {/* Active toggle (edit only) */}
          {editingClass && (
            <div className="form-group" style={{ 
              padding: '14px 16px',
              borderRadius: '10px',
              background: formData.is_active ? `${COLORS.mint}0D` : `${COLORS.text3}0D`,
              border: `1px solid ${formData.is_active ? COLORS.mint + '33' : COLORS.text3 + '33'}`,
            }}>
              <label className="flex items-center gap-2" style={{ cursor: 'pointer', margin: 0 }}>
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  style={{
                    width: '18px',
                    height: '18px',
                    accentColor: COLORS.mint,
                    cursor: 'pointer',
                  }}
                />
                <span className="form-label" style={{ margin: 0, fontWeight: 600 }}>
                  {formData.is_active ? 'Active' : 'Inactive'}
                </span>
                <span style={{ fontSize: '11px', color: COLORS.text3, marginLeft: 'auto' }}>
                  {formData.is_active ? 'Visible to members' : 'Hidden from members'}
                </span>
              </label>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3" style={{ marginTop: '24px', paddingTop: '20px', borderTop: `1px solid ${COLORS.line}` }}>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={submitting}
              style={{ flex: 1 }}
            >
              {submitting ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    border: `2px solid #fff`,
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

          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </form>
      </Modal>
    </div>
  )
}