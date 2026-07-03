// frontend/src/components/Layout.jsx

import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import {
  LayoutDashboard, Users, Dumbbell, Calendar, CreditCard,
  Receipt, BarChart3, Settings, LogOut,
  ChevronLeft, ChevronRight, ChevronDown, RefreshCw, Sun, Moon, Search,
  UserCircle, Wrench, Megaphone, UserCheck, Crown, User, DollarSign,
  Apple, Activity, PanelLeftClose, PanelLeftOpen, X, Clock, UserPlus,
  FileText, ClipboardList, MessageSquare, Send, Check, CheckCheck,
  Paperclip, MoreVertical, Phone, Video, Info, Smile, File
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import NotificationBell from './NotificationBell'
import api from '../api/client'

const COLORS = {
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

const HEADER_HEIGHT = '64px'
const SIDEBAR_WIDTH = '252px'
const SIDEBAR_WIDTH_COLLAPSED = '80px'
const CHAT_PANEL_WIDTH = '420px'

// Flat, borderless icon button used in the header toolbar.
function FlatIconButton({ onClick, title, children, to, className: extraClass }) {
  const sharedStyle = {
    width: '34px',
    height: '34px',
    borderRadius: '999px',
    border: 'none',
    background: 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    color: COLORS.text2,
  }
  const className = [title ? 'flat-icon-btn tooltip-anchor' : 'flat-icon-btn', extraClass].filter(Boolean).join(' ')
  if (to) {
    return (
      <Link to={to} aria-label={title} data-tooltip={title} className={className} style={sharedStyle}>
        {children}
      </Link>
    )
  }
  return (
    <button onClick={onClick} aria-label={title} data-tooltip={title} className={className} style={sharedStyle}>
      {children}
    </button>
  )
}

function DropdownItem({ icon: Icon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className="dropdown-item"
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '9px',
        padding: '8px 10px',
        borderRadius: '8px',
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: 600,
        color: danger ? COLORS.red : COLORS.text2,
        textAlign: 'left',
      }}
    >
      <Icon size={15} />
      {label}
    </button>
  )
}

// ─── Search Results Dropdown ──────────────────────────────────
function SearchResults({ results, onClose, isAdmin }) {
  if (!results || results.length === 0) return null

  const getPath = (item) => {
    if (item.type === 'member') {
      return isAdmin ? `/dashboard/members/${item.id}` : `/member/profile`
    }
    if (item.type === 'payment') {
      return isAdmin ? `/dashboard/payments` : `/member/payments`
    }
    if (item.type === 'subscription') {
      return isAdmin ? `/dashboard/subscriptions` : `/member/membership`
    }
    if (item.type === 'plan') {
      return isAdmin ? `/dashboard/plans` : `/member/membership`
    }
    if (item.type === 'staff') {
      return `/dashboard/staff`
    }
    if (item.type === 'class') {
      return isAdmin ? `/dashboard/classes` : `/member/schedule`
    }
    if (item.type === 'client') {
      return `/coach/clients/${item.id}`
    }
    if (item.type === 'program') {
      return `/coach/programs`
    }
    return '#'
  }

  const getIcon = (type) => {
    switch (type) {
      case 'member': return <Users size={14} color={COLORS.ember} />
      case 'client': return <UserPlus size={14} color={COLORS.blue} />
      case 'payment': return <CreditCard size={14} color={COLORS.mint} />
      case 'subscription': return <Receipt size={14} color={COLORS.amber} />
      case 'plan': return <Dumbbell size={14} color={COLORS.blue} />
      case 'staff': return <UserCircle size={14} color={COLORS.ember} />
      case 'class': return <Calendar size={14} color={COLORS.amber} />
      case 'program': return <ClipboardList size={14} color={COLORS.amber} />
      default: return <Search size={14} color={COLORS.text3} />
    }
  }

  return (
    <div style={{
      position: 'absolute',
      top: 'calc(100% + 8px)',
      left: 0,
      right: 0,
      background: COLORS.surface,
      border: `1px solid ${COLORS.line}`,
      borderRadius: '12px',
      boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
      zIndex: 1000,
      maxHeight: '400px',
      overflowY: 'auto',
      padding: '8px',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '4px 8px 8px 8px',
        borderBottom: `1px solid ${COLORS.line}`,
        marginBottom: '8px',
      }}>
        <span style={{ fontSize: '11px', color: COLORS.text3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {results.length} result{results.length > 1 ? 's' : ''}
        </span>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: COLORS.text3,
            cursor: 'pointer',
            padding: '4px',
          }}
        >
          <X size={14} />
        </button>
      </div>
      {results.map((item, index) => (
        <Link
          key={item.id || index}
          to={getPath(item)}
          onClick={onClose}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 10px',
            borderRadius: '8px',
            textDecoration: 'none',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = COLORS.surface2}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: `${COLORS.ember}18`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            {getIcon(item.type)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '13px',
              fontWeight: 600,
              color: COLORS.text,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {item.label || item.name || item.title || 'Untitled'}
            </div>
            <div style={{
              fontSize: '11px',
              color: COLORS.text3,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {item.subtitle || item.email || item.type || ''}
            </div>
          </div>
          <span style={{
            fontSize: '10px',
            padding: '2px 8px',
            borderRadius: '99px',
            background: COLORS.surface2,
            color: COLORS.text3,
            textTransform: 'capitalize',
            border: `1px solid ${COLORS.line}`,
          }}>
            {item.type}
          </span>
        </Link>
      ))}
    </div>
  )
}

// ─── Chat Message Bubble Component ──────────────────────────
function MessageBubble({ msg, isMe, isLastInGroup, coachInfo, user }) {
  const [showTime, setShowTime] = useState(false)

  if (msg.deleted) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: isMe ? 'flex-end' : 'flex-start', 
        marginBottom: '4px',
        padding: '0 4px'
      }}>
        <div style={{
          padding: '6px 12px',
          border: `1px solid ${COLORS.line}`,
          borderRadius: '12px',
          fontSize: '12px',
          color: COLORS.text3,
          fontStyle: 'italic',
          background: COLORS.surface2,
          maxWidth: '80%',
        }}>
          Message deleted
        </div>
      </div>
    )
  }

  const isImageOnly = msg.attachment && !msg.text &&
    (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(msg.attachment) || msg.attachment.startsWith('blob:'))

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isMe ? 'flex-end' : 'flex-start',
        marginBottom: isLastInGroup ? '8px' : '2px',
        padding: '0 4px',
        alignItems: 'flex-end',
        gap: '8px',
      }}
      onMouseEnter={() => setShowTime(true)}
      onMouseLeave={() => setShowTime(false)}
    >
      {/* Coach avatar — only on last message in group */}
      {!isMe && (
        <div style={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
          background: isLastInGroup ? COLORS.emberBg : 'transparent',
          color: COLORS.ember,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 12,
        }}>
          {isLastInGroup ? (coachInfo?.initials || '?') : ''}
        </div>
      )}

      <div style={{
        maxWidth: '75%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: isMe ? 'flex-end' : 'flex-start',
      }}>
        <div style={{
          background: isImageOnly ? 'transparent' : (isMe ? COLORS.ember : COLORS.surface2),
          color: isMe ? '#fff' : COLORS.text,
          borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          padding: isImageOnly ? '0' : '10px 14px',
          fontSize: '14px',
          lineHeight: 1.5,
          boxShadow: (isMe && !isImageOnly) ? '0 2px 8px rgba(251,113,33,0.25)' : 'none',
          border: (!isMe && !isImageOnly) ? `1px solid ${COLORS.line}` : 'none',
          overflow: 'hidden',
        }}>
          {msg.attachment && (() => {
            const attachUrl = msg.attachment
            const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(attachUrl) || attachUrl.startsWith('blob:')
            const isPdf = /\.(pdf)$/i.test(attachUrl)
            const isDoc = /\.(doc|docx)$/i.test(attachUrl)
            const fileName = msg.attachmentName || attachUrl.split('/').pop() || 'Attachment'

            return isImage ? (
              <a href={attachUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
                <img
                  src={attachUrl}
                  alt={fileName}
                  style={{
                    display: 'block',
                    maxWidth: '200px',
                    width: '100%',
                    height: 'auto',
                    borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    opacity: msg.pending ? 0.6 : 1,
                    transition: 'opacity 0.2s',
                    marginBottom: msg.text ? '6px' : 0,
                  }}
                />
              </a>
            ) : (
              <a
                href={msg.pending ? undefined : attachUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  color: isMe ? '#fff' : COLORS.ember,
                  fontSize: '13px', fontWeight: 600,
                  textDecoration: 'none', padding: '4px 2px',
                  maxWidth: '180px',
                  opacity: msg.pending ? 0.6 : 1,
                  marginBottom: msg.text ? '6px' : 0,
                }}
              >
                <div style={{
                  background: isMe ? 'rgba(255,255,255,0.2)' : `${COLORS.ember}20`,
                  padding: '8px', borderRadius: '8px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {isPdf ? <File size={16} /> : isDoc ? <FileText size={16} /> : <Paperclip size={16} />}
                </div>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {fileName}
                </span>
              </a>
            )
          })()}
          {msg.text && <div>{msg.text}</div>}
        </div>

        {/* Timestamp */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          fontSize: '10px', color: COLORS.text3,
          padding: '2px 4px 0',
          opacity: showTime || msg.pending ? 1 : 0,
          transition: 'opacity 0.2s ease',
        }}>
          {msg.edited && <span style={{ opacity: 0.6 }}>edited ·</span>}
          <span>{msg.pending ? 'Sending…' : msg.time}</span>
          {isMe && !msg.pending && (
            <span style={{ color: msg.read ? COLORS.blue : COLORS.text3 }}>
              {msg.read ? <CheckCheck size={12} /> : <Check size={12} />}
            </span>
          )}
        </div>
      </div>

      {/* Member avatar — only on last message in group */}
      {isMe && (
        <div style={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
          background: isLastInGroup ? COLORS.emberBg : 'transparent',
          color: COLORS.ember,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 12,
        }}>
          {isLastInGroup ? (user?.name?.charAt(0) || 'S') : ''}
        </div>
      )}
    </div>
  )
}

