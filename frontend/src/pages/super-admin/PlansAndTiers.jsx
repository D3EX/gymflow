// frontend/src/pages/super-admin/PlansAndTiers.jsx

import { useEffect, useState } from 'react'
import api from "../../api/client"
import toast from 'react-hot-toast'
import {
  Crown, Star, Zap, Shield, BarChart3, Users, DollarSign,
  CheckCircle, RefreshCw, Building
} from 'lucide-react'
import { COLORS, ThemeStyles } from '../../theme/GymTheme'

const C = COLORS

function TierCard({ key, tier, count }) {
  const colors = {
    basic: { bg: `${C.blue}18`, color: C.blue, icon: Shield },
    pro: { bg: `${C.ember}18`, color: C.ember, icon: Zap },
    premium: { bg: `${C.amber}18`, color: C.amber, icon: Star },
    enterprise: { bg: '#a78bfa18', color: '#a78bfa', icon: Crown },
  }
  const t = colors[key] || colors.basic
  const Icon = t.icon

  return (
    <div className="card" style={{ padding: '20px', border: `1px solid ${t.color}40` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: t.bg, color: t.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Icon size={18} />
        </div>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0, textTransform: 'capitalize' }}>
            {key}
          </h3>
          <p style={{ fontSize: 11, color: C.text3, margin: '2px 0 0' }}>
            {count} gym{count !== 1 ? 's' : ''} on this plan
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        <div style={{ background: C.surface2, borderRadius: 8, padding: '10px', textAlign: 'center' }}>
          <p style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: 0 }}>{tier.max_members}</p>
          <p style={{ fontSize: 10, color: C.text3, margin: '2px 0 0' }}>Max Members</p>
        </div>
        <div style={{ background: C.surface2, borderRadius: 8, padding: '10px', textAlign: 'center' }}>
          <p style={{ fontSize: 20, fontWeight: 800, color: C.text, margin: 0 }}>{tier.max_coaches}</p>
          <p style={{ fontSize: 10, color: C.text3, margin: '2px 0 0' }}>Max Coaches</p>
        </div>
      </div>

      {tier.price && (
        <p style={{ fontSize: 12, color: C.text2, textAlign: 'center' }}>
          {tier.price.toLocaleString()} DZD / month
        </p>
      )}

      <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.line}` }}>
        <p style={{ fontSize: 9, color: C.text3, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>
          Features
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {tier.features?.map((f, i) => (
            <span key={i} style={{
              fontSize: 10, padding: '2px 8px', borderRadius: 99,
              background: C.surface2, color: C.text2
            }}>
              {f}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function PlansAndTiers() {
  const [gyms, setGyms] = useState([])
  const [tiers, setTiers] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [gymsRes, tiersRes] = await Promise.all([
        api.get('/super-admin/gyms'),
        api.get('/super-admin/tiers')
      ])
      setGyms(gymsRes.data)
      setTiers(tiersRes.data)
    } catch (error) {
      console.error('Failed to fetch tiers:', error)
      toast.error('Failed to load plans and tiers')
    } finally {
      setLoading(false)
    }
  }

  const tierBreakdown = {}
  Object.keys(tiers).forEach(tier => {
    tierBreakdown[tier] = gyms.filter(g => g.subscription_tier === tier).length
  })

  if (loading) {
    return (
      <div className="gf-theme">
        <ThemeStyles />
        <div className="loading"><div className="spinner" /></div>
      </div>
    )
  }

  return (
    <div className="gf-theme">
      <ThemeStyles />

      <div className="page-header">
        <div>
          <h1 className="page-title">Plans & Tiers</h1>
          <p className="page-subtitle">View and compare all subscription plans</p>
        </div>
        <button onClick={fetchData} className="btn btn-ghost">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16, marginBottom: 20 }}>
        {Object.entries(tiers).map(([key, tier]) => (
          <TierCard key={key} key={key} tier={tier} count={tierBreakdown[key] || 0} />
        ))}
      </div>

      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <BarChart3 size={16} color={C.ember} />
          <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, margin: 0 }}>Plan Comparison</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: 13 }}>
            <thead>
              <tr>
                <th>Plan</th>
                <th>Max Coaches</th>
                <th>Max Members</th>
                <th>Price</th>
                <th>Features</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(tiers).map(([key, tier]) => (
                <tr key={key}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, textTransform: 'capitalize', fontWeight: 700 }}>
                      {key}
                    </div>
                  </td>
                  <td>{tier.max_coaches}</td>
                  <td>{tier.max_members}</td>
                  <td>{tier.price ? `${tier.price.toLocaleString()} DZD` : 'Custom'}</td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {tier.features?.slice(0, 3).map((f, i) => (
                        <span key={i} style={{
                          fontSize: 10, padding: '2px 8px', borderRadius: 99,
                          background: C.surface2, color: C.text2
                        }}>
                          {f}
                        </span>
                      ))}
                      {tier.features?.length > 3 && (
                        <span style={{ fontSize: 10, color: C.text3 }}>+{tier.features.length - 3} more</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}