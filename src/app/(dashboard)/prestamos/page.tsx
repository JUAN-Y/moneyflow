'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, HandCoins, X } from 'lucide-react'

type Loan = { id: string; name: string; total_amount: number; remaining_amount: number; monthly_payment: number; due_date: string; type: string }

export default function PrestamosPage() {
  const [items, setItems] = useState<Loan[]>([])
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [total, setTotal] = useState('')
  const [remaining, setRemaining] = useState('')
  const [monthly, setMonthly] = useState('')
  const [dueDate, setDueDate] = useState('')
  const supabase = createClient()

  useEffect(() => {
    supabase.from('debts').select('*').eq('type', 'loan').order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setItems(data) })
  }, [])

  const totalPending = items.reduce((s, i) => s + Number(i.remaining_amount), 0)

  async function addLoan(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('debts').insert({
      user_id: user!.id,
      name,
      type: 'loan',
      total_amount: parseFloat(total),
      remaining_amount: parseFloat(remaining || total),
      monthly_payment: parseFloat(monthly || '0'),
      due_date: dueDate || null,
    }).select().single()
    if (data) setItems(prev => [data, ...prev])
    setName(''); setTotal(''); setRemaining(''); setMonthly(''); setDueDate(''); setShowForm(false); setSaving(false)
  }

  return (
    <div className="space-y-6">
      <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <HandCoins size={24} className="text-orange-400 flex-shrink-0" />
          <div>
            <p className="text-slate-400 text-sm">Total préstamos pendientes</p>
            <p className="text-white text-2xl font-bold">RD$ {totalPending.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg text-sm transition-colors">
          <Plus size={14} /> Agregar
        </button>
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="bg-white/5 border border-white/5 rounded-2xl p-8 text-center text-slate-500 text-sm">No tienes préstamos registrados.</div>
        ) : items.map(p => {
          const pct = Math.round(((Number(p.total_amount) - Number(p.remaining_amount)) / Number(p.total_amount)) * 100)
          const badge = pct >= 75 ? { label: 'Casi pagado', color: 'emerald' } : pct >= 40 ? { label: 'En progreso', color: 'yellow' } : { label: 'Activo', color: 'orange' }
          return (
            <div key={p.id} className="bg-white/5 border border-white/5 rounded-2xl p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-white font-medium">{p.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full bg-${badge.color}-500/10 text-${badge.color}-400`}>{badge.label}</span>
                  </div>
                  <p className="text-slate-500 text-xs">
                    Pago mensual: RD$ {Number(p.monthly_payment).toLocaleString('es-DO')}
                    {p.due_date && ` · Vence: ${new Date(p.due_date).toLocaleDateString('es-DO', { month: 'short', year: 'numeric' })}`}
                  </p>
                </div>
                <span className="text-orange-400 font-semibold text-sm">RD$ {Number(p.remaining_amount).toLocaleString('es-DO')}</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1.5 mb-1">
                <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-slate-500 text-xs">{pct}% pagado · Total: RD$ {Number(p.total_amount).toLocaleString('es-DO')}</p>
            </div>
          )
        })}

        <button onClick={() => setShowForm(true)} className="w-full bg-white/5 border-2 border-dashed border-white/10 rounded-2xl p-4 flex items-center justify-center gap-2 text-slate-500 hover:text-emerald-400 hover:border-emerald-500/40 transition-colors text-sm">
          <Plus size={18} /> Registrar nuevo préstamo
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f1923] border border-white/10 rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Nuevo préstamo</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={addLoan} className="space-y-3">
              <input value={name} onChange={e => setName(e.target.value)} required placeholder="Nombre (ej: Préstamo Banco Popular)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500" />
              <input type="number" value={total} onChange={e => setTotal(e.target.value)} required placeholder="Monto total (RD$)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500" />
              <input type="number" value={remaining} onChange={e => setRemaining(e.target.value)} placeholder="Monto pendiente (RD$, opcional)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500" />
              <input type="number" value={monthly} onChange={e => setMonthly(e.target.value)} placeholder="Pago mensual (RD$)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500" />
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" />
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