// ─── Chat Panel Component ─────────────────────────────────────
function ChatPanel({ 
  isOpen, 
  onClose, 
  coachInfo, 
  user,
  chatMessages, 
  chatMessagesLoaded, 
  chatInput, 
  setChatInput, 
  chatSending, 
  sendChat, 
  sendAttachment, 
  fileInputRef, 
  chatInputRef, 
  chatEndRef,
  chatUnread
}) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatMessages, chatEndRef])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: CHAT_PANEL_WIDTH,
      height: '100vh',
      background: COLORS.surface,
      borderLeft: `1px solid ${COLORS.line}`,
      boxShadow: isOpen ? '-8px 0 48px rgba(0,0,0,0.3)' : 'none',
      transform: isOpen ? 'translateX(0)' : `translateX(${CHAT_PANEL_WIDTH})`,
      transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease',
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      backdropFilter: 'blur(20px)',
    }}>
      {/* Chat Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '16px 20px',
        borderBottom: `1px solid ${COLORS.line}`,
        background: COLORS.surface,
        flexShrink: 0,
        minHeight: HEADER_HEIGHT,
        position: 'relative',
      }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: COLORS.emberBg,
            color: COLORS.ember,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: 16,
            border: `2px solid ${COLORS.line}`,
          }}>
            {coachInfo?.initials || '?'}
          </div>
          <div style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: coachInfo?.is_online ? COLORS.mint : COLORS.text3,
            border: `2px solid ${COLORS.surface}`,
            boxShadow: coachInfo?.is_online ? `0 0 0 2px ${COLORS.mint}40` : 'none',
          }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ 
            fontSize: '15px', 
            fontWeight: 700, 
            color: COLORS.text,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            {coachInfo?.name || 'Your Coach'}
            <div style={{
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '12px',
              background: coachInfo?.is_online ? `${COLORS.mint}20` : `${COLORS.text3}20`,
              color: coachInfo?.is_online ? COLORS.mint : COLORS.text3,
              fontWeight: 600,
            }}>
              {coachInfo?.is_online ? 'Online' : 'Offline'}
            </div>
          </div>
          <div style={{ fontSize: '12px', color: COLORS.text3 }}>
            {coachInfo?.specialty || 'Your personal coach'}
          </div>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}>
          <button
            onClick={() => {/* Call functionality */}}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: COLORS.text3,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = COLORS.surface2; e.currentTarget.style.color = COLORS.mint }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = COLORS.text3 }}
          >
            <Phone size={18} />
          </button>
          <button
            onClick={() => {/* Video call functionality */}}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: COLORS.text3,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = COLORS.surface2; e.currentTarget.style.color = COLORS.blue }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = COLORS.text3 }}
          >
            <Video size={18} />
          </button>
          <button
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: COLORS.text3,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = COLORS.red + '20'; e.currentTarget.style.color = COLORS.red }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = COLORS.text3 }}
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px 12px 8px',
        background: COLORS.ink,
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          {!chatMessagesLoaded ? (
            <div style={{ 
              textAlign: 'center', 
              color: COLORS.text3, 
              fontSize: '13px', 
              padding: '40px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
            }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                border: `2px solid ${COLORS.line}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'spin 1s linear infinite',
              }}>
                <div style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  border: `2px solid ${COLORS.ember}`,
                  borderTopColor: 'transparent',
                }} />
              </div>
              <style>{`
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
              `}</style>
              Loading messages...
            </div>
          ) : chatMessages.length === 0 ? (
            <div style={{
              textAlign: 'center',
              color: COLORS.text3,
              fontSize: '14px',
              padding: '40px 24px',
              lineHeight: 1.6,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
            }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: `${COLORS.ember}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <MessageSquare size={28} color={COLORS.ember} />
              </div>
              <div>
                <div style={{ fontWeight: 600, color: COLORS.text, marginBottom: '4px' }}>
                  No messages yet
                </div>
                <div style={{ fontSize: '13px' }}>
                  Start a conversation with your coach
                </div>
              </div>
            </div>
          ) : (
            chatMessages.map((msg, index) => {
              const isMe = msg.from === 'member'
              const nextMsg = index < chatMessages.length - 1 ? chatMessages[index + 1] : null
              const isLastInGroup = !nextMsg || nextMsg.from !== msg.from
              return (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  isMe={isMe}
                  isLastInGroup={isLastInGroup}
                  coachInfo={coachInfo}
                  user={user}
                />
              )
            })
          )}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Chat Footer */}
      <div style={{
        padding: '10px 16px 16px',
        borderTop: `1px solid ${COLORS.line}`,
        background: COLORS.surface,
        flexShrink: 0,
      }}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,.pdf,.doc,.docx"
          style={{ display: 'none' }}
          onChange={e => { if (e.target.files?.[0]) sendAttachment(e.target.files[0]); e.target.value = '' }}
        />
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
          {/* Input row */}
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'flex-end',
            background: COLORS.surface2,
            borderRadius: '16px',
            padding: '6px 8px 6px 12px',
            border: `1px solid ${COLORS.line}`,
            transition: 'border-color 0.15s',
            minWidth: 0,
          }}>
            <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
              <button
                onClick={() => fileInputRef.current?.click()}
                title="Attach file"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: COLORS.text3,
                  padding: '6px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = COLORS.surface3; e.currentTarget.style.color = COLORS.ember }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = COLORS.text3 }}
              >
                <Paperclip size={18} />
              </button>
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                title="Emoji"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: COLORS.text3,
                  padding: '6px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = COLORS.surface3; e.currentTarget.style.color = COLORS.amber }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = COLORS.text3 }}
              >
                <Smile size={18} />
              </button>
            </div>
            <input
              ref={chatInputRef}
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); sendChat() } }}
              placeholder="Type a message..."
              disabled={chatSending}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                color: COLORS.text,
                fontSize: '14px',
                fontFamily: 'inherit',
                padding: '8px 4px',
                minHeight: '40px',
                minWidth: 0,
              }}
            />
          </div>
          {/* Send button — outside the input wrapper so it's never clipped */}
          <button
            onClick={sendChat}
            disabled={!chatInput.trim() || chatSending}
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              border: 'none',
              background: (chatInput.trim() && !chatSending) ? COLORS.ember : COLORS.surface3,
              color: (chatInput.trim() && !chatSending) ? '#fff' : COLORS.text3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: (chatInput.trim() && !chatSending) ? 'pointer' : 'default',
              flexShrink: 0,
              transition: 'all 0.15s',
              boxShadow: (chatInput.trim() && !chatSending) ? '0 4px 12px rgba(251,113,33,0.4)' : 'none',
            }}
          >
            <Send size={18} style={{ transform: 'translateX(1px)' }} />
          </button>
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '6px 4px 0',
          fontSize: '10px',
          color: COLORS.text3,
        }}>
          <span>End-to-end encrypted</span>
          <span>{chatMessages.filter(m => m.from === 'member').length} messages</span>
        </div>
      </div>
    </div>
  )
}

