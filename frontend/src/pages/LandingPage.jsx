// frontend/src/pages/LandingPage.jsx
// Unified with Login.jsx — same dark palette, amber-bronze accent, noise texture, Sora headings

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, Calendar, DollarSign, Smartphone,
  Bell, ArrowRight, CheckCircle, Dumbbell, Zap,
  BarChart3, Shield, Play, Home, BookOpen, TrendingUp,
  CreditCard, QrCode, Settings, Star, Clock, Award,
  LayoutDashboard, Activity, Gift, Target, Heart,
  Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin,
} from 'lucide-react'

// ── Design tokens — match Login exactly ──────────────────────────
const C = {
  bg:        '#14110F',
  surface:   '#1A1612',
  surface2:  '#221D18',
  surface3:  '#2A231C',
  border:    'rgba(255,255,255,0.06)',
  borderMd:  'rgba(255,255,255,0.10)',
  text:      '#F4EFE8',
  text2:     '#B6AB9C',
  text3:     'rgba(255,255,255,0.28)',
  accent:    '#C56A2A',   // Login's amber-bronze
  accent2:   '#D87830',   // Login's hover amber
  accentDark:'#8C4313',
  glow:      'rgba(140,67,19,0.22)',
  glowStrong:'rgba(140,67,19,0.40)',
}

