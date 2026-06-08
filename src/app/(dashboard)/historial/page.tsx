'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Filter, Download } from 'lucide-react'

const CATEGORIES = ['Todas', 'Comida', 'Transporte', 'Entretenimiento', 'Salud', 'Ropa', 'Educación', 'Servicios', 'Salario', 'Freelance', 'Otros']
const TYPES = ['Todos', 'income', 'expense']

type Transaction = { id: string; merchant: string; amount: number; type: string; category: string; date: string; payment_method: string; description: string }

export default function HistorialPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filtered, setFiltered] = useState<Transaction[]>([])
  const [catFilter, setCatFilter] = useState('Todas')
  const [typeFilter, setTypeFilter] = useState('Todos')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.from('transactions').select('*').order('date', { ascending: false }).limit(200)
      .then(({ data }) => { if (data) { setTransactions(data); setFiltered(data) } })
  }, [])

  useEffect(() => {
    let r = [...transactions]
    if (catFilter !== 'Todas') r = r.filter(t => t.category === catFilter)
    if (typeFilter !== 'Todos') r = r.filter(t => t.type === typeFilter)
    if (dateFrom) r = r.filter(t => t.date >= dateFrom)
    if (dateTo) r = r.filter(t => t.date <= dateTo)
    setFiltered(r)
  }, [catFilter, typeFilter, dateFrom, dateTo, transactions])

  function exportCSV() {
    const rows = [['Fecha', 'Descripción', 'Categoría', 'Tipo', 'Método', 'Monto'], ...filtered.map(t => [t.date, t.merchant || t.description, t.category, t.type, t.payment_method, t.amount])]
    const csv = rows.map(r => r.join(',')).join('\n')
    const a = document.createElement('a')
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    a.download = `moneyflow-historial-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white/5 rounded-xl p-3 border border-white/5 text-center">
          <p className="text-slate-500 text-xs mb-0.5">Transacciones</p>
          <p className="text-white font-bold">{filtered.length}</p>
        </div>
        <div className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/10 text-center">
          <p className="text-slate-500 text-xs mb-0.5">Ingresos</p>
          <p className="text-emerald-400 font-bold text-sm">RD$ {totalIncome.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-red-500/10 rounded-xl p-3 border border-red-500/10 text-center">
          <p className="text-slate-500 text-xs mb-0.5">Gastos</p>
          <p className="text-red-400 font-bold text-sm">RD$ {totalExpense.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2">
        <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors border ${showFilters ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'}`}>
          <Filter size={14} /> Filtros
        </button>
        <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-colors">
          <Download size={14} /> Exportar CSV
        </button>
      </div>

      {showFilters && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-white/5 border border-white/5 rounded-xl">
          <div>
            <label className="text-slate-500 text-xs mb-1 block">Categoría</label>
            <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-slate-500 text-xs mb-1 block">Tipo</label>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500">
              {TYPES.map(t => <option key={t} value={t}>{t === 'Todos' ? 'Todos' : t === 'income' ? 'Ingresos' : 'Gastos'}</option>)}
            </select>
          </div>
          <div>
            <label className="text-slate-500 text-xs mb-1 block">Desde</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500" />
          </div>
          <div>
            <label className="text-slate-500 text-xs mb-1 block">Hasta</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500" />
          </div>
        </div>
      )}

      <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <h3 className="text-white font-medium">Todas las transacciones</h3>
        </div>
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No hay transacciones. Importa tu estado de cuenta en la sección Importar.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map(t => (
              <div key={t.id} className="flex items-center justify-between p-4 hover:bg-white/5">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${t.type === 'income' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  <div>
                    <p className="text-white text-sm font-medium">{t.merchant || t.description}</p>
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
