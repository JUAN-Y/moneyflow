'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Target, X, Trash2, PlusCircle } from 'lucide-react'

type Goal = { id: string; name: string; target_amount: number; current_amount: number; deadline: string }

export default function MetasPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [showForm, setShowForm] = useState(false)
  const [showContrib, setShowContrib] = useState<string | null>(null)
  const [contribAmount, setContribAmount] = useState('')
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [target, setTarget] = useState('')
  const [current, setCurrent] = useState('')
  const [deadline, setDeadline] = useState('')
  const supabase = createClient()

  useEffect(() => {
    supabase.from('goals').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setGoals(data) })
  }, [])

  async function addGoal(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('goals').insert({
      user_id: user!.id,
      name,
      target_amount: parseFloat(target),
      current_amount: parseFloat(current || '0'),
      deadline: deadline || null,
    }).select().single()
    if (data) setGoals(prev => [data, ...prev])
    setName(''); setTarget(''); setCurrent(''); setDeadline(''); setShowForm(false); setSaving(false)
  }

  async function addContrib(id: string) {
    const goal = goals.find(g => g.id === id)
    if (!goal) return
    const newAmount = Number(goal.current_amount) + parseFloat(contribAmount)
    const { data } = await supabase.from('goals').update({ current_amount: newAmount }).eq('id', id).select().single()
    if (data) setGoals(prev => prev.map(g => g.id === id ? data : g))
    setShowContrib(null); setContribAmount('')
  }

  async function deleteGoal(id: string) {
    await supabase.from('goals').delete().eq('id', id)
    setGoals(prev => prev.filter(g => g.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-slate-400 text-sm">{goals.length} meta{goals.length !== 1 ? 's' : ''} activa{goals.length !== 1 ? 's' : ''}</p>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-sm transition-colors">
          <Plus size={14} /> Nueva meta
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {goals.map(g => {
          const pct = Math.min(Math.round((Number(g.current_amount) / Number(g.target_amount)) * 100), 100)
          const remaining = Number(g.target_amount) - Number(g.current_amount)
          return (
            <div key={g.id} className="bg-white/5 border border-white/5 rounded-2xl p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                    <Target size={16} className="text-emerald-400" />
                  </div>
                  <p className="text-white font-medium text-sm">{g.name}</p>
                </div>
                <button onClick={() => deleteGoal(g.id)} className="text-slate-600 hover:text-red-400 flex-shrink-0"><Trash2 size={14} /></button>
              </div>

              <p className="text-white text-xl font-bold mb-0.5">RD$ {Number(g.current_amount).toLocaleString('es-DO')}</p>
              <p className="text-slate-500 text-xs mb-3">
                de RD$ {Number(g.target_amount).toLocaleString('es-DO')} · faltan RD$ {remaining.toLocaleString('es-DO')}
              </p>

              <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                <div className={`h-2 rounded-full transition-all ${pct >= 100 ? 'bg-emerald-400' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
              </div>
              <div className="flex justify-between text-xs mb-3">
                <span className="text-emerald-400 font-medium">{pct}%</span>
                {g.deadline && <span className="text-slate-500">Meta: {new Date(g.deadline).toLocaleDateString('es-DO', { month: 'short', year: 'numeric' })}</span>}
              </div>

              {showContrib === g.id ? (
                <div className="flex gap-2">
                  <input type="number" value={contribAmount} onChange={e => setContribAmount(e.target.value)}
                    placeholder="Monto a agregar"
                    className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500" />
                  <button onClick={() => addContrib(g.id)} className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-sm"><Check14 /></button>
                  <button onClick={() => setShowContrib(null)} className="text-slate-500 hover:text-white px-2"><X size={14} /></button>
                </div>
              ) : (
                <button onClick={() => setShowContrib(g.id)} className="w-full flex items-center justify-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg py-1.5 text-xs transition-colors">
                  <PlusCircle size={13} /> Agregar fondos
                </button>
              )}
            </div>
          )
        })}

        <button onClick={() => setShowForm(true)} className="bg-white/5 border-2 border-dashed border-white/10 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-colors text-slate-500 hover:text-emerald-400 min-h-[200px]">
          <Plus size={24} />
          <span className="text-sm">Nueva meta</span>
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f1923] border border-white/10 rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Nueva meta</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white"><X size={18} /></button>
            </div>
            <form onSubmit={addGoal} className="space-y-3">
              <input value={name} onChange={e => setName(e.target.value)} required placeholder="Nombre (ej: Fondo de emergencia)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500" />
              <input type="number" value={target} onChange={e => setTarget(e.target.value)} required placeholder="Monto objetivo (RD$)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500" />
              <input type="number" value={current} onChange={e => setCurrent(e.target.value)} placeholder="Monto actual (RD$, opcional)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500" />
              <div>
                <label className="text-slate-400 text-xs mb-1 block">Fecha límite</label>
                <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" />
              </div>
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

function Check14() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
}
