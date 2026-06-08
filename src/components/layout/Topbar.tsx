'use client'

import { Bell, Search, X, LogOut } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const titles: Record<string, string> = {
  '/dashboard': 'Dashboard', '/cuentas': 'Cuentas', '/ingresos': 'Ingresos',
  '/gastos': 'Gastos', '/prestamos': 'Préstamos', '/deudas': 'Deudas',
  '/presupuesto': 'Presupuesto', '/metas': 'Metas', '/historial': 'Historial',
  '/importar': 'Importar', '/moneyflow-ai': 'MoneyFlow AI', '/ajustes': 'Ajustes',
}

const PAGES = [
  { label: 'Dashboard', href: '/dashboard' }, { label: 'Cuentas', href: '/cuentas' },
  { label: 'Ingresos', href: '/ingresos' }, { label: 'Gastos', href: '/gastos' },
  { label: 'Préstamos', href: '/prestamos' }, { label: 'Deudas', href: '/deudas' },
  { label: 'Presupuesto', href: '/presupuesto' }, { label: 'Metas', href: '/metas' },
  { label: 'Historial', href: '/historial' }, { label: 'Importar', href: '/importar' },
  { label: 'MoneyFlow AI', href: '/moneyflow-ai' },
]

export default function Topbar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const title = titles[pathname] ?? 'MoneyFlow'
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [userMenu, setUserMenu] = useState(false)
  const [userName, setUserName] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario')
    })
  }, [])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const results = query.trim().length > 0
    ? PAGES.filter(r => r.label.toLowerCase().includes(query.toLowerCase())).slice(0, 6)
    : []

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="h-16 bg-[#0f1923] border-b border-white/5 flex items-center justify-between px-6 flex-shrink-0">
      <h1 className="text-white font-semibold text-lg">{title}</h1>

      <div className="flex items-center gap-4">
        <div className="relative" ref={ref}>
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input type="text" value={query} onChange={e => { setQuery(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)} placeholder="Buscar..."
            className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-8 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 w-52" />
          {query && <button onClick={() => { setQuery(''); setOpen(false) }} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"><X size={14} /></button>}
          {open && results.length > 0 && (
            <div className="absolute top-full mt-2 w-full bg-[#0f1923] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
              {results.map((r, i) => (
                <button key={i} onClick={() => { router.push(r.href); setQuery(''); setOpen(false) }}
                  className="w-full flex items-start px-4 py-3 hover:bg-white/5 transition-colors text-left">
                  <span className="text-white text-sm">{r.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button className="relative text-slate-400 hover:text-white transition-colors">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full" />
        </button>

        <div className="relative" ref={userRef}>
          <button onClick={() => setUserMenu(!userMenu)}
            className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm uppercase">
            {userName.charAt(0)}
          </button>
          {userMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-[#0f1923] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-white/5">
                <p className="text-white text-sm font-medium truncate">{userName}</p>
              </div>
              <button onClick={logout} className="w-full flex items-center gap-2 px-4 py-3 text-red-400 hover:bg-white/5 text-sm transition-colors">
                <LogOut size={16} /> Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
