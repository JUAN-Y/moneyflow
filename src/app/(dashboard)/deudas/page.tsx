'use client'

import { useState } from 'react'
import { Plus, AlertCircle } from 'lucide-react'

const DEMO_DEBTS = [
  { id: '1', name: 'Préstamo Personal BHD', total_amount: 200000, remaining_amount: 145000, monthly_payment: 8500, due_date: '2027-06-01', type: 'loan' },
  { id: '2', name: 'Tarjeta de Crédito Popular', total_amount: 50000, remaining_amount: 32000, monthly_payment: 5000, due_date: '2026-07-15', type: 'credit_card' },
]

export default function DeudasPage() {
  const [debts] = useState(DEMO_DEBTS)
  const totalDebt = debts.reduce((sum, d) => sum + d.remaining_amount, 0)

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 flex items-center gap-4">
        <AlertCircle size={24} className="text-red-400 flex-shrink-0" />
        <div>
          <p className="text-slate-400 text-sm">Total deudas pendientes</p>
          <p className="text-white text-2xl font-bold">
            RD$ {totalDebt.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Debts list */}
      <div className="space-y-3">
        {debts.map((d) => {
          const pct = Math.round(((d.total_amount - d.remaining_amount) / d.total_amount) * 100)
          return (
            <div key={d.id} className="bg-white/5 border border-white/5 rounded-2xl p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-white font-medium">{d.name}</p>
                  <p className="text-slate-500 text-xs mt-0.5">Pago mensual: RD$ {d.monthly_payment.toLocaleString('es-DO')}</p>
                </div>
                <span className="text-red-400 font-semibold text-sm">
                  RD$ {d.remaining_amount.toLocaleString('es-DO')}
                </span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1.5 mb-1">
                <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-slate-500 text-xs">{pct}% pagado</p>
            </div>
          )
        })}

        <button className="w-full bg-white/5 border-2 border-dashed border-white/10 rounded-2xl p-4 flex items-center justify-center gap-2 text-slate-500 hover:text-emerald-400 hover:border-emerald-500/40 transition-colors text-sm">
          <Plus size={18} />
          Registrar nueva deuda
        </button>
      </div>
    </div>
  )
}
