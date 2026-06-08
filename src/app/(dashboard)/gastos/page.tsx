'use client'

import { useState } from 'react'
import { Upload, FileText, Image, Plus, TrendingDown } from 'lucide-react'

const CATEGORIES = ['Comida', 'Transporte', 'Entretenimiento', 'Salud', 'Ropa', 'Educación', 'Servicios', 'Otros']

const DEMO_EXPENSES = [
  { id: '1', merchant: 'Supermercado La Sirena', amount: 3850, category: 'Comida', date: '2026-06-07', payment_method: 'card', source: 'manual' },
  { id: '2', merchant: 'Uber', amount: 450, category: 'Transporte', date: '2026-06-06', payment_method: 'card', source: 'manual' },
  { id: '3', merchant: 'Netflix', amount: 850, category: 'Entretenimiento', date: '2026-06-05', payment_method: 'card', source: 'manual' },
  { id: '4', merchant: 'Farmacia Carol', amount: 1200, category: 'Salud', date: '2026-06-04', payment_method: 'cash', source: 'manual' },
  { id: '5', merchant: 'Pizarelli', amount: 1650, category: 'Comida', date: '2026-06-03', payment_method: 'card', source: 'manual' },
  { id: '6', merchant: 'Claro', amount: 2100, category: 'Servicios', date: '2026-06-02', payment_method: 'card', source: 'manual' },
]

type OcrTransaction = {
  date: string; amount: number; type: string
  merchant: string; description: string; payment_method: string; category?: string
}

export default function GastosPage() {
  const [tab, setTab] = useState<'lista' | 'importar'>('lista')
  const [expenses, setExpenses] = useState(DEMO_EXPENSES)
  const [ocrResults, setOcrResults] = useState<OcrTransaction[]>([])
  const [loading, setLoading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const total = expenses.reduce((s, e) => s + e.amount, 0)

  async function processFile(file: File) {
    setLoading(true)
    setOcrResults([])
    const form = new FormData()
    form.append('file', file)
    try {
      const res = await fetch('/api/ocr', { method: 'POST', body: form })
      const data = await res.json()
      if (data.transactions) setOcrResults(data.transactions)
    } catch {
      alert('Error procesando el archivo. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  function saveAll() {
    const toAdd = ocrResults
      .filter(t => t.type === 'expense')
      .map((t, i) => ({
        id: `ocr-${Date.now()}-${i}`,
        merchant: t.merchant || t.description,
        amount: t.amount,
        category: t.category || 'Otros',
        date: t.date,
        payment_method: t.payment_method,
        source: 'ocr_image',
      }))
    setExpenses(prev => [...toAdd, ...prev])
    setOcrResults([])
    setTab('lista')
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab('lista')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'lista' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          Mis Gastos
        </button>
        <button
          onClick={() => setTab('importar')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${tab === 'importar' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          <Upload size={14} /> Importar
        </button>
      </div>

      {/* LISTA TAB */}
      {tab === 'lista' && (
        <>
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <TrendingDown size={24} className="text-red-400 flex-shrink-0" />
              <div>
                <p className="text-slate-400 text-sm">Total gastos del mes</p>
                <p className="text-white text-2xl font-bold">RD$ {total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
            <button className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-sm transition-colors">
              <Plus size={14} /> Agregar gasto
            </button>
          </div>

          <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
            <div className="divide-y divide-white/5">
              {expenses.map(e => (
                <div key={e.id} className="flex items-center justify-between p-4 hover:bg-white/5">
                  <div>
                    <p className="text-white text-sm font-medium">{e.merchant}</p>
                    <p className="text-slate-500 text-xs">{e.date} · {e.category} · {e.payment_method}</p>
                  </div>
                  <span className="text-red-400 font-semibold text-sm">
                    -RD$ {e.amount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* IMPORTAR TAB */}
      {tab === 'importar' && (
        <>
          <div
            onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) processFile(f) }}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            className={`border-2 border-dashed rounded-2xl p-10 text-center transition-colors ${dragOver ? 'border-emerald-400 bg-emerald-500/5' : 'border-white/10 hover:border-white/20'}`}
          >
            <div className="flex justify-center gap-4 mb-3">
              <FileText size={32} className="text-slate-500" />
              <Image size={32} className="text-slate-500" />
            </div>
            <p className="text-white font-medium mb-1">Arrastra tu estado de cuenta aquí</p>
            <p className="text-slate-500 text-sm mb-4">PDF o captura del banco (Banco Popular, BHD, Banreservas...)</p>
            <label className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm cursor-pointer transition-colors">
              <Upload size={16} /> Seleccionar archivo
              <input type="file" accept="image/*,.pdf" className="hidden"
                onChange={e => e.target.files?.[0] && processFile(e.target.files[0])} />
            </label>
          </div>

          {loading && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center">
              <p className="text-emerald-400 text-sm animate-pulse">Analizando documento con IA...</p>
            </div>
          )}

          {ocrResults.length > 0 && (
            <div className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-white/5">
                <p className="text-white font-medium">{ocrResults.length} transacciones encontradas</p>
                <button onClick={saveAll} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-sm transition-colors">
                  <Plus size={14} /> Guardar todas
                </button>
              </div>
              <div className="divide-y divide-white/5">
                {ocrResults.map((t, i) => (
                  <div key={i} className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-white text-sm font-medium">{t.merchant || t.description}</p>
                      <p className="text-slate-500 text-xs">{t.date} · {t.payment_method}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <select defaultValue={t.category || 'Otros'}
                        className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none">
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
        </>
      )}
    </div>
  )
}
