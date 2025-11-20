import Hero from './components/Hero'
import BudgetPlanner from './components/BudgetPlanner'
import Dashboard from './components/Dashboard'

function App() {
  return (
    <div className="min-h-screen bg-slate-900">
      <Hero />
      <main>
        <BudgetPlanner />
        <Dashboard />
      </main>
      <footer className="py-8 text-center text-white/50 text-sm">Stay on track financially every month.</footer>
    </div>
  )
}

export default App