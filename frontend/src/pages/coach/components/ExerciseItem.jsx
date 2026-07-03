// frontend/src/pages/coach/components/ExerciseItem.jsx
import { useState } from 'react'
import { CheckCircle, Circle, Edit2, Trash2, Loader2, X } from 'lucide-react'
import ExerciseForm from './ExerciseForm'

const MUSCLE_LABELS = {
  chest: 'Chest', shoulders: 'Shoulders', back: 'Back',
  biceps: 'Biceps', triceps: 'Triceps', core: 'Core',
  legs: 'Legs', glutes: 'Glutes'
}

export default function ExerciseItem({ ex, onDelete, onToggle, onEdit, isToggling }) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  return (
    <>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '14px 16px',
        borderRadius: '12px',
        border: '1px solid var(--border)',
        background: ex.done ? 'var(--green)0D' : 'var(--surface)',
        marginBottom: '8px',
        transition: 'border-color 0.15s, opacity 0.2s',
        opacity: isToggling ? 0.6 : 1,
        pointerEvents: isToggling ? 'none' : 'auto',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(249,115,22,0.3)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
      >
        <button
          onClick={() => onToggle(ex.id)}
          disabled={isToggling}
          style={{
            background: 'none',
            border: 'none',
            cursor: isToggling ? 'default' : 'pointer',
            padding: 0,
            flexShrink: 0,
            color: ex.done ? 'var(--green)' : 'var(--border)',
            transition: 'color 0.15s',
            position: 'relative',
            width: 18,
            height: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isToggling ? (
            <Loader2 size={16} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
          ) : ex.done ? (
            <CheckCircle size={18} />
          ) : (
            <Circle size={18} />
          )}
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            margin: 0,
            fontSize: '13px',
            fontWeight: 650,
            color: ex.done ? 'var(--text-3)' : 'var(--text)',
            textDecoration: ex.done ? 'line-through' : 'none',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            transition: 'color 0.15s',
          }}>
            {ex.name}
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
            {ex.sets && <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>{ex.sets} sets</span>}
            {ex.reps && <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>{ex.reps} reps</span>}
            {ex.weight && <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>{ex.weight} kg</span>}
            {ex.duration && <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>{ex.duration} min</span>}
            {(ex.targets || []).map(t => (
              <span key={t} style={{
                fontSize: '9px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '4px',
                background: 'var(--accent)1A',
                color: 'var(--accent-light)',
                border: '1px solid rgba(249,115,22,0.28)',
                letterSpacing: '0.03em',
              }}>
                {MUSCLE_LABELS[t] || t}
              </span>
            ))}
            {ex.notes && (
              <span style={{ fontSize: '11px', color: 'var(--text-3)', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>{ex.notes}</span>
            )}
          </div>
        </div>

        <button
          onClick={() => setEditing(true)}
          disabled={isToggling}
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            background: 'var(--surface-3)',
            color: 'var(--text-3)',
            cursor: isToggling ? 'default' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
            flexShrink: 0,
            opacity: isToggling ? 0.4 : 1,
          }}
          onMouseEnter={e => { if (!isToggling) { e.currentTarget.style.borderColor = 'var(--text-2)'; e.currentTarget.style.color = 'var(--text)' } }}
          onMouseLeave={e => { if (!isToggling) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-3)' } }}
        >
          <Edit2 size={13} />
        </button>

        <button
          onClick={() => onDelete(ex.id)}
          disabled={isToggling}
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            background: 'var(--surface-3)',
            color: 'var(--text-3)',
            cursor: isToggling ? 'default' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
            flexShrink: 0,
            opacity: isToggling ? 0.4 : 1,
          }}
          onMouseEnter={e => { if (!isToggling) { e.currentTarget.style.borderColor = 'rgba(242,89,89,0.5)'; e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.background = 'rgba(242,89,89,0.1)' } }}
          onMouseLeave={e => { if (!isToggling) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.background = 'var(--surface-3)' } }}
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Edit Exercise Modal */}
      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(false)}>
          <div className="modal-box" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
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
                <Edit2 size={18} color="var(--accent)" />
                Edit Exercise
              </h3>
              <button
                onClick={() => setEditing(false)}
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
            <div className="modal-body" style={{ padding: '20px' }}>
              <ExerciseForm
                initial={{ 
                  name: ex.name, 
                  sets: ex.sets || '', 
                  reps: ex.reps || '', 
                  weight: ex.weight || '', 
                  duration: ex.duration || '', 
                  notes: ex.notes || '', 
                  targets: ex.targets || [] 
                }}
                onSave={async (d) => { 
                  setSaving(true); 
                  await onEdit(ex.id, d); 
                  setSaving(false); 
                  setEditing(false) 
                }}
                onCancel={() => setEditing(false)}
                saving={saving}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}