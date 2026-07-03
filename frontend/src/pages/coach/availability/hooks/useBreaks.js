// frontend/src/pages/coach/availability/hooks/useBreaks.js

import { useState, useCallback } from 'react'
import api from '@api/client'
import { toDateStr } from '../utils/helpers'

export function useBreaks() {
  const [breaks, setBreaks] = useState([])

  const fetchBreaks = useCallback(async () => {
    try {
      const res = await api.get('/personal-sessions/coach/breaks')
      setBreaks(res.data || [])
    } catch (error) {
      console.error('Error fetching breaks:', error)
      setBreaks([])
    }
  }, [])

  const getBreaksForDate = useCallback((date) => {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' })
    const dateStr = toDateStr(date)
    
    const recurring = breaks.filter(b => 
      b.is_recurring && b.day_of_week === dayName && b.is_active !== false
    )
    const oneTime = breaks.filter(b => 
      !b.is_recurring && b.date === dateStr && b.is_active !== false
    )
    
    return [...recurring, ...oneTime]
  }, [breaks])

  const createBreak = useCallback(async (data) => {
    const payload = {
      day_of_week: data.day_of_week,
      start_time: data.start_time,
      end_time: data.end_time,
      is_recurring: data.is_recurring,
      date: data.is_recurring ? null : data.date
    }
    const res = await api.post('/personal-sessions/coach/breaks', payload)
    return res.data
  }, [])

  const updateBreak = useCallback(async (id, data) => {
    await api.put(`/personal-sessions/coach/breaks/${id}`, {
      start_time: data.start_time,
      end_time: data.end_time,
      is_active: true
    })
  }, [])

  const deleteBreak = useCallback(async (id) => {
    await api.delete(`/personal-sessions/coach/breaks/${id}`)
  }, [])

  return {
    breaks,
    fetchBreaks,
    getBreaksForDate,
    createBreak,
    updateBreak,
    deleteBreak,
  }
}