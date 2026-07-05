// frontend/src/pages/member/PersonalSessions.jsx

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Calendar, Clock, User, CheckCircle, XCircle, Plus, 
  AlertCircle, Loader2, ChevronRight, Star, Search, 
  UserCircle, Award, Users, Mail, Phone, Dumbbell,
  AlertTriangle, ChevronLeft, ChevronRight as ChevronRightIcon,
  Zap, Ban, Circle
} from 'lucide-react'
import api from '../../api/client'
import toast from 'react-hot-toast'

export default function MemberPersonalSessions() {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showBooking, setShowBooking] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)
  const [confirmData, setConfirmData] = useState(null)
  const [assignedCoach, setAssignedCoach] = useState(null)
  const [hasCoach, setHasCoach] = useState(false)
  const [coaches, setCoaches] = useState([])
  const [searchCoach, setSearchCoach] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [coachAvailability, setCoachAvailability] = useState([])
  const [availableDates, setAvailableDates] = useState([])
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedDayAvailability, setSelectedDayAvailability] = useState(null)
  const [timeSlots, setTimeSlots] = useState([])
  const [coachStatus, setCoachStatus] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [bookedSlots, setBookedSlots] = useState([])
  const [bookingForm, setBookingForm] = useState({
    date: '',
    time: '',
    end_time: '',
    notes: ''
  })

  const [currentPage, setCurrentPage] = useState(1)
  const SESSIONS_PER_PAGE = 5

  useEffect(() => {
    fetchAllData()
  }, [])

  useEffect(() => {
    if (hasCoach && assignedCoach) {
      fetchCoachAvailability()
    }
  }, [hasCoach, assignedCoach])

  useEffect(() => {
    if (selectedDate && hasCoach && assignedCoach) {
      fetchBookedSlots(selectedDate)
    }
  }, [selectedDate])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      const coachRes = await api.get('/coach/my-coach')
      console.log('Coach response:', coachRes.data)
      
      const status = coachRes.data.status
      setCoachStatus(status)
      
      if (coachRes.data.coach) {
        setAssignedCoach(coachRes.data.coach)
      }
      
      if (status === 'approved') {
        setHasCoach(true)
      } else if (status === 'pending') {
        setHasCoach(false)
        if (coachRes.data.coach) {
          toast.info(`You have a pending request with ${coachRes.data.coach.name}. Waiting for approval.`)
        }
      } else {
        setHasCoach(false)
        setAssignedCoach(null)
      }
      
      await fetchAvailableCoaches()
      
      if (status === 'approved') {
        try {
          const sessionsRes = await api.get('/personal-sessions/my')
          const sorted = (sessionsRes.data || []).slice().sort((a, b) => {
            const da = new Date(`${a.date}T${a.time || '00:00'}`)
            const db2 = new Date(`${b.date}T${b.time || '00:00'}`)
            return db2 - da
          })
          setSessions(sorted)
          setCurrentPage(1)
        } catch (sessionError) {
          console.error('Error fetching sessions:', sessionError)
          setSessions([])
        }
      } else {
        setSessions([])
      }
      
    } catch (error) {
      console.error('Error fetching data:', error)
      if (error.response?.status !== 404) {
        toast.error('Failed to load data')
      }
      setHasCoach(false)
      setAssignedCoach(null)
      setCoachStatus(null)
      setSessions([])
    } finally {
      setLoading(false)
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

  const fetchCoachAvailability = async () => {
    if (!assignedCoach?.id) return
    
    try {
      const response = await api.get(`/coach/${assignedCoach.id}/availability`)
      setCoachAvailability(response.data || [])
      generateAvailableDates(response.data)
    } catch (error) {
      console.error('Error fetching coach availability:', error)
      setCoachAvailability([])
    }
  }

  const fetchBookedSlots = async (date) => {
    try {
      console.log('Fetching booked slots for date:', date)
      const response = await api.get(`/personal-sessions/coach/booked/${date}`)
      console.log('Booked slots response:', response.data)
      setBookedSlots(response.data || [])
    } catch (error) {
      console.error('Error fetching booked slots:', error)
      setBookedSlots([])
    }
  }

  const generateAvailableDates = (availability) => {
    const dates = []
    const today = new Date()
    
    const dayMap = {
      'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4,
      'Friday': 5, 'Saturday': 6, 'Sunday': 0
    }
    
    const availableDays = availability.map(av => dayMap[av.day])
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      const dayIndex = date.getDay()
      
      if (availableDays.includes(dayIndex)) {
        const dateStr = date.toISOString().split('T')[0]
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' })
        const av = availability.find(a => a.day === dayName)
        dates.push({
          date: dateStr,
          day: dayName,
          start: av?.start,
          end: av?.end
        })
      }
    }
    
    setAvailableDates(dates)
  }

  const generateTimeSlots = (start, end, date) => {
    const slots = []
    const startHour = parseInt(start.split(':')[0])
    const startMinute = parseInt(start.split(':')[1])
    const endHour = parseInt(end.split(':')[0])
    const endMinute = parseInt(end.split(':')[1])
    
    const startTotal = startHour * 60 + startMinute
    const endTotal = endHour * 60 + endMinute
    
    const bookedForDate = bookedSlots || []
    console.log('Generating slots for date:', date, 'Booked slots:', bookedForDate)
    
    let current = startTotal
    while (current + 60 <= endTotal) {
      const hour = Math.floor(current / 60)
      const minute = current % 60
      const endHour2 = Math.floor((current + 60) / 60)
      const endMinute2 = (current + 60) % 60
      
      const slotStart = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
      const slotEnd = `${String(endHour2).padStart(2, '0')}:${String(endMinute2).padStart(2, '0')}`
      
      const isBooked = bookedForDate.some(booked => {
        return booked.time === slotStart
      })
      
      slots.push({
        start: slotStart,
        end: slotEnd,
        label: `${slotStart} - ${slotEnd}`,
        isBooked: isBooked
      })
      
      current += 60
    }
    
    return slots
  }

  const selectDate = (dateObj) => {
    setSelectedDate(dateObj.date)
    setSelectedDayAvailability(dateObj)
    setSelectedSlot(null)
    setTimeSlots([])
    setBookedSlots([])
    setBookingForm({
      ...bookingForm,
      date: dateObj.date,
      time: '',
      end_time: ''
    })
    
    // Generate time slots first
    if (dateObj.start && dateObj.end) {
      const slots = generateTimeSlots(dateObj.start, dateObj.end, dateObj.date)
      setTimeSlots(slots)
    }
    
    // Then fetch booked slots (this will trigger the useEffect below)
    if (hasCoach && assignedCoach) {
      fetchBookedSlots(dateObj.date)
    }
  }

  useEffect(() => {
    if (selectedDate && selectedDayAvailability && selectedDayAvailability.start && selectedDayAvailability.end) {
      console.log('Regenerating slots with bookedSlots:', bookedSlots)
      const slots = generateTimeSlots(
        selectedDayAvailability.start, 
        selectedDayAvailability.end, 
        selectedDate
      )
      setTimeSlots(slots)
    }
  }, [bookedSlots])

  const selectSlot = (slot) => {
    if (slot.isBooked) {
      toast.error('This time slot is already booked')
      return
    }
    setSelectedSlot(slot)
    setBookingForm({
      ...bookingForm,
      time: slot.start,
      end_time: slot.end
    })
  }

  const handleBook = async (e) => {
    e.preventDefault()
    
    if (!bookingForm.date || !bookingForm.time || !bookingForm.end_time) {
      toast.error('Please select a date and time slot')
      return
    }

    setSubmitting(true)
    try {
      console.log('Booking payload:', bookingForm)
      const response = await api.post('/personal-sessions/book', bookingForm)
      console.log('Booking response:', response.data)
      toast.success('Session booked successfully!')
      
      // Refresh booked slots for the selected date
      if (selectedDate) {
        await fetchBookedSlots(selectedDate)
      }
      
      // Refresh sessions list
      const sessionsRes = await api.get('/personal-sessions/my')
      const sorted = (sessionsRes.data || []).slice().sort((a, b) => {
        const da = new Date(`${a.date}T${a.time || '00:00'}`)
        const db2 = new Date(`${b.date}T${b.time || '00:00'}`)
        return db2 - da
      })
      setSessions(sorted)
      setCurrentPage(1)
      
      setShowBooking(false)
      setBookingForm({ date: '', time: '', end_time: '', notes: '' })
      setSelectedSlot(null)
      
    } catch (error) {
      console.error('Error response:', error.response)
      
      const errorMessage = error.response?.data?.detail || 
                           error.response?.data?.message || 
                           error.message || 
                           'Failed to book session'
      toast.error(errorMessage)
    } finally {
      setSubmitting(false)
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
    } else if (confirmAction === 'cancelSession') {
      await handleCancelSession(confirmData)
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
        setHasCoach(false)
        
        const coach = coaches.find(c => c.id === coachId)
        if (coach) {
          setAssignedCoach(coach)
        }
        
        setShowFindCoach(false)
        await fetchAvailableCoaches()
      } else if (data.status === 'approved') {
        toast.success(data.message || 'Coach assigned successfully!')
        setCoachStatus('approved')
        setHasCoach(true)
        
        const coach = coaches.find(c => c.id === coachId)
        if (coach) {
          setAssignedCoach(coach)
        }
        
        setShowFindCoach(false)
        await fetchAllData()
      }
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to assign coach'
      
      if (errorMessage.includes('pending request')) {
        toast.info('You already have a pending request with this coach. Waiting for approval.')
        setCoachStatus('pending')
        setHasCoach(false)
        
        const coach = coaches.find(c => c.id === coachId)
        if (coach) {
          setAssignedCoach(coach)
        }
        
        setShowFindCoach(false)
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
      console.log('Removing coach...')
      const response = await api.delete('/coach/unassign-self')
      console.log('Remove coach response:', response.data)
      
      toast.success('Coach removed successfully')
      
      setHasCoach(false)
      setAssignedCoach(null)
      setCoachStatus(null)
      setSessions([])
      setShowConfirmModal(false)
      
      await fetchAllData()
      
    } catch (error) {
      console.error('Error removing coach:', error)
      console.error('Error response:', error.response)
      
      let errorMessage = 'Failed to remove coach'
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      }
      toast.error(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancelSession = async (sessionId) => {
    try {
      await api.put(`/personal-sessions/${sessionId}/cancel`)
      toast.success('Session cancelled')
      fetchAllData()
    } catch (error) {
      toast.error('Failed to cancel session')
    }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-GB', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    })
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'scheduled':
        return { label: 'Scheduled', color: 'var(--blue)', icon: Clock }
      case 'completed':
        return { label: 'Completed', color: 'var(--green)', icon: CheckCircle }
      case 'cancelled':
        return { label: 'Cancelled', color: 'var(--red)', icon: XCircle }
      default:
        return { label: status || 'Scheduled', color: 'var(--text-3)', icon: Clock }
    }
  }

  const filteredCoaches = coaches.filter(coach =>
    coach.name.toLowerCase().includes(searchCoach.toLowerCase()) ||
    coach.specialty?.toLowerCase().includes(searchCoach.toLowerCase()) ||
    coach.bio?.toLowerCase().includes(searchCoach.toLowerCase())
  )

  const goToPreviousMonth = () => {
    const newMonth = new Date(currentMonth)
    newMonth.setMonth(newMonth.getMonth() - 1)
    setCurrentMonth(newMonth)
  }

  const goToNextMonth = () => {
    const newMonth = new Date(currentMonth)
    newMonth.setMonth(newMonth.getMonth() + 1)
    setCurrentMonth(newMonth)
  }

  const getDatesForMonth = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    const dates = []
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      dates.push(null)
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const dateObj = new Date(year, month, i)
      const dateStr = dateObj.toISOString().split('T')[0]
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' })
      const isAvailable = availableDates.some(d => d.date === dateStr)
      const availability = coachAvailability.find(a => a.day === dayName)
      
      dates.push({
        day: i,
        date: dateStr,
        isAvailable: isAvailable,
        start: availability?.start,
        end: availability?.end,
        isToday: dateStr === new Date().toISOString().split('T')[0]
      })
    }
    
    return dates
  }

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
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%',
          border: '3px solid var(--border)',
          borderTopColor: 'var(--accent)',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ color: 'var(--text-3)', fontSize: '13px', fontWeight: 600 }}>Loading sessions...</span>
      </div>
    )
  }

  return (
    <div style={{
      background: 'var(--bg)',
      color: 'var(--text)',
      padding: '2px',
      minHeight: '100vh',
      boxSizing: 'border-box',
      fontFamily: "'Inter', -apple-system, sans-serif",
      width: '100%',
      overflowX: 'hidden',
    }}>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }
        .form-input {
          width: 100%;
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: var(--surface-2);
          color: var(--text);
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }
        .form-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent)22;
        }
        .form-input::placeholder {
          color: var(--text-3);
        }
        .form-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .form-label {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-3);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          display: block;
          margin-bottom: 5px;
        }
        .btn-primary {
          padding: 10px 20px;
          border-radius: 10px;
          border: none !important;
          background: var(--accent) !important;
          color: #FFFFFF !important;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          justify-content: center;
          white-space: nowrap;
          min-height: 44px;
        }
        .btn-primary:hover:not(:disabled) {
          opacity: 0.85 !important;
          transform: translateY(-2px);
        }
        .btn-primary:disabled {
          opacity: 0.5 !important;
          cursor: not-allowed;
        }
        .btn-secondary {
          padding: 10px 20px;
          border-radius: 10px;
          border: 1px solid var(--border) !important;
          background: transparent !important;
          color: var(--text-2) !important;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          min-height: 44px;
        }
        .btn-secondary:hover {
          border-color: var(--text) !important;
          color: var(--text) !important;
        }
        .btn-danger {
          padding: 8px 16px;
          border-radius: 8px;
          border: none !important;
          background: var(--red) !important;
          color: #FFFFFF !important;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          justify-content: center;
          min-height: 38px;
        }
        .btn-danger:hover:not(:disabled) {
          opacity: 0.85 !important;
          transform: translateY(-2px);
        }
        .btn-outline-primary {
          padding: 8px 16px;
          border-radius: 8px;
          border: 1px solid var(--accent) !important;
          background: transparent !important;
          color: var(--accent) !important;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          justify-content: center;
          min-height: 38px;
        }
        .btn-outline-primary:hover:not(:disabled) {
          background: var(--accent) !important;
          color: #FFFFFF !important;
          transform: translateY(-2px);
        }
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.75);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
          animation: fadeIn 0.2s ease;
        }
        .modal-content {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 18px;
          max-width: 560px;
          width: 100%;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 24px 64px rgba(0,0,0,0.5);
          animation: slideUp 0.25s ease;
        }
        .modal-body {
          padding: 24px;
          overflow-y: auto;
          flex: 1;
        }
        .modal-footer {
          padding: 16px 24px;
          border-top: 1px solid var(--border);
          background: var(--surface-2);
          display: flex;
          gap: 12px;
          border-radius: 0 0 18px 18px;
          flex-shrink: 0;
        }
        .modal-footer .btn-primary {
          flex: 1;
        }
        .modal-footer .btn-secondary {
          min-width: 100px;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .session-card {
          transition: all 0.2s ease;
        }
        .session-card:hover {
          border-color: var(--accent)55 !important;
          transform: translateX(4px);
        }
        .coach-card {
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .coach-card:hover {
          border-color: var(--accent)55 !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 20px var(--accent-glow);
        }
        .search-wrap {
          position: relative;
        }
        .search-wrap input {
          padding-left: 40px;
        }
        .search-wrap svg {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-3);
        }
        .coach-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 16px;
          flex-shrink: 0;
        }
        .coach-avatar-assigned {
          background: var(--green)1A;
          color: var(--green);
        }
        .coach-avatar-pending {
          background: var(--blue)1A;
          color: var(--blue);
        }
        .coach-avatar-available {
          background: var(--accent)1A;
          color: var(--accent);
        }
        .badge-status {
          padding: 3px 10px;
          border-radius: 99px;
          font-size: 10px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
        }
        .badge-scheduled {
          background: var(--blue)1A;
          color: var(--blue);
        }
        .badge-completed {
          background: var(--green)1A;
          color: var(--green);
        }
        .badge-cancelled {
          background: var(--red)1A;
          color: var(--red);
        }
        .confirm-modal-content {
          max-width: 420px;
          text-align: center;
        }
        .confirm-icon {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }
        .confirm-icon-warning {
          background: var(--amber)1A;
          color: var(--amber);
        }
        .confirm-icon-danger {
          background: var(--red)1A;
          color: var(--red);
        }
        .confirm-icon-info {
          background: var(--blue)1A;
          color: var(--blue);
        }
        .confirm-title {
          font-size: 18px;
          font-weight: 800;
          color: var(--text);
          margin-bottom: 8px;
        }
        .confirm-message {
          font-size: 14px;
          color: var(--text-2);
          line-height: 1.6;
          margin-bottom: 20px;
        }
        .confirm-actions {
          display: flex;
          gap: 12px;
        }
        .confirm-actions .btn-primary {
          flex: 1;
        }
        .confirm-actions .btn-secondary {
          min-width: 100px;
        }
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
          margin-top: 8px;
        }
        .calendar-day {
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: default;
          transition: all 0.15s ease;
          border: 2px solid transparent;
          position: relative;
        }
        .calendar-day.available {
          cursor: pointer;
          background: var(--surface-2);
          color: var(--text);
        }
        .calendar-day.available:hover {
          border-color: var(--accent);
          transform: scale(1.05);
        }
        .calendar-day.available.selected {
          background: var(--accent);
          color: #FFFFFF;
          border-color: var(--accent);
        }
        .calendar-day.unavailable {
          color: var(--text-3);
          opacity: 0.4;
        }
        .calendar-day.empty {
          visibility: hidden;
        }
        .calendar-day.today {
          border-color: var(--accent)55;
        }
        .calendar-day .dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--green);
          position: absolute;
          bottom: 3px;
          left: 50%;
          transform: translateX(-50%);
        }
        .calendar-day.selected .dot {
          background: #FFFFFF;
        }
        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .calendar-header button {
          padding: 4px 8px;
          border-radius: 6px;
          border: 1px solid var(--border);
          background: var(--surface-2);
          color: var(--text-2);
          cursor: pointer;
          transition: all 0.15s ease;
          min-height: 32px;
          min-width: 32px;
        }
        .calendar-header button:hover {
          border-color: var(--text-3);
          color: var(--text);
        }
        .calendar-header .month-label {
          font-size: 15px;
          font-weight: 700;
          color: var(--text);
        }
        .day-label {
          text-align: center;
          font-size: 10px;
          font-weight: 700;
          color: var(--text-3);
          text-transform: uppercase;
          padding: 4px 0;
        }
        .date-day-container {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
        }
        .slots-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-top: 8px;
        }
        .slot-btn {
          padding: 10px 12px;
          border-radius: 8px;
          border: 2px solid var(--border);
          background: var(--surface-2);
          color: var(--text);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          min-height: 44px;
        }
        .slot-btn:hover:not(.slot-selected):not(.slot-booked):not(:disabled) {
          border-color: var(--accent)55;
          background: var(--surface-3);
        }
        .slot-btn.slot-selected {
          border-color: var(--accent);
          background: var(--accent);
          color: #FFFFFF;
        }
        .slot-btn.slot-selected .booked-text {
          color: #FFFFFF;
        }
        .slot-btn.slot-booked {
          border-color: var(--red)33;
          background: var(--red)0D;
          color: var(--text-3);
          cursor: not-allowed;
          opacity: 0.6;
        }
        .slot-btn.slot-booked .booked-text {
          color: var(--red);
          font-size: 9px;
          display: flex;
          align-items: center;
          gap: 3px;
          margin-top: 2px;
        }
        .slot-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .no-slots {
          text-align: center;
          padding: 16px;
          color: var(--text-3);
          font-size: 13px;
        }
        .selected-info {
          margin-top: 12px;
          padding: 10px 14px;
          border-radius: 8px;
          background: var(--accent)1A;
          border: 1px solid var(--accent)33;
        }

        /* Mobile-specific styles - ONLY affects screens <= 768px */
        @media (max-width: 768px) {
          /* Prevent horizontal scrolling */
          body {
            overflow-x: hidden;
          }
          
          /* Header adjustments */
          .mobile-stack {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 8px !important;
          }
          
          .mobile-header-title {
            font-size: 22px !important;
          }
          
          .mobile-header-subtitle {
            font-size: 12px !important;
          }
          
          /* Button adjustments */
          .mobile-full-width-btn {
            width: 100% !important;
            justify-content: center !important;
          }
          
          .mobile-wrapped-btn-group {
            flex-wrap: wrap !important;
            gap: 8px !important;
          }
          
          .mobile-btn-sm {
            font-size: 11px !important;
            padding: 6px 12px !important;
            min-height: 32px !important;
          }
          
          .mobile-btn-xs {
            font-size: 10px !important;
            padding: 4px 10px !important;
            min-height: 28px !important;
            border-radius: 6px !important;
          }
          
          /* Session card adjustments - Keep inline */
          .mobile-session-card {
            display: flex !important;
            flex-direction: row !important;
            align-items: center !important;
            justify-content: space-between !important;
            padding: 12px 14px !important;
            gap: 10px !important;
          }
          
          .mobile-session-info {
            display: flex !important;
            align-items: center !important;
            gap: 10px !important;
            flex: 1 !important;
            min-width: 0 !important;
          }
          
          .mobile-session-actions {
            display: flex !important;
            align-items: center !important;
            gap: 6px !important;
            flex-shrink: 0 !important;
          }
          
          .mobile-session-date {
            font-size: 12px !important;
            white-space: nowrap !important;
          }
          
          .mobile-session-time {
            font-size: 11px !important;
            white-space: nowrap !important;
          }
          
          /* Coach info card adjustments - Keep inline */
          .mobile-coach-card {
            display: flex !important;
            flex-direction: row !important;
            align-items: center !important;
            justify-content: space-between !important;
            padding: 12px 14px !important;
            gap: 10px !important;
          }
          
          .mobile-coach-info {
            display: flex !important;
            align-items: center !important;
            gap: 10px !important;
            flex: 1 !important;
            min-width: 0 !important;
          }
          
          .mobile-coach-actions {
            display: flex !important;
            align-items: center !important;
            gap: 6px !important;
            flex-shrink: 0 !important;
          }
          
          /* Modal adjustments */
          .mobile-modal-content {
            margin: 10px !important;
            max-height: 95vh !important;
            border-radius: 12px !important;
          }
          
          .mobile-modal-padding {
            padding: 16px !important;
          }
          
          .mobile-modal-footer {
            flex-direction: column !important;
            gap: 8px !important;
          }
          
          .mobile-modal-footer .btn-primary,
          .mobile-modal-footer .btn-secondary {
            width: 100% !important;
            min-height: 44px !important;
          }
          
          .mobile-modal-title {
            font-size: 15px !important;
          }
          
          .mobile-modal-subtitle {
            font-size: 11px !important;
          }
          
          /* Calendar adjustments */
          .mobile-calendar-day {
            font-size: 11px !important;
          }
          
          .mobile-calendar-day .dot {
            width: 4px !important;
            height: 4px !important;
            bottom: 2px !important;
          }
          
          .mobile-calendar-header .month-label {
            font-size: 13px !important;
          }
          
          .mobile-day-label {
            font-size: 8px !important;
          }
          
          /* Time slots adjustments */
          .mobile-slots-grid {
            grid-template-columns: 1fr !important;
            gap: 6px !important;
          }
          
          .mobile-slot-btn {
            padding: 8px 12px !important;
            font-size: 11px !important;
            min-height: 38px !important;
          }
          
          /* Coach list adjustments */
          .mobile-coach-list {
            max-height: 300px !important;
          }
          
          .mobile-coach-item {
            padding: 10px 12px !important;
            gap: 8px !important;
          }
          
          .mobile-coach-name {
            font-size: 13px !important;
          }
          
          .mobile-coach-specialty {
            font-size: 11px !important;
          }
          
          /* Pagination adjustments */
          .mobile-pagination {
            flex-wrap: wrap !important;
            gap: 8px !important;
          }
          
          .mobile-pagination-text {
            font-size: 11px !important;
          }
          
          .mobile-pagination-btn {
            width: 28px !important;
            height: 28px !important;
            font-size: 11px !important;
          }
          
          /* Confirm modal adjustments */
          .mobile-confirm-title {
            font-size: 16px !important;
          }
          
          .mobile-confirm-message {
            font-size: 13px !important;
          }
          
          .mobile-confirm-actions {
            flex-direction: column !important;
            gap: 8px !important;
          }
          
          .mobile-confirm-actions .btn-primary,
          .mobile-confirm-actions .btn-secondary {
            width: 100% !important;
            min-height: 44px !important;
          }
          
          /* Sessions container */
          .mobile-sessions-container {
            padding: 14px !important;
          }
        }

        /* Extra small devices - phones <= 480px */
        @media (max-width: 480px) {
          .mobile-header-title {
            font-size: 20px !important;
          }
          
          .calendar-grid {
            gap: 2px !important;
          }
          
          .calendar-day {
            font-size: 10px !important;
            border-radius: 6px !important;
          }
          
          .calendar-day .dot {
            width: 3px !important;
            height: 3px !important;
            bottom: 1px !important;
          }
          
          .modal-body {
            padding: 16px !important;
          }
          
          .slots-grid {
            gap: 4px !important;
          }
          
          .slot-btn {
            padding: 6px 10px !important;
            font-size: 10px !important;
            min-height: 34px !important;
          }
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: '22px' }}>
        <p style={{ 
          fontSize: '11px', 
          color: 'var(--accent)', 
          textTransform: 'uppercase', 
          letterSpacing: '0.12em', 
          fontWeight: 700, 
          marginBottom: '6px' 
        }}>
          Personal Training
        </p>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          flexWrap: 'wrap', 
          gap: '14px',
          className: 'mobile-stack'
        }}>
          <div>
            <h1 style={{ 
              fontSize: '28px', 
              fontWeight: 800, 
              letterSpacing: '-0.02em', 
              margin: 0, 
              color: 'var(--text)',
              className: 'mobile-header-title'
            }}>
              My Sessions
            </h1>
            <p style={{ 
              fontSize: '13px', 
              color: 'var(--text-3)', 
              marginTop: '4px',
              className: 'mobile-header-subtitle'
            }}>
              {coachStatus === 'approved' ? 'Book 1-on-1 sessions with your coach' : 
               coachStatus === 'pending' ? 'Waiting for coach approval' : 
               'Find a coach to get started'}
            </p>
          </div>
          {coachStatus === 'approved' ? (
            <button onClick={() => setShowBooking(true)} className="btn-primary mobile-full-width-btn">
              <Plus size={16} /> Book Session
            </button>
          ) : coachStatus === 'pending' ? (
            <span style={{
              padding: '8px 16px', borderRadius: '10px',
              background: 'var(--blue)1A', color: 'var(--blue)',
              fontSize: '13px', fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: '6px',
              className: 'mobile-full-width-btn',
              justifyContent: 'center'
            }}>
              <Clock size={14} /> Waiting for Approval
            </span>
          ) : (
            <button onClick={() => navigate('/member/coaches')} className="btn-primary mobile-full-width-btn">
              <UserCircle size={16} /> Find a Coach
            </button>
          )}
        </div>
      </div>

      {/* Coach Info - Approved */}
      {coachStatus === 'approved' && assignedCoach && (
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--green)33',
          borderRadius: '12px',
          padding: '14px 18px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          className: 'mobile-coach-card'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '14px',
            className: 'mobile-coach-info'
          }}>
            <div className="coach-avatar coach-avatar-assigned">
              {assignedCoach.name?.charAt(0) || '?'}
            </div>
            <div>
              <p style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Your Coach
              </p>
              <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>
                {assignedCoach.name}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                {assignedCoach.email}
              </p>
            </div>
          </div>
          <div style={{ 
            display: 'flex', 
            gap: '6px',
            className: 'mobile-coach-actions'
          }}>
            <button
              onClick={() => navigate('/member/coaches')}
              className="btn-outline-primary mobile-btn-xs"
            >
              Change
            </button>
            <button
              onClick={() => showConfirm('removeCoach')}
              className="btn-danger mobile-btn-xs"
              disabled={submitting}
            >
              Remove
            </button>
          </div>
        </div>
      )}

      {/* Coach Info - Pending */}
      {coachStatus === 'pending' && assignedCoach && (
        <div style={{
          padding: '14px 18px',
          borderRadius: '12px',
          background: 'var(--blue)0D',
          border: '1px solid var(--blue)33',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          className: 'mobile-coach-card'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            className: 'mobile-coach-info'
          }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: 'var(--blue)1A',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--blue)', fontWeight: 700, fontSize: '16px', flexShrink: 0,
            }}>
              {assignedCoach.name?.charAt(0) || '?'}
            </div>
            <div>
              <p style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Request Pending
              </p>
              <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>
                {assignedCoach.name}
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Clock size={11} />
                Waiting for coach approval...
              </p>
            </div>
          </div>
          <span style={{
            padding: '4px 12px', borderRadius: '99px',
            background: 'var(--blue)1A', color: 'var(--blue)',
            fontSize: '11px', fontWeight: 700,
            whiteSpace: 'nowrap'
          }}>
            Pending
          </span>
        </div>
      )}

      {/* Coach Info - No Coach */}
      {!coachStatus && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '10px',
          background: 'var(--amber)1A',
          border: '1px solid var(--amber)33',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          className: 'mobile-coach-card'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <AlertCircle size={16} color="var(--amber)" />
            <span style={{ fontSize: '13px', color: 'var(--text-2)' }}>
              You don't have a coach assigned. Find one to book personal sessions!
            </span>
          </div>
        </div>
      )}

      {/* Sessions List */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '80px',
        className: 'mobile-sessions-container'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
          paddingBottom: '12px',
          borderBottom: '1px solid var(--border)',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <Calendar size={16} color="var(--accent)" />
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>
              Your Sessions
            </span>
            <span style={{
              fontSize: '10px',
              padding: '2px 8px',
              borderRadius: '5px',
              background: 'var(--accent)1A',
              color: 'var(--accent)',
              fontWeight: 700,
              border: '1px solid var(--accent)33',
            }}>
              {sessions.length}
            </span>
          </div>
        </div>

        {sessions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Dumbbell size={40} color="var(--text-3)" style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-2)' }}>No sessions yet</p>
            <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>
              {coachStatus === 'approved' ? 'Book your first personal session!' : 
               coachStatus === 'pending' ? 'Wait for coach approval to book sessions.' : 
               'Get a coach assigned first.'}
            </p>
          </div>
        ) : (() => {
          const totalPages = Math.ceil(sessions.length / SESSIONS_PER_PAGE)
          const pageSessions = sessions.slice((currentPage - 1) * SESSIONS_PER_PAGE, currentPage * SESSIONS_PER_PAGE)
          return (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {pageSessions.map((session) => {
              const statusInfo = getStatusBadge(session.status)
              const StatusIcon = statusInfo.icon
              return (
                <div
                  key={session.id}
                  className="session-card mobile-session-card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    borderRadius: '10px',
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '14px',
                    className: 'mobile-session-info'
                  }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      background: 'var(--accent)1A',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--accent)',
                      flexShrink: 0,
                    }}>
                      <User size={16} />
                    </div>
                    <div>
                      <p style={{ 
                        fontSize: '13px', 
                        fontWeight: 700, 
                        color: 'var(--text)',
                        className: 'mobile-session-date'
                      }}>
                        {formatDate(session.date)}
                      </p>
                      <p style={{ 
                        fontSize: '12px', 
                        color: 'var(--text-2)',
                        className: 'mobile-session-time'
                      }}>
                        <Clock size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                        {session.time} - {session.end_time}
                      </p>
                      {session.notes && (
                        <p style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>
                          {session.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    className: 'mobile-session-actions'
                  }}>
                    <span className={`badge-status badge-${session.status}`}>
                      <StatusIcon size={10} />
                      {statusInfo.label}
                    </span>
                    {session.status === 'scheduled' && (
                      <button
                        onClick={() => showConfirm('cancelSession', session.id)}
                        className="btn-danger mobile-btn-xs"
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: 'none',
                          background: 'var(--red)1A',
                          color: 'var(--red)',
                          fontSize: '10px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'opacity 0.15s',
                          whiteSpace: 'nowrap',
                          minHeight: '28px',
                        }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              )
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '16px',
                  paddingTop: '14px',
                  borderTop: '1px solid var(--border)',
                  className: 'mobile-pagination'
                }}>
                  <span style={{ 
                    fontSize: '12px', 
                    color: 'var(--text-3)', 
                    fontWeight: 600,
                    className: 'mobile-pagination-text'
                  }}>
                    {(currentPage - 1) * SESSIONS_PER_PAGE + 1}–{Math.min(currentPage * SESSIONS_PER_PAGE, sessions.length)} of {sessions.length} sessions
                  </span>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      style={{
                        width: 32, height: 32, borderRadius: '8px',
                        border: '1px solid var(--border)',
                        background: currentPage === 1 ? 'transparent' : 'var(--surface-2)',
                        color: currentPage === 1 ? 'var(--text-3)' : 'var(--text)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: currentPage === 1 ? 'default' : 'pointer',
                        opacity: currentPage === 1 ? 0.4 : 1,
                        transition: 'all 0.15s',
                        className: 'mobile-pagination-btn'
                      }}
                    >
                      <ChevronLeft size={15} />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        style={{
                          width: 32, height: 32, borderRadius: '8px',
                          border: page === currentPage ? 'none' : '1px solid var(--border)',
                          background: page === currentPage ? 'var(--accent)' : 'var(--surface-2)',
                          color: page === currentPage ? '#fff' : 'var(--text-2)',
                          fontSize: '12px', fontWeight: 700,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          boxShadow: page === currentPage ? '0 2px 8px var(--accent-glow)' : 'none',
                          className: 'mobile-pagination-btn'
                        }}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      style={{
                        width: 32, height: 32, borderRadius: '8px',
                        border: '1px solid var(--border)',
                        background: currentPage === totalPages ? 'transparent' : 'var(--surface-2)',
                        color: currentPage === totalPages ? 'var(--text-3)' : 'var(--text)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: currentPage === totalPages ? 'default' : 'pointer',
                        opacity: currentPage === totalPages ? 0.4 : 1,
                        transition: 'all 0.15s',
                        className: 'mobile-pagination-btn'
                      }}
                    >
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )
        })()}
      </div>

      {/* ============== BOOKING MODAL WITH TIME SLOTS ============== */}
      {showBooking && (
        <div className="modal-overlay" onClick={() => setShowBooking(false)}>
          <div className="modal-content mobile-modal-content" onClick={e => e.stopPropagation()}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border)',
              background: 'var(--surface-2)',
              borderRadius: '18px 18px 0 0',
              className: 'mobile-modal-padding'
            }}>
              <h3 style={{ 
                fontSize: '17px', 
                fontWeight: 700, 
                margin: 0, 
                color: 'var(--text)',
                className: 'mobile-modal-title'
              }}>
                Book Personal Session
              </h3>
              <p style={{ 
                fontSize: '12px', 
                color: 'var(--text-3)', 
                margin: '2px 0 0',
                className: 'mobile-modal-subtitle'
              }}>
                With {assignedCoach?.name || 'Your Coach'}
              </p>
            </div>

            <form onSubmit={handleBook} className="modal-body mobile-modal-padding">
              {/* Coach's Availability Summary */}
              {coachAvailability.length > 0 && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'var(--green)0D',
                  border: '1px solid var(--green)33',
                  marginBottom: '16px',
                }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', marginBottom: '4px' }}>
                    Coach's Available Days
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {coachAvailability.map((av, idx) => (
                      <span key={idx} style={{
                        fontSize: '10px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: 'var(--green)1A',
                        color: 'var(--green)',
                      }}>
                        {av.day.slice(0, 3)} {av.start}-{av.end}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Date Picker */}
              <div style={{ marginBottom: '16px' }}>
                <label className="form-label">Select a Date</label>
                
                <div className="calendar-header mobile-calendar-header">
                  <button type="button" onClick={goToPreviousMonth}>
                    <ChevronLeft size={16} />
                  </button>
                  <span className="month-label">
                    {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                  <button type="button" onClick={goToNextMonth}>
                    <ChevronRightIcon size={16} />
                  </button>
                </div>

                <div className="calendar-grid">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="day-label mobile-day-label">{day}</div>
                  ))}
                </div>

                <div className="calendar-grid">
                  {getDatesForMonth().map((dateObj, index) => {
                    if (dateObj === null) {
                      return <div key={`empty-${index}`} className="calendar-day empty" />
                    }
                    
                    const isSelected = selectedDate === dateObj.date
                    const isAvailable = dateObj.isAvailable
                    const dayNumber = dateObj.day
                    
                    return (
                      <div
                        key={dateObj.date}
                        className={`calendar-day ${isAvailable ? 'available' : 'unavailable'} ${isSelected ? 'selected' : ''} ${dateObj.isToday ? 'today' : ''} mobile-calendar-day`}
                        onClick={() => isAvailable && selectDate(availableDates.find(d => d.date === dateObj.date))}
                      >
                        <div className="date-day-container">
                          {dayNumber}
                          {isAvailable && <div className="dot" />}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {!selectedDate && (
                  <p style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '8px' }}>
                    Select a date with a green dot to see available time slots
                  </p>
                )}
              </div>

              {/* Time Slots - With Booked Slots Highlighted */}
              {selectedDate && (
                <div style={{ marginBottom: '16px' }}>
                  <label className="form-label">Select a Time Slot</label>
                  
                  {timeSlots.length > 0 ? (
                    <div className="slots-grid mobile-slots-grid">
                      {timeSlots.map((slot, idx) => {
                        const isSelected = selectedSlot?.start === slot.start
                        const isBooked = slot.isBooked
                        
                        return (
                          <button
                            key={idx}
                            type="button"
                            className={`slot-btn ${isSelected ? 'slot-selected' : ''} ${isBooked ? 'slot-booked' : ''} mobile-slot-btn`}
                            onClick={() => !isBooked && selectSlot(slot)}
                            disabled={isBooked}
                          >
                            <Clock size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                            {slot.label}
                            {isBooked && (
                              <span className="booked-text">
                                <Ban size={10} style={{ display: 'inline', marginRight: '2px', verticalAlign: 'middle' }} />
                                Booked
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="no-slots">
                      No time slots available for this date
                    </div>
                  )}
                </div>
              )}

              {/* Selected Info */}
              {selectedDate && selectedSlot && (
                <div className="selected-info">
                  <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>
                    {new Date(selectedDate).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--accent)' }}>
                    <Zap size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                    {selectedSlot.label}
                  </p>
                </div>
              )}

              {/* Notes */}
              <div style={{ marginTop: '14px' }}>
                <label className="form-label">Notes (Optional)</label>
                <textarea
                  className="form-input"
                  rows="2"
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                  placeholder="Any special requests or goals?"
                />
              </div>

              {/* Submit Button */}
              <div className="modal-footer mobile-modal-footer" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting || !selectedDate || !selectedSlot}
                  style={{ flex: 1 }}
                >
                  {submitting ? (
                    <>
                      <div style={{
                        width: '16px', height: '16px', borderRadius: '50%',
                        border: '2px solid #FFFFFF',
                        borderTopColor: 'transparent',
                        animation: 'spin 0.8s linear infinite',
                      }} />
                      Booking...
                    </>
                  ) : (
                    'Book Session'
                  )}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowBooking(false)
                    setSelectedDate('')
                    setSelectedDayAvailability(null)
                    setSelectedSlot(null)
                    setTimeSlots([])
                    setBookedSlots([])
                    setBookingForm({ date: '', time: '', end_time: '', notes: '' })
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {showConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="modal-content confirm-modal-content mobile-modal-content" onClick={e => e.stopPropagation()}>
            <div style={{
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              className: 'mobile-modal-padding'
            }}>
              <div className={`confirm-icon ${
                confirmAction === 'removeCoach' || confirmAction === 'cancelSession' 
                  ? 'confirm-icon-danger' 
                  : 'confirm-icon-warning'
              }`}>
                {confirmAction === 'removeCoach' || confirmAction === 'cancelSession' ? (
                  <AlertTriangle size={28} />
                ) : (
                  <AlertCircle size={28} />
                )}
              </div>

              <h3 className="confirm-title mobile-confirm-title">
                {confirmAction === 'assignCoach' && 'Assign Yourself to This Coach?'}
                {confirmAction === 'removeCoach' && 'Remove Your Coach?'}
                {confirmAction === 'cancelSession' && 'Cancel This Session?'}
              </h3>

              <p className="confirm-message mobile-confirm-message">
                {confirmAction === 'assignCoach' && (
                  <>
                    Are you sure you want to assign yourself to <strong>{coaches.find(c => c.id === confirmData)?.name}</strong>?
                    {coachStatus === 'approved' && ' This will replace your current coach.'}
                    {' '}The coach will need to approve your request before you can book sessions.
                  </>
                )}
                {confirmAction === 'removeCoach' && (
                  <>
                    Are you sure you want to remove <strong>{assignedCoach?.name}</strong> as your coach?
                    You won't be able to book personal sessions until you find a new coach.
                  </>
                )}
                {confirmAction === 'cancelSession' && (
                  <>
                    Are you sure you want to cancel this session?
                    This action cannot be undone.
                  </>
                )}
              </p>

              <div className="confirm-actions mobile-confirm-actions" style={{ width: '100%' }}>
                <button
                  className="btn-secondary"
                  onClick={() => setShowConfirmModal(false)}
                >
                  Cancel
                </button>
                <button
                  className={`btn-primary ${(confirmAction === 'removeCoach' || confirmAction === 'cancelSession') ? 'btn-danger' : ''}`}
                  onClick={handleConfirm}
                  style={(confirmAction === 'removeCoach' || confirmAction === 'cancelSession') ? {
                    background: 'var(--red) !important'
                  } : {}}
                >
                  {confirmAction === 'assignCoach' && 'Assign'}
                  {confirmAction === 'removeCoach' && 'Remove'}
                  {confirmAction === 'cancelSession' && 'Cancel Session'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}