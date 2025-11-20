import { useEffect, useMemo, useState } from 'react'

const CATEGORIES = ['rent', 'utilities', 'food', 'transport', 'subscriptions', 'entertainment', 'health', 'savings', 'other']

export default function BudgetPlanner() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0,7))
  const [income, setIncome] = useState('')
  const [expenses, setExpenses] = useState([{ name: 'Rent', category: 'rent', amount: 0, due_day: 1 }])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

  const plannedTotal = useMemo(() => expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0), [expenses])

  useEffect(() => {
    // Try loading existing month plan
    (async () => {
      setLoading(true)
      try {
        const res = await fetch(`${baseUrl}/api/budget/${month}`)
        if (res.ok) {
          const data = await res.json()
          setIncome(data.plan?.income || '')
          setExpenses(data.plan?.planned_expenses?.length ? data.plan.planned_expenses : [{ name: 'Rent', category: 'rent', amount: 0, due_day: 1 }])
        }
      } catch(e) {}
      setLoading(false)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month])

  const updateExpense = (idx, field, value) => {
    setExpenses(prev => prev.map((e, i) => i === idx ? { ...e, [field]: value } : e))
  }
  const addExpense = () => setExpenses(prev => [...prev, { name: '', category: 'other', amount: 0 }])
  const removeExpense = (idx) => setExpenses(prev => prev.filter((_, i) => i !== idx))

  const savePlan = async () => {
    setLoading(true)
    setMessage('')
    try {
      const payload = {
        month,
        income: Number(income || 0),
        planned_expenses: expenses.map(e => ({ ...e, amount: Number(e.amount || 0), recurring: true }))
      }
      const res = await fetch(`${baseUrl}/api/budget/${month}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error('Failed to save')
      setMessage('Saved. Budget and metrics recalculated.')
    } catch (e) {
      setMessage('Error saving plan.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="py-10 px-6 bg-slate-900 text-white">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div>
            <label className="block text-sm text-white/70 mb-1">Month</label>
            <input type="month" value={month} onChange={e=>setMonth(e.target.value)} className="bg-slate-800 border border-white/10 rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1">Income</label>
            <input type="number" value={income} onChange={e=>setIncome(e.target.value)} placeholder="0" className="bg-slate-800 border border-white/10 rounded px-3 py-2" />
          </div>
          <button onClick={savePlan} disabled={loading} className="bg-blue-500 hover:bg-blue-600 disabled:opacity-60 rounded px-4 py-2 font-medium">Save Plan</button>
        </div>

        <div className="mt-6 text-white/80">Planned total: <span className="font-semibold text-white">${plannedTotal.toFixed(2)}</span></div>

        <div className="mt-6 space-y-4">
          {expenses.map((e, idx) => (
            <div key={idx} className="bg-slate-800/60 border border-white/10 rounded p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
              <input value={e.name} onChange={ev=>updateExpense(idx,'name',ev.target.value)} placeholder="Name" className="bg-slate-900 rounded px-3 py-2" />
              <select value={e.category} onChange={ev=>updateExpense(idx,'category',ev.target.value)} className="bg-slate-900 rounded px-3 py-2">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input type="number" value={e.amount} onChange={ev=>updateExpense(idx,'amount',ev.target.value)} placeholder="0" className="bg-slate-900 rounded px-3 py-2" />
              <input type="number" min={1} max={31} value={e.due_day || ''} onChange={ev=>updateExpense(idx,'due_day',ev.target.value)} placeholder="Due day" className="bg-slate-900 rounded px-3 py-2" />
              <div className="flex items-center gap-2">
                <button onClick={() => removeExpense(idx)} className="bg-red-500/80 hover:bg-red-500 rounded px-3 py-2">Delete</button>
              </div>
            </div>
          ))}
          <button onClick={addExpense} className="bg-slate-800 hover:bg-slate-700 border border-white/10 rounded px-4 py-2">Add Expense</button>
        </div>
        {message && <p className="mt-4 text-sm text-white/80">{message}</p>}
      </div>
    </section>
  )
}
