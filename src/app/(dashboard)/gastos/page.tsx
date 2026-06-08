'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, FileText, Image, Plus, TrendingDown } from 'lucide-react'

const CATEGORIES = ['Comida', 'Transporte', 'Entretenimiento', 'Salud', 'Ropa', 'Educación', 'Servicios', 'Otros']

type Expense = { id: string; merchant: string; amount: number; category: string; date: string; payment_method: string }
type OcrTx = { date: string; amount: number; type: string; merchant: string; description: string; payment_method: string; category?: string }

export default function GastosPage() {
  const [tab, setTab] = useState<'lista' | 'importar'>('lista')
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [ocrResults, setOcrResults] = useState<OcrTx[]>([])
  const [loading, setLoading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const now = new Date()
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    supabase.from('transactions').select('*')
      .eq('type', 'expense')
      .gte('date', `${month}-01`)
      .order('date', { ascending: false })
      .then(({ data }) => { if (data) setExpenses(data) })
  }, [])

  const total = expenses.reduce((s, e) => s + Number(e.amount), 0)

  async function processFile(file: File) {
    setLoading(true); setOcrResults([])
    const form = new FormData(); form.append('file', file)
    try {
      const res = await fetch('/api/ocr', { method: 'POST', body: form })
      const data = await res.json()
      if (data.transactions) setOcrResults(data.transactions)
    } catch { alert('Error procesando el archivo.') }
    finally { setLoading(false) }
  }

  async function saveAll() {
    const { data: { user } } = await supabase.auth.getUser()
    const rows = ocrResults.map(t => ({
      user_id: user!.id,
      amount: t.amount,
      type: t.type,
      category: t.category || 'Otros',
      merchant: t.merchant || t.description,
      description: t.description,
      date: t.date,
      payment_method: t.payment_method || 'card',
      source: 'ocr_image',
    }))
    const { data } = await supabase.from('transactions').insert(rows).select()
    if (data) {
      const newExpenses = data.filter(t => t.type === 'expense')
      setExpenses(prev => [...newExpenses, ...prev])
    }
    setOcrResults([]); setTab('lista')
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-1 bg-white/5 p-1 rounded-xl w-fit">
        {(['lista', 'importar'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${tab === t ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'}`}>
            {t === 'importar' && <Upload size={14} />}
            {t === 'lista' ? 'Mis Gastos' : 'Importar'}
          </button>
        ))}
      </div>

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
          </div>
          <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
            {expenses.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-slate-500 text-sm">No hay gastos este mes.</p>
                <button onClick={() => setTab('importar')} className="mt-3 text-emerald-400 text-sm hover:underline flex items-center gap-1 mx-auto">
                  <Upload size={14} /> Importar estado de cuenta
                </button>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {expenses.map(e => (
                  <div key={e.id} className="flex items-center justify-between p-4 hover:bg-white/5">
                    <div>
                      <p className="text-white text-sm font-medium">{e.merchant}</p>
                      <p className="text-slate-500 text-xs">{e.date} · {e.category} · {e.payment_method}</p>
                    </div>
                    <span className="text-red-400 font-semibold text-sm">-RD$ {Number(e.amount).toLocaleString('es-DO', { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'importar' && (
        <>
          <div onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) processFile(f) }}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)}
            className={`border-2 border-dashed rounded-2xl p-10 text-center transition-colors ${dragOver ? 'border-emerald-400 bg-emerald-500/5' : 'border-white/10 hover:border-white/20'}`}>
            <div className="flex justify-center gap-4 mb-3">
              <FileText size={32} className="text-slate-500" /><Image size={32} className="text-slate-500" />
            </div>
            <p className="text-white font-medium mb-1">Arrastra tu estado de cuenta aquí</p>
            <p className="text-slate-500 text-sm mb-4">PDF o captura del banco (Banco Popular, BHD, Banreservas...)</p>
            <label className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm cursor-pointer transition-colors">
              <Upload size={16} /> Seleccionar archivo
              <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => e.target.files?.[0] && processFile(e.target.files[0])} />
            </label>
          </div>

          {loading && <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center"><p className="text-emerald-400 text-sm animate-pulse">Analizando con IA...</p></div>}

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
                      <select defaultValue={t.category || 'Otros'} className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none">
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
