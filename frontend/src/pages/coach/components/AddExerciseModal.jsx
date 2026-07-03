// frontend/src/pages/coach/components/AddExerciseModal.jsx
// frontend/src/pages/coach/components/AddExerciseModal.jsx
import { useState, useEffect } from 'react'
import { Dumbbell, Plus, Search, Check, BookOpen, Loader2, X } from 'lucide-react'
import api from '../../../api/client'  // Changed from ../../ to ../../
import toast from 'react-hot-toast'
import MuscleSelector from './MuscleSelector'

const fields = [['sets', 'Sets'], ['reps', 'Reps'], ['weight', 'kg'], ['duration', 'min']]

export default function AddExerciseModal({ isOpen, onClose, onSave, selectedDay, saving }) {
  const [formData, setFormData] = useState({
    name: '',
    sets: '',
    reps: '',
    weight: '',
    duration: '',
    notes: '',
    targets: [],
    is_custom: false
  })

  const [mode, setMode] = useState('library')
  const [library, setLibrary] = useState([])
  const [libLoading, setLibLoading] = useState(false)
  const [libSearch, setLibSearch] = useState('')
  const [libCategory, setLibCategory] = useState('all')
  const [selectedLib, setSelectedLib] = useState(null)
  const [categories, setCategories] = useState([])

  useEffect(() => {
    if (isOpen && mode === 'library') fetchLib()
  }, [isOpen, mode])

  const fetchLib = async () => {
    setLibLoading(true)
    try {
      const res = await api.get('/programs/exercises/library')
      const exs = res.data || []
      setLibrary(exs)
      setCategories([...new Set(exs.map(e => e.category).filter(Boolean))])
    } catch { toast.error('Failed to load library') }
    finally { setLibLoading(false) }
  }

  const pickLib = (ex) => {
    setSelectedLib(ex)
    setFormData({
      name: ex.name,
      sets: ex.default_sets || '3',
      reps: ex.default_reps || '10',
      weight: '',
      duration: '',
      notes: ex.instructions || '',
      targets: ex.muscle_groups || [],
      is_custom: false
    })
  }

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error('Please enter an exercise name')
      return
    }
    onSave(formData)
  }

  const filtered = library.filter(ex =>
    (libCategory === 'all' || ex.category === libCategory) &&
    (!libSearch || ex.name.toLowerCase().includes(libSearch.toLowerCase()))
  )

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{
        maxWidth: 580,
        animation: 'slideUp 0.25s ease',
      }}>
        <div className="modal-bar" />
        <div className="modal-header">
          <h3 style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: 750,
            color: 'var(--text)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <Dumbbell size={18} color="var(--accent)" />
            Add Exercise to {selectedDay?.day_of_week || 'Day'}
          </h3>
          <button
            onClick={onClose}
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '7px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text-2)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-3)' }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '20px', gap: '14px' }}>
          {/* Mode Tabs */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              className={`lib-tab ${mode === 'library' ? 'active' : ''}`}
              onClick={() => setMode('library')}
              style={{
                padding: '6px 14px',
                borderRadius: '7px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                border: '1px solid var(--border)',
                background: mode === 'library' ? 'var(--accent)' : 'transparent',
                color: mode === 'library' ? '#fff' : 'var(--text-3)',
                transition: 'all 0.15s',
                fontFamily: 'inherit',
              }}
            >
              <BookOpen size={12} style={{ display: 'inline', marginRight: 6 }} />From Library
            </button>
            <button
              className={`lib-tab ${mode === 'custom' ? 'active' : ''}`}
              onClick={() => setMode('custom')}
              style={{
                padding: '6px 14px',
                borderRadius: '7px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                border: '1px solid var(--border)',
                background: mode === 'custom' ? 'var(--accent)' : 'transparent',
                color: mode === 'custom' ? '#fff' : 'var(--text-3)',
                transition: 'all 0.15s',
                fontFamily: 'inherit',
              }}
            >
              <Plus size={12} style={{ display: 'inline', marginRight: 6 }} />Custom
            </button>
          </div>

          {mode === 'library' && (
            <>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  background: 'var(--surface-2)',
                  borderRadius: 8,
                  padding: '0 10px',
                  border: '1px solid var(--border)',
                }}>
                  <Search size={13} color="var(--text-3)" />
                  <input
                    value={libSearch}
                    onChange={e => setLibSearch(e.target.value)}
                    placeholder="Search exercises…"
                    style={{
                      background: 'none',
                      border: 'none',
                      outline: 'none',
                      fontSize: '12px',
                      color: 'var(--text)',
                      padding: '7px 0',
                      width: '100%',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
                <select
                  className="form-input"
                  style={{ width: 130, fontSize: '12px', padding: '7px 10px' }}
                  value={libCategory}
                  onChange={e => setLibCategory(e.target.value)}
                >
                  <option value="all">All</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px', padding: '4px' }}>
                {libLoading
                  ? <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}><Loader2 size={20} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} /></div>
                  : filtered.length === 0
                    ? <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-3)', padding: '18px' }}>No results found</p>
                    : filtered.map(ex => (
                      <div
                        key={ex.id}
                        onClick={() => pickLib(ex)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '9px 12px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          transition: 'background 0.12s',
                          background: selectedLib?.id === ex.id ? 'var(--accent)1A' : 'transparent',
                        }}
                        onMouseEnter={e => { if (selectedLib?.id !== ex.id) e.currentTarget.style.background = 'var(--surface-2)' }}
                        onMouseLeave={e => { if (selectedLib?.id !== ex.id) e.currentTarget.style.background = 'transparent' }}
                      >
                        <div style={{
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          background: selectedLib?.id === ex.id ? 'var(--accent)' : 'var(--surface-2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <Dumbbell size={13} color={selectedLib?.id === ex.id ? '#fff' : 'var(--text-3)'} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{ex.name}</p>
                          {ex.category && <span style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: 700 }}>{ex.category}</span>}
                        </div>
                        {ex.default_sets && <span style={{ fontSize: '10px', color: 'var(--text-3)' }}>{ex.default_sets}×{ex.default_reps}</span>}
                        {selectedLib?.id === ex.id && <Check size={13} color="var(--accent)" />}
                      </div>
                    ))
                }
              </div>

              {selectedLib && (
                <div className="fields-grid" style={{ paddingTop: '4px' }}>
                  {fields.map(([k, l]) => (
                    <div key={k}>
                      <label style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '3px' }}>{l}</label>
                      <input
                        className="form-input"
                        style={{ fontSize: '12px', padding: '6px 10px' }}
                        value={formData[k] || ''}
                        onChange={e => setFormData(p => ({ ...p, [k]: e.target.value }))}
                        placeholder="—"
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {mode === 'custom' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>Exercise Name *</label>
                <input
                  className="form-input"
                  value={formData.name}
                  onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g., Barbell Squat"
                />
              </div>
              <div className="fields-grid">
                {fields.map(([k, l]) => (
                  <div key={k}>
                    <label style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '3px' }}>{l}</label>
                    <input
                      className="form-input"
                      style={{ fontSize: '12px', padding: '6px 10px' }}
                      value={formData[k] || ''}
                      onChange={e => setFormData(p => ({ ...p, [k]: e.target.value }))}
                      placeholder="—"
                    />
                  </div>
                ))}
              </div>
              <MuscleSelector selected={formData.targets || []} onChange={v => setFormData(p => ({ ...p, targets: v }))} />
              <div>
                <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>Notes</label>
                <input
                  className="form-input"
                  value={formData.notes || ''}
                  onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Optional coaching notes…"
                />
              </div>
            </div>
          )}

          {mode === 'library' && (
            <MuscleSelector 
              selected={formData.targets || []} 
              onChange={v => setFormData(p => ({ ...p, targets: v }))} 
            />
          )}
        </div>

        <div className="modal-footer" style={{ padding: '14px 20px' }}>
          <button
            className="btn-primary"
            disabled={saving || !formData.name.trim()}
            onClick={handleSave}
            style={{
              flex: 1,
              padding: '10px 20px',
              borderRadius: '10px',
              border: 'none !important',
              background: '#FF5A1F !important',
              backgroundColor: '#FF5A1F !important',
              color: '#FFFFFF !important',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'opacity 0.2s',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            {saving ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={15} />}
            {saving ? 'Adding…' : 'Add Exercise'}
          </button>
          <button
            className="btn-secondary"
            onClick={onClose}
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              border: '1px solid var(--border) !important',
              background: 'transparent !important',
              color: 'var(--text-2) !important',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--text)'; e.currentTarget.style.color = 'var(--text)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}