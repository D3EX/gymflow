// frontend/src/pages/member/Nutrition.jsx
import { useEffect, useState } from 'react'
import api from '../../api/client'
import { 
  Sun, Moon, CheckCircle, Flame, Droplet, Target, Award, 
  Camera, Sparkles, Loader2, Plus, X, Search, Calendar,
  Trash2, Edit2, Save, Clock, Utensils, Coffee, 
  Pizza, Apple, Fish, Beef, Salad, Egg, Milk, 
  Music, Zap, TrendingUp, BarChart, Minus, RotateCcw
} from 'lucide-react'
import toast from 'react-hot-toast'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const MEAL_TYPES = [
  { value: 'breakfast', label: 'Breakfast', icon: Sun },
  { value: 'lunch', label: 'Lunch', icon: Pizza },
  { value: 'dinner', label: 'Dinner', icon: Moon },
  { value: 'snack', label: 'Snack', icon: Coffee },
]

const DEFAULT_WATER_GOAL_L = 2.5

// ============================================================
// COMPONENTS
// ============================================================

function LoadingSpinner() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '14px',
      padding: '60px 20px',
    }}>
      <Loader2 size={32} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <span style={{ color: 'var(--text-3)', fontSize: '13px', fontWeight: 600 }}>Loading meal plan…</span>
    </div>
  )
}

