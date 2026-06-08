'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Landmark, TrendingUp, CreditCard,
  HandCoins, Wallet, PiggyBank, Target, History,
  Bot, Settings, ChevronLeft, Upload
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { href: '/dashboard',      label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/cuentas',        label: 'Cuentas',       icon: Landmark },
  { href: '/ingresos',       label: 'Ingresos',      icon: TrendingUp },
  { href: '/gastos',         label: 'Gastos',        icon: CreditCard },
  { href: '/prestamos',      label: 'Préstamos',     icon: HandCoins },
  { href: '/deudas',         label: 'Deudas',        icon: Wallet },
  { href: '/presupuesto',    label: 'Presupuesto',   icon: PiggyBank },
  { href: '/metas',          label: 'Metas',         icon: Target },
  { href: '/historial',      label: 'Historial',     icon: History },
  { href: '/importar',       label: 'Importar',      icon: Upload },
  { href: '/moneyflow-ai',   label: 'MoneyFlow AI',  icon: Bot },
  { href: '/ajustes',        label: 'Ajustes',       icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className={`relative flex flex-col bg-[#0f1923] border-r border-white/5 transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-white text-sm flex-shrink-0">M</div>
        {!collapsed && (
          <div>
            <p className="text-white font-bold text-sm leading-none">MoneyFlow</p>
            <p className="text-emerald-400 text-xs">DR</p>
          </div>
        )}
      </div>

      <nav className="flex-1 py-4 space-y-0.5 px-2 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active ? 'bg-emerald-500/10 text-emerald-400 font-medium' : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}>
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          )
        })}
      </nav>

      <button onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-[#0f1923] border border-white/10 flex items-center justify-center text-slate-400 hover:text-white">
        <ChevronLeft size={12} className={`transition-transform ${collapsed ? 'rotate-180' : ''}`} />
      </button>
    </aside>
  )
}
