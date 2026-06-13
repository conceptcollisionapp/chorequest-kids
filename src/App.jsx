import React, { useState, useEffect } from 'react'

const defaultChores = [
  { id: 1, name: "Make bed", points: 5 },
  { id: 2, name: "Brush teeth", points: 3 },
  { id: 3, name: "Feed pet", points: 8 },
  { id: 4, name: "Put toys away", points: 6 },
  { id: 5, name: "Help set table", points: 10 },
]

const defaultRewards = [
  { id: 1, name: "Small Toy", cost: 20 },
  { id: 2, name: "Big Toy", cost: 50 },
  { id: 3, name: "Special Trip", cost: 100 },
]

function App() {
  const [chores, setChores] = useState(defaultChores)
  const [rewards, setRewards] = useState(defaultRewards)
  const [completed, setCompleted] = useState({})
  const [dayCounts, setDayCounts] = useState({})
  const [spent, setSpent] = useState(0)
  const [parentMode, setParentMode] = useState(false)
  const [nextChoreId, setNextChoreId] = useState(6)
  const [nextRewardId, setNextRewardId] = useState(4)
  const [newChoreName, setNewChoreName] = useState('')
  const [newChorePoints, setNewChorePoints] = useState(5)
  const [newRewardName, setNewRewardName] = useState('')
  const [newRewardCost, setNewRewardCost] = useState(30)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('chorequest')
      if (saved) {
        const data = JSON.parse(saved)
        setCompleted(data.completed || {})
        setDayCounts(data.dayCounts || {})
        setSpent(data.spent || 0)
        setChores(data.chores || defaultChores)
        setRewards(data.rewards || defaultRewards)
        setNextChoreId(data.nextChoreId || 6)
        setNextRewardId(data.nextRewardId || 4)
      }
    } catch {}
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('chorequest', JSON.stringify({ completed, dayCounts, spent, chores, rewards, nextChoreId, nextRewardId }))
    } catch {}
  }, [completed, dayCounts, spent, chores, rewards, nextChoreId, nextRewardId])

  const getLocalDate = (d = new Date()) => d.toLocaleDateString('en-CA')

  const toggleChore = (id) => {
    const today = getLocalDate()
    const chore = chores.find(c => c.id === id)
    if (!chore) return

    setCompleted(prev => {
      const newDay = { ...(prev[today] || {}) }
      if (newDay[id]) {
        delete newDay[id]
        if (Object.keys(newDay).length === 0) {
          const { [today]: _, ...rest } = prev
          return rest
        }
        return { ...prev, [today]: newDay }
      } else {
        newDay[id] = chore.points
        return { ...prev, [today]: newDay }
      }
    })

    setDayCounts(prev => {
      if (prev[today]) return prev
      return { ...prev, [today]: chores.length }
    })
  }

  const openParentMode = () => {
    const answer = prompt('Parent Mode: What is 7×8?')
    if (Number(answer?.trim()) === 56) {
      setParentMode(true)
    } else {
      alert('Wrong answer!')
    }
  }

  const addChore = () => {
    const pts = parseInt(newChorePoints)
    if (!newChoreName.trim() || isNaN(pts) || pts <= 0) return
    setChores([...chores, { id: nextChoreId, name: newChoreName.trim(), points: pts }])
    setNextChoreId(nextChoreId + 1)
    setNewChoreName('')
    setNewChorePoints(5)
  }

  const deleteChore = (id) => setChores(chores.filter(c => c.id !== id))

  const addReward = () => {
    const cost = parseInt(newRewardCost)
    if (!newRewardName.trim() || isNaN(cost) || cost <= 0) return
    setRewards([...rewards, { id: nextRewardId, name: newRewardName.trim(), cost }])
    setNextRewardId(nextRewardId + 1)
    setNewRewardName('')
    setNewRewardCost(30)
  }

  const deleteReward = (id) => setRewards(rewards.filter(r => r.id !== id))

  const calculateStats = () => {
    const allDates = Object.keys(completed).sort()
    if (allDates.length === 0) return { points: 0, rate: 0, unlocked: false }

    let lifetime = 0
    allDates.forEach(date => {
      Object.values(completed[date]).forEach(pts => { lifetime += pts })
    })
    const balance = Math.max(0, lifetime - spent)

    const firstDate = allDates[0]
    const [y, m, d] = firstDate.split('-').map(Number)
    const start = new Date(y, m - 1, d)
    const today = new Date()
    const daysSinceStart = Math.min(30, Math.floor((today - start) / 86400000) + 1)

    let total = 0, done = 0
    for (let i = 0; i < daysSinceStart; i++) {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      const ds = getLocalDate(d)
      const dayData = completed[ds] || {}
      const dayCount = dayCounts[ds] || chores.length
      const actual = Object.keys(dayData).length
      total += Math.max(dayCount, actual)
      done += actual
    }
    const rate = total > 0 ? (done / total) * 100 : 0
    return { points: balance, rate, unlocked: rate >= 90 }
  }

  const { points, rate, unlocked } = calculateStats()

  const exchangePoints = (amount) => {
    if (points >= amount) {
      setSpent(s => s + amount)
      alert(`🎉 You redeemed ${amount} coins! Ask a grown-up for your reward!`)
    } else {
      alert(`Not enough coins yet! You need ${amount - points} more.`)
    }
  }

  return (
    <div className="app">
      <h1>🗡️ ChoreQuest</h1>

      <button onClick={parentMode ? () => setParentMode(false) : openParentMode} className="parent-toggle">
        {parentMode ? '👨‍👩‍👧 Exit Parent Mode' : '👨‍👩‍👧 Parent Mode'}
      </button>

      {parentMode && (
        <div className="parent-panel">
          <h3>Add Chore</h3>
          <input value={newChoreName} onChange={e => setNewChoreName(e.target.value)} placeholder="Chore name" />
          <input type="number" value={newChorePoints} onChange={e => setNewChorePoints(e.target.value)} />
          <button onClick={addChore}>Add Chore</button>

          <h3>Chores</h3>
          {chores.map(c => (
            <div key={c.id}>{c.name} ({c.points}) <button onClick={() => deleteChore(c.id)}>Delete</button></div>
          ))}

          <h3>Add Reward</h3>
          <input value={newRewardName} onChange={e => setNewRewardName(e.target.value)} placeholder="Reward name" />
          <input type="number" value={newRewardCost} onChange={e => setNewRewardCost(e.target.value)} />
          <button onClick={addReward}>Add Reward</button>

          <h3>Rewards</h3>
          {rewards.map(r => (
            <div key={r.id}>{r.name} ({r.cost}) <button onClick={() => deleteReward(r.id)}>Delete</button></div>
          ))}
        </div>
      )}

      <div className="stats">
        <div className="coin">⭐ {points} Quest Coins</div>
        <div className="rate">30-Day Rate: {rate.toFixed(1)}%</div>
      </div>

      {unlocked && <div className="big-reward">🏆 EPIC REWARD UNLOCKED!</div>}

      <div className="chores">
        {chores.map(chore => {
          const today = getLocalDate()
          const isDone = completed[today] && completed[today][chore.id]
          return (
            <div key={chore.id} className={`chore ${isDone ? 'done' : ''}`} onClick={() => toggleChore(chore.id)}>
              <span>{chore.name}</span>
              <span>+{chore.points} coins</span>
            </div>
          )
        })}
      </div>

      <div className="shop">
        <h2>🛒 Reward Shop</h2>
        {rewards.map(reward => (
          <button key={reward.id} onClick={() => exchangePoints(reward.cost)}>
            {reward.name} ({reward.cost} coins)
          </button>
        ))}
      </div>
    </div>
  )
}

export default App