function EmptyState({ icon: Icon, title, description, action, actionLabel }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '60px 20px',
      background: 'var(--surface-2)',
      borderRadius: '16px',
      border: '1px dashed var(--border)',
    }}>
      <Icon size={48} color="var(--text-3)" style={{ margin: '0 auto 12px', opacity: 0.4 }} />
      <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-2)' }}>{title}</p>
      <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>{description}</p>
      {action && actionLabel && (
        <button
          onClick={action}
          className="btn-primary"
          style={{ 
            marginTop: '16px',
            background: '#C56A2A !important',
            backgroundColor: '#C56A2A !important',
            color: '#FFFFFF !important',
            border: 'none !important',
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}

function MacroRing({ label, value, target, color, size = 84 }) {
  const pct = Math.min(100, Math.round((value / target) * 100))
  const radius = (size - 10) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference

  return (
    <div className="macro-ring-item" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
      <svg width={size} height={size} style={{ flexShrink: 0, transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--border)" strokeWidth="8" />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
        <text
          x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="middle"
          fill={color} fontSize="15" fontWeight="800"
          style={{ transform: 'rotate(90deg)', transformOrigin: `${size / 2}px ${size / 2}px` }}
        >
          {pct}%
        </text>
      </svg>
      <div className="macro-ring-text">
        <p style={{ fontSize: '13px', fontWeight: 700, marginBottom: '3px', color: 'var(--text)' }}>{label}</p>
        <p style={{ fontSize: '12px', color: 'var(--text-3)' }}>
          <span style={{ color, fontWeight: 800 }}>{value}g</span> / {target}g
        </p>
      </div>
    </div>
  )
}

function WaterBottle({ liters, goal, onAdd, onUndo, disabled }) {
  const pct = goal > 0 ? Math.min(100, Math.round((liters / goal) * 100)) : 0
  // Bottle interior spans from y=34 (shoulder) to y=210 (base) in the viewBox below.
  const interiorTop = 34
  const interiorBottom = 210
  const fillY = interiorBottom - (pct / 100) * (interiorBottom - interiorTop)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
      <svg width="108" height="240" viewBox="0 0 108 240" style={{ flexShrink: 0 }}>
        <defs>
          <clipPath id="bottleClip">
            <path d="M40 6 H68 V26 C68 30 72 30 76 34 C84 40 90 50 90 64 V224 C90 232 84 238 76 238 H32 C24 238 18 232 18 224 V64 C18 50 24 40 32 34 C36 30 40 30 40 26 Z" />
          </clipPath>
          <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--blue)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="var(--blue)" stopOpacity="0.65" />
          </linearGradient>
        </defs>

        {/* Bottle body outline */}
        <path
          d="M40 6 H68 V26 C68 30 72 30 76 34 C84 40 90 50 90 64 V224 C90 232 84 238 76 238 H32 C24 238 18 232 18 224 V64 C18 50 24 40 32 34 C36 30 40 30 40 26 Z"
          fill="var(--surface-3)"
          stroke="var(--border)"
          strokeWidth="2.5"
        />

        {/* Cap */}
        <rect x="38" y="0" width="32" height="10" rx="3" fill="var(--surface-3)" stroke="var(--border)" strokeWidth="2" />

        {/* Water fill, clipped to bottle silhouette — only render when there's water to show */}
        {pct > 0 && (
          <g clipPath="url(#bottleClip)">
            <rect
              x="14" y={fillY} width="80" height={interiorBottom - fillY + 40}
              fill="url(#waterGrad)"
              style={{ transition: 'y 0.6s cubic-bezier(0.34, 1.2, 0.64, 1), height 0.6s cubic-bezier(0.34, 1.2, 0.64, 1)' }}
            />
            {/* Wavy meniscus line at the surface */}
            <path
              d={`M14 ${fillY} Q 27 ${fillY - 4}, 40 ${fillY} T 67 ${fillY} T 94 ${fillY}`}
              fill="none"
              stroke="var(--blue)"
              strokeWidth="2.5"
              strokeOpacity="0.8"
              style={{ transition: 'd 0.6s cubic-bezier(0.34, 1.2, 0.64, 1)' }}
            />
          </g>
        )}

        {/* Measurement lines for a "bottle" feel */}
        {[64, 110, 156, 202].map((y) => (
          <line key={y} x1="22" y1={y} x2="30" y2={y} stroke="var(--border)" strokeWidth="1.5" opacity="0.6" />
        ))}

        {/* Percentage label */}
        <text x="54" y="125" textAnchor="middle" fontSize="20" fontWeight="800" fill={pct > 45 ? '#FFFFFF' : 'var(--text)'} style={{ transition: 'fill 0.3s ease' }}>
          {pct}%
        </text>
      </svg>

      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>
          {liters.toFixed(2).replace(/\.?0+$/, '') || 0}L
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-3)' }}> / {goal}L</span>
        </p>
        <p style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>Water intake today</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button className="water-btn-v2" disabled={disabled} onClick={() => onAdd(250)}>
          <Droplet size={12} /> +250ml
        </button>
        <button className="water-btn-v2" disabled={disabled} onClick={() => onAdd(500)}>
          <Droplet size={12} /> +500ml
        </button>
        <button
          className="water-undo-btn-v2"
          disabled={disabled || liters <= 0}
          onClick={() => onUndo(-250)}
          title="Undo last 250ml"
        >
          <RotateCcw size={13} />
        </button>
      </div>
    </div>
  )
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function MemberNutrition() {
  const [loading, setLoading] = useState(true)
  const [mealPlan, setMealPlan] = useState(null)
  const [hasMealPlan, setHasMealPlan] = useState(false)
  const [activeDay, setActiveDay] = useState('Monday')
  const [updating, setUpdating] = useState(false)
  const [updatingWater, setUpdatingWater] = useState(false)

  // Builder state
  const [showBuilder, setShowBuilder] = useState(false)
  const [planForm, setPlanForm] = useState({
    week_start: new Date().toISOString().split('T')[0],
    daily_calorie_goal: 2000,
    daily_water_goal: DEFAULT_WATER_GOAL_L,
  })
  
  // Add meal state
  const [showAddMeal, setShowAddMeal] = useState(false)
  const [selectedDay, setSelectedDay] = useState(null)
  const [mealForm, setMealForm] = useState({
    name: '',
    meal_type: 'breakfast',
    meal_time: '12:00 PM',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    items: [],
  })
  const [itemInput, setItemInput] = useState('')

  // Edit meal state
  const [editingMeal, setEditingMeal] = useState(null)

  useEffect(() => {
    fetchMealPlan()
  }, [])

  // ============================================================
  // FETCH MEAL PLAN - ✅ FIXED (handles 404 properly)
  // ============================================================
  const fetchMealPlan = async () => {
    setLoading(true)
    try {
      const res = await api.get('/nutrition/my')
      console.log('Fetched meal plan:', res.data)
      
      if (res.data && res.data.id) {
        if (res.data.days && res.data.days.length > 0) {
          const mappedDays = res.data.days.map(day => ({
            ...day,
            day: day.day_of_week || day.day,
            totalCalories: day.totalCalories || day.total_calories || 0,
            protein: day.protein || day.total_protein || 0,
            carbs: day.carbs || day.total_carbs || 0,
            fat: day.fat || day.total_fat || 0,
            water: day.water ?? day.water_intake ?? 0,
          }))
          res.data.days = mappedDays
        } else {
          const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
          res.data.days = daysOfWeek.map(day => ({
            id: null,
            day: day,
            day_of_week: day,
            meals: [],
            totalCalories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            water: 0
          }))
        }
        
        res.data.daily_water_goal = res.data.daily_water_goal || DEFAULT_WATER_GOAL_L
        
        setMealPlan(res.data)
        setHasMealPlan(true)
        
        const firstDayWithMeals = res.data.days.find(d => d.meals && d.meals.length > 0)
        if (firstDayWithMeals) {
          setActiveDay(firstDayWithMeals.day)
        } else if (res.data.days.length > 0) {
          setActiveDay(res.data.days[0].day)
        }
      } else {
        setHasMealPlan(false)
      }
    } catch (error) {
      // ✅ Handle 404 gracefully - no meal plan exists, that's fine
      if (error.response?.status === 404) {
        console.log('No meal plan found for this week. User needs to create one.')
        setHasMealPlan(false)
        setMealPlan(null)
      } else {
        console.error('Failed to fetch meal plan:', error)
        setHasMealPlan(false)
      }
    } finally {
      setLoading(false)
    }
  }

  // ============================================================
  // CALCULATE DAY TOTALS
  // ============================================================
  const calculateDayTotals = (day) => {
    if (!day) return { 
      totalCalories: 0, 
      protein: 0, 
      carbs: 0, 
      fat: 0, 
      water: 0,
      meals: [],
      day: '',
      day_of_week: ''
    }
    
    if (day.totalCalories !== undefined && day.totalCalories > 0) {
      return day
    }
    
    const meals = day.meals || []
    const totals = meals.reduce((acc, meal) => ({
      totalCalories: acc.totalCalories + (meal.calories || 0),
      protein: acc.protein + (meal.protein || 0),
      carbs: acc.carbs + (meal.carbs || 0),
      fat: acc.fat + (meal.fat || 0)
    }), { totalCalories: 0, protein: 0, carbs: 0, fat: 0 })
    
    return {
      ...day,
      totalCalories: totals.totalCalories,
      protein: totals.protein,
      carbs: totals.carbs,
      fat: totals.fat
    }
  }

  // ============================================================
  // CREATE MEAL PLAN - ✅ FIXED with proper date handling
  // ============================================================
  const handleCreatePlan = async () => {
    try {
      // Calculate the Monday of the selected week using local date
      const selectedDate = new Date(planForm.week_start)
      const dayOfWeek = selectedDate.getDay()
      // If Sunday (0), go back 6 days to Monday, otherwise go back (dayOfWeek - 1) days
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      const monday = new Date(selectedDate)
      monday.setDate(selectedDate.getDate() - diff)
      
      // Format as YYYY-MM-DD using local date (no timezone issues)
      const year = monday.getFullYear()
      const month = String(monday.getMonth() + 1).padStart(2, '0')
      const day = String(monday.getDate()).padStart(2, '0')
      const weekStartStr = `${year}-${month}-${day}`
      
      const payload = {
        week_start: weekStartStr,
        daily_calorie_goal: planForm.daily_calorie_goal || 2000,
        daily_water_goal: planForm.daily_water_goal || DEFAULT_WATER_GOAL_L,
      }
      
      console.log('Creating meal plan with week_start:', weekStartStr)
      console.log('Full payload:', payload)
      
      await api.post('/nutrition/meal-plans', payload)
      toast.success('Meal plan created successfully!')
      setShowBuilder(false)
      fetchMealPlan()
    } catch (error) {
      console.error('Error creating meal plan:', error)
      
      if (error.response?.status === 400) {
        const detail = error.response?.data?.detail || ''
        if (detail.includes('already exists')) {
          toast('A meal plan already exists for this week. Loading it...', {
            icon: 'ℹ️',
            duration: 3000
          })
          await fetchMealPlan()
          setShowBuilder(false)
          return
        }
      }
      
      toast.error(error.response?.data?.detail || 'Failed to create meal plan')
    }
  }

  // ============================================================
  // WATER TRACKING
  // ============================================================
  const updateWater = async (deltaMl) => {
    if (!mealPlan || updatingWater) return

    const dayIndex = mealPlan.days.findIndex(
      d => (d.day || d.day_of_week) === activeDay
    )
    if (dayIndex === -1) return

    const day = mealPlan.days[dayIndex]
    if (!day.id) {
      toast.error('Add a meal to this day first, then you can log water')
      return
    }

    const currentLiters = day.water || 0
    const newLiters = Math.max(0, Math.round((currentLiters * 1000 + deltaMl)) / 1000)

    // Optimistic update
    const previousPlan = mealPlan
    const updatedPlan = { ...mealPlan }
    updatedPlan.days = [...mealPlan.days]
    updatedPlan.days[dayIndex] = { ...day, water: newLiters }
    setMealPlan(updatedPlan)

    setUpdatingWater(true)
    try {
      await api.put(`/nutrition/days/${day.id}/water`, { water: newLiters })
      if (deltaMl > 0) {
        toast.success(`+${deltaMl}ml logged`)
      }
    } catch (error) {
      // Roll back on failure
      setMealPlan(previousPlan)
      toast.error('Failed to update water intake')
    } finally {
      setUpdatingWater(false)
    }
  }

  // ============================================================
  // MEAL CRUD OPERATIONS
  // ============================================================
  const toggleMeal = async (dayIndex, mealIndex) => {
    if (!mealPlan || updating) return
    
    setUpdating(true)
    try {
      const day = mealPlan.days[dayIndex]
      const meal = day.meals[mealIndex]
      
      await api.put(`/nutrition/meals/${meal.id}/toggle`)
      
      const updatedPlan = { ...mealPlan }
      updatedPlan.days[dayIndex].meals[mealIndex].done = !meal.done
      setMealPlan(updatedPlan)
      
      toast.success(meal.done ? 'Meal unchecked' : 'Meal completed!')
    } catch (error) {
      toast.error('Failed to update meal')
    } finally {
      setUpdating(false)
    }
  }

  const addMeal = async () => {
    if (!selectedDay) {
      toast.error('Please select a day first')
      return
    }
    
    if (!mealForm.name) {
      toast.error('Please enter a meal name')
      return
    }
    
    try {
      console.log('Adding meal to day:', selectedDay.id)
      
      const response = await api.post('/nutrition/meals', {
        day_id: selectedDay.id,
        name: mealForm.name,
        meal_type: mealForm.meal_type,
        meal_time: mealForm.meal_time,
        calories: parseInt(mealForm.calories) || 0,
        protein: parseFloat(mealForm.protein) || 0,
        carbs: parseFloat(mealForm.carbs) || 0,
        fat: parseFloat(mealForm.fat) || 0,
        items: mealForm.items,
      })
      
      console.log('Meal added:', response.data)
      
      toast.success(`Added ${mealForm.name}`)
      setShowAddMeal(false)
      setMealForm({
        name: '',
        meal_type: 'breakfast',
        meal_time: '12:00 PM',
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        items: [],
      })
      setItemInput('')
      fetchMealPlan()
    } catch (error) {
      console.error('Error adding meal:', error)
      toast.error(error.response?.data?.detail || 'Failed to add meal')
    }
  }

  const updateMeal = async () => {
    if (!editingMeal) return
    
    try {
      await api.put(`/nutrition/meals/${editingMeal.id}`, {
        name: mealForm.name,
        meal_type: mealForm.meal_type,
        meal_time: mealForm.meal_time,
        calories: parseInt(mealForm.calories) || 0,
        protein: parseFloat(mealForm.protein) || 0,
        carbs: parseFloat(mealForm.carbs) || 0,
        fat: parseFloat(mealForm.fat) || 0,
        items: mealForm.items,
      })
      
      toast.success('Meal updated!')
      setEditingMeal(null)
      setShowAddMeal(false)
      setMealForm({
        name: '',
        meal_type: 'breakfast',
        meal_time: '12:00 PM',
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        items: [],
      })
      setItemInput('')
      fetchMealPlan()
    } catch (error) {
      toast.error('Failed to update meal')
    }
  }

  const deleteMeal = async (mealId, mealName) => {
    if (!confirm(`Delete "${mealName}"?`)) return
    
    try {
      await api.delete(`/nutrition/meals/${mealId}`)
      toast.success('Meal deleted')
      fetchMealPlan()
    } catch (error) {
      toast.error('Failed to delete meal')
    }
  }

  const handleEditMeal = (meal) => {
    setEditingMeal(meal)
    setMealForm({
      name: meal.name,
      meal_type: meal.meal_type || 'breakfast',
      meal_time: meal.meal_time || '12:00 PM',
      calories: meal.calories || 0,
      protein: meal.protein || 0,
      carbs: meal.carbs || 0,
      fat: meal.fat || 0,
      items: meal.items || [],
    })
    setItemInput('')
    setShowAddMeal(true)
  }

  const addItem = () => {
    if (itemInput.trim()) {
      setMealForm({
        ...mealForm,
        items: [...mealForm.items, itemInput.trim()]
      })
      setItemInput('')
    }
  }

  const removeItem = (index) => {
    setMealForm({
      ...mealForm,
      items: mealForm.items.filter((_, i) => i !== index)
    })
  }

  const getMealTypeIcon = (type) => {
    const found = MEAL_TYPES.find(m => m.value === type)
    return found ? found.icon : Sun
  }

  const formatDate = (d) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  if (loading) {
    return (
      <div style={{
        background: 'var(--bg)',
        color: 'var(--text)',
        fontFamily: "'Inter', -apple-system, sans-serif",
        padding: '0px',
        minHeight: '100vh',
        boxSizing: 'border-box',
      }}>
        <LoadingSpinner />
      </div>
    )
  }

  if (!hasMealPlan) {
    return (
      <div style={{
        background: 'var(--bg)',
        color: 'var(--text)',
        fontFamily: "'Inter', -apple-system, sans-serif",
        padding: '0px',
        minHeight: '100vh',
        boxSizing: 'border-box',
      }}>
        <style>{`
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
          .btn-primary {
            padding: 10px 20px;
            border-radius: 10px;
            border: none !important;
            background: #C56A2A !important;
            background-color: #C56A2A !important;
            color: #FFFFFF !important;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s;
            display: inline-flex;
            align-items: center;
            gap: 8px;
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
            display: inline-flex;
            align-items: center;
            gap: 8px;
          }
          .btn-secondary:hover {
            border-color: var(--text) !important;
            color: var(--text) !important;
          }
          .plan-form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
          }
          @media (max-width: 560px) {
            .plan-form-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>

        <div style={{ marginBottom: '22px' }}>
          <p style={{ fontSize: '11px', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, marginBottom: '6px' }}>
            Nutrition
          </p>
          <h1 style={{ fontSize: 'clamp(21px, 5.5vw, 28px)', fontWeight: 800, letterSpacing: '-0.02em', margin: 0, color: 'var(--text)' }}>
            Meal Plan
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>
            Track your meals and macronutrients
          </p>
        </div>

        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: 'clamp(18px, 5vw, 32px)',
        }}>
          {!showBuilder ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Utensils size={48} color="var(--text-3)" style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-2)' }}>No Meal Plan</p>
              <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>
                Create a weekly meal plan to track your nutrition.
              </p>
              <button
                onClick={() => setShowBuilder(true)}
                className="btn-primary"
                style={{ 
                  marginTop: '16px',
                  background: '#C56A2A !important',
                  backgroundColor: '#C56A2A !important',
                  color: '#FFFFFF !important',
                  border: 'none !important',
                }}
              >
                Create Meal Plan
              </button>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: 'var(--text)' }}>
                Create Meal Plan
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-3)', marginBottom: '24px' }}>
                Set up your weekly meal plan. You'll add meals for each day next.
              </p>

              <div className="plan-form-grid">
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>
                    Week Starting *
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={planForm.week_start}
                    onChange={(e) => setPlanForm({ ...planForm, week_start: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>
                    Daily Calorie Goal
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    value={planForm.daily_calorie_goal}
                    onChange={(e) => setPlanForm({ ...planForm, daily_calorie_goal: parseInt(e.target.value) || 2000 })}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '6px' }}>
                    Daily Water Goal (L)
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    value={planForm.daily_water_goal}
                    onChange={(e) => setPlanForm({ ...planForm, daily_water_goal: parseFloat(e.target.value) || DEFAULT_WATER_GOAL_L })}
                    step="0.25"
                    min="0.5"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px', flexWrap: 'wrap' }}>
                <button
                  onClick={handleCreatePlan}
                  className="btn-primary"
                  style={{
                    background: '#C56A2A !important',
                    backgroundColor: '#C56A2A !important',
                    color: '#FFFFFF !important',
                    border: 'none !important',
                  }}
                >
                  Create Plan
                </button>
                <button
                  onClick={() => setShowBuilder(false)}
                  className="btn-secondary"
                  style={{
                    background: 'transparent !important',
                    color: 'var(--text-2) !important',
                    border: '1px solid var(--border) !important',
                  }}
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  // ============================================================
  // CURRENT DAY DATA
  // ============================================================
  const currentDayData = mealPlan.days.find(d => d.day === activeDay || d.day_of_week === activeDay)
  const rawDay = currentDayData || mealPlan.days[0]
  const currentDay = calculateDayTotals(rawDay)
  
  const calorieGoalPct = currentDay ? Math.round((currentDay.totalCalories / mealPlan.daily_calorie_goal) * 100) : 0
  const waterGoal = mealPlan.daily_water_goal || DEFAULT_WATER_GOAL_L
  const waterLiters = currentDay?.water || 0
  const waterGoalPct = waterGoal > 0 ? Math.round((waterLiters / waterGoal) * 100) : 0

  const macros = [
    { label: 'Protein', value: currentDay?.protein || 0, target: 160, color: 'var(--accent)' },
    { label: 'Carbohydrates', value: currentDay?.carbs || 0, target: 200, color: 'var(--green)' },
    { label: 'Fat', value: currentDay?.fat || 0, target: 70, color: 'var(--amber)' }
  ]

  const completedMeals = currentDay?.meals?.filter(m => m.done).length || 0
  const totalMeals = currentDay?.meals?.length || 0

  return (
    <div style={{
      background: 'var(--bg)',
      color: 'var(--text)',
      fontFamily: "'Inter', -apple-system, sans-serif",
      padding: '2px',
      minHeight: '100vh',
      boxSizing: 'border-box',
    }}>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }
        .meal-card {
          transition: all 0.2s ease;
        }
        .meal-card:hover {
          border-color: var(--accent)55 !important;
          box-shadow: 0 0 0 1px var(--accent)22, 0 6px 16px rgba(0,0,0,0.3);
        }
        .meal-icon-wrap {
          transition: all 0.2s ease;
        }
        .meal-action-btn {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: var(--surface-3);
          color: var(--text-3);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
          flex-shrink: 0;
        }
        .meal-action-btn:hover {
          border-color: var(--text-2);
          color: var(--text);
        }
        .meal-action-btn.danger:hover {
          border-color: var(--red)55;
          color: var(--red);
          background: var(--red)14;
        }
        .meal-action-btn.toggle {
          width: auto;
          padding: 0 12px;
          font-size: 11px;
          font-weight: 700;
          gap: 5px;
        }
        .meal-action-btn.toggle.done {
          background: var(--green) !important;
          border-color: var(--green) !important;
          color: var(--bg) !important;
        }
        .macro-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 10.5px;
          font-weight: 700;
          padding: 3px 9px;
          border-radius: 99px;
        }
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.8);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }
        .modal-content {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 18px;
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow: hidden;
          box-shadow: 0 24px 64px rgba(0,0,0,0.5);
        }
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
        .btn-primary {
          padding: 10px 20px;
          border-radius: 10px;
          border: none !important;
          background: #C56A2A !important;
          background-color: #C56A2A !important;
          color: #FFFFFF !important;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
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
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .btn-secondary:hover {
          border-color: var(--text) !important;
          color: var(--text) !important;
        }
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 10px;
          border-radius: 99px;
          font-size: 10px;
          font-weight: 700;
        }
        .badge-done {
          background: var(--green)1A;
          color: var(--green);
          border: 1px solid var(--green)33;
        }
        .day-btn {
          padding: 8px 18px;
          border-radius: 20px;
          font-size: 13px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
          font-weight: 600;
          border: 1px solid var(--border);
          background: var(--surface) !important;
          color: var(--text-2) !important;
        }
        .day-btn:hover:not(.day-active) {
          border-color: var(--accent);
          color: var(--accent) !important;
        }
        .day-active {
          background: #C56A2A !important;
          background-color: #C56A2A !important;
          color: #FFFFFF !important;
          border-color: #C56A2A !important;
          font-weight: 700;
        }
        .day-inactive {
          background: var(--surface) !important;
          color: var(--text-2) !important;
          border: 1px solid var(--border);
        }
        .day-inactive.has-data {
          color: var(--text) !important;
        }
        .day-count {
          font-size: 9px;
          padding: 1px 7px;
          border-radius: 99px;
          font-weight: 700;
        }
        .day-count-active {
          background: rgba(255,255,255,0.25) !important;
          color: #FFFFFF !important;
        }
        .day-count-inactive {
          background: var(--surface-3);
          color: var(--text-3);
        }
        button.btn-primary,
        button[class*="btn-primary"],
        .btn-primary {
          background: #C56A2A !important;
          background-color: #C56A2A !important;
          color: #FFFFFF !important;
          border: none !important;
        }
        button.btn-primary:hover,
        button[class*="btn-primary"]:hover,
        .btn-primary:hover {
          background: #FF7A45 !important;
          background-color: #FF7A45 !important;
          color: #FFFFFF !important;
        }
        .meal-action-btn.toggle:not(.done) {
          background: #C56A2A !important;
          background-color: #C56A2A !important;
          color: #FFFFFF !important;
          border: 1px solid #C56A2A !important;
        }
        .meal-action-btn.toggle:not(.done):hover {
          opacity: 0.85 !important;
        }
        .water-btn-v2 {
          border: 1px solid var(--blue)44;
          background: var(--blue)14;
          color: var(--blue);
          font-size: 11px;
          font-weight: 700;
          padding: 6px 11px;
          border-radius: 99px;
          cursor: pointer;
          transition: all 0.15s ease;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
        }
        .water-btn-v2:hover:not(:disabled) {
          background: var(--blue);
          border-color: var(--blue);
          color: #FFFFFF;
          transform: translateY(-1px);
        }
        .water-btn-v2:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .water-undo-btn-v2 {
          border: 1px solid var(--border);
          background: var(--surface-3);
          color: var(--text-3);
          cursor: pointer;
          padding: 6px;
          border-radius: 99px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
        }
        .water-undo-btn-v2:hover:not(:disabled) {
          color: var(--text);
          border-color: var(--text-2);
        }
        .water-undo-btn-v2:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        /* ============================================================
           RESPONSIVE / MOBILE LAYOUT
           ============================================================ */
        .day-selector {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }
        .content-grid {
          display: grid;
          grid-template-columns: 2.4fr 1fr 1fr;
          gap: 16px;
          align-items: start;
        }
        .meals-panel, .water-panel, .macros-panel {
          height: 454px;
          max-height: 454px;
        }
        .macros-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .meal-row-grid {
          display: grid;
          grid-template-columns: 42px 1fr auto;
          align-items: center;
          gap: 14px;
        }
        .meal-name-text {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 220px;
        }
        .meal-fields-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr;
          gap: 12px;
        }
        .meal-type-time-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        @media (max-width: 900px) {
          .content-grid {
            grid-template-columns: 1fr 1fr;
          }
          .meals-panel {
            grid-column: 1 / -1;
            height: auto;
            max-height: none;
          }
          .water-panel, .macros-panel {
            height: 380px;
            max-height: none;
          }
        }

        @media (max-width: 640px) {
          /* Day tabs: one continuous scrollable line, never wrap */
          .day-selector {
            flex-wrap: nowrap !important;
            overflow-x: auto !important;
            overflow-y: hidden !important;
            -webkit-overflow-scrolling: touch;
            padding-bottom: 6px !important;
            margin-bottom: 14px !important;
          }
          .day-btn {
            flex-shrink: 0 !important;
            padding: 7px 14px !important;
            font-size: 12.5px !important;
          }

          /* Stat cards: force all 3 to stay in one row, shrink to fit */
          .stats-grid {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 6px !important;
          }
          .stats-grid > div {
            padding: 10px 6px !important;
          }
          .stats-grid .stat-icon-wrap {
            width: 28px !important;
            height: 28px !important;
            margin-bottom: 6px !important;
          }
          .stats-grid .stat-value {
            font-size: 15px !important;
          }
          .stats-grid .stat-label {
            font-size: 10px !important;
          }
          .stats-grid .stat-sub {
            font-size: 9px !important;
          }

          .content-grid {
            grid-template-columns: 1fr;
          }
          .water-panel, .macros-panel {
            height: auto;
          }

          /* Macros panel goes above the meals list, laid out horizontally */
          .macros-panel { order: 1 !important; }
          .meals-panel  { order: 2 !important; }
          .water-panel  { order: 3 !important; }

          .macros-list {
            flex-direction: row !important;
            justify-content: space-between !important;
            gap: 6px !important;
          }
          .macro-ring-item {
            flex-direction: column !important;
            align-items: center !important;
            gap: 6px !important;
            flex: 1 1 0 !important;
            min-width: 0 !important;
          }
          .macro-ring-text {
            text-align: center !important;
          }
          .macro-ring-text p {
            font-size: 10.5px !important;
            white-space: nowrap !important;
          }

          .meal-fields-grid {
            grid-template-columns: 1fr 1fr;
          }
          
          /* ==========================================================
             PERFECT MOBILE MEAL ROW REDESIGN (Organized Horizontal)
             ========================================================== */
          .meal-row-grid {
            display: flex !important;
            flex-direction: row !important;
            align-items: center !important;
            justify-content: space-between !important;
            gap: 8px !important;
            padding: 10px 12px !important;
          }
          
          /* 1. Left Column: Shrink Icon */
          .meal-row-grid .meal-icon-wrap {
            width: 34px !important;
            height: 34px !important;
            flex-shrink: 0 !important;
          }
          .meal-row-grid .meal-icon-wrap svg {
            width: 16px !important;
            height: 16px !important;
          }
          
          /* 2. Middle Column: Flex container for text */
          .meal-row-grid > div:nth-child(2) {
            flex: 1 !important;
            min-width: 0 !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
            gap: 2px !important;
          }

          /* Middle: Top row (Name + Calories) */
          .meal-row-grid > div:nth-child(2) > div:first-child {
            display: flex !important;
            align-items: baseline !important;
            gap: 6px !important;
            flex-wrap: nowrap !important;
          }
          .meal-name-text {
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            max-width: 100% !important;
            font-size: 13px !important;
          }
          
          /* Middle: Bottom row (Time + Macros) */
          .meal-row-grid > div:nth-child(2) > div:nth-child(2) {
            display: flex !important;
            flex-wrap: wrap !important;
            align-items: center !important;
            gap: 4px 8px !important;
            margin-top: 0px !important;
          }
          .meal-row-grid > div:nth-child(2) > div:nth-child(2) > span {
            font-size: 10px !important;
          }
          .meal-row-grid > div:nth-child(2) > div:nth-child(2) > span.macro-pill {
            font-size: 9px !important;
            padding: 1px 6px !important;
            line-height: normal !important;
          }
          .meal-row-grid > div:nth-child(2) > div:nth-child(2) > span:first-child { 
            white-space: nowrap !important;
          }

          /* 3. Right Column: Buttons */
          .meal-actions-cell {
            flex-shrink: 0 !important;
            gap: 4px !important;
          }
          .meal-action-btn {
            width: 24px !important;
            height: 24px !important;
          }
          .meal-action-btn svg {
            width: 11px !important;
            height: 11px !important;
          }
          .meal-action-btn.toggle {
            width: auto !important;
            padding: 0 10px !important;
            font-size: 10px !important;
          }
          .meal-action-btn.toggle svg {
            width: 10px !important;
            height: 10px !important;
          }
        }

        @media (max-width: 420px) {
          .meal-row-grid > div:nth-child(2) > div:nth-child(2) > span:first-child + span {
            display: none !important;
          }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '22px' }}>
        <div>
          <p style={{ fontSize: '11px', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, marginBottom: '6px' }}>
            Nutrition
          </p>
          <h1 style={{ fontSize: 'clamp(21px, 5.5vw, 28px)', fontWeight: 800, letterSpacing: '-0.02em', margin: 0, color: 'var(--text)' }}>
            Meal Plan
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>
            {mealPlan.week_start 
              ? `Week of ${formatDate(mealPlan.week_start)}`
              : 'Track your meals and macronutrients'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{
            fontSize: '11.5px', fontWeight: 700, padding: '7px 14px', borderRadius: '99px',
            background: 'var(--green)1A', color: 'var(--green)',
          }}>
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}
          </span>
        </div>
      </div>

      {/* Day selector */}
      <div className="day-selector">
        {DAYS.map((day) => {
          const isActive = activeDay === day
          const dayData = mealPlan.days.find(d => d.day === day || d.day_of_week === day)
          const hasData = dayData && dayData.meals && dayData.meals.length > 0
          const mealCount = dayData?.meals?.length || 0
          
          return (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`day-btn ${isActive ? 'day-active' : hasData ? 'day-inactive has-data' : 'day-inactive'}`}
            >
              {day.slice(0, 3)}
              {hasData && mealCount > 0 && (
                <span className={`day-count ${isActive ? 'day-count-active' : 'day-count-inactive'}`}>
                  {mealCount}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Summary stats */}
      <div className="stats-grid">
        {[
          { type: 'calories', icon: Flame, color: 'var(--accent)', value: currentDay?.totalCalories || 0, label: 'Calories', sub: `${calorieGoalPct}% of goal` },
          { type: 'protein', icon: Target, color: 'var(--green)', value: `${currentDay?.protein || 0}g`, label: 'Protein', sub: 'of 160g target' },
          { type: 'meals', icon: Award, color: 'var(--amber)', value: totalMeals > 0 ? `${completedMeals}/${totalMeals}` : '—', label: 'Meals done', sub: totalMeals > 0 ? 'today' : 'No meals planned' }
        ].map(({ type, icon: Icon, color, value, label, sub }) => (
          <div key={label} style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            padding: '18px',
            textAlign: 'center',
          }}>
            <div className="stat-icon-wrap" style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: `${color}1F`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 10px',
            }}>
              <Icon size={16} color={color} />
            </div>
            <p className="stat-value" style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1, color: 'var(--text)' }}>{value}</p>
            <p className="stat-label" style={{ fontSize: '12px', color: 'var(--text-2)', marginTop: '4px', fontWeight: 600 }}>{label}</p>
            <p className="stat-sub" style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Meals + Water + Macros */}
      <div className="content-grid">
        {/* Meals */}
        <div className="meals-panel" style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
            flexShrink: 0,
          }}>
            <h3 style={{ fontSize: '14.5px', fontWeight: 700, margin: 0, color: 'var(--text)' }}>
              {activeDay}'s Meals
            </h3>
            <button
              onClick={() => { 
                setSelectedDay(currentDay)
                setEditingMeal(null)
                setMealForm({
                  name: '',
                  meal_type: 'breakfast',
                  meal_time: '12:00 PM',
                  calories: 0,
                  protein: 0,
                  carbs: 0,
                  fat: 0,
                  items: [],
                })
                setItemInput('')
                setShowAddMeal(true)
              }}
              className="btn-primary"
              style={{ 
                padding: '6px 14px', 
                fontSize: '12px',
                background: '#C56A2A !important',
                backgroundColor: '#C56A2A !important',
                color: '#FFFFFF !important',
                border: 'none !important',
              }}
            >
              <Plus size={12} />
              Add Meal
            </button>
          </div>

          {currentDay?.meals?.length > 0 ? (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '10px', 
              overflowY: 'auto', 
              overflowX: 'hidden', 
              flex: 1, 
              minHeight: 0, 
              padding: '2px 4px 2px 2px'
            }}>
              {currentDay.meals.map((meal, idx) => {
                const MealIcon = getMealTypeIcon(meal.meal_type)
                return (
                  <div
                    key={meal.id}
                    className="meal-card meal-row-grid"
                    style={{
                      padding: '14px 16px',
                      borderRadius: '12px',
                      background: meal.done ? 'var(--green)0D' : 'var(--surface-2)',
                      border: `1px solid ${meal.done ? 'var(--green)33' : 'var(--border)'}`,
                      flexShrink: 0,
                    }}
                  >
                    {/* 1. Left: Icon */}
                    <div className="meal-icon-wrap" style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      flexShrink: 0,
                      background: meal.done ? 'var(--green)' : 'var(--surface-3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: meal.done ? 'var(--bg)' : 'var(--text-3)',
                    }}>
                      <MealIcon size={18} />
                    </div>

                    {/* 2. Middle: Content (Stacked) */}
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '2px' }}>
                      {/* Row 1: Name and Calories */}
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'nowrap' }}>
                        <p className="meal-name-text" style={{
                          fontSize: '14px',
                          fontWeight: 700,
                          margin: 0,
                          color: meal.done ? 'var(--text-3)' : 'var(--text)',
                          textDecoration: meal.done ? 'line-through' : 'none',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {meal.name}
                        </p>
                        <span style={{
                          fontSize: '14px',
                          fontWeight: 800,
                          color: 'var(--accent)',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                        }}>
                          {meal.calories} cal
                        </span>
                        {meal.done && (
                          <span className="badge badge-done" style={{ flexShrink: 0 }}>
                            <CheckCircle size={10} /> Done
                          </span>
                        )}
                      </div>

                      {/* Row 2: Time, Type, and Macros */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 8px' }}>
                        <span style={{
                          fontSize: '10.5px',
                          fontWeight: 600,
                          color: 'var(--text-2)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          whiteSpace: 'nowrap',
                        }}>
                          <Clock size={10} /> {meal.meal_time}
                        </span>
                        <span style={{ color: 'var(--text-3)', fontSize: '10px' }}>•</span>
                        <span style={{ fontSize: '10.5px', color: 'var(--text-3)', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
                          {meal.meal_type}
                        </span>

                        {(meal.protein > 0 || meal.carbs > 0 || meal.fat > 0) && (
                          <>
                            <span style={{ width: '1px', height: '10px', background: 'var(--border)', margin: '0 2px', flexShrink: 0 }} />
                            {meal.protein > 0 && (
                              <span className="macro-pill" style={{ background: 'var(--accent)1A', color: 'var(--accent)', fontSize: '9.5px', padding: '1px 6px' }}>
                                P {meal.protein}g
                              </span>
                            )}
                            {meal.carbs > 0 && (
                              <span className="macro-pill" style={{ background: 'var(--green)1A', color: 'var(--green)', fontSize: '9.5px', padding: '1px 6px' }}>
                                C {meal.carbs}g
                              </span>
                            )}
                            {meal.fat > 0 && (
                              <span className="macro-pill" style={{ background: 'var(--amber)1A', color: 'var(--amber)', fontSize: '9.5px', padding: '1px 6px' }}>
                                F {meal.fat}g
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* 3. Right: Buttons */}
                    <div className="meal-actions-cell" style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          const dayIndex = mealPlan.days.findIndex(d => (d.day || d.day_of_week) === (currentDay.day || currentDay.day_of_week))
                          toggleMeal(dayIndex, idx)
                        }}
                        className={`meal-action-btn toggle ${meal.done ? 'done' : ''}`}
                        title={meal.done ? 'Mark as not done' : 'Mark as done'}
                        style={!meal.done ? {
                          background: '#C56A2A !important',
                          backgroundColor: '#C56A2A !important',
                          color: '#FFFFFF !important',
                          border: '1px solid #C56A2A !important',
                        } : {}}
                      >
                        <CheckCircle size={12} />
                        {meal.done ? 'Done' : 'Mark'}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEditMeal(meal); }}
                        className="meal-action-btn"
                        title="Edit meal"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteMeal(meal.id, meal.name); }}
                        className="meal-action-btn danger"
                        title="Delete meal"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Utensils size={32} color="var(--text-3)" style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <p style={{ fontSize: '14px', color: 'var(--text-2)', fontWeight: 600 }}>No meals for {activeDay}</p>
              <p style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '4px' }}>
                Click "Add Meal" to start planning.
              </p>
            </div>
          )}
        </div>

        {/* Water */}
        <div className="water-panel" style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <WaterBottle
            liters={waterLiters}
            goal={waterGoal}
            disabled={updatingWater}
            onAdd={(ml) => updateWater(ml)}
            onUndo={(ml) => updateWater(ml)}
          />
        </div>

        {/* Macros */}
        <div className="macros-panel" style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '18px',
        }}>
          <h3 style={{ fontSize: '14.5px', fontWeight: 700, marginBottom: '-4px', color: 'var(--text)' }}>
            Macronutrients
          </h3>
          <div className="macros-list">
            {macros.map((m) => <MacroRing key={m.label} {...m} size={72} />)}
          </div>

          <div style={{
            paddingTop: '12px',
            borderTop: '1px solid var(--border)',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: '11px', color: 'var(--text-3)' }}>
              Goal: {mealPlan.daily_calorie_goal || 2000} calories/day
            </p>
            <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)' }}>
              {currentDay?.totalCalories || 0} / {mealPlan.daily_calorie_goal || 2000} cal
            </p>
          </div>
        </div>
      </div>

      {/* Add/Edit Meal Modal */}
      {showAddMeal && (
        <div className="modal-overlay" onClick={() => setShowAddMeal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Utensils size={18} color="var(--accent)" />
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text)' }}>
                  {editingMeal ? 'Edit Meal' : `Add Meal to ${selectedDay?.day || selectedDay?.day_of_week || ''}`}
                </h3>
              </div>
              <button
                onClick={() => setShowAddMeal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-3)',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '20px', overflowY: 'auto', maxHeight: 'calc(90vh - 120px)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>
                    Meal Name *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={mealForm.name}
                    onChange={(e) => setMealForm({ ...mealForm, name: e.target.value })}
                    placeholder="e.g., Chicken Breast with Rice"
                  />
                </div>

                <div className="meal-type-time-grid">
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>
                      Meal Type
                    </label>
                    <select
                      className="form-input"
                      value={mealForm.meal_type}
                      onChange={(e) => setMealForm({ ...mealForm, meal_type: e.target.value })}
                    >
                      {MEAL_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>
                      Time
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={mealForm.meal_time}
                      onChange={(e) => setMealForm({ ...mealForm, meal_time: e.target.value })}
                      placeholder="12:00 PM"
                    />
                  </div>
                </div>

                <div className="meal-fields-grid">
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>
                      Calories
                    </label>
                    <input
                      type="number"
                      className="form-input"
                      value={mealForm.calories}
                      onChange={(e) => setMealForm({ ...mealForm, calories: parseInt(e.target.value) || 0 })}
                      placeholder="500"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>
                      Protein (g)
                    </label>
                    <input
                      type="number"
                      className="form-input"
                      value={mealForm.protein}
                      onChange={(e) => setMealForm({ ...mealForm, protein: parseFloat(e.target.value) || 0 })}
                      placeholder="30"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>
                      Carbs (g)
                    </label>
                    <input
                      type="number"
                      className="form-input"
                      value={mealForm.carbs}
                      onChange={(e) => setMealForm({ ...mealForm, carbs: parseFloat(e.target.value) || 0 })}
                      placeholder="40"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>
                      Fat (g)
                    </label>
                    <input
                      type="number"
                      className="form-input"
                      value={mealForm.fat}
                      onChange={(e) => setMealForm({ ...mealForm, fat: parseFloat(e.target.value) || 0 })}
                      placeholder="15"
                      step="0.1"
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '4px' }}>
                    Items (Ingredients)
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      className="form-input"
                      value={itemInput}
                      onChange={(e) => setItemInput(e.target.value)}
                      placeholder="e.g., Chicken breast"
                      onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); addItem(); } }}
                    />
                    <button
                      onClick={addItem}
                      className="btn-secondary"
                      style={{ 
                        padding: '10px 14px',
                        background: 'transparent !important',
                        color: 'var(--text-2) !important',
                        border: '1px solid var(--border) !important',
                      }}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  {mealForm.items.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                      {mealForm.items.map((item, index) => (
                        <span key={index} style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 10px',
                          borderRadius: '99px',
                          background: 'var(--surface-3)',
                          color: 'var(--text-2)',
                          fontSize: '12px',
                          fontWeight: 500,
                        }}>
                          {item}
                          <button
                            onClick={() => removeItem(index)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-3)',
                              cursor: 'pointer',
                              padding: '0 2px',
                              fontSize: '14px',
                            }}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button
                    onClick={editingMeal ? updateMeal : addMeal}
                    className="btn-primary"
                    style={{
                      background: '#C56A2A !important',
                      backgroundColor: '#C56A2A !important',
                      color: '#FFFFFF !important',
                      border: 'none !important',
                    }}
                  >
                    <Save size={16} />
                    {editingMeal ? 'Update Meal' : 'Add Meal'}
                  </button>
                  <button 
                    onClick={() => setShowAddMeal(false)} 
                    className="btn-secondary"
                    style={{
                      background: 'transparent !important',
                      color: 'var(--text-2) !important',
                      border: '1px solid var(--border) !important',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}