export default function Layout() {
  const { user, logout } = useAuthStore()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showResults, setShowResults] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const [chatMessagesLoaded, setChatMessagesLoaded] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [chatSending, setChatSending] = useState(false)
  const [chatUnread, setChatUnread] = useState(0)
  const [coachInfo, setCoachInfo] = useState(null) // { coach_user_id, name, initials, specialty, is_online }
  const [coachUnreadCount, setCoachUnreadCount] = useState(0)
  const chatEndRef = useRef(null)
  const chatInputRef = useRef(null)
  const fileInputRef = useRef(null)
  const chatOpenRef = useRef(false)
  const chatMessagesRef = useRef([])
  const searchInputRef = useRef(null)
  const searchContainerRef = useRef(null)
  const avatarMenuRef = useRef(null)
  const searchTimeoutRef = useRef(null)

  const isAdmin = user?.role === 'admin'
  const isCoach = user?.role === 'coach'
  const isClient = user?.role === 'client'
  
  const settingsPath = isAdmin ? '/dashboard/settings' : isCoach ? '/coach/settings' : '/member/profile'

  // Load assigned coach info + unread count for the floating chat widget (members only)
  useEffect(() => {
    if (!isClient) return

    let cancelled = false

    const loadCoachInfo = async () => {
      try {
        const res = await api.get('/messages/member/coach-info')
        if (!cancelled) setCoachInfo(res.data)
      } catch (err) {
        console.error('Failed to load coach info:', err)
      }
    }

    const loadUnreadCount = async () => {
      try {
        const res = await api.get('/messages/member/unread-count')
        if (!cancelled) setChatUnread(res.data.unread || 0)
      } catch (err) {
        console.error('Failed to load unread count:', err)
      }
    }

    const pollMessages = async () => {
      if (!chatOpenRef.current) {
        // Chat closed — just refresh unread badge
        loadUnreadCount()
        return
      }
      // Chat open — fetch full thread and merge new messages
      try {
        const res = await api.get('/messages/member/conversation')
        if (cancelled) return
        const serverBase = (api.defaults?.baseURL || '').replace(/\/api\/?$/, '')
        const resolveUrl = (url) => {
          if (!url) return null
          if (url.startsWith('http')) return url
          return `${serverBase}${url.startsWith('/') ? '' : '/'}${url}`
        }
        const msgs = res.data.map(m => ({
          id: m.id,
          from: m.sender_id === user?.id ? 'member' : 'coach',
          text: m.is_deleted ? null : m.content,
          time: new Date(m.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          read: m.is_read,
          edited: !!m.edited_at,
          deleted: m.is_deleted,
          attachment: resolveUrl(m.attachment_url),
          attachmentName: m.attachment_name || null,
        }))
        setChatMessages(prev => {
          // Merge: keep optimistic pending messages, update rest
          const pending = prev.filter(m => m.pending)
          const merged = [
            ...msgs.filter(m => !pending.some(p => p.tempMatch === m.text)),
            ...pending,
          ]
          // Only update if something actually changed
          if (JSON.stringify(merged.map(m => m.id)) === JSON.stringify(prev.map(m => m.id))) return prev
          return merged
        })
        setChatUnread(0)
      } catch (err) { /* silent */ }
    }

    loadCoachInfo()
    loadUnreadCount()

    const interval = setInterval(pollMessages, 5000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [isClient, user?.id])

  // Load unread message count for coach sidebar badge
  useEffect(() => {
    if (!isCoach) return
    let cancelled = false
    const loadCoachUnread = async () => {
      try {
        const res = await api.get('/messages/coach/unread-count')
        if (!cancelled) setCoachUnreadCount(res.data.unread || 0)
      } catch { /* silent */ }
    }
    loadCoachUnread()
    const interval = setInterval(loadCoachUnread, 10000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [isCoach])

  // Cmd/Ctrl + K focuses the search bar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
      if (e.key === 'Escape') {
        if (document.activeElement === searchInputRef.current) {
          searchInputRef.current.blur()
          setShowResults(false)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Close search dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close avatar dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target)) {
        setIsAvatarMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  // ─── SEARCH FUNCTION ─────────────────────────────────────────
  const performSearch = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    setIsSearching(true)
    const searchTerm = query.toLowerCase()

    try {
      const results = []

      // 1. Search Members (Admin only)
      if (isAdmin) {
        try {
          const membersRes = await api.get('/members')
          const members = (membersRes.data || [])
            .filter(m => 
              m.user?.name?.toLowerCase().includes(searchTerm) ||
              m.user?.email?.toLowerCase().includes(searchTerm) ||
              m.phone?.includes(searchTerm)
            )
            .slice(0, 5)
            .map(m => ({
              id: m.id,
              type: 'member',
              label: m.user?.name || 'Unknown Member',
              subtitle: m.user?.email || '',
              email: m.user?.email || '',
            }))
          results.push(...members)
        } catch (e) { /* ignore */ }
      }

      // 2. Search Clients (Coach only)
      if (isCoach) {
        try {
          const clientsRes = await api.get('/coach/clients')
          const clients = (clientsRes.data || [])
            .filter(c =>
              c.user?.name?.toLowerCase().includes(searchTerm) ||
              c.user?.email?.toLowerCase().includes(searchTerm) ||
              c.phone?.includes(searchTerm)
            )
            .slice(0, 5)
            .map(c => ({
              id: c.id,
              type: 'client',
              label: c.user?.name || 'Unknown Client',
              subtitle: c.user?.email || '',
              email: c.user?.email || '',
            }))
          results.push(...clients)
        } catch (e) { /* ignore */ }
      }

      // 3. Search Programs (Coach only)
      if (isCoach) {
        try {
          const programsRes = await api.get('/programs/coach')
          const programs = (programsRes.data || [])
            .filter(p =>
              p.name?.toLowerCase().includes(searchTerm) ||
              p.description?.toLowerCase().includes(searchTerm) ||
              p.coach_name?.toLowerCase().includes(searchTerm)
            )
            .slice(0, 5)
            .map(p => ({
              id: p.id,
              type: 'program',
              label: p.name || 'Program',
              subtitle: p.coach_name || 'Coach',
            }))
          results.push(...programs)
        } catch (e) { /* ignore */ }
      }

      // 4. Search Payments (Admin only)
      if (isAdmin) {
        try {
          const paymentsRes = await api.get('/payments')
          const payments = (paymentsRes.data || [])
            .filter(p => 
              p.member?.user?.name?.toLowerCase().includes(searchTerm) ||
              p.member?.user?.email?.toLowerCase().includes(searchTerm) ||
              p.notes?.toLowerCase().includes(searchTerm)
            )
            .slice(0, 5)
            .map(p => ({
              id: p.id,
              type: 'payment',
              label: `${p.member?.user?.name || 'Unknown'} - ${p.amount || 0} DZD`,
              subtitle: p.status || 'pending',
            }))
          results.push(...payments)
        } catch (e) { /* ignore */ }
      }

      // 5. Search Staff (Admin only)
      if (isAdmin) {
        try {
          const staffRes = await api.get('/staff')
          const staff = (staffRes.data || [])
            .filter(s =>
              s.user?.name?.toLowerCase().includes(searchTerm) ||
              s.user?.email?.toLowerCase().includes(searchTerm) ||
              s.specialty?.toLowerCase().includes(searchTerm) ||
              s.role?.toLowerCase().includes(searchTerm)
            )
            .slice(0, 5)
            .map(s => ({
              id: s.id,
              type: 'staff',
              label: s.user?.name || 'Unknown Staff',
              subtitle: s.role || s.specialty || '',
            }))
          results.push(...staff)
        } catch (e) { /* ignore */ }
      }

      // 6. Search Plans (Admin only)
      if (isAdmin) {
        try {
          const plansRes = await api.get('/plans')
          const plans = (plansRes.data || [])
            .filter(p =>
              p.name?.toLowerCase().includes(searchTerm) ||
              p.description?.toLowerCase().includes(searchTerm)
            )
            .slice(0, 3)
            .map(p => ({
              id: p.id,
              type: 'plan',
              label: p.name || 'Plan',
              subtitle: `${p.price || 0} DZD / ${p.duration_days || 0} days`,
            }))
          results.push(...plans)
        } catch (e) { /* ignore */ }
      }

      // 7. Search Classes (Admin only)
      if (isAdmin) {
        try {
          const classesRes = await api.get('/schedule/classes/admin')
          const classes = (classesRes.data || [])
            .filter(c =>
              c.name?.toLowerCase().includes(searchTerm) ||
              c.coach?.toLowerCase().includes(searchTerm) ||
              c.type?.toLowerCase().includes(searchTerm) ||
              c.day_of_week?.toLowerCase().includes(searchTerm)
            )
            .slice(0, 3)
            .map(c => ({
              id: c.id,
              type: 'class',
              label: c.name || 'Class',
              subtitle: `${c.coach || ''} - ${c.day_of_week || ''} ${c.time || ''}`,
            }))
          results.push(...classes)
        } catch (e) { /* ignore */ }
      }

      // Sort results by relevance
      results.sort((a, b) => {
        const order = { member: 0, client: 0, program: 0, payment: 1, staff: 2, plan: 3, class: 4 }
        return (order[a.type] || 99) - (order[b.type] || 99)
      })

      setSearchResults(results.slice(0, 15))
      setShowResults(results.length > 0)

    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
      setShowResults(false)
    } finally {
      setIsSearching(false)
    }
  }

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(searchQuery)
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery && searchQuery.length >= 2) {
      performSearch(searchQuery)
    }
  }

  // ─── NAVIGATION GROUPS ─────────────────────────────────────────

  const adminNavGroups = [
    { title: 'MAIN', items: [{ path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
    {
      title: 'MANAGEMENT',
      items: [
        { path: '/dashboard/members', label: 'Members', icon: Users },
        { path: '/dashboard/plans', label: 'Plans', icon: Dumbbell },
        { path: '/dashboard/staff', label: 'Staff', icon: UserCircle },
        { path: '/dashboard/equipment', label: 'Equipment', icon: Wrench },
        { path: '/dashboard/classes', label: 'Classes', icon: Calendar },
      ]
    },
    {
      title: 'OPERATIONS',
      items: [
        { path: '/dashboard/attendance', label: 'Attendance', icon: Calendar },
        { path: '/dashboard/payments', label: 'Payments', icon: CreditCard },
        { path: '/dashboard/subscriptions', label: 'Subscriptions', icon: Receipt },
      ]
    },
    {
      title: 'ANALYTICS',
      items: [
        { path: '/dashboard/reports', label: 'Reports', icon: BarChart3 },
        { path: '/dashboard/marketing', label: 'Marketing', icon: Megaphone },
      ]
    },
    { title: 'SYSTEM', items: [{ path: '/dashboard/settings', label: 'Settings', icon: Settings }] }
  ]

  const coachNavGroups = [
    { title: 'MAIN', items: [{ path: '/coach', label: 'Dashboard', icon: LayoutDashboard }] },
    {
      title: 'MANAGEMENT',
      items: [
        { path: '/coach/clients', label: 'My Clients', icon: Users },
        { path: '/coach/programs', label: 'Programs', icon: ClipboardList },
        { path: '/coach/classes', label: 'My Classes', icon: Calendar },
        { path: '/coach/availability', label: 'Availability', icon: Clock },
      ]
    },
    { title: 'COMMUNICATION', items: [{ path: '/coach/messages', label: 'Messages', icon: MessageSquare, badge: coachUnreadCount }] },
    { title: 'SETTINGS', items: [{ path: '/coach/profile', label: 'Settings', icon: Settings }] }
  ]

  const memberNavGroups = [
    { title: 'MAIN', items: [{ path: '/member', label: 'Dashboard', icon: LayoutDashboard }] },
    {
      title: 'ACTIONS',
      items: [
        { path: '/member/checkin', label: 'Check In', icon: UserCheck },
        { path: '/member/membership', label: 'My Membership', icon: Crown },
      ]
    },
    {
      title: 'TRAINING',
      items: [
        { path: '/member/program', label: 'My Program', icon: Activity },
        { path: '/member/schedule', label: 'Class Schedule', icon: Calendar },
        { path: '/member/personal-sessions', label: 'Personal Sessions', icon: User },
      ]
    },
    { title: 'NUTRITION', items: [{ path: '/member/nutrition', label: 'Nutrition Plan', icon: Apple }] },
    { title: 'FINANCE', items: [{ path: '/member/payments', label: 'Payments', icon: DollarSign }] },
    { title: 'PROFILE', items: [{ path: '/member/profile', label: 'Profile', icon: User }] }
  ]

  // ─── PAGE TITLES ────────────────────────────────────────────

  const adminPageTitles = {
    '/dashboard': 'Dashboard',
    '/dashboard/members': 'Members',
    '/dashboard/plans': 'Plans',
    '/dashboard/staff': 'Staff',
    '/dashboard/equipment': 'Equipment',
    '/dashboard/classes': 'Classes',
    '/dashboard/attendance': 'Attendance',
    '/dashboard/payments': 'Payments',
    '/dashboard/subscriptions': 'Subscriptions',
    '/dashboard/reports': 'Reports',
    '/dashboard/marketing': 'Marketing',
    '/dashboard/settings': 'Settings'
  }

const coachPageTitles = {
  '/coach': 'Dashboard',
  '/coach/clients': 'My Clients',
  '/coach/clients/:id': 'Client Detail',
  '/coach/programs': 'Programs',
  '/coach/classes': 'My Classes',
  '/coach/messages': 'Messages',
  '/coach/availability': 'Availability',
  '/coach/profile': 'Profile',
  '/coach/settings': 'Settings'
}

  const memberPageTitles = {
    '/member': 'Dashboard',
    '/member/checkin': 'Check In',
    '/member/membership': 'My Membership',
    '/member/program': 'My Program',
    '/member/schedule': 'Class Schedule',
    '/member/personal-sessions': 'Personal Sessions',
    '/member/nutrition': 'Nutrition Plan',
    '/member/payments': 'Payments',
    '/member/profile': 'Profile'
  }

  // Determine which navigation to show
  let navGroups = adminNavGroups
  let pageTitles = adminPageTitles
  let roleDisplay = 'Administrator'
  let dashboardPath = '/dashboard'

  if (isCoach) {
    navGroups = coachNavGroups
    pageTitles = coachPageTitles
    roleDisplay = 'Coach'
    dashboardPath = '/coach'
  } else if (isClient) {
    navGroups = memberNavGroups
    pageTitles = memberPageTitles
    roleDisplay = 'Member'
    dashboardPath = '/member'
  }

  const currentPage = pageTitles[location.pathname] || 'Dashboard'
  const basePath = isAdmin ? '/dashboard' : isCoach ? '/coach' : '/member'

  // Chat functions
  const formatChatTime = (iso) => {
    if (!iso) return ''
    return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  const sendChat = async () => {
    const text = chatInput.trim()
    if (!text || chatSending) return
    setChatSending(true)
    setChatInput('')

    // Optimistic bubble
    const tempId = `temp-${Date.now()}`
    const optimistic = {
      id: tempId, from: 'member', text, pending: true,
      time: formatChatTime(new Date().toISOString()), read: false, tempMatch: text,
    }
    setChatMessages(prev => [...prev, optimistic])
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 30)

    try {
      const res = await api.post('/messages/member/send', { content: text })
      const confirmed = {
        id: res.data.id, from: 'member',
        text: res.data.content,
        time: formatChatTime(res.data.created_at),
        read: res.data.is_read,
      }
      setChatMessages(prev => prev.map(m => m.id === tempId ? confirmed : m))
    } catch (err) {
      console.error('Failed to send message:', err)
      setChatInput(text)
      setChatMessages(prev => prev.filter(m => m.id !== tempId))
    } finally {
      setChatSending(false)
      setTimeout(() => chatInputRef.current?.focus(), 50)
    }
  }

  const sendAttachment = async (file) => {
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    const tempId = `temp-${Date.now()}`
    // Create a local object URL for instant image preview while uploading
    const localPreview = file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    const optimistic = {
      id: tempId, from: 'member', text: null, pending: true,
      attachment: localPreview,
      attachmentName: file.name,
      time: formatChatTime(new Date().toISOString()), read: false,
    }
    setChatMessages(prev => [...prev, optimistic])
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 30)
    try {
      const res = await api.post('/messages/member/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      // Build full URL from attachment_url — strip /api suffix from baseURL to get static root
      const serverBase = (api.defaults?.baseURL || '').replace(/\/api\/?$/, '')
      const rawUrl = res.data.attachment_url || ''
      const attachUrl = rawUrl.startsWith('http')
        ? rawUrl
        : `${serverBase}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`
      // Revoke the temporary object URL to free memory
      if (localPreview) URL.revokeObjectURL(localPreview)
      const confirmed = {
        id: res.data.id, from: 'member',
        text: res.data.content || null,
        attachment: attachUrl,
        attachmentName: file.name,
        time: formatChatTime(res.data.created_at),
        read: false,
      }
      setChatMessages(prev => prev.map(m => m.id === tempId ? confirmed : m))
    } catch (err) {
      console.error('Failed to upload attachment:', err)
      if (localPreview) URL.revokeObjectURL(localPreview)
      setChatMessages(prev => prev.filter(m => m.id !== tempId))
    }
  }

  const openChat = async () => {
    chatOpenRef.current = true
    setChatOpen(true)
    setChatUnread(0)
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'instant' })
      chatInputRef.current?.focus()
    }, 300)

    if (chatMessagesLoaded) return
    try {
      const res = await api.get('/messages/member/conversation')
      const msgs = res.data.map(m => ({
        id: m.id,
        from: m.sender_id === user.id ? 'member' : 'coach',
        text: m.is_deleted ? null : m.content,
        time: formatChatTime(m.created_at),
        read: m.is_read,
        edited: !!m.edited_at,
        deleted: m.is_deleted,
        attachment: m.attachment_url || null,
        attachmentName: m.attachment_name || null,
      }))
      setChatMessages(msgs)
      setChatMessagesLoaded(true)
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'instant' }), 300)
    } catch (err) {
      console.error('Failed to load conversation:', err)
    }
  }

  const closeChat = () => {
    chatOpenRef.current = false
    setChatOpen(false)
  }

  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      background: COLORS.ink, 
      fontFamily: "'Inter', -apple-system, sans-serif" 
    }}>
      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div
          className="mobile-sidebar-overlay"
          onClick={() => setMobileSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 199,
          }}
        />
      )}
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }
        ::-webkit-scrollbar-track { background: transparent; }
        .nav-link { transition: background 0.15s ease, color 0.15s ease, justify-content 0.15s ease; }
        .nav-link:hover { background: var(--surface-2); color: var(--text) !important; }
        .flat-icon-btn { transition: background 0.15s ease, color 0.15s ease; text-decoration: none; }
        .flat-icon-btn:hover { background: var(--surface-2); color: var(--text) !important; }
        .dropdown-item:hover { background: var(--surface-2); }
        .avatar-trigger { transition: background 0.15s ease; }
        .avatar-trigger:hover { background: var(--surface-2); }
        .pill-search-input { transition: background 0.15s ease, box-shadow 0.15s ease; }
        .pill-search-input:focus { background: var(--surface) !important; box-shadow: 0 0 0 3px var(--accent-glow); }
        .crumb-link:hover { color: var(--text) !important; }
        .sidebar-shell { transition: width 0.18s ease; }
        .tooltip-anchor { position: relative; }
        .tooltip-anchor::after {
          content: attr(data-tooltip);
          position: absolute;
          top: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%) translateY(-4px);
          background: var(--surface-3);
          color: var(--text);
          font-size: 11px;
          font-weight: 600;
          padding: 5px 9px;
          border-radius: 6px;
          border: 1px solid var(--border);
          white-space: nowrap;
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transition: opacity 0.12s ease, transform 0.12s ease;
          transition-delay: 0.05s;
          z-index: 200;
          box-shadow: 0 6px 16px rgba(0,0,0,0.25);
        }
        .tooltip-anchor:hover::after, .tooltip-anchor:focus-visible::after {
          opacity: 1;
          visibility: visible;
          transform: translateX(-50%) translateY(0);
        }
        .tooltip-anchor-right::after {
          top: 50%;
          left: calc(100% + 10px);
          transform: translateY(-50%) translateX(-4px);
        }
        .tooltip-anchor-right:hover::after, .tooltip-anchor-right:focus-visible::after {
          transform: translateY(-50%) translateX(0);
        }
        @media (max-width: 920px) {
          .header-search-wrap { order: 3; max-width: 100% !important; flex-basis: 100%; }
        }
        .search-results-scroll::-webkit-scrollbar { width: 4px; }
        .search-results-scroll::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }
        .chat-panel-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100vh;
          background: rgba(0,0,0,0.3);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: 99;
        }
        @media (max-width: 768px) {
          .chat-panel {
            width: 100% !important;
          }
        }

        /* Mobile: full-width overlay sidebar, no icon-only collapsed state */
        @media (max-width: 700px) {
          .hide-mobile { display: none !important; }

          .layout-header {
            padding: 0 16px !important;
            min-height: auto !important;
            display: flex;
            flex-direction: column !important;
            align-items: stretch !important;
          }

          .header-inner {
            flex-wrap: wrap !important;
            gap: 8px !important;
            padding: 10px 0 0;
            align-items: center;
          }

          .header-breadcrumb {
            flex: 1;
            min-width: 0;
          }

          /* Hide back/forward nav arrows on mobile — keep only breadcrumb text */
          .header-breadcrumb .flat-icon-btn {
            display: none !important;
          }

          .header-search-wrap {
            width: 100% !important;
            margin-left: 0 !important;
            order: 10 !important;
            flex: 1 1 100% !important;
            padding: 8px 0 10px;
          }

          .header-actions {
            gap: 2px !important;
            flex-shrink: 0;
          }
          .sidebar-shell {
            position: fixed !important;
            left: 0;
            top: 0;
            height: 100vh !important;
            z-index: 200;
            transform: translateX(-100%);
            transition: transform 0.25s ease !important;
            box-shadow: none;
            width: 252px !important;
          }
          .sidebar-shell.mobile-open {
            transform: translateX(0);
            box-shadow: 8px 0 40px rgba(0,0,0,0.45);
          }
          /* Hide collapse/expand icon buttons inside sidebar on mobile */
          .sidebar-collapse-btn {
            display: none !important;
          }
          .main-content-area {
            padding: 16px !important;
          }
          .layout-header {
            padding: 0 16px !important;
          }
          .mobile-menu-btn {
            display: flex !important;
          }
        }
      `}</style>

      {/* Chat Panel Overlay */}
      {chatOpen && <div className="chat-panel-overlay open" onClick={closeChat} />}

      {/* Sidebar */}
      <aside className={`sidebar-shell${mobileSidebarOpen ? ' mobile-open' : ''}`} style={{
        width: isCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH, flexShrink: 0, background: COLORS.surface,
        borderRight: `1px solid ${COLORS.line}`, display: 'flex', flexDirection: 'column',
        height: '100vh', position: 'sticky', top: 0, overflow: 'hidden',
      }}>
        {/* Logo row + collapse toggle */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          gap: '8px',
          padding: isCollapsed ? '12px 0' : '12px 14px 12px 18px',
          borderBottom: `1px solid ${COLORS.line}`,
          minHeight: HEADER_HEIGHT,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, overflow: 'hidden' }}>
            <img src="/logosmallheader.png" alt="GymFlow Logo" style={{ width: '32px', height: '32px', objectFit: 'contain', flexShrink: 0 }} />
            {!isCollapsed && (
              <div style={{ minWidth: 0, overflow: 'hidden' }}>
                <div style={{ fontSize: '15px', fontWeight: 800, color: COLORS.text, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>GymFlow</div>
                <div style={{ fontSize: '10.5px', color: COLORS.text3, fontWeight: 600, whiteSpace: 'nowrap' }}>{isAdmin ? 'Admin Panel' : isCoach ? 'Coach Portal' : 'Member Portal'}</div>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <FlatIconButton onClick={() => setIsCollapsed(true)} title="Collapse sidebar" className="sidebar-collapse-btn">
              <PanelLeftClose size={17} />
            </FlatIconButton>
          )}
        </div>

        {isCollapsed && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0', borderBottom: `1px solid ${COLORS.line}` }}>
            <FlatIconButton onClick={() => setIsCollapsed(false)} title="Expand sidebar" className="sidebar-collapse-btn">
              <PanelLeftOpen size={17} />
            </FlatIconButton>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: isCollapsed ? '16px 10px' : '16px 12px' }}>
          {navGroups.map((group, groupIdx) => (
            <div key={groupIdx} style={{ marginBottom: '18px' }}>
              {!isCollapsed && (
                <div style={{
                  fontSize: '10px', color: COLORS.text3, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 10px 8px',
                  whiteSpace: 'nowrap',
                }}>
                  {group.title}
                </div>
              )}
              {group.items.map((item) => {
                const Icon = item.icon
                const isRootPath = item.path === '/dashboard' || item.path === '/coach' || item.path === '/member'
                const isActive = isRootPath 
                  ? location.pathname === item.path
                  : location.pathname.startsWith(item.path)
                const hasBadge = Number(item.badge) > 0
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileSidebarOpen(false)}
                    aria-label={isCollapsed ? item.label : undefined}
                    data-tooltip={isCollapsed ? item.label : undefined}
                    className={isCollapsed ? 'nav-link tooltip-anchor tooltip-anchor-right' : 'nav-link'}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      justifyContent: isCollapsed ? 'center' : 'flex-start',
                      padding: isCollapsed ? '10px' : '9px 10px', borderRadius: '9px', marginBottom: '2px',
                      fontSize: '13px', fontWeight: isActive ? 700 : 600,
                      textDecoration: 'none',
                      background: isActive ? COLORS.emberBg : 'transparent',
                      color: isActive ? COLORS.ember : COLORS.text2,
                      position: 'relative',
                    }}
                  >
                    {/* Icon — with dot on collapsed mode */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <Icon size={16} />
                      {hasBadge && isCollapsed && (
                        <div style={{
                          position: 'absolute', top: -5, right: -5,
                          width: 7, height: 7, borderRadius: '2px',
                          background: COLORS.ember,
                          border: `1.5px solid ${COLORS.surface}`,
                          boxShadow: `0 0 6px ${COLORS.ember}80`,
                        }} />
                      )}
                    </div>

                    {/* Label + inline badge */}
                    {!isCollapsed && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.label}
                        </span>
                        {hasBadge && (
                          <span style={{
                            fontSize: '10px', fontWeight: 700,
                            color: isActive ? COLORS.ember : '#fff',
                            background: isActive ? `${COLORS.ember}25` : COLORS.ember,
                            border: isActive ? `1px solid ${COLORS.ember}60` : 'none',
                            borderRadius: '4px',
                            padding: '1px 5px',
                            lineHeight: '16px',
                            letterSpacing: '0.01em',
                            flexShrink: 0,
                          }}>
                            {Number(item.badge) > 99 ? '99+' : item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: isCollapsed ? '14px 10px' : '14px 12px', borderTop: `1px solid ${COLORS.line}` }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 6px', marginBottom: '8px',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
          }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '50%', background: COLORS.emberBg,
              color: COLORS.ember, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: '14px', flexShrink: 0,
            }}>
              {user?.name?.charAt(0) || 'A'}
            </div>
            {!isCollapsed && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: COLORS.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.name || 'Admin'}
                </div>
                <div style={{ fontSize: '11px', color: COLORS.text3 }}>{roleDisplay}</div>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            aria-label={isCollapsed ? 'Logout' : undefined}
            data-tooltip={isCollapsed ? 'Logout' : undefined}
            className={isCollapsed ? 'flat-icon-btn tooltip-anchor tooltip-anchor-right' : 'flat-icon-btn'}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'flex-start',
              gap: '8px', padding: '9px 10px', borderRadius: '9px', border: `1px solid ${COLORS.line}`,
              background: 'transparent', color: COLORS.text2, fontSize: '13px', fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <LogOut size={15} />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-content-area-wrap" style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        background: COLORS.ink,
        paddingRight: chatOpen ? CHAT_PANEL_WIDTH : 0,
        transition: 'padding-right 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div className="layout-header" style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          padding: '0 28px',
          background: COLORS.ink,
          flexShrink: 0,
          minHeight: HEADER_HEIGHT,
          display: 'flex',
          alignItems: 'center',
        }}>
          <div className="header-inner" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '18px', width: '100%' }}>
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileSidebarOpen(o => !o)}
              className="mobile-menu-btn"
              style={{
                display: 'none',
                width: 34, height: 34, borderRadius: 8, border: 'none',
                background: 'transparent', cursor: 'pointer',
                alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-2)', flexShrink: 0,
              }}
            >
              <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
                <rect width="18" height="2" rx="1" fill="currentColor"/>
                <rect y="6" width="12" height="2" rx="1" fill="currentColor"/>
                <rect y="12" width="18" height="2" rx="1" fill="currentColor"/>
              </svg>
            </button>

            {/* Back / forward + breadcrumb */}
            <div className="header-breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, minWidth: 0 }}>
              <FlatIconButton onClick={() => navigate(-1)} title="Go back">
                <ChevronLeft size={17} />
              </FlatIconButton>
              <FlatIconButton onClick={() => navigate(1)} title="Go forward">
                <ChevronRight size={17} />
              </FlatIconButton>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '6px', fontSize: '13px' }}>
                <Link to={basePath} className="crumb-link" style={{ color: COLORS.text3, fontWeight: 500, textDecoration: 'none' }}>
                  {isAdmin ? 'Admin' : isCoach ? 'Coach' : 'Member'}
                </Link>
                <span style={{ color: COLORS.text3 }}>/</span>
                <span style={{ color: COLORS.text, fontWeight: 700 }}>{currentPage}</span>
              </div>
            </div>

            {/* ─── SEARCH BAR WITH RESULTS ─── */}
            <div 
              ref={searchContainerRef}
              className="header-search-wrap"
              style={{ position: 'relative', width: '260px', marginLeft: 'auto' }}
            >
              <form onSubmit={handleSearchSubmit} style={{ position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: COLORS.text3, pointerEvents: 'none' }} />
                <input
                  ref={searchInputRef}
                  type="text"
                  className="pill-search-input"
                  placeholder={isAdmin ? "Search members, payments, plans..." : isCoach ? "Search clients, programs..." : "Search members, classes..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (searchResults.length > 0) {
                      setShowResults(true)
                    }
                  }}
                  style={{
                    width: '100%',
                    height: '38px',
                    borderRadius: '999px',
                    border: 'none',
                    outline: 'none',
                    background: COLORS.surface2,
                    color: COLORS.text,
                    fontSize: '13px',
                    fontFamily: 'inherit',
                    padding: searchQuery ? '0 14px 0 38px' : '0 52px 0 38px',
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('')
                      setSearchResults([])
                      setShowResults(false)
                      searchInputRef.current?.focus()
                    }}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: COLORS.text3,
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
                {!searchQuery && (
                  <span style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '9px',
                    fontWeight: 600,
                    padding: '2px 7px',
                    borderRadius: '999px',
                    background: COLORS.surface3,
                    color: COLORS.text3,
                    border: `1px solid ${COLORS.line}`,
                    fontFamily: "'JetBrains Mono', monospace",
                    pointerEvents: 'none',
                  }}>
                    ⌘K
                  </span>
                )}
              </form>

              {/* Search Results Dropdown */}
              {showResults && searchResults.length > 0 && (
                <SearchResults 
                  results={searchResults} 
                  onClose={() => {
                    setShowResults(false)
                    setSearchResults([])
                    setSearchQuery('')
                  }}
                  isAdmin={isAdmin}
                />
              )}
            </div>

            {/* Actions */}
            <div className="header-actions" style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
              <FlatIconButton onClick={toggleTheme} title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'} className="hide-mobile">
                {isDark ? <Sun size={17} color={COLORS.amber} /> : <Moon size={17} />}
              </FlatIconButton>
              <FlatIconButton onClick={handleRefresh} title="Refresh" className="hide-mobile">
                <RefreshCw size={17} />
              </FlatIconButton>
              <NotificationBell />
              <FlatIconButton to={settingsPath} title="Settings" className="hide-mobile">
                <Settings size={17} />
              </FlatIconButton>

              <div className="hide-mobile" style={{ width: '1px', height: '22px', background: COLORS.line, margin: '0 6px' }} />

              {/* Avatar + dropdown */}
              <div ref={avatarMenuRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setIsAvatarMenuOpen((open) => !open)}
                  className="avatar-trigger"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '4px 8px 4px 4px', borderRadius: '999px', border: 'none',
                    background: 'transparent', cursor: 'pointer',
                  }}
                >
                  <div style={{
                    width: '30px', height: '30px', borderRadius: '50%', background: COLORS.emberBg,
                    color: COLORS.ember, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '13px', flexShrink: 0,
                  }}>
                    {user?.name?.charAt(0) || 'A'}
                  </div>
                  <ChevronDown
                    size={14}
                    color={COLORS.text3}
                    style={{ transform: isAvatarMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }}
                  />
                </button>

                {isAvatarMenuOpen && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 10px)', right: 0, minWidth: '210px',
                    background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: '12px',
                    boxShadow: '0 12px 28px rgba(0,0,0,0.18)', padding: '6px', zIndex: 60,
                  }}>
                    <div style={{ padding: '8px 10px 10px', borderBottom: `1px solid ${COLORS.line}`, marginBottom: '4px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: COLORS.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {user?.name || 'Admin'}
                      </div>
                      <div style={{ fontSize: '11px', color: COLORS.text3 }}>{roleDisplay}</div>
                    </div>
                    <DropdownItem
                      icon={UserCircle}
                      label="View Profile"
                      onClick={() => { setIsAvatarMenuOpen(false); navigate(settingsPath) }}
                    />
                    <DropdownItem
                      icon={Settings}
                      label="Settings"
                      onClick={() => { setIsAvatarMenuOpen(false); navigate(settingsPath) }}
                    />
                    <div style={{ height: '1px', background: COLORS.line, margin: '4px 0' }} />
                    <DropdownItem icon={LogOut} label="Log out" onClick={handleLogout} danger />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="main-content-area" style={{ padding: '24px 28px', flex: 1, minWidth: 0 }}>
          <Outlet />
        </div>
      </div>

      {/* ─── Chat Panel ─── */}
      {isClient && (
        <ChatPanel
          isOpen={chatOpen}
          onClose={closeChat}
          coachInfo={coachInfo}
          user={user}
          chatMessages={chatMessages}
          chatMessagesLoaded={chatMessagesLoaded}
          chatInput={chatInput}
          setChatInput={setChatInput}
          chatSending={chatSending}
          sendChat={sendChat}
          sendAttachment={sendAttachment}
          fileInputRef={fileInputRef}
          chatInputRef={chatInputRef}
          chatEndRef={chatEndRef}
          chatUnread={chatUnread}
        />
      )}

      {/* ─── Chat Toggle Button ─── */}
      {isClient && !chatOpen && (
        <button
          onClick={openChat}
          style={{
            position: 'fixed',
            bottom: '28px',
            right: '28px',
            width: 60,
            height: 60,
            borderRadius: '50%',
            border: 'none',
            background: COLORS.ember,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: `0 8px 32px rgba(251,113,33,0.45)`,
            transition: 'transform 0.15s, box-shadow 0.15s, background 0.15s',
            zIndex: 101,
          }}
          onMouseEnter={e => { 
            e.currentTarget.style.transform = 'scale(1.08)'; 
            e.currentTarget.style.boxShadow = `0 12px 40px rgba(251,113,33,0.55)`
          }}
          onMouseLeave={e => { 
            e.currentTarget.style.transform = 'scale(1)'; 
            e.currentTarget.style.boxShadow = `0 8px 32px rgba(251,113,33,0.45)`
          }}
        >
          <MessageSquare size={24} />
          {!chatOpen && chatUnread > 0 && (
            <div style={{
              position: 'absolute',
              top: -2,
              right: -2,
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: COLORS.red,
              color: '#fff',
              fontSize: '10px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `2px solid ${COLORS.ink}`,
              boxShadow: '0 2px 8px rgba(239,68,68,0.3)',
            }}>
              {chatUnread > 9 ? '9+' : chatUnread}
            </div>
          )}
        </button>
      )}
    </div>
  )
}