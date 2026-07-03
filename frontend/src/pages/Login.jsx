// frontend/src/pages/auth/Login.jsx

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import api from '../api/client'
import toast from 'react-hot-toast'
import {
  Eye, EyeOff, AlertCircle, ArrowRight, Send, KeyRound, ArrowLeft, Smartphone
} from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoginError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/login', { email, password })
      const { access_token, role, name, user_id, status: memberStatus } = res.data
      
      console.log('Login response:', { role, name, user_id, memberStatus })
      
      setAuth(access_token, { role, name, id: user_id, email, status: memberStatus })
      toast.success(`Welcome back, ${name}`)
      
      // Redirect based on role
      if (role === 'super_admin') {
        navigate('/dashboard/super-admin')
      } else if (role === 'admin') {
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
        // Fallback
        navigate('/')
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Invalid credentials'
      if (msg.toLowerCase().includes('email') || msg.toLowerCase().includes('not found')) {
        setLoginError('No account found with this email address')
      } else if (msg.toLowerCase().includes('password') || msg.toLowerCase().includes('invalid')) {
        setLoginError('Incorrect password. Please try again.')
      } else {
        setLoginError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    if (!resetEmail) { toast.error('Please enter your email address'); return }
    setResetLoading(true)
    try {
      await api.post('/auth/forgot-password', { email: resetEmail })
      setResetSent(true)
      toast.success('Password reset link sent to your email')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to send reset link'
      toast.error(msg.toLowerCase().includes('not found') ? 'No account found with this email address' : msg)
    } finally {
      setResetLoading(false)
    }
  }

  const handleBackToLogin = () => {
    setShowForgotPassword(false)
    setResetSent(false)
    setResetEmail('')
    setLoginError('')
  }

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
      padding: '0 20px 24px',
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
           PREMIUM GLASS LOGIN CARD — Apple Vision Pro style
           Width: 420px | Height: 520px | Border Radius: 34px
           ============================================================ */

        .login-card {
          flex: 0 0 420px;
          width: 420px;
          height: 520px;
          position: relative;
          z-index: 1;
          align-self: center;

          /* Deep smoked black glass base */
          background: rgba(18, 18, 20, 0.82);

          /* Premium frosted-glass blur */
          backdrop-filter: blur(48px) saturate(140%) brightness(0.92);
          -webkit-backdrop-filter: blur(48px) saturate(140%) brightness(0.92);

          border-radius: 34px;
          padding: 56px 38px 40px;

          border: none;
          background-clip: padding-box;

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

        .login-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 160px;
          height: 160px;
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
        .login-card::after {
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
        .login-card .bronze-corner {
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
        .login-card .internal-bronze-deep {
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
        .login-card .edge-thickness {
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
        .login-card .reflection-haze {
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
        .login-card .reflection-streak {
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

        .login-card > div {
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
          height: 60px;
          padding: 20px 20px 8px 20px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.05);
          color: #ffffff;
          font-size: 15px;
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
          font-size: 15px;
          color: #ffffff;
        }

        .input-inner {
          position: relative;
        }
        .input-inner .form-label-inside {
          position: absolute;
          top: 12px;
          left: 20px;
          font-size: 11px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.40);
          pointer-events: none;
          z-index: 2;
          letter-spacing: 0.02em;
        }

        .password-wrapper {
          position: relative;
          width: 100%;
        }
        .password-wrapper .form-input {
          padding-right: 90px;
        }

        .btn-arrow {
          position: absolute;
          right: 7px;
          top: 50%;
          transform: translateY(-50%);
          width: 44px;
          height: 44px;
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

        .social-btn {
          flex: 1;
          height: 48px;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          background: rgba(255, 255, 255, 0.04);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          color: rgba(255, 255, 255, 0.50);
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

        .form-label {
          font-size: 11px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.40);
          display: block;
          margin-bottom: 6px;
          letter-spacing: 0.02em;
        }
        .error-text {
          font-size: 11px;
          color: #f08079;
          margin-top: 3px;
          display: flex;
          align-items: center;
          gap: 4px;
          font-weight: 500;
        }

        .btn {
          padding: 11px 24px;
          border-radius: 7px;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: none;
        }
        .btn-primary {
          background: linear-gradient(180deg, #A44D16 0%, #8C4313 55%, #7A3A10 100%);
          color: #ffffff;
          box-shadow: 0 4px 20px rgba(140,67,19,0.35);
        }
        .btn-primary:hover:not(:disabled) { 
          transform: scale(1.02);
          box-shadow: 0 6px 28px rgba(140,67,19,0.45);
        }
        .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }

        .input-group { margin-bottom: 14px; }

        a:focus-visible, button:focus-visible {
          outline: 2px solid #C56A2A;
          outline-offset: 2px;
        }
        input:focus-visible { outline: none; }

        .page-header {
          width: 100%;
          max-width: 1080px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 0;
          margin-bottom: 4px;
          position: relative;
          z-index: 1;
          border-bottom: 1px solid rgba(140,67,19,0.25);
        }

        .login-shell {
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
          margin-top: -85px;
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
           RESPONSIVE DESIGN — Mobile-first
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
          
          .login-shell {
            flex-direction: column;
            gap: 10px;
            justify-content: center;
            width: 100%;
          }

          .illustration-panel {
            display: flex;
            flex-direction: column;
            flex: 0.2 0 auto; /* was inheriting flex: 1.2 1 0 from desktop, which grows to fill height in column layout */
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
            font-size: 30px !important;
          }

          /* Athlete image becomes a fixed full-screen background instead of inline artwork */
          .illustration-panel .image-wrapper {
            position: fixed;
            inset: 0;
            width: 100%;
            height: 125%;
            margin: -200px 20px 10px 0px;
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

          .login-card {
            width: 100%;
            max-width: 100%;
            height: auto;
            min-height: auto;
            padding: 50px 24px 24px;
            border-radius: 24px;
            flex: 0 0 auto;
            backdrop-filter: blur(32px) saturate(140%) brightness(0.92);
            -webkit-backdrop-filter: blur(32px) saturate(140%) brightness(0.92);
            margin: 0 auto; /* Center horizontally */
          }

          .login-card h1 {
            font-size: 28px !important;
          }
          
          .login-card p {
            font-size: 12px !important;
          }

          .form-input {
            height: 52px;
            padding: 16px 16px 6px 16px;
            font-size: 14px;
          }
          
          .input-inner .form-label-inside {
            top: 10px;
            left: 16px;
            font-size: 10px;
          }

          .password-wrapper .form-input {
            padding-right: 70px;
          }

          .btn-arrow {
            width: 38px;
            height: 38px;
            right: 5px;
          }
          
          .btn-arrow svg {
            width: 16px;
            height: 16px;
          }

          .password-wrapper button[type="button"] {
            right: 52px !important;
          }

          .social-btn {
            height: 42px;
          }
          
          .social-btn img, .social-btn svg {
            width: 16px;
            height: 16px;
          }

          .login-card .internal-bronze-deep,
          .login-card .edge-thickness,
          .login-card .reflection-haze {
            display: none;
          }
          
          .login-card::before {
            width: 120px;
            height: 120px;
          }
          
          .login-card::after {
            width: 160px;
            height: 160px;
          }

          .login-card .bronze-corner {
            width: 160px;
            height: 160px;
          }
        }

        /* Medium phones (481px - 768px) */
        @media (min-width: 481px) and (max-width: 768px) {
          .login-bg {
            padding: 0 24px 20px;
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

          .page-header span, .page-header a {
            text-shadow: 0 2px 8px rgba(0,0,0,0.5);
          }

          .login-shell {
            flex-direction: column;
            gap: 20px;
            justify-content: center;
            width: 100%;
            padding-top: calc(64px + env(safe-area-inset-top, 0px)); /* Clears the floating header so hero text is never covered */
          }

          .illustration-panel {
            display: flex;
            flex-direction: column;
            flex: 0 0 auto; /* was inheriting flex: 1.2 1 0 from desktop, which grows to fill height in column layout */
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
            font-size: 36px !important;
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

          .login-card {
            width: 100%;
            max-width: 420px;
            height: auto;
            min-height: 480px;
            padding: 40px 32px 32px;
            border-radius: 28px;
            flex: 0 0 auto;
            margin: 0 auto; /* Center horizontally */
          }

          .form-input {
            height: 56px;
          }

          .btn-arrow {
            width: 40px;
            height: 40px;
          }
        }

        /* Tablets (769px - 1024px) */
        @media (min-width: 769px) and (max-width: 1024px) {
          .login-shell {
            gap: 40px;
          }

          .illustration-panel .text-block h2 span:first-child {
            font-size: 28px !important;
          }
          
          .illustration-panel .text-block h2 span:last-child {
            font-size: 46px !important;
          }

          .image-wrapper {
            margin-top: -60px;
          }
        }

        /* Large tablets (1025px - 1280px) */
        @media (min-width: 1025px) and (max-width: 1280px) {
          .login-shell {
            gap: 60px;
          }
        }

        /* ============================================================
           FINE-TUNE FOR VERY SMALL SCREENS
           ============================================================ */

        @media (max-width: 360px) {
          .login-card {
            padding: 24px 16px 20px;
            border-radius: 20px;
          }
          
          .login-card h1 {
            font-size: 24px !important;
          }
          
          .form-input {
            height: 46px;
            padding: 14px 14px 4px 14px;
            font-size: 13px;
          }
          
          .input-inner .form-label-inside {
            top: 8px;
            left: 14px;
            font-size: 9px;
          }
          
          .btn-arrow {
            width: 34px;
            height: 34px;
            right: 4px;
          }
          
          .password-wrapper button[type="button"] {
            right: 46px !important;
          }
          
          .social-btn {
            height: 38px;
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
          
          .login-shell {
            justify-content: center;
            height: 100%;
            flex: 1;
            padding-top: 40px;
          }
          
          .login-card {
            padding: 20px 24px 16px;
            min-height: auto;
            max-height: 90vh;
            overflow-y: auto;
            margin: 0 auto;
          }
          
          .login-card h1 {
            font-size: 24px !important;
            margin-bottom: 4px !important;
          }
          
          .login-card > div {
            padding-top: 0 !important;
          }
          
          .login-card > div > div:first-child {
            margin-bottom: 16px !important;
          }
          
          .input-group {
            margin-bottom: 8px !important;
          }
          
          .form-input {
            height: 42px;
            padding: 12px 14px 4px 14px;
            font-size: 13px;
          }
          
          .btn-arrow {
            width: 34px;
            height: 34px;
            right: 4px;
          }
          
          .social-btn {
            height: 34px;
          }
          
          .social-btn img, .social-btn svg {
            width: 14px;
            height: 14px;
          }
        }
      `}</style>

      <div className="vignette" />

      {/* Header — simplified with only GymFlow logo and Sign up button */}
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
        <Link to="/register" style={{
          fontSize: '12px', fontWeight: 700, color: '#fb7121',
          textDecoration: 'none', letterSpacing: '0.04em',
          padding: '6px 14px', borderRadius: '8px',
          border: '1.5px solid rgba(251,113,33,0.3)',
          transition: 'all 0.15s',
          whiteSpace: 'nowrap',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = '#fb7121'; e.currentTarget.style.color = '#fff' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#fb7121' }}>
          Sign up
        </Link>
      </header>

      <div className="login-shell">

        {/* Left — illustration */}
        <div className="illustration-panel">

          {/* Text — top */}
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
              Built for those who demand more
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
                Train Smarter.
              </span>
              <span style={{
                display: 'block',
                fontSize: '60px',
                lineHeight: 1.1,
                fontWeight: 800,
                color: '#F5E6D3',
                textShadow: '0 6px 60px rgba(0,0,0,0.90), 0 2px 16px rgba(0,0,0,0.7)',
              }}>
                Perform Better.
              </span>
            </h2>
          </div>

          {/* Image — pushed to bottom */}
          <div className="image-wrapper">
            <img src="/113529-OOR9M5-406.png" alt="Athlete lifting a barbell" />
          </div>

        </div>

        {/* Right — premium glass login card */}
        <div className="login-card">

          {/* ── Glass reflection system ── */}
          <div className="bronze-corner" aria-hidden="true" />
          <div className="internal-bronze" aria-hidden="true" />
          <div className="internal-bronze-deep" aria-hidden="true" />
          <div className="edge-thickness" aria-hidden="true" />
          <div className="reflection-haze" aria-hidden="true" />
          <div className="reflection-streak" aria-hidden="true" />

          {!showForgotPassword ? (
            <div className="fade-in">

              {/* ── Title block ── */}
              <div style={{ 
                marginBottom: '32px', 
                textAlign: 'center',
                paddingTop: '4px'
              }}>
                <h1 style={{
                  fontSize: '38px',
                  fontWeight: 700,
                  color: '#F5E6D3',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.1,
                  margin: '0 0 8px 0',
                  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                }}>
                  Welcome back
                </h1>
                <p style={{
                  fontSize: '13px',
                  color: 'rgba(255,255,255,0.40)',
                  fontWeight: 400,
                  margin: 0,
                  lineHeight: 1.5,
                  letterSpacing: '0.02em',
                }}>
                  Sign in to your account
                </p>
              </div>

              {/* ── Error banner ── */}
              {loginError && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 16px', borderRadius: '12px',
                  background: 'rgba(226,87,76,0.06)', border: '1px solid rgba(226,87,76,0.12)',
                  marginBottom: '20px',
                }}>
                  <AlertCircle size={14} color="#f08079" />
                  <span style={{ fontSize: '12px', color: '#f08079', fontWeight: 500 }}>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit}>

                {/* ── Email pill ── */}
                <div style={{ marginBottom: '12px' }}>
                  <div className="input-inner">
                    <span className="form-label-inside">Email</span>
                    <input
                      type="email"
                      className={`form-input ${loginError ? 'error' : ''}`}
                      value={email}
                      onChange={e => { setEmail(e.target.value); setLoginError('') }}
                      placeholder="elisesmorisev@gmail.com"
                      required
                    />
                  </div>
                </div>

                {/* ── Password pill + circular button ── */}
                <div style={{ marginBottom: '8px' }}>
                  <div className="password-wrapper">
                    <div className="input-inner">
                      <span className="form-label-inside">Password</span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className={`form-input ${loginError ? 'error' : ''}`}
                        value={password}
                        onChange={e => { setPassword(e.target.value); setLoginError('') }}
                        placeholder="••••••••••"
                        required
                      />
                    </div>

                    {/* Eye toggle */}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '62px',
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
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>

                    {/* Submit button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-arrow"
                    >
                      {loading
                        ? <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.25)', borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} />
                        : <ArrowRight size={18} strokeWidth={2.5} />
                      }
                    </button>
                  </div>
                </div>

                {/* ── Forgot password ── */}
                <div style={{ textAlign: 'right', marginBottom: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="btn-ghost"
                  >
                    Forgot Password?
                  </button>
                </div>

              </form>

              {/* ── OR divider ── */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                margin: '20px 0 14px',
              }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
                <span style={{
                  fontSize: '10px',
                  color: 'rgba(255,255,255,0.25)',
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                }}>or</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
              </div>

              {/* ── Social buttons ── */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="social-btn" onClick={() => { window.location.href = `${api.defaults.baseURL}/auth/google` }}>
                  <img src="https://www.google.com/favicon.ico" alt="Google" style={{ width: '18px', height: '18px' }} />
                </button>
                <button className="social-btn" onClick={() => toast.info('Facebook sign-in coming soon!')}>
                  <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.234 2.686.234v2.953H15.83c-1.491 0-1.956.925-1.956 1.875v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.063 24 12.073z" fill="rgba(255,255,255,0.60)"/>
                  </svg>
                </button>
                <button className="social-btn" onClick={() => toast.info('Apple sign-in coming soon!')}>
                  <Smartphone size={18} color="rgba(255,255,255,0.60)" strokeWidth={2} />
                </button>
              </div>

              {/* ── Bottom sign-up link ── */}
              <div style={{
                marginTop: '20px',
                textAlign: 'center',
                fontSize: '13px',
                color: 'rgba(255,255,255,0.35)',
                letterSpacing: '0.01em',
              }}>
                Don't have an account?{' '}
                <Link
                  to="/register"
                  style={{ color: '#C56A2A', fontWeight: 600, textDecoration: 'none', transition: 'color 0.25s ease' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#D87830'; e.currentTarget.style.textDecoration = 'underline' }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#C56A2A'; e.currentTarget.style.textDecoration = 'none' }}
                >
                  Sign up
                </Link>
              </div>

            </div>
          ) : (
            <div className="fade-in">
              <button
                type="button"
                onClick={handleBackToLogin}
                className="btn-ghost"
                style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <ArrowLeft size={14} />
                Back to login
              </button>

              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: 'rgba(140,67,19,0.10)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '14px',
              }}>
                <KeyRound size={20} color="#C56A2A" />
              </div>

              <span style={{
                display: 'inline-block',
                fontSize: '10px', fontWeight: 700, letterSpacing: '0.18em',
                textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: '4px',
              }}>
                Password reset
              </span>
              <h1 className="bebas" style={{
                fontSize: '26px', fontWeight: 400, color: '#fafafa',
                letterSpacing: '0.04em', lineHeight: 1.1, marginBottom: '6px',
                textTransform: 'uppercase',
              }}>
                Forgot your password?
              </h1>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.5, marginBottom: '16px' }}>
                {!resetSent
                  ? "Enter your email and we'll send you a reset link."
                  : "Check your inbox — the link is on its way."}
              </p>

              {!resetSent ? (
                <form onSubmit={handleForgotPassword}>
                  <div className="input-group" style={{ marginBottom: '14px' }}>
                    <label className="form-label">Email address</label>
                    <input
                      type="email"
                      className="form-input"
                      value={resetEmail}
                      onChange={e => setResetEmail(e.target.value)}
                      placeholder="you@gymflow.com"
                      required
                    />
                  </div>
                  <button type="submit" disabled={resetLoading} className="btn-arrow" style={{ width: '100%', position: 'static', padding: '14px', borderRadius: '16px', gap: '8px' }}>
                    {resetLoading ? (
                      <>
                        <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.25)', borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} />
                        Sending…
                      </>
                    ) : (
                      <><Send size={16} /> Send Reset Link</>
                    )}
                  </button>
                </form>
              ) : (
                <button onClick={handleBackToLogin} className="btn-arrow" style={{ width: '100%', position: 'static', padding: '14px', borderRadius: '16px', gap: '8px' }}>
                  Back to Login
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}