import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, Wrench, AlertCircle, CheckCircle, Search, Package,
         DollarSign, Activity, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from "../../components/Modal"
import api from "../../api/client"
import { COLORS, ThemeStyles } from '../../theme/GymTheme'

const ACCENT = COLORS.ember
const GREEN  = COLORS.mint
const YELLOW = COLORS.amber
const RED    = COLORS.red

const EQUIPMENT_IMAGES = {
  treadmill: '/icons gym/treadmill.png',
  elliptical: '/icons gym/elliptical.png',
  bike: '/icons gym/bike.png',
  cable_machine: '/icons gym/cable_machine.png',
  chest_machine: '/icons gym/chest_machine.png',
  squat_rack: '/icons gym/squat_rack.png',
  bench: '/icons gym/bench.png',
  dumbbell_rack: '/icons gym/dumbbell_rack.png',
  barbell: '/icons gym/barbell.png',
  tapis: '/icons gym/tapis.png',
  locker: '/icons gym/locker.png',
  leg_press: '/icons gym/leg_press.png',
  weight_bench: '/icons gym/weight_bench.png',
  kettle_ball: '/icons gym/kettle_ball.png',
  wall_bars: '/icons gym/wall_bars.png',
  leg_extension: '/icons gym/leg_extension.png',
  supplements: '/icons gym/supplements.png',
  scale_mat: '/icons gym/scale_mat.png',
  default: '/icons gym/dumbbell_rack.png'
}

const getEquipmentImage = (name) => {
  const lowerName = name.toLowerCase()

  if (lowerName.includes('treadmill')) return EQUIPMENT_IMAGES.treadmill
  if (lowerName.includes('elliptical')) return EQUIPMENT_IMAGES.elliptical
  if (lowerName.includes('bike') || lowerName.includes('cycling')) return EQUIPMENT_IMAGES.bike
  if (lowerName.includes('tapis') || lowerName.includes('mat')) return EQUIPMENT_IMAGES.tapis
  if (lowerName.includes('cable')) return EQUIPMENT_IMAGES.cable_machine
  if (lowerName.includes('chest')) return EQUIPMENT_IMAGES.chest_machine
  if (lowerName.includes('squat')) return EQUIPMENT_IMAGES.squat_rack
  if (lowerName.includes('leg press')) return EQUIPMENT_IMAGES.leg_press
  if (lowerName.includes('leg extension')) return EQUIPMENT_IMAGES.leg_extension
  if (lowerName.includes('weight bench')) return EQUIPMENT_IMAGES.weight_bench
  if (lowerName.includes('bench')) return EQUIPMENT_IMAGES.bench
  if (lowerName.includes('pull up') || lowerName.includes('wall bars')) return EQUIPMENT_IMAGES.wall_bars
  if (lowerName.includes('dumbbell')) return EQUIPMENT_IMAGES.dumbbell_rack
  if (lowerName.includes('barbell')) return EQUIPMENT_IMAGES.barbell
  if (lowerName.includes('kettle')) return EQUIPMENT_IMAGES.kettle_ball
  if (lowerName.includes('locker')) return EQUIPMENT_IMAGES.locker
  if (lowerName.includes('supplement')) return EQUIPMENT_IMAGES.supplements
  if (lowerName.includes('scale')) return EQUIPMENT_IMAGES.scale_mat

  return EQUIPMENT_IMAGES.default
}

