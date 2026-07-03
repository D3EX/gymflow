// frontend/src/components/NotificationBell.jsx

import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { Bell, CheckCircle, AlertCircle, Calendar, Gift, DollarSign, Clock, Star, Users, Info, AlertTriangle, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from "../api/client"
import { useAuthStore } from '../stores/authStore'

const C = {
  ink: 'var(--bg)',
  surface: 'var(--surface)',
  surface2: 'var(--surface-2)',
  surface3: 'var(--surface-3)',
  line: 'var(--border)',
  text: 'var(--text)',
  text2: 'var(--text-2)',
  text3: 'var(--text-3)',
  ember: 'var(--accent)',
  mint: 'var(--green)',
  amber: 'var(--amber)',
  red: 'var(--red)',
  blue: 'var(--blue)',
  emberBg: 'var(--accent-glow)',
}

function getIcon(type) {
  const map = {
    warning: <AlertTriangle size={15} color={C.amber} />,
    success: <CheckCircle size={15} color={C.mint}  />,
    birthday: <Gift size={15} color={C.ember} />,
    info: <Info size={15} color={C.blue}  />,
    payment: <DollarSign size={15} color={C.mint} />,
    membership: <Star size={15} color={C.ember} />,
    reminder: <Clock size={15} color={C.amber} />,
    announcement: <Users size={15} color={C.blue} />,
  }
  return map[type] ?? <Bell size={15} color={C.ember} />
}

function getIconBg(type) {
  const map = {
    warning: C.amber,
    success: C.mint,
    birthday: C.ember,
    info: C.blue,
    payment: C.mint,
    membership: C.ember,
    reminder: C.amber,
    announcement: C.blue,
  }
  return (map[type] ?? C.ember) + '1A'
}

export default function NotificationBell() {
  const { user } = useAuthStore()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedNotification, setSelectedNotification] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 640 : false
  )
  const dropdownRef = useRef(null)
  const bellBtnRef = useRef(null)
  const fetchCount = useRef(0)
  const [mobilePos, setMobilePos] = useState({ top: 60, right: 12, left: 12 })

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 640)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Keep the mobile dropdown locked to the bell button's live position,
  // recalculating on scroll (header isn't sticky, so the button moves)
  useLayoutEffect(() => {
    if (!isOpen || !isMobile) return

    const margin = 10
    const gap = 8
    let rafId = null

    const update = () => {
      rafId = null
      if (!bellBtnRef.current) return
      const rect = bellBtnRef.current.getBoundingClientRect()
      setMobilePos({
        top: Math.round(rect.bottom + gap),
        right: margin,
        left: margin,
      })
    }

    const onScrollOrResize = () => {
      if (rafId == null) rafId = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScrollOrResize, { passive: true, capture: true })
    window.addEventListener('resize', onScrollOrResize)
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, { capture: true })
      window.removeEventListener('resize', onScrollOrResize)
      if (rafId != null) cancelAnimationFrame(rafId)
    }
  }, [isOpen, isMobile])

  // Check if user is admin or coach
  const isAdmin = user?.role === 'admin'
  const isCoach = user?.role === 'coach'
  const canViewAllNotifications = isAdmin || isCoach

  useEffect(() => {
    console.log('NotificationBell mounted', { isAdmin, isCoach, user })
    fetchNotifications()
    
    const iv = setInterval(fetchNotifications, 30000)
    return () => {
      console.log('NotificationBell unmounting')
      clearInterval(iv)
    }
  }, [user?.role])

  useEffect(() => {
    const handler = e => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const fetchNotifications = async () => {
    console.log('Fetching notifications...', { isAdmin, isCoach })
    setLoading(true)
    try {
      let response
      
      // ✅ Coaches and admins use the same endpoint (notifications are sent to user_id)
      if (isAdmin || isCoach) {
        console.log('Fetching admin/coach notifications...')
        response = await api.get('/notifications/my', {
          params: {
            limit: 100
          }
        })
      } else {
        // MEMBER: Use member endpoint
        console.log('Fetching member notifications...')
        response = await api.get('/notifications/my', {
          params: {
            limit: 100
          }
        })
      }
      
      console.log('Raw notifications:', response.data)
      console.log('Count:', response.data.length)
      
      const fmt = response.data.map(n => ({
        id: n.id,
        type: n.type || 'info',
        title: n.title,
        message: n.message,
        time: new Date(n.created_at).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        read: n.is_read || false,
        image: n.cover_image || n.image || null,
        action: n.action_link || null,
        actionLabel: n.action_label || 'Learn More',
        created_at: n.created_at,
      }))
      
      setNotifications(fmt)
      const unread = fmt.filter(n => !n.read).length
      setUnreadCount(unread)
      console.log('Unread count:', unread)
      
    } catch (error) {
      console.error('Error fetching notifications:', error)
      setNotifications([])
      setUnreadCount(0)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id) => {
    console.log('Marking notification', id, 'as read', { isAdmin, isCoach })
    try {
      setNotifications(p => p.map(n => n.id === id ? { ...n, read: true } : n))
      setUnreadCount(p => Math.max(0, p - 1))
      
      await api.put(`/notifications/my/${id}/read`)
      console.log('Notification', id, 'marked as read')
    } catch (error) {
      console.error('Error marking as read:', error)
      fetchNotifications()
    }
  }

  const markAllAsRead = async () => {
    console.log('Marking all as read...', { isAdmin, isCoach })
    try {
      setNotifications(p => p.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
      
      await api.put('/notifications/my/read-all')
      console.log('All marked as read')
    } catch (error) {
      console.error('Error marking all as read:', error)
      fetchNotifications()
    }
  }

  const handleNotificationClick = async (notif) => {
    console.log('Clicked notification', notif.id)
    if (!notif.read) {
      await markAsRead(notif.id)
    }
    
    // Show the notification in a modal
    setSelectedNotification(notif)
    setShowModal(true)
    setIsOpen(false) // Close the dropdown
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedNotification(null)
  }

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        ref={bellBtnRef}
        onClick={() => {
          console.log('Bell clicked, isOpen:', !isOpen)
          setIsOpen(o => !o)
        }}
        style={{
          width: 36, height: 36, borderRadius: 10, cursor: 'pointer',
          background: C.surface2, border: `1px solid ${C.line}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', transition: 'border-color .15s',
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = C.ember + '60'}
        onMouseLeave={e => e.currentTarget.style.borderColor = C.line}
      >
        <Bell size={16} color={C.text2} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            background: C.ember,
            color: '#ffffff',
            fontSize: '9px',
            fontWeight: 800,
            borderRadius: '50%',
            width: '18px',
            height: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `2px solid var(--bg)`,
            boxSizing: 'border-box',
            lineHeight: 1,
            minWidth: '18px',
            minHeight: '18px',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown ── */}
      {isOpen && (
        <div style={isMobile ? {
          position: 'fixed', top: mobilePos.top, left: mobilePos.left, right: mobilePos.right,
          width: 'auto', background: C.surface,
          border: `1px solid ${C.line}`, borderRadius: 14,
          boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
          zIndex: 1000, overflow: 'hidden',
          maxHeight: `calc(100vh - ${mobilePos.top + 16}px)`, display: 'flex', flexDirection: 'column',
        } : {
          position: 'absolute', top: 'calc(100% + 10px)', right: 0,
          width: 380, background: C.surface,
          border: `1px solid ${C.line}`, borderRadius: 14,
          boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
          zIndex: 1000, overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: isMobile ? '12px 14px' : '13px 16px', borderBottom: `1px solid ${C.line}`,
            background: C.surface2, flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bell size={14} color={C.ember} />
              <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Notifications</span>
              {unreadCount > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 7px',
                  borderRadius: 99, background: `${C.ember}1A`, color: C.ember,
                }}>
                  {unreadCount} new
                </span>
              )}
            </div>
            {notifications.length > 0 && unreadCount > 0 && (
              <button onClick={markAllAsRead} style={{
                fontSize: 11, color: C.ember, fontWeight: 600,
                background: 'none', border: 'none', cursor: 'pointer',
              }}>
                Mark all read
              </button>
            )}
          </div>

          <div style={isMobile
            ? { flex: 1, minHeight: 0, overflowY: 'auto' }
            : { maxHeight: 450, overflowY: 'auto' }
          }>
            {loading ? (
              <div style={{ padding: '44px 20px', textAlign: 'center' }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 14, margin: '0 auto 14px',
                  border: `2px solid ${C.line}`,
                  borderTopColor: C.ember,
                  animation: 'spin 0.8s linear infinite',
                }} />
                <p style={{ fontSize: 13, color: C.text3 }}>Loading...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '44px 20px', textAlign: 'center' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14, margin: '0 auto 14px',
                  background: `${C.ember}10`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Bell size={22} color={C.text3} />
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, color: C.text2, marginBottom: 4 }}>All caught up</p>
                <p style={{ fontSize: 11, color: C.text3 }}>No new notifications</p>
              </div>
            ) : (
              notifications.map((notif, i) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  style={{
                    display: 'flex', gap: 12, padding: '12px 16px',
                    borderBottom: i < notifications.length - 1 ? `1px solid ${C.line}` : 'none',
                    cursor: 'pointer',
                    background: notif.read ? 'transparent' : `${C.ember}07`,
                    transition: 'background .15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = C.surface2}
                  onMouseLeave={e => e.currentTarget.style.background = notif.read ? 'transparent' : `${C.ember}07`}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                    background: getIconBg(notif.type),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginTop: 1,
                  }}>
                    {getIcon(notif.type)}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, gap: 8 }}>
                      <span style={{
                        fontSize: 12, fontWeight: 700, color: C.text,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                      }}>
                        {notif.title}
                      </span>
                      <span style={{ fontSize: 10, color: C.text3, flexShrink: 0 }}>{notif.time}</span>
                    </div>
                    <p style={{ fontSize: 11, color: C.text3, lineHeight: 1.5, margin: 0 }}>{notif.message}</p>
                  </div>

                  {!notif.read && (
                    <div style={{
                      width: 7, height: 7, background: C.ember,
                      borderRadius: '50%', flexShrink: 0, marginTop: 7,
                    }} />
                  )}
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div style={{
              padding: '11px 16px', borderTop: `1px solid ${C.line}`,
              background: C.surface2, textAlign: 'center', flexShrink: 0,
            }}>
              <Link
                to={canViewAllNotifications ? "/dashboard/notifications" : "/member/notifications"}
                onClick={() => setIsOpen(false)}
                style={{ fontSize: 12, fontWeight: 600, color: C.ember, textDecoration: 'none' }}
              >
                View all notifications →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* ── Notification Detail Modal ── */}
      {showModal && selectedNotification && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: isMobile ? '12px' : '20px',
            animation: 'fadeIn 0.2s ease',
          }}
          onClick={closeModal}
        >
          <div
            style={{
              background: C.surface,
              border: `1px solid ${C.line}`,
              borderRadius: 16,
              maxWidth: 480,
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
                top: 12,
                right: 12,
                width: 32,
                height: 32,
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
            {selectedNotification.image ? (
              <div style={{
                position: 'relative',
                height: isMobile ? 150 : 200,
                overflow: 'hidden',
                borderRadius: '16px 16px 0 0',
              }}>
                <img 
                  src={selectedNotification.image} 
                  alt={selectedNotification.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(20,17,15,0.8) 0%, transparent 60%)',
                }} />
              </div>
            ) : (
              <div style={{
                height: 80,
                background: `${C.ember}15`,
                borderRadius: '16px 16px 0 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Bell size={32} color={C.ember} style={{ opacity: 0.4 }} />
              </div>
            )}

            {/* Content */}
            <div style={{ padding: isMobile ? '18px' : '24px' }}>
              {/* Type badge */}
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: getIconBg(selectedNotification.type),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {getIcon(selectedNotification.type)}
                </div>
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  marginLeft: 8,
                  color: C.text3,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}>
                  {selectedNotification.type || 'Info'}
                </span>
              </div>

              {/* Title */}
              <h2 style={{
                fontSize: 20,
                fontWeight: 800,
                color: C.text,
                margin: '0 0 12px',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
              }}>
                {selectedNotification.title}
              </h2>

              {/* Message */}
              <p style={{
                fontSize: 14,
                color: C.text2,
                lineHeight: 1.7,
                margin: '0 0 20px',
                whiteSpace: 'pre-wrap',
              }}>
                {selectedNotification.message}
              </p>

              {/* Actions */}
              <div style={{
                display: 'flex',
                gap: 10,
                paddingTop: 16,
                borderTop: `1px solid ${C.line}`,
              }}>
                {selectedNotification.action ? (
                  <button
                    onClick={() => {
                      window.location.href = selectedNotification.action
                      closeModal()
                    }}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      borderRadius: 8,
                      border: 'none',
                      background: C.ember,
                      color: '#fff',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'opacity 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >
                    {selectedNotification.actionLabel || 'Learn More'}
                  </button>
                ) : (
                  <button
                    onClick={closeModal}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      borderRadius: 8,
                      border: `1px solid ${C.line}`,
                      background: 'transparent',
                      color: C.text2,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Close
                  </button>
                )}
                {selectedNotification.action && (
                  <button
                    onClick={closeModal}
                    style={{
                      padding: '10px 16px',
                      borderRadius: 8,
                      border: `1px solid ${C.line}`,
                      background: 'transparent',
                      color: C.text2,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Close
                  </button>
                )}
              </div>

              {/* Time */}
              <p style={{
                fontSize: 11,
                color: C.text3,
                marginTop: 16,
                textAlign: 'center',
              }}>
                Received {selectedNotification.time}
              </p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}