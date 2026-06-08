import { TrendingUp, TrendingDown, Wallet, AlertCircle } from 'lucide-react'

const stats = [
  { label: 'Balance Total', value: 'RD$ 487,520.75', change: '+12.5%', positive: true, icon: Wallet },
  { label: 'Ingresos del Mes', value: 'RD$ 125,000.00', change: '+5.2%', positive: true, icon: TrendingUp },
  { label: 'Gastos del Mes', value: 'RD$ 78,430.00', change: '+18%', positive: false, icon: TrendingDown },
  { label: 'Deudas Pendientes', value: 'RD$ 45,000.00', change: '-3%', positive: true, icon: AlertCircle },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(({ label, value, change, positive, icon: Icon }) => (
          <div key={label} className="bg-white/5 rounded-2xl p-5 border border-white/5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-400 text-sm">{label}</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Icon size={18} className="text-emerald-400" />
              </div>
            </div>
            <p className="text-white text-xl font-bold">{value}</p>
            <p className={`text-xs mt-1 ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
              {change} vs. mes anterior
            </p>
          </div>
        ))}
      </div>

      {/* AI Insights placeholder */}
      <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
        <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          AI Insights
        </h2>
        <p className="text-slate-400 text-sm">
          Tus gastos en Comida subieron un 18% este mes. Intenta planificar tus comidas semanalmente para ahorrar.
        </p>
      </div>

      {/* Placeholder charts area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white/5 rounded-2xl p-5 border border-white/5 h-64 flex items-center justify-center">
          <p className="text-slate-500 text-sm">Gráfico de gastos por categoría</p>
        </div>
        <div className="bg-white/5 rounded-2xl p-5 border border-white/5 h-64 flex items-center justify-center">
          <p className="text-slate-500 text-sm">Ingresos vs Gastos — últimos 6 meses</p>
        </div>
      </div>
    </div>
  )
}
