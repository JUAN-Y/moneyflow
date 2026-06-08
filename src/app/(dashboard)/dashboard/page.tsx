import { createClient } from '@/lib/supabase/server'
import { TrendingUp, TrendingDown, Wallet, AlertCircle, HandCoins, PiggyBank, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const now = new Date()
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const [{ data: accounts }, { data: transactions }, { data: debts }, { data: goals }] = await Promise.all([
    supabase.from('accounts').select('balance').eq('user_id', user!.id),
    supabase.from('transactions').select('amount,type').eq('user_id', user!.id).gte('date', `${month}-01`),
    supabase.from('debts').select('remaining_amount,total_amount').eq('user_id', user!.id),
    supabase.from('goals').select('current_amount,target_amount,name').eq('user_id', user!.id),
  ])

  const totalBalance = accounts?.reduce((s, a) => s + Number(a.balance), 0) ?? 0
  const monthIncome = transactions?.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0) ?? 0
  const monthExpenses = transactions?.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0) ?? 0
  const totalDebt = debts?.reduce((s, d) => s + Number(d.remaining_amount), 0) ?? 0
  const totalSavings = goals?.reduce((s, g) => s + Number(g.current_amount), 0) ?? 0
  const netBalance = totalBalance + monthIncome - monthExpenses - totalDebt

  const spentPct = monthIncome > 0 ? Math.min(Math.round((monthExpenses / monthIncome) * 100), 100) : 0
  const semaphore = spentPct >= 90 ? 'red' : spentPct >= 70 ? 'yellow' : 'green'

  const fmt = (n: number) => `RD$ ${n.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`

  const pillars = [
    { label: 'Ingresos', value: monthIncome, color: 'emerald', icon: TrendingUp, pct: 100, href: '/ingresos' },
    { label: 'Gastos', value: monthExpenses, color: 'red', icon: TrendingDown, pct: monthIncome > 0 ? spentPct : 0, href: '/gastos' },
    { label: 'Deudas', value: totalDebt, color: 'orange', icon: AlertCircle, pct: debts?.length ? Math.round(((debts.reduce((s,d)=>s+Number(d.total_amount-d.remaining_amount),0))/(debts.reduce((s,d)=>s+Number(d.total_amount),0)||1))*100) : 0, href: '/deudas' },
    { label: 'Ahorros', value: totalSavings, color: 'blue', icon: PiggyBank, pct: goals?.length && goals[0] ? Math.round((Number(goals[0].current_amount)/Number(goals[0].target_amount))*100) : 0, href: '/metas' },
    { label: 'Balance', value: totalBalance, color: 'emerald', icon: Wallet, pct: 100, href: '/cuentas' },
  ]

  return (
    <div className="space-y-6">
      {/* Hero Balance Neto */}
      <div className="bg-gradient-to-br from-emerald-500/20 via-emerald-900/10 to-transparent border border-emerald-500/20 rounded-2xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-slate-400 text-sm mb-1">Balance Neto Real</p>
            <p className="text-white text-4xl font-bold">{fmt(netBalance)}</p>
            <p className="text-slate-500 text-xs mt-1">Ingresos + Cuentas − Gastos − Deudas</p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
            semaphore === 'green' ? 'bg-emerald-500/20 text-emerald-400' :
            semaphore === 'yellow' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            <div className={`w-2 h-2 rounded-full animate-pulse ${
              semaphore === 'green' ? 'bg-emerald-400' :
              semaphore === 'yellow' ? 'bg-yellow-400' : 'bg-red-400'
            }`} />
            {semaphore === 'green' ? 'Saludable' : semaphore === 'yellow' ? 'Cuidado' : 'Alerta'}
          </div>
        </div>
        <Link href="/importar" className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
          <ArrowUpRight size={16} /> Importar Estado de Cuenta
        </Link>
      </div>

      {/* 5 Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
        {pillars.map(({ label, value, color, icon: Icon, pct, href }) => (
          <Link key={label} href={href} className="bg-white/5 rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-400 text-xs">{label}</span>
              <div className={`w-7 h-7 rounded-lg bg-${color}-500/10 flex items-center justify-center`}>
                <Icon size={14} className={`text-${color}-400`} />
              </div>
            </div>
            <p className="text-white text-base font-bold mb-2">{fmt(value)}</p>
            <div className="w-full bg-white/10 rounded-full h-1">
              <div className={`bg-${color}-500 h-1 rounded-full`} style={{ width: `${pct}%` }} />
            </div>
            <p className="text-slate-500 text-xs mt-1">{pct}%</p>
          </Link>
        ))}
      </div>

      {/* AI Insight + Budget */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
          <h2 className="text-white font-semibold mb-3 flex items-center gap-2 text-sm">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" /> AI Insights
          </h2>
          {monthExpenses === 0 ? (
            <p className="text-slate-400 text-sm">Importa tu estado de cuenta para ver tus insights personalizados.</p>
          ) : monthExpenses > monthIncome ? (
            <p className="text-red-400 text-sm">Tus gastos superan tus ingresos este mes en {fmt(monthExpenses - monthIncome)}. Revisa tu presupuesto.</p>
          ) : (
            <p className="text-slate-400 text-sm">
              Llevas gastado el <span className={`font-semibold ${spentPct > 80 ? 'text-yellow-400' : 'text-emerald-400'}`}>{spentPct}%</span> de tus ingresos.
              {spentPct > 80 ? ' Cuidado, estás cerca del límite.' : ' ¡Vas bien este mes!'}
            </p>
          )}
        </div>

        <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
          <h2 className="text-white font-semibold mb-3 text-sm">Presupuesto del Mes</h2>
          {monthIncome === 0 ? (
            <p className="text-slate-500 text-sm">Sin datos aún.</p>
          ) : (
            <>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Gastado: {fmt(monthExpenses)}</span>
                <span>Ingresos: {fmt(monthIncome)}</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-3">
                <div className={`h-3 rounded-full transition-all ${
                  spentPct >= 90 ? 'bg-red-500' : spentPct >= 70 ? 'bg-yellow-500' : 'bg-emerald-500'
                }`} style={{ width: `${spentPct}%` }} />
              </div>
              <p className="text-slate-400 text-xs mt-2">Disponible: {fmt(Math.max(0, monthIncome - monthExpenses))}</p>
            </>
          )}
        </div>
      </div>

      {/* Goals progress */}
      {goals && goals.length > 0 && (
        <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-sm">Progreso de Metas</h2>
            <Link href="/metas" className="text-emerald-400 text-xs hover:underline">Ver todas</Link>
          </div>
          <div className="space-y-3">
            {goals.slice(0, 3).map((g, i) => {
              const pct = Math.round((Number(g.current_amount) / Number(g.target_amount)) * 100)
              return (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300">{g.name}</span>
                    <span className="text-emerald-400">{pct}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5">
                    <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
