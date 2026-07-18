import React, { useState, useEffect } from 'react'
import { TrendingUp, Plus, Trash2, Edit2, RefreshCw, Download, LogOut, Zap } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart } from 'recharts'

const API_CACHE = {}

const fetchPrice = async (symbol) => {
  if (API_CACHE[symbol]) return API_CACHE[symbol]

  const isStock = symbol.includes('.') || /^[A-Z]/.test(symbol)

  if (!isStock) {
    try {
      const cryptoSymbol = symbol.toUpperCase()
      const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${cryptoSymbol}USDT`, {
        signal: AbortSignal.timeout(5000)
      })
      if (res.ok) {
        const data = await res.json()
        const price = parseFloat(data.price)
        API_CACHE[symbol] = price
        return price
      }
    } catch {}

    try {
      const res = await fetch(`https://api.coinbase.com/v2/prices/${symbol.toUpperCase()}-USD/spot`, {
        signal: AbortSignal.timeout(5000)
      })
      if (res.ok) {
        const data = await res.json()
        const price = parseFloat(data.data.amount)
        API_CACHE[symbol] = price
        return price
      }
    } catch {}

    try {
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${symbol.toLowerCase()}&vs_currencies=usd`, {
        signal: AbortSignal.timeout(5000)
      })
      if (res.ok) {
        const data = await res.json()
        const price = data[symbol.toLowerCase()]?.usd
        if (price) {
          API_CACHE[symbol] = price
          return price
        }
      }
    } catch {}
  } else {
    const proxies = [
      `https://corsproxy.io/?${encodeURIComponent(`https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=price`)}`,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=price`)}`,
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(`https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=price`)}`
    ]

    for (const url of proxies) {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
        if (res.ok) {
          const text = await res.text()
          const jsonMatch = text.match(/("quoteSummary":\{[\s\S]*?\}\})/)
          if (jsonMatch) {
            const data = JSON.parse('{' + jsonMatch[1] + '}')
            const price = data.quoteSummary.result[0].price.currentPrice
            API_CACHE[symbol] = price
            return price
          }
        }
      } catch {}
    }
  }

  throw new Error(`Tidak bisa fetch harga ${symbol}`)
}

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [trades, setTrades] = useState(() => {
    const saved = localStorage.getItem('trades:all')
    return saved ? JSON.parse(saved) : []
  })
  const [account, setAccount] = useState(() => {
    const saved = localStorage.getItem('settings:account')
    return saved ? JSON.parse(saved) : { initialCapital: 10000, currency: 'USD', riskPerTrade: 1 }
  })
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    symbol: '',
    entryPrice: '',
    stopLoss: '',
    takeProfit: '',
    quantity: '',
    entryDate: new Date().toISOString().split('T')[0],
    exitPrice: '',
    exitDate: ''
  })
  const [message, setMessage] = useState('')
  const [priceLoading, setPriceLoading] = useState(false)

  useEffect(() => {
    localStorage.setItem('trades:all', JSON.stringify(trades))
  }, [trades])

  useEffect(() => {
    localStorage.setItem('settings:account', JSON.stringify(account))
  }, [account])

  const handleAddTrade = async () => {
    if (!formData.symbol || !formData.entryPrice || !formData.stopLoss || !formData.takeProfit || !formData.quantity) {
      setMessage({ type: 'error', text: 'Isi semua field' })
      return
    }

    const newTrade = {
      id: editingId || Date.now(),
      symbol: formData.symbol.toUpperCase(),
      entryPrice: parseFloat(formData.entryPrice),
      stopLoss: parseFloat(formData.stopLoss),
      takeProfit: parseFloat(formData.takeProfit),
      quantity: parseFloat(formData.quantity),
      entryDate: formData.entryDate,
      exitPrice: formData.exitPrice ? parseFloat(formData.exitPrice) : null,
      exitDate: formData.exitDate || null,
      createdAt: editingId ? (trades.find(t => t.id === editingId)?.createdAt || new Date().toISOString()) : new Date().toISOString()
    }

    if (editingId) {
      setTrades(trades.map(t => t.id === editingId ? newTrade : t))
      setMessage({ type: 'success', text: 'Trade diupdate' })
      setEditingId(null)
    } else {
      setTrades([newTrade, ...trades])
      setMessage({ type: 'success', text: 'Trade ditambah' })
    }

    setFormData({
      symbol: '',
      entryPrice: '',
      stopLoss: '',
      takeProfit: '',
      quantity: '',
      entryDate: new Date().toISOString().split('T')[0],
      exitPrice: '',
      exitDate: ''
    })
    setShowModal(false)
  }

  const handleCheckPrice = async () => {
    if (!formData.symbol) {
      setMessage({ type: 'error', text: 'Masukkan simbol' })
      return
    }

    setPriceLoading(true)
    try {
      const price = await fetchPrice(formData.symbol)
      setFormData({ ...formData, entryPrice: price.toFixed(2) })
      setMessage({ type: 'success', text: `Harga ${formData.symbol}: ${price.toFixed(2)}` })
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setPriceLoading(false)
    }
  }

  const handleEditTrade = (trade) => {
    setFormData({
      symbol: trade.symbol,
      entryPrice: trade.entryPrice.toString(),
      stopLoss: trade.stopLoss.toString(),
      takeProfit: trade.takeProfit.toString(),
      quantity: trade.quantity.toString(),
      entryDate: trade.entryDate,
      exitPrice: trade.exitPrice?.toString() || '',
      exitDate: trade.exitDate || ''
    })
    setEditingId(trade.id)
    setShowModal(true)
  }

  const handleDeleteTrade = (id) => {
    if (confirm('Yakin hapus trade ini?')) {
      setTrades(trades.filter(t => t.id !== id))
      setMessage({ type: 'success', text: 'Trade dihapus' })
    }
  }

  const handleResetAccount = () => {
    if (confirm('Reset semua data? Ini tidak bisa dibatalkan.')) {
      setTrades([])
      setAccount({ initialCapital: 10000, currency: 'USD', riskPerTrade: 1 })
      localStorage.removeItem('trades:all')
      localStorage.removeItem('settings:account')
      setMessage({ type: 'success', text: 'Data direset' })
    }
  }

  const handleSyncPrices = async () => {
    setPriceLoading(true)
    try {
      for (const trade of openTrades) {
        try {
          await fetchPrice(trade.symbol)
        } catch (err) {
          console.log(`Gagal update ${trade.symbol}`)
        }
      }
      setMessage({ type: 'success', text: 'Harga di-sync' })
    } finally {
      setPriceLoading(false)
    }
  }

  const calculateTradeStats = (trade) => {
    const riskPoints = Math.abs(trade.entryPrice - trade.stopLoss)
    const rewardPoints = Math.abs(trade.takeProfit - trade.entryPrice)
    const riskAmount = trade.quantity * riskPoints
    const rewardAmount = trade.quantity * rewardPoints
    const rr = riskPoints > 0 ? (rewardPoints / riskPoints).toFixed(2) : 'N/A'

    let pnl = null
    let pnlPercent = null
    let multiple = null

    if (trade.exitPrice) {
      const exitType = trade.exitPrice >= trade.takeProfit ? 'tp' : trade.exitPrice <= trade.stopLoss ? 'sl' : 'manual'
      pnl = (trade.exitPrice - trade.entryPrice) * trade.quantity
      pnlPercent = ((trade.exitPrice - trade.entryPrice) / trade.entryPrice * 100).toFixed(2)
      multiple = (pnl / Math.abs(riskAmount)).toFixed(2)
    }

    return { rr, riskAmount, rewardAmount, pnl, pnlPercent, multiple }
  }

  const openTrades = trades.filter(t => !t.exitPrice)
  const closedTrades = trades.filter(t => t.exitPrice)

  const totalCapital = account.initialCapital + closedTrades.reduce((sum, t) => {
    const stats = calculateTradeStats(t)
    return sum + (stats.pnl || 0)
  }, 0)

  const winTrades = closedTrades.filter(t => {
    const stats = calculateTradeStats(t)
    return stats.pnl > 0
  })
  const winRate = closedTrades.length > 0 ? ((winTrades.length / closedTrades.length) * 100).toFixed(1) : 0

  const totalRisk = closedTrades.reduce((sum, t) => {
    const stats = calculateTradeStats(t)
    return sum + stats.riskAmount
  }, 0)

  const totalReward = closedTrades.reduce((sum, t) => {
    const stats = calculateTradeStats(t)
    return sum + stats.rewardAmount
  }, 0)

  const avgRR = totalRisk > 0 ? (totalReward / totalRisk).toFixed(2) : 0
  const profitFactor = totalRisk > 0 ? (closedTrades.reduce((sum, t) => {
    const stats = calculateTradeStats(t)
    return sum + (stats.pnl > 0 ? stats.pnl : 0)
  }, 0) / Math.abs(closedTrades.reduce((sum, t) => {
    const stats = calculateTradeStats(t)
    return sum + (stats.pnl < 0 ? stats.pnl : 0)
  }, 0)) || 0).toFixed(2) : 0

  const dailyStats = {}
  closedTrades.forEach(t => {
    const date = new Date(t.exitDate).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: '2-digit' })
    if (!dailyStats[date]) {
      dailyStats[date] = { pnl: 0, trades: 0 }
    }
    const stats = calculateTradeStats(t)
    dailyStats[date].pnl += stats.pnl || 0
    dailyStats[date].trades++
  })

  const equityCurve = Object.entries(dailyStats).map(([date, data]) => ({
    date,
    equity: account.initialCapital + Object.values(dailyStats).slice(0, Object.keys(dailyStats).indexOf(date) + 1).reduce((sum, d) => sum + d.pnl, 0)
  }))

  const rMultipleDistribution = closedTrades.map(t => {
    const stats = calculateTradeStats(t)
    return stats.multiple
  }).filter(m => m !== null)

  const winLossChart = [
    { name: 'Win', value: winTrades.length, fill: '#26d07c' },
    { name: 'Loss', value: closedTrades.length - winTrades.length, fill: '#f6465d' }
  ]

  const rrDistribution = Object.entries(
    closedTrades.reduce((acc, t) => {
      const stats = calculateTradeStats(t)
      const rrKey = `${Math.round(parseFloat(stats.rr) * 2) / 2}:1`
      acc[rrKey] = (acc[rrKey] || 0) + 1
      return acc
    }, {})
  ).map(([rr, count]) => ({ rr, count }))

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <div className="logo">TJ</div>
            <div className="header-status">
              <div className="status-item">
                <span className="status-label">Capital</span>
                <span className={`status-value ${totalCapital >= account.initialCapital ? 'positive' : 'negative'}`}>
                  {account.currency} {totalCapital.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="status-item">
                <span className="status-label">P/L</span>
                <span className={`status-value ${totalCapital - account.initialCapital >= 0 ? 'positive' : 'negative'}`}>
                  {account.currency} {(totalCapital - account.initialCapital).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="status-item">
                <span className="status-label">Return</span>
                <span className={`status-value ${totalCapital - account.initialCapital >= 0 ? 'positive' : 'negative'}`}>
                  {(((totalCapital - account.initialCapital) / account.initialCapital) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
          <button className="btn btn-secondary btn-small" onClick={handleResetAccount}>
            <LogOut size={16} />
            Reset
          </button>
        </div>
      </header>

      <main className="container">
        {message && (
          <div className={`alert alert-${message.type}`}>
            <Zap size={18} />
            {message.text}
          </div>
        )}

        <div className="tabs">
          {['dashboard', 'jurnal', 'modal', 'analytics'].map(tab => (
            <button
              key={tab}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'dashboard' && '📊 Dashboard'}
              {tab === 'jurnal' && '📝 Jurnal'}
              {tab === 'modal' && '💰 Modal'}
              {tab === 'analytics' && '📈 Analytics'}
            </button>
          ))}
        </div>

        <div className={`tab-content ${activeTab === 'dashboard' ? 'active' : ''}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Dashboard</h2>
            {openTrades.length > 0 && (
              <button className="btn btn-secondary btn-small" onClick={handleSyncPrices} disabled={priceLoading}>
                {priceLoading && <span className="spinner" />}
                {!priceLoading && <RefreshCw size={14} />}
                Sync Prices
              </button>
            )}
          </div>
          <div className="grid-4">
            <div className="stat-box">
              <div className="stat-label">Total Trades</div>
              <div className="stat-value">{trades.length}</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Open</div>
              <div className="stat-value">{openTrades.length}</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Closed</div>
              <div className="stat-value">{closedTrades.length}</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Win Rate</div>
              <div className={`stat-value ${winRate >= 50 ? 'positive' : 'negative'}`}>{winRate}%</div>
            </div>
          </div>

          <div className="grid-2" style={{ marginTop: '1.5rem' }}>
            <div className="card">
              <h3 className="section-title">Open Trades</h3>
              {openTrades.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🎯</div>
                  <p>Tidak ada trade terbuka</p>
                </div>
              ) : (
                openTrades.map(trade => {
                  const stats = calculateTradeStats(trade)
                  return (
                    <div key={trade.id} className="trade-row">
                      <div className="trade-header">
                        <div className="trade-symbol">{trade.symbol}</div>
                        <span className="trade-status">OPEN</span>
                      </div>
                      <div className="trade-grid">
                        <div className="trade-item">
                          <div className="trade-item-label">Entry</div>
                          <div className="trade-item-value">{trade.entryPrice.toFixed(2)}</div>
                        </div>
                        <div className="trade-item">
                          <div className="trade-item-label">SL</div>
                          <div className="trade-item-value">{trade.stopLoss.toFixed(2)}</div>
                        </div>
                        <div className="trade-item">
                          <div className="trade-item-label">TP</div>
                          <div className="trade-item-value">{trade.takeProfit.toFixed(2)}</div>
                        </div>
                        <div className="trade-item">
                          <div className="trade-item-label">Qty</div>
                          <div className="trade-item-value">{trade.quantity.toFixed(2)}</div>
                        </div>
                        <div className="trade-item">
                          <div className="trade-item-label">R:R</div>
                          <div className="trade-item-value">{stats.rr}</div>
                        </div>
                        <div className="trade-item">
                          <div className="trade-item-label">Risk</div>
                          <div className="trade-item-value">{account.currency} {stats.riskAmount.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</div>
                        </div>
                      </div>
                      <div className="trade-actions">
                        <button className="btn btn-secondary btn-small" onClick={() => handleEditTrade(trade)}>
                          <Edit2 size={14} />
                          Edit
                        </button>
                        <button className="btn btn-danger btn-small" onClick={() => handleDeleteTrade(trade.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="card">
              <h3 className="section-title">Performance</h3>
              <div className="grid-2">
                <div className="stat-box">
                  <div className="stat-label">Avg R:R</div>
                  <div className="stat-value">{avgRR}:1</div>
                </div>
                <div className="stat-box">
                  <div className="stat-label">Profit Factor</div>
                  <div className={`stat-value ${profitFactor > 1 ? 'positive' : 'negative'}`}>{profitFactor}</div>
                </div>
                <div className="stat-box">
                  <div className="stat-label">Total Risk</div>
                  <div className="stat-value">{account.currency} {totalRisk.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</div>
                </div>
                <div className="stat-box">
                  <div className="stat-label">Total Reward</div>
                  <div className="stat-value">{account.currency} {totalReward.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={`tab-content ${activeTab === 'jurnal' ? 'active' : ''}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Trade Journal</h2>
            <button className="btn btn-primary" onClick={() => {
              setFormData({ symbol: '', entryPrice: '', stopLoss: '', takeProfit: '', quantity: '', entryDate: new Date().toISOString().split('T')[0], exitPrice: '', exitDate: '' })
              setEditingId(null)
              setShowModal(true)
            }}>
              <Plus size={18} />
              Add Trade
            </button>
          </div>

          {trades.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <p>Belum ada trade. Mulai dengan klik "Trade Baru"</p>
            </div>
          ) : (
            <>
              <div className="card">
                <h3 className="section-title">Closed Trades</h3>
                {closedTrades.length === 0 ? (
                  <div className="empty-state"><p>Tidak ada trade tertutup</p></div>
                ) : (
                  closedTrades.map(trade => {
                    const stats = calculateTradeStats(trade)
                    return (
                      <div key={trade.id} className="trade-row">
                        <div className="trade-header">
                          <div className="trade-symbol">{trade.symbol}</div>
                          <span className="trade-status closed">CLOSED</span>
                        </div>
                        <div className="trade-grid">
                          <div className="trade-item">
                            <div className="trade-item-label">Entry</div>
                            <div className="trade-item-value">{trade.entryPrice.toFixed(2)}</div>
                          </div>
                          <div className="trade-item">
                            <div className="trade-item-label">Exit</div>
                            <div className="trade-item-value">{trade.exitPrice.toFixed(2)}</div>
                          </div>
                          <div className="trade-item">
                            <div className="trade-item-label">Qty</div>
                            <div className="trade-item-value">{trade.quantity.toFixed(2)}</div>
                          </div>
                          <div className="trade-item">
                            <div className="trade-item-label">P/L</div>
                            <div className={`trade-item-value ${stats.pnl >= 0 ? 'positive' : 'negative'}`}>
                              {account.currency} {stats.pnl.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                            </div>
                          </div>
                          <div className="trade-item">
                            <div className="trade-item-label">Return</div>
                            <div className={`trade-item-value ${stats.pnlPercent >= 0 ? 'positive' : 'negative'}`}>{stats.pnlPercent}%</div>
                          </div>
                          <div className="trade-item">
                            <div className="trade-item-label">Multiple</div>
                            <div className={`trade-item-value ${stats.multiple >= 0 ? 'positive' : 'negative'}`}>{stats.multiple}R</div>
                          </div>
                        </div>
                        <div className="trade-actions">
                          <button className="btn btn-secondary btn-small" onClick={() => handleEditTrade(trade)}>
                            <Edit2 size={14} />
                            Edit
                          </button>
                          <button className="btn btn-danger btn-small" onClick={() => handleDeleteTrade(trade.id)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </>
          )}
        </div>

        <div className={`tab-content ${activeTab === 'modal' ? 'active' : ''}`}>
          <div className="grid-2">
            <div className="card">
              <h3 className="section-title">Account Settings</h3>
              <div className="form-group">
                <label className="form-label">Initial Capital</label>
                <input
                  type="number"
                  className="form-input"
                  value={account.initialCapital}
                  onChange={(e) => setAccount({ ...account, initialCapital: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Currency</label>
                <select className="form-select" value={account.currency} onChange={(e) => setAccount({ ...account, currency: e.target.value })}>
                  <option>USD</option>
                  <option>IDR</option>
                  <option>SGD</option>
                  <option>AUD</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Risk per Trade (%)</label>
                <input
                  type="number"
                  className="form-input"
                  value={account.riskPerTrade}
                  onChange={(e) => setAccount({ ...account, riskPerTrade: parseFloat(e.target.value) || 1 })}
                  step="0.1"
                  min="0.1"
                  max="10"
                />
              </div>
            </div>

            <div className="card">
              <h3 className="section-title">Position Sizer</h3>
              <PositionSizer account={account} />
            </div>
          </div>
        </div>

        <div className={`tab-content ${activeTab === 'analytics' ? 'active' : ''}`}>
          {closedTrades.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📊</div>
              <p>Tidak ada data tertutup untuk analisis</p>
            </div>
          ) : (
            <>
              {equityCurve.length > 0 && (
                <div className="chart-container">
                  <div className="chart-title">Equity Curve</div>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={equityCurve}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                      <XAxis dataKey="date" stroke="#a8aeb8" />
                      <YAxis stroke="#a8aeb8" />
                      <Tooltip
                        contentStyle={{ background: '#1a1f2e', border: '1px solid #2d3748' }}
                        labelStyle={{ color: '#e8ecf1' }}
                      />
                      <Line type="monotone" dataKey="equity" stroke="#ff7a00" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="grid-2">
                <div className="chart-container">
                  <div className="chart-title">Win/Loss</div>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={winLossChart} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                        {winLossChart.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#1a1f2e', border: '1px solid #2d3748' }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="chart-container">
                  <div className="chart-title">R:R Distribution</div>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={rrDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                      <XAxis dataKey="rr" stroke="#a8aeb8" />
                      <YAxis stroke="#a8aeb8" />
                      <Tooltip contentStyle={{ background: '#1a1f2e', border: '1px solid #2d3748' }} />
                      <Bar dataKey="count" fill="#6366f1" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingId ? 'Edit Trade' : 'Add New Trade'}</h2>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Symbol</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="BTC, AAPL, BBCA.JK"
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Entry Price</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="0.00"
                    value={formData.entryPrice}
                    onChange={(e) => setFormData({ ...formData, entryPrice: e.target.value })}
                  />
                  <button className="btn btn-secondary btn-small" onClick={handleCheckPrice} disabled={priceLoading}>
                    {priceLoading && <span className="spinner" />}
                    {!priceLoading && <RefreshCw size={14} />}
                    Cek Harga
                  </button>
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Stop Loss</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="0.00"
                    value={formData.stopLoss}
                    onChange={(e) => setFormData({ ...formData, stopLoss: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Take Profit</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="0.00"
                    value={formData.takeProfit}
                    onChange={(e) => setFormData({ ...formData, takeProfit: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Quantity</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="0.00"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Entry Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.entryDate}
                    onChange={(e) => setFormData({ ...formData, entryDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Exit Price (Optional)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="0.00"
                    value={formData.exitPrice}
                    onChange={(e) => setFormData({ ...formData, exitPrice: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Exit Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.exitDate}
                    onChange={(e) => setFormData({ ...formData, exitDate: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAddTrade}>
                {editingId ? 'Update' : 'Add'} Trade
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const PositionSizer = ({ account }) => {
  const [entry, setEntry] = useState('')
  const [sl, setSl] = useState('')
  const [result, setResult] = useState(null)

  const handleCalculate = () => {
    if (!entry || !sl) {
      setResult({ error: 'Isi entry dan SL' })
      return
    }

    const riskAmount = (account.initialCapital * account.riskPerTrade) / 100
    const riskPoints = Math.abs(parseFloat(entry) - parseFloat(sl))
    const quantity = riskAmount / riskPoints

    setResult({
      riskAmount: riskAmount.toFixed(2),
      quantity: quantity.toFixed(4)
    })
  }

  return (
    <>
      <div className="form-group">
        <label className="form-label">Entry Price</label>
        <input
          type="number"
          className="form-input"
          placeholder="0.00"
          value={entry}
          onChange={(e) => setEntry(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label className="form-label">Stop Loss</label>
        <input
          type="number"
          className="form-input"
          placeholder="0.00"
          value={sl}
          onChange={(e) => setSl(e.target.value)}
        />
      </div>
      <button className="btn btn-primary" onClick={handleCalculate} style={{ width: '100%' }}>
        Hitung Quantity
      </button>
      {result && (
        <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '8px' }}>
          {result.error ? (
            <p style={{ color: '#f6465d' }}>{result.error}</p>
          ) : (
            <>
              <div style={{ marginBottom: '0.5rem' }}>
                <small style={{ color: '#a8aeb8' }}>Risk Amount:</small>
                <div style={{ fontFamily: 'JetBrains Mono', fontWeight: 600, fontSize: '1.2rem' }}>
                  {account.currency} {parseFloat(result.riskAmount).toLocaleString('id-ID', { maximumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <small style={{ color: '#a8aeb8' }}>Quantity:</small>
                <div style={{ fontFamily: 'JetBrains Mono', fontWeight: 600, fontSize: '1.2rem', color: '#26d07c' }}>
                  {result.quantity}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}

export default App
