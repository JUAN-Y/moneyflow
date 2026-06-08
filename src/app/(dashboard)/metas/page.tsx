'use client'

import { useState } from 'react'
import { Plus, Target } from 'lucide-react'

const DEMO_GOALS = [
  { id: '1', name: 'Fondo de emergencia', target_amount: 150000, current_amount: 85000, deadline: '2026-12-31' },
  { id: '2', name: 'Vacaciones Punta Cana', target_amount: 80000, current_amount: 32000, deadline: '2026-08-01' },
  { id: '3', name: 'MacBook Pro', target_amount: 120000, current_amount: 45000, deadline: '2027-01-01' },
]

export default function MetasPage() {
  const [goals] = useState(DEMO_GOALS)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {goals.map((g) => {
          const pct = Math.round((g.current_amount / g.target_amount) * 100)
          const remaining = g.target_amount - g.current_amount
          return (
            <div key={g.id} className="bg-white/5 border border-white/5 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Target size={16} className="text-emerald-400" />
                </div>
                <p className="text-white font-medium text-sm">{g.name}</p>
              </div>

              <p className="text-white text-xl font-bold mb-0.5">
                RD$ {g.current_amount.toLocaleString('es-DO')}
              </p>
              <p className="text-slate-500 text-xs mb-3">
                de RD$ {g.target_amount.toLocaleString('es-DO')} · faltan RD$ {remaining.toLocaleString('es-DO')}
              </p>

              <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-emerald-400">{pct}%</span>
                <span className="text-slate-500">Meta: {new Date(g.deadline).toLocaleDateString('es-DO', { month: 'short', year: 'numeric' })}</span>
              </div>
            </div>
          )
        })}

        <button className="bg-white/5 border-2 border-dashed border-white/10 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-colors text-slate-500 hover:text-emerald-400">
          <Plus size={24} />
          <span className="text-sm">Nueva meta</span>
        </button>
      </div>
    </div>
  )
}
