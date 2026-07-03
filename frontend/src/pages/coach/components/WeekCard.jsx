// frontend/src/pages/coach/components/WeekCard.jsx
import { ChevronDown, Plus, Trash2, X, Loader2 } from 'lucide-react'

export default function WeekCard({ week, isOpen, onToggle, onDelete, onSelectDay, selectedDayId, addingDayWeekId, setAddingDayWeekId, selectedDayName, setSelectedDayName, savingDay, addDay, availDays }) {
  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: '12px',
      marginBottom: '10px',
      overflow: 'hidden',
      transition: 'border-color 0.15s, box-shadow 0.15s',
      background: 'var(--surface)',
      width: '100%',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.borderColor = 'rgba(249,115,22,0.3)'
      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)'
    }}
    onMouseLeave={e => {
      e.currentTarget.style.borderColor = 'var(--border)'
      e.currentTarget.style.boxShadow = 'none'
    }}
    >
      {/* Week Header */}
      <div
        onClick={() => onToggle(week.id)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '14px 16px',
          cursor: 'pointer',
          transition: 'background 0.12s',
          background: isOpen ? 'var(--accent)0D' : 'transparent',
          width: '100%',
        }}
        onMouseEnter={e => {
          if (!isOpen) e.currentTarget.style.background = 'var(--surface-2)'
        }}
        onMouseLeave={e => {
          if (!isOpen) e.currentTarget.style.background = 'transparent'
        }}
      >
        <div style={{
          width: 32,
          height: 32,
          borderRadius: '8px',
          background: isOpen ? 'var(--accent)' : 'var(--accent)1A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '10px',
          fontWeight: 800,
          color: isOpen ? '#fff' : 'var(--accent)',
          flexShrink: 0,
          transition: 'all 0.15s',
        }}>
          W{week.week_number}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>
              Week {week.week_number}
            </span>
            {week.focus && week.focus.toLowerCase() !== `week ${week.week_number}`.toLowerCase() && (
              <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>· {week.focus}</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-3)' }}>
              {week.days?.length || 0} day{week.days?.length !== 1 ? 's' : ''}
            </span>
            {week.days && week.days.length > 0 && (
              <>
                <span style={{ fontSize: '10px', color: 'var(--text-3)' }}>·</span>
                <span style={{ fontSize: '10px', color: 'var(--text-3)' }}>
                  {week.days.reduce((sum, d) => sum + (d.exercises?.length || 0), 0)} exercise{week.days.reduce((sum, d) => sum + (d.exercises?.length || 0), 0) !== 1 ? 's' : ''}
                </span>
              </>
            )}
          </div>
        </div>

        <button
          onClick={e => onDelete(week.id, e)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-3)',
            padding: '4px',
            display: 'flex',
            borderRadius: '6px',
            transition: 'all 0.12s',
            opacity: 0.5,
            flexShrink: 0,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.opacity = '1'
            e.currentTarget.style.background = 'rgba(242,89,89,0.1)'
            e.currentTarget.style.color = 'var(--red)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.opacity = '0.5'
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--text-3)'
          }}
        >
          <Trash2 size={14} />
        </button>

        <ChevronDown size={16} color="var(--text-3)" style={{
          transition: 'transform 0.2s',
          transform: isOpen ? 'rotate(180deg)' : 'none',
          flexShrink: 0,
        }} />
      </div>

      {/* Week Content (Days) */}
      {isOpen && (
        <div style={{
          padding: '4px 12px 12px 12px',
          borderTop: '1px solid var(--border)',
          width: '100%',
        }}>
          {week.days?.map(day => {
            const isSelected = selectedDayId === day.id
            const exCount = day.exercises?.length || 0

            return (
              <div
                key={day.id}
                onClick={() => onSelectDay(day.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.12s',
                  background: isSelected ? 'var(--accent)1A' : 'transparent',
                  border: `1px solid ${isSelected ? 'var(--accent)' : 'transparent'}`,
                  marginTop: '6px',
                  width: '100%',
                }}
                onMouseEnter={e => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'var(--surface-2)'
                    e.currentTarget.style.borderColor = 'var(--border)'
                  }
                }}
                onMouseLeave={e => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.borderColor = 'transparent'
                  }
                }}
              >
                {day.is_rest_day
                  ? <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--blue)', flexShrink: 0 }} />
                  : <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />}

                <span style={{
                  fontSize: '13px',
                  fontWeight: isSelected ? 700 : 500,
                  color: isSelected ? 'var(--accent)' : 'var(--text-2)',
                  flex: 1,
                }}>
                  {day.day_of_week}
                </span>

                {day.is_rest_day ? (
                  <span style={{
                    fontSize: '9px',
                    color: 'var(--blue)',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'var(--blue)14',
                    flexShrink: 0,
                  }}>
                    REST
                  </span>
                ) : exCount > 0 ? (
                  <span style={{
                    fontSize: '10px',
                    color: 'var(--text-3)',
                    fontWeight: 600,
                    flexShrink: 0,
                  }}>
                    {exCount} {exCount === 1 ? 'ex' : 'exs'}
                  </span>
                ) : null}
              </div>
            )
          })}

          {/* Add Day Button */}
          {addingDayWeekId === week.id ? (
            <div style={{
              display: 'flex',
              gap: 5,
              marginTop: 8,
              padding: '4px 0',
              width: '100%',
            }}>
              <select
                className="form-input"
                style={{
                  fontSize: '12px',
                  padding: '6px 10px',
                  flex: 1,
                }}
                value={selectedDayName}
                onChange={e => setSelectedDayName(e.target.value)}
              >
                <option value="">Select day…</option>
                {availDays.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <button
                onClick={() => addDay(week.id)}
                disabled={!selectedDayName || savingDay}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#FF5A1F',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'opacity 0.15s',
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                {savingDay ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : 'Add'}
              </button>
              <button
                onClick={() => { setAddingDayWeekId(null); setSelectedDayName('') }}
                style={{
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--text-3)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={14} />
              </button>
            </div>
          ) : availDays.length > 0 ? (
            <button
              onClick={() => setAddingDayWeekId(week.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 12px',
                marginTop: 6,
                background: 'transparent',
                border: '1px dashed var(--border)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '12px',
                color: 'var(--text-3)',
                width: '100%',
                fontFamily: 'inherit',
                transition: 'all 0.12s',
                justifyContent: 'center',
              }}
              onMouseOver={e => {
                e.currentTarget.style.borderColor = 'var(--accent)'
                e.currentTarget.style.color = 'var(--accent)'
              }}
              onMouseOut={e => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.color = 'var(--text-3)'
              }}
            >
              <Plus size={12} /> Add day
            </button>
          ) : null}
        </div>
      )}
    </div>
  )
}