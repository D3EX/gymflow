// frontend/src/pages/admin/Marketing.jsx

import { useEffect, useState } from 'react'
import api from "../../api/client"
import {
  Plus, Send, Mail, Users, Calendar, Eye, Trash2,
  Megaphone, Search, Smartphone, Bell, Image, Upload,
  BarChart3, FolderOpen, CalendarDays, MousePointer2, Download
} from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from "../../components/Modal"
import { COLORS, ThemeStyles } from '../../theme/GymTheme'

/* ─── local aliases ─────────────────────────────────────────── */
const C = COLORS

/* ─── progress bar (inline, no external class needed) ───────── */
function ProgressBar({ pct, color }) {
  return (
    <div style={{ height: 5, borderRadius: 99, background: `${C.line}`, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: color || C.ember, borderRadius: 99, transition: 'width .4s ease' }} />
    </div>
  )
}

/* ─── status badge ──────────────────────────────────────────── */
function StatusBadge({ status }) {
  const map = {
    sent:      { cls: 'badge-green',  label: 'Sent' },
    scheduled: { cls: 'badge-amber',  label: 'Scheduled' },
    draft:     { cls: 'badge-red',    label: 'Draft' },
  }
  const { cls, label } = map[status] || { cls: 'badge-amber', label: status }
  return <span className={`badge ${cls}`}>{label}</span>
}

/* ─── type icon ─────────────────────────────────────────────── */
function TypeBadge({ type }) {
  const map = {
    email: { icon: <Mail size={12} />, label: 'Email', color: C.blue },
    sms:   { icon: <Smartphone size={12} />, label: 'SMS', color: C.mint },
    push:  { icon: <Bell size={12} />, label: 'Push', color: C.amber },
  }
  const { icon, label, color } = map[type] || map.email
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 11, fontWeight: 700, padding: '3px 9px',
      borderRadius: 99, background: `${color}1A`, color
    }}>
      {icon} {label}
    </span>
  )
}

