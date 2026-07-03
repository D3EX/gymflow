// frontend/src/pages/coach/Messages.jsx

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuthStore } from '../../stores/authStore'
import api from '../../api/client'
import { Search, Send, Circle, ChevronLeft, MoreVertical, Phone, Video, Paperclip, Smile, Check, CheckCheck, Pencil, Trash2, X, Volume2, VolumeX } from 'lucide-react'

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
  emberBg: 'var(--accent-glow)',
  mint: 'var(--green)',
  red: 'var(--red)',
}

// ─── Avatar Component ─────────────────────────────────────────
function Avatar({ initials, size = 40, status }) {
  const colors = ['#fb7121', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444']
  const colorIndex = initials.charCodeAt(0) % colors.length
  const bg = colors[colorIndex] + '22'
  const fg = colors[colorIndex]

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: bg, color: fg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, fontSize: size * 0.35,
      }}>
        {initials}
      </div>
      {status && (
        <div style={{
          position: 'absolute', bottom: 1, right: 1,
          width: 10, height: 10, borderRadius: '50%',
          background: status === 'online' ? COLORS.mint : COLORS.text3,
          border: `2px solid var(--surface)`,
        }} />
      )}
    </div>
  )
}

// ─── Conversation List Item ───────────────────────────────────
function ConvItem({ conv, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
        padding: '12px 16px', border: 'none', cursor: 'pointer', textAlign: 'left',
        background: isActive ? COLORS.emberBg : 'transparent',
        borderLeft: isActive ? `3px solid ${COLORS.ember}` : '3px solid transparent',
        transition: 'background 0.15s ease',
      }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = COLORS.surface2 }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
    >
      <Avatar initials={conv.client.initials} size={42} status={conv.client.status} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: isActive ? COLORS.ember : COLORS.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0, flex: 1 }}>
            {conv.client.name}
          </span>
          <span style={{ fontSize: '11px', color: COLORS.text3, flexShrink: 0 }}>{conv.lastTime}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '12px',
            color: conv.lastMessage ? COLORS.text3 : COLORS.ember,
            fontStyle: conv.lastMessage ? 'normal' : 'italic',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0, flex: 1
          }}>
            {conv.lastMessage || 'Start a conversation'}
          </span>
          {conv.unread > 0 && (
            <div style={{
              minWidth: '18px', height: '18px', borderRadius: '99px', padding: '0 5px',
              background: COLORS.ember, color: '#fff',
              fontSize: '10px', fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {conv.unread}
            </div>
          )}
        </div>
      </div>
    </button>
  )
}

