// frontend/src/pages/member/Offers.jsx

import { useEffect, useState } from 'react'
import api from '../../api/client'
import { Gift, ArrowRight, Calendar, AlertCircle, X, Tag, Copy, Check } from 'lucide-react'
import toast from 'react-hot-toast'

export default function MemberOffers() {
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedOffer, setSelectedOffer] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [actionDone, setActionDone] = useState(false)

  useEffect(() => {
    fetchOffers()
  }, [])

  const fetchOffers = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/campaigns/public/active')
      console.log('Offers response:', res.data)
      
      if (res.data && res.data.length > 0) {
        setOffers(res.data)
      } else {
        setOffers([
          {
            id: 1,
            title: 'Summer Special - 20% Off',
            content: 'Get 20% off on all annual memberships! Use code SUMMER20 at checkout.',
            type: 'promotion',
            code: 'SUMMER20',
            cover_image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=200&fit=crop',
            created_at: new Date().toISOString()
          }
        ])
      }
    } catch (error) {
      console.error('Error fetching offers:', error)
      setOffers([
        {
          id: 1,
          title: 'Summer Special - 20% Off',
          content: 'Get 20% off on all annual memberships! Use code SUMMER20.',
          type: 'promotion',
          code: 'SUMMER20',
          cover_image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=200&fit=crop',
          created_at: new Date().toISOString()
        }
      ])
      setError('Could not load offers from server, showing demo offers')
    } finally {
      setLoading(false)
    }
  }

  const openOfferModal = (offer) => {
    setSelectedOffer(offer)
    setShowModal(true)
    setActionDone(false)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedOffer(null)
    setActionDone(false)
  }

  const handleAction = async (offer) => {
    // Track the click for admin analytics
    try {
      await api.post(`/campaigns/${offer.id}/track-click`)
      console.log('✅ Click tracked')
    } catch (error) {
      console.error('❌ Tracking error:', error)
    }

    setActionDone(true)

    // Handle based on offer type
    if (offer.type === 'promotion' || offer.type === 'discount') {
      const code = offer.code || 'SUMMER20'
      await navigator.clipboard.writeText(code)
      toast.success(`Code "${code}" copied!`)
      setTimeout(() => {
        closeModal()
      }, 1500)
    } else if (offer.type === 'event' || offer.type === 'class') {
      toast.success('Taking you to booking...')
      setTimeout(() => {
        window.location.href = '/member/schedule'
      }, 1000)
    } else if (offer.type === 'training' || offer.type === 'free_trial') {
      toast.success('Taking you to programs...')
      setTimeout(() => {
        window.location.href = '/member/program'
      }, 1000)
    } else {
      // For push, announcement - just close
      toast.success('Thanks for your interest!')
      setTimeout(() => {
        closeModal()
      }, 1000)
    }
  }

  const getButtonText = (offer) => {
    if (offer.type === 'promotion' || offer.type === 'discount') return 'Get Code'
    if (offer.type === 'event' || offer.type === 'class') return 'Book Now'
    if (offer.type === 'training' || offer.type === 'free_trial') return 'Start Now'
    return 'Got it'
  }

  const getButtonIcon = (offer) => {
    if (offer.type === 'promotion' || offer.type === 'discount') return <Copy size={14} />
    if (offer.type === 'event' || offer.type === 'class') return <Calendar size={14} />
    if (offer.type === 'training' || offer.type === 'free_trial') return <Gift size={14} />
    return null
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'var(--bg)',
      }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%',
          border: `3px solid var(--border)`,
          borderTopColor: 'var(--accent)',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{
      background: 'var(--bg)',
      color: 'var(--text)',
      minHeight: '100vh',
      padding: '20px',
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      <div style={{ marginBottom: '24px' }}>
        <p style={{
          fontSize: '11px',
          color: 'var(--accent)',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          fontWeight: 700,
          marginBottom: '6px',
        }}>
          Member Benefits
        </p>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 800,
          margin: 0,
          color: 'var(--text)',
          letterSpacing: '-0.02em',
        }}>
          Special Offers
        </h1>
        <p style={{
          fontSize: '13px',
          color: 'var(--text-3)',
          marginTop: '4px',
        }}>
          Exclusive deals and promotions for our members
        </p>
      </div>

      {error && (
        <div style={{
          padding: '12px 16px',
          marginBottom: '20px',
          background: 'var(--amber)14',
          border: '1px solid var(--amber)33',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <AlertCircle size={16} color="var(--amber)" />
          <p style={{ fontSize: '13px', color: 'var(--text-2)', margin: 0 }}>{error}</p>
        </div>
      )}

      {offers.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'var(--surface)',
          borderRadius: '16px',
          border: '1px solid var(--border)',
        }}>
          <Gift size={48} color="var(--text-3)" style={{ margin: '0 auto 16px', opacity: 0.4 }} />
          <p style={{ fontSize: '14px', color: 'var(--text-2)', fontWeight: 600 }}>No active offers</p>
          <p style={{ fontSize: '12px', color: 'var(--text-3)' }}>Check back later for new promotions</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '18px',
        }}>
          {offers.map((offer) => (
            <div
              key={offer.id}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                overflow: 'hidden',
                transition: 'transform 0.2s, border-color 0.2s',
                cursor: 'pointer',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.borderColor = 'var(--accent)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.borderColor = 'var(--border)'
              }}
            >
              {offer.cover_image && (
                <div style={{
                  height: '180px',
                  overflow: 'hidden',
                  position: 'relative',
                }}>
                  <img
                    src={offer.cover_image}
                    alt={offer.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: '12px',
                    left: '12px',
                    display: 'inline-block',
                    background: 'var(--accent)',
                    color: '#fff',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '4px 12px',
                    borderRadius: '99px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}>
                    {offer.type || 'Offer'}
                  </div>
                </div>
              )}

              <div style={{ padding: '18px 20px' }}>
                <h3 style={{
                  fontSize: '17px',
                  fontWeight: 700,
                  color: 'var(--text)',
                  margin: '0 0 8px',
                  lineHeight: 1.3,
                }}>
                  {offer.title}
                </h3>
                <p style={{
                  fontSize: '13px',
                  color: 'var(--text-2)',
                  lineHeight: 1.6,
                  margin: '0 0 16px',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                  {offer.content}
                </p>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '14px',
                  borderTop: '1px solid var(--border)',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '11px',
                    color: 'var(--text-3)',
                  }}>
                    <Calendar size={12} />
                    <span>{new Date(offer.created_at).toLocaleDateString()}</span>
                  </div>
                  <button
                    onClick={() => openOfferModal(offer)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 16px',
                      borderRadius: '8px',
                      background: 'var(--accent)',
                      color: '#fff',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'opacity 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >
                    View Offer <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Offer Detail Modal ── */}
      {showModal && selectedOffer && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
            animation: 'fadeIn 0.2s ease',
          }}
          onClick={closeModal}
        >
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              maxWidth: '480px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
              animation: 'slideUp 0.25s ease',
              position: 'relative',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={closeModal}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.6)',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.8)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.6)'}
            >
              <X size={18} />
            </button>

            {/* Cover Image */}
            {selectedOffer.cover_image && (
              <div style={{
                height: '200px',
                overflow: 'hidden',
                borderRadius: '16px 16px 0 0',
                position: 'relative',
              }}>
                <img
                  src={selectedOffer.cover_image}
                  alt={selectedOffer.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(20,17,15,0.6) 0%, transparent 60%)',
                }} />
                <div style={{
                  position: 'absolute',
                  bottom: '12px',
                  left: '16px',
                  background: 'var(--accent)',
                  color: '#fff',
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '4px 12px',
                  borderRadius: '99px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}>
                  {selectedOffer.type || 'Offer'}
                </div>
              </div>
            )}

            {/* Content */}
            <div style={{ padding: '24px' }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: 800,
                color: 'var(--text)',
                margin: '0 0 8px',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
              }}>
                {selectedOffer.title}
              </h2>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                color: 'var(--text-3)',
                marginBottom: '16px',
              }}>
                <Calendar size={12} />
                <span>{new Date(selectedOffer.created_at).toLocaleDateString()}</span>
              </div>

              <p style={{
                fontSize: '14px',
                color: 'var(--text-2)',
                lineHeight: 1.7,
                margin: '0 0 20px',
                whiteSpace: 'pre-wrap',
              }}>
                {selectedOffer.content}
              </p>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                gap: '10px',
                paddingTop: '16px',
                borderTop: `1px solid var(--border)`,
              }}>
                {selectedOffer.type === 'push' || selectedOffer.type === 'announcement' ? (
                  // For push/announcement - just a "Got it" button that closes
                  <button
                    onClick={closeModal}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'var(--accent)',
                      color: '#fff',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'opacity 0.15s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >
                    <Check size={14} /> Got it
                  </button>
                ) : (
                  // For other types - action button
                  <button
                    onClick={() => handleAction(selectedOffer)}
                    disabled={actionDone}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      background: actionDone ? 'var(--green)' : 'var(--accent)',
                      color: '#fff',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: actionDone ? 'default' : 'pointer',
                      transition: 'opacity 0.15s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                    onMouseEnter={e => {
                      if (!actionDone) e.currentTarget.style.opacity = '0.85'
                    }}
                    onMouseLeave={e => {
                      if (!actionDone) e.currentTarget.style.opacity = '1'
                    }}
                  >
                    {actionDone ? (
                      <>
                        <Check size={14} /> Done!
                      </>
                    ) : (
                      <>
                        {getButtonIcon(selectedOffer)} {getButtonText(selectedOffer)}
                      </>
                    )}
                  </button>
                )}
                <button
                  onClick={closeModal}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: `1px solid var(--border)`,
                    background: 'transparent',
                    color: 'var(--text-2)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}