// frontend/src/pages/PendingApproval.jsx

import { Clock, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

export default function PendingApproval() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#14110F',
      padding: '24px',
      boxSizing: 'border-box',
    }}>
      <div style={{
        maxWidth: '440px',
        width: '100%',
        textAlign: 'center',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '40px 32px',
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '14px',
          background: 'rgba(245, 158, 11, 0.14)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <Clock size={26} color="#f59e0b" />
        </div>

        <h1 style={{
          fontSize: '22px',
          fontWeight: 800,
          color: '#fafafa',
          margin: '0 0 10px',
          letterSpacing: '-0.01em',
        }}>
          Account Pending Approval
        </h1>

        <p style={{
          fontSize: '14px',
          color: '#9a979c',
          lineHeight: 1.6,
          margin: '0 0 4px',
        }}>
          {user?.name ? `Hey ${user.name}, ` : ''}thanks for signing up! Your account is currently
          being reviewed by our team.
        </p>
        <p style={{
          fontSize: '14px',
          color: '#9a979c',
          lineHeight: 1.6,
          margin: '0 0 28px',
        }}>
          You'll be able to access your dashboard as soon as an admin activates your account.
          This usually doesn't take long.
        </p>

        <button
          onClick={handleLogout}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'transparent',
            color: '#d4d2d6',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <LogOut size={15} />
          Log out
        </button>
      </div>
    </div>
  )
}