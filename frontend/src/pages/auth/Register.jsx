// frontend/src/pages/auth/Register.jsx

import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import api from '../../api/client'
import toast from 'react-hot-toast'
import {
  Eye, EyeOff, AlertCircle, ArrowRight, ArrowLeft, Check, User, Phone, Ruler, Weight, Building2
} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'

export default function Register() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setAuth } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // ── Gym resolution ──────────────────────────────────────────
  // Primary path: /register?gym=12 from a QR code / link the gym shares.
  // Fallback: no valid param -> member picks their gym from a list
  // before step 1. `step` becomes 0 (pick gym), 1 (account), 2 (profile).
  const gymParam = searchParams.get('gym')
  const [gymId, setGymId] = useState(gymParam ? parseInt(gymParam) : null)
  const [gymName, setGymName] = useState('')
  const [gymResolving, setGymResolving] = useState(true)
  const [gymOptions, setGymOptions] = useState([])
  const [gymSearch, setGymSearch] = useState('')

  const [step, setStep] = useState(null) // null = still resolving gym; set once we know
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    age: '',
    weight: '',
    height: '',
    gender: 'male'
  })
  const [errors, setErrors] = useState({})

  // Resolve the gym: validate the ?gym= param against the backend, or
  // load the public gym list so the member can pick one manually.
  useEffect(() => {
    let cancelled = false

    const resolveGym = async () => {
      if (gymParam) {
        try {
          const res = await api.get(`/gyms/${gymParam}`)
          if (!cancelled) {
            setGymId(res.data.id)
            setGymName(res.data.name)
            setGymResolving(false)
            setStep(1)
          }
          return
        } catch {
          // Bad/stale QR code or link — fall through to manual picker.
          toast.error('That gym link looks invalid — please pick your gym below')
        }
      }

      // No param, or the param didn't resolve: load the picker list.
      try {
        const res = await api.get('/gyms')
        if (!cancelled) {
          setGymOptions(res.data)
          setGymId(null)
          setStep(0)
        }
      } catch {
        if (!cancelled) toast.error('Could not load gyms — please try again')
      } finally {
        if (!cancelled) setGymResolving(false)
      }
    }

    resolveGym()
    return () => { cancelled = true }
  }, [gymParam])

  const selectGym = (gym) => {
    setGymId(gym.id)
    setGymName(gym.name)
    setStep(1)
  }

  const goToGymPicker = async () => {
    // If we arrived via ?gym= and never loaded the full list, fetch it now.
    if (gymOptions.length === 0) {
      try {
        const res = await api.get('/gyms')
        setGymOptions(res.data)
      } catch {
        toast.error('Could not load gyms — please try again')
        return
      }
    }
    setStep(0)
  }

  const filteredGymOptions = gymOptions.filter(g =>
    g.name.toLowerCase().includes(gymSearch.toLowerCase())
  )

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateStep1 = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = 'Full name is required'
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors = {}
    if (formData.age && (parseInt(formData.age) < 10 || parseInt(formData.age) > 120)) {
      newErrors.age = 'Age must be between 10 and 120'
    }
    if (formData.weight && (parseFloat(formData.weight) < 20 || parseFloat(formData.weight) > 300)) {
      newErrors.weight = 'Weight must be between 20 and 300 kg'
    }
    if (formData.height && (parseFloat(formData.height) < 100 || parseFloat(formData.height) > 250)) {
      newErrors.height = 'Height must be between 100 and 250 cm'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2)
    } else {
      toast.error('Please fix the errors before continuing')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateStep2()) {
      toast.error('Please fix the errors before submitting')
      return
    }
    if (!gymId) {
      toast.error('Please select your gym before continuing')
      setStep(0)
      return
    }

    setLoading(true)
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone || null,
        age: formData.age ? parseInt(formData.age) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        height: formData.height ? parseFloat(formData.height) : null,
        gender: formData.gender,
        role: 'client',
        gym_id: gymId
      }

      // Register the user
      await api.post('/auth/register', payload)

      // Auto-login after registration
      try {
        const loginResponse = await api.post('/auth/login', {
          email: formData.email.trim(),
          password: formData.password
        })

        const { access_token, role, name, user_id, status: memberStatus } = loginResponse.data

        setAuth(access_token, { role, name, id: user_id, email: formData.email.trim(), status: memberStatus })
        toast.success(`Welcome to GymFlow, ${name}! 🎉`)

        // Redirect based on role (client always goes to pending-approval after registration)
        if (role === 'admin') {
          navigate('/dashboard')
        } else if (role === 'coach') {
          navigate('/coach')
        } else if (role === 'client') {
          if (memberStatus === 'pending') {
            navigate('/pending-approval')
          } else {
            navigate('/member')
          }
        } else {
          navigate('/')
        }

      } catch (loginError) {
        // If auto-login fails, redirect to login page
        console.error('Auto-login failed:', loginError)
        toast.success('Account created! Please login to continue.')
        navigate('/login')
      }

    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Failed to create account'
      if (errorMessage.toLowerCase().includes('email') &&
          errorMessage.toLowerCase().includes('registered')) {
        setErrors(prev => ({ ...prev, email: 'This email is already registered' }))
      } else {
        toast.error(errorMessage)
      }
      setLoading(false)
    }
  }

  const togglePasswordVisibility = () => setShowPassword(!showPassword)
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword)

  return (
    <div className="login-bg" style={{
      width: '100vw',
      height: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#14110F',
      margin: 0,
      padding: '0 40px 24px',
      boxSizing: 'border-box',
      overflow: 'hidden',
      position: 'relative',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap');

        * { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
        .bebas { font-family: 'Sora', -apple-system, sans-serif; }
        .archivo-black { font-family: 'Sora', -apple-system, sans-serif; }

        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        .fade-in { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .float { animation: float 4s ease-in-out infinite; }

        .gym-list-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(197,106,42,0.35) transparent;
        }
        .gym-list-scroll::-webkit-scrollbar {
          width: 5px;
        }
        .gym-list-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .gym-list-scroll::-webkit-scrollbar-thumb {
          background: rgba(197,106,42,0.35);
          border-radius: 99px;
        }
        .gym-list-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(197,106,42,0.55);
        }

        .login-bg::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 9 -4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          background-repeat: repeat;
          background-size: 200px 200px;
          pointer-events: none;
          z-index: 0;
          opacity: 0.08;
        }

        .login-bg::after {
          content: '';
          position: fixed;
          inset: 0;
          background: radial-gradient(
            ellipse 320px 100% at 18% 50%,
            rgba(140,67,19,0.45) 0%,
            rgba(140,67,19,0.20) 20%,
            rgba(140,67,19,0.08) 40%,
            transparent 65%
          );
          pointer-events: none;
          z-index: 0;
          animation: breathe 6s ease-in-out infinite;
        }

        @keyframes breathe {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }

        .login-bg .vignette {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          background:
            radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.55) 100%),
            linear-gradient(180deg, rgba(0,0,0,0.3) 0%, transparent 16%, transparent 84%, rgba(0,0,0,0.35) 100%);
        }

        .illustration-panel::before {
          content: '';
          position: absolute;
          top: 4%;
          left: 50%;
          width: 820px;
          height: 820px;
          transform: translateX(-50%);
          background: radial-gradient(circle, rgba(140,67,19,0.28) 0%, rgba(140,67,19,0.10) 38%, transparent 68%);
          z-index: 0;
          pointer-events: none;
        }

        .illustration-panel::after {
          content: '';
          position: absolute;
          inset: -20% -10%;
          background-image:
            linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
          background-size: 32px 32px;
          -webkit-mask-image: radial-gradient(ellipse 42% 48% at 50% 50%, black 0%, rgba(0,0,0,0.6) 35%, transparent 70%);
          mask-image: radial-gradient(ellipse 42% 48% at 50% 50%, black 0%, rgba(0,0,0,0.6) 35%, transparent 70%);
          z-index: 0;
          pointer-events: none;
        }

        /* ============================================================
           PREMIUM GLASS REGISTER CARD — Apple Vision Pro style
           Width: 420px | Height: 520px | Border Radius: 34px
           ============================================================ */

        .register-card {
          flex: 0 0 420px;
          width: 420px;
          height: 580px;
          position: relative;
          z-index: 1;
          align-self: center;

          /* Deep smoked black glass base */
          background: rgba(18, 18, 20, 0.82);

          /* Premium frosted-glass blur */
          backdrop-filter: blur(48px) saturate(140%) brightness(0.92);
          -webkit-backdrop-filter: blur(48px) saturate(140%) brightness(0.92);

          border-radius: 34px;
          padding: 36px 36px 32px;

          border: none;
          background-clip: padding-box;

          /* Pins the OR / social / sign-in footer to the bottom of the
             card regardless of how tall the current step's content is
             (e.g. the short "pick a gym" step vs the longer form steps). */
          display: flex;
          flex-direction: column;

/* ── Bottom dissolve into page background #14110F ── */
-webkit-mask-image: linear-gradient(
  to bottom,
  black 0%,
  black 62%,
  rgba(0,0,0,0.7) 70%,
  rgba(0,0,0,0.15) 91%,
  transparent 100%
);
mask-image: linear-gradient(
  to bottom,
  black 0%,
  black 76%,
  rgba(0,0,0,0.7) 78%,
  rgba(0,0,0,0.15) 100%,
  transparent 100%
);

          /* ── DEPTH: Multiple shadows for real suspension ── */
          box-shadow:
            /* Floating elevation — softened at bottom */
            0 40px 120px -28px rgba(0, 0, 0, 0.56),
            /* Mid-range ambient shadow */
            0 16px 48px rgba(0, 0, 0, 0.45),
            /* Close contact shadow — very subtle */
            0 4px 12px rgba(0, 0, 0, 0.30),
            /* Inner top highlight — glass surface catching light */
            inset 0 1.5px 0 rgba(255, 255, 255, 0.08),
            /* Subtle border top/sides only */
            inset 0 0 0 1px rgba(255, 255, 255, 0.06),
            /* Ambient bronze glow from top-left — warm atmosphere */
            0 0 120px -40px rgba(140, 67, 19, 0.15),
            /* Inset bronze warmth in top-left corner */
            inset 2px 2px 40px rgba(160, 75, 15, 0.12);

          overflow: hidden;
        }

        /* ════════════════════════════════════════════════════════════
           PREMIUM GLASS CORNER REFLECTION SYSTEM
           Simulates: Apple Vision Pro · Black crystal · Bronze light
           Zone: strictly top-left 140×140px
           Never bleeds toward title or card center
           ════════════════════════════════════════════════════════════ */

        .register-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 160px;
          height: 190px;
          background:
            radial-gradient(
              circle at 8% 8%,
              rgba(255, 220, 140, 0.80) 0%,
              rgba(230, 170, 70, 0.50) 12%,
              rgba(180, 110, 25, 0.25) 28%,
              rgba(140, 70, 10, 0.08) 46%,
              transparent 60%
            );
          pointer-events: none;
          z-index: 4;
          filter: blur(5px);
          opacity: 1;
          mask-image: radial-gradient(ellipse at 0% 0%, black 40%, transparent 62%);
          -webkit-mask-image: radial-gradient(ellipse at 0% 0%, black 40%, transparent 62%);
        }

        /* ── Layer 2: Broad warm bronze bloom ── */
        .register-card::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 220px;
          height: 220px;
          background:
            radial-gradient(
              ellipse at 4% 4%,
              rgba(160, 72, 10, 0.90) 0%,
              rgba(140, 58, 8, 0.65) 16%,
              rgba(120, 48, 6, 0.38) 32%,
              rgba(100, 38, 4, 0.16) 50%,
              rgba(80, 28, 2, 0.05) 66%,
              transparent 78%
            );
          pointer-events: none;
          z-index: 1;
          filter: blur(20px);
          opacity: 1;
          mask-image: radial-gradient(ellipse at 0% 0%, black 50%, transparent 72%);
          -webkit-mask-image: radial-gradient(ellipse at 0% 0%, black 50%, transparent 72%);
        }

        /* ── Layer 3: Deep sub-surface bronze volume ── */
        .register-card .bronze-corner {
          position: absolute;
          top: 0;
          left: 0;
          width: 240px;
          height: 240px;
          background:
            radial-gradient(
              ellipse at 0% 0%,
              rgba(180, 85, 12, 0.70) 0%,
              rgba(155, 68, 8, 0.45) 20%,
              rgba(130, 52, 5, 0.22) 40%,
              rgba(100, 38, 3, 0.08) 60%,
              transparent 76%
            );
          pointer-events: none;
          z-index: 0;
          filter: blur(45px);
          opacity: 1;
          mask-image: radial-gradient(ellipse at 0% 0%, black 58%, transparent 80%);
          -webkit-mask-image: radial-gradient(ellipse at 0% 0%, black 58%, transparent 80%);
        }

        /* ── Layer 5: Warm bronze micro-streak ── */
        .register-card .internal-bronze-deep {
          position: absolute;
          top: 12px;
          left: 16px;
          width: 60px;
          height: 20px;
          background: radial-gradient(
            ellipse at 25% 50%,
            rgba(255, 200, 100, 0.45) 0%,
            rgba(220, 150, 50, 0.20) 35%,
            rgba(180, 100, 20, 0.06) 60%,
            transparent 80%
          );
          pointer-events: none;
          z-index: 5;
          filter: blur(2.5px);
          transform: rotate(-30deg);
          opacity: 0.85;
        }

        /* ── Layer 6: Bronze border rim ── */
        .register-card .edge-thickness {
          position: absolute;
          top: -1px;
          left: -1px;
          width: 70px;
          height: 70px;
          border-top: 1.5px solid rgba(200, 100, 25, 0.45);
          border-left: 1.5px solid rgba(200, 100, 25, 0.35);
          border-top-left-radius: 34px;
          pointer-events: none;
          z-index: 6;
          mask-image: linear-gradient(135deg, black 18%, transparent 55%);
          -webkit-mask-image: linear-gradient(135deg, black 18%, transparent 55%);
        }

        /* ── Layer 7: Cold white glass rim ── */
        .register-card .reflection-haze {
          position: absolute;
          top: -1px;
          left: -1px;
          width: 42px;
          height: 42px;
          border-top: 1.5px solid rgba(255, 240, 210, 0.55);
          border-left: 1.5px solid rgba(255, 240, 210, 0.40);
          border-top-left-radius: 34px;
          pointer-events: none;
          z-index: 7;
          mask-image: linear-gradient(135deg, black 12%, transparent 46%);
          -webkit-mask-image: linear-gradient(135deg, black 12%, transparent 46%);
        }

        /* ── Layer 8: Warm ambient halo (diffusion cloud) ── */
        .register-card .reflection-streak {
          position: absolute;
          top: 0;
          left: 0;
          width: 160px;
          height: 160px;
          background: radial-gradient(
            ellipse at 8% 8%,
            rgba(180, 85, 18, 0.18) 0%,
            rgba(150, 65, 12, 0.09) 35%,
            rgba(120, 50, 8, 0.03) 60%,
            transparent 75%
          );
          pointer-events: none;
          z-index: 0;
          filter: blur(32px);
          opacity: 1;
          mask-image: radial-gradient(ellipse at 0% 0%, black 52%, transparent 76%);
          -webkit-mask-image: radial-gradient(ellipse at 0% 0%, black 52%, transparent 76%);
        }

        .register-card > div {
          position: relative;
          background: transparent !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          padding: 0 !important;
          z-index: 1;
        }

        /* ---- PREMIUM INPUTS — Glass floating pills ---- */
        .form-input {
          width: 100%;
          height: 52px;
          padding: 16px 18px 6px 18px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.05);
          color: #ffffff;
          font-size: 14px;
          font-weight: 400;
          outline: none;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          box-sizing: border-box;
          box-shadow:
            inset 0 2px 8px rgba(0, 0, 0, 0.30),
            inset 0 -1px 0 rgba(255, 255, 255, 0.03),
            0 1px 0 rgba(255, 255, 255, 0.05);
        }
        .form-input::placeholder {
          color: rgba(255, 255, 255, 0.25);
        }
        .form-input:focus {
          border-color: rgba(140, 67, 19, 0.45);
          background: rgba(255, 255, 255, 0.07);
          box-shadow:
            inset 0 2px 8px rgba(0, 0, 0, 0.22),
            inset 0 -1px 0 rgba(255, 255, 255, 0.03),
            0 0 0 3px rgba(140, 67, 19, 0.08),
            0 1px 0 rgba(255, 255, 255, 0.05);
        }
        .form-input.error {
          border-color: rgba(226, 87, 76, 0.45);
        }

        /* ---- AUTOFILL OVERRIDE ---- */
        .form-input:-webkit-autofill,
        .form-input:-webkit-autofill:hover,
        .form-input:-webkit-autofill:focus,
        .form-input:-webkit-autofill:active {
          -webkit-text-fill-color: #ffffff !important;
          caret-color: #ffffff;
          transition: background-color 0s 600000s, color 0s 600000s;
          box-shadow:
            0 0 0 1000px rgba(30, 26, 22, 0.95) inset,
            inset 0 2px 8px rgba(0, 0, 0, 0.30),
            inset 0 -1px 0 rgba(255, 255, 255, 0.03),
            0 1px 0 rgba(255, 255, 255, 0.05) !important;
        }
        .form-input:-webkit-autofill::first-line {
          font-size: 14px;
          color: #ffffff;
        }

        /* Floating label inside pill */
        .input-inner {
          position: relative;
        }
        .input-inner .form-label-inside {
          position: absolute;
          top: 8px;
          left: 18px;
          font-size: 10px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.35);
          pointer-events: none;
          z-index: 2;
          letter-spacing: 0.02em;
        }

        /* ---- PASSWORD WRAPPER ---- */
        .password-wrapper {
          position: relative;
          width: 100%;
        }
        .password-wrapper .form-input {
          padding-right: 80px;
        }

        /* ---- METALLIC BRONZE BUTTON ---- */
        .btn-arrow {
          position: absolute;
          right: 6px;
          top: 50%;
          transform: translateY(-50%);
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(
            175deg,
            #B8581E 0%,
            #A44D16 30%,
            #8C4313 55%,
            #7A3A10 85%,
            #6B330D 100%
          );
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow:
            0 4px 20px rgba(140, 67, 19, 0.45),
            0 2px 8px rgba(0, 0, 0, 0.30),
            inset 0 2px 0 rgba(255, 220, 180, 0.30),
            inset 0 -1.5px 0 rgba(0, 0, 0, 0.30),
            0 0 40px -8px rgba(140, 67, 19, 0.20);
          z-index: 3;
          flex-shrink: 0;
        }
        .btn-arrow:hover:not(:disabled) {
          transform: translateY(-50%) scale(1.04);
          background: linear-gradient(
            175deg,
            #C86828 0%,
            #B8581E 30%,
            #A44D16 55%,
            #8C4313 85%,
            #7A3A10 100%
          );
          box-shadow:
            0 6px 28px rgba(140, 67, 19, 0.55),
            0 2px 8px rgba(0, 0, 0, 0.30),
            inset 0 2px 0 rgba(255, 220, 180, 0.35),
            inset 0 -1.5px 0 rgba(0, 0, 0, 0.30),
            0 0 60px -8px rgba(140, 67, 19, 0.25);
        }
        .btn-arrow:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .btn-arrow svg {
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.20));
        }

        /* ---- WIDE BRONZE BUTTON ---- */
        .btn-bronze {
          padding: 12px 24px;
          border-radius: 999px;
          background: linear-gradient(
            175deg,
            #B8581E 0%,
            #A44D16 30%,
            #8C4313 55%,
            #7A3A10 85%,
            #6B330D 100%
          );
          color: #ffffff;
          border: none;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow:
            0 4px 20px rgba(140, 67, 19, 0.35),
            0 2px 8px rgba(0, 0, 0, 0.30),
            inset 0 2px 0 rgba(255, 220, 180, 0.30),
            inset 0 -1.5px 0 rgba(0, 0, 0, 0.30);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .btn-bronze:hover:not(:disabled) {
          transform: scale(1.02);
          box-shadow:
            0 6px 28px rgba(140, 67, 19, 0.45),
            0 2px 8px rgba(0, 0, 0, 0.30),
            inset 0 2px 0 rgba(255, 220, 180, 0.35),
            inset 0 -1.5px 0 rgba(0, 0, 0, 0.30);
        }
        .btn-bronze:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .btn-outline-bronze {
          padding: 12px 24px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.60);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
        }
        .btn-outline-bronze:hover {
          border-color: rgba(140, 67, 19, 0.35);
          background: rgba(140, 67, 19, 0.05);
          color: rgba(255, 255, 255, 0.80);
        }

        /* ---- GHOST / LINK ---- */
        .btn-ghost {
          background: none;
          border: none;
          padding: 0;
          font-size: 12px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.40);
          cursor: pointer;
          letter-spacing: 0.02em;
          transition: color 0.25s ease;
        }
        .btn-ghost:hover { color: #C56A2A; }

        .error-text {
          font-size: 11px;
          color: #f08079;
          margin-top: 3px;
          display: flex;
          align-items: center;
          gap: 4px;
          font-weight: 500;
        }

        .input-group { margin-bottom: 12px; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .full-width { grid-column: 1 / -1; }

        /* ---- SOCIAL BUTTONS — Premium glass pills ---- */
        .social-btn {
          flex: 1;
          height: 44px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(255, 255, 255, 0.04);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          color: rgba(255, 255, 255, 0.50);
          font-size: 12px;
          font-weight: 500;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.06),
            inset 0 -1px 0 rgba(0, 0, 0, 0.12);
        }
        .social-btn:hover {
          border-color: rgba(140, 67, 19, 0.35);
          background: rgba(140, 67, 19, 0.05);
          box-shadow:
            0 0 20px rgba(140, 67, 19, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.06);
          transform: translateY(-1px);
        }
        .social-btn svg, .social-btn img {
          opacity: 0.70;
          transition: opacity 0.25s ease;
        }
        .social-btn:hover svg, .social-btn:hover img {
          opacity: 0.90;
        }

        a:focus-visible, button:focus-visible {
          outline: 2px solid #C56A2A;
          outline-offset: 2px;
        }
        input:focus-visible, select:focus-visible { outline: none; }

        .page-header {
          width: 100%;
          max-width: 1080px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 0;
          margin-bottom: 4px;
          position: relative;
          z-index: 1;
          border-bottom: 1px solid rgba(140,67,19,0.25);
        }

        .register-shell {
          display: flex;
          align-items: stretch;
          gap: 100px;
          width: 100%;
          max-width: 1080px;
          position: relative;
          z-index: 1;
          flex: 1 1 auto;
          min-height: 0;
        }

        .illustration-panel {
          flex: 1.2 1 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          position: relative;
          z-index: 1;
          align-self: stretch;
          height: 100%;
          overflow: visible;
        }

        .text-block {
          width: 100%;
          text-align: center;
          padding: 32px 0 0 0;
          position: relative;
          z-index: 3;
        }

        .image-wrapper {
          width: 100%;
          position: relative;
          z-index: 2;
          margin-top: -70px;
        }

        .image-wrapper::before {
          content: '';
          position: absolute;
          left: 50%;
          bottom: 4%;
          width: 60%;
          height: 10%;
          transform: translateX(-50%);
          background: radial-gradient(ellipse 50% 100% at 50% 50%, rgba(140,67,19,0.18) 0%, rgba(140,67,19,0.06) 55%, transparent 80%);
          z-index: -1;
          pointer-events: none;
          filter: blur(12px);
        }

        .image-wrapper img {
          width: 100%;
          height: auto;
          display: block;
          filter: drop-shadow(0 30px 50px rgba(0,0,0,0.7)) drop-shadow(0 8px 18px rgba(0,0,0,0.5));
        }

        /* ============================================================
           RESPONSIVE DESIGN — Mobile-first (mirrors the Login page)
           ============================================================ */

        /* Small phones (320px - 480px) */
        @media (max-width: 480px) {
          .login-bg {
            padding: 0 12px 16px;
            justify-content: flex-start !important; /* Pin content to the top instead of the inline center style */
            overflow-y: auto;
          }

          .page-header {
            position: absolute; /* Floats above the top-aligned content */
            top: 0;
            left: 0;
            right: 0;
            padding: 12px 16px;
            border-bottom: none;
            z-index: 10;
            margin: 0;
            background: linear-gradient(to bottom, rgba(20,17,15,0.9) 60%, transparent);
          }

          /* Ensure the header text is readable over the glass card shadow */
          .page-header span, .page-header a {
            text-shadow: 0 2px 8px rgba(0,0,0,0.5);
          }

          .register-shell {
            flex-direction: column;
            gap: 16px;
            justify-content: center;
            width: 100%;
            padding-top: calc(64px + env(safe-area-inset-top, 0px)); /* Clears the floating header so hero text is never covered */
          }

          .illustration-panel {
            display: flex;
            flex-direction: column;
            flex: 0 0 auto; /* don't inherit flex: 1.2 1 0 from desktop — it would grow to fill height in column layout */
            height: auto;
            padding: 0;
            position: relative;
            z-index: 1;
          }

          .illustration-panel .text-block {
            padding: 8px 0 0;
            position: relative;
            z-index: 2;
          }

          .illustration-panel .text-block span:first-child {
            font-size: 9px;
            margin-bottom: 6px !important;
          }

          .illustration-panel .text-block h2 span:first-child {
            font-size: 15px !important;
          }

          .illustration-panel .text-block h2 span:last-child {
            font-size: 26px !important;
            white-space: normal !important;
          }

          /* Athlete image becomes a fixed full-screen background instead of inline artwork */
          .illustration-panel .image-wrapper {
            position: fixed;
            inset: 0;
            width: 100%;
            height: 100%;
            margin: 0;
            z-index: 0;
            pointer-events: none;
          }

          .illustration-panel .image-wrapper::before {
            display: none;
          }

          .illustration-panel .image-wrapper img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: center 75%;
            filter: grayscale(15%) brightness(0.55);
          }

          /* Dark gradient over the background image so text/card stay readable */
          .illustration-panel .image-wrapper::after {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(
              180deg,
              rgba(20,17,15,0.80) 0%,
              rgba(20,17,15,0.35) 30%,
              rgba(20,17,15,0.55) 65%,
              rgba(20,17,15,0.95) 100%
            );
          }

          .register-card {
            width: 100%;
            max-width: 100%;
            height: auto;
            min-height: auto;
            padding: 24px 20px 20px;
            border-radius: 24px;
            flex: 0 0 auto;
            backdrop-filter: blur(32px) saturate(140%) brightness(0.92);
            -webkit-backdrop-filter: blur(32px) saturate(140%) brightness(0.92);
            margin: 0 auto; /* Center horizontally */
          }

          .register-card h1 {
            font-size: 26px !important;
          }

          .register-card p {
            font-size: 12px !important;
          }

          .form-input {
            height: 48px;
            padding: 14px 14px 4px 14px;
            font-size: 13px;
          }

          .input-inner .form-label-inside {
            top: 8px;
            left: 14px;
            font-size: 9px;
          }

          .password-wrapper .form-input {
            padding-right: 60px;
          }

          .password-wrapper button[type="button"] {
            right: 12px !important;
          }

          .grid-2 {
            grid-template-columns: 1fr; /* stack Password / Confirm fields on narrow phones */
          }

          .btn-bronze, .btn-outline-bronze {
            font-size: 12px;
            padding: 12px 18px;
          }

          .social-btn {
            height: 40px;
            font-size: 11px;
          }

          .register-card .internal-bronze-deep,
          .register-card .edge-thickness,
          .register-card .reflection-haze {
            display: none;
          }

          .register-card::before {
            width: 120px;
            height: 120px;
          }

          .register-card::after {
            width: 160px;
            height: 160px;
          }

          .register-card .bronze-corner {
            width: 160px;
            height: 160px;
          }
        }

        /* Medium phones (481px - 768px) */
        @media (min-width: 481px) and (max-width: 768px) {
          .login-bg {
            padding: 0 24px 20px;
            justify-content: flex-start !important;
            overflow-y: auto;
          }

          .page-header {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            padding: 12px 16px;
            border-bottom: none;
            z-index: 10;
            margin: 0;
            background: linear-gradient(to bottom, rgba(20,17,15,0.9) 60%, transparent);
          }

          .page-header span, .page-header a {
            text-shadow: 0 2px 8px rgba(0,0,0,0.5);
          }

          .register-shell {
            flex-direction: column;
            gap: 20px;
            justify-content: center;
            width: 100%;
            padding-top: calc(64px + env(safe-area-inset-top, 0px));
          }

          .illustration-panel {
            display: flex;
            flex-direction: column;
            flex: 0 0 auto;
            height: auto;
            padding: 0;
            position: relative;
            z-index: 1;
          }

          .illustration-panel .text-block {
            padding: 8px 0 0;
            position: relative;
            z-index: 2;
          }

          .illustration-panel .text-block h2 span:first-child {
            font-size: 18px !important;
          }

          .illustration-panel .text-block h2 span:last-child {
            font-size: 32px !important;
          }

          .illustration-panel .image-wrapper {
            position: fixed;
            inset: 0;
            width: 100%;
            height: 100%;
            margin: 0;
            z-index: 0;
            pointer-events: none;
          }

          .illustration-panel .image-wrapper::before {
            display: none;
          }

          .illustration-panel .image-wrapper img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            object-position: center 75%;
            filter: grayscale(15%) brightness(0.55);
          }

          .illustration-panel .image-wrapper::after {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(
              180deg,
              rgba(20,17,15,0.80) 0%,
              rgba(20,17,15,0.35) 30%,
              rgba(20,17,15,0.55) 65%,
              rgba(20,17,15,0.95) 100%
            );
          }

          .register-card {
            width: 100%;
            max-width: 460px;
            height: auto;
            min-height: 560px;
            padding: 36px 32px 28px;
            border-radius: 28px;
            flex: 0 0 auto;
            margin: 0 auto;
          }

          .form-input {
            height: 54px;
          }
        }

        /* Tablets (769px - 1024px) */
        @media (min-width: 769px) and (max-width: 1024px) {
          .register-shell {
            gap: 40px;
          }

          .illustration-panel .text-block h2 span:first-child {
            font-size: 28px !important;
          }

          .illustration-panel .text-block h2 span:last-child {
            font-size: 40px !important;
          }

          .image-wrapper {
            margin-top: -50px;
          }
        }

        /* Large tablets (1025px - 1280px) */
        @media (min-width: 1025px) and (max-width: 1280px) {
          .register-shell {
            gap: 60px;
          }
        }

        /* ============================================================
           FINE-TUNE FOR VERY SMALL SCREENS
           ============================================================ */

        @media (max-width: 360px) {
          .register-card {
            padding: 20px 16px 16px;
            border-radius: 20px;
          }

          .register-card h1 {
            font-size: 22px !important;
          }

          .form-input {
            height: 44px;
            padding: 12px 12px 4px 12px;
            font-size: 12px;
          }

          .input-inner .form-label-inside {
            top: 6px;
            left: 12px;
            font-size: 8px;
          }

          .social-btn {
            height: 36px;
          }
        }

        /* Fix for iOS Safari notch */
        @supports (padding: max(0px)) {
          .login-bg {
            padding-left: max(20px, env(safe-area-inset-left));
            padding-right: max(20px, env(safe-area-inset-right));
          }
        }

        /* Landscape mode on phones */
        @media (max-height: 500px) and (orientation: landscape) {
          .login-bg {
            padding: 0 20px 8px;
            justify-content: center;
          }

          .page-header {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            padding: 8px 16px;
            border-bottom: none;
            z-index: 10;
          }

          .register-shell {
            justify-content: center;
            height: 100%;
            flex: 1;
            padding-top: 40px;
          }

          .register-card {
            padding: 16px 20px 14px;
            min-height: auto;
            max-height: 90vh;
            overflow-y: auto;
            margin: 0 auto;
          }

          .register-card h1 {
            font-size: 22px !important;
            margin-bottom: 4px !important;
          }

          .input-group {
            margin-bottom: 8px !important;
          }

          .form-input {
            height: 40px;
            padding: 10px 12px 4px 12px;
            font-size: 12px;
          }

          .social-btn {
            height: 32px;
          }
        }

        /* ---- Select styling ---- */
        select.form-input {
          appearance: none;
          -webkit-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%23a87a5c' stroke-width='1.6' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 18px center;
          padding-right: 40px;
        }
        select.form-input option {
          background: #14110F;
          color: #f5f5f7;
        }
      `}</style>

      <div className="vignette" />

      {/* Header — simplified with only GymFlow logo and Sign in button, matching the Login page header exactly */}
      <header className="page-header">
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <img src="/logosmallheader.png" alt="GymFlow" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
          <span style={{
            fontSize: '13px', fontWeight: 800, letterSpacing: '0.2em',
            textTransform: 'uppercase', color: '#fafafa',
          }}>
            GymFlow
          </span>
        </Link>
        <Link to="/login" style={{
          fontSize: '12px', fontWeight: 700, color: '#fb7121',
          textDecoration: 'none', letterSpacing: '0.04em',
          padding: '6px 14px', borderRadius: '8px',
          border: '1.5px solid rgba(251,113,33,0.3)',
          transition: 'all 0.15s',
          whiteSpace: 'nowrap',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = '#fb7121'; e.currentTarget.style.color = '#fff' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#fb7121' }}>
          Sign in
        </Link>
      </header>

      <div className="register-shell">

        {/* Left — illustration */}
        <div className="illustration-panel">
          <div className="text-block">
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '10px',
              fontWeight: 800,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: '#C56A2A',
              marginBottom: '16px',
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
              textShadow: '0 2px 12px rgba(197,106,42,0.40)',
            }}>
              <span style={{
                display: 'inline-block',
                width: '28px',
                height: '1.5px',
                background: 'linear-gradient(90deg, #C56A2A, rgba(197,106,42,0.3))',
                borderRadius: '2px',
                flexShrink: 0,
              }} />
              Join the movement
            </span>
<h2 style={{
  fontWeight: 700,
  letterSpacing: '-0.01em',
  margin: 0,
  fontFamily: "'Sora', -apple-system, sans-serif",
  textTransform: 'uppercase',
}}>
  <span style={{
    display: 'block',
    fontSize: '34px',
    lineHeight: 1.15,
    color: '#E8844A',
  }}>
    Start Strong.
  </span>
  <span style={{
    fontSize: '48px',
    lineHeight: 1.1,
    fontWeight: 800,
    color: '#F5E6D3',
    textShadow: '0 6px 60px rgba(0,0,0,0.90), 0 2px 16px rgba(0,0,0,0.7)',
    whiteSpace: 'nowrap',
    display: 'inline-block',
    maxWidth: '100%',
  }}>
    Stay Committed.
  </span>
</h2>
          </div>

          <div className="image-wrapper">
            <img src="/113529-OOR9M5-406.png" alt="Athlete lifting a barbell" />
          </div>
        </div>

        {/* Right — premium glass register card */}
        <div className="register-card">
          <div className="bronze-corner" aria-hidden="true" />
          <div className="internal-bronze-deep" aria-hidden="true" />
          <div className="edge-thickness" aria-hidden="true" />
          <div className="reflection-haze" aria-hidden="true" />
          <div className="reflection-streak" aria-hidden="true" />

          {/* Back to login link — subtle */}
          <Link
            to="/login"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              color: 'rgba(255,255,255,0.30)', fontSize: '11px', fontWeight: 500,
              textDecoration: 'none', marginBottom: '12px',
              transition: 'color 0.25s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#C56A2A'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.30)'}
          >
            <ArrowLeft size={12} />
            Back to login
          </Link>

          {/* Title block */}
          <div style={{ marginBottom: '20px', textAlign: 'center', paddingTop: '4px' }}>
            <h1 style={{
              fontSize: '34px',
              fontWeight: 700,
              color: '#F5E6D3',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              margin: '0 0 4px 0',
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
            }}>
              Join GymFlow
            </h1>
            <p style={{
              fontSize: '13px',
              color: 'rgba(255,255,255,0.40)',
              fontWeight: 400,
              margin: 0,
              lineHeight: 1.5,
              letterSpacing: '0.02em',
            }}>
              {step === null ? 'One moment…' : step === 0 ? 'Which gym are you joining?' : step === 1 ? 'Create your account' : 'Tell us about yourself'}
            </p>
          </div>

          {/* Gym confirmation banner — clickable so they can pick a different gym */}
          {step > 0 && gymName && (
            <button
              type="button"
              onClick={goToGymPicker}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '8px 10px', marginBottom: '16px',
                borderRadius: '999px', width: '100%',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.30), inset 0 -1px 0 rgba(255, 255, 255, 0.03), 0 1px 0 rgba(255, 255, 255, 0.05)',
                cursor: 'pointer',
                boxSizing: 'border-box',
                transition: 'background 0.25s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)'; e.currentTarget.style.borderColor = 'rgba(140, 67, 19, 0.35)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)' }}
            >
              <span style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                background: 'rgba(197,106,42,0.12)',
                border: '1px solid rgba(197,106,42,0.25)',
              }}>
                <Building2 size={13} color="#E8844A" />
              </span>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.55)', flex: 1, textAlign: 'left' }}>
                Joining <span style={{ color: '#E8844A' }}>{gymName}</span>
              </span>
              <span style={{
                fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.60)',
                letterSpacing: '0.03em', padding: '6px 12px', borderRadius: '999px',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              }}>
                Change
              </span>
            </button>
          )}

          {/* Step indicator */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{
                fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: step === 0 ? '#C56A2A' : 'rgba(255,255,255,0.25)',
              }}>
                Gym
              </span>
              <span style={{
                fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: step === 1 ? '#C56A2A' : 'rgba(255,255,255,0.25)',
              }}>
                Account
              </span>
              <span style={{
                fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: step === 2 ? '#C56A2A' : 'rgba(255,255,255,0.25)',
              }}>
                Profile
              </span>
            </div>
            <div style={{ height: '3px', borderRadius: '999px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: step === null ? '0%' : step === 0 ? '8%' : step === 1 ? '54%' : '100%',
                background: 'linear-gradient(90deg, #C56A2A, #E8844A)',
                borderRadius: '999px',
                transition: 'width 0.4s cubic-bezier(0.16,1,0.3,1)',
              }} />
            </div>
          </div>

          <div style={{ flex: 1 }}>
          {step === null ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: '12px' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                border: '2.5px solid rgba(255,255,255,0.12)', borderTopColor: '#C56A2A',
                animation: 'spin 0.8s linear infinite'
              }} />
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>Loading…</span>
            </div>
          ) : step === 0 ? (
            <div className="fade-in">
              {/* ── Step 0: Pick gym (fallback when no ?gym= link/QR was used) ── */}
              <div className="input-group">
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingTop: '16px' }}
                  placeholder="Search for your gym…"
                  value={gymSearch}
                  onChange={(e) => setGymSearch(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="gym-list-scroll" style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {gymResolving ? (
                  <div style={{ textAlign: 'center', padding: '24px', color: 'rgba(255,255,255,0.35)', fontSize: '12px' }}>
                    Loading gyms…
                  </div>
                ) : filteredGymOptions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px', color: 'rgba(255,255,255,0.35)', fontSize: '12px' }}>
                    No gyms match "{gymSearch}"
                  </div>
                ) : (
                  filteredGymOptions.map((gym) => (
                    <button
                      key={gym.id}
                      type="button"
                      onClick={() => selectGym(gym)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '12px 14px', borderRadius: '14px',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        color: '#f5f5f7', fontSize: '13px', fontWeight: 500,
                        textAlign: 'left', cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(197,106,42,0.35)'; e.currentTarget.style.background = 'rgba(140,67,19,0.08)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                    >
                      <Building2 size={15} color="#C56A2A" />
                      {gym.name}
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
          <form onSubmit={handleSubmit}>
            <div className="fade-in">
              {step === 1 ? (
                <div>
                  {/* ── Step 1: Account ── */}
                  <div className="input-group">
                    <div className="input-inner">
                      <span className="form-label-inside">Full Name</span>
                      <input
                        type="text" name="name"
                        className={`form-input ${errors.name ? 'error' : ''}`}
                        value={formData.name} onChange={handleChange}
                        placeholder="John Doe" required
                      />
                    </div>
                    {errors.name && <span className="error-text"><AlertCircle size={13} />{errors.name}</span>}
                  </div>

                  <div className="input-group">
                    <div className="input-inner">
                      <span className="form-label-inside">Email</span>
                      <input
                        type="email" name="email"
                        className={`form-input ${errors.email ? 'error' : ''}`}
                        value={formData.email} onChange={handleChange}
                        placeholder="you@gymflow.com" required
                      />
                    </div>
                    {errors.email && <span className="error-text"><AlertCircle size={13} />{errors.email}</span>}
                  </div>

                  <div className="grid-2">
                    <div className="input-group">
                      <div className="password-wrapper">
                        <div className="input-inner">
                          <span className="form-label-inside">Password</span>
                          <input
                            type={showPassword ? 'text' : 'password'} name="password"
                            className={`form-input ${errors.password ? 'error' : ''}`}
                            value={formData.password} onChange={handleChange}
                            placeholder="••••••••" required
                          />
                        </div>
                        <button
                          type="button"
                          onClick={togglePasswordVisibility}
                          style={{
                            position: 'absolute',
                            right: '48px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            color: 'rgba(255,255,255,0.25)',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            zIndex: 3,
                            transition: 'color 0.25s ease',
                          }}
                          onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.50)'}
                          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}
                        >
                          {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                      {errors.password ? (
                        <span className="error-text"><AlertCircle size={13} />{errors.password}</span>
                      ) : null}
                    </div>

                    <div className="input-group">
                      <div className="password-wrapper">
                        <div className="input-inner">
                          <span className="form-label-inside">Confirm</span>
                          <input
                            type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword"
                            className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                            value={formData.confirmPassword} onChange={handleChange}
                            placeholder="••••••••" required
                          />
                        </div>
                        <button
                          type="button"
                          onClick={toggleConfirmPasswordVisibility}
                          style={{
                            position: 'absolute',
                            right: '48px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            color: 'rgba(255,255,255,0.25)',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            zIndex: 3,
                            transition: 'color 0.25s ease',
                          }}
                          onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.50)'}
                          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}
                        >
                          {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                      {errors.confirmPassword && <span className="error-text"><AlertCircle size={13} />{errors.confirmPassword}</span>}
                    </div>
                  </div>

                  <div style={{ marginTop: '12px' }}>
                    <button
                      type="button"
                      onClick={handleNext}
                      className="btn-bronze"
                      style={{ width: '100%', padding: '14px' }}
                    >
                      Continue to Profile
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {/* ── Step 2: Profile ── */}
                  <div className="grid-2">
                    <div className="input-group">
                      <div className="input-inner">
                        <span className="form-label-inside">Phone</span>
                        <input
                          type="tel" name="phone"
                          className="form-input"
                          value={formData.phone} onChange={handleChange}
                          placeholder="+213 555 000 000"
                        />
                      </div>
                    </div>

                    <div className="input-group">
                      <div className="input-inner">
                        <span className="form-label-inside">Gender</span>
                        <select name="gender" className="form-input" value={formData.gender} onChange={handleChange}>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                        </select>
                      </div>
                    </div>

                    <div className="input-group">
                      <div className="input-inner">
                        <span className="form-label-inside">Age</span>
                        <input
                          type="number" name="age"
                          className={`form-input ${errors.age ? 'error' : ''}`}
                          value={formData.age} onChange={handleChange}
                          placeholder="25" min="10" max="120"
                        />
                      </div>
                      {errors.age && <span className="error-text"><AlertCircle size={13} />{errors.age}</span>}
                    </div>

                    <div className="input-group">
                      <div className="input-inner">
                        <span className="form-label-inside">Weight (kg)</span>
                        <input
                          type="number" name="weight"
                          className={`form-input ${errors.weight ? 'error' : ''}`}
                          value={formData.weight} onChange={handleChange}
                          placeholder="75" step="0.1" min="20" max="300"
                        />
                      </div>
                      {errors.weight && <span className="error-text"><AlertCircle size={13} />{errors.weight}</span>}
                    </div>

                    <div className="input-group full-width">
                      <div className="input-inner">
                        <span className="form-label-inside">Height (cm)</span>
                        <input
                          type="number" name="height"
                          className={`form-input ${errors.height ? 'error' : ''}`}
                          value={formData.height} onChange={handleChange}
                          placeholder="175" step="0.1" min="100" max="250"
                        />
                      </div>
                      {errors.height && <span className="error-text"><AlertCircle size={13} />{errors.height}</span>}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="btn-outline-bronze"
                      style={{ padding: '12px 16px' }}
                    >
                      <ArrowLeft size={14} />
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-bronze"
                      style={{ flex: 1, padding: '14px' }}
                    >
                      {loading ? (
                        <>
                          <div style={{
                            width: '16px', height: '16px', borderRadius: '50%',
                            border: '2px solid rgba(255,255,255,0.25)', borderTopColor: '#fff',
                            animation: 'spin 0.8s linear infinite'
                          }} />
                          Creating…
                        </>
                      ) : (
                        <>Create Account</>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </form>
          )}
          </div>

          {step === 0 && (
          <>
          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '14px 0 12px' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>or</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
          </div>

          {/* Social buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="social-btn" onClick={() => toast.info('Google sign-up coming soon!')}>
              <img src="https://www.google.com/favicon.ico" alt="Google" style={{ width: '16px', height: '16px' }} />
              Google
            </button>
            <button className="social-btn" onClick={() => toast.info('Apple sign-up coming soon!')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z" fill="#f5f5f7"/>
                <path d="M12.0005 6.5C10.0675 6.5 8.50049 8.067 8.50049 10C8.50049 11.933 10.0675 13.5 12.0005 13.5C13.9335 13.5 15.5005 11.933 15.5005 10C15.5005 8.067 13.9335 6.5 12.0005 6.5ZM12.0005 15C9.29749 15 6.00049 16.5 6.00049 18V19.5H18.0005V18C18.0005 16.5 14.7035 15 12.0005 15Z" fill="#14161f"/>
              </svg>
              Apple
            </button>
          </div>
          </>
          )}

          {/* Sign in link */}
          <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
            Already have an account?{' '}
            <Link
              to="/login"
              style={{ color: '#C56A2A', fontWeight: 600, textDecoration: 'none', transition: 'color 0.25s ease' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#D87830'; e.currentTarget.style.textDecoration = 'underline' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#C56A2A'; e.currentTarget.style.textDecoration = 'none' }}
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}