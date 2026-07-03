// frontend/src/pages/coach/availability/utils/helpers.js

export const pad = n => String(n).padStart(2, '0')

export const toDateStr = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const today = () => { const d = new Date(); d.setHours(0,0,0,0); return d }

export const isSameDay = (a, b) => toDateStr(a) === toDateStr(b)

export const parseDate = (str) => new Date(str + 'T00:00:00')

export const calcSlots = (start, end) => {
  if (!start || !end) return 0
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return Math.max(0, Math.floor(((eh * 60 + em) - (sh * 60 + sm)) / 60))
}

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']