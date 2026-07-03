import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      
      setAuth: (token, user) => {
        localStorage.setItem('access_token', token)
        localStorage.setItem('user', JSON.stringify(user))
        set({ 
          token, 
          user, 
          isAuthenticated: true 
        })
      },
      
      logout: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('user')
        set({ 
          token: null, 
          user: null, 
          isAuthenticated: false 
        })
      },
    }),
    {
      name: 'auth-storage',
      // This will automatically rehydrate the state from localStorage
    }
  )
)