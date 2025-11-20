import { useEffect, useMemo, useState } from 'react'

export default function Dashboard() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0,7))
  const [metrics, setMetrics] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [txList, setTxList] = useState([])
  const [newTx, setNewTx] = useState({ amount: '', category: 'food', label: '', date: new Date().toISOString().slice(0,10) })

  const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

  const load = async () => {
    try {
      const [budgetRes, alertRes, txRes] = await Promise.all([
        fetch(`${baseUrl}/api/budget/${month}`),
        fetch(`${baseUrl}/api/alerts/${month}`),
        fetch(`${baseUrl}/api/transactions?month=${month}`),
      ])
      const budget = budgetRes.ok ? await budgetRes.json() : null
      const alerts = alertRes.ok ? await alertRes.json() : []
      const txs = txRes.ok ? await txRes.json() : []
      setMetrics(budget?.metrics || null)
      setAlerts(alerts)
      setTxList(txs)
    } catch(e) {}
  }

  useEffect(() => { load() /* eslint-disable-next-line */ }, [month])

  const addTx = async () => {
    try {
      const payload = { ...newTx, amount: Number(newTx.amount || 0) }
      const res = await fetch(`${baseUrl}/api/transactions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (res.ok) {
        setNewTx({ amount: '', category: 'food', label: '', date: new Date().toISOString().slice(0,10) })
        await load()
      }
    } catch(e) {}
  }

  return (
    <section className="py-12 px-6 bg-slate-950 text-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div>
            <label className="block text-sm text-white/70 mb-1">Month</label>
            <input type="month" value={month} onChange={e=>setMonth(e.target.value)} className="bg-slate-800 border border-white/10 rounded px-3 py-2" />
          </div>
        </div>

        {/* KPI cards */}
        {metrics ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <KPI label="Income" value={`$${metrics.income.toFixed(2)}`} />
            <KPI label="Planned Spend" value={`$${metrics.planned_total.toFixed(2)}`} />
            <KPI label="Actual Spent" value={`$${metrics.actual_spent.toFixed(2)}`} />
            <KPI label="Remaining" value={`$${metrics.remaining_actual.toFixed(2)}`} />
            <KPI label="Daily Limit" value={`$${metrics.daily_limit.toFixed(2)}`} />
            <KPI label="Weekly Limit" value={`$${metrics.weekly_limit.toFixed(2)}`} />
          </div>
        ) : (
          <p className="mt-6 text-white/70">No plan yet for this month. Add one above.</p>
        )}

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="mt-8 space-y-2">
            <h3 className="text-lg font-semibold">Alerts</h3>
            {alerts.map((a, i) => (
              <div key={i} className={`p-3 rounded border ${a.level==='danger'?'border-red-500/40 bg-red-500/10':a.level==='warning'?'border-yellow-500/40 bg-yellow-500/10':'border-blue-500/40 bg-blue-500/10'}`}>
                <p className="text-sm">{a.message}</p>
              </div>
            ))}
          </div>
        )}

        {/* Category breakdown */}
        {metrics && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <CategoryChart title="Planned by Category" data={metrics.planned_by_category} />
            <CategoryChart title="Actual by Category" data={metrics.actual_by_category} />
          </div>
        )}

        {/* Quick add transaction */}
        <div className="mt-10 bg-slate-900/60 border border-white/10 rounded p-4">
          <h3 className="font-semibold mb-3">Quick Add Expense</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <input type="number" value={newTx.amount} onChange={e=>setNewTx(s=>({...s, amount:e.target.value}))} placeholder="Amount" className="bg-slate-900 rounded px-3 py-2" />
            <input value={newTx.category} onChange={e=>setNewTx(s=>({...s, category:e.target.value}))} placeholder="Category" className="bg-slate-900 rounded px-3 py-2" />
            <input value={newTx.label} onChange={e=>setNewTx(s=>({...s, label:e.target.value}))} placeholder="Label" className="bg-slate-900 rounded px-3 py-2" />
            <input type="date" value={newTx.date} onChange={e=>setNewTx(s=>({...s, date:e.target.value}))} className="bg-slate-900 rounded px-3 py-2" />
            <button onClick={addTx} className="bg-blue-500 hover:bg-blue-600 rounded px-4 py-2">Add</button>
          </div>
        </div>

        {/* Transactions list */}
        <div className="mt-8 bg-slate-900/60 border border-white/10 rounded p-4">
          <h3 className="font-semibold mb-3">Transactions</h3>
          <div className="divide-y divide-white/5">
            {txList.length === 0 && <p className="text-white/70">No transactions yet.</p>}
            {txList.map(t => (
              <div key={t._id} className="py-2 flex items-center justify-between text-sm">
                <span className="text-white/80">{t.date}</span>
                <span className="text-white/80">{t.category}</span>
                <span className="text-white font-semibold">${Number(t.amount).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function KPI({ label, value }) {
  return (
    <div className="bg-slate-900/60 border border-white/10 rounded p-4">
      <p className="text-white/60 text-sm">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  )
}

function CategoryChart({ title, data }) {
  const entries = Object.entries(data || {})
  const total = entries.reduce((s, [,v]) => s + v, 0)
  return (
    <div className="bg-slate-900/60 border border-white/10 rounded p-4">
      <h4 className="font-semibold mb-3">{title}</h4>
      {entries.length === 0 ? (
        <p className="text-white/70 text-sm">No data</p>
      ) : (
        <div className="space-y-2">
          {entries.map(([k,v]) => (
            <div key={k} className="">
              <div className="flex justify-between text-sm">
                <span className="text-white/80">{k}</span>
                <span className="text-white font-medium">${v.toFixed(2)}</span>
              </div>
              <div className="h-2 bg-white/10 rounded">
                <div className="h-2 bg-blue-500 rounded" style={{ width: `${total>0?(v/total*100):0}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