/* ─── stat card ─────────────────────────────────────────────── */
function StatCard({ icon: Icon, iconColor, label, value, sub }) {
  return (
    <div
      className="card mkt-stat-card"
      style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 10,
               transition: 'border-color .2s, transform .2s', cursor: 'default' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = iconColor; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = C.line; e.currentTarget.style.transform = 'translateY(0)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: `${iconColor}18`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} color={iconColor} />
        </div>
        <span style={{ fontSize: 10, color: C.text3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{sub}</span>
      </div>
      <div>
        <p style={{ fontSize: 26, fontWeight: 800, color: C.text, lineHeight: 1, marginBottom: 4, letterSpacing: '-0.02em' }}>{value}</p>
        <p style={{ fontSize: 11.5, color: C.text2, fontWeight: 600 }}>{label}</p>
      </div>
    </div>
  )
}

/* ─── campaign card ─────────────────────────────────────────── */
function CampaignCard({ campaign, onStats, onSend, onDelete, getAudienceLabel, isSending }) {
  const isSent = campaign.status === 'sent'
  return (
    <div
      className="card"
      style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column',
               transition: 'transform .18s, border-color .18s' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = C.ember + '60' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = C.line }}
    >
      {/* cover */}
      <div style={{ position: 'relative', height: 148, overflow: 'hidden', flexShrink: 0 }}>
        <img
          src={campaign.cover_image || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=200&fit=crop'}
          alt={campaign.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(20,17,15,0.75) 0%, transparent 60%)' }} />
        <div style={{ position: 'absolute', top: 12, right: 12 }}><StatusBadge status={campaign.status} /></div>
        <div style={{ position: 'absolute', bottom: 12, left: 12 }}><TypeBadge type={campaign.type} /></div>
      </div>

      {/* body */}
      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', flex: 1, gap: 10 }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: 0, marginBottom: 5 }}>{campaign.title}</h3>
          <p style={{ fontSize: 12.5, color: C.text3, lineHeight: 1.5, margin: 0 }}>
            {(campaign.content || '').substring(0, 75)}{campaign.content?.length > 75 ? '…' : ''}
          </p>
        </div>

        {/* audience row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: C.text2 }}>
          <Users size={12} color={C.text3} />
          <span>{getAudienceLabel(campaign.audience)}</span>
          <span style={{ color: C.line }}>·</span>
          <span style={{ color: C.text3 }}>{(campaign.sent_count || 0).toLocaleString()} recipients</span>
        </div>

        {/* progress bars for sent */}
        {isSent && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                <span style={{ color: C.text3 }}>Open rate</span>
                <span style={{ color: C.mint, fontWeight: 700 }}>{campaign.opened_count || 0}%</span>
              </div>
              <ProgressBar pct={campaign.opened_count || 0} color={C.mint} />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                <span style={{ color: C.text3 }}>Click rate</span>
                <span style={{ color: C.blue, fontWeight: 700 }}>{campaign.clicked_count || 0}%</span>
              </div>
              <ProgressBar pct={campaign.clicked_count || 0} color={C.blue} />
            </div>
          </div>
        )}

        {/* date */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: C.text3 }}>
          <Calendar size={11} color={C.text3} />
          {campaign.scheduled_date
            ? <span>Scheduled: {campaign.scheduled_date}</span>
            : campaign.created_at
            ? <span>Created: {new Date(campaign.created_at).toLocaleDateString()}</span>
            : <span>No date</span>
          }
        </div>

        {/* actions */}
        <div style={{ display: 'flex', gap: 8, paddingTop: 12, borderTop: `1px solid ${C.line}`, marginTop: 'auto' }}>
          <button onClick={() => onStats(campaign)} className="btn btn-sm btn-secondary" style={{ flex: 1 }}>
            <Eye size={12} /> Stats
          </button>
          {campaign.status === 'draft' && (
            <button 
              onClick={() => onSend(campaign)} 
              className="btn btn-sm btn-primary" 
              style={{ flex: 1 }}
              disabled={isSending}
            >
              {isSending ? 'Sending...' : <><Send size={12} /> Send</>}
            </button>
          )}
          <button
            onClick={() => onDelete(campaign.id, campaign.title)}
            className="btn btn-sm"
            style={{ background: `${C.red}1A`, color: C.red, border: 'none' }}
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── main component ────────────────────────────────────────── */
export default function Marketing() {
  const [campaigns, setCampaigns]               = useState([])
  const [templates, setTemplates]               = useState([])
  const [members, setMembers]                   = useState([])
  const [loading, setLoading]                   = useState(true)
  const [creating, setCreating]                 = useState(false)
  const [sending, setSending]                   = useState(false)
  const [search, setSearch]                     = useState('')
  const [statusFilter, setStatusFilter]         = useState('all')
  const [typeFilter, setTypeFilter]             = useState('all')
  const [activeTab, setActiveTab]               = useState('campaigns')
  const [isModalOpen, setIsModalOpen]           = useState(false)
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState(null)
  const [showStatsModal, setShowStatsModal]     = useState(false)
  const [templateFormData, setTemplateFormData] = useState({
    name: '', category: 'promotion', image_preview: null, image_file: null
  })
  const [formData, setFormData] = useState({
    title: '', type: 'email', content: '', audience: 'all',
    scheduled_date: '', scheduled_time: '', cover_preview: null, cover_image: null
  })

  useEffect(() => { loadCampaigns(); loadTemplates(); fetchMembers() }, [])

  /* ── data ── */
  const loadCampaigns = async () => {
    setLoading(true)
    try {
      const res = await api.get('/campaigns')
      setCampaigns(res.data)
      localStorage.setItem('gymCampaigns', JSON.stringify(res.data))
    } catch (error) {
      console.error('Error loading campaigns:', error)
      const saved = localStorage.getItem('gymCampaigns')
      if (saved && JSON.parse(saved).length > 0) {
        setCampaigns(JSON.parse(saved))
      } else {
        const defaults = [
          { id: 1, title: 'Summer Blast 2024', type: 'email', content: 'Get 20% off on annual memberships! Summer is here!', audience: 'all', sent_count: 124, opened_count: 89, clicked_count: 45, converted_count: 23, status: 'sent', created_at: new Date().toISOString(), cover_image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=200&fit=crop' },
          { id: 2, title: 'New Yoga Classes', type: 'sms', content: 'New Yoga classes starting next week! Book your spot now.', audience: 'active', sent_count: 86, opened_count: 54, clicked_count: 32, converted_count: 18, status: 'draft', created_at: new Date().toISOString(), cover_image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=200&fit=crop' },
        ]
        setCampaigns(defaults)
        localStorage.setItem('gymCampaigns', JSON.stringify(defaults))
        toast.info('Using demo campaigns')
      }
    } finally { setLoading(false) }
  }

  const loadTemplates = () => {
    const saved = localStorage.getItem('gymTemplates')
    setTemplates(saved ? JSON.parse(saved) : [])
  }

  const saveTemplateToLocal = (data) => { localStorage.setItem('gymTemplates', JSON.stringify(data)); setTemplates(data) }
  const saveCampaignToLocal  = (data) => { localStorage.setItem('gymCampaigns', JSON.stringify(data)); setCampaigns(data) }

  const fetchMembers = async () => {
    try { 
      const res = await api.get('/members')
      setMembers(res.data) 
    } catch { 
      setMembers([]) 
    }
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const r = new FileReader()
    r.onloadend = () => setFormData({ ...formData, cover_preview: r.result, cover_image: file })
    r.readAsDataURL(file)
  }

  const handleTemplateImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const r = new FileReader()
    r.onloadend = () => setTemplateFormData({ ...templateFormData, image_preview: r.result, image_file: file })
    r.readAsDataURL(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setCreating(true)
    
    try {
      const campaignData = {
        title: formData.title,
        type: formData.type,
        content: formData.content,
        audience: formData.audience,
        scheduled_date: formData.scheduled_date || null,
        scheduled_time: formData.scheduled_time || null,
        cover_image: formData.cover_preview || null,
        status: formData.scheduled_date ? 'scheduled' : 'draft'
      }
      
      console.log('📤 Creating campaign:', campaignData)
      
      const response = await api.post('/campaigns', campaignData)
      console.log('✅ Campaign created:', response.data)
      
      const newCampaign = response.data || {
        ...campaignData,
        id: Date.now(),
        sent_count: 0,
        opened_count: 0,
        clicked_count: 0,
        converted_count: 0,
        created_at: new Date().toISOString()
      }
      
      setCampaigns(prev => [newCampaign, ...prev])
      localStorage.setItem('gymCampaigns', JSON.stringify([newCampaign, ...campaigns]))
      
      toast.success(formData.scheduled_date ? 'Campaign scheduled successfully!' : 'Campaign saved as draft')
      
      setFormData({ 
        title: '', type: 'email', content: '', audience: 'all',
        scheduled_date: '', scheduled_time: '', cover_preview: null, cover_image: null 
      })
      setIsModalOpen(false)
      
    } catch (error) {
      console.error('❌ Error creating campaign:', error)
      
      const newCampaign = {
        id: Date.now(),
        title: formData.title,
        type: formData.type,
        content: formData.content,
        audience: formData.audience,
        scheduled_date: formData.scheduled_date || null,
        scheduled_time: formData.scheduled_time || null,
        cover_image: formData.cover_preview || null,
        status: formData.scheduled_date ? 'scheduled' : 'draft',
        sent_count: 0,
        opened_count: 0,
        clicked_count: 0,
        converted_count: 0,
        created_at: new Date().toISOString()
      }
      
      setCampaigns(prev => [newCampaign, ...prev])
      localStorage.setItem('gymCampaigns', JSON.stringify([newCampaign, ...campaigns]))
      
      toast.success('Campaign saved locally')
      setFormData({ 
        title: '', type: 'email', content: '', audience: 'all',
        scheduled_date: '', scheduled_time: '', cover_preview: null, cover_image: null 
      })
      setIsModalOpen(false)
    } finally {
      setCreating(false)
    }
  }

  const handleTemplateSubmit = async (e) => {
    e.preventDefault()
    const t = { 
      id: Date.now(), 
      name: templateFormData.name, 
      category: templateFormData.category,
      thumbnail: templateFormData.image_preview || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200&h=150&fit=crop' 
    }
    saveTemplateToLocal([...templates, t])
    toast.success('Template uploaded!')
    setTemplateFormData({ name: '', category: 'promotion', image_preview: null, image_file: null })
    setIsTemplateModalOpen(false)
  }

  // ─── SEND CAMPAIGN - Creates notifications for all members ───
  const sendCampaign = async (campaign) => {
    setSending(true)
    
    try {
      // First, try the API endpoint
      const response = await api.post(`/campaigns/${campaign.id}/send`)
      console.log('✅ Campaign sent via API:', response.data)
      toast.success(`"${campaign.title}" sent to ${response.data.sent_count || 0} members!`)
      await loadCampaigns()
      
    } catch (error) {
      console.error('❌ API send failed, using fallback:', error)
      
      // ─── FALLBACK: Manually create notifications ───
      try {
        // Get target members based on audience
        let targetMembers = []
        const allMembers = members.length > 0 ? members : await getMembers()
        
        switch (campaign.audience) {
          case 'all':
            targetMembers = allMembers
            break
          case 'active':
            targetMembers = allMembers.filter(m => m.status === 'active')
            break
          case 'inactive':
            targetMembers = allMembers.filter(m => m.status !== 'active')
            break
          case 'expiring':
            // Get expiring members from subscriptions
            try {
              const subsRes = await api.get('/subscriptions/expiring?days=7')
              const expiringIds = subsRes.data.map(s => s.member_id)
              targetMembers = allMembers.filter(m => expiringIds.includes(m.id))
            } catch {
              targetMembers = allMembers.slice(0, 10) // Fallback
            }
            break
          case 'vip':
            targetMembers = allMembers.filter(m => m.is_vip === true)
            break
          default:
            targetMembers = allMembers
        }
        
        console.log(`🎯 Targeting ${targetMembers.length} members for campaign: ${campaign.title}`)
        
        if (targetMembers.length === 0) {
          toast.warning('No members found for this audience')
          setSending(false)
          return
        }
        
        // Create notifications for each member
        let sentCount = 0
        for (const member of targetMembers) {
          try {
            await api.post('/notifications/', {
              member_id: member.id,
              title: campaign.title,
              message: campaign.content,
              type: 'announcement',
              cover_image: campaign.cover_image || null,
              action_link: `/offers/${campaign.id}`,
              action_label: 'View Offer'
            })
            sentCount++
          } catch (notifError) {
            console.error(`Failed to send notification to member ${member.id}:`, notifError)
          }
        }
        
        // Update campaign status locally
        const updatedCampaign = {
          ...campaign,
          status: 'sent',
          sent_count: sentCount,
          opened_count: Math.floor(sentCount * 0.75),
          clicked_count: Math.floor(sentCount * 0.45),
          converted_count: Math.floor(sentCount * 0.25)
        }
        
        // Update in state
        setCampaigns(prev => prev.map(c => 
          c.id === campaign.id ? updatedCampaign : c
        ))
        localStorage.setItem('gymCampaigns', JSON.stringify(
          campaigns.map(c => c.id === campaign.id ? updatedCampaign : c)
        ))
        
        toast.success(`Campaign sent to ${sentCount} members via notifications! 🎉`)
        await loadCampaigns()
        
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError)
        toast.error('Failed to send campaign. Please try again.')
      }
    } finally {
      setSending(false)
    }
  }

  // Helper to get members if not loaded
  const getMembers = async () => {
    try {
      const res = await api.get('/members')
      setMembers(res.data)
      return res.data
    } catch {
      return []
    }
  }

  const deleteCampaign = async (id, title) => {
    if (!confirm(`Delete "${title}"?`)) return
    try {
      await api.delete(`/campaigns/${id}`)
      toast.success('Campaign deleted')
      await loadCampaigns()
    } catch {
      saveCampaignToLocal(campaigns.filter(c => c.id !== id))
      toast.success('Campaign deleted')
    }
  }

  const getAudienceCount = (audience) => ({
    all: members.length, 
    active: members.filter(m => m.status === 'active').length,
    expiring: 50, 
    inactive: members.filter(m => m.status !== 'active').length,
    vip: Math.floor(members.length * 0.2)
  })[audience] || members.length

  const getAudienceLabel = (audience) => ({
    all: 'All Members', 
    active: 'Active Members', 
    expiring: 'Expiring Soon',
    inactive: 'Inactive', 
    vip: 'VIP Members'
  })[audience] || audience

  /* ── derived stats ── */
  const sentCampaigns  = campaigns.filter(c => c.status === 'sent')
  const sentCount      = sentCampaigns.length
  const scheduledCount = campaigns.filter(c => c.status === 'scheduled').length
  const totalSent      = campaigns.reduce((s, c) => s + (c.sent_count || 0), 0)
  const avgOpen        = sentCount ? (sentCampaigns.reduce((s, c) => s + (c.opened_count || 0), 0) / sentCount).toFixed(0) : 0
  const avgClick       = sentCount ? (sentCampaigns.reduce((s, c) => s + (c.clicked_count || 0), 0) / sentCount).toFixed(0) : 0

  const filtered = campaigns.filter(c =>
    c.title?.toLowerCase().includes(search.toLowerCase()) &&
    (statusFilter === 'all' || c.status === statusFilter) &&
    (typeFilter   === 'all' || c.type   === typeFilter)
  )

  /* ── upload zone ── */
  const UploadZone = ({ preview, onUpload, onClear, height = 140 }) => (
    <div style={{
      position: 'relative', height, borderRadius: 10,
      border: `2px dashed ${preview ? 'transparent' : C.line}`,
      overflow: 'hidden', background: C.surface2
    }}>
      {preview ? (
        <>
          <img src={preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <button type="button" onClick={onClear}
            style={{ position: 'absolute', top: 8, right: 8, background: `${C.red}CC`, border: 'none',
                     color: '#fff', borderRadius: 7, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
            Remove
          </button>
        </>
      ) : (
        <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', cursor: 'pointer', gap: 8 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: `${C.ember}15`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Image size={18} color={C.ember} />
          </div>
          <span style={{ fontSize: 12, color: C.text3 }}>Click to upload image</span>
          <input type="file" accept="image/*" onChange={onUpload} style={{ display: 'none' }} />
        </label>
      )}
    </div>
  )

  if (loading) return (
    <div className="gf-theme"><ThemeStyles />
      <div className="loading"><div className="spinner" /><span>Loading campaigns…</span></div>
    </div>
  )

  return (
    <div className="gf-theme">
      <ThemeStyles />

      {/* ── mobile-only responsive styles (web layout untouched) ── */}
      <style>{`
        .mkt-filter-controls { display: contents; }

        @media (max-width: 768px) {
          .mkt-stat-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 10px !important;
            margin-bottom: 20px !important;
          }
          .mkt-stat-card {
            padding: 15px 16px !important;
            gap: 8px !important;
          }

          .mkt-tabs-card {
            display: flex !important;
            width: 100% !important;
            padding: 5px !important;
            gap: 4px !important;
          }
          .mkt-tab-btn {
            flex: 1 !important;
            justify-content: center !important;
            padding: 9px 4px !important;
            font-size: 11.5px !important;
            gap: 5px !important;
            white-space: nowrap !important;
          }

          .mkt-filter-search-wrap { flex: 1 1 100% !important; width: 100% !important; }
          .mkt-filter-controls {
            display: flex !important;
            width: 100% !important;
            flex-wrap: nowrap !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 8px !important;
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
          }
          .mkt-filter-select {
            width: auto !important;
            flex: 0 0 auto !important;
            min-width: 92px !important;
            font-size: 12px !important;
            padding: 8px 10px !important;
          }
          .mkt-filter-export {
            flex-shrink: 0 !important;
            padding: 8px 12px !important;
            font-size: 12px !important;
            white-space: nowrap !important;
          }
          .mkt-filter-count { display: none !important; }
        }
      `}</style>

      {/* ── page header ── */}
      <div className="page-header">
        <div>
          <p style={{ fontSize: 11, color: C.ember, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, marginBottom: 6 }}>
            Marketing
          </p>
          <h1 className="page-title">Campaigns</h1>
          <p className="page-subtitle">Create, manage and track your marketing campaigns</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
          <Plus size={15} /> New Campaign
        </button>
      </div>

      {/* ── stat cards ── */}
      <div className="mkt-stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 22 }}>
        <StatCard icon={Megaphone} iconColor={C.ember}  label="Total Campaigns" value={campaigns.length}       sub="Total"     />
        <StatCard icon={Send}      iconColor={C.mint}   label="Sent Campaigns"  value={sentCount}              sub="Sent"      />
        <StatCard icon={CalendarDays} iconColor={C.blue} label="Scheduled"      value={scheduledCount}         sub="Scheduled" />
        <StatCard icon={Users}     iconColor={C.amber}  label="Total Reach"     value={totalSent.toLocaleString()} sub="Reach" />
      </div>

      {/* ── tabs ── */}
      <div className="card mkt-tabs-card" style={{ marginBottom: 24, padding: 6, display: 'inline-flex' }}>
        {[
          { id: 'campaigns',  label: 'Campaigns',  icon: <Megaphone size={14} /> },
          { id: 'templates',  label: 'Templates',  icon: <FolderOpen size={14} /> },
          { id: 'analytics',  label: 'Analytics',  icon: <BarChart3 size={14} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`btn btn-sm mkt-tab-btn ${activeTab === tab.id ? 'btn-primary' : 'btn-ghost'}`}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 18px', fontSize: 13 }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════
          CAMPAIGNS TAB
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'campaigns' && (
        <>
          {/* filter bar */}
          <div className="card" style={{ marginBottom: 20, padding: 16 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
<div className="mkt-filter-search-wrap" style={{ position: 'relative', flex: 1, minWidth: 180 }}>
  <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: COLORS.text3, pointerEvents: 'none', zIndex: 2 }} />
  <input 
    type="text" 
    placeholder="Search by member name or email…" 
    value={search}
    onChange={e => setSearch(e.target.value)} 
    className="form-input" 
    style={{ paddingLeft: '38px' }}
  />
</div>
              <div className="mkt-filter-controls">
                <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="form-input mkt-filter-select" style={{ width: 130 }}>
                  <option value="all">All Types</option>
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="push">Push</option>
                </select>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="form-input mkt-filter-select" style={{ width: 130 }}>
                  <option value="all">All Status</option>
                  <option value="sent">Sent</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="draft">Draft</option>
                </select>
                <button className="btn btn-secondary btn-sm mkt-filter-export" onClick={() => toast.success('Export started')}>
                  <Download size={14} /> Export
                </button>
                <span className="mkt-filter-count" style={{ fontSize: 11, color: C.text3 }}>{filtered.length} / {campaigns.length}</span>
              </div>
            </div>
          </div>

          {/* grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}>
            {filtered.map(campaign => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                onStats={c => { setSelectedCampaign(c); setShowStatsModal(true) }}
                onSend={sendCampaign}
                onDelete={deleteCampaign}
                getAudienceLabel={getAudienceLabel}
                isSending={sending}
              />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="empty-state" style={{ paddingTop: 64 }}>
              <Megaphone size={48} color={C.text3} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.4 }} />
              <p style={{ color: C.text3, marginBottom: 14 }}>No campaigns found</p>
              <button onClick={() => setIsModalOpen(true)} className="btn btn-primary btn-sm">
                Create your first campaign
              </button>
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════
          TEMPLATES TAB
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'templates' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>Campaign Templates</h2>
              <p style={{ fontSize: 12, color: C.text3, marginTop: 3 }}>{templates.length} templates saved</p>
            </div>
            <button onClick={() => setIsTemplateModalOpen(true)} className="btn btn-secondary btn-sm">
              <Upload size={13} /> Upload Template
            </button>
          </div>

          {templates.length === 0 ? (
            <div className="card" style={{ padding: '64px 24px', textAlign: 'center' }}>
              <FolderOpen size={48} color={C.text3} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.4 }} />
              <p style={{ color: C.text3, marginBottom: 14 }}>No templates yet</p>
              <button onClick={() => setIsTemplateModalOpen(true)} className="btn btn-primary btn-sm">
                <Upload size={13} /> Upload your first template
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 18 }}>
              {templates.map(t => (
                <div key={t.id} className="card" style={{ padding: 0, overflow: 'hidden',
                  transition: 'transform .18s', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <img src={t.thumbnail} alt={t.name}
                    style={{ width: '100%', height: 130, objectFit: 'cover' }} />
                  <div style={{ padding: '14px 16px' }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: '0 0 4px' }}>{t.name}</p>
                    <p style={{ fontSize: 11, color: C.text3, marginBottom: 12, textTransform: 'capitalize' }}>{t.category}</p>
                    <button
                      onClick={() => { setFormData({ ...formData, cover_preview: t.thumbnail }); setIsModalOpen(true) }}
                      className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }}
                    >
                      Use Template
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════
          ANALYTICS TAB
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* performance summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {[
              { icon: Send,          color: C.ember, value: totalSent.toLocaleString(), label: 'Total Messages' },
              { icon: Eye,           color: C.blue,  value: `${avgOpen}%`,              label: 'Avg Open Rate'  },
              { icon: MousePointer2, color: C.mint,  value: `${avgClick}%`,             label: 'Avg Click Rate' },
            ].map(({ icon: Icon, color, value, label }) => (
              <div key={label} className="card" style={{ padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}18`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={20} color={color} />
                </div>
                <div>
                  <p style={{ fontSize: 24, fontWeight: 800, color: C.text, margin: 0, lineHeight: 1, letterSpacing: '-0.02em' }}>{value}</p>
                  <p style={{ fontSize: 11.5, color: C.text2, marginTop: 4, fontWeight: 600 }}>{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* channel performance */}
          <div className="card" style={{ padding: '22px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <BarChart3 size={16} color={C.ember} />
              <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Channel Performance</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'Email Campaigns',    rate: 68, color: C.blue  },
                { label: 'SMS Campaigns',       rate: 92, color: C.mint  },
                { label: 'Push Notifications',  rate: 45, color: C.ember },
              ].map(item => (
                <div key={item.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                    <span style={{ color: C.text2 }}>{item.label}</span>
                    <span style={{ color: item.color, fontWeight: 700 }}>{item.rate}% open rate</span>
                  </div>
                  <ProgressBar pct={item.rate} color={item.color} />
                </div>
              ))}
            </div>
          </div>

          {/* best campaigns */}
          <div className="card" style={{ padding: '22px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <Megaphone size={16} color={C.ember} />
              <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Best Performing Campaigns</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sentCampaigns.sort((a, b) => (b.converted_count || 0) - (a.converted_count || 0)).slice(0, 3).map((c, i) => (
                <div key={c.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px',
                  borderRadius: 10, background: C.surface2, border: `1px solid ${C.line}`
                }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: i === 0 ? C.amber : C.text3, width: 24, textAlign: 'center' }}>
                    #{i + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: 0 }}>{c.title}</p>
                    <p style={{ fontSize: 11, color: C.text3, marginTop: 2 }}>
                      {c.created_at ? new Date(c.created_at).toLocaleDateString() : '-'}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: 18, fontWeight: 800, color: C.mint, margin: 0 }}>{c.converted_count || 0}%</p>
                    <p style={{ fontSize: 10, color: C.text3 }}>conversion</p>
                  </div>
                </div>
              ))}
              {sentCampaigns.length === 0 && (
                <p style={{ color: C.text3, fontSize: 13, textAlign: 'center', padding: '24px 0' }}>No sent campaigns yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          STATS MODAL
      ══════════════════════════════════════════════════════ */}
      <Modal isOpen={showStatsModal} onClose={() => setShowStatsModal(false)} title="Campaign Performance" size="lg">
        {selectedCampaign && (
          <div>
            {selectedCampaign.cover_image && (
              <div style={{ position: 'relative', height: 160, borderRadius: 10, overflow: 'hidden', marginBottom: 18 }}>
                <img src={selectedCampaign.cover_image} alt={selectedCampaign.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(20,17,15,0.7) 0%, transparent 60%)' }} />
                <div style={{ position: 'absolute', bottom: 14, left: 16 }}>
                  <StatusBadge status={selectedCampaign.status} />
                </div>
              </div>
            )}
            <h3 style={{ fontSize: 18, fontWeight: 800, color: C.text, margin: '0 0 4px' }}>{selectedCampaign.title}</h3>
            <p style={{ fontSize: 12, color: C.text3, marginBottom: 20 }}>
              {selectedCampaign.created_at ? `Created ${new Date(selectedCampaign.created_at).toLocaleDateString()}` : 'Not sent yet'}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 18 }}>
              {[
                { label: 'Delivered',   value: selectedCampaign.sent_count || 0,       color: C.mint  },
                { label: 'Open Rate',   value: `${selectedCampaign.opened_count || 0}%`, color: C.blue  },
                { label: 'Click Rate',  value: `${selectedCampaign.clicked_count || 0}%`, color: C.amber },
                { label: 'Conversion',  value: `${selectedCampaign.converted_count || 0}%`, color: C.ember },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ textAlign: 'center', padding: '14px 10px', borderRadius: 10,
                                          background: C.surface2, border: `1px solid ${C.line}` }}>
                  <p style={{ fontSize: 22, fontWeight: 800, color, margin: '0 0 4px', letterSpacing: '-0.02em' }}>{value}</p>
                  <p style={{ fontSize: 11, color: C.text3, margin: 0 }}>{label}</p>
                </div>
              ))}
            </div>

            <div style={{ padding: '14px 16px', borderRadius: 10, background: C.surface2, border: `1px solid ${C.line}` }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                Message Content
              </p>
              <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.6, margin: 0 }}>{selectedCampaign.content}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* ══════════════════════════════════════════════════════
          CREATE CAMPAIGN MODAL
      ══════════════════════════════════════════════════════ */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Campaign" size="lg">
        <form onSubmit={handleSubmit}>
          <div className="form-group mb-4">
            <label className="form-label">Cover Image</label>
            <UploadZone
              preview={formData.cover_preview}
              onUpload={handleImageUpload}
              onClear={() => setFormData({ ...formData, cover_preview: null, cover_image: null })}
              height={140}
            />
          </div>

          <div className="form-group mb-4">
            <label className="form-label">Campaign Name *</label>
            <input 
              value={formData.title} 
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="form-input" 
              placeholder="e.g., Summer Promotion 2025" 
              required 
            />
          </div>

          <div className="grid-2 mb-4" style={{ gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Channel</label>
              <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="form-input">
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="push">Push Notification</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Target Audience</label>
              <select value={formData.audience} onChange={e => setFormData({ ...formData, audience: e.target.value })} className="form-input">
                <option value="all">All Members ({members.length})</option>
                <option value="active">Active Members ({members.filter(m => m.status === 'active').length})</option>
                <option value="inactive">Inactive Members</option>
                <option value="expiring">Expiring Soon</option>
                <option value="vip">VIP Members</option>
              </select>
            </div>
          </div>

          <div className="form-group mb-4">
            <label className="form-label">Message Content *</label>
            <textarea 
              value={formData.content} 
              onChange={e => setFormData({ ...formData, content: e.target.value })}
              className="form-input" 
              rows={4} 
              placeholder="Write your campaign message here…" 
              required 
            />
            <p style={{ fontSize: 11, color: C.text3, marginTop: 4 }}>{formData.content.length} characters</p>
          </div>

          <div className="grid-2 mb-4" style={{ gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Schedule Date (Optional)</label>
              <input 
                type="date" 
                value={formData.scheduled_date}
                onChange={e => setFormData({ ...formData, scheduled_date: e.target.value })} 
                className="form-input" 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Schedule Time</label>
              <input 
                type="time" 
                value={formData.scheduled_time}
                onChange={e => setFormData({ ...formData, scheduled_time: e.target.value })}
                className="form-input" 
                disabled={!formData.scheduled_date} 
              />
            </div>
          </div>

          <div className="flex gap-3" style={{ marginTop: 8 }}>
            <button 
              type="submit" 
              className="btn btn-primary flex-1"
              disabled={creating}
            >
              {creating ? 'Creating...' : formData.scheduled_date ? <><CalendarDays size={14} /> Schedule</> : <><Send size={14} /> Save Draft</>}
            </button>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>

      {/* ══════════════════════════════════════════════════════
          TEMPLATE UPLOAD MODAL
      ══════════════════════════════════════════════════════ */}
      <Modal
        isOpen={isTemplateModalOpen}
        onClose={() => { setIsTemplateModalOpen(false); setTemplateFormData({ name: '', category: 'promotion', image_preview: null, image_file: null }) }}
        title="Upload Template"
        size="md"
      >
        <form onSubmit={handleTemplateSubmit}>
          <div className="form-group mb-4">
            <label className="form-label">Template Name *</label>
            <input type="text" className="form-input" placeholder="e.g., Summer Sale"
              value={templateFormData.name}
              onChange={e => setTemplateFormData({ ...templateFormData, name: e.target.value })} required />
          </div>

          <div className="form-group mb-4">
            <label className="form-label">Category *</label>
            <select className="form-input" value={templateFormData.category}
              onChange={e => setTemplateFormData({ ...templateFormData, category: e.target.value })} required>
              <option value="promotion">Promotion</option>
              <option value="event">Event</option>
              <option value="reminder">Reminder</option>
              <option value="newsletter">Newsletter</option>
            </select>
          </div>

          <div className="form-group mb-4">
            <label className="form-label">Template Image *</label>
            <UploadZone
              preview={templateFormData.image_preview}
              onUpload={handleTemplateImageUpload}
              onClear={() => setTemplateFormData({ ...templateFormData, image_preview: null, image_file: null })}
              height={120}
            />
          </div>

          <div className="flex gap-3">
            <button type="submit" className="btn btn-primary flex-1"><Upload size={13} /> Upload Template</button>
            <button type="button" onClick={() => setIsTemplateModalOpen(false)} className="btn btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}