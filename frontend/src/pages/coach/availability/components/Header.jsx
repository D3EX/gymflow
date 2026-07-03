// frontend/src/pages/coach/availability/components/Header.jsx

import React from 'react'
import { Edit2 } from 'lucide-react'

export function Header() {
  return (
    <div style={{ marginBottom: '22px' }}>
      <p style={{ fontSize: '11px', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, marginBottom: '6px' }}>
        Coach Portal · Schedule
      </p>
      <div>
        <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em', margin: 0, color: 'var(--text)' }}>
          My Availability
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>
          Click a date to view sessions · Click <Edit2 size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> to edit availability
        </p>
      </div>
    </div>
  )
}