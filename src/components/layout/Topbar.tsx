'use client'

import { Bell, Search, User } from 'lucide-react'
import { usePathname } from 'next/navigation'

const titles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/cuentas': 'Cuentas',
  '/ingresos': 'Ingresos',
  '/gastos': 'Gastos',
  '/prestamos': 'Préstamos',
  '/deudas': 'Deudas',
  '/presupuesto': 'Presupuesto',
  '/metas': 'Metas',
  '/historial': 'Historial',
  '/moneyflow-ai': 'MoneyFlow AI',
  '/ajustes': 'Ajustes',
}

export default function Topbar() {
  const pathname = usePathname()
  const title = titles[pathname] ?? 'MoneyFlow'

  return (
    <header className="h-16 bg-[#0f1923] border-b border-white/5 flex items-center justify-between px-6 flex-shrink-0">
      <h1 className="text-white font-semibold text-lg">{title}</h1>

      <div className="flex items-center gap-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar transacciones..."
            className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 w-64"
          />
        </div>

        <button className="relative text-slate-400 hover:text-white transition-colors">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full" />
        </button>

        <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
          <User size={16} className="text-emerald-400" />
        </div>
      </div>
    </header>
  )
}
