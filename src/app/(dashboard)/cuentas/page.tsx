'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Landmark, Wallet } from 'lucide-react'

type Account = { id: string; name: string; bank: string; balance: number; type: string }

export default function CuentasPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [bank, setBank] = useState('')
  const [balance, setBalance] = useState('')
  const [type, setType] = useState('checking')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.from('accounts').select('*').order('created_at').then(({ data }) => {
      if (data) setAccounts(data)
    })
  }, [])

  const total = accounts.reduce((s, a) => s + Number(a.balance), 0)

  async function addAccount(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('accounts').insert({
      user_id: user!.id, name, bank, balance: parseFloat(balance), type
    }).select().single()
    if (data) setAccounts(prev => [...prev, data])
    setName(''); setBank(''); setBalance(''); setShowForm(false); setSaving(false)
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-900/20 border border-emerald-500/20 rounded-2xl p-6">
        <p className="text-slate-400 text-sm mb-1">Balance Total Consolidado</p>
        <p className="text-white text-4xl font-bold">RD$ {total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</p>
        <p className="text-emerald-400 text-sm mt-1">{accounts.length} cuenta{accounts.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {accounts.map(acc => (
          <div key={acc.id} className="bg-white/5 border border-white/5 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                {acc.type === 'cash' ? <Wallet size={18} className="text-emerald-400" /> : <Landmark size={18} className="text-emerald-400" />}
              </div>
              <div>
                <p className="text-white text-sm font-medium">{acc.name}</p>
                <p className="text-slate-500 text-xs">{acc.bank}</p>
              </div>
            </div>
            <p className="text-white text-xl font-bold">RD$ {Number(acc.balance).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</p>
          </div>
        ))}

        <button onClick={() => setShowForm(true)}
          className="bg-white/5 border-2 border-dashed border-white/10 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-colors text-slate-500 hover:text-emerald-400">
          <Plus size={24} />
          <span className="text-sm">Agregar cuenta</span>
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f1923] border border-white/10 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-white font-semibold mb-4">Nueva cuenta</h3>
            <form onSubmit={addAccount} className="space-y-3">
              <input value={name} onChange={e => setName(e.target.value)} required placeholder="Nombre (ej: Cuenta Corriente)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500" />
              <input value={bank} onChange={e => setBank(e.target.value)} required placeholder="Banco (ej: Banco Popular)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500" />
              <input type="number" value={balance} onChange={e => setBalance(e.target.value)} required placeholder="Balance actual en RD$"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500" />
              <select value={type} onChange={e => setType(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500">
                <option value="checking">Cuenta Corriente</option>
                <option value="savings">Cuenta de Ahorros</option>
                <option value="cash">Efectivo</option>
              </select>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white rounded-xl py-2.5 text-sm transition-colors">Cancelar</button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-medium transition-colors">
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
