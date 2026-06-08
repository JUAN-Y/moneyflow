'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, TrendingUp, X } from 'lucide-react'

const CATEGORIES = ['Salario', 'Freelance', 'Bonos', 'Inversiones', 'Alquiler', 'Ventas', 'Otros']

type Income = { id: string; merchant: string; amount: number; category: string; date: string; payment_method: string; description: string }

export default function IngresosPage() {
  const [items, setItems] = useState<Income[]>([])
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [desc, setDesc] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Salario')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [method, setMethod] = useState('transfer')
  const supabase = createClient()

  useEffect(() => {
    const now = new Date()
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    supabase.from('transactions').select('*')
      .eq('type', 'income')
      .gte('date', `${month}-01`)
      .order('date', { ascending: false })
      .then(({ data }) => { if (data) setItems(data) })
  }, [])

  const total = items.reduce((s, i) => s + Number(i.amount), 0)

  async function addIncome(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('transactions').insert({
      user_id: user!.id,
      type: 'income',
      merchant: desc,
      description: desc,
      amount: parseFloat(amount),
      category,
      date,
      payment_method: method,
      source: 'manual',
    }).select().single()
    if (data) setItems(prev => [data, ...prev])
    setDesc(''); setAmount(''); setShowForm(false); setSaving(false)
  }

  return (
    <div className="space-y-6">
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <TrendingUp size={24} className="text-emerald-400 flex-shrink-0" />
          <div>
            <p className="text-slate-400 text-sm">Total ingresos del mes</p>
            <p className="text-white text-2xl font-bold">RD$ {total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-sm transition-colors">
          <Plus size={14} /> Agregar
        </button>
      </div>

      <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
        {items.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No hay ingresos este mes. <button onClick={() => setShowForm(true)} className="text-emerald-400 hover:underline">Agregar ingreso</button>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {items.map(i => (
              <div key={i.id} className="flex items-center justify-between p-4 hover:bg-white/5">
                <div>
                  <p className="text-white text-sm font-medium">{i.merchant || i.description}</p>
                  <p className="text-slate-500 text-xs">{i.date} · {i.category} · {i.payment_method}</p>
                </div>
                <span className="text-emerald-400 font-semibold text-sm">+RD$ {Number(i.amount).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f1923] border border-white/10 rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Nuevo ingreso</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={addIncome} className="space-y-3">
              <input value={desc} onChange={e => setDesc(e.target.value)} required placeholder="Descripción (ej: Salario junio)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500" />
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="Monto en RD$"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500" />
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" />
              <select value={method} onChange={e => setMethod(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500">
                <option value="transfer">Transferencia</option>
                <option value="cash">Efectivo</option>
                <option value="card">Tarjeta</option>
              </select>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-white rounded-xl py-2.5 text-sm transition-colors">Cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-medium transition-colors">
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
