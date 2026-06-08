'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'

const DEMO = [
  { id: '1', category: 'Comida', limit_amount: 20000, spent: 23600 },
  { id: '2', category: 'Transporte', limit_amount: 8000, spent: 5200 },
  { id: '3', category: 'Entretenimiento', limit_amount: 10000, spent: 7800 },
  { id: '4', category: 'Servicios', limit_amount: 12000, spent: 11500 },
  { id: '5', category: 'Salud', limit_amount: 5000, spent: 1200 },
]

export default function PresupuestoPage() {
  const [budgets] = useState(DEMO)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-slate-400 text-sm">Junio 2026</p>
        <button className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-sm transition-colors">
          <Plus size={14} /> Nueva categoría
        </button>
      </div>

      <div className="space-y-3">
        {budgets.map(b => {
          const pct = Math.min(Math.round((b.spent / b.limit_amount) * 100), 100)
          const over = b.spent > b.limit_amount
          return (
            <div key={b.id} className="bg-white/5 border border-white/5 rounded-2xl p-5">
              <div className="flex justify-between items-center mb-3">
                <p className="text-white font-medium">{b.category}</p>
                <span className={`text-sm font-semibold ${over ? 'text-red-400' : 'text-slate-300'}`}>
                  RD$ {b.spent.toLocaleString('es-DO')} / {b.limit_amount.toLocaleString('es-DO')}
                </span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2 mb-1">
                <div className={`h-2 rounded-full transition-all ${over ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
              </div>
              <p className={`text-xs ${over ? 'text-red-400' : 'text-slate-500'}`}>
                {over ? `Excediste por RD$ ${(b.spent - b.limit_amount).toLocaleString('es-DO')}` : `${pct}% usado`}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
