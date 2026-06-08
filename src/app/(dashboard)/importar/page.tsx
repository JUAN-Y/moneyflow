'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, FileText, Image, Plus, Check, X, Clock } from 'lucide-react'

const CATEGORIES = ['Comida', 'Transporte', 'Entretenimiento', 'Salud', 'Ropa', 'Educación', 'Servicios', 'Salario', 'Otros']

type OcrTx = { date: string; amount: number; type: string; merchant: string; description: string; payment_method: string; category?: string }
type QueueItem = { file: File; status: 'pending' | 'processing' | 'done' | 'error' | 'waiting'; message?: string }

function useCountdown(target: number) {
  const [secs, setSecs] = useState(0)
  useEffect(() => {
    if (target <= 0) { setSecs(0); return }
    const diff = Math.max(0, Math.ceil((target - Date.now()) / 1000))
    setSecs(diff)
    const id = setInterval(() => {
      const d = Math.max(0, Math.ceil((target - Date.now()) / 1000))
      setSecs(d)
      if (d === 0) clearInterval(id)
    }, 500)
    return () => clearInterval(id)
  }, [target])
  return secs
}

export default function ImportarPage() {
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [ocrResults, setOcrResults] = useState<OcrTx[]>([])
  const [loading, setLoading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [saved, setSaved] = useState(false)
  const [editedResults, setEditedResults] = useState<OcrTx[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [retryAt, setRetryAt] = useState(0)
  const supabase = createClient()
  const countdown = useCountdown(retryAt)

  function updateQueue(i: number, patch: Partial<QueueItem>) {
    setQueue(prev => prev.map((q, idx) => idx === i ? { ...q, ...patch } : q))
  }

  async function processFiles(files: File[]) {
    const items: QueueItem[] = files.map(f => ({ file: f, status: 'pending' }))
    setQueue(items); setOcrResults([]); setSaved(false); setErrors([])
    setLoading(true); setRetryAt(0)
    const allTx: OcrTx[] = []
    const errs: string[] = []

    for (let i = 0; i < files.length; i++) {
      updateQueue(i, { status: 'processing' })
      // Mark remaining as pending
      for (let j = i + 1; j < files.length; j++) updateQueue(j, { status: 'pending' })

      let success = false
      for (let attempt = 0; attempt < 2; attempt++) {
        const form = new FormData(); form.append('file', files[i])
        try {
          const res = await fetch('/api/ocr', { method: 'POST', body: form })
          const data = await res.json()
          if (data.transactions) {
            allTx.push(...data.transactions)
            updateQueue(i, { status: 'done', message: `${data.transactions.length} transacciones` })
            success = true
            break
          } else if (data.error?.toLowerCase().includes('quota') || data.error?.toLowerCase().includes('rate')) {
            // Rate limit — wait 65s
            const retryTime = Date.now() + 65000
            setRetryAt(retryTime)
            updateQueue(i, { status: 'waiting', message: 'Límite de cuota — reintentando en 65s...' })
            await new Promise(r => setTimeout(r, 65000))
            setRetryAt(0)
            updateQueue(i, { status: 'processing' })
          } else {
            updateQueue(i, { status: 'error', message: data.error || 'Sin transacciones' })
            errs.push(`${files[i].name}: ${data.error || 'Sin transacciones'}`)
            break
          }
        } catch {
          updateQueue(i, { status: 'error', message: 'Error de conexión' })
          errs.push(`${files[i].name}: Error de conexión`)
          break
        }
      }

      if (!success && !errs.find(e => e.startsWith(files[i].name))) {
        updateQueue(i, { status: 'error', message: 'Falló después de reintentar' })
        errs.push(`${files[i].name}: Falló después de reintentar`)
      }

      // Pause 4s between files
      if (i < files.length - 1) await new Promise(r => setTimeout(r, 4000))
    }

    setOcrResults(allTx)
    setEditedResults(allTx)
    setErrors(errs)
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
    setSaved(true); setOcrResults([]); setEditedResults([]); setQueue([])
  }

  const statusIcon = (s: QueueItem['status']) => {
    if (s === 'done') return <Check size={14} className="text-emerald-400" />
    if (s === 'error') return <X size={14} className="text-red-400" />
    if (s === 'processing') return <div className="w-3 h-3 border border-emerald-400 border-t-transparent rounded-full animate-spin" />
    if (s === 'waiting') return <Clock size={14} className="text-yellow-400" />
    return <div className="w-3 h-3 rounded-full bg-white/20" />
  }

  const statusColor = (s: QueueItem['status']) => {
    if (s === 'done') return 'text-emerald-400'
    if (s === 'error') return 'text-red-400'
    if (s === 'processing') return 'text-white'
    if (s === 'waiting') return 'text-yellow-400'
    return 'text-slate-500'
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-white font-semibold mb-1">Importar Estado de Cuenta</h2>
        <p className="text-slate-400 text-sm">Sube un PDF o captura de pantalla de tu banco. La IA extraerá todas las transacciones automáticamente.</p>
      </div>

      {/* Drop zone */}
      {!loading && queue.length === 0 && (
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
      )}

      {/* Queue status */}
      {queue.length > 0 && (
        <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Cola de procesamiento</p>
              <p className="text-slate-500 text-xs mt-0.5">
                {queue.filter(q => q.status === 'done').length} de {queue.length} archivos completados
                {countdown > 0 && <span className="text-yellow-400 ml-2">· Reintentando en {countdown}s...</span>}
              </p>
            </div>
            {!loading && (
              <label className="flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white px-3 py-1.5 rounded-lg text-sm cursor-pointer transition-colors">
                <Upload size={14} /> Subir más
                <input type="file" accept="image/*,.pdf" multiple className="hidden" onChange={e => { const files = Array.from(e.target.files || []); if (files.length) processFiles(files) }} />
              </label>
            )}
          </div>
          <div className="divide-y divide-white/5">
            {queue.map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-shrink-0">{statusIcon(item.status)}</div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${statusColor(item.status)}`}>{item.file.name}</p>
                  {item.message && <p className="text-xs text-slate-500 mt-0.5">{item.message}</p>}
                  {item.status === 'waiting' && countdown > 0 && (
                    <p className="text-xs text-yellow-400 mt-0.5">En cola — continuando en {countdown}s</p>
                  )}
                  {item.status === 'pending' && (
                    <p className="text-xs text-slate-600 mt-0.5">En espera...</p>
                  )}
                </div>
                <span className="text-xs text-slate-600 flex-shrink-0">
                  {(item.file.size / 1024).toFixed(0)} KB
                </span>
              </div>
            ))}
          </div>
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
                <select value={t.category || 'Otros'} onChange={e => updateCategory(i, e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none flex-shrink-0">
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
