// frontend/src/pages/coach/components/ExerciseForm.jsx
// frontend/src/pages/coach/components/ExerciseForm.jsx
import { useState, useEffect } from 'react'
import { Dumbbell, Plus, Search, Check, BookOpen, Loader2, X } from 'lucide-react'
import api from '../../../api/client'  // Changed from ../../ to ../../
import toast from 'react-hot-toast'
import MuscleSelector from './MuscleSelector'

const fields = [['sets', 'Sets'], ['reps', 'Reps'], ['weight', 'kg'], ['duration', 'min']]

export default function ExerciseForm({ initial, onSave, onCancel, saving }) {
  const [mode, setMode] = useState(initial ? 'custom' : 'library')
  const [data, setData] = useState(initial || { name: '', sets: '3', reps: '10', weight: '', duration: '', notes: '', targets: [] })
  const set = (k, v) => setData(p => ({ ...p, [k]: v }))

  const [library, setLibrary] = useState([])
  const [libLoading, setLibLoading] = useState(false)
  const [libSearch, setLibSearch] = useState('')
  const [libCategory, setLibCategory] = useState('all')
  const [selectedLib, setSelectedLib] = useState(null)
  const [categories, setCategories] = useState([])

  useEffect(() => { if (mode === 'library') fetchLib() }, [mode])

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
    setData({ name: ex.name, sets: ex.default_sets || '3', reps: ex.default_reps || '10', weight: '', duration: '', notes: ex.instructions || '', targets: ex.muscle_groups || [] })
  }

  const filtered = library.filter(ex =>
    (libCategory === 'all' || ex.category === libCategory) &&
    (!libSearch || ex.name.toLowerCase().includes(libSearch.toLowerCase()))
  )

  return (
    <div style={{
      border: '1px solid rgba(249,115,22,0.25)',
      borderRadius: '12px',
      overflow: 'hidden',
      background: 'var(--surface)',
    }}>
      {!initial && (
        <div style={{ display: 'flex', gap: '6px', padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
          <button
            className={`lib-tab ${mode === 'library' ? 'active' : ''}`}
            onClick={() => setMode('library')}
            style={{
              padding: '5px 13px',
              borderRadius: '7px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              border: '1px solid var(--border)',
              background: mode === 'library' ? 'var(--accent)' : 'transparent',
              color: mode === 'library' ? '#fff' : 'var(--text-3)',
              transition: 'all 0.15s',
              fontFamily: 'inherit',
            }}
          >
            <BookOpen size={11} style={{ display: 'inline', marginRight: 4 }} />From Library
          </button>
          <button
            className={`lib-tab ${mode === 'custom' ? 'active' : ''}`}
            onClick={() => setMode('custom')}
            style={{
              padding: '5px 13px',
              borderRadius: '7px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              border: '1px solid var(--border)',
              background: mode === 'custom' ? 'var(--accent)' : 'transparent',
              color: mode === 'custom' ? '#fff' : 'var(--text-3)',
              transition: 'all 0.15s',
              fontFamily: 'inherit',
            }}
          >
            <Plus size={11} style={{ display: 'inline', marginRight: 4 }} />Custom
          </button>
        </div>
      )}

      {mode === 'library' && (
        <>
          <div style={{ display: 'flex', gap: '8px', padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
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
                placeholder="Search…"
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

          <div style={{ maxHeight: 200, overflowY: 'auto', padding: '6px 8px' }}>
            {libLoading
              ? <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}><Loader2 size={20} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} /></div>
              : filtered.length === 0
                ? <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-3)', padding: '18px' }}>No results</p>
                : filtered.map(ex => (
                  <div
                    key={ex.id}
                    onClick={() => pickLib(ex)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'background 0.12s',
                      background: selectedLib?.id === ex.id ? 'var(--accent)1A' : 'transparent',
                    }}
                    onMouseEnter={e => { if (selectedLib?.id !== ex.id) e.currentTarget.style.background = 'var(--surface-3)' }}
                    onMouseLeave={e => { if (selectedLib?.id !== ex.id) e.currentTarget.style.background = 'transparent' }}
                  >
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: 7,
                      background: selectedLib?.id === ex.id ? 'var(--accent)' : 'var(--surface-2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'background 0.12s',
                    }}>
                      <Dumbbell size={13} color={selectedLib?.id === ex.id ? '#fff' : 'var(--text-3)'} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ex.name}</p>
                      {ex.category && <span style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: 700 }}>{ex.category}</span>}
                    </div>
                    {ex.default_sets && <span style={{ fontSize: '10px', color: 'var(--text-3)' }}>{ex.default_sets}×{ex.default_reps}</span>}
                    {selectedLib?.id === ex.id && <Check size={13} color="var(--accent)" />}
                  </div>
                ))
            }
          </div>

          {selectedLib && (
            <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="fields-grid">
                {fields.map(([k, l]) => (
                  <div key={k}>
                    <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>{l}</label>
                    <input
                      className="form-input"
                      style={{ fontSize: '12px', padding: '7px 10px' }}
                      value={data[k] || ''}
                      onChange={e => set(k, e.target.value)}
                      placeholder="—"
                    />
                  </div>
                ))}
              </div>
              <MuscleSelector selected={data.targets || []} onChange={v => set('targets', v)} />
              <div>
                <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>Notes</label>
                <input
                  className="form-input"
                  style={{ fontSize: '12px' }}
                  value={data.notes || ''}
                  onChange={e => set('notes', e.target.value)}
                  placeholder="Coaching notes…"
                />
              </div>
            </div>
          )}
        </>
      )}

      {mode === 'custom' && (
        <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>Exercise Name *</label>
            <input
              className="form-input"
              value={data.name}
              onChange={e => set('name', e.target.value)}
              placeholder="e.g., Barbell Squat"
            />
          </div>
          <div className="fields-grid">
            {fields.map(([k, l]) => (
              <div key={k}>
                <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>{l}</label>
                <input
                  className="form-input"
                  value={data[k] || ''}
                  onChange={e => set(k, e.target.value)}
                  placeholder="—"
                />
              </div>
            ))}
          </div>
          <MuscleSelector selected={data.targets || []} onChange={v => set('targets', v)} />
          <div>
            <label style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>Notes</label>
            <input
              className="form-input"
              value={data.notes || ''}
              onChange={e => set('notes', e.target.value)}
              placeholder="Optional coaching notes…"
            />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, padding: '12px 14px', borderTop: '1px solid var(--border)' }}>
        <button
          className="btn-primary"
          style={{
            padding: '6px 14px',
            fontSize: '12px',
            background: '#FF5A1F !important',
            backgroundColor: '#FF5A1F !important',
            color: '#FFFFFF !important',
            border: 'none !important',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            borderRadius: '8px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'opacity 0.15s',
          }}
          disabled={saving || (mode === 'library' ? !selectedLib : !data.name.trim())}
          onClick={() => onSave({ ...data, is_custom: mode === 'custom' })}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={13} />}
          {initial ? 'Save Changes' : 'Add Exercise'}
        </button>
        <button
          className="btn-secondary"
          style={{
            padding: '6px 14px',
            fontSize: '12px',
            background: 'transparent !important',
            color: 'var(--text-2) !important',
            border: '1px solid var(--border) !important',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onClick={onCancel}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--text)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}