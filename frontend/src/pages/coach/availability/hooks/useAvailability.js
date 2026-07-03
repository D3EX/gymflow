// frontend/src/pages/coach/availability/hooks/useAvailability.js

import { useState, useEffect, useCallback } from 'react'
import api from '@api/client'
import toast from 'react-hot-toast'
import { toDateStr } from '../utils/helpers'

export function useAvailability() {
  const [availability, setAvailability] = useState([])
  const [loading, setLoading] = useState(true)
  const [dateOverrides, setDateOverrides] = useState({})

  const fetchAvailability = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/coach/availability')
      setAvailability(res.data || [])
    } catch {
      toast.error('Failed to load availability')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchDateOverrides = useCallback(async () => {
    try {
      const res = await api.get('/personal-sessions/coach/availability/overrides')
      const overrides = {}
      res.data.forEach(item => {
        overrides[item.date] = item
      })
      setDateOverrides(overrides)
    } catch (error) {
      console.error('Error fetching overrides:', error)
    }
  }, [])

  const getDayAvail = useCallback((day) => {
    return availability.find(a => a.day_of_week === day)
  }, [availability])

  const getDateAvail = useCallback((date) => {
    const dateStr = toDateStr(date)
    if (dateOverrides[dateStr]) {
      return dateOverrides[dateStr]
    }
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' })
    return getDayAvail(dayName)
  }, [dateOverrides, getDayAvail])

  const createOverride = useCallback(async (date, start_time, end_time, is_available) => {
    const dateStr = toDateStr(date)
    const payload = {
      coach_id: 1,
      date: dateStr,
      start_time,
      end_time,
      is_available,
    }
    await api.post('/personal-sessions/coach/availability/date', payload)
  }, [])

  const updateOverride = useCallback(async (id, start_time, end_time, is_available) => {
    await api.put(`/personal-sessions/coach/availability/date/${id}`, {
      start_time,
      end_time,
      is_available,
    })
  }, [])

  const deleteOverride = useCallback(async (id) => {
    await api.delete(`/personal-sessions/coach/availability/date/${id}`)
  }, [])

  const fetchAllData = useCallback(async () => {
    await fetchAvailability()
    await fetchDateOverrides()
  }, [fetchAvailability, fetchDateOverrides])

  useEffect(() => {
    fetchAllData()
  }, [])

  return {
    availability,
    loading,
    dateOverrides,
    getDayAvail,
    getDateAvail,
    createOverride,
    updateOverride,
    deleteOverride,
    fetchAllData,
    fetchAvailability,
    fetchDateOverrides,
    setLoading,
  }
}