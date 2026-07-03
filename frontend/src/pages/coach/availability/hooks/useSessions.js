// frontend/src/pages/coach/availability/hooks/useSessions.js

import { useState, useCallback, useRef, useEffect } from 'react'
import api from '@api/client'
import { toDateStr } from '../utils/helpers'

export function useSessions() {
  const [daySessionsMap, setDaySessionsMap] = useState({})
  const [fetchingDates, setFetchingDates] = useState(new Set())
  const abortControllers = useRef({})
  const fetchedDatesRef = useRef(new Set()) // Track which dates have been fetched

  const fetchSessionsForDate = useCallback(async (date, force = false) => {
    const dateStr = toDateStr(date)
    
    // If already fetched and not forcing refresh, skip
    if (!force && fetchedDatesRef.current.has(dateStr)) {
      return
    }
    
    // Don't fetch if already fetching
    if (fetchingDates.has(dateStr)) return
    
    // Cancel any pending request for this date
    if (abortControllers.current[dateStr]) {
      abortControllers.current[dateStr].abort()
      delete abortControllers.current[dateStr]
    }
    
    // Create new abort controller
    const controller = new AbortController()
    abortControllers.current[dateStr] = controller
    
    setFetchingDates(prev => new Set([...prev, dateStr]))
    
    try {
      const res = await api.get(`/personal-sessions/coach/booked/admin/${dateStr}`, {
        signal: controller.signal
      })
      setDaySessionsMap(prev => ({ ...prev, [dateStr]: res.data || [] }))
      fetchedDatesRef.current.add(dateStr) // Mark as fetched
    } catch (error) {
      // Don't update state if request was aborted
      if (error.name === 'AbortError') {
        console.log('Request aborted for:', dateStr)
        return
      }
      console.error('Error fetching sessions for date:', dateStr, error)
      setDaySessionsMap(prev => ({ ...prev, [dateStr]: [] }))
      fetchedDatesRef.current.add(dateStr) // Mark as fetched even on error
    } finally {
      setFetchingDates(prev => {
        const newSet = new Set(prev)
        newSet.delete(dateStr)
        return newSet
      })
      delete abortControllers.current[dateStr]
    }
  }, [fetchingDates])

  const cancelSession = useCallback(async (sessionId) => {
    await api.put(`/personal-sessions/${sessionId}/cancel`)
  }, [])

  const approveSession = useCallback(async (sessionId) => {
    await api.put(`/personal-sessions/coach/sessions/${sessionId}/approve`)
  }, [])

  const rejectSession = useCallback(async (sessionId, reason) => {
    await api.put(`/personal-sessions/coach/sessions/${sessionId}/reject`, { reason })
  }, [])

  const completeSession = useCallback(async (sessionId) => {
    await api.put(`/personal-sessions/coach/sessions/${sessionId}/complete`)
  }, [])

  const refreshDate = useCallback((date) => {
    const dateStr = toDateStr(date)
    // Remove from fetched set to force refresh
    fetchedDatesRef.current.delete(dateStr)
    // Cancel any pending request
    if (abortControllers.current[dateStr]) {
      abortControllers.current[dateStr].abort()
      delete abortControllers.current[dateStr]
    }
    // Clear the cached data
    setDaySessionsMap(prev => {
      const updated = { ...prev }
      delete updated[dateStr]
      return updated
    })
    // Fetch again with force=true
    fetchSessionsForDate(date, true)
  }, [fetchSessionsForDate])

  // Clear fetched dates when month changes (optional)
  const clearFetchedCache = useCallback(() => {
    fetchedDatesRef.current.clear()
  }, [])

  return {
    daySessionsMap,
    fetchingDates,
    fetchSessionsForDate,
    cancelSession,
    approveSession,
    rejectSession,
    completeSession,
    refreshDate,
    clearFetchedCache,
  }
}