'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Transaction = { id: string; merchant: string; amount: number; type: string; category: string; date: string; payment_method: string }

export default function HistorialPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const supabase = createClient()

  useEffect(() => {
    supabase.from('transactions').select('*').order('date', { ascending: false }).limit(100)
      .then(({ data }) => { if (data) setTransactions(data) })
  }, [])

  return (
    <div className="space-y-4">
      <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <h3 className="text-white font-medium">Todas las transacciones</h3>
        </div>
        {transactions.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No hay transacciones aún. Importa tu estado de cuenta en Gastos.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {transactions.map(t => (
              <div key={t.id} className="flex items-center justify-between p-4 hover:bg-white/5">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${t.type === 'income' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  <div>
                    <p className="text-white text-sm font-medium">{t.merchant}</p>
                    <p className="text-slate-500 text-xs">{t.date} · {t.category} · {t.payment_method}</p>
                  </div>
                </div>
                <span className={`text-sm font-semibold ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {t.type === 'income' ? '+' : '-'}RD$ {Number(t.amount).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
