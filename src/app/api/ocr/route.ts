import { NextRequest, NextResponse } from 'next/server'
import zlib from 'zlib'

export const maxDuration = 30

// ─── PDF Text Extractor (with FlateDecode/zlib support) ──────────────────────
function extractTextFromPdfBuffer(buffer: Buffer): string {
  const raw = buffer.toString('latin1')
  const allChunks: string[] = []

  // Try to decompress FlateDecode streams
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g
  let sm
  while ((sm = streamRegex.exec(raw)) !== null) {
    const streamData = sm[1]
    const streamBuf = Buffer.from(streamData, 'latin1')
    try {
      const decompressed = zlib.inflateSync(streamBuf).toString('latin1')
      allChunks.push(extractTextFromDecompressedStream(decompressed))
    } catch {
      // Not compressed — try raw
      allChunks.push(extractTextFromDecompressedStream(streamData))
    }
  }

  return allChunks.filter(Boolean).join('\n')
}

function extractTextFromDecompressedStream(text: string): string {
  const chunks: string[] = []

  // Format 1: (string)Tj / TJ
  const btEtRegex = /BT([\s\S]*?)ET/g
  let m
  while ((m = btEtRegex.exec(text)) !== null) {
    const block = m[1]
    const strRegex = /\(([^)]*)\)\s*T[jJ]/g
    let s
    while ((s = strRegex.exec(block)) !== null) {
      const d = s[1].replace(/\\n/g, '\n').replace(/\\\\/g, '\\').replace(/\\\(/g, '(').replace(/\\\)/g, ')')
      if (d.trim()) chunks.push(d)
    }
    const hexRegex = /<([0-9a-fA-F]{4,})>\s*T[jJ]/g
    while ((s = hexRegex.exec(block)) !== null) {
      const hex = s[1]
      let decoded = ''
      for (let i = 0; i + 1 < hex.length; i += 2) {
        const code = parseInt(hex.substring(i, i + 2), 16)
        if (code > 31) decoded += String.fromCharCode(code)
      }
      if (decoded.trim()) chunks.push(decoded)
    }
    const arrayRegex = /\[([^\]]*)\]\s*TJ/g
    while ((s = arrayRegex.exec(block)) !== null) {
      const parts: string[] = []
      const pReg = /\(([^)]*)\)/g
      let p
      while ((p = pReg.exec(s[1])) !== null) {
        const d = p[1].replace(/\\n/g, '\n').replace(/\\\\/g, '\\').replace(/\\\(/g, '(').replace(/\\\)/g, ')')
        if (d.trim()) parts.push(d)
      }
      if (parts.length) chunks.push(parts.join(''))
    }
  }

  return chunks.join(' ')
}

// ─── Transaction Parser ───────────────────────────────────────────────────────
type Tx = {
  date: string; amount: number; type: string
  merchant: string; description: string
  payment_method: string; category: string
}

const INCOME_KEYWORDS = [
  'nomina','nómina','salario','deposito','depósito','transferencia de','transferencia recibida',
  'credito','crédito','pago recibido','abono','ingreso','devolucion','devolución',
  'reembolso','interes','interés','dividendo','cr transferencia','cr a cta',
  'desembolso','avance','pago int'
]

function guessCategory(desc: string): string {
  const d = desc.toLowerCase()
  if (/supermercado|colmado|food|burger|pizza|pollo|restaurant|comida|cafe|cafeter/.test(d)) return 'Comida'
  if (/uber|taxi|metro|gasolina|gasolinera|combustible|shell|texaco|parking/.test(d)) return 'Transporte'
  if (/farmacia|medico|médico|hospital|clinica|clínica|salud|doctor/.test(d)) return 'Salud'
  if (/netflix|spotify|cine|juego|entretenimiento|disney|hbo/.test(d)) return 'Entretenimiento'
  if (/ropa|tienda|boutique|moda|zapato|bravo/.test(d)) return 'Ropa'
  if (/escuela|colegio|universidad|educacion|educación/.test(d)) return 'Educación'
  if (/claro|altice|internet|electricidad|luz|edeeste|edenorte|caasd|agua|seguro|alquiler/.test(d)) return 'Servicios'
  if (/nomina|nómina|salario|sueldo/.test(d)) return 'Salario'
  return 'Otros'
}

