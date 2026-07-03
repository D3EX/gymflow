// frontend/src/pages/coach/availability/components/Calendar.jsx

import React from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'

export function Calendar({
  currentMonth,
  calendarDays,
  selectedDate,
  onMonthChange,
  onDateClick,
}) {
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  // Get today's date for comparison
  const today = new Date()
  const todayStr = today.toDateString()

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '16px',
      padding: '20px 20px 16px',
      width: '100%',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      {/* ─── Header ─── */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: '18px',
      }}>
        <button
          onClick={() => onMonthChange(currentMonth.getMonth() - 1)}
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--text-2)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#C56A2A'
            e.currentTarget.style.color = '#C56A2A'
            e.currentTarget.style.background = 'rgba(255, 90, 31, 0.06)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--border)'
            e.currentTarget.style.color = 'var(--text-2)'
            e.currentTarget.style.background = 'transparent'
          }}
        >
          <ChevronLeft size={18} />
        </button>

        <span style={{ 
          fontSize: '15px', 
          fontWeight: 600, 
          color: 'var(--text)',
          letterSpacing: '0.01em',
        }}>
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </span>

        <button
          onClick={() => onMonthChange(currentMonth.getMonth() + 1)}
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--text-2)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#C56A2A'
            e.currentTarget.style.color = '#C56A2A'
            e.currentTarget.style.background = 'rgba(255, 90, 31, 0.06)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--border)'
            e.currentTarget.style.color = 'var(--text-2)'
            e.currentTarget.style.background = 'transparent'
          }}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* ─── Day Headers ─── */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(7, 1fr)', 
        gap: '4px',
        marginBottom: '8px',
      }}>
        {dayNames.map(d => (
          <div key={d} style={{
            textAlign: 'center',
            fontSize: '10px',
            fontWeight: 600,
            color: 'var(--text-3)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            padding: '4px 0',
          }}>
            {d}
          </div>
        ))}
      </div>

      {/* ─── Days Grid ─── */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(7, 1fr)', 
        gap: '4px',
      }}>
        {calendarDays.map((cell, index) => {
          if (!cell) {
            return <div key={`empty-${index}`} style={{ aspectRatio: '1' }} />
          }

          const isToday = cell.dateStr === todayStr
          const isSelected = cell.isSelected
          const isPast = cell.isPast
          const isAvailable = cell.isOpen
          const hasBookings = cell.hasBookings
          const bookingCount = cell.bookingCount
          const hasBreaks = cell.hasBreaks
          const isOverride = cell.isOverride

          // Determine cell style
          let bgColor = 'transparent'
          let textColor = isPast ? 'var(--text-3)' : 'var(--text)'
          let borderColor = 'transparent'
          let fontWeight = 500

          if (isSelected) {
            bgColor = '#C56A2A'
            textColor = '#FFFFFF'
            fontWeight = 600
          } else if (isToday && !isPast) {
            bgColor = 'rgba(255, 90, 31, 0.08)'
            borderColor = 'rgba(255, 90, 31, 0.3)'
            fontWeight = 600
          } else if (!isPast && isAvailable) {
            bgColor = 'rgba(255, 90, 31, 0.03)'
          }

          return (
            <button
              key={cell.dateStr}
              onClick={() => !isPast && onDateClick(cell.date)}
              disabled={isPast}
              style={{
                position: 'relative',
                aspectRatio: '1',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                border: `1.5px solid ${borderColor}`,
                background: bgColor,
                color: textColor,
                fontWeight: fontWeight,
                fontSize: '14px',
                cursor: isPast ? 'default' : 'pointer',
                opacity: isPast ? 0.35 : 1,
                transition: 'all 0.15s ease',
                fontFamily: 'inherit',
                padding: '2px',
              }}
              onMouseEnter={e => {
                if (!isPast && !isSelected) {
                  e.currentTarget.style.borderColor = 'rgba(255, 90, 31, 0.4)'
                  e.currentTarget.style.background = isToday 
                    ? 'rgba(255, 90, 31, 0.15)' 
                    : 'rgba(255, 90, 31, 0.08)'
                }
              }}
              onMouseLeave={e => {
                if (!isPast && !isSelected) {
                  e.currentTarget.style.borderColor = isToday 
                    ? 'rgba(255, 90, 31, 0.3)' 
                    : 'transparent'
                  e.currentTarget.style.background = isToday 
                    ? 'rgba(255, 90, 31, 0.08)' 
                    : (isAvailable ? 'rgba(255, 90, 31, 0.03)' : 'transparent')
                }
              }}
            >
              {/* ─── Day Number ─── */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '24px',
                width: '100%',
              }}>
                <span style={{
                  fontSize: isSelected ? '15px' : '14px',
                  fontWeight: isSelected ? 700 : 500,
                  lineHeight: 1,
                }}>
                  {cell.d}
                </span>
              </div>

              {/* ─── Status Indicators ─── */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                height: '16px',
                width: '100%',
              }}>
                {!isPast && !isSelected && (
                  <>
                    {hasBookings && (
                      <span style={{
                        background: '#C56A2A',
                        color: '#fff',
                        fontSize: '7px',
                        fontWeight: 700,
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        lineHeight: 1,
                      }}>
                        {bookingCount}
                      </span>
                    )}
                    {hasBreaks && !hasBookings && (
                      <div style={{
                        width: '5px',
                        height: '5px',
                        borderRadius: '50%',
                        background: '#F59E0B',
                      }} />
                    )}
                    {isOverride && !hasBookings && !hasBreaks && (
                      <div style={{
                        width: '5px',
                        height: '5px',
                        borderRadius: '50%',
                        background: '#4D9EF5',
                      }} />
                    )}
                    {!hasBookings && !hasBreaks && !isOverride && isAvailable && (
                      <div style={{
                        width: '5px',
                        height: '5px',
                        borderRadius: '50%',
                        background: '#C56A2A',
                        opacity: 0.4,
                      }} />
                    )}
                  </>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* ─── Legend ─── */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '14px',
        flexWrap: 'wrap',
        paddingTop: '14px',
        marginTop: '14px',
        borderTop: '1px solid var(--border)',
      }}>
        {[
          { color: '#C56A2A', label: 'Available' },
          { color: 'var(--border)', label: 'Closed' },
          { color: '#C56A2A', shape: 'circle', label: 'Bookings' },
          { color: '#4D9EF5', shape: 'dot', label: 'Override' },
          { color: '#F59E0B', shape: 'dot', label: 'Break' },
        ].map((item, idx) => {
          let icon
          if (item.shape === 'circle') {
            icon = (
              <span style={{
                background: '#C56A2A',
                color: '#fff',
                fontSize: '7px',
                fontWeight: 700,
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                2
              </span>
            )
          } else if (item.shape === 'dot') {
            icon = (
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: item.color,
              }} />
            )
          } else {
            icon = (
              <div style={{
                width: '14px',
                height: '14px',
                borderRadius: '3px',
                background: item.color,
              }} />
            )
          }
          return (
            <span key={idx} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '9px',
              fontWeight: 500,
              color: 'var(--text-3)',
            }}>
              {icon}
              {item.label}
            </span>
          )
        })}
      </div>
    </div>
  )
}