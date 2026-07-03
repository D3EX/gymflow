import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from "../../api/client"
import toast from 'react-hot-toast'

export default function MemberForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '', email: '', password: '',
    phone: '', age: '', weight: '', height: '', gender: 'male',
  })

  useEffect(() => { if (id) fetchMember() }, [id])

  const fetchMember = async () => {
    try {
      const res = await api.get(`/members/${id}`)
      const m = res.data
      setFormData({
        name: m.user.name, email: m.user.email, password: '',
        phone: m.phone || '', age: m.age || '', weight: m.weight || '',
        height: m.height || '', gender: m.gender || 'male',
      })
    } catch {
      toast.error('Could not load member')
      navigate('/members')
    }
  }

  const set = (key) => (e) => setFormData(prev => ({ ...prev, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (id) {
        await api.put(`/members/${id}`, {
          name: formData.name, phone: formData.phone,
          age: parseInt(formData.age) || null,
          weight: parseFloat(formData.weight) || null,
          height: parseFloat(formData.height) || null,
          gender: formData.gender,
        })
        toast.success('Member updated')
      } else {
        await api.post('/members', {
          ...formData,
          age: parseInt(formData.age) || null,
          weight: parseFloat(formData.weight) || null,
          height: parseFloat(formData.height) || null,
        })
        toast.success('Member created')
      }
      navigate('/members')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Operation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{id ? 'Edit member' : 'New member'}</h1>
          <p className="page-subtitle">{id ? 'Update member information' : 'Add someone to your gym'}</p>
        </div>
        <button onClick={() => navigate('/members')} className="btn btn-ghost">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
          Back
        </button>
      </div>

      <div className="card" style={{ maxWidth: 680 }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>

            <div className="form-group">
              <label className="form-label">Full name *</label>
              <input type="text" value={formData.name} onChange={set('name')} className="form-input" required />
            </div>

            <div className="form-group">
              <label className="form-label">Email *</label>
              <input type="email" value={formData.email} onChange={set('email')} className="form-input" required disabled={!!id}
                style={id ? { opacity: 0.5, cursor: 'not-allowed' } : {}} />
            </div>

            {!id && (
              <div className="form-group">
                <label className="form-label">Password *</label>
                <input type="password" value={formData.password} onChange={set('password')} className="form-input" required />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Phone</label>
              <input type="text" value={formData.phone} onChange={set('phone')} className="form-input" placeholder="+213…" />
            </div>

            <div className="form-group">
              <label className="form-label">Age</label>
              <input type="number" value={formData.age} onChange={set('age')} className="form-input" min="1" max="120" />
            </div>

            <div className="form-group">
              <label className="form-label">Weight (kg)</label>
              <input type="number" step="0.1" value={formData.weight} onChange={set('weight')} className="form-input" />
            </div>

            <div className="form-group">
              <label className="form-label">Height (cm)</label>
              <input type="number" step="0.1" value={formData.height} onChange={set('height')} className="form-input" />
            </div>

            <div className="form-group">
              <label className="form-label">Gender</label>
              <select value={formData.gender} onChange={set('gender')} className="form-input">
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          <div className="divider" style={{ margin: '20px 0' }} />

          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving…' : id ? 'Save changes' : 'Create member'}
            </button>
            <button type="button" onClick={() => navigate('/members')} className="btn btn-ghost">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}



