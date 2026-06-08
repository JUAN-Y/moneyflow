'use client'

import { useState } from 'react'
import { Plus, Landmark, Wallet } from 'lucide-react'

const DEMO_ACCOUNTS = [
  { id: '1', name: 'Cuenta Corriente', bank: 'Banco Popular', balance: 245000, type: 'checking' },
  { id: '2', name: 'Cuenta de Ahorros', bank: 'BHD León', balance: 180520.75, type: 'savings' },
  { id: '3', name: 'Cuenta Corriente', bank: 'Banreservas', balance: 62000, type: 'checking' },
  { id: '4', name: 'Efectivo', bank: 'Efectivo', balance: 15000, type: 'cash' },
]

export default function CuentasPage() {
  const [accounts] = useState(DEMO_ACCOUNTS)
  const total = accounts.reduce((sum, a) => sum + a.balance, 0)

  return (
    <div className="space-y-6">
      {/* Total */}
      <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-900/20 border border-emerald-500/20 rounded-2xl p-6">
        <p className="text-slate-400 text-sm mb-1">Balance Total Consolidado</p>
        <p className="text-white text-4xl font-bold">
          RD$ {total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
        </p>
        <p className="text-emerald-400 text-sm mt-1">{accounts.length} cuentas activas</p>
      </div>

      {/* Accounts grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {accounts.map((acc) => (
          <div key={acc.id} className="bg-white/5 border border-white/5 rounded-2xl p-5 hover:bg-white/8 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                {acc.type === 'cash' ? <Wallet size={18} className="text-emerald-400" /> : <Landmark size={18} className="text-emerald-400" />}
              </div>
              <div>
                <p className="text-white text-sm font-medium">{acc.name}</p>
                <p className="text-slate-500 text-xs">{acc.bank}</p>
              </div>
            </div>
            <p className="text-white text-xl font-bold">
              RD$ {acc.balance.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
            </p>
          </div>
        ))}

        {/* Add account */}
        <button className="bg-white/5 border-2 border-dashed border-white/10 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-colors text-slate-500 hover:text-emerald-400">
          <Plus size={24} />
          <span className="text-sm">Agregar cuenta</span>
        </button>
      </div>
    </div>
  )
}