function parseTransactionsFromText(rawText: string): Tx[] {
  const transactions: Tx[] = []
  const lines = rawText.split(/[\n\r]+/).map(l => l.trim()).filter(l => l.length > 5)

  // Pattern for Banreservas/Banco Popular/BHD format:
  // DD/MM/YYYY  DESCRIPTION  [-]AMOUNT  [BALANCE]
  // Amount can be negative (expense) or positive (income)
  // Balance is optional trailing number
  const txLine = /^(\d{2})[\/\-](\d{2})[\/\-](\d{2,4})\s+(.+?)\s+(-?[\d,]+\.\d{2})(?:\s+[\d,]+\.\d{2})?$/

  for (const line of lines) {
    // Skip header lines
    if (/^(fecha|date|descripci|monto|amount|balance|saldo|referencia|movimiento)/i.test(line)) continue

    const m = line.match(txLine)
    if (!m) continue

    const rawDesc = m[4].trim()
    const rawAmount = m[5]
    const amountNum = parseFloat(rawAmount.replace(/,/g, ''))
    if (isNaN(amountNum) || amountNum === 0) continue

    const isNegative = amountNum < 0
    const amount = Math.abs(amountNum)

    // Determine income vs expense
    // If amount is negative → expense
    // If amount is positive → check description for income keywords
    let isIncome: boolean
    if (isNegative) {
      isIncome = false
    } else {
      const descLower = rawDesc.toLowerCase()
      isIncome = INCOME_KEYWORDS.some(k => descLower.includes(k))
      // If no income keyword and it's positive, still mark as income
      if (!isIncome) {
        // Positive amounts that aren't clearly income get marked as income if they look like transfers received
        isIncome = /^(transferencia de|cr |desembolso|avance credimas|pago int|interes)/i.test(rawDesc)
        if (!isIncome) isIncome = true // default positive = income
      }
    }

    // Determine payment method
    let paymentMethod = 'card'
    const dl = rawDesc.toLowerCase()
    if (/retiro atm|retiro tuefectivo/.test(dl)) paymentMethod = 'cash'
    else if (/transferencia|pago tarjeta|cargo balance|cargo mensual/.test(dl)) paymentMethod = 'transfer'

    const year = m[3].length === 2 ? `20${m[3]}` : m[3]
    const date = `${year}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`

    transactions.push({
      date,
      amount,
      type: isIncome ? 'income' : 'expense',
      merchant: rawDesc.substring(0, 60),
      description: rawDesc,
      payment_method: paymentMethod,
      category: guessCategory(rawDesc),
    })
  }

  // If no full-line matches, try the sliding-window approach on tokens
  if (transactions.length === 0) {
    transactions.push(...parseTokenBased(rawText))
  }

  return transactions
}

function parseTokenBased(rawText: string): Tx[] {
  const transactions: Tx[] = []
  // For PDFs where text is fragmented across chunks
  // Look for date tokens followed by description and amount tokens
  const dateReg = /\b(\d{2})[\/\-](\d{2})[\/\-](\d{2,4})\b/g
  const amountReg = /\b(-?[\d,]+\.\d{2})\b/

  const tokens = rawText.split(/\s+/)
  let i = 0
  while (i < tokens.length) {
    const dm = tokens[i].match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{2,4})$/)
    if (dm) {
      const descParts: string[] = []
      let amount = 0
      let isNegative = false
      let j = i + 1
      while (j < tokens.length && j < i + 10) {
        const am = tokens[j].match(/^(-?[\d,]+\.\d{2})$/)
        if (am) {
          amount = Math.abs(parseFloat(am[1].replace(/,/g, '')))
          isNegative = am[1].startsWith('-')
          break
        }
        if (tokens[j].match(/^\d{2}[\/\-]\d{2}[\/\-]\d{2,4}$/)) break
        descParts.push(tokens[j])
        j++
      }
      if (amount > 0 && descParts.length > 0) {
        const desc = descParts.join(' ')
        const year = dm[3].length === 2 ? `20${dm[3]}` : dm[3]
        const isIncome = !isNegative
        transactions.push({
          date: `${year}-${dm[2].padStart(2, '0')}-${dm[1].padStart(2, '0')}`,
          amount,
          type: isIncome ? 'income' : 'expense',
          merchant: desc.substring(0, 60),
          description: desc,
          payment_method: 'card',
          category: guessCategory(desc),
        })
        i = j + 1
        continue
      }
    }
    i++
  }
  return transactions
  void dateReg; void amountReg
}