function daysSince(dateStr) {
  if (!dateStr) return null
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

function FleetHealthBar({ equipment }) {
  const units = { good: 0, maintenance: 0, 'needs repair': 0 }
  equipment.forEach(e => { units[e.status] = (units[e.status] || 0) + e.quantity })
  const total = Object.values(units).reduce((a, b) => a + b, 0)
  if (total === 0) return null
  const pctGood = (units.good / total * 100).toFixed(1)
  const pctMaint = (units.maintenance / total * 100).toFixed(1)
  const pctRepair = (units['needs repair'] / total * 100).toFixed(1)

  return (
    <div className="card" style={{ padding: '20px 24px', marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={16} color={ACCENT} />
          <span className="stat-label">Fleet Health</span>
        </div>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {[
            { label: 'Operational', pct: pctGood, color: GREEN },
            { label: 'Maintenance', pct: pctMaint, color: YELLOW },
            { label: 'Needs Repair', pct: pctRepair, color: RED },
          ].map(({ label, pct, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
              <span className="stat-sub">{label}</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color }}>{pct}%</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', height: '8px', borderRadius: '99px', overflow: 'hidden', gap: '2px' }}>
        {pctGood > 0 && <div style={{ flex: parseFloat(pctGood), background: GREEN }} />}
        {pctMaint > 0 && <div style={{ flex: parseFloat(pctMaint), background: YELLOW }} />}
        {pctRepair > 0 && <div style={{ flex: parseFloat(pctRepair), background: RED }} />}
      </div>
      <div className="stat-sub" style={{ marginTop: '10px', textAlign: 'right' }}>
        {total} total units
      </div>
    </div>
  )
}

function EquipmentCard({ item, onEdit, onDelete }) {
  const statusConfig = {
    'good':         { label: 'Operational', color: GREEN,  bg: `${GREEN}1F`,  border: `${GREEN}40` },
    'maintenance':  { label: 'Maintenance', color: YELLOW, bg: `${YELLOW}1F`, border: `${YELLOW}40` },
    'needs repair': { label: 'Needs Repair', color: RED,   bg: `${RED}1F`,    border: `${RED}40` },
  }
  const s = statusConfig[item.status] || statusConfig['good']
  const days = daysSince(item.last_maintenance)
  const serviceColor = days === null ? COLORS.text3 : days > 180 ? RED : days > 90 ? YELLOW : GREEN
  const serviceLabel = days === null ? 'Never' : days === 0 ? 'Today' : `${days}d ago`
  const equipmentImage = getEquipmentImage(item.name)

  return (
    <div
      className="card"
      style={{
        padding: 0,
        overflow: 'hidden',
        borderRadius: '14px',
        display: 'flex',
        flexDirection: 'row',
        transition: 'transform .18s',
      }}
      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
    >
      <div style={{
        width: '130px', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px 12px', background: COLORS.surface2,
      }}>
        <img
          src={equipmentImage}
          alt={item.name}
          onError={e => { e.target.src = EQUIPMENT_IMAGES.default }}
          style={{ width: '100%', height: '100px', objectFit: 'contain', filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.6))', opacity: 0.92 }}
        />
      </div>

      <div style={{ flex: 1, padding: '14px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '6px' }}>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: COLORS.text, marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.name}
              </p>
              <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '.7px', textTransform: 'uppercase', color: COLORS.text3 }}>
                {item.category?.replace('_', ' ') || 'Other'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '5px', marginLeft: '8px', flexShrink: 0 }}>
              <button onClick={() => onEdit(item)} style={{ width: 24, height: 24, borderRadius: 6, border: 'none', cursor: 'pointer', background: `${COLORS.ember}1F`, color: COLORS.ember, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Edit size={11} />
              </button>
              <button onClick={() => onDelete(item.id, item.name)} style={{ width: 24, height: 24, borderRadius: 6, border: 'none', cursor: 'pointer', background: `${RED}1F`, color: RED, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trash2 size={11} />
              </button>
            </div>
          </div>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            padding: '2px 8px', borderRadius: '20px', marginBottom: '10px',
            background: s.bg, border: `1px solid ${s.border}`,
            fontSize: '10px', fontWeight: 700, letterSpacing: '.4px', textTransform: 'uppercase', color: s.color
          }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: s.color }} />
            {s.label}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '5px' }}>
          {[
            { label: 'Units',    value: item.quantity,  style: { fontSize: '16px' } },
            { label: 'Value',    value: item.price ? `${((item.price * item.quantity) / 1000).toFixed(0)}k` : '—', style: { fontSize: '12px' } },
            { label: 'Serviced', value: serviceLabel,   style: { fontSize: '11px', color: serviceColor } },
          ].map(({ label, value, style }) => (
            <div key={label} style={{ background: COLORS.surface2, borderRadius: '7px', padding: '6px 8px' }}>
              <div style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px', color: COLORS.text3, marginBottom: '2px' }}>{label}</div>
              <div style={{ fontWeight: 700, color: COLORS.text, ...style }}>{value}</div>
            </div>
          ))}
        </div>

        {item.notes && (
          <div style={{ marginTop: '8px', background: COLORS.surface2, borderRadius: '7px', padding: '6px 8px', borderLeft: `2px solid ${COLORS.line}` }}>
            <p style={{ fontSize: '10px', color: COLORS.text2, margin: 0, lineHeight: 1.5,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {item.notes}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Equipment() {
  const [equipment, setEquipment] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('status')
  const [formData, setFormData] = useState({
    name: '', category: 'cardio', quantity: 1, status: 'good', purchase_date: '', last_maintenance: '', notes: '', price: ''
  })
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    loadEquipment()
    
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const loadEquipment = async () => {
    setLoading(true)
    try {
      const res = await api.get('/equipment')
      setEquipment(res.data)
    } catch (error) {
      console.error('Failed to fetch equipment', error)
      setEquipment([])
      toast.error('Could not load equipment data')
    } finally {
      setLoading(false)
    }
  }

  const saveEquipment = async (data) => {
    try {
      if (editingItem) {
        await api.put(`/equipment/${editingItem.id}`, data)
        toast.success('Equipment updated successfully')
      } else {
        await api.post('/equipment', data)
        toast.success('Equipment added successfully')
      }
      await loadEquipment()
      return true
    } catch (error) {
      console.error('Failed to save equipment', error)
      toast.error('Failed to save equipment')
      return false
    }
  }

  const openAdd = () => {
    setEditingItem(null)
    setFormData({ name: '', category: 'cardio', quantity: 1, status: 'good', purchase_date: '', last_maintenance: '', notes: '', price: '' })
    setIsModalOpen(true)
  }

  const openEdit = (item) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      status: item.status,
      purchase_date: item.purchase_date || '',
      last_maintenance: item.last_maintenance || '',
      notes: item.notes || '',
      price: item.price || ''
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const submitData = {
      name: formData.name,
      category: formData.category,
      quantity: parseInt(formData.quantity) || 1,
      status: formData.status,
      purchase_date: formData.purchase_date || null,
      last_maintenance: formData.last_maintenance || null,
      notes: formData.notes,
      price: parseFloat(formData.price) || 0
    }

    const success = await saveEquipment(submitData)
    if (success) {
      setIsModalOpen(false)
    }
  }

  const handleDelete = (id, name) => {
    setDeleteTarget({ id, name })
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await api.delete(`/equipment/${deleteTarget.id}`)
      toast.success('Equipment removed')
      await loadEquipment()
    } catch (error) {
      console.error('Failed to delete equipment', error)
      toast.error('Failed to delete equipment')
    } finally {
      setDeleteTarget(null)
    }
  }

  const totalUnits = equipment.reduce((s, e) => s + (e.quantity || 0), 0)
  const goodUnits = equipment.filter(e => e.status === 'good').reduce((s, e) => s + (e.quantity || 0), 0)
  const repairUnits = equipment.filter(e => e.status === 'needs repair').reduce((s, e) => s + (e.quantity || 0), 0)
  const totalValue = equipment.reduce((s, e) => s + ((e.price || 0) * (e.quantity || 0)), 0)

  const STATUS_PRIORITY = { 'needs repair': 0, maintenance: 1, good: 2 }
  const filtered = equipment.filter(item => {
    const matchSearch = item.name?.toLowerCase().includes(search.toLowerCase())
    const matchCategory = categoryFilter === 'all' || item.category === categoryFilter
    const matchStatus = statusFilter === 'all' || item.status === statusFilter
    return matchSearch && matchCategory && matchStatus
  }).sort((a, b) => {
    if (sortBy === 'status') return STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status]
    if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '')
    if (sortBy === 'value') return ((b.price || 0) * (b.quantity || 0)) - ((a.price || 0) * (a.quantity || 0))
    return 0
  })

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
      <div className="page-header">
        <div>
          <p style={{ fontSize: '11px', color: COLORS.ember, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, marginBottom: '6px' }}>
            Management
          </p>
          <h1 className="page-title">Equipment</h1>
          <p className="page-subtitle">Manage gym fleet — {totalUnits} units</p>
        </div>
        <button onClick={openAdd} className="btn btn-primary"><Plus size={16} /> Add Equipment</button>
      </div>

      <FleetHealthBar equipment={equipment} />

      {/* Stats Cards - 2 columns on mobile, 4 on desktop */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? '10px' : '14px', marginBottom: '20px' }}>
        <div className="card" style={{ padding: '18px' }}>
          <Package size={20} color={ACCENT} className="mb-2" />
          <div className="stat-value">{totalUnits}</div>
          <div className="stat-label">Total Units</div>
        </div>
        <div className="card" style={{ padding: '18px' }}>
          <CheckCircle size={20} color={GREEN} className="mb-2" />
          <div className="stat-value">{goodUnits}</div>
          <div className="stat-label">Operational</div>
        </div>
        <div className="card" style={{ padding: '18px' }}>
          <AlertCircle size={20} color={RED} className="mb-2" />
          <div className="stat-value">{repairUnits}</div>
          <div className="stat-label">Need Repair</div>
        </div>
        <div className="card" style={{ padding: '18px' }}>
          <DollarSign size={20} color={ACCENT} className="mb-2" />
          <div className="stat-value">{(totalValue / 1000000).toFixed(1)}M</div>
          <div className="stat-label">Fleet Value</div>
        </div>
      </div>

      {/* Search/Filter Card - buttons on top, search below on mobile */}
      <div className="card" style={{ marginBottom: '16px', padding: '16px' }}>
        {isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="form-input" style={{ flex: 1, minWidth: 0 }}>
                <option value="all">All Categories</option>
                <option value="cardio">Cardio</option>
                <option value="strength">Strength</option>
                <option value="free_weights">Free Weights</option>
                <option value="stretching">Stretching</option>
                <option value="other">Other</option>
              </select>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="form-input" style={{ flex: 1, minWidth: 0 }}>
                <option value="all">All Status</option>
                <option value="good">Operational</option>
                <option value="needs repair">Needs Repair</option>
                <option value="maintenance">Maintenance</option>
              </select>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="form-input" style={{ flex: 1, minWidth: 0 }}>
                <option value="status">Urgency</option>
                <option value="name">Name</option>
                <option value="value">Value</option>
              </select>
            </div>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: COLORS.text3, pointerEvents: 'none', zIndex: 2 }} />
              <input
                type="text"
                placeholder="Search by name, role, or specialty..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '38px', width: '100%' }}
              />
            </div>
            <span className="stat-sub" style={{ textAlign: 'right', fontSize: '12px', color: COLORS.text3 }}>
              {filtered.length} of {equipment.length}
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: COLORS.text3, pointerEvents: 'none', zIndex: 2 }} />
              <input
                type="text"
                placeholder="Search by name, role, or specialty..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '38px' }}
              />
            </div>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="form-input" style={{ width: '140px' }}>
              <option value="all">All Categories</option>
              <option value="cardio">Cardio</option>
              <option value="strength">Strength</option>
              <option value="free_weights">Free Weights</option>
              <option value="stretching">Stretching</option>
              <option value="other">Other</option>
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="form-input" style={{ width: '140px' }}>
              <option value="all">All Status</option>
              <option value="good">Operational</option>
              <option value="needs repair">Needs Repair</option>
              <option value="maintenance">Maintenance</option>
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="form-input" style={{ width: '130px' }}>
              <option value="status">Urgency</option>
              <option value="name">Name</option>
              <option value="value">Value</option>
            </select>
            <span className="stat-sub">{filtered.length} of {equipment.length}</span>
          </div>
        )}
      </div>

      {/* Equipment Cards - UNCHANGED, same as desktop */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
        {filtered.map(item => <EquipmentCard key={item.id} item={item} onEdit={openEdit} onDelete={handleDelete} />)}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <Wrench size={48} className="mx-auto mb-3 opacity-50" />
          <p>No equipment found</p>
          <button onClick={openAdd} className="btn btn-primary btn-sm mt-3">Add Equipment</button>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingItem(null) }} title={editingItem ? 'Edit Equipment' : 'Add Equipment'} size="md">
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label className="form-label">Equipment Name *</label><input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="form-input" required /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group"><label className="form-label">Category</label><select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="form-input"><option value="cardio">Cardio</option><option value="strength">Strength</option><option value="free_weights">Free Weights</option><option value="stretching">Stretching</option><option value="other">Other</option></select></div>
            <div className="form-group"><label className="form-label">Status</label><select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="form-input"><option value="good">Operational</option><option value="needs repair">Needs Repair</option><option value="maintenance">Maintenance</option></select></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group"><label className="form-label">Quantity</label><input type="number" min="1" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 1})} className="form-input" /></div>
            <div className="form-group"><label className="form-label">Price (DZD)</label><input type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="form-input" /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group"><label className="form-label">Purchase Date</label><input type="date" value={formData.purchase_date} onChange={(e) => setFormData({...formData, purchase_date: e.target.value})} className="form-input" /></div>
            <div className="form-group"><label className="form-label">Last Maintenance</label><input type="date" value={formData.last_maintenance} onChange={(e) => setFormData({...formData, last_maintenance: e.target.value})} className="form-input" /></div>
          </div>
          <div className="form-group"><label className="form-label">Notes</label><textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="form-input" rows="3" /></div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <button type="submit" className="btn btn-primary">{editingItem ? 'Save Changes' : 'Add Equipment'}</button>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-ghost">Cancel</button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title=""
        size="sm"
      >
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
              background: 'rgba(251, 113, 33, 0.10)',
              border: '1px solid rgba(251, 113, 33, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '22px',
            }}
          >
            <AlertTriangle size={30} color="#C56A2A" strokeWidth={2} />
          </div>

          <h3
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: 'var(--text)',
              margin: '0 0 10px',
            }}
          >
            Delete Equipment
          </h3>

          <p
            style={{
              fontSize: '14px',
              color: 'var(--text-muted)',
              lineHeight: 1.6,
              maxWidth: '320px',
              margin: '0 auto 28px',
            }}
          >
            Are you sure you want to delete{' '}
            <span style={{ color: 'var(--text)', fontWeight: 600 }}>
              {deleteTarget?.name || 'this equipment'}
            </span>
            ? This will permanently remove it from your inventory and cannot be undone.
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
              className="btn btn-secondary"
              style={{ flex: '0 1 140px', fontWeight: 500 }}
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="btn"
              style={{
                flex: '0 1 140px',
                background: '#C56A2A',
                color: '#fff',
                border: 'none',
                fontWeight: 600,
                boxShadow: '0 2px 10px rgba(251, 113, 33, 0.35)',
                transition: 'background 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#e5620f'
                e.currentTarget.style.boxShadow = '0 2px 14px rgba(251, 113, 33, 0.45)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#C56A2A'
                e.currentTarget.style.boxShadow = '0 2px 10px rgba(251, 113, 33, 0.35)'
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}