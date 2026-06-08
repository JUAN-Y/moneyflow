'use client'

import { Bell, Search, User, X } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'

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

const ALL_TRANSACTIONS = [
  { label: 'Supermercado La Sirena', sub: 'Comida · RD$ 3,850', href: '/historial' },
  { label: 'Pizarelli', sub: 'Comida · RD$ 1,650', href: '/historial' },
  { label: 'Uber', sub: 'Transporte · RD$ 450', href: '/historial' },
  { label: 'Netflix', sub: 'Entretenimiento · RD$ 850', href: '/historial' },
  { label: 'Farmacia Carol', sub: 'Salud · RD$ 1,200', href: '/historial' },
  { label: 'Claro', sub: 'Servicios · RD$ 2,100', href: '/historial' },
  { label: 'Salario', sub: 'Ingreso · RD$ 95,000', href: '/ingresos' },
  { label: 'Freelance diseño', sub: 'Ingreso · RD$ 25,000', href: '/ingresos' },
]

const PAGES = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Cuentas', href: '/cuentas' },
  { label: 'Ingresos', href: '/ingresos' },
  { label: 'Gastos', href: '/gastos' },
  { label: 'Préstamos', href: '/prestamos' },
  { label: 'Deudas', href: '/deudas' },
  { label: 'Presupuesto', href: '/presupuesto' },
  { label: 'Metas', href: '/metas' },
  { label: 'Historial', href: '/historial' },
  { label: 'MoneyFlow AI', href: '/moneyflow-ai' },
]

export default function Topbar() {
  const pathname = usePathname()
  const router = useRouter()
  const title = titles[pathname] ?? 'MoneyFlow'
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const results = query.trim().length > 0
    ? [...PAGES, ...ALL_TRANSACTIONS].filter(r =>
        r.label.toLowerCase().includes(query.toLowerCase()) ||
        r.sub?.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 6)
    : []

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <header className="h-16 bg-[#0f1923] border-b border-white/5 flex items-center justify-between px-6 flex-shrink-0">
      <h1 className="text-white font-semibold text-lg">{title}</h1>

      <div className="flex items-center gap-4">
        <div className="relative" ref={ref}>
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            placeholder="Buscar transacciones..."
            className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-8 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 w-64"
          />
          {query && (
            <button onClick={() => { setQuery(''); setOpen(false) }} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
              <X size={14} />
            </button>
          )}

          {open && results.length > 0 && (
            <div className="absolute top-full mt-2 w-full bg-[#0f1923] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
              {results.map((r, i) => (
                <button
                  key={i}
                  onClick={() => { router.push(r.href); setQuery(''); setOpen(false) }}
                  className="w-full flex flex-col items-start px-4 py-3 hover:bg-white/5 transition-colors text-left"
                >
                  <span className="text-white text-sm">{r.label}</span>
                  {r.sub && <span className="text-slate-500 text-xs">{r.sub}</span>}
                </button>
              ))}
            </div>
          )}

          {open && query.trim().length > 0 && results.length === 0 && (
            <div className="absolute top-full mt-2 w-full bg-[#0f1923] border border-white/10 rounded-xl shadow-xl z-50 p-4 text-center text-slate-500 text-sm">
              Sin resultados para "{query}"
            </div>
          )}
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
