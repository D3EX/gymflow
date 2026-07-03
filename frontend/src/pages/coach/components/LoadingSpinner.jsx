// frontend/src/pages/coach/components/LoadingSpinner.jsx
import { Loader2 } from 'lucide-react'

export default function LoadingSpinner() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '14px',
      padding: '60px 20px',
      minHeight: '50vh',
    }}>
      <Loader2 size={32} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <span style={{ color: 'var(--text-3)', fontSize: '13px', fontWeight: 600 }}>Loading programs…</span>
    </div>
  )
}