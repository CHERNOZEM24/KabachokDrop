import { useState, useEffect } from 'react'
import { casesAPI } from './services/api'
import Auth from './components/auth'
import './App.css'

function App() {
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState(null)
  const [opening, setOpening] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    const savedUser = localStorage.getItem('user')
    if (token && savedUser) {
      setUser(JSON.parse(savedUser))
    }
    loadCases()
  }, [])

  const loadCases = async () => {
    try {
      const response = await casesAPI.getCases()
      setCases(response.data)
    } catch (error) {
      console.error('Ошибка загрузки кейсов:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenCase = async (caseId) => {
    setOpening(true)
    setResult(null)
    
    try {
      const response = await casesAPI.openCase(caseId)
      setResult(response.data)
      
      setTimeout(() => {
        setResult(null)
      }, 5000)
    } catch (error) {
      setResult({
        success: false,
        message: 'Ошибка при открытии кейса'
      })
    } finally {
      setOpening(false)
    }
  }

  const closeResult = () => {
    setResult(null)
  }

  const toggleProfilePanel = () => {
    setIsProfileOpen(!isProfileOpen)
  }

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    setUser(null)
    setIsProfileOpen(false)
  }

  const handleAuthSuccess = (userData) => {
    setUser(userData)
    setIsProfileOpen(false)
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner">🥦</div>
        <p>Загрузка кейсов...</p>
      </div>
    )
  }

  return (
    <div className="app">
      <div className="navbar">
        <div className="nav-logo">KabachokDrop</div>
        <button className="profile-button" onClick={toggleProfilePanel}>
          {user ? `${user.username}` : 'Войти'}
        </button>
      </div>

      {isProfileOpen && (
        <div className="profile-panel">
          {user ? (
            <>
              <div className="user-info">
                <div className="user-avatar">🥒</div>
                <div className="user-details">
                  <div className="user-name">{user.username}</div>
                  <div className="user-email">{user.email}</div>
                </div>
              </div>
              <button className="logout-button" onClick={handleLogout}>
                Выйти
              </button>
            </>
          ) : (
            <Auth onAuthSuccess={handleAuthSuccess} />
          )}
        </div>
      )}

      {result && <div className="result-overlay" onClick={closeResult} />}

      {result && (
        <div className={`result ${result.success ? 'success' : 'error'}`}>
          <button className="close-button" onClick={closeResult}>
            ×
          </button>
          
          <div className="result-content">
            <div className="result-emoji">{result.success ? '🎉' : '❌'}</div>
            <h3>{result.message}</h3>
            
            {result.reward && (
              <div className="reward">
                <div className="reward-emoji">{result.reward.emoji}</div>
                <div className="reward-info">
                  <h4>{result.reward.name}</h4>
                  <span className={`rarity ${result.reward.rarity}`}>
                    {result.reward.rarity_display}
                  </span>
                  <p className="reward-price">💰 {result.reward.price} монет</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="cases-grid">
        {cases.map(caseItem => (
          <div key={caseItem.id} className="case-card">
            <div className="case-image">
              {caseItem.image_url ? (
                <img src={caseItem.image_url} alt={caseItem.name} />
              ) : (
                <div className="case-emoji">🎁</div>
              )}
            </div>
            
            <div className="case-info">
              <h3>{caseItem.name}</h3>
              {caseItem.description && (
                <p className="case-description">{caseItem.description}</p>
              )}
              
              <div className="case-stats">
                <div className="price">Стоимость: {caseItem.price}</div>
                <div className="vegetable-count">
                  🥕 {caseItem.vegetables?.length || 0} овощей
                </div>
              </div>

              <button
                onClick={() => handleOpenCase(caseItem.id)}
                disabled={opening}
                className={`open-button ${opening ? 'opening' : ''}`}
              >
                {opening ? 'Открываем...' : 'Открыть'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App