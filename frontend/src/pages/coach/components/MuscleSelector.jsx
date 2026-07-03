// frontend/src/pages/coach/components/MuscleSelector.jsx
import { X } from 'lucide-react'

const MUSCLE_GROUPS = ['chest', 'shoulders', 'back', 'biceps', 'triceps', 'core', 'legs', 'glutes']
const MUSCLE_LABELS = {
  chest: 'Chest', shoulders: 'Shoulders', back: 'Back',
  biceps: 'Biceps', triceps: 'Triceps', core: 'Core',
  legs: 'Legs', glutes: 'Glutes'
}

export default function MuscleSelector({ selected, onChange }) {
  return (
    <div>
      <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>
        Muscle Groups
      </label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {MUSCLE_GROUPS.map(m => (
          <button
            key={m}
            type="button"
            onClick={() => onChange(selected.includes(m) ? selected.filter(x => x !== m) : [...selected, m])}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '10px',
              fontWeight: 700,
              border: `1px solid ${selected.includes(m) ? 'var(--accent)' : 'var(--border)'}`,
              background: selected.includes(m) ? 'var(--accent)1A' : 'var(--surface-2)',
              color: selected.includes(m) ? 'var(--accent)' : 'var(--text-3)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              fontFamily: 'inherit',
              letterSpacing: '0.03em',
            }}
          >
            {MUSCLE_LABELS[m]}
            {selected.includes(m) && <X size={9} />}
          </button>
        ))}
      </div>
    </div>
  )
}