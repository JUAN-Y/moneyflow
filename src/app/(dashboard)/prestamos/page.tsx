'use client'

import { useState } from 'react'
import { Plus, HandCoins } from 'lucide-react'

const DEMO = [
  { id: '1', name: 'Préstamo Banco Popular', total_amount: 500000, remaining_amount: 320000, monthly_payment: 15000, due_date: '2028-01-01', type: 'loan' },
  { id: '2', name: 'Préstamo Personal BHD', total_amount: 200000, remaining_amount: 145000, monthly_payment: 8500, due_date: '2027-06-01', type: 'loan' },
]

export default function PrestamosPage() {
  const [items] = useState(DEMO)
  const total = items.reduce((s, i) => s + i.remaining_amount, 0)

  return (
    <div className="space-y-6">
      <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-5 flex items-center gap-4">
        <HandCoins size={24} className="text-orange-400 flex-shrink-0" />
        <div>
          <p className="text-slate-400 text-sm">Total préstamos pendientes</p>
          <p className="text-white text-2xl font-bold">RD$ {total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      <div className="space-y-3">
        {items.map(p => {
          const pct = Math.round(((p.total_amount - p.remaining_amount) / p.total_amount) * 100)
          return (
            <div key={p.id} className="bg-white/5 border border-white/5 rounded-2xl p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-white font-medium">{p.name}</p>
                  <p className="text-slate-500 text-xs mt-0.5">Pago mensual: RD$ {p.monthly_payment.toLocaleString('es-DO')}</p>
                </div>
                <span className="text-orange-400 font-semibold text-sm">RD$ {p.remaining_amount.toLocaleString('es-DO')}</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1.5 mb-1">
                <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-slate-500 text-xs">{pct}% pagado</p>
            </div>
          )
        })}
        <button className="w-full bg-white/5 border-2 border-dashed border-white/10 rounded-2xl p-4 flex items-center justify-center gap-2 text-slate-500 hover:text-emerald-400 hover:border-emerald-500/40 transition-colors text-sm">
          <Plus size={18} /> Registrar nuevo préstamo
        </button>
      </div>
    </div>
  )
}
