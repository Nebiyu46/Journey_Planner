// src/App.jsx
import { useState } from 'react'
import { useEffect } from 'react'
import StepNode from './components/StepNode'

function App() {
  const [view, setView] = useState('home')
  const [blueprintlist, setBlueprintlist] = useState([])
  const [loading, setLoading] = useState(false)
  const [blueprint, setBlueprint] = useState(null)
  const [progress, setProgress] = useState(0)
  const [totalSteps, setTotalSteps] = useState(0)
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token') || null)
  const [showAuth, setShowAuth] = useState(true) // Show auth by default

  const API_URL = 'http://localhost:3000'

  // Check if token is valid on mount
  useEffect(() => {
    if (token) {
      // Verify token by trying to fetch blueprints
      fetch(`${API_URL}/blueprints`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          if (res.ok) {
            setShowAuth(false)
          } else {
            // Token invalid
            localStorage.removeItem('token')
            setToken(null)
            setShowAuth(true)
          }
        })
        .catch(() => {
          localStorage.removeItem('token')
          setToken(null)
          setShowAuth(true)
        })
    }
  }, [])

  const login = async (email, password) => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (res.ok) {
        setToken(data.access_token)
        setUser(data.user)
        localStorage.setItem('token', data.access_token)
        setShowAuth(false)
        return true
      }
      alert('Login failed: ' + (data.message || 'Invalid credentials'))
      return false
    } catch (error) {
      alert('Login error: ' + error.message)
      return false
    }
  }

  const register = async (email, password) => {
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (res.ok) {
        setToken(data.access_token)
        setUser(data.user)
        localStorage.setItem('token', data.access_token)
        setShowAuth(false)
        return true
      }
      alert('Registration failed: ' + (data.message || 'Error'))
      return false
    } catch (error) {
      alert('Registration error: ' + error.message)
      return false
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    setView('home')
    setBlueprint(null)
    setBlueprintlist([])
    setShowAuth(true)
  }

  const fetchBlueprints = async () => {
    if (!token) {
      setShowAuth(true)
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/blueprints`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.status === 401) {
        logout()
        return
      }
      const data = await res.json()
      setBlueprintlist(data)
      setView('list')
    } catch (error) {
      console.error('Error fetching blueprints:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchBlueprint = async (id, startNew = false) => {
    if (!token) {
      setShowAuth(true)
      return
    }

    setLoading(true)
    try {
      let url = `${API_URL}/blueprints/${id}`
      if (startNew) {
        url = `${API_URL}/blueprints/${id}/start`
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (res.status === 401) {
        logout()
        return
      }

      const data = await res.json()
      setBlueprint(data)
      setView('detail')
    } catch (error) {
      console.error('Error fetching blueprint:', error)
    } finally {
      setLoading(false)
    }
  }

  const backToHome = () => {
    setBlueprint(null)
    setBlueprintlist([])
    setView('home')
  }

  const calculateProgress = () => {
    let completed = 0
    let total = 0

    if (!blueprint) return
    const traverse = (steps) => {
      steps.forEach((step) => {
        if (step.status === "Comment") return
        total++
        if (step.status === "Completed") {
          completed++
        }
        if (step.children && step.children.length > 0) {
          traverse(step.children)
        }
      })
    }
    traverse(blueprint.rootSteps)
    setProgress(completed)
    setTotalSteps(total)
  }

  useEffect(() => {
    if (blueprint) {
      calculateProgress()
    }
  }, [blueprint])

  const percent = totalSteps > 0 ? Math.round((progress / totalSteps) * 100) : 0

  const handleStatusChange = async (stepId) => {
    if (!token) {
      setShowAuth(true)
      return
    }

    const updateStepInList = (steps) => {
      return steps.map((step) => {
        if (step.id === stepId) {
          const allChildrenCompleted = step.children.every((child) => child.status === "Completed")
          let newStatus = "To_Do"
          if (step.status === "To_Do") newStatus = "In_Progress"
          else if (step.status === "In_Progress") {
            if (allChildrenCompleted === false) {
              alert("Please complete all children steps before changing the status")
              return step
            } else {
              newStatus = "Completed"
            }
          }
          else if (step.status === "Completed") newStatus = "To_Do"

          // Save to backend
          fetch(`${API_URL}/progress`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              blueprintId: blueprint.id,
              stepId: stepId,
              status: newStatus
            })
          }).catch(err => console.error('Failed to save status:', err))

          return { ...step, status: newStatus }
        }
        if (step.children && step.children.length > 0) {
          return { ...step, children: updateStepInList(step.children) }
        }
        return step
      })
    }

    const newRootSteps = updateStepInList(blueprint.rootSteps)
    setBlueprint({ ...blueprint, rootSteps: newRootSteps })
  }

  const handleFeedbackChange = async (stepId, newData) => {
    if (!token) {
      setShowAuth(true)
      return
    }

    const updateRecursive = (steps) => {
      return steps.map((step) => {
        if (step.id === stepId) {
          // Save to backend
          fetch(`${API_URL}/progress`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              blueprintId: blueprint.id,
              stepId: stepId,
              ...newData
            })
          }).catch(err => console.error('Failed to save feedback:', err))

          return { ...step, ...newData }
        }
        if (step.children && step.children.length > 0) {
          return { ...step, children: updateRecursive(step.children) }
        }
        return step
      })
    }

    setBlueprint(prev => ({
      ...prev,
      rootSteps: updateRecursive(prev.rootSteps)
    }))
  }

  // If not logged in, show auth form
  if (!token || showAuth) {
    return (
      <div style={{ maxWidth: '1000px', margin: 'auto', padding: '20px', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center', paddingTop: '60px' }}>
          <h1>🗺️ Welcome to the Journey Map</h1>
          <p style={{ color: '#668', marginBottom: '40px' }}>Please login or register to continue</p>
          <LoginForm onLogin={login} onRegister={register} />
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1000px', margin: 'auto', padding: '20px', fontFamily: 'sans-serif' }}>
      {/* Home View */}
      {view === 'home' && (
        <div style={{ textAlign: 'center', paddingTop: '60px' }}>
          <div style={{ textAlign: 'right', marginBottom: '20px' }}>
            <span style={{ marginRight: '10px' }}>Logged in as: {user?.email || 'User'}</span>
            <button onClick={logout} style={{ padding: '8px 16px', fontSize: '0.9rem' }}>Logout</button>
          </div>
          <h1>🗺️ Welcome to the Journey Map</h1>
          <p style={{ color: '#668', marginBottom: '40px' }}>Find the blueprint that best suits your needs</p>
          <button
            onClick={fetchBlueprints}
            disabled={loading}
            style={{
              padding: '15px 40px',
              fontSize: '1.1rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            {loading ? 'Loading...' : 'View Blueprints'}
          </button>
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <button onClick={backToHome} style={{ padding: '10px 20px', fontSize: '1rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Back to Home</button>
            <div>
              <span style={{ marginRight: '10px' }}>Logged in as: {user?.email}</span>
              <button onClick={logout} style={{ padding: '8px 16px', fontSize: '0.9rem' }}>Logout</button>
            </div>
          </div>
          <h1> 📚 Available Blueprints</h1>
          <ul>
            {blueprintlist.map((bp) => (
              <div key={bp.id}
                style={{
                  padding: '15px 20px',
                  fontSize: '1rem',
                  backgroundColor: bp.hasStarted ? '#10b981' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  marginBottom: '10px',
                  width: '100%',
                  textAlign: 'left'
                }}
                onClick={() => fetchBlueprint(bp.id, !bp.hasStarted)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: '0 0 5px 0' }}>{bp.title}</h3>
                    <p style={{ margin: '0', color: '#e0e0e0' }}>🏫 {bp.institution} • 🎯 {bp.targetAudience}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {bp.hasStarted ? (
                      <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>✓ Continue</span>
                    ) : (
                      <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>▶ Start New</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </ul>
        </div>
      )}

      {/* Detail View */}
      {view === 'detail' && blueprint && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <button onClick={backToHome} style={{ padding: '10px 20px', fontSize: '1rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Back to Blueprints</button>
            <div>
              <span style={{ marginRight: '10px' }}>Logged in as: {user?.email}</span>
              <button onClick={logout} style={{ padding: '8px 16px', fontSize: '0.9rem' }}>Logout</button>
            </div>
          </div>

          {blueprint.isNew && (
            <div style={{ 
              padding: '15px', 
              backgroundColor: '#fef3c7', 
              border: '1px solid #fbbf24', 
              borderRadius: '8px', 
              marginBottom: '20px' 
            }}>
              <strong>📌 New Blueprint</strong>
              <p style={{ margin: '10px 0 0 0' }}>This is your first time viewing this blueprint. Click "Start Blueprint" to begin tracking your progress.</p>
              <button
                onClick={() => fetchBlueprint(blueprint.id, true)}
                style={{
                  marginTop: '10px',
                  padding: '10px 20px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Start Blueprint
              </button>
            </div>
          )}

          <header style={{ marginBottom: '30px', borderBottom: '2px solid #1f2937', paddingBottom: '10px' }}>
            <h1 style={{ margin: '0 0 10px 0' }}>{blueprint.title}</h1>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#374151' }}>
              <span>🏫 {blueprint.institution}</span>
              <span>Target: {blueprint.targetAudience}</span>
            </div>
            {blueprint.hasStarted && (
              <>
                <div style={{ width: '100%', height: '20px', backgroundColor: '#e5e7eb', borderRadius: '10px', overflow: 'hidden', marginTop: '15px' }}>
                  <div style={{ width: `${percent}%`, height: '100%', backgroundColor: '#4ade80', transition: 'width 0.3s' }}></div>
                </div>
                <div style={{ textAlign: 'center', marginTop: '5px' }}>{progress} / {totalSteps} steps completed ({percent}%)</div>
              </>
            )}
          </header>

          {blueprint.hasStarted && blueprint.rootSteps && (
            <div className="blueprint-container">
              {blueprint.rootSteps.map((step) => (
                <StepNode
                  key={step.id}
                  step={step}
                  statusChangefunc={handleStatusChange}
                  feedbackChangefunc={handleFeedbackChange}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function LoginForm({ onLogin, onRegister }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isRegister, setIsRegister] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const success = isRegister
      ? await onRegister(email, password)
      : await onLogin(email, password)
    if (success) {
      setEmail('')
      setPassword('')
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '400px', margin: '0 auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h3 style={{ marginTop: 0 }}>{isRegister ? 'Register' : 'Login'}</h3>
      <div style={{ marginBottom: '15px' }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: '100%', padding: '10px', fontSize: '1rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
        />
      </div>
      <div style={{ marginBottom: '15px' }}>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: '100%', padding: '10px', fontSize: '1rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
        />
      </div>
      <button
        type="submit"
        style={{
          width: '100%',
          padding: '12px',
          fontSize: '1rem',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          marginBottom: '10px'
        }}
      >
        {isRegister ? 'Register' : 'Login'}
      </button>
      <button
        type="button"
        onClick={() => setIsRegister(!isRegister)}
        style={{
          width: '100%',
          padding: '8px',
          fontSize: '0.9rem',
          backgroundColor: 'transparent',
          color: '#3b82f6',
          border: 'none',
          cursor: 'pointer'
        }}
      >
        {isRegister ? 'Already have an account? Login' : 'Need an account? Register'}
      </button>
    </form>
  )
}

export default App
