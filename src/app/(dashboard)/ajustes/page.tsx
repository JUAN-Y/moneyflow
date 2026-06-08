'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Check } from 'lucide-react'

const THEMES = [
  { id: 'emerald', label: 'Esmeralda', color: '#10b981' },
  { id: 'blue', label: 'Azul', color: '#3b82f6' },
  { id: 'purple', label: 'Púrpura', color: '#8b5cf6' },
  { id: 'orange', label: 'Naranja', color: '#f97316' },
  { id: 'pink', label: 'Rosa', color: '#ec4899' },
]

const CURRENCIES = [
  { code: 'RD$', label: 'Peso Dominicano', rate: 1 },
  { code: 'USD', label: 'Dólar Americano', rate: 0.017 },
  { code: 'EUR', label: 'Euro', rate: 0.016 },
]

export default function AjustesPage() {
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [theme, setTheme] = useState('emerald')
  const [currency, setCurrency] = useState('RD$')
  const [saved, setSaved] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || '')
        setUserEmail(user.email || '')
      }
    })
  }, [])

  function saveSettings() {
    localStorage.setItem('mf_theme', theme)
    localStorage.setItem('mf_currency', currency)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Profile */}
      <div className="bg-white/5 border border-white/5 rounded-2xl p-5">
        <h3 className="text-white font-semibold mb-4">Perfil</h3>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-xl uppercase">
            {userName.charAt(0)}
          </div>
          <div>
            <p className="text-white font-medium">{userName}</p>
            <p className="text-slate-500 text-sm">{userEmail}</p>
          </div>
        </div>
      </div>

      {/* Theme */}
      <div className="bg-white/5 border border-white/5 rounded-2xl p-5">
        <h3 className="text-white font-semibold mb-4">Tema de color</h3>
        <div className="flex gap-3 flex-wrap">
          {THEMES.map(t => (
            <button key={t.id} onClick={() => setTheme(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm transition-all ${theme === t.id ? 'border-white/30 bg-white/10' : 'border-white/10 hover:border-white/20'}`}>
              <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: t.color }} />
              <span className="text-white">{t.label}</span>
              {theme === t.id && <Check size={14} className="text-emerald-400" />}
            </button>
          ))}
        </div>
      </div>

      {/* Currency */}
      <div className="bg-white/5 border border-white/5 rounded-2xl p-5">
        <h3 className="text-white font-semibold mb-4">Moneda principal</h3>
        <div className="space-y-2">
          {CURRENCIES.map(c => (
            <button key={c.code} onClick={() => setCurrency(c.code)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left ${currency === c.code ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-white/10 hover:border-white/20'}`}>
              <div>
                <span className="text-white font-medium">{c.code}</span>
                <span className="text-slate-400 text-sm ml-2">{c.label}</span>
              </div>
              {currency === c.code && <Check size={16} className="text-emerald-400" />}
            </button>
          ))}
        </div>
        <p className="text-slate-500 text-xs mt-3">Tasas de cambio aproximadas. 1 USD ≈ 58.5 RD$</p>
      </div>

      {/* App info */}
      <div className="bg-white/5 border border-white/5 rounded-2xl divide-y divide-white/5">
        <div className="p-5 flex items-center justify-between">
          <div>
            <p className="text-white text-sm font-medium">Seguridad</p>
            <p className="text-slate-500 text-xs">Datos protegidos con RLS de Supabase</p>
          </div>
          <span className="text-emerald-400 text-xs bg-emerald-500/10 px-2 py-1 rounded-full">Activo</span>
        </div>
        <div className="p-5 flex items-center justify-between">
          <p className="text-white text-sm">Versión</p>
          <span className="text-slate-500 text-sm">MoneyFlow DR v1.0.0</span>
        </div>
      </div>

      <button onClick={saveSettings} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors">
        {saved ? <><Check size={16} /> Guardado</> : 'Guardar cambios'}
      </button>
    </div>
  )
}
