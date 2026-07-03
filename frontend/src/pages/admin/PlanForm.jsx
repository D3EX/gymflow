import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from "../../api/client"
import toast from 'react-hot-toast'
import { ArrowLeft } from 'lucide-react'

export default function PlanForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    duration_days: '',
    description: '',
  })

  useEffect(() => {
    if (id) {
      fetchPlan()
    }
  }, [id])

  const fetchPlan = async () => {
    try {
      const response = await api.get(`/plans/${id}`)
      setFormData(response.data)
    } catch (error) {
      toast.error('Failed to fetch plan')
      navigate('/plans')
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      if (id) {
        await api.put(`/plans/${id}`, formData)
        toast.success('Plan updated')
      } else {
        await api.post('/plans', formData)
        toast.success('Plan created')
      }
      navigate('/plans')
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{id ? 'Edit Plan' : 'Add Plan'}</h1>
          <p className="page-subtitle">{id ? 'Update plan details' : 'Create a new membership plan'}</p>
        </div>
        <button onClick={() => navigate('/plans')} className="btn btn-ghost">
          <ArrowLeft size={18} />
          Back
        </button>
      </div>
      
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Plan Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Price (DZD) *</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Duration (days) *</label>
              <input
                type="number"
                name="duration_days"
                value={formData.duration_days}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="form-input"
                rows="3"
              />
            </div>
          </div>
          
          <div className="flex gap-3 mt-6">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : (id ? 'Update Plan' : 'Create Plan')}
            </button>
            <button type="button" onClick={() => navigate('/plans')} className="btn btn-ghost">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
