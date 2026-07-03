// frontend/src/pages/member/Membership.jsx

import { useEffect, useState } from 'react'
import api from '../../api/client'
import { Crown, Calendar, CheckCircle, Clock, Star, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

function DaysLeftRing({ daysLeft, totalDays = 30 }) {
  const pct = Math.max(0, Math.min(1, daysLeft / totalDays))
  const r = 28
  const circ = 2 * Math.PI * r
  const dash = circ * pct
  const color = daysLeft <= 7 ? 'var(--red)' : daysLeft <= 14 ? 'var(--amber)' : 'var(--green)'

  return (
    <div style={{ position: 'relative', width: '72px', height: '72px', flexShrink: 0 }}>
      <svg width="72" height="72" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="36" cy="36" r={r} fill="none" stroke="var(--border)" strokeWidth="5" />
        <circle
          cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.5s ease' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '14px', fontWeight: 800, color, lineHeight: 1 }}>{daysLeft}</span>
        <span style={{ fontSize: '9px', color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>days</span>
      </div>
    </div>
  )
}

export default function MemberMembership() {
  const [loading, setLoading] = useState(true)
  const [memberData, setMemberData] = useState(null)
  const [subscriptions, setSubscriptions] = useState([])

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch member data
      const memberRes = await api.get('/members/my')
      console.log('Member Data:', memberRes.data)
      setMemberData(memberRes.data)
      
      // Fetch subscriptions - ✅ FIXED with better error handling
      try {
        const subsRes = await api.get('/subscriptions/my')
        console.log('Subscriptions:', subsRes.data)
        setSubscriptions(subsRes.data || [])
      } catch (subError) {
        // ✅ If no subscriptions, just set empty array
        console.log('No subscriptions found or error fetching:', subError.message)
        setSubscriptions([])
        // Don't show error toast for missing subscriptions
      }
      
    } catch (error) {
      console.error('Error fetching membership data:', error)
      toast.error('Failed to load membership')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date) => {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const membership = memberData?.membership
  const isActive = membership !== null && membership !== undefined
  
  const planName = membership?.plan?.name || null
  const planPrice = membership?.plan?.price || 0
  const planDescription = membership?.plan?.description || 'Full access to all facilities'
  const planDuration = membership?.plan?.duration_days || 30
  const startDate = membership?.start_date || null
  const endDate = membership?.end_date || null
  
  let daysLeft = 0
  if (endDate) {
    const end = new Date(endDate)
    const now = new Date()
    daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24))
  }
  
  const actuallyActive = isActive && daysLeft > 0

  if (loading) {
    return (
      <div style={{
        background: 'var(--bg)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '14px',
      }}>
        <Loader2 size={32} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ color: 'var(--text-3)', fontSize: '13px', fontWeight: 600 }}>Loading membership…</span>
      </div>
    )
  }

  return (
    <div style={{
      background: 'var(--bg)',
      color: 'var(--text)',
      fontFamily: "'Inter', -apple-system, sans-serif",
      padding: '2px',
      minHeight: '100vh',
      boxSizing: 'border-box',
    }}>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: '22px' }}>
        <p style={{
          fontSize: '11px',
          color: 'var(--accent)',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          fontWeight: 700,
          marginBottom: '6px',
        }}>
          Subscription
        </p>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 800,
          letterSpacing: '-0.02em',
          margin: 0,
          color: 'var(--text)',
        }}>
          My membership
        </h1>
        <p style={{
          fontSize: '13px',
          color: 'var(--text-3)',
          marginTop: '4px',
        }}>
          Manage your plan and renewal
        </p>
      </div>

      {/* Active membership */}
      {actuallyActive && planName ? (
        <div style={{
          padding: '28px',
          marginBottom: '16px',
          borderRadius: '18px',
          border: `1px solid var(--border)`,
          background: 'var(--surface-2)',
          boxShadow: 'var(--shadow-md)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'var(--green)1F',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Crown size={22} color="var(--green)" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                  <h2 style={{
                    fontSize: '20px',
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    margin: 0,
                    color: 'var(--text)',
                  }}>
                    {planName}
                  </h2>
                  <span style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: '99px',
                    background: 'var(--green)1F',
                    color: 'var(--green)',
                  }}>
                    Active
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-2)' }}>
                  {planDescription}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <DaysLeftRing daysLeft={daysLeft} totalDays={planDuration || 30} />
              <div style={{ textAlign: 'right' }}>
                <p style={{
                  fontSize: '10.5px',
                  color: 'var(--text-3)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  fontWeight: 700,
                }}>
                  Price
                </p>
                <p style={{
                  fontSize: '22px',
                  fontWeight: 800,
                  color: 'var(--accent)',
                  letterSpacing: '-0.02em',
                }}>
                  {planPrice.toLocaleString()} <span style={{ fontSize: '14px', fontWeight: 700 }}>DZD</span>
                </p>
              </div>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
            marginTop: '24px',
            paddingTop: '20px',
            borderTop: `1px solid var(--border)`,
          }}>
            {[
              { label: 'Start date', value: startDate ? formatDate(startDate) : '—' },
              { label: 'End date', value: endDate ? formatDate(endDate) : '—' },
              { label: 'Duration', value: `${planDuration || 30} days` }
            ].map((item) => (
              <div key={item.label}>
                <p style={{
                  fontSize: '10.5px',
                  color: 'var(--text-3)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  fontWeight: 700,
                  marginBottom: '4px',
                }}>
                  {item.label}
                </p>
                <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          {daysLeft <= 7 && daysLeft > 0 && (
            <div style={{
              marginTop: '16px',
              padding: '12px 16px',
              borderRadius: '10px',
              background: 'var(--amber)14',
              border: `1px solid var(--amber)44`,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              <Clock size={14} color="var(--amber)" />
              <p style={{ fontSize: '13px', color: 'var(--text-2)' }}>
                Your membership expires in <strong style={{ color: 'var(--amber)' }}>{daysLeft} day{daysLeft !== 1 ? 's' : ''}</strong>. Contact admin to renew.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          marginBottom: '16px',
          borderRadius: '18px',
          background: 'var(--surface-2)',
          border: `1px solid var(--border)`,
          boxShadow: 'var(--shadow-md)',
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'var(--red)14',
            border: `1px solid var(--red)33`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <Crown size={30} color="var(--red)" style={{ opacity: 0.6 }} />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text)' }}>
            No active membership
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '6px' }}>
            Choose a plan below or contact the gym admin to get started.
          </p>
        </div>
      )}

      {/* Available plans */}
      <div style={{
        background: 'var(--surface)',
        border: `1px solid var(--border)`,
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '16px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '18px',
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '9px',
            background: 'var(--accent)1A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Star size={16} color="var(--accent)" />
          </div>
          <h3 style={{ fontSize: '14.5px', fontWeight: 700, margin: 0, color: 'var(--text)' }}>
            Available plans
          </h3>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '14px',
        }}>
          {[
            { id: 1, name: 'Monthly Basic', price: 3500, duration_days: 30, description: 'Basic gym access' },
            { id: 2, name: 'Monthly Premium', price: 5500, duration_days: 30, description: 'Full gym access + classes' },
            { id: 3, name: 'Quarterly', price: 14000, duration_days: 90, description: '3 months premium access' },
            { id: 4, name: 'Yearly', price: 48000, duration_days: 365, description: 'Full year access' },
          ].map((plan) => {
            const isCurrent = planName === plan.name && actuallyActive
            return (
              <div key={plan.id} style={{
                padding: '20px',
                borderRadius: '14px',
                background: isCurrent
                  ? 'linear-gradient(135deg, var(--green)22 0%, var(--green)0A 100%)'
                  : 'var(--surface-2)',
                border: `${isCurrent ? '2px' : '1px'} solid ${isCurrent ? 'var(--green)' : 'var(--border)'}`,
                boxShadow: isCurrent ? '0 0 24px var(--green)22, inset 0 1px 0 var(--green)33' : 'none',
                position: 'relative',
                transition: 'all 0.2s',
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '12px',
                }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text)' }}>
                    {plan.name}
                  </h4>
                  {isCurrent && (
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '4px 10px',
                      borderRadius: '6px',
                      background: 'var(--green)',
                      color: '#fff',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}>
                      <CheckCircle size={10} /> Active
                    </span>
                  )}
                </div>
                <div style={{ marginBottom: '4px' }}>
                  <span style={{
                    fontSize: '22px',
                    fontWeight: 800,
                    color: 'var(--accent)',
                    letterSpacing: '-0.02em',
                  }}>
                    {plan.price.toLocaleString()}
                  </span>
                  <span style={{
                    fontSize: '13px',
                    color: 'var(--text-3)',
                    marginLeft: '5px',
                  }}>
                    DZD
                  </span>
                </div>
                <p style={{
                  fontSize: '12px',
                  color: 'var(--text-3)',
                  marginBottom: '12px',
                }}>
                  / {plan.duration_days} days
                </p>
                <p style={{
                  fontSize: '12px',
                  color: 'var(--text-2)',
                  marginBottom: '14px',
                  lineHeight: 1.5,
                }}>
                  {plan.description}
                </p>
                {!isCurrent ? (
                  <button
                    onClick={() => toast('Contact admin to change your plan.', { icon: 'ℹ️' })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'var(--accent)',
                      color: 'var(--bg)',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'opacity 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                  >
                    Select {plan.name}
                  </button>
                ) : (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: 'var(--green)',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}>
                    <CheckCircle size={14} />
                    Currently active
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}