'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, FileText, Image, Plus, Check, X } from 'lucide-react'

const CATEGORIES = ['Comida', 'Transporte', 'Entretenimiento', 'Salud', 'Ropa', 'Educación', 'Servicios', 'Salario', 'Otros']

type OcrTx = { date: string; amount: number; type: string; merchant: string; description: string; payment_method: string; category?: string }

export default function ImportarPage() {
  const [ocrResults, setOcrResults] = useState<OcrTx[]>([])
  const [loading, setLoading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [saved, setSaved] = useState(false)
  const [editedResults, setEditedResults] = useState<OcrTx[]>([])
  const supabase = createClient()

  const [progress, setProgress] = useState({ current: 0, total: 0 })

  async function processFiles(files: File[]) {
    setLoading(true); setOcrResults([]); setSaved(false)
    setProgress({ current: 0, total: files.length })
    const allTx: OcrTx[] = []
    for (let i = 0; i < files.length; i++) {
      setProgress({ current: i + 1, total: files.length })
      const form = new FormData(); form.append('file', files[i])
      try {
        const res = await fetch('/api/ocr', { method: 'POST', body: form })
        const data = await res.json()
        if (data.transactions) allTx.push(...data.transactions)
      } catch { /* skip failed file */ }
    }
    setOcrResults(allTx)
    setEditedResults(allTx)
    setLoading(false)
  }

  function updateCategory(i: number, cat: string) {
    setEditedResults(prev => prev.map((t, idx) => idx === i ? { ...t, category: cat } : t))
  }

  function removeRow(i: number) {
    setEditedResults(prev => prev.filter((_, idx) => idx !== i))
  }

  async function saveAll() {
    const { data: { user } } = await supabase.auth.getUser()
    const rows = editedResults.map(t => ({
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
    await supabase.from('transactions').insert(rows)
    setSaved(true); setOcrResults([]); setEditedResults([])
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-white font-semibold mb-1">Importar Estado de Cuenta</h2>
        <p className="text-slate-400 text-sm">Sube un PDF o captura de pantalla de tu banco. La IA extraerá todas las transacciones automáticamente.</p>
      </div>

      {/* Drop zone */}
      <div
        onDrop={e => { e.preventDefault(); setDragOver(false); const files = Array.from(e.dataTransfer.files); if (files.length) processFiles(files) }}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${dragOver ? 'border-emerald-400 bg-emerald-500/5' : 'border-white/10 hover:border-white/20'}`}
      >
        <div className="flex justify-center gap-4 mb-4">
          <FileText size={36} className="text-slate-500" />
          <Image size={36} className="text-slate-500" />
        </div>
        <p className="text-white font-medium mb-1">Arrastra tus estados de cuenta aquí</p>
        <p className="text-slate-500 text-sm mb-2">Banco Popular, BHD, Banreservas, Scotiabank...</p>
        <p className="text-slate-600 text-xs mb-5">Puedes subir hasta 10 archivos a la vez · PDF o imagen (JPG, PNG, WEBP)</p>
        <label className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm cursor-pointer transition-colors font-medium">
          <Upload size={16} /> Seleccionar archivos
          <input type="file" accept="image/*,.pdf" multiple className="hidden" onChange={e => { const files = Array.from(e.target.files || []); if (files.length) processFiles(files) }} />
        </label>
      </div>

      {loading && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center">
          <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-emerald-400 font-medium">IA analizando movimientos...</p>
          {progress.total > 1 && (
            <p className="text-slate-400 text-sm mt-1">Archivo {progress.current} de {progress.total}</p>
          )}
          <p className="text-slate-500 text-sm mt-1">Esto puede tomar unos segundos por archivo</p>
        </div>
      )}

      {saved && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3">
          <Check size={20} className="text-emerald-400" />
          <p className="text-emerald-400 font-medium">Transacciones guardadas exitosamente.</p>
        </div>
      )}

      {editedResults.length > 0 && (
        <div className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <div>
              <p className="text-white font-medium">{editedResults.length} transacciones encontradas</p>
              <p className="text-slate-500 text-xs">Revisa y ajusta las categorías antes de guardar</p>
            </div>
            <button onClick={saveAll} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <Plus size={14} /> Guardar todas
            </button>
          </div>
          <div className="divide-y divide-white/5">
            {editedResults.map((t, i) => (
              <div key={i} className="flex items-center justify-between p-4 gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{t.merchant || t.description}</p>
                  <p className="text-slate-500 text-xs">{t.date} · {t.payment_method}</p>
                </div>
                <select
                  value={t.category || 'Otros'}
                  onChange={e => updateCategory(i, e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none flex-shrink-0"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <span className={`text-sm font-semibold flex-shrink-0 ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {t.type === 'income' ? '+' : '-'}RD$ {t.amount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                </span>
                <button onClick={() => removeRow(i)} className="text-slate-600 hover:text-red-400 flex-shrink-0"><X size={14} /></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
