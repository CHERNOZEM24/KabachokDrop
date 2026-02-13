import { useState, useEffect } from 'react'
import { casesAPI, profileAPI, authAPI, inventoryAPI } from './services/api' 
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
  const [inventory, setInventory] = useState([])
  const [loadingInventory, setLoadingInventory] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [customAmount, setCustomAmount] = useState('')
  const [activeTab, setActiveTab] = useState('menu')
  const [spinning, setSpinning] = useState(false)
  const [spinItems, setSpinItems] = useState([])

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    
    const initAuth = async () => {
      if (token) {
        try {
          const userResponse = await authAPI.getMe()
          const userData = userResponse.data
          setUser(userData)
          setBalance(userData.profile?.balance || 0)
        } catch (error) {
          console.error('Ошибка загрузки пользователя:', error)
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
        }
      }
      loadCases()
    }
    
    initAuth()
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

  const loadInventory = async () => {
    setLoadingInventory(true)
    try {
      const response = await inventoryAPI.getInventory()
      setInventory(response.data)
    } catch (error) {
      console.error('Ошибка загрузки инвентаря:', error)
    } finally {
      setLoadingInventory(false)
    }
  }

  const handleSell = async (itemId) => {
    try {
      const response = await inventoryAPI.sellItem(itemId)
      setBalance(response.data.new_balance)
      await loadInventory()
      setResult({
        success: true,
        message: response.data.message
      })
      setTimeout(() => setResult(null), 3000)
    } catch (error) {
      setResult({
        success: false,
        message: error.response?.data?.message || 'Ошибка при продаже'
      })
      setTimeout(() => setResult(null), 3000)
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
    const currentCase = cases.find(c => c.id === caseId)
    const allVeggies = currentCase.vegetables
    const response = await casesAPI.openCase(caseId)
    const realReward = response.data.reward
    
    const spinArray = []
    
    for (let i = 0; i < 30; i++) {
      const randomVeg = allVeggies[Math.floor(Math.random() * allVeggies.length)]
      spinArray.push(randomVeg)
    }
    
    spinArray.push(realReward)
    
    for (let i = 0; i < 20; i++) {
      const randomVeg = allVeggies[Math.floor(Math.random() * allVeggies.length)]
      spinArray.push(randomVeg)
    }
    
    setSpinItems(spinArray)
    setSpinning(true)
    
    setTimeout(() => {
  const track = document.querySelector('.spin-track')
  
  if (track) {
    const itemWidth = 105
    const winIndex = 30
    const targetPosition = -(winIndex * itemWidth) + 200
    
    track.style.transition = 'transform 3s cubic-bezier(0.2, 0.9, 0.3, 1)'
    track.style.transform = `translateX(${targetPosition}px)`
  }
  
    setTimeout(() => {
      setSpinning(false)
      setResult(response.data)
      setBalance(response.data.new_balance)
    }, 3000)
  }, 100)
    
  } catch (error) {
    setResult({
      success: false,
      message: error.response?.data?.message || 'Ошибка при открытии кейса'
    })
    setSpinning(false)
  } finally {
    setOpening(false)
  }
}

  const handleDeposit = async (amount) => {
    if (!amount || amount <= 0 || amount > 5000) {
      return
    }

    try {
      const response = await profileAPI.deposit(amount)
      setBalance(response.data.new_balance)
      setCustomAmount('')
      setActiveTab('menu')
    } catch (error) {
      console.log('Ошибка пополнения:', error)
    }
  }

  const closeResult = () => {
    setResult(null)
  }

  const toggleProfilePanel = () => {
    setIsProfileOpen(!isProfileOpen)
    if (!isProfileOpen) {
      setActiveTab('menu')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
    setBalance(0)
    setIsProfileOpen(false)
    setActiveTab('menu')
    setInventory([])
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

      {result && <div className="result-overlay" onClick={closeResult} />}
      {result && (
        <div className={`result ${result.success ? 'success' : 'error'}`}>
          <button className="close-button" onClick={closeResult}>×</button>
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

      {spinning && (
        <div className="spin-modal">
          <div className="spin-window">
            <h3>Открытие кейса</h3>
            <div className="spin-viewport">
              <div className="spin-marker">▼</div>
              <div className="spin-track">
                {spinItems.map((item, index) => (
                  <div key={index} className="spin-item">
                    <span className="spin-emoji">{item.emoji}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {isProfileOpen && (
        <div className="profile-panel">
          {user ? (
            <>
              <div className="profile-header">
                <div className="user-avatar">🥒</div>
                <div className="user-info">
                  <div className="user-name">{user.username}</div>
                  <div className="user-email">{user.email}</div>
                </div>
                {activeTab !== 'menu' && (
                  <button className="back-button" onClick={() => setActiveTab('menu')}>←</button>
                )}
              </div>

              {activeTab === 'menu' && (
                <div className="profile-menu">
                  <button className="profile-menu-btn" onClick={() => setActiveTab('deposit')}>
                    <span>💰</span> Пополнение
                  </button>
                  <button className="profile-menu-btn" onClick={async () => {
                    setActiveTab('inventory')
                    await loadInventory()
                  }}>
                    <span>📦</span> Инвентарь
                  </button>
                </div>
              )}

              {activeTab === 'deposit' && (
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
              )}

              {activeTab === 'inventory' && (
                <div className="inventory-section">
                  {loadingInventory ? (
                    <div className="inventory-loading">Загрузка...</div>
                  ) : inventory.length === 0 ? (
                    <div className="inventory-empty">
                      <span className="empty-emoji">📦</span>
                      <p>Инвентарь пуст</p>
                      <p className="empty-hint">Открывайте кейсы, чтобы получить овощи</p>
                    </div>
                  ) : (
                    <div className="inventory-list">
                      {inventory.map(item => (
                        <div key={item.id} className="inventory-item">
                          <div className="item-emoji">{item.vegetable.emoji}</div>
                          <div className="item-info">
                            <div className="item-name">{item.vegetable.name}</div>
                            <span className={`rarity-mini ${item.vegetable.rarity}`}>
                              {item.vegetable.rarity_display}
                            </span>
                            <div className="item-quantity">x{item.quantity}</div>
                          </div>
                          <div className="item-price">
                            <div className="price-value">{item.vegetable.price} 💰</div>
                            <button className="sell-button" onClick={() => handleSell(item.id)}>
                              Продать
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button className="logout-button" onClick={handleLogout}>Выйти</button>
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
                <button type="button" className="auth-toggle" onClick={() => setIsLogin(!isLogin)}>
                  {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
                </button>
              </form>
            </div>
          )}
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