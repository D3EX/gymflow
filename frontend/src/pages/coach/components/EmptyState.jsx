// frontend/src/pages/coach/components/EmptyState.jsx
export default function EmptyState({ icon: Icon, title, description, action, actionLabel }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '60px 20px',
      background: 'var(--surface)',
      borderRadius: '16px',
      border: '1px dashed var(--border)',
    }}>
      <Icon size={48} color="var(--text-3)" style={{ margin: '0 auto 12px', opacity: 0.4 }} />
      <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-2)' }}>{title}</p>
      <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>{description}</p>
      {action && actionLabel && (
        <button
          onClick={action}
          className="btn-primary"
          style={{
            marginTop: '16px',
            background: '#FF5A1F !important',
            backgroundColor: '#FF5A1F !important',
            color: '#FFFFFF !important',
            border: 'none !important',
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}