'use client'

const DEMO = [
  { id: '1', merchant: 'Supermercado La Sirena', amount: 3850, type: 'expense', category: 'Comida', date: '2026-06-07', payment_method: 'card' },
  { id: '2', merchant: 'Salario', amount: 95000, type: 'income', category: 'Salario', date: '2026-06-01', payment_method: 'transfer' },
  { id: '3', merchant: 'Uber', amount: 450, type: 'expense', category: 'Transporte', date: '2026-06-06', payment_method: 'card' },
  { id: '4', merchant: 'Netflix', amount: 850, type: 'expense', category: 'Entretenimiento', date: '2026-06-05', payment_method: 'card' },
  { id: '5', merchant: 'Farmacia Carol', amount: 1200, type: 'expense', category: 'Salud', date: '2026-06-04', payment_method: 'cash' },
  { id: '6', merchant: 'Freelance diseño', amount: 25000, type: 'income', category: 'Freelance', date: '2026-06-05', payment_method: 'transfer' },
  { id: '7', merchant: 'Pizarelli', amount: 1650, type: 'expense', category: 'Comida', date: '2026-06-03', payment_method: 'card' },
  { id: '8', merchant: 'Claro', amount: 2100, type: 'expense', category: 'Servicios', date: '2026-06-02', payment_method: 'card' },
]

export default function HistorialPage() {
  return (
    <div className="space-y-4">
      <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <h3 className="text-white font-medium">Todas las transacciones</h3>
        </div>
        <div className="divide-y divide-white/5">
          {DEMO.map(t => (
            <div key={t.id} className="flex items-center justify-between p-4 hover:bg-white/5">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${t.type === 'income' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                <div>
                  <p className="text-white text-sm font-medium">{t.merchant}</p>
                  <p className="text-slate-500 text-xs">{t.date} · {t.category} · {t.payment_method}</p>
                </div>
              </div>
              <span className={`text-sm font-semibold ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                {t.type === 'income' ? '+' : '-'}RD$ {t.amount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
