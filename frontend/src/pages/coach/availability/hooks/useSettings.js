// frontend/src/pages/coach/availability/hooks/useSettings.js

import { useState, useCallback } from 'react'
import api from '@api/client'


export function useSettings() {
  const [settings, setSettings] = useState(null)

  const fetchSettings = useCallback(async () => {
    try {
      const res = await api.get('/personal-sessions/coach/settings')
      setSettings(res.data)
      return res.data
    } catch (error) {
      console.error('Error fetching settings:', error)
      setSettings(null)
      return null
    }
  }, [])

  const updateSettings = useCallback(async (data) => {
    const res = await api.put('/personal-sessions/coach/settings', data)
    setSettings(res.data)
    return res.data
  }, [])

  return {
    settings,
    fetchSettings,
    updateSettings,
  }
}