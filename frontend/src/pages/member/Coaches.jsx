// frontend/src/pages/member/Coaches.jsx

import { useEffect, useState } from 'react'
import api from '../../api/client'
import {
  Search, UserCircle, Star, Clock, AlertCircle, Award,
  BadgeCheck, Users, Briefcase, CheckCircle, Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'

// certifications/achievements are a free-text column on the backend — could be
// a JSON array, a comma-separated list, or a single freeform paragraph.
// Handle all three so the page doesn't break on whatever format is stored.
function parseListField(value) {
  if (!value) return []
  if (Array.isArray(value)) return value
  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) return parsed
  } catch {
    // not JSON — fall through
  }
  if (typeof value === 'string' && value.includes(',')) {
    return value.split(',').map(s => s.trim()).filter(Boolean)
  }
  return [value]
}

export default function MemberCoaches() {
  const [loading, setLoading] = useState(true)
  const [coaches, setCoaches] = useState([])
  const [search, setSearch] = useState('')
  const [assignedCoach, setAssignedCoach] = useState(null)
  const [coachStatus, setCoachStatus] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)
  const [confirmData, setConfirmData] = useState(null)

  useEffect(() => { fetchAllData() }, [])

  const fetchAllData = async () => {
    setLoading(true)
    await Promise.all([fetchMyCoach(), fetchAvailableCoaches()])
    setLoading(false)
  }

  const fetchMyCoach = async () => {
    try {
      const res = await api.get('/coach/my-coach')
      setCoachStatus(res.data.status)
      setAssignedCoach(res.data.coach || null)
    } catch (error) {
      console.error('Error fetching coach info:', error)
      setCoachStatus(null)
      setAssignedCoach(null)
    }
  }

  const fetchAvailableCoaches = async () => {
    try {
      const res = await api.get('/coach/available')
      setCoaches(res.data || [])
    } catch (error) {
      console.error('Error fetching coaches:', error)
      setCoaches([])
    }
  }

  const showConfirm = (action, data) => {
    setConfirmAction(action)
    setConfirmData(data)
    setShowConfirmModal(true)
  }

  const handleConfirm = async () => {
    setShowConfirmModal(false)
    if (confirmAction === 'assignCoach') {
      await handleAssignCoach(confirmData)
    } else if (confirmAction === 'removeCoach') {
      await handleRemoveCoach()
    }
    setConfirmAction(null)
    setConfirmData(null)
  }

  const handleAssignCoach = async (coachId) => {
    setSubmitting(true)
    try {
      const response = await api.post(`/coach/assign-self/${coachId}`)
      const data = response.data

      if (data.status === 'pending') {
        toast.success(data.message || 'Request sent to coach! Waiting for approval.')
        setCoachStatus('pending')
        const coach = coaches.find(c => c.id === coachId)
        if (coach) setAssignedCoach(coach)
        await fetchAvailableCoaches()
      } else if (data.status === 'approved') {
        toast.success(data.message || 'Coach assigned successfully!')
        setCoachStatus('approved')
        const coach = coaches.find(c => c.id === coachId)
        if (coach) setAssignedCoach(coach)
        await fetchAllData()
      }
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to assign coach'
      if (errorMessage.includes('pending request')) {
        toast.info('You already have a pending request with this coach. Waiting for approval.')
        setCoachStatus('pending')
        const coach = coaches.find(c => c.id === coachId)
        if (coach) setAssignedCoach(coach)
        await fetchAvailableCoaches()
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleRemoveCoach = async () => {
    setSubmitting(true)
    try {
      await api.delete('/coach/unassign-self')
      toast.success('Coach removed successfully')
      setAssignedCoach(null)
      setCoachStatus(null)
      await fetchAllData()
    } catch (error) {
      console.error('Error removing coach:', error)
      const errorMessage = error.response?.data?.detail || error.response?.data?.message || 'Failed to remove coach'
      toast.error(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  const filteredCoaches = coaches.filter(coach =>
    coach.name.toLowerCase().includes(search.toLowerCase()) ||
    coach.specialty?.toLowerCase().includes(search.toLowerCase()) ||
    coach.bio?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div style={{
        background: 'var(--bg)', minHeight: '100vh', display: 'flex',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px',
      }}>
        <Loader2 size={32} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ color: 'var(--text-3)', fontSize: '13px', fontWeight: 600 }}>Loading coaches…</span>
      </div>
    )
  }

  return (
    <div style={{
      background: 'var(--bg)', color: 'var(--text)',
      fontFamily: "'Inter', -apple-system, sans-serif",
      minHeight: '100vh', boxSizing: 'border-box',
    }}>
      <style>{`
        * { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .coach-card-page {
          transition: all 0.2s ease;
        }
        .coach-card-page:hover {
          border-color: color-mix(in srgb, var(--accent) 33%, transparent) !important;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.18);
        }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: '22px' }}>
        <p style={{ fontSize: '11px', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, marginBottom: '6px' }}>
          Coaching
        </p>
        <h1 style={{ fontSize: 'clamp(21px, 5.5vw, 28px)', fontWeight: 800, letterSpacing: '-0.02em', margin: 0, color: 'var(--text)' }}>
          Coaches
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>
          {coachStatus === 'approved'
            ? 'Browse other coaches or manage your current one'
            : 'Browse available coaches and choose the right fit for you'}
        </p>
      </div>

      {/* Current coach banner */}
      {assignedCoach && (coachStatus === 'approved' || coachStatus === 'pending') && (
        <div style={{
          padding: '16px 20px', marginBottom: '20px', borderRadius: '14px',
          background: coachStatus === 'approved' ? 'color-mix(in srgb, var(--green) 5%, transparent)' : 'color-mix(in srgb, var(--blue) 5%, transparent)',
          border: `1px solid ${coachStatus === 'approved' ? 'color-mix(in srgb, var(--green) 20%, transparent)' : 'color-mix(in srgb, var(--blue) 20%, transparent)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '50%', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '16px',
              background: coachStatus === 'approved' ? 'color-mix(in srgb, var(--green) 10%, transparent)' : 'color-mix(in srgb, var(--blue) 10%, transparent)',
              color: coachStatus === 'approved' ? 'var(--green)' : 'var(--blue)',
            }}>
              {assignedCoach.name?.charAt(0) || '?'}
            </div>
            <div>
              <p style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, margin: 0 }}>
                {coachStatus === 'approved' ? 'Your Coach' : 'Pending Request'}
              </p>
              <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                {assignedCoach.name}
              </p>
            </div>
          </div>
          {coachStatus === 'approved' && (
            <button
              onClick={() => showConfirm('removeCoach')}
              disabled={submitting}
              style={{
                padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)',
                background: 'transparent', color: 'var(--text-2)', fontSize: '12px',
                fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1,
              }}
            >
              Remove Coach
            </button>
          )}
          {coachStatus === 'pending' && (
            <span style={{
              padding: '4px 12px', borderRadius: '6px', background: 'color-mix(in srgb, var(--blue) 10%, transparent)',
              color: 'var(--blue)', fontSize: '11px', fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: '4px',
            }}>
              <Clock size={12} /> Waiting for approval
            </span>
          )}
        </div>
      )}

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
        <input
          type="text"
          placeholder="Search coaches by name or specialty…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%', padding: '12px 14px 12px 42px', borderRadius: '12px',
            border: '1px solid var(--border)', background: 'var(--surface)',
            color: 'var(--text)', fontSize: '14px', boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Coach grid */}
      {filteredCoaches.length === 0 ? (
        <div style={{
          padding: '60px 20px', textAlign: 'center', borderRadius: '16px',
          background: 'var(--surface)', border: '1px solid var(--border)',
        }}>
          <UserCircle size={40} color="var(--text-3)" style={{ margin: '0 auto 14px', opacity: 0.4 }} />
          <p style={{ fontSize: '14px', color: 'var(--text-2)', fontWeight: 600 }}>
            {search ? `No coaches match "${search}"` : 'No coaches available right now'}
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px',
        }}>
          {filteredCoaches.map((coach) => {
            const coachId = Number(coach.id)
            const currentCoachId = Number(assignedCoach?.id)
            const isApproved = coachStatus === 'approved' && currentCoachId === coachId
            const isPending = coachStatus === 'pending' && currentCoachId === coachId
            const achievements = parseListField(coach.achievements)
            const certifications = parseListField(coach.certifications)

            return (
              <div
                key={coach.id}
                className="coach-card-page"
                style={{
                  padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', height: '100%',
                  background: isApproved ? 'color-mix(in srgb, var(--green) 5%, transparent)' : isPending ? 'color-mix(in srgb, var(--blue) 5%, transparent)' : 'var(--surface)',
                  border: `1px solid ${isApproved ? 'color-mix(in srgb, var(--green) 20%, transparent)' : isPending ? 'color-mix(in srgb, var(--blue) 20%, transparent)' : 'var(--border)'}`,
                }}
              >
                {/* Avatar + name + specialty */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                  {coach.avatar ? (
                    <img
                      src={coach.avatar}
                      alt={coach.name}
                      style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                    />
                  ) : (
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '50%', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '18px', flexShrink: 0,
                      background: isApproved ? 'color-mix(in srgb, var(--green) 10%, transparent)' : isPending ? 'color-mix(in srgb, var(--blue) 10%, transparent)' : 'color-mix(in srgb, var(--accent) 10%, transparent)',
                      color: isApproved ? 'var(--green)' : isPending ? 'var(--blue)' : 'var(--accent)',
                    }}>
                      {coach.name.charAt(0)}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                      {coach.name}
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--text-3)', margin: 0 }}>
                      {coach.specialty || 'General Fitness'}
                    </p>
                  </div>
                </div>

                {/* Rating / clients / experience */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  {coach.rating > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--amber)', fontWeight: 700 }}>
                      <Star size={13} fill="var(--amber)" /> {coach.rating}
                    </span>
                  )}
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-3)' }}>
                    <Users size={13} /> {coach.client_count || 0} clients
                  </span>
                  {coach.experience && coach.experience !== '0' && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-3)' }}>
                      <Briefcase size={13} /> {coach.experience} exp.
                    </span>
                  )}
                </div>

                {/* Bio */}
                {coach.bio && (
                  <p style={{ fontSize: '12.5px', color: 'var(--text-2)', lineHeight: 1.5, marginBottom: '12px' }}>
                    {coach.bio}
                  </p>
                )}

                {/* Certifications */}
                {certifications.length > 0 && (
                  <div style={{ marginBottom: '10px' }}>
                    <p style={{ fontSize: '10.5px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <BadgeCheck size={12} /> Certifications
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {certifications.map((cert, idx) => (
                        <span key={idx} style={{
                          fontSize: '11px', padding: '3px 9px', borderRadius: '6px',
                          background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border)',
                        }}>
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Achievements */}
                {achievements.length > 0 && (
                  <div style={{ marginBottom: '14px' }}>
                    <p style={{ fontSize: '10.5px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Award size={12} /> Achievements
                    </p>
                    <ul style={{ margin: 0, paddingLeft: '16px' }}>
                      {achievements.map((item, idx) => (
                        <li key={idx} style={{ fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.6 }}>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action button — pinned to bottom */}
                <div style={{ marginTop: 'auto' }}>
                  {isApproved ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--green)', fontSize: '12px', fontWeight: 700 }}>
                      <CheckCircle size={14} /> Currently your coach
                    </div>
                  ) : isPending ? (
                    <div style={{
                      padding: '10px', borderRadius: '8px', background: 'color-mix(in srgb, var(--blue) 10%, transparent)',
                      color: 'var(--blue)', fontSize: '12px', fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    }}>
                      <Clock size={13} /> Request pending
                    </div>
                  ) : (
                    <button
                      onClick={() => showConfirm('assignCoach', coach.id)}
                      disabled={submitting}
                      style={{
                        width: '100%', padding: '10px', borderRadius: '8px', border: 'none',
                        background: 'var(--accent)', color: '#FFFFFF', fontSize: '12.5px',
                        fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer',
                        opacity: submitting ? 0.6 : 1, transition: 'opacity 0.2s',
                      }}
                      onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.opacity = '0.85' }}
                      onMouseLeave={(e) => { if (!submitting) e.currentTarget.style.opacity = '1' }}
                    >
                      {coachStatus === 'approved' ? `Switch to ${coach.name}` : `Choose ${coach.name}`}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Confirm modal */}
      {showConfirmModal && (
        <div
          onClick={() => setShowConfirmModal(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 1001, padding: '20px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '18px', maxWidth: '420px', width: '100%',
              textAlign: 'center', boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
                background: confirmAction === 'removeCoach' ? 'color-mix(in srgb, var(--red) 10%, transparent)' : 'color-mix(in srgb, var(--amber) 10%, transparent)',
                color: confirmAction === 'removeCoach' ? 'var(--red)' : 'var(--amber)',
              }}>
                <AlertCircle size={28} />
              </div>

              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)', marginBottom: '8px' }}>
                {confirmAction === 'assignCoach' && (coachStatus === 'approved' ? 'Switch Coaches?' : 'Choose This Coach?')}
                {confirmAction === 'removeCoach' && 'Remove Your Coach?'}
              </h3>

              <p style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.6, marginBottom: '20px' }}>
                {confirmAction === 'assignCoach' && (
                  <>
                    Are you sure you want to request <strong>{coaches.find(c => c.id === confirmData)?.name}</strong> as your coach?
                    {coachStatus === 'approved' && ' This will replace your current coach.'}
                    {' '}They'll need to approve your request before you can start training together.
                  </>
                )}
                {confirmAction === 'removeCoach' && (
                  <>
                    Are you sure you want to remove <strong>{assignedCoach?.name}</strong> as your coach?
                    You won't be able to book personal sessions until you choose a new one.
                  </>
                )}
              </p>

              <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  style={{
                    flex: 1, padding: '10px 20px', borderRadius: '10px',
                    border: '1px solid var(--border)', background: 'transparent',
                    color: 'var(--text-2)', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={submitting}
                  style={{
                    flex: 1, padding: '10px 20px', borderRadius: '10px', border: 'none',
                    background: confirmAction === 'removeCoach' ? 'var(--red)' : 'var(--accent)',
                    color: '#FFFFFF', fontSize: '13px', fontWeight: 700,
                    cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1,
                  }}
                >
                  {confirmAction === 'assignCoach' && 'Confirm'}
                  {confirmAction === 'removeCoach' && 'Remove'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
