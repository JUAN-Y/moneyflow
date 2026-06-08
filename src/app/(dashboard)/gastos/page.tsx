'use client'

import { useState } from 'react'
import { Upload, Plus, FileText, Image } from 'lucide-react'

const CATEGORIES = ['Comida', 'Transporte', 'Entretenimiento', 'Salud', 'Ropa', 'Educación', 'Servicios', 'Otros']

type Transaction = {
  date: string
  amount: number
  type: string
  merchant: string
  description: string
  payment_method: string
  category?: string
}

export default function GastosPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  async function processFile(file: File) {
    setLoading(true)
    const form = new FormData()
    form.append('file', file)
    try {
      const res = await fetch('/api/ocr', { method: 'POST', body: form })
      const data = await res.json()
      if (data.transactions) setTransactions(prev => [...data.transactions, ...prev])
    } finally {
      setLoading(false)
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  return (
    <div className="space-y-6">
      {/* Upload zone */}
      <div
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${
          dragOver ? 'border-emerald-400 bg-emerald-500/5' : 'border-white/10 hover:border-white/20'
        }`}
      >
        <div className="flex justify-center gap-4 mb-3">
          <FileText size={32} className="text-slate-500" />
          <Image size={32} className="text-slate-500" />
        </div>
        <p className="text-white font-medium mb-1">Arrastra tu estado de cuenta aquí</p>
        <p className="text-slate-500 text-sm mb-4">PDF o captura de pantalla del banco (Banco Popular, BHD, Banreservas...)</p>
        <label className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm cursor-pointer transition-colors">
          <Upload size={16} />
          Seleccionar archivo
          <input
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
          />
        </label>
      </div>

      {loading && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center">
          <p className="text-emerald-400 text-sm animate-pulse">Analizando documento con IA...</p>
        </div>
      )}

      {/* Transactions list */}
      {transactions.length > 0 && (
        <div className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <h3 className="text-white font-medium">{transactions.length} transacciones encontradas</h3>
            <button className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-sm transition-colors">
              <Plus size={14} />
              Guardar todas
            </button>
          </div>
          <div className="divide-y divide-white/5">
            {transactions.map((t, i) => (
              <div key={i} className="flex items-center justify-between p-4 hover:bg-white/5">
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{t.merchant || t.description}</p>
                  <p className="text-slate-500 text-xs">{t.date} · {t.payment_method}</p>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    defaultValue={t.category || 'Otros'}
                    className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <span className={`text-sm font-semibold ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {t.type === 'income' ? '+' : '-'}RD$ {t.amount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {transactions.length === 0 && !loading && (
        <div className="text-center text-slate-500 text-sm py-8">
          Sube un estado de cuenta para ver tus gastos aquí
        </div>
      )}
    </div>
  )
}
