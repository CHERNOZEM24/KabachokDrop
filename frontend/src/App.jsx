import { useState, useEffect } from 'react'
import { casesAPI, profileAPI, authAPI } from './services/api'
import './App.css'

function App() {
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState(null)
  const [opening, setOpening] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [balance, setBalance] = useState(0)
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [customAmount, setCustomAmount] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    const savedUser = localStorage.getItem('user')
    if (token && savedUser) {
      const userData = JSON.parse(savedUser)
      setUser(userData)
      setBalance(userData.profile?.balance || 0)
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

  const handleOpenCase = async (caseId, price) => {
    if (!user) {
      setResult({
        success: false,
        message: 'Войдите, чтобы открывать кейсы'
      })
      setIsProfileOpen(true)
      return
    }

    if (balance < price) {
      setResult({
        success: false,
        message: 'Недостаточно средств на счете'
      })
      return
    }

    setOpening(true)
    setResult(null)
    
    try {
      const response = await casesAPI.openCase(caseId)
      setResult(response.data)
      setBalance(response.data.new_balance)
      
      setTimeout(() => {
        setResult(null)
      }, 5000)
    } catch (error) {
      setResult({
        success: false,
        message: error.response?.data?.message || 'Ошибка при открытии кейса'
      })
    } finally {
      setOpening(false)
    }
  }

  const handleDeposit = async (amount) => {
    if (!amount || amount <= 0) {
      setResult({
        success: false,
        message: 'Введите корректную сумму'
      })
      return
    }

    if (amount > 5000) {
      setResult({
        success: false,
        message: 'Максимальная сумма пополнения - 5000 монет'
      })
      return
    }

    try {
      const response = await profileAPI.deposit(amount)
      setBalance(response.data.new_balance)
      
      const savedUser = JSON.parse(localStorage.getItem('user'))
      savedUser.profile.balance = response.data.new_balance
      localStorage.setItem('user', JSON.stringify(savedUser))
      setUser(savedUser)
      
      setResult({
        success: true,
        message: response.data.message
      })
      
      setCustomAmount('')
    } catch (error) {
      setResult({
        success: false,
        message: error.response?.data?.message || 'Ошибка пополнения'
      })
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
    setBalance(0)
    setIsProfileOpen(false)
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setAuthLoading(true)
    setError('')

    try {
      if (isLogin) {
        const response = await authAPI.login({
          username: formData.username,
          password: formData.password
        })
        localStorage.setItem('access_token', response.data.access)
        localStorage.setItem('refresh_token', response.data.refresh)
        
        const userResponse = await authAPI.getMe()
        const userData = userResponse.data
        localStorage.setItem('user', JSON.stringify(userData))
        setUser(userData)
        setBalance(userData.profile?.balance || 0)
        setIsProfileOpen(false)
      } else {
        await authAPI.register({
          username: formData.username,
          email: formData.email,
          password: formData.password
        })
        setIsLogin(true)
        setError('Регистрация успешна! Теперь войдите.')
      }
    } catch (error) {
      if (isLogin) {
        setError('Неверное имя пользователя или пароль')
      } else {
        setError('Ошибка регистрации. Возможно, имя уже занято.')
      }
    } finally {
      setAuthLoading(false)
    }
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {user && (
            <div className="balance-display">
              💰 {balance} монет
            </div>
          )}
          <button className="profile-button" onClick={toggleProfilePanel}>
            {user ? `${user.username}` : 'Войти'}
          </button>
        </div>
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
                  <div className="user-balance">💰 Баланс: {balance} монет</div>
                </div>
              </div>

              <div className="deposit-section">
                <h3>Пополнить кошелек</h3>
                
                <div className="deposit-presets">
                  <button className="deposit-btn" onClick={() => handleDeposit(50)}>50</button>
                  <button className="deposit-btn" onClick={() => handleDeposit(250)}>250</button>
                  <button className="deposit-btn" onClick={() => handleDeposit(500)}>500</button>
                </div>
                
                <div className="deposit-custom">
                  <input
                    type="number"
                    placeholder="Своя сумма (до 5000)"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    min="1"
                    max="5000"
                  />
                  <button 
                    className="deposit-btn custom"
                    onClick={() => handleDeposit(parseInt(customAmount))}
                    disabled={!customAmount || parseInt(customAmount) <= 0 || parseInt(customAmount) > 5000}
                  >
                    Пополнить
                  </button>
                </div>
              </div>

              <button className="logout-button" onClick={handleLogout}>
                Выйти
              </button>
            </>
          ) : (
            <div className="auth-container">
              <h2>{isLogin ? 'Вход' : 'Регистрация'}</h2>
              {error && <div className="auth-error">{error}</div>}
              <form onSubmit={handleSubmit}>
                <input
                  type="text"
                  name="username"
                  placeholder="Имя пользователя"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
                {!isLogin && (
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                )}
                <input
                  type="password"
                  name="password"
                  placeholder="Пароль"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button type="submit" disabled={authLoading}>
                  {authLoading ? 'Загрузка...' : isLogin ? 'Войти' : 'Зарегистрироваться'}
                </button>
                <button 
                  type="button" 
                  className="auth-toggle"
                  onClick={() => setIsLogin(!isLogin)}
                >
                  {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
                </button>
              </form>
            </div>
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
                <div className="price">💰 {caseItem.price} монет</div>
                <div className="vegetable-count">
                  🥕 {caseItem.vegetables?.length || 0} овощей
                </div>
              </div>

              <button
                onClick={() => handleOpenCase(caseItem.id, caseItem.price)}
                disabled={opening || (user && balance < caseItem.price)}
                className={`open-button ${opening ? 'opening' : ''}`}
                style={user && balance < caseItem.price ? { opacity: 0.5 } : {}}
              >
                {!user && 'Войдите чтобы открыть'}
                {user && balance < caseItem.price && 'Недостаточно средств'}
                {user && balance >= caseItem.price && (opening ? 'Открываем...' : 'Открыть')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App