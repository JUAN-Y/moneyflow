'use client'

import { useState } from 'react'
import { Plus, TrendingUp } from 'lucide-react'

const DEMO = [
  { id: '1', description: 'Salario', amount: 95000, date: '2026-06-01', category: 'Salario', payment_method: 'transfer' },
  { id: '2', description: 'Freelance diseño', amount: 25000, date: '2026-06-05', category: 'Freelance', payment_method: 'transfer' },
  { id: '3', description: 'Bono trimestral', amount: 15000, date: '2026-06-10', category: 'Bonos', payment_method: 'transfer' },
]

export default function IngresosPage() {
  const [items] = useState(DEMO)
  const total = items.reduce((s, i) => s + i.amount, 0)

  return (
    <div className="space-y-6">
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 flex items-center gap-4">
        <TrendingUp size={24} className="text-emerald-400 flex-shrink-0" />
        <div>
          <p className="text-slate-400 text-sm">Total ingresos del mes</p>
          <p className="text-white text-2xl font-bold">RD$ {total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <h3 className="text-white font-medium">Ingresos del mes</h3>
          <button className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-sm transition-colors">
            <Plus size={14} /> Agregar
          </button>
        </div>
        <div className="divide-y divide-white/5">
          {items.map(i => (
            <div key={i.id} className="flex items-center justify-between p-4 hover:bg-white/5">
              <div>
                <p className="text-white text-sm font-medium">{i.description}</p>
                <p className="text-slate-500 text-xs">{i.date} · {i.category}</p>
              </div>
              <span className="text-emerald-400 font-semibold text-sm">
                +RD$ {i.amount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