// ─── Gemini fallback (only for scanned/image PDFs) ───────────────────────────
async function parseWithGemini(base64Data: string, mediaType: string): Promise<Tx[]> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (!apiKey) throw new Error('No Gemini API key configured')

  const prompt = `Extrae TODAS las transacciones de este estado de cuenta dominicano.
Devuelve SOLO un JSON array:
[{"date":"YYYY-MM-DD","amount":1234.56,"type":"expense","merchant":"Nombre","description":"Desc","payment_method":"card","category":"Comida"}]
Categorías: Comida, Transporte, Entretenimiento, Salud, Ropa, Educación, Servicios, Salario, Otros
- amount siempre positivo. type: "income" créditos/depósitos, "expense" débitos/pagos.`

  const body = {
    contents: [{ parts: [
      { inline_data: { mime_type: mediaType, data: base64Data } },
      { text: prompt }
    ]}]
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  )

  if (res.status === 429) {
    const err = await res.json().catch(() => ({}))
    throw Object.assign(new Error(err?.error?.message || 'Quota exceeded'), { quota: true })
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `Gemini error ${res.status}`)
  }

  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  const jsonMatch = cleaned.match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error('No transactions in Gemini response')
  return JSON.parse(jsonMatch[0]) as Tx[]
}

// ─── Main Handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    let mediaType = file.type || ''
    if (!mediaType) {
      const name = file.name.toLowerCase()
      if (name.endsWith('.pdf')) mediaType = 'application/pdf'
      else if (name.endsWith('.png')) mediaType = 'image/png'
      else if (name.endsWith('.jpg') || name.endsWith('.jpeg')) mediaType = 'image/jpeg'
      else if (name.endsWith('.webp')) mediaType = 'image/webp'
    }

    if (mediaType === 'application/pdf') {
      // Step 1: Extract text (with FlateDecode support)
      const pdfText = extractTextFromPdfBuffer(buffer)
      const hasText = pdfText.trim().length > 30

      if (hasText) {
        // Step 2: Parse with regex (no API needed)
        const transactions = parseTransactionsFromText(pdfText)
        if (transactions.length > 0) {
          return NextResponse.json({ transactions, source: 'regex' })
        }
        // Text found but no transactions matched — return diagnostic
        return NextResponse.json({
          transactions: [],
          source: 'regex',
          warning: `Texto extraído (${pdfText.length} chars) pero sin transacciones reconocidas. Formato no soportado.`,
          textSample: pdfText.substring(0, 500)
        })
      } else {
        // Scanned PDF — try Gemini vision
        try {
          const transactions = await parseWithGemini(buffer.toString('base64'), 'application/pdf')
          return NextResponse.json({ transactions, source: 'gemini-vision' })
        } catch (err: unknown) {
          const e = err as Error & { quota?: boolean }
          if (e.quota) return NextResponse.json({ error: e.message, quota: true }, { status: 429 })
          return NextResponse.json({ error: e.message || 'Error procesando PDF escaneado' }, { status: 500 })
        }
      }
    } else {
      // Image — Gemini vision
      try {
        const transactions = await parseWithGemini(buffer.toString('base64'), mediaType)
        return NextResponse.json({ transactions, source: 'gemini-vision' })
      } catch (err: unknown) {
        const e = err as Error & { quota?: boolean }
        if (e.quota) return NextResponse.json({ error: e.message, quota: true }, { status: 429 })
        return NextResponse.json({ error: e.message || 'Error procesando imagen' }, { status: 500 })
      }
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
