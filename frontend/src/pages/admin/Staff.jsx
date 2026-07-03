import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  UserPlus, Edit, Trash2, Shield, Users, Calendar,
  Award, Search, MapPin, Star, Upload, X,
  Instagram, Twitter, Linkedin, Globe, Mail, Phone,
  TrendingUp, CheckCircle, Briefcase, Heart, AlertCircle
} from 'lucide-react'
import Modal from "../../components/Modal"
import api from "../../api/client"
import { COLORS, ThemeStyles } from '../../theme/GymTheme'

export default function Staff() {
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState(null)
  const [editingStaff, setEditingStaff] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [formErrors, setFormErrors] = useState({})
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'coach', phone: '', salary: '',
    hire_date: new Date().toISOString().split('T')[0],
    specialty: '', bio: '', experience: '', certifications: '', location: '',
    interests: '', avatar: '', instagram: '', twitter: '', linkedin: '',
    website: '', achievements: '', rating: ''
  })

  useEffect(() => { loadStaff() }, [])

  const loadStaff = async () => {
    setLoading(true)
    try {
      const res = await api.get('/staff')
      setStaff(res.data || [])
    } catch (error) {
      console.error('Failed to fetch staff from API', error)
      setStaff([])
      toast.error('Could not load staff data')
    } finally {
      setLoading(false)
    }
  }

  const saveStaff = async (data) => {
    try {
      if (editingStaff) {
        await api.put(`/staff/${editingStaff.id}`, data)
        toast.success('Staff updated successfully')
      } else {
        await api.post('/staff', data)
        toast.success('Staff added successfully')
      }
      await loadStaff()
      return true
    } catch (error) {
      console.error('Failed to save staff', error)
      const errorMsg = error.response?.data?.detail || 'Failed to save staff member'
      if (errorMsg.toLowerCase().includes('email')) {
        setFormErrors({ email: 'This email is already registered. Please use a different email.' })
      } else {
        toast.error(errorMsg)
      }
      return false
    }
  }

  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let { width, height } = img
          const MAX = 800
          if (width > height && width > MAX) { height = Math.round((height * MAX) / width); width = MAX }
          else if (height > MAX) { width = Math.round((width * MAX) / height); height = MAX }
          canvas.width = width; canvas.height = height
          canvas.getContext('2d').drawImage(img, 0, 0, width, height)
          resolve(canvas.toDataURL('image/jpeg', 0.8))
        }
        img.onerror = () => reject(new Error('Failed to load image'))
        img.src = e.target.result
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      toast.loading('Processing image...', { id: 'img' })
      const compressed = await compressImage(file)
      setImagePreview(compressed)
      setFormData(prev => ({ ...prev, avatar: compressed }))
      toast.success('Image ready', { id: 'img' })
    } catch {
      toast.error('Failed to process image', { id: 'img' })
    }
    e.target.value = ''
  }

  const resetForm = () => {
    setFormData({
      name: '', email: '', password: '', role: 'coach', phone: '', salary: '',
      hire_date: new Date().toISOString().split('T')[0],
      specialty: '', bio: '', experience: '', certifications: '', location: '',
      interests: '', avatar: '', instagram: '', twitter: '', linkedin: '',
      website: '', achievements: '', rating: ''
    })
    setImagePreview(null)
    setEditingStaff(null)
    setFormErrors({})
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormErrors({})

    if (!formData.name.trim()) {
      setFormErrors(prev => ({ ...prev, name: 'Name is required' }))
      toast.error('Name is required')
      return
    }
    if (!formData.email.trim()) {
      setFormErrors(prev => ({ ...prev, email: 'Email is required' }))
      toast.error('Email is required')
      return
    }
    if (!editingStaff && !formData.password) {
      setFormErrors(prev => ({ ...prev, password: 'Password is required for new staff' }))
      toast.error('Password is required')
      return
    }

    const submitData = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: formData.role,
      phone: formData.phone,
      salary: parseFloat(formData.salary) || 0,
      hire_date: formData.hire_date,
      specialty: formData.specialty,
      bio: formData.bio,
      experience: formData.experience,
      certifications: formData.certifications,
      location: formData.location,
      interests: formData.interests,
      avatar: formData.avatar || null,
      instagram: formData.instagram,
      twitter: formData.twitter,
      linkedin: formData.linkedin,
      website: formData.website,
      achievements: formData.achievements,
      rating: parseFloat(formData.rating) || 0
    }

    const success = await saveStaff(submitData)
    if (success) {
      setIsModalOpen(false)
      resetForm()
    }
  }

  const handleDelete = async (id) => {
    if (confirm('Delete this staff member?')) {
      try {
        await api.delete(`/staff/${id}`)
        toast.success('Staff deleted')
        await loadStaff()
      } catch (error) {
        console.error('Failed to delete staff', error)
        toast.error('Failed to delete staff member')
      }
    }
  }

  const openEdit = (member) => {
    setEditingStaff(member)
    setFormData({
      name: member.user?.name || member.name || '',
      email: member.user?.email || member.email || '',
      password: '',
      role: member.role || 'coach',
      phone: member.phone || '',
      salary: member.salary || '',
      hire_date: member.hire_date || new Date().toISOString().split('T')[0],
      specialty: member.specialty || '',
      bio: member.bio || '',
      experience: member.experience || '',
      certifications: member.certifications || '',
      location: member.location || '',
      interests: member.interests || '',
      avatar: member.avatar || '',
      instagram: member.social_links?.instagram || '',
      twitter: member.social_links?.twitter || '',
      linkedin: member.social_links?.linkedin || '',
      website: member.social_links?.website || '',
      achievements: member.achievements || '',
      rating: member.rating || ''
    })
    setImagePreview(member.avatar || null)
    setFormErrors({})
    setIsModalOpen(true)
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'coach':        return { bg: COLORS.ember, light: `${COLORS.ember}1A`, text: COLORS.ember }
      case 'receptionist': return { bg: COLORS.blue,  light: `${COLORS.blue}1A`,  text: COLORS.blue }
      case 'manager':      return { bg: '#a78bfa',    light: '#a78bfa1A',         text: '#a78bfa' }
      case 'admin':        return { bg: COLORS.amber, light: `${COLORS.amber}1A`, text: COLORS.amber }
      default:             return { bg: COLORS.text3, light: `${COLORS.text3}1A`, text: COLORS.text2 }
    }
  }

  const getRoleLabel = (role) => {
    switch (role) {
      case 'coach':        return 'Coach / Trainer'
      case 'receptionist': return 'Receptionist'
      case 'manager':      return 'Manager'
      case 'admin':        return 'Admin'
      default:             return role || 'Staff'
    }
  }

  const coaches   = staff.filter(s => s?.role === 'coach').length
  const managers  = staff.filter(s => s?.role === 'manager').length
  const avgRating = staff.length > 0
    ? (staff.reduce((sum, s) => sum + (parseFloat(s?.rating) || 0), 0) / staff.length).toFixed(1)
    : '0.0'

  const filteredStaff = staff.filter(member => {
    if (!member) return false
    const name = member.user?.name || member.name || ''
    const email = member.user?.email || member.email || ''
    const specialty = member.specialty || ''
    const matchesSearch =
      name.toLowerCase().includes(search.toLowerCase()) ||
      email.toLowerCase().includes(search.toLowerCase()) ||
      specialty.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === 'all' || member.role === roleFilter
    return matchesSearch && matchesRole
  })

  // Mobile responsive styles
  const responsiveStyles = {
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '14px',
      marginBottom: '20px',
    },
    searchContainer: {
      display: 'flex',
      gap: '12px',
      flexWrap: 'wrap',
      alignItems: 'center',
    },
    staffGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(500px, 1fr))',
      gap: '16px',
    },
    profileModal: {
      width: '720px',
      maxWidth: 'calc(100vw - 32px)',
      maxHeight: '90vh',
    },
    modalContent: {
      padding: '16px 24px 20px 24px',
      overflowY: 'auto',
      flex: 1,
      background: COLORS.surface,
    },
  }

  // Apply mobile styles using a style tag
  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.textContent = `
      @media (max-width: 768px) {
        .stats-grid-mobile { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
        .staff-grid-mobile { grid-template-columns: 1fr !important; gap: 12px !important; }
        .search-container-mobile { flex-direction: row !important; gap: 10px !important; align-items: center !important; }
        .profile-modal-mobile { width: calc(100vw - 16px) !important; max-height: 95vh !important; }
        .modal-content-mobile { padding: 12px 16px 16px 16px !important; }
        .staff-card-mobile { flex-direction: row !important; height: auto !important; min-height: 200px !important; }
        .avatar-column-mobile { width: 120px !important; min-width: 120px !important; height: auto !important; border-radius: 14px 0 0 14px !important; }
        .avatar-image-mobile { height: 100% !important; min-height: 200px !important; }
        .info-column-mobile { padding: 12px !important; }
        .profile-hero-mobile { height: 120px !important; }
        .profile-avatar-mobile { width: 60px !important; height: 60px !important; }
        .profile-name-mobile { font-size: 16px !important; }
        .kpi-grid-mobile { grid-template-columns: 1fr 1fr 1fr !important; gap: 8px !important; }
        .two-column-mobile { grid-template-columns: 1fr !important; gap: 12px !important; }
        .modal-grid-mobile { grid-template-columns: 1fr !important; gap: 12px !important; }
        .filter-select-mobile { width: auto !important; }
        .search-input-mobile { flex: 1 !important; min-width: 150px !important; }
      }
      @media (max-width: 480px) {
        .stats-grid-mobile { grid-template-columns: 1fr 1fr !important; gap: 8px !important; }
        .stat-value-mobile { font-size: 18px !important; }
        .stat-label-mobile { font-size: 10px !important; }
        .profile-modal-mobile { width: calc(100vw - 8px) !important; max-height: 98vh !important; }
        .profile-hero-mobile { height: 100px !important; }
        .profile-avatar-mobile { width: 50px !important; height: 50px !important; bottom: 8px !important; left: 16px !important; }
        .profile-name-mobile { font-size: 14px !important; }
        .profile-specialty-mobile { font-size: 10px !important; }
        .kpi-grid-mobile { grid-template-columns: 1fr !important; gap: 6px !important; }
        .modal-content-mobile { padding: 8px 12px 12px 12px !important; }
        .social-links-mobile { flex-wrap: wrap !important; gap: 6px !important; }
        .social-link-mobile { font-size: 10px !important; padding: 3px 10px !important; }
        .search-container-mobile { flex-direction: row !important; gap: 8px !important; }
        .search-input-mobile { min-width: 120px !important; }
        .filter-select-mobile { width: 100px !important; }
        .avatar-column-mobile { width: 100px !important; min-width: 100px !important; }
        .avatar-image-mobile { height: 100% !important; min-height: 180px !important; }
      }
    `;
    document.head.appendChild(styleSheet);
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  if (loading) {
    return (
      <div className="gf-theme">
        <ThemeStyles />
        <div className="loading"><div className="spinner" /></div>
      </div>
    )
  }

  return (
    <div className="gf-theme">
      <ThemeStyles />

      {/* Page Header */}
      <div className="page-header" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <p style={{ fontSize: '11px', color: COLORS.ember, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, marginBottom: '6px' }}>
            Management
          </p>
          <h1 className="page-title" style={{ fontSize: 'clamp(24px, 3vw, 32px)' }}>Staff Management</h1>
          <p className="page-subtitle" style={{ fontSize: 'clamp(13px, 1.5vw, 15px)' }}>Manage coaches, trainers, and administrators</p>
        </div>
        <button onClick={() => { resetForm(); setIsModalOpen(true) }} className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
          <UserPlus size={18} /> Add Staff
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid-mobile" style={responsiveStyles.statsGrid}>
        {[
          { icon: <Users size={20} color={COLORS.ember} />, value: staff.length,    label: 'Total Staff' },
          { icon: <Award size={20} color={COLORS.mint} />,  value: coaches,          label: 'Coaches' },
          { icon: <Shield size={20} color="#a78bfa" />,      value: managers,        label: 'Managers' },
          { icon: <Star size={20} color={COLORS.amber} />,  value: `${avgRating} ★`, label: 'Avg Rating' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: '18px' }}>
            <div style={{ marginBottom: '8px' }}>{s.icon}</div>
            <div className="stat-value-mobile" style={{ fontSize: 'clamp(20px, 2.5vw, 28px)', fontWeight: '700', color: COLORS.text }}>{s.value}</div>
            <div className="stat-label-mobile" style={{ fontSize: 'clamp(11px, 1.2vw, 13px)', color: COLORS.text3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search & Filter - Now in one line */}
      <div className="card" style={{ marginBottom: '16px', padding: '16px' }}>
        <div className="search-container-mobile" style={responsiveStyles.searchContainer}>
          <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: COLORS.text3, pointerEvents: 'none', zIndex: 2 }} />
            <input
              type="text"
              placeholder="Search by name, role, or specialty..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input search-input-mobile"
              style={{ paddingLeft: '38px' }}
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="form-input filter-select-mobile"
            style={{ width: '140px' }}
          >
            <option value="all">All Roles</option>
            <option value="coach">Coaches</option>
            <option value="receptionist">Receptionists</option>
            <option value="manager">Managers</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </div>

      {/* Staff Cards Grid - Portrait images with proper sizing */}
      <div className="staff-grid-mobile" style={responsiveStyles.staffGrid}>
        {filteredStaff.map(member => {
          if (!member) return null
          const name = member.user?.name || member.name || 'Unknown'
          const email = member.user?.email || member.email || ''
          const role = getRoleColor(member.role)
          const avatarSrc = member.avatar ||
            `https://ui-avatars.com/api/?background=FF5A1F&color=14110F&name=${(name).replace(/ /g, '+')}&size=400&bold=true`
          const certs = member.certifications ? member.certifications.split(',') : []
          const socialLinks = member.social_links || {}
          const clientsCount = member.clients_count || 0

          return (
            <div
              key={member.id}
              onClick={() => { setSelectedStaff(member); setIsProfileOpen(true) }}
              className="card staff-card-mobile"
              style={{
                padding: '0',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'transform 0.25s, box-shadow 0.25s',
                display: 'flex',
                flexDirection: 'row',
                borderRadius: '14px',
                height: 'auto', // Allow card to grow with content
                minHeight: '220px' // Minimum height for consistency
              }}
              onMouseEnter={e => { 
                e.currentTarget.style.transform = 'translateY(-4px)'; 
                e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.45)' 
              }}
              onMouseLeave={e => { 
                e.currentTarget.style.transform = 'translateY(0)'; 
                e.currentTarget.style.boxShadow = 'none' 
              }}
            >
              {/* Avatar column - Portrait style */}
              <div className="avatar-column-mobile" style={{
                width: '160px',
                minWidth: '160px',
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '14px 0 0 14px',
                flexShrink: 0,
                height: 'auto',
                alignSelf: 'stretch'
              }}>
                <img
                  src={avatarSrc}
                  alt={name}
                  className="avatar-image-mobile"
                  style={{
                    width: '100%',
                    height: '100%',
                    minHeight: '220px',
                    objectFit: 'cover',
                    objectPosition: 'center top',
                    display: 'block'
                  }}
                />
                <div style={{
                  position: 'absolute',
                  bottom: '10px',
                  left: '10px',
                  right: '10px',
                  background: role.bg,
                  color: COLORS.ink,
                  fontSize: '9px',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  padding: '3px 8px',
                  borderRadius: '12px',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {getRoleLabel(member.role)}
                </div>
              </div>

              {/* Info column */}
              <div className="info-column-mobile" style={{ 
                flex: 1, 
                padding: '14px 16px 16px 16px', 
                display: 'flex', 
                flexDirection: 'column',
                justifyContent: 'flex-start',
                minHeight: '220px'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0, color: COLORS.text, lineHeight: '1.2' }}>{name}</h3>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '4px',
                      background: role.light, padding: '2px 8px', borderRadius: '20px',
                      flexShrink: 0
                    }}>
                      <Star size={11} fill={role.bg} color={role.bg} />
                      <span style={{ fontSize: '11px', fontWeight: 600, color: role.text }}>{member.rating || '5.0'}</span>
                    </div>
                  </div>

                  <p style={{ fontSize: '12px', color: role.bg, fontWeight: 600, marginBottom: '6px' }}>
                    {member.specialty || 'General Staff'}
                  </p>

                  <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    {socialLinks.instagram && (
                      <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: role.light, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Instagram size={11} color={role.bg} />
                      </div>
                    )}
                    {socialLinks.twitter && (
                      <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: role.light, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Twitter size={11} color={role.bg} />
                      </div>
                    )}
                    {socialLinks.linkedin && (
                      <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: role.light, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Linkedin size={11} color={role.bg} />
                      </div>
                    )}
                    {socialLinks.website && (
                      <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: role.light, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Globe size={11} color={role.bg} />
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                    {member.location && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: COLORS.text2 }}>
                        <MapPin size={10} color={role.bg} /> {member.location}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: COLORS.text2 }}>
                      <Calendar size={10} color={role.bg} /> Since {member.hire_date || 'N/A'}
                    </div>
                  </div>

                  <div style={{
                    display: 'flex', gap: '8px',
                    padding: '6px 0',
                    borderTop: `1px solid ${COLORS.line}`,
                    borderBottom: `1px solid ${COLORS.line}`
                  }}>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: role.bg }}>{clientsCount}</div>
                      <div style={{ fontSize: '8px', color: COLORS.text3 }}>Clients</div>
                    </div>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: role.bg }}>{member.experience || '—'}</div>
                      <div style={{ fontSize: '8px', color: COLORS.text3 }}>Experience</div>
                    </div>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: role.bg }}>{certs.length || 0}</div>
                      <div style={{ fontSize: '8px', color: COLORS.text3 }}>Certs</div>
                    </div>
                  </div>
                </div>

                {/* Buttons at the bottom with proper spacing */}
                <div style={{ 
                  display: 'flex', 
                  gap: '8px', 
                  justifyContent: 'flex-end', 
                  marginTop: '12px',
                  paddingTop: '8px',
                  borderTop: `1px solid ${COLORS.line}`
                }}>
                  <button
                    onClick={e => { e.stopPropagation(); openEdit(member) }}
                    className="btn btn-sm btn-secondary"
                    style={{ padding: '6px 14px', fontSize: '12px' }}
                  >
                    <Edit size={12} /> Edit
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(member.id) }}
                    className="btn btn-sm btn-danger"
                    style={{ padding: '6px 14px', fontSize: '12px' }}
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filteredStaff.length === 0 && (
        <div className="empty-state">
          <Users size={48} />
          <p>No staff members found</p>
          <button onClick={() => { resetForm(); setIsModalOpen(true) }} className="btn btn-primary btn-sm mt-3">
            Add your first staff member
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          PROFILE MODAL — FIXED LAYOUT
      ═══════════════════════════════════════════ */}
      {isProfileOpen && selectedStaff && (() => {
        const name = selectedStaff.user?.name || selectedStaff.name || 'Unknown'
        const email = selectedStaff.user?.email || selectedStaff.email || ''
        const role = getRoleColor(selectedStaff.role)
        const avatarSrc = selectedStaff.avatar ||
          `https://ui-avatars.com/api/?background=FF5A1F&color=14110F&name=${(name).replace(/ /g, '+')}&size=400&bold=true`
        const certs = selectedStaff.certifications ? selectedStaff.certifications.split(',') : []
        const socialLinks = selectedStaff.social_links || {}
        const clientsCount = selectedStaff.clients_count || 0

        return (
          <>
            {/* Backdrop */}
            <div
              onClick={() => { setIsProfileOpen(false); setSelectedStaff(null) }}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.7)',
                backdropFilter: 'blur(4px)',
                zIndex: 1000,
              }}
            />

            {/* Dialog */}
            <div className="profile-modal-mobile" style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '720px',
              maxWidth: 'calc(100vw - 32px)',
              maxHeight: '90vh',
              borderRadius: '16px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              background: COLORS.surface,
              zIndex: 1001,
              boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
            }}>

              {/* ── COVER HERO ── */}
              <div className="profile-hero-mobile" style={{
                position: 'relative',
                height: '160px',
                flexShrink: 0,
                overflow: 'hidden',
                background: `linear-gradient(135deg, ${role.bg}DD 0%, ${role.bg}55 100%)`,
              }}>
                {/* Blurred background */}
                <div style={{
                  position: 'absolute',
                  inset: '-20px',
                  backgroundImage: `url(${avatarSrc})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center 20%',
                  filter: 'blur(32px) brightness(0.35)',
                  transform: 'scale(1.1)',
                }} />
                
                {/* Dark overlay */}
                <div style={{ 
                  position: 'absolute', 
                  inset: 0, 
                  background: 'linear-gradient(to bottom, rgba(0,0,0,0.0) 0%, rgba(0,0,0,0.55) 65%, rgba(0,0,0,0.9) 100%)' 
                }} />

                {/* Badges - top left */}
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  left: '16px',
                  display: 'flex',
                  gap: '8px',
                  zIndex: 4
                }}>
                  <span style={{
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(8px)',
                    color: role.bg,
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    padding: '4px 14px',
                    borderRadius: '20px',
                    border: `1px solid ${role.bg}50`,
                  }}>
                    {getRoleLabel(selectedStaff.role)}
                  </span>
                  <span style={{
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(8px)',
                    color: COLORS.amber,
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '4px 12px',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    border: `1px solid ${COLORS.amber}50`,
                  }}>
                    <Star size={11} fill={COLORS.amber} color={COLORS.amber} />
                    {selectedStaff.rating || '5.0'}
                  </span>
                </div>

                {/* Avatar */}
                <div className="profile-avatar-mobile" style={{
                  position: 'absolute',
                  bottom: '12px',
                  left: '24px',
                  zIndex: 5
                }}>
                  <img
                    src={avatarSrc}
                    alt={name}
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '3px solid rgba(255,255,255,0.25)',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.7)',
                      display: 'block',
                    }}
                  />
                </div>

                {/* Name + specialty */}
                <div style={{
                  position: 'absolute',
                  bottom: '16px',
                  left: '120px',
                  right: '20px',
                  zIndex: 4,
                }}>
                  <h2 className="profile-name-mobile" style={{
                    fontSize: '20px',
                    fontWeight: 800,
                    margin: '0 0 3px',
                    color: '#ffffff',
                    letterSpacing: '-0.02em',
                    textShadow: '0 2px 6px rgba(0,0,0,0.6)',
                  }}>
                    {name}
                  </h2>
                  <div className="profile-specialty-mobile" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '7px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: role.bg,
                    textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                  }}>
                    <span style={{
                      width: '5px',
                      height: '5px',
                      borderRadius: '50%',
                      background: role.bg,
                      flexShrink: 0,
                      display: 'inline-block'
                    }} />
                    {selectedStaff.specialty || getRoleLabel(selectedStaff.role)}
                  </div>
                  {selectedStaff.location && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: 'rgba(255,255,255,0.7)',
                      fontSize: '11px',
                      marginTop: '2px',
                      textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                    }}>
                      <MapPin size={12} color="rgba(255,255,255,0.5)" />
                      <span>{selectedStaff.location}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* ── BODY ── */}
              <div className="modal-content-mobile" style={responsiveStyles.modalContent}>

                {/* Social Links */}
                {(socialLinks.instagram || socialLinks.twitter || socialLinks.linkedin || socialLinks.website) && (
                  <div className="social-links-mobile" style={{
                    display: 'flex',
                    gap: '8px',
                    marginBottom: '16px',
                    paddingBottom: '14px',
                    borderBottom: `1px solid ${COLORS.line}`,
                    flexWrap: 'wrap'
                  }}>
                    {[
                      { key: 'instagram', Icon: Instagram, label: socialLinks.instagram, color: '#E4405F' },
                      { key: 'twitter', Icon: Twitter, label: socialLinks.twitter, color: '#1DA1F2' },
                      { key: 'linkedin', Icon: Linkedin, label: socialLinks.linkedin, color: '#0A66C2' },
                      { key: 'website', Icon: Globe, label: socialLinks.website, color: COLORS.text2 },
                    ].filter(s => s.label).map(({ key, Icon, label, color }) => (
                      <a
                        key={key}
                        href={label.startsWith('http') ? label : `https://${label}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="social-link-mobile"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          background: COLORS.surface2,
                          fontSize: '11px',
                          fontWeight: 500,
                          color: COLORS.text2,
                          border: `1px solid ${COLORS.line}`,
                          textDecoration: 'none',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = color + '15'
                          e.currentTarget.style.borderColor = color
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = COLORS.surface2
                          e.currentTarget.style.borderColor = COLORS.line
                        }}
                      >
                        <Icon size={12} color={color} />
                        {label.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]}
                      </a>
                    ))}
                  </div>
                )}

                {/* KPI Cards */}
                <div className="kpi-grid-mobile" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '10px',
                  marginBottom: '16px',
                }}>
                  {[
                    { icon: <Users size={15} color={role.bg} />, value: clientsCount, label: 'Total Clients' },
                    { icon: <Briefcase size={15} color={role.bg} />, value: selectedStaff.experience || '—', label: 'Experience' },
                    { icon: <TrendingUp size={15} color={role.bg} />, value: `$${selectedStaff.salary || '—'}`, label: 'Monthly Salary' },
                  ].map((kpi, i) => (
                    <div key={i} style={{
                      background: COLORS.surface2,
                      borderRadius: '10px',
                      padding: '12px 14px',
                      border: `1px solid ${COLORS.line}`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '3px',
                    }}>
                      {kpi.icon}
                      <div style={{
                        fontSize: '18px',
                        fontWeight: 700,
                        color: COLORS.text
                      }}>
                        {kpi.value}
                      </div>
                      <div style={{
                        fontSize: '9px',
                        color: COLORS.text3,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        {kpi.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Two-column grid */}
                <div className="two-column-mobile" style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px',
                }}>

                  {/* LEFT COLUMN */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                  }}>

                    {/* About */}
                    <div>
                      <div style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        color: role.bg,
                        marginBottom: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}>
                        <UserPlus size={13} /> About
                      </div>
                      <div style={{
                        background: COLORS.surface2,
                        borderRadius: '8px',
                        border: `1px solid ${COLORS.line}`,
                        padding: '10px 14px',
                      }}>
                        <p style={{
                          fontSize: '13px',
                          color: COLORS.text2,
                          margin: 0,
                          lineHeight: 1.5,
                        }}>
                          {selectedStaff.bio || 'No bio provided'}
                        </p>
                      </div>
                    </div>

                    {/* Contact */}
                    <div>
                      <div style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        color: role.bg,
                        marginBottom: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}>
                        <Phone size={13} /> Contact
                      </div>
                      <div style={{
                        background: COLORS.surface2,
                        borderRadius: '8px',
                        border: `1px solid ${COLORS.line}`,
                        padding: '6px 12px',
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          fontSize: '12px',
                          color: COLORS.text2,
                          padding: '6px 0',
                        }}>
                          <Mail size={14} color={role.bg} style={{ minWidth: '18px' }} />
                          <span>{email}</span>
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          fontSize: '12px',
                          color: COLORS.text2,
                          padding: '6px 0',
                          borderTop: `1px solid ${COLORS.line}`,
                        }}>
                          <Phone size={14} color={role.bg} style={{ minWidth: '18px' }} />
                          <span>{selectedStaff.phone || 'Not provided'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                  }}>

                    {/* Certifications */}
                    <div>
                      <div style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        color: role.bg,
                        marginBottom: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}>
                        <CheckCircle size={13} /> Certifications
                      </div>
                      <div style={{
                        background: COLORS.surface2,
                        borderRadius: '8px',
                        border: `1px solid ${COLORS.line}`,
                        padding: '6px 12px',
                      }}>
                        {certs.length > 0 ? (
                          certs.map((cert, i) => (
                            <div
                              key={i}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '6px 0',
                                borderBottom: i < certs.length - 1 ? `1px solid ${COLORS.line}` : 'none',
                                fontSize: '12px',
                                color: COLORS.text,
                                fontWeight: 500,
                              }}
                            >
                              <CheckCircle size={13} color={role.bg} />
                              {cert.trim()}
                            </div>
                          ))
                        ) : (
                          <p style={{
                            fontSize: '12px',
                            color: COLORS.text3,
                            margin: '6px 0',
                          }}>
                            No certifications listed
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Interests */}
                    <div>
                      <div style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        color: role.bg,
                        marginBottom: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}>
                        <Heart size={13} /> Interests
                      </div>
                      <div style={{
                        background: COLORS.surface2,
                        borderRadius: '8px',
                        border: `1px solid ${COLORS.line}`,
                        padding: '10px 12px',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '6px',
                      }}>
                        {selectedStaff.interests ? (
                          selectedStaff.interests.split(',').map((interest, i) => (
                            <span
                              key={i}
                              style={{
                                fontSize: '11px',
                                fontWeight: 500,
                                padding: '3px 12px',
                                borderRadius: '12px',
                                background: role.light,
                                color: COLORS.text2,
                                border: `1px solid ${role.bg}30`,
                              }}
                            >
                              {interest.trim()}
                            </span>
                          ))
                        ) : (
                          <span style={{
                            fontSize: '12px',
                            color: COLORS.text3,
                          }}>
                            No interests listed
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Achievements */}
                    {selectedStaff.achievements && (
                      <div>
                        <div style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                          color: role.bg,
                          marginBottom: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}>
                          <Award size={13} /> Achievements
                        </div>
                        <div style={{
                          background: COLORS.surface2,
                          borderRadius: '8px',
                          border: `1px solid ${COLORS.line}`,
                          padding: '10px 14px',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '8px',
                        }}>
                          <Award size={16} color={role.bg} style={{ marginTop: '1px', flexShrink: 0 }} />
                          <p style={{
                            fontSize: '12px',
                            color: COLORS.text2,
                            margin: 0,
                            lineHeight: 1.4,
                          }}>
                            {selectedStaff.achievements}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer with Edit + Close buttons */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  paddingTop: '16px',
                  marginTop: '16px',
                  borderTop: `1px solid ${COLORS.line}`,
                }}>
                  <button
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setIsProfileOpen(false); 
                      openEdit(selectedStaff) 
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '6px 14px' }}
                  >
                    <Edit size={14} /> Edit Profile
                  </button>
                  <button
                    onClick={() => { setIsProfileOpen(false); setSelectedStaff(null) }}
                    className="btn btn-primary btn-sm"
                    style={{ padding: '6px 14px' }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </>
        )
      })()}

      {/* ═══════════════════════════════════════════
          ADD / EDIT MODAL
      ═══════════════════════════════════════════ */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); resetForm() }}
        title={editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}
        size="lg"
      >
        <form onSubmit={handleSubmit}>
          {formErrors.email && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 14px', borderRadius: '8px',
              background: `${COLORS.red}14`, border: `1px solid ${COLORS.red}40`,
              marginBottom: '16px'
            }}>
              <AlertCircle size={16} color={COLORS.red} />
              <span style={{ fontSize: '13px', color: COLORS.red }}>{formErrors.email}</span>
              <button
                type="button"
                onClick={() => setFormErrors({})}
                style={{ marginLeft: 'auto', background: 'none', border: 'none', color: COLORS.text3, cursor: 'pointer' }}
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Profile Picture */}
          <div className="form-group">
            <label className="form-label">Profile Picture</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '10px', flexWrap: 'wrap' }}>
              {imagePreview ? (
                <div style={{ position: 'relative' }}>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{
                      width: '80px', height: '80px', borderRadius: '12px',
                      objectFit: 'cover', border: `2px solid ${COLORS.line}`
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => { setImagePreview(null); setFormData(prev => ({ ...prev, avatar: '' })) }}
                    style={{
                      position: 'absolute', top: '-8px', right: '-8px',
                      background: COLORS.red, border: 'none', borderRadius: '50%',
                      width: '22px', height: '22px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', color: COLORS.ink
                    }}
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <div style={{
                  width: '80px', height: '80px', borderRadius: '12px',
                  background: COLORS.surface2, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', border: `1px solid ${COLORS.line}`
                }}>
                  <Users size={32} color={COLORS.text3} />
                </div>
              )}
              <div>
                <label className="btn btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Upload size={14} /> Choose Image
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                </label>
                <p style={{ fontSize: '11px', color: COLORS.text3, marginTop: '4px' }}>Any size — auto compressed</p>
              </div>
            </div>
          </div>

          <div className="modal-grid-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                value={formData.name}
                onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                className="form-input"
                required
                style={formErrors.name ? { borderColor: COLORS.red } : {}}
              />
              {formErrors.name && <p style={{ fontSize: '11px', color: COLORS.red, marginTop: '4px' }}>{formErrors.name}</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                className="form-input"
                required
                style={formErrors.email ? { borderColor: COLORS.red } : {}}
              />
              {formErrors.email && <p style={{ fontSize: '11px', color: COLORS.red, marginTop: '4px' }}>{formErrors.email}</p>}
            </div>
          </div>

          {!editingStaff && (
            <div className="form-group">
              <label className="form-label">Password *</label>
              <input
                type="password"
                value={formData.password}
                onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
                className="form-input"
                required
                style={formErrors.password ? { borderColor: COLORS.red } : {}}
              />
              {formErrors.password && <p style={{ fontSize: '11px', color: COLORS.red, marginTop: '4px' }}>{formErrors.password}</p>}
            </div>
          )}

          <div className="modal-grid-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select value={formData.role} onChange={e => setFormData(p => ({ ...p, role: e.target.value }))} className="form-input">
                <option value="coach">Coach / Trainer</option>
                <option value="receptionist">Receptionist</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Specialty</label>
              <input value={formData.specialty} onChange={e => setFormData(p => ({ ...p, specialty: e.target.value }))} className="form-input" />
            </div>
          </div>

          <div className="modal-grid-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Salary (USD)</label>
              <input type="number" value={formData.salary} onChange={e => setFormData(p => ({ ...p, salary: e.target.value }))} className="form-input" />
            </div>
          </div>

          <div className="modal-grid-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Hire Date</label>
              <input type="date" value={formData.hire_date} onChange={e => setFormData(p => ({ ...p, hire_date: e.target.value }))} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Experience</label>
              <input value={formData.experience} onChange={e => setFormData(p => ({ ...p, experience: e.target.value }))} className="form-input" placeholder="e.g., 5 years" />
            </div>
          </div>

          <div className="modal-grid-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Rating (1–5)</label>
              <input
                value={formData.rating}
                onChange={e => setFormData(p => ({ ...p, rating: e.target.value }))}
                className="form-input"
                placeholder="e.g., 4.9"
                step="0.1" max="5" min="0"
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <div style={{
                padding: '10px 14px', borderRadius: '8px',
                background: `${COLORS.ember}10`, border: `1px solid ${COLORS.ember}30`,
                width: '100%', fontSize: '12px', color: COLORS.text2
              }}>
                <Users size={14} color={COLORS.ember} style={{ display: 'inline-block', marginRight: '6px' }} />
                Clients count is automatically calculated from assigned members
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Bio</label>
            <textarea value={formData.bio} onChange={e => setFormData(p => ({ ...p, bio: e.target.value }))} className="form-input" rows="2" placeholder="Short biography..." />
          </div>

          <div className="form-group">
            <label className="form-label">Certifications</label>
            <input value={formData.certifications} onChange={e => setFormData(p => ({ ...p, certifications: e.target.value }))} className="form-input" placeholder="NASM Certified, CrossFit Level 1" />
          </div>

          <div className="form-group">
            <label className="form-label">Achievements</label>
            <input value={formData.achievements} onChange={e => setFormData(p => ({ ...p, achievements: e.target.value }))} className="form-input" placeholder="Notable achievements..." />
          </div>

          <div className="form-group">
            <label className="form-label">Interests</label>
            <input value={formData.interests} onChange={e => setFormData(p => ({ ...p, interests: e.target.value }))} className="form-input" placeholder="e.g., Weightlifting, Nutrition" />
          </div>

          <div className="modal-grid-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Location</label>
              <input value={formData.location} onChange={e => setFormData(p => ({ ...p, location: e.target.value }))} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Instagram</label>
              <input value={formData.instagram} onChange={e => setFormData(p => ({ ...p, instagram: e.target.value }))} className="form-input" placeholder="@username" />
            </div>
          </div>

          <div className="modal-grid-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Twitter</label>
              <input value={formData.twitter} onChange={e => setFormData(p => ({ ...p, twitter: e.target.value }))} className="form-input" placeholder="@username" />
            </div>
            <div className="form-group">
              <label className="form-label">LinkedIn</label>
              <input value={formData.linkedin} onChange={e => setFormData(p => ({ ...p, linkedin: e.target.value }))} className="form-input" placeholder="profile name" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Website</label>
            <input value={formData.website} onChange={e => setFormData(p => ({ ...p, website: e.target.value }))} className="form-input" placeholder="https://..." />
          </div>

          <div className="flex gap-3 mt-4" style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1, minWidth: '120px' }}>Save Staff</button>
            <button type="button" onClick={() => { setIsModalOpen(false); resetForm() }} className="btn btn-ghost">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}