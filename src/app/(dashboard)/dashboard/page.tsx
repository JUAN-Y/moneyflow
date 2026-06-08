import { createClient } from '@/lib/supabase/server'
import { TrendingUp, TrendingDown, Wallet, AlertCircle } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const now = new Date()
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const [{ data: accounts }, { data: transactions }, { data: debts }] = await Promise.all([
    supabase.from('accounts').select('balance').eq('user_id', user!.id),
    supabase.from('transactions').select('amount,type').eq('user_id', user!.id).gte('date', `${month}-01`),
    supabase.from('debts').select('remaining_amount').eq('user_id', user!.id),
  ])

  const totalBalance = accounts?.reduce((s, a) => s + Number(a.balance), 0) ?? 0
  const monthIncome = transactions?.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0) ?? 0
  const monthExpenses = transactions?.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0) ?? 0
  const totalDebt = debts?.reduce((s, d) => s + Number(d.remaining_amount), 0) ?? 0

  const stats = [
    { label: 'Balance Total', value: totalBalance, icon: Wallet, color: 'emerald' },
    { label: 'Ingresos del Mes', value: monthIncome, icon: TrendingUp, color: 'emerald' },
    { label: 'Gastos del Mes', value: monthExpenses, icon: TrendingDown, color: 'red' },
    { label: 'Deudas Pendientes', value: totalDebt, icon: AlertCircle, color: 'orange' },
  ]

  const fmt = (n: number) => `RD$ ${n.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white/5 rounded-2xl p-5 border border-white/5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-400 text-sm">{label}</span>
              <div className={`w-9 h-9 rounded-xl bg-${color}-500/10 flex items-center justify-center`}>
                <Icon size={18} className={`text-${color}-400`} />
              </div>
            </div>
            <p className="text-white text-xl font-bold">{fmt(value)}</p>
          </div>
        ))}
      </div>

      <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
        <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          AI Insights
        </h2>
        {monthExpenses > monthIncome ? (
          <p className="text-red-400 text-sm">Tus gastos superan tus ingresos este mes. Revisa tu presupuesto.</p>
        ) : monthExpenses === 0 ? (
          <p className="text-slate-400 text-sm">Importa tu estado de cuenta en Gastos para ver tus insights.</p>
        ) : (
          <p className="text-slate-400 text-sm">Llevas gastado el {Math.round((monthExpenses / monthIncome) * 100)}% de tus ingresos este mes. {monthExpenses / monthIncome > 0.8 ? 'Cuidado, estás cerca del límite.' : '¡Vas bien!'}</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white/5 rounded-2xl p-5 border border-white/5 h-64 flex items-center justify-center">
          <p className="text-slate-500 text-sm">Gráficos próximamente</p>
        </div>
        <div className="bg-white/5 rounded-2xl p-5 border border-white/5 h-64 flex items-center justify-center">
          <p className="text-slate-500 text-sm">Ingresos vs Gastos — próximamente</p>
        </div>
      </div>
    </div>
  )
}
