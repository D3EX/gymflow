// frontend/src/pages/coach/availability/components/StatsCards.jsx

import React from 'react'
import { Check, Calendar, Users, Zap, Coffee } from 'lucide-react'
import { calcSlots } from '../utils/helpers'

export function StatsCards({ openDays, overrideCount, totalBreaks, totalBookings, availability }) {
  const totalSlots = availability.filter(a => a.is_available).reduce((s, a) => s + calcSlots(a.start_time, a.end_time), 0)

  const stats = [
    { label: 'Open Days',  value: `${openDays}/7`, icon: Check,    color: 'var(--accent)', bg: 'rgba(249,115,22,0.12)' },
    { label: 'Overrides',  value: overrideCount,   icon: Calendar,  color: 'var(--blue)',   bg: 'rgba(77,158,245,0.12)' },
    { label: 'Breaks',     value: totalBreaks,      icon: Coffee,    color: '#F59E0B',       bg: 'rgba(245,158,11,0.12)' },
    { label: 'Sessions',   value: totalBookings,    icon: Users,     color: 'var(--blue)',   bg: 'rgba(77,158,245,0.12)' },
    { label: 'Slots/wk',  value: totalSlots,       icon: Zap,       color: 'var(--accent)', bg: 'rgba(249,115,22,0.12)' },
  ]

  return (
    <div className="av-stats-row">
      {stats.map((stat, i) => (
        <div key={i} className="av-stat-card" style={{ flex: '1 1 0', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {stat.label}
            </span>
            <div style={{
              width: '26px', height: '26px', borderRadius: '7px',
              background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <stat.icon size={13} color={stat.color} />
            </div>
          </div>
          <p style={{ fontSize: '22px', fontWeight: 800, color: stat.color, margin: 0 }}>
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  )
}