// ─── Message Bubble ───────────────────────────────────────────
function Bubble({ msg, isOwn, pending, onEdit, onDelete }) {
  const [hovered, setHovered] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(msg.text)
  const editRef = useRef(null)

  const startEdit = () => {
    setEditText(msg.text)
    setEditing(true)
    setTimeout(() => {
      if (editRef.current) {
        editRef.current.focus()
        editRef.current.setSelectionRange(editRef.current.value.length, editRef.current.value.length)
      }
    }, 30)
  }

  const confirmEdit = () => {
    const trimmed = editText.trim()
    if (trimmed && trimmed !== msg.text) onEdit(msg.id, trimmed)
    setEditing(false)
  }

  const cancelEdit = () => {
    setEditText(msg.text)
    setEditing(false)
  }

  if (msg.deleted) {
    return (
      <div style={{ display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start', marginBottom: '8px' }}>
        <div className="msg-bubble" style={{
          maxWidth: '68%', padding: '8px 14px',
          border: `1px solid ${COLORS.line}`, borderRadius: '12px',
          fontSize: '12px', color: COLORS.text3, fontStyle: 'italic',
        }}>
          Message deleted
        </div>
      </div>
    )
  }

  return (
    <div
      style={{ display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start', marginBottom: '8px', opacity: pending ? 0.6 : 1, transition: 'opacity 0.15s', position: 'relative' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Action buttons — shown on hover, only for own non-pending messages */}
      {isOwn && !pending && hovered && !editing && (
        <div style={{
          display: 'flex', gap: '2px', alignItems: 'center',
          marginRight: '8px', alignSelf: 'center',
        }}>
          <button
            onClick={startEdit}
            title="Edit"
            style={{
              width: '28px', height: '28px', borderRadius: '50%',
              border: 'none', background: COLORS.surface2, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: COLORS.text3, transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = COLORS.surface3}
            onMouseLeave={e => e.currentTarget.style.background = COLORS.surface2}
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={() => onDelete(msg.id)}
            title="Delete"
            style={{
              width: '28px', height: '28px', borderRadius: '50%',
              border: 'none', background: COLORS.surface2, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: COLORS.red, transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = COLORS.surface3}
            onMouseLeave={e => e.currentTarget.style.background = COLORS.surface2}
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}

      <div className="msg-bubble" style={{
        maxWidth: '68%',
        background: isOwn ? COLORS.ember : COLORS.surface2,
        color: isOwn ? '#fff' : COLORS.text,
        borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        padding: editing ? '8px 10px' : '10px 14px',
        fontSize: '13px', lineHeight: 1.5,
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      }}>
        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <textarea
              ref={editRef}
              value={editText}
              onChange={e => setEditText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); confirmEdit() }
                if (e.key === 'Escape') cancelEdit()
              }}
              style={{
                background: 'transparent', border: 'none', outline: 'none',
                color: '#fff', fontSize: '13px', fontFamily: 'inherit',
                resize: 'none', lineHeight: 1.5, width: '100%', minWidth: '140px', maxWidth: '240px', minHeight: '40px',
              }}
            />
            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
              <button onClick={cancelEdit} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '6px', padding: '3px 10px', color: '#fff', fontSize: '11px', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={confirmEdit} style={{ background: 'rgba(255,255,255,0.3)', border: 'none', borderRadius: '6px', padding: '3px 10px', color: '#fff', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
                Save
              </button>
            </div>
          </div>
        ) : (
          <>
            {msg.attachment && (
              <a
                href={msg.attachment}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  color: isOwn ? '#fff' : COLORS.ember,
                  fontSize: '12px', fontWeight: 600, textDecoration: 'none',
                  marginBottom: msg.text ? '6px' : 0,
                  opacity: 0.9,
                }}
              >
                <Paperclip size={12} />
                {msg.attachmentName || 'Attachment'}
              </a>
            )}
            {msg.pending && !msg.text && msg.attachmentName && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', opacity: 0.7 }}>
                <Paperclip size={12} /> {msg.attachmentName}
              </div>
            )}
            {msg.text && <div>{msg.text}</div>}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', marginTop: '4px' }}>
              {msg.edited && <span style={{ fontSize: '10px', opacity: 0.6 }}>edited ·</span>}
              <span style={{ fontSize: '10px', opacity: 0.7 }}>{pending ? 'Sending…' : msg.time}</span>
              {isOwn && !pending && (
                msg.read
                  ? <CheckCheck size={12} style={{ opacity: 0.8 }} />
                  : <Check size={12} style={{ opacity: 0.5 }} />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Empty State ──────────────────────────────────────────────
function EmptyState() {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '16px',
      color: COLORS.text3, padding: '48px',
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        background: COLORS.emberBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Send size={28} color={COLORS.ember} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '16px', fontWeight: 700, color: COLORS.text, marginBottom: '6px' }}>
          Select a conversation
        </div>
        <div style={{ fontSize: '13px', color: COLORS.text3, maxWidth: '240px', lineHeight: 1.5 }}>
          Choose a client from the list to start messaging
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────
// ─── Helpers ───────────────────────────────────────────────────
function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (sameDay) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('fr-FR', { weekday: 'short' })
}

const POLL_INTERVAL_MS = 5000
const PRESENCE_PING_MS = 20000

export default function Messages() {
  const { user } = useAuthStore()
  const [conversations, setConversations] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [input, setInput] = useState('')
  const [search, setSearch] = useState('')
  const [showSidebar, setShowSidebar] = useState(true)
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const audioRef = useRef(null)

  // Request notification permission once on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
    // Tiny 200ms sine-wave beep generated inline — no external file needed
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    audioRef.current = ctx
  }, [])
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const fileInputRef = useRef(null)
  const activeIdRef = useRef(null) // mirrors activeId for use inside intervals

  const activeConv = conversations.find(c => c.id === activeId)
  const conversationsRef = useRef(conversations)
  useEffect(() => { conversationsRef.current = conversations }, [conversations])

  const filtered = conversations.filter(c =>
    c.client.name.toLowerCase().includes(search.toLowerCase())
  )

  // Fetch conversation list from the backend.
  // Preserves already-loaded message threads instead of wiping them on refresh.
  const fetchConversations = useCallback(async () => {
    try {
      const res = await api.get('/messages/coach/conversations')
      setConversations(prev => res.data.map(c => {
        const existing = prev.find(p => p.id === c.member_id)
        return {
          id: c.member_id,
          client: {
            id: c.member_id,
            name: c.member_name,
            initials: c.member_initials,
            status: c.is_online ? 'online' : 'offline',
            goal: null,
          },
          lastMessage: c.last_message,
          lastTime: formatTime(c.last_time),
          unread: c.member_id === activeIdRef.current ? 0 : (c.unread_count || 0),
          messages: existing ? existing.messages : null, // keep loaded thread if we have one
        }
      }))
      setError(null)
    } catch (err) {
      console.error(err)
      setError('Failed to load conversations.')
    } finally {
      setLoadingConvs(false)
    }
  }, [])

  useEffect(() => {
    fetchConversations()
    // Refresh the list periodically so unread counts / last messages stay current
    const interval = setInterval(fetchConversations, POLL_INTERVAL_MS * 2)
    return () => clearInterval(interval)
  }, [fetchConversations])

  // Presence heartbeat — lets clients see the coach as "online"
  useEffect(() => {
    const ping = () => { api.post('/messages/ping').catch(() => {}) }
    ping()
    const interval = setInterval(ping, PRESENCE_PING_MS)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => { activeIdRef.current = activeId }, [activeId])

  // Scroll to bottom on new message or conversation switch
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeId, activeConv?.messages?.length])

  // Poll the open conversation for new incoming messages
  useEffect(() => {
    if (!activeId) return
    const poll = async () => {
      const conv = conversationsRef.current.find(c => c.id === activeId)
      const lastId = conv?.messages?.length ? conv.messages[conv.messages.length - 1].id : undefined
      // Skip polling until the initial thread load (with its real ids) has finished
      if (lastId !== undefined && typeof lastId === 'string') return
      try {
        const res = await api.get(`/messages/coach/conversation/${activeId}`, { params: { after_id: lastId } })
        if (!res.data.length) return
        const hasIncoming = res.data.some(m => m.receiver_id === user.id && !m.is_read)
        setConversations(prev => prev.map(c => {
          if (c.id !== activeId) return c
          const incoming = res.data
            .filter(m => !(c.messages || []).some(existing => existing.id === m.id))
            .map(m => ({
              id: m.id,
              from: m.sender_id === user.id ? 'coach' : 'client',
              text: m.content,
              time: formatTime(m.created_at),
              read: m.is_read,
              edited: !!m.edited_at,
              deleted: m.is_deleted,
            }))
          if (!incoming.length) return c
          // Play sound + browser notification for messages from the other person
          const newFromClient = incoming.filter(m => m.from !== 'coach')
          if (newFromClient.length) {
            playSound()
            const conv = conversationsRef.current.find(cx => cx.id === activeId)
            fireNotification(conv?.client?.name || 'Client', newFromClient[newFromClient.length - 1].text)
          }
          const last = incoming[incoming.length - 1]
          return { ...c, messages: [...(c.messages || []), ...incoming], lastMessage: last.text, lastTime: last.time }
        }))
        // Mark as read server-side if any incoming messages were unread
        if (hasIncoming) {
          api.patch(`/messages/coach/conversation/${activeId}/read`).catch(() => {})
        }
      } catch (err) {
        // silent - polling failures shouldn't interrupt the UI
      }
    }
    const interval = setInterval(poll, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [activeId, user.id])

  // Open a conversation: fetch its messages from the backend (marks them read server-side)
  const openConversation = async (id) => {
    setActiveId(id)
    setConversations(prev => prev.map(c => c.id === id ? { ...c, unread: 0 } : c))
    if (window.innerWidth < 768) setShowSidebar(false)
    setTimeout(() => inputRef.current?.focus(), 100)

    setLoadingMessages(true)
    try {
      const res = await api.get(`/messages/coach/conversation/${id}`)
      const msgs = res.data.map(m => ({
        id: m.id,
        from: m.sender_id === user.id ? 'coach' : 'client',
        text: m.is_deleted ? null : m.content || null,
        time: formatTime(m.created_at),
        read: m.is_read,
        edited: !!m.edited_at,
        deleted: m.is_deleted,
        attachment: m.attachment_url || null,
        attachmentName: m.attachment_url ? m.attachment_url.split('/').pop() : null,
      }))
      setConversations(prev => prev.map(c => c.id === id ? { ...c, messages: msgs } : c))
    } catch (err) {
      console.error(err)
      setError('Failed to load messages.')
    } finally {
      setLoadingMessages(false)
    }
  }

  const playSound = () => {
    if (!soundEnabled || !audioRef.current) return
    try {
      const ctx = audioRef.current
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.setValueAtTime(880, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15)
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.2)
    } catch (_) {}
  }

  const fireNotification = (senderName, text) => {
    if (!document.hidden) return
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`${senderName}`, { body: text, icon: '/favicon.ico' })
    }
  }

  const editMessage = async (msgId, newText) => {
    // Optimistic update
    setConversations(prev => prev.map(c =>
      c.id === activeId
        ? { ...c, messages: (c.messages || []).map(m => m.id === msgId ? { ...m, text: newText, edited: true } : m) }
        : c
    ))
    try {
      await api.patch(`/messages/messages/${msgId}`, { content: newText })
    } catch (err) {
      console.error(err)
      // Revert on failure — reload the thread
      const res = await api.get(`/messages/coach/conversation/${activeId}`)
      const msgs = res.data.map(m => ({
        id: m.id, from: m.sender_id === user.id ? 'coach' : 'client',
        text: m.content, time: formatTime(m.created_at), read: m.is_read,
        edited: !!m.edited_at, deleted: m.is_deleted,
      }))
      setConversations(prev => prev.map(c => c.id === activeId ? { ...c, messages: msgs } : c))
    }
  }

  const deleteMessage = async (msgId) => {
    // Optimistic update
    setConversations(prev => prev.map(c =>
      c.id === activeId
        ? { ...c, messages: (c.messages || []).map(m => m.id === msgId ? { ...m, deleted: true } : m) }
        : c
    ))
    try {
      await api.delete(`/messages/messages/${msgId}`)
    } catch (err) {
      console.error(err)
      setConversations(prev => prev.map(c =>
        c.id === activeId
          ? { ...c, messages: (c.messages || []).map(m => m.id === msgId ? { ...m, deleted: false } : m) }
          : c
      ))
    }
  }

  const uploadAttachment = async (file) => {
    if (!file || !activeId) return
    const tempId = `temp-${Date.now()}`
    const optimistic = {
      id: tempId, from: 'coach', text: null, pending: true,
      attachmentName: file.name,
      time: formatTime(new Date().toISOString()), read: false,
    }
    setConversations(prev => prev.map(c =>
      c.id === activeId ? { ...c, messages: [...(c.messages || []), optimistic] } : c
    ))
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await api.post(`/messages/coach/send/${activeId}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const confirmed = {
        id: res.data.id, from: 'coach',
        text: res.data.content || null,
        attachment: res.data.attachment_url,
        attachmentName: file.name,
        time: formatTime(res.data.created_at),
        read: false,
        edited: false, deleted: false,
      }
      setConversations(prev => prev.map(c =>
        c.id === activeId
          ? { ...c, messages: (c.messages || []).map(m => m.id === tempId ? confirmed : m) }
          : c
      ))
    } catch (err) {
      console.error(err)
      setConversations(prev => prev.map(c =>
        c.id === activeId
          ? { ...c, messages: (c.messages || []).filter(m => m.id !== tempId) }
          : c
      ))
    }
  }

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || !activeId || sending) return
    setSending(true)
    setInput('')

    // Optimistic bubble: show it immediately, replace with the real one once saved
    const tempId = `temp-${Date.now()}`
    const optimisticMsg = { id: tempId, from: 'coach', text, time: formatTime(new Date().toISOString()), read: false, pending: true }
    setConversations(prev => prev.map(c =>
      c.id === activeId
        ? { ...c, messages: [...(c.messages || []), optimisticMsg], lastMessage: text, lastTime: optimisticMsg.time }
        : c
    ))

    try {
      const res = await api.post(`/messages/coach/send/${activeId}`, { content: text })
      const newMsg = {
        id: res.data.id,
        from: 'coach',
        text: res.data.content,
        time: formatTime(res.data.created_at),
        read: res.data.is_read,
      }
      setConversations(prev => prev.map(c =>
        c.id === activeId
          ? { ...c, messages: (c.messages || []).map(m => m.id === tempId ? newMsg : m), lastMessage: newMsg.text, lastTime: newMsg.time }
          : c
      ))
    } catch (err) {
      console.error(err)
      setError('Failed to send message.')
      setInput(text) // restore on failure
      // Drop the optimistic bubble since it never actually saved
      setConversations(prev => prev.map(c =>
        c.id === activeId
          ? { ...c, messages: (c.messages || []).filter(m => m.id !== tempId) }
          : c
      ))
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread, 0)

  return (
    <div
      className="msgs-shell"
      data-mode={showSidebar ? 'list' : 'chat'}
      style={{
        display: 'flex',
        height: 'calc(100vh - 64px - 48px)', // subtract header + content padding
        background: COLORS.ink,
        borderRadius: '16px',
        border: `1px solid ${COLORS.line}`,
        overflow: 'hidden',
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}>
      <style>{`
        @media (max-width: 768px) {
          .msgs-shell {
            border-radius: 0;
            border: none;
            height: calc(100vh - 64px);
          }
          /* Sidebar becomes its own full-width "screen" on mobile */
          .msg-sidebar {
            width: 100% !important;
          }
          /* Only one panel visible at a time on mobile: list OR chat */
          .msgs-shell[data-mode="list"] .msg-chat-area {
            display: none !important;
          }
          .msgs-shell[data-mode="chat"] .msg-sidebar {
            display: none !important;
          }
          .mobile-back-btn {
            display: flex !important;
          }
          .chat-header {
            padding: 10px 12px !important;
            gap: 8px !important;
          }
          .header-actions button:nth-of-type(1),
          .header-actions button:nth-of-type(2) {
            display: none;
          }
          .msg-scroll {
            padding: 14px 12px !important;
          }
          .msg-bubble {
            max-width: 82% !important;
          }
          .msg-input-bar {
            padding: 10px 12px !important;
          }
          .msg-input-bar .hint-row {
            display: none;
          }
          .conv-list-header {
            padding: 14px 14px 10px !important;
          }
        }
        @media (max-width: 420px) {
          .msg-bubble {
            max-width: 88% !important;
          }
          .chat-header .client-name-text {
            font-size: 13px !important;
          }
        }
      `}</style>

      {/* ─── Left Panel: Conversation List ─── */}
      <div className="msg-sidebar" style={{
        width: '300px',
        flexShrink: 0,
        display: showSidebar ? 'flex' : 'none',
        flexDirection: 'column',
        borderRight: `1px solid ${COLORS.line}`,
        background: COLORS.surface,
      }}>
        {/* Header */}
        <div className="conv-list-header" style={{ padding: '20px 16px 14px', borderBottom: `1px solid ${COLORS.line}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: COLORS.text }}>Messages</div>
              {totalUnread > 0 && (
                <div style={{ fontSize: '11px', color: COLORS.text3 }}>
                  {totalUnread} unread message{totalUnread > 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: COLORS.text3, pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Search clients..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', height: '36px', borderRadius: '999px',
                border: 'none', outline: 'none',
                background: COLORS.surface2,
                color: COLORS.text, fontSize: '13px',
                fontFamily: 'inherit', padding: '0 12px 0 34px',
              }}
            />
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loadingConvs ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: COLORS.text3, fontSize: '13px' }}>
              Loading conversations…
            </div>
          ) : error && conversations.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: COLORS.red, fontSize: '13px' }}>
              {error}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: COLORS.text3, fontSize: '13px' }}>
              No clients found
            </div>
          ) : (
            filtered.map(conv => (
              <ConvItem
                key={conv.id}
                conv={conv}
                isActive={conv.id === activeId}
                onClick={() => openConversation(conv.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* ─── Right Panel: Chat Area ─── */}
      <div className="msg-chat-area" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: COLORS.ink }}>
        {!activeConv ? (
          <EmptyState />
        ) : (
          <>
            {/* Chat Header */}
            <div className="chat-header" style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '14px 20px',
              borderBottom: `1px solid ${COLORS.line}`,
              background: COLORS.surface,
              flexShrink: 0,
            }}>
              {/* Mobile back button */}
              <button
                onClick={() => setShowSidebar(true)}
                style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: COLORS.text3, padding: '4px' }}
                className="mobile-back-btn"
              >
                <ChevronLeft size={20} />
              </button>

              <Avatar initials={activeConv.client.initials} size={40} status={activeConv.client.status} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="client-name-text" style={{ fontSize: '14px', fontWeight: 700, color: COLORS.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeConv.client.name}</div>
                <div style={{ fontSize: '11px', color: activeConv.client.status === 'online' ? COLORS.mint : COLORS.text3, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {activeConv.client.status === 'online' ? '● Online' : '○ Offline'}{activeConv.client.goal ? ` · ${activeConv.client.goal}` : ''}
                </div>
              </div>
              <div className="header-actions" style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                {[{ Icon: Phone, title: 'Call' }, { Icon: Video, title: 'Video' }, { Icon: MoreVertical, title: 'More' }].map(({ Icon, title }) => (
                  <button
                    key={title}
                    title={title}
                    style={{
                      width: '34px', height: '34px', borderRadius: '999px',
                      border: 'none', background: 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', color: COLORS.text3,
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = COLORS.surface2}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Icon size={17} />
                  </button>
                ))}
                <button
                  onClick={() => setSoundEnabled(s => !s)}
                  title={soundEnabled ? 'Mute sounds' : 'Unmute sounds'}
                  style={{
                    width: '34px', height: '34px', borderRadius: '999px',
                    border: 'none', background: 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: soundEnabled ? COLORS.ember : COLORS.text3,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = COLORS.surface2}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {soundEnabled ? <Volume2 size={17} /> : <VolumeX size={17} />}
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="msg-scroll" style={{
              flex: 1, overflowY: 'auto',
              padding: '20px 24px',
              display: 'flex', flexDirection: 'column',
            }}>
              {/* Date separator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ flex: 1, height: '1px', background: COLORS.line }} />
                <span style={{ fontSize: '11px', color: COLORS.text3, fontWeight: 600, whiteSpace: 'nowrap' }}>Today</span>
                <div style={{ flex: 1, height: '1px', background: COLORS.line }} />
              </div>

              {loadingMessages || activeConv.messages === null ? (
                <div style={{ textAlign: 'center', color: COLORS.text3, fontSize: '13px', padding: '20px' }}>
                  Loading messages…
                </div>
              ) : activeConv.messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: COLORS.text3, fontSize: '13px', padding: '32px 20px' }}>
                  No messages yet with {activeConv.client.name}.<br />Send the first one below.
                </div>
              ) : (
                activeConv.messages.map(msg => (
                  <Bubble
                    key={msg.id}
                    msg={msg}
                    isOwn={msg.from === 'coach'}
                    pending={msg.pending}
                    onEdit={editMessage}
                    onDelete={deleteMessage}
                  />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="msg-input-bar" style={{
              padding: '14px 20px',
              borderTop: `1px solid ${COLORS.line}`,
              background: COLORS.surface,
              flexShrink: 0,
            }}>
              <div style={{
                display: 'flex', alignItems: 'flex-end', gap: '10px',
                background: COLORS.surface2,
                borderRadius: '16px',
                padding: '8px 12px',
                border: `1px solid ${COLORS.line}`,
              }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*,.pdf,.doc,.docx"
                  style={{ display: 'none' }}
                  onChange={e => { if (e.target.files?.[0]) uploadAttachment(e.target.files[0]); e.target.value = '' }}
                />
                <button
                  title="Attach file"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: COLORS.text3, padding: '4px', flexShrink: 0,
                    display: 'flex', alignItems: 'center',
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = COLORS.ember}
                  onMouseLeave={e => e.currentTarget.style.color = COLORS.text3}
                >
                  <Paperclip size={17} />
                </button>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Write a message… (Enter to send)"
                  rows={1}
                  style={{
                    flex: 1, border: 'none', outline: 'none',
                    background: 'transparent', color: COLORS.text,
                    fontSize: '13px', fontFamily: 'inherit',
                    resize: 'none', lineHeight: 1.5,
                    maxHeight: '120px', overflowY: 'auto',
                    padding: '4px 0',
                  }}
                  onInput={e => {
                    e.target.style.height = 'auto'
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
                  }}
                />
                <button
                  title="Emoji"
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: COLORS.text3, padding: '4px', flexShrink: 0,
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  <Smile size={17} />
                </button>
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || sending}
                  style={{
                    width: '34px', height: '34px', borderRadius: '50%',
                    border: 'none', cursor: (input.trim() && !sending) ? 'pointer' : 'default',
                    background: (input.trim() && !sending) ? COLORS.ember : COLORS.surface3,
                    color: (input.trim() && !sending) ? '#fff' : COLORS.text3,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, transition: 'background 0.15s, color 0.15s',
                  }}
                >
                  <Send size={15} style={{ transform: 'translateX(1px)' }} />
                </button>
              </div>
              <div className="hint-row" style={{ fontSize: '11px', color: COLORS.text3, marginTop: '6px', paddingLeft: '4px' }}>
                Press <kbd style={{ background: COLORS.surface3, border: `1px solid ${COLORS.line}`, borderRadius: '4px', padding: '1px 5px', fontSize: '10px', fontFamily: 'monospace' }}>Enter</kbd> to send · <kbd style={{ background: COLORS.surface3, border: `1px solid ${COLORS.line}`, borderRadius: '4px', padding: '1px 5px', fontSize: '10px', fontFamily: 'monospace' }}>Shift+Enter</kbd> for new line
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}