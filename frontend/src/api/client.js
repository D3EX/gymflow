// frontend/src/api/client.js

import axios from 'axios'

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  // Try multiple ways to get the token
  
  // 1. Check localStorage for access_token directly
  let token = localStorage.getItem('access_token')
  
  // 2. If not found, try auth-storage (Zustand persist)
  if (!token) {
    const authStorage = localStorage.getItem('auth-storage')
    if (authStorage) {
      try {
        const parsed = JSON.parse(authStorage)
        // Check different possible paths
        if (parsed.state?.token) {
          token = parsed.state.token
        } else if (parsed.token) {
          token = parsed.token
        } else if (parsed.state?.access_token) {
          token = parsed.state.access_token
        }
      } catch (e) {
        console.error('Failed to parse auth storage:', e)
      }
    }
  }
  
  // 3. If token found, add to headers
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
    console.log('✅ Token added to request:', config.url)
  } else {
    console.log('❌ No token found for request:', config.url)
  }
  
  return config
})

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, response.config.url)
    return response
  },
  (error) => {
    console.error('❌ API Error:', error.response?.status, error.response?.data)
    
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('auth-storage')
      // Redirect to login if not already there
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api