export default function LandingPage() {
  const navigate = useNavigate()
  const [memberCount, setMemberCount] = useState(0)
  const [scrollY, setScrollY] = useState(0)
  const [activeTab, setActiveTab] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [pricingIdx, setPricingIdx] = useState(0)
  const pricingTrackRef = useRef(null)

  useEffect(() => {
    const target = 2060
    let current = 0
    const step = target / 120
    const timer = setInterval(() => {
      current += step
      if (current >= target) { clearInterval(timer); setMemberCount(target); return }
      setMemberCount(Math.floor(current))
    }, 16)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const fn = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('lp-visible') }),
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    )
    document.querySelectorAll('.lp-anim').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [activeTab])

  useEffect(() => {
    const fn = () => {
      const el = document.querySelector('.lp-parallax')
      if (el) el.style.transform = `translateY(${window.scrollY * 0.28}px)`
    }
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const memberFeatures = [
    { icon: Calendar, label: 'Book Classes', desc: 'Browse the schedule, book a spot, get reminded automatically.' },
    { icon: TrendingUp, label: 'Track Progress', desc: 'Log workouts, see PRs, follow your programme week by week.' },
    { icon: Dumbbell, label: 'Your Programme', desc: 'Coaches push custom training plans directly to your account.' },
    { icon: CreditCard, label: 'Membership & Billing', desc: 'Check your plan, renewal date, and payment history anytime.' },
  ]
  const ownerFeatures = [
    { icon: Users, label: 'Member Management', desc: 'Full profiles, attendance history, notes, and status in one view.' },
    { icon: DollarSign, label: 'Revenue Dashboard', desc: 'Live MRR, churn, and growth. Know your numbers cold.' },
    { icon: QrCode, label: 'QR Check-In', desc: 'Members scan in, you see real-time occupancy instantly.' },
    { icon: Shield, label: 'Access Control', desc: 'Grant roles to coaches, receptionists, and managers separately.' },
  ]
  const tabs = [
    { label: 'For Members', icon: Users, features: memberFeatures },
    { label: 'For Owners', icon: Shield, features: ownerFeatures },
  ]

  const plans = [
    { name: 'Starter', price: '$29', sub: '/mo', desc: 'Perfect for small studios.', features: ['Up to 100 members', '5 coaches', 'Class scheduling', 'Basic analytics', 'Email support'], pop: false },
    { name: 'Pro', price: '$79', sub: '/mo', desc: 'Full power. Most popular.', features: ['Unlimited members', 'Unlimited coaches', 'Member mobile app', 'Revenue dashboard', 'QR check-in', 'Priority support', 'Custom branding'], pop: true },
    { name: 'Elite', price: 'Custom', sub: '', desc: 'Multi-location gyms.', features: ['Everything in Pro', 'Multi-location', 'Dedicated manager', 'API access', 'Custom integrations', 'SLA guarantee'], pop: false },
  ]

  const scrollToPlan = (i) => {
    const track = pricingTrackRef.current
    if (!track) return
    track.scrollTo({ left: i * track.clientWidth, behavior: 'smooth' })
    setPricingIdx(i)
  }

  const handlePricingScroll = (e) => {
    const track = e.currentTarget
    const i = Math.round(track.scrollLeft / track.clientWidth)
    if (i !== pricingIdx) setPricingIdx(i)
  }

  const W = { width: '100%', maxWidth: '1280px', margin: '0 auto', boxSizing: 'border-box' }

  const navBg = scrollY > 50
    ? 'rgba(20,17,15,0.92)'
    : 'transparent'
  const navBlur = scrollY > 50 ? 'blur(20px)' : 'none'
  const navBorder = scrollY > 50 ? `1px solid ${C.border}` : 'none'

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Inter','Helvetica Neue',sans-serif", overflowX: 'hidden', color: C.text }}>

      {/* ── GLOBAL STYLES ──────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .sora { font-family: 'Sora', -apple-system, sans-serif; }

        /* Noise texture overlay — same as Login */
        .lp-noise::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 9 -4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          background-repeat: repeat;
          background-size: 200px 200px;
          pointer-events: none;
          z-index: 0;
          opacity: 0.07;
        }

        /* Scroll animations */
        .lp-anim {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.55s cubic-bezier(0.16,1,0.3,1), transform 0.55s cubic-bezier(0.16,1,0.3,1);
        }
        .lp-anim.lp-visible {
          opacity: 1;
          transform: none;
        }
        .lp-anim:nth-child(1) { transition-delay: 0s; }
        .lp-anim:nth-child(2) { transition-delay: 0.08s; }
        .lp-anim:nth-child(3) { transition-delay: 0.16s; }
        .lp-anim:nth-child(4) { transition-delay: 0.24s; }

        .lp-hero-fade {
          animation: lpFadeUp 0.9s cubic-bezier(0.16,1,0.3,1) forwards;
        }
        @keyframes lpFadeUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: none; }
        }

        @keyframes lpTicker {
          from { transform: translateX(0); }
          to   { transform: translateX(-20%); }
        }

        @keyframes lpBreathe {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }

        html { scroll-behavior: smooth; }

        /* Nav link hover */
        .lp-navlink {
          font-size: 14px;
          color: ${C.text2};
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s;
          letter-spacing: 0.01em;
        }
        .lp-navlink:hover { color: ${C.accent2}; }

        /* Feature card */
        .lp-feat-card {
          background: ${C.surface};
          border: 1px solid ${C.border};
          border-radius: 18px;
          padding: 28px;
          display: flex;
          gap: 18px;
          align-items: flex-start;
          transition: border-color 0.22s, background 0.22s;
        }
        .lp-feat-card:hover {
          border-color: rgba(197,106,42,0.45);
          background: ${C.surface2};
        }

        /* Pricing card */
        .lp-plan-card {
          border-radius: 20px;
          padding: 34px;
          position: relative;
          transition: transform 0.22s;
        }
        .lp-plan-card:hover { transform: translateY(-8px); }

        /* Pricing pagination dots (mobile carousel) */
        .lp-pricing-dots { display: none; }
        .lp-dot {
          width: 8px; height: 8px; border-radius: 50%; border: none; padding: 0;
          background: rgba(255,255,255,0.18); cursor: pointer; transition: all 0.22s;
        }
        .lp-dot.active { width: 22px; border-radius: 4px; background: ${C.accent}; }

        /* Social icon */
        .lp-social {
          color: rgba(255,255,255,0.30);
          transition: color 0.2s;
        }
        .lp-social:hover { color: ${C.accent2}; }

        /* Footer link */
        .lp-footlink {
          font-size: 13px;
          color: ${C.text2};
          text-decoration: none;
          transition: color 0.2s;
        }
        .lp-footlink:hover { color: ${C.accent2}; }

        /* Stat divider */
        .lp-stat + .lp-stat {
          padding-left: 28px;
          margin-left: 28px;
          border-left: 1px solid ${C.border};
        }

        /* Tab button */
        .lp-tab {
          padding: 10px 26px;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.22s;
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: 'Inter', sans-serif;
        }

        /* ── RESPONSIVE LAYOUT ──────────────────────────────── */

        .lp-wrap { padding: 0 48px; }
        .lp-burger { display: none; }
        .lp-mobile-menu { display: none; }
        .lp-hero-img-mobile { display: none; }

        @media (max-width: 980px) {
          .lp-nav-links, .lp-nav-ctas { display: none !important; }
          .lp-burger { display: flex !important; }
          .lp-mobile-menu { display: block; }
        }

        @media (max-width: 1024px) {
          .lp-member-flex { gap: 44px !important; }
          .lp-phone-mock { width: 230px; }
          .lp-phone-mock > div { width: 230px !important; }
        }

        @media (max-width: 860px) {
          .lp-member-flex { flex-direction: column !important; }
          .lp-member-flex > div:first-child { max-width: 100% !important; }
          .lp-phone-mock { align-self: center; }
        }

        @media (max-width: 900px) {
          .lp-wrap { padding: 0 24px; }

          .lp-hero-section { height: auto !important; min-height: 0 !important; overflow: hidden; padding: 110px 0 48px; }
          .lp-hero-glow { display: none !important; }
          .lp-hero-img { display: none !important; }

          .lp-hero-img-mobile {
            display: block !important;
            position: absolute !important;
            inset: 0 !important;
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
            object-position: left 20% !important;
            opacity: 0.85;
            z-index: 0;
            pointer-events: none;
            -webkit-mask-image: linear-gradient(to bottom, #000 0%, #000 60%, transparent 96%);
            mask-image: linear-gradient(to bottom, #000 0%, #000 60%, transparent 96%);
          }
          .lp-hero-fade-side {
            background: linear-gradient(180deg, rgba(20,17,15,0.6) 0%, rgba(20,17,15,0.85) 55%, ${C.bg} 100%) !important;
          }
          .lp-hero-fade-bottom { height: 120px !important; }
          .lp-hero-textwrap { position: relative !important; inset: auto !important; display: block !important; }
          .lp-hero-text { max-width: 100% !important; padding-top: 0 !important; }

          .lp-hero-ctas { gap: 10px !important; margin-bottom: 40px !important; }
          .lp-hero-ctas button { flex: 1 1 0; min-width: 0; }

          .lp-stats-row { flex-wrap: nowrap !important; row-gap: 0; }
          .lp-stat { padding-right: 14px !important; flex: 1 1 0; min-width: 0; }
          .lp-stat + .lp-stat { padding-left: 12px; margin-left: 0; }

          .lp-features-grid { grid-template-columns: 1fr !important; }
          .lp-dashboard-grid { grid-template-columns: repeat(2, 1fr) !important; }

          .lp-pricing-grid {
            display: flex !important;
            grid-template-columns: none !important;
            overflow-x: auto !important;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            padding-top: 22px;
            margin-top: -22px;
            padding-bottom: 2px;
            margin-left: -24px !important;
            margin-right: -24px !important;
            padding-left: 24px !important;
            padding-right: 24px !important;
          }
          .lp-pricing-grid::-webkit-scrollbar { display: none; }
          .lp-plan-card { scroll-snap-align: center; flex: 0 0 100%; min-width: 100%; }
          .lp-pricing-dots { display: flex !important; justify-content: center; align-items: center; gap: 8px; margin-top: 28px; }
          .lp-footer-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 32px !important; }

          .lp-cta-row { padding: 70px 0 !important; text-align: center; justify-content: center !important; }
          .lp-cta-row > div:first-child { width: 100%; }
          .lp-cta-row button { padding: 15px 28px !important; font-size: 14px !important; }
        }

        @media (max-width: 560px) {
          .lp-wrap { padding: 0 18px; }

          .lp-hero-ctas button { padding: 13px 14px !important; font-size: 13px !important; gap: 6px !important; white-space: nowrap; }

          .lp-stat { padding-right: 8px !important; }
          .lp-stat + .lp-stat { padding-left: 8px; }
          .lp-stat svg { width: 15px; height: 15px; margin-bottom: 5px !important; }
          .lp-stat .sora { font-size: 16px !important; }
          .lp-stat > div:last-child { font-size: 7px !important; letter-spacing: 0.04em !important; margin-top: 2px !important; }

          .lp-dashboard-grid { grid-template-columns: 1fr 1fr !important; gap: 10px !important; }
          .lp-footer-grid { grid-template-columns: 1fr !important; gap: 28px !important; }
          .lp-phone-mock { width: 100%; max-width: 280px; }
          .lp-phone-mock > div { width: 100% !important; max-width: 280px; }
        }
      `}</style>

      {/* ── NAV ──────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 999,
        background: navBg,
        backdropFilter: navBlur,
        WebkitBackdropFilter: navBlur,
        borderBottom: navBorder,
        transition: 'background 0.35s, border 0.35s',
      }}>
        <div className="lp-wrap" style={{ ...W, display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '68px' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <img src="/logosmallheader.png" alt="GymFlow" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
            <span className="sora" style={{ fontSize: '18px', fontWeight: '700', color: C.text, letterSpacing: '0.03em' }}>
              GYM<span style={{ color: C.accent }}>FLOW</span>
            </span>
          </div>

          {/* Nav links — desktop only */}
          <div className="lp-nav-links" style={{ display: 'flex', gap: '32px' }}>
            {['Features', 'For Members', 'Pricing'].map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(' ', '-')}`} className="lp-navlink">{l}</a>
            ))}
          </div>

          {/* CTA buttons — desktop only */}
          <div className="lp-nav-ctas" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
            <button
              onClick={() => navigate('/login')}
              style={{
                padding: '9px 20px',
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${C.border}`,
                borderRadius: '10px',
                color: C.text2,
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'Inter, sans-serif',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.accentDark; e.currentTarget.style.color = C.accent2 }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.text2 }}
            >Log In</button>
            <button
              onClick={() => navigate('/login')}
              style={{
                padding: '9px 22px',
                background: C.accent,
                border: 'none',
                borderRadius: '10px',
                color: '#FFFFFF',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: `0 4px 18px ${C.glow}`,
                transition: 'all 0.2s',
                fontFamily: 'Inter, sans-serif',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = C.accent2; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.background = C.accent; e.currentTarget.style.transform = 'none' }}
            >Get Started →</button>
          </div>

          {/* Hamburger — mobile only */}
          <button
            className="lp-burger"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMobileMenuOpen(v => !v)}
            style={{
              display: 'none',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '5px',
              width: '40px',
              height: '40px',
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${C.border}`,
              borderRadius: '10px',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <span style={{
              width: '18px', height: '1.5px', background: C.text,
              transition: 'transform 0.25s, opacity 0.25s',
              transform: mobileMenuOpen ? 'translateY(6.5px) rotate(45deg)' : 'none',
            }} />
            <span style={{
              width: '18px', height: '1.5px', background: C.text,
              transition: 'opacity 0.2s',
              opacity: mobileMenuOpen ? 0 : 1,
            }} />
            <span style={{
              width: '18px', height: '1.5px', background: C.text,
              transition: 'transform 0.25s',
              transform: mobileMenuOpen ? 'translateY(-6.5px) rotate(-45deg)' : 'none',
            }} />
          </button>
        </div>

        {/* Mobile menu panel */}
        <div className="lp-mobile-menu" style={{
          maxHeight: mobileMenuOpen ? '320px' : '0px',
          overflow: 'hidden',
          transition: 'max-height 0.3s ease',
          background: 'rgba(20,17,15,0.97)',
          backdropFilter: 'blur(20px)',
          borderTop: mobileMenuOpen ? `1px solid ${C.border}` : 'none',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', padding: '20px 20px 24px', gap: '4px' }}>
            {['Features', 'For Members', 'Pricing'].map(l => (
              <a
                key={l}
                href={`#${l.toLowerCase().replace(' ', '-')}`}
                className="lp-navlink"
                onClick={() => setMobileMenuOpen(false)}
                style={{ padding: '12px 4px', fontSize: '15px', borderBottom: `1px solid ${C.border}` }}
              >{l}</a>
            ))}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
              <button
                onClick={() => { setMobileMenuOpen(false); navigate('/login') }}
                style={{
                  padding: '12px 20px', background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${C.border}`, borderRadius: '10px',
                  color: C.text2, fontSize: '14px', fontWeight: '600', cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif', width: '100%',
                }}
              >Log In</button>
              <button
                onClick={() => { setMobileMenuOpen(false); navigate('/login') }}
                style={{
                  padding: '12px 20px', background: C.accent, border: 'none', borderRadius: '10px',
                  color: '#FFFFFF', fontSize: '14px', fontWeight: '700', cursor: 'pointer',
                  boxShadow: `0 4px 18px ${C.glow}`, fontFamily: 'Inter, sans-serif', width: '100%',
                }}
              >Get Started →</button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="lp-noise lp-hero-section" style={{ position: 'relative', width: '100%', height: '100vh', minHeight: '680px', overflow: 'hidden', background: C.bg }}>

        {/* Amber radial glow — left-biased, same as Login's ::after */}
        <div className="lp-hero-glow" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
          background: 'radial-gradient(ellipse 480px 100% at 22% 50%, rgba(140,67,19,0.38) 0%, rgba(140,67,19,0.14) 28%, rgba(140,67,19,0.04) 50%, transparent 68%)',
          animation: 'lpBreathe 6s ease-in-out infinite',
        }} />

        {/* Hero image — right side, same composition as Login's athlete */}
        <img
          src="/7651220.png"
          alt=""
          aria-hidden="true"
          className="lp-parallax lp-hero-img"
          style={{
            position: 'absolute', top: 0, right: 0,
            width: '62%', height: '100%',
            objectFit: 'cover', objectPosition: 'right center',
            zIndex: 0,
            transition: 'transform 0.1s ease-out',
          }}
        />

        {/* Mobile-only illustration accent — fist + dumbbell graphic */}
        <img
          src="/fist-dumbbell.png"
          alt=""
          aria-hidden="true"
          className="lp-hero-img-mobile"
        />

        {/* Bottom fade into bg */}
        <div className="lp-hero-fade-overlay lp-hero-fade-bottom" style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '160px', zIndex: 2, pointerEvents: 'none',
          background: `linear-gradient(to top, ${C.bg}, transparent)`,
        }} />
        {/* Left fade so text is always legible */}
        <div className="lp-hero-fade-overlay lp-hero-fade-side" style={{
          position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
          background: `linear-gradient(to right, ${C.bg} 38%, rgba(20,17,15,0.7) 60%, transparent 75%)`,
        }} />

        {/* Hero text */}
        <div className="lp-hero-textwrap" style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', alignItems: 'center' }}>
          <div className="lp-wrap" style={{ ...W }}>
            <div className="lp-hero-fade lp-hero-text" style={{ maxWidth: '560px', paddingTop: '68px' }}>

              {/* Eyebrow — same style as Login's "BUILT FOR THOSE WHO DEMAND MORE" */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ width: '32px', height: '1.5px', background: C.accent }} />
                <span style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.18em', textTransform: 'uppercase', color: C.accent }}>
                  Built for those who demand more
                </span>
              </div>

              {/* Main headline — Sora, same weight & case as Login's hero */}
              <h1 className="sora" style={{
                fontSize: 'clamp(48px, 6.5vw, 86px)',
                fontWeight: '800',
                lineHeight: 0.93,
                letterSpacing: '-0.02em',
                color: C.text,
                margin: '0 0 0',
                textTransform: 'uppercase',
              }}>
                MANAGE<br />YOUR GYM.
              </h1>
              <h1 className="sora" style={{
                fontSize: 'clamp(48px, 6.5vw, 86px)',
                fontWeight: '800',
                lineHeight: 0.93,
                letterSpacing: '-0.02em',
                color: C.accent,
                margin: '0 0 24px',
                textTransform: 'uppercase',
                textShadow: `0 0 60px ${C.glowStrong}`,
              }}>
                EMPOWER<br />MEMBERS.
              </h1>

              <p style={{ fontSize: '15px', color: C.text2, lineHeight: '1.75', maxWidth: '380px', margin: '0 0 36px' }}>
                Owners control everything. Members book classes, follow programmes, track progress — all in one app.
              </p>

              {/* CTA buttons */}
              <div className="lp-hero-ctas" style={{ display: 'flex', gap: '12px', flexWrap: 'nowrap', marginBottom: '56px' }}>
                <button
                  className="lp-btn-primary"
                  onClick={() => navigate('/login')}
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    padding: '15px 34px',
                    background: C.accent,
                    border: 'none', borderRadius: '12px',
                    color: 'white', fontSize: '15px', fontWeight: '800',
                    cursor: 'pointer',
                    boxShadow: `0 8px 32px ${C.glow}`,
                    transition: 'all 0.22s',
                    fontFamily: 'Inter, sans-serif',
                    letterSpacing: '0.01em',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = C.accent2; e.currentTarget.style.transform = 'translateY(-3px)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = C.accent; e.currentTarget.style.transform = 'none' }}
                >Start Free <ArrowRight size={15} /></button>
                <button
                  className="lp-btn-secondary"
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '9px',
                    padding: '15px 28px',
                    background: 'rgba(255,255,255,0.05)',
                    border: `1px solid ${C.borderMd}`,
                    borderRadius: '12px',
                    color: C.text, fontSize: '15px', fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.22s',
                    fontFamily: 'Inter, sans-serif',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.accentDark; e.currentTarget.style.color = C.accent2 }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.borderMd; e.currentTarget.style.color = C.text }}
                ><Play size={13} /> Watch Demo</button>
              </div>

              {/* Stats */}
              <div className="lp-stats-row" style={{ display: 'flex' }}>
                {[
                  { v: `${memberCount.toLocaleString()}+`, l: 'Active Members', icon: Users },
                  { v: '98%', l: 'Uptime', icon: Activity },
                  { v: '50+', l: 'Daily Classes', icon: Calendar },
                  { v: '4.9★', l: 'App Rating', icon: Star },
                ].map((s, i) => {
                  const Icon = s.icon
                  return (
                    <div key={i} className="lp-stat" style={{ paddingRight: i < 3 ? '28px' : 0 }}>
                      <Icon size={20} color={C.accent} style={{ marginBottom: '7px' }} />
                      <div className="sora" style={{ fontSize: '22px', fontWeight: '700', color: C.text, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{s.v}</div>
                      <div style={{ fontSize: '10px', color: C.text3, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '3px', fontWeight: '600' }}>{s.l}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TICKER ───────────────────────────────────────────── */}
      <div style={{ background: C.accent, padding: '11px 0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: '56px', animation: 'lpTicker 22s linear infinite', whiteSpace: 'nowrap' }}>
          {[...Array(5)].flatMap(() =>
            ['Member Profiles', 'Class Booking', 'Revenue Analytics', 'QR Check-In', 'Training Programmes', 'Smart Billing', 'Progress Tracking', 'Coach Tools'].map((t) => (
              <span key={Math.random()} style={{ fontSize: '10px', fontWeight: '800', color: 'rgba(255,255,255,0.92)', letterSpacing: '0.14em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: '18px' }}>
                <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '6px' }}>◆</span>{t}
              </span>
            ))
          )}
        </div>
      </div>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section id="features" style={{ padding: '110px 0', background: C.bg, position: 'relative', overflow: 'hidden' }}>
        {/* Ambient glow — same language as Login's card glow */}
        <div style={{ position: 'absolute', top: '-10%', right: '-6%', width: '500px', height: '500px', borderRadius: '50%', background: `radial-gradient(circle, ${C.glow} 0%, transparent 68%)`, pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'absolute', bottom: '5%', left: '-4%', width: '360px', height: '360px', borderRadius: '50%', background: `radial-gradient(circle, rgba(140,67,19,0.12) 0%, transparent 65%)`, pointerEvents: 'none', zIndex: 0 }} />

        <div className="lp-wrap" style={{ position: 'relative', zIndex: 1, ...W }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }} className="lp-anim">
            <p style={{ fontSize: '10px', color: C.accent, fontWeight: '800', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '12px' }}>Built for everyone in the gym</p>
            <h2 className="sora" style={{ fontSize: 'clamp(30px, 4vw, 52px)', fontWeight: '700', color: C.text, letterSpacing: '0.02em', lineHeight: 1.05, textTransform: 'uppercase' }}>
              ONE PLATFORM.<br /><span style={{ color: C.accent }}>TWO POWERFUL SIDES.</span>
            </h2>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px' }}>
            <div style={{ display: 'flex', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '4px', gap: '4px' }}>
              {tabs.map((t, i) => {
                const Icon = t.icon
                const active = activeTab === i
                return (
                  <button key={i} className="lp-tab" onClick={() => setActiveTab(i)}
                    style={{
                      background: active ? C.accent : 'transparent',
                      color: active ? 'white' : C.text2,
                      boxShadow: active ? `0 4px 16px ${C.glow}` : 'none',
                    }}>
                    <Icon size={15} />{t.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="lp-features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
            {tabs[activeTab].features.map((f, i) => {
              const Icon = f.icon
              return (
                <div key={`${activeTab}-${i}`} className="lp-feat-card lp-anim">
                  <div style={{ width: '44px', height: '44px', background: `rgba(140,67,19,0.12)`, border: `1px solid rgba(197,106,42,0.22)`, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={19} color={C.accent} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: C.text, margin: '0 0 6px' }}>{f.label}</h3>
                    <p style={{ fontSize: '13px', color: C.text2, margin: 0, lineHeight: '1.65' }}>{f.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── DASHBOARD PREVIEW ────────────────────────────────── */}
      <section style={{ padding: '0 0 110px', background: C.bg, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', bottom: '-8%', right: '10%', width: '600px', height: '400px', borderRadius: '50%', background: `radial-gradient(ellipse, ${C.glow} 0%, transparent 68%)`, pointerEvents: 'none', zIndex: 0 }} />
        <div className="lp-wrap" style={{ position: 'relative', zIndex: 1, ...W }}>
          {/* Glass card — matching Login's card style */}
          <div className="lp-anim" style={{
            background: `linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)`,
            border: `1px solid rgba(255,255,255,0.08)`,
            borderRadius: '24px',
            overflow: 'hidden',
            boxShadow: `0 24px 60px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)`,
            backdropFilter: 'blur(12px)',
          }}>
            {/* Browser chrome */}
            <div style={{ background: C.surface2, padding: '13px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                {['#ff5f57', '#ffbd2e', '#28c840'].map(c => <div key={c} style={{ width: '11px', height: '11px', borderRadius: '50%', background: c }} />)}
              </div>
              <div style={{ background: C.surface, borderRadius: '6px', padding: '4px 14px', fontSize: '11px', color: C.text3, border: `1px solid ${C.border}` }}>app.gymflow.io/dashboard</div>
            </div>
            <div className="lp-dashboard-grid" style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
              {[
                { label: 'Active Members', value: '524', sub: '+12 this week', color: C.accent },
                { label: "Today's Check-ins", value: '87', sub: '↑ 23% vs yesterday', color: C.accent2 },
                { label: 'Monthly Revenue', value: '$18,420', sub: '+15% this month', color: C.accent },
                { label: 'Classes Today', value: '14', sub: '3 spots left', color: C.accent2 },
              ].map((c, i) => (
                <div key={i} style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: '13px', padding: '20px' }}>
                  <div style={{ fontSize: '10px', color: C.text3, textTransform: 'uppercase', marginBottom: '10px', fontWeight: '700', letterSpacing: '0.08em' }}>{c.label}</div>
                  <div className="sora" style={{ fontSize: '28px', fontWeight: '700', color: c.color, letterSpacing: '-0.02em' }}>{c.value}</div>
                  <div style={{ fontSize: '11px', color: C.text3, marginTop: '6px' }}>{c.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── MEMBER APP ───────────────────────────────────────── */}
      <section id="for-members" style={{ background: C.surface, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: '110px 0', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '20%', right: '-5%', width: '400px', height: '400px', borderRadius: '50%', background: `radial-gradient(circle, rgba(140,67,19,0.10) 0%, transparent 70%)`, pointerEvents: 'none', zIndex: 0 }} />
        <div className="lp-wrap lp-member-flex" style={{ ...W, display: 'flex', gap: '72px', alignItems: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ flex: 1 }} className="lp-anim">
            <p style={{ fontSize: '10px', color: C.accent, fontWeight: '800', letterSpacing: '0.18em', textTransform: 'uppercase', margin: '0 0 14px' }}>Member Experience</p>
            <h2 className="sora" style={{ fontSize: 'clamp(30px, 4vw, 50px)', fontWeight: '700', color: C.text, letterSpacing: '0.02em', lineHeight: 1.05, margin: '0 0 20px', textTransform: 'uppercase' }}>
              YOUR MEMBERS GET<br /><span style={{ color: C.accent }}>THEIR OWN APP.</span>
            </h2>
            <p style={{ fontSize: '15px', color: C.text2, lineHeight: '1.75', margin: '0 0 32px', maxWidth: '420px' }}>
              Book classes, follow their coach's programme, track progress, and manage their membership — all in one place they'll actually use.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
              {['Book any class in 2 taps', 'See their full training programme', 'Log sets, reps, and PRs every session', 'Get automatic class reminders', 'View membership & payment history'].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
                  <CheckCircle size={14} color={C.accent} />
                  <span style={{ fontSize: '14px', color: C.text2, fontWeight: '500' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Phone mockup — same glass/dark styling */}
          <div className="lp-anim lp-phone-mock" style={{ flexShrink: 0 }}>
            <div style={{
              width: '268px',
              background: `linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)`,
              border: `1px solid rgba(255,255,255,0.09)`,
              borderRadius: '34px',
              overflow: 'hidden',
              boxShadow: '0 40px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)',
            }}>
              <div style={{ background: C.surface2, padding: '13px 20px 9px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: C.text }}>9:41</span>
                <div style={{ width: '56px', height: '7px', background: C.border, borderRadius: '4px' }} />
                <span style={{ fontSize: '10px', color: C.text3 }}>● ● ●</span>
              </div>
              <div style={{ padding: '16px 18px', background: `linear-gradient(135deg,${C.surface2},${C.surface})` }}>
                <div style={{ fontSize: '11px', color: C.text3, marginBottom: '3px' }}>Good morning 💪</div>
                <div className="sora" style={{ fontSize: '18px', fontWeight: '700', color: C.text, letterSpacing: '0.02em' }}>Karim</div>
              </div>
              <div style={{ margin: '14px', background: C.accent, borderRadius: '13px', padding: '15px', boxShadow: `0 6px 20px ${C.glow}` }}>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '5px' }}>Next Class</div>
                <div style={{ fontSize: '15px', fontWeight: '800', color: 'white' }}>HIIT Power</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', marginTop: '3px' }}>Today · 18:00 · 12 spots left</div>
                <div style={{ marginTop: '11px', background: 'rgba(255,255,255,0.18)', borderRadius: '8px', padding: '7px', textAlign: 'center', fontSize: '12px', fontWeight: '700', color: 'white' }}>Book Now</div>
              </div>
              <div style={{ margin: '0 14px 14px', background: C.surface2, border: `1px solid ${C.border}`, borderRadius: '13px', padding: '13px' }}>
                <div style={{ fontSize: '10px', color: C.text3, marginBottom: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Today's Programme</div>
                {[{ ex: 'Bench Press', sets: '4×8', done: true }, { ex: 'Squats', sets: '3×10', done: true }, { ex: 'Pull-ups', sets: '3×8', done: false }].map((e, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: i < 2 ? `1px solid ${C.border}` : 'none' }}>
                    <span style={{ fontSize: '12px', color: e.done ? C.text3 : C.text, fontWeight: '600', textDecoration: e.done ? 'line-through' : 'none' }}>{e.ex}</span>
                    <span style={{ fontSize: '12px', color: e.done ? C.accent : C.text3 }}>{e.done ? '✓' : e.sets}</span>
                  </div>
                ))}
              </div>
              <div style={{ padding: '11px 18px 18px', display: 'flex', justifyContent: 'space-around', borderTop: `1px solid ${C.border}` }}>
                {[{ I: LayoutDashboard, l: 'Home', a: true }, { I: Calendar, l: 'Classes', a: false }, { I: Dumbbell, l: 'Train', a: false }, { I: Users, l: 'Profile', a: false }].map(({ I, l, a }) => (
                  <div key={l} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                    <I size={18} color={a ? C.accent : C.text3} />
                    <span style={{ fontSize: '9px', color: a ? C.accent : C.text3, fontWeight: '700' }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────── */}
      <section id="pricing" style={{ padding: '110px 0', background: C.bg, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-15%', left: '50%', transform: 'translateX(-50%)', width: '800px', height: '400px', borderRadius: '50%', background: `radial-gradient(ellipse, rgba(140,67,19,0.08) 0%, transparent 70%)`, pointerEvents: 'none', zIndex: 0 }} />
        <div className="lp-wrap" style={{ position: 'relative', zIndex: 1, ...W }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }} className="lp-anim">
            <p style={{ fontSize: '10px', color: C.accent, fontWeight: '800', letterSpacing: '0.18em', textTransform: 'uppercase', margin: '0 0 12px' }}>Pricing</p>
            <h2 className="sora" style={{ fontSize: 'clamp(30px, 4vw, 52px)', fontWeight: '700', color: C.text, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
              NO NONSENSE.<br /><span style={{ color: C.accent }}>JUST VALUE.</span>
            </h2>
          </div>
          <div ref={pricingTrackRef} onScroll={handlePricingScroll} className="lp-pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {plans.map((p, i) => (
              <div key={i} className={`lp-plan-card lp-anim`} style={{
                background: p.pop
                  ? `linear-gradient(135deg, rgba(140,67,19,0.18) 0%, rgba(140,67,19,0.08) 100%)`
                  : C.surface,
                border: `1px solid ${p.pop ? 'rgba(197,106,42,0.45)' : C.border}`,
                boxShadow: p.pop ? `0 0 60px ${C.glow}, inset 0 1px 0 rgba(255,255,255,0.06)` : 'none',
              }}>
                {p.pop && (
                  <div style={{ position: 'absolute', top: '-13px', left: '50%', transform: 'translateX(-50%)', background: C.accent, padding: '4px 20px', borderRadius: '100px', fontSize: '10px', fontWeight: '800', color: 'white', letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap', boxShadow: `0 4px 14px ${C.glow}` }}>Most Popular</div>
                )}
                <div style={{ fontSize: '11px', fontWeight: '800', color: p.pop ? C.accent : C.text3, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '8px' }}>{p.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '12px' }}>
                  <span className="sora" style={{ fontSize: '44px', fontWeight: '700', color: p.pop ? C.accent : C.text, letterSpacing: '-0.02em' }}>{p.price}</span>
                  <span style={{ fontSize: '13px', color: C.text3 }}>{p.sub}</span>
                </div>
                <p style={{ fontSize: '13px', color: C.text2, margin: '0 0 24px', lineHeight: 1.6 }}>{p.desc}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '11px', marginBottom: '28px' }}>
                  {p.features.map((f, fi) => (
                    <div key={fi} style={{ display: 'flex', gap: '9px', alignItems: 'center' }}>
                      <CheckCircle size={13} color={C.accent} />
                      <span style={{ fontSize: '13px', color: C.text2 }}>{f}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => navigate('/login')}
                  style={{
                    width: '100%', padding: '13px',
                    background: p.pop ? C.accent : 'transparent',
                    border: p.pop ? 'none' : `1px solid ${C.border}`,
                    borderRadius: '11px',
                    color: p.pop ? 'white' : C.text,
                    fontSize: '14px', fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: p.pop ? `0 4px 18px ${C.glow}` : 'none',
                    fontFamily: 'Inter, sans-serif',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '0.82' }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
                >{p.name === 'Elite' ? 'Contact Sales' : 'Get Started Free'}</button>
              </div>
            ))}
          </div>

          {/* Pagination dots — mobile carousel only */}
          <div className="lp-pricing-dots">
            {plans.map((_, i) => (
              <button
                key={i}
                className={`lp-dot ${i === pricingIdx ? 'active' : ''}`}
                onClick={() => scrollToPlan(i)}
                aria-label={`Show ${plans[i].name} plan`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────────── */}
      <section style={{ position: 'relative', overflow: 'hidden' }}>
        <img src="/7651220.png" alt="" aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', filter: 'brightness(0.25)', pointerEvents: 'none', opacity: 0.7 }} />
        {/* Same amber overlay as Login */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(20,17,15,0.97) 0%, rgba(20,17,15,0.88) 100%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '600px', height: '300px', borderRadius: '50%', background: `radial-gradient(ellipse, rgba(140,67,19,0.18) 0%, transparent 70%)`, pointerEvents: 'none', zIndex: 0 }} />
        <div className="lp-wrap lp-anim lp-cta-row" style={{ position: 'relative', zIndex: 1, ...W, padding: '110px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '36px', boxSizing: 'border-box' }}>
          <div>
            {/* Eyebrow line */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '32px', height: '1.5px', background: C.accent }} />
              <span style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.18em', textTransform: 'uppercase', color: C.accent }}>Start today</span>
            </div>
            <h2 className="sora" style={{ fontSize: 'clamp(34px, 5vw, 60px)', fontWeight: '800', color: C.text, letterSpacing: '0.01em', margin: '0 0 12px', lineHeight: 1.0, textTransform: 'uppercase' }}>
              READY TO<br /><span style={{ color: C.accent, textShadow: `0 0 40px ${C.glowStrong}` }}>DOMINATE?</span>
            </h2>
            <p style={{ fontSize: '15px', color: C.text2, margin: 0 }}>Join 2,400+ members across Algeria's top gyms.</p>
          </div>
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '18px 46px',
              background: C.accent,
              border: 'none', borderRadius: '14px',
              color: 'white', fontSize: '16px', fontWeight: '800',
              cursor: 'pointer',
              boxShadow: `0 8px 36px ${C.glow}`,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              transition: 'all 0.22s',
              whiteSpace: 'nowrap',
              fontFamily: 'Inter, sans-serif',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = C.accent2; e.currentTarget.style.transform = 'translateY(-4px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = C.accent; e.currentTarget.style.transform = 'none' }}
          >START FREE TRIAL →</button>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer style={{ background: C.surface, borderTop: `1px solid ${C.border}`, padding: '60px 0 30px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '500px', height: '300px', borderRadius: '50%', background: `radial-gradient(ellipse, rgba(140,67,19,0.06) 0%, transparent 70%)`, pointerEvents: 'none' }} />
        <div className="lp-wrap" style={{ position: 'relative', zIndex: 1, ...W }}>
          <div className="lp-footer-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '40px', marginBottom: '50px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                <img src="/logosmallheader.png" alt="GymFlow Logo" style={{ width: '36px', height: '36px', objectFit: 'contain' }} />
                <span className="sora" style={{ fontSize: '18px', fontWeight: '700', color: C.text, letterSpacing: '0.03em' }}>GYM<span style={{ color: C.accent }}>FLOW</span></span>
              </div>
              <p style={{ fontSize: '13px', color: C.text2, lineHeight: '1.65', marginBottom: '20px' }}>
                Complete gym management platform for modern fitness centers.
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                  <a key={i} href="#" className="lp-social"><Icon size={18} /></a>
                ))}
              </div>
            </div>
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: '700', color: C.text, marginBottom: '18px', letterSpacing: '0.04em' }}>Quick Links</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {['Features', 'Pricing', 'About Us', 'Contact'].map(l => <a key={l} href="#" className="lp-footlink">{l}</a>)}
              </div>
            </div>
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: '700', color: C.text, marginBottom: '18px', letterSpacing: '0.04em' }}>Contact Us</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { I: Mail, t: 'contact@gymflow.com' },
                  { I: Phone, t: '+213 123 456 789' },
                  { I: MapPin, t: 'Algiers, Algeria' },
                ].map(({ I, t }) => (
                  <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <I size={13} color={C.text3} /><span style={{ fontSize: '13px', color: C.text2 }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: '700', color: C.text, marginBottom: '18px', letterSpacing: '0.04em' }}>Legal</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'GDPR Compliance'].map(l => <a key={l} href="#" className="lp-footlink">{l}</a>)}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '28px', borderTop: `1px solid ${C.border}`, flexWrap: 'wrap', gap: '16px' }}>
            <p style={{ fontSize: '12px', color: C.text3 }}>© 2025 GymFlow. All rights reserved.</p>
            <p style={{ fontSize: '12px', color: C.text3 }}>Developed with ❤️ by <span style={{ color: C.accent, fontWeight: '600' }}>DE3X</span></p>
          </div>
        </div>
      </footer>

    </div>
  )
}