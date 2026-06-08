'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Pencil, Check, X, Trash2 } from 'lucide-react'

const CATEGORIES = ['Comida', 'Transporte', 'Entretenimiento', 'Salud', 'Ropa', 'Educación', 'Servicios', 'Vivienda', 'Tecnología', 'Otros']

type Budget = { id: string; category: string; limit_amount: number; period: string }
type Spending = Record<string, number>

export default function PresupuestoPage() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [spending, setSpending] = useState<Spending>({})
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [category, setCategory] = useState('Comida')
  const [limit, setLimit] = useState('')
  const [period, setPeriod] = useState<'monthly' | 'weekly' | 'daily'>('monthly')
  const supabase = createClient()

  useEffect(() => {
    const now = new Date()
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    supabase.from('budgets').select('*').order('category')
      .then(({ data }) => { if (data) setBudgets(data) })
    supabase.from('transactions').select('category,amount').eq('type', 'expense').gte('date', `${month}-01`)
      .then(({ data }) => {
        if (data) {
          const s: Spending = {}
          data.forEach(t => { s[t.category] = (s[t.category] || 0) + Number(t.amount) })
          setSpending(s)
        }
      })
  }, [])

  async function addBudget(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('budgets').insert({
      user_id: user!.id, category, limit_amount: parseFloat(limit), period
    }).select().single()
    if (data) setBudgets(prev => [...prev, data])
    setCategory('Comida'); setLimit(''); setShowForm(false); setSaving(false)
  }

  async function saveEdit(id: string) {
    const { data } = await supabase.from('budgets').update({ limit_amount: parseFloat(editValue) }).eq('id', id).select().single()
    if (data) setBudgets(prev => prev.map(b => b.id === id ? data : b))
    setEditId(null)
  }

  async function deleteBudget(id: string) {
    await supabase.from('budgets').delete().eq('id', id)
    setBudgets(prev => prev.filter(b => b.id !== id))
  }

  const now = new Date()
  const periodLabel = { monthly: 'mes', weekly: 'semana', daily: 'día' }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white font-semibold">Presupuesto</p>
          <p className="text-slate-400 text-sm">{now.toLocaleDateString('es-DO', { month: 'long', year: 'numeric' })}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-sm transition-colors">
          <Plus size={14} /> Nueva categoría
        </button>
      </div>

      <div className="space-y-3">
        {budgets.length === 0 ? (
          <div className="bg-white/5 border border-white/5 rounded-2xl p-8 text-center text-slate-500 text-sm">
            No tienes presupuestos. <button onClick={() => setShowForm(true)} className="text-emerald-400 hover:underline">Crear uno</button>
          </div>
        ) : budgets.map(b => {
          const spent = spending[b.category] || 0
          const pct = Math.min(Math.round((spent / b.limit_amount) * 100), 100)
          const over = spent > b.limit_amount
          return (
            <div key={b.id} className="bg-white/5 border border-white/5 rounded-2xl p-5">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <p className="text-white font-medium">{b.category}</p>
                  <span className="text-xs text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">por {periodLabel[b.period as keyof typeof periodLabel] || 'mes'}</span>
                </div>
                <div className="flex items-center gap-2">
                  {editId === b.id ? (
                    <>
                      <input type="number" value={editValue} onChange={e => setEditValue(e.target.value)}
                        className="w-28 bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-emerald-500" />
                      <button onClick={() => saveEdit(b.id)} className="text-emerald-400 hover:text-emerald-300"><Check size={16} /></button>
                      <button onClick={() => setEditId(null)} className="text-slate-500 hover:text-white"><X size={16} /></button>
                    </>
                  ) : (
                    <>
                      <span className={`text-sm font-semibold ${over ? 'text-red-400' : 'text-slate-300'}`}>
                        RD$ {spent.toLocaleString('es-DO')} / {Number(b.limit_amount).toLocaleString('es-DO')}
                      </span>
                      <button onClick={() => { setEditId(b.id); setEditValue(String(b.limit_amount)) }} className="text-slate-500 hover:text-white"><Pencil size={14} /></button>
                      <button onClick={() => deleteBudget(b.id)} className="text-slate-500 hover:text-red-400"><Trash2 size={14} /></button>
                    </>
                  )}
                </div>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2 mb-1">
                <div className={`h-2 rounded-full transition-all ${over ? 'bg-red-500' : pct > 70 ? 'bg-yellow-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
              </div>
              <p className={`text-xs ${over ? 'text-red-400' : 'text-slate-500'}`}>
                {over ? `Excediste por RD$ ${(spent - Number(b.limit_amount)).toLocaleString('es-DO')}` : `${pct}% usado · disponible RD$ ${(Number(b.limit_amount) - spent).toLocaleString('es-DO')}`}
              </p>
            </div>
          )
        })}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f1923] border border-white/10 rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Nueva categoría</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={addBudget} className="space-y-3">
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input type="number" value={limit} onChange={e => setLimit(e.target.value)} required placeholder="Límite (RD$)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500" />
              <select value={period} onChange={e => setPeriod(e.target.value as 'monthly' | 'weekly' | 'daily')}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500">
                <option value="monthly">Mensual</option>
                <option value="weekly">Semanal</option>
                <option value="daily">Diario</option>
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
