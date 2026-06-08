import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 30

// ─── PDF Text Extractor ───────────────────────────────────────────────────────
function extractTextFromPdfBuffer(buffer: Buffer): string {
  const text = buffer.toString('latin1')
  const chunks: string[] = []

  const btEtRegex = /BT([\s\S]*?)ET/g
  let match
  while ((match = btEtRegex.exec(text)) !== null) {
    const block = match[1]

    // Format 1: (string)Tj / TJ
    const strRegex = /\(([^)]*)\)\s*T[jJ]/g
    let m
    while ((m = strRegex.exec(block)) !== null) {
      const d = m[1].replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t')
        .replace(/\\\\/g, '\\').replace(/\\\(/g, '(').replace(/\\\)/g, ')')
      if (d.trim()) chunks.push(d)
    }

    // Format 2: <hex>Tj / TJ
    const hexRegex = /<([0-9a-fA-F]+)>\s*T[jJ]/g
    while ((m = hexRegex.exec(block)) !== null) {
      const hex = m[1]
      let decoded = ''
      for (let i = 0; i + 1 < hex.length; i += 2) {
        const code = parseInt(hex.substring(i, i + 2), 16)
        if (code > 31) decoded += String.fromCharCode(code)
      }
      if (decoded.trim()) chunks.push(decoded)
    }

    // Format 3: [(str1)(str2)...]TJ
    const arrayRegex = /\[([^\]]*)\]\s*TJ/g
    while ((m = arrayRegex.exec(block)) !== null) {
      const parts: string[] = []
      const pRegex = /\(([^)]*)\)/g
      let p
      while ((p = pRegex.exec(m[1])) !== null) {
        const d = p[1].replace(/\\n/g, '\n').replace(/\\\\/g, '\\').replace(/\\\(/g, '(').replace(/\\\)/g, ')')
        if (d.trim()) parts.push(d)
      }
      if (parts.length) chunks.push(parts.join(''))
    }
  }

  // Fallback: uncompressed streams with date patterns
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g
  let sm
  while ((sm = streamRegex.exec(text)) !== null) {
    const c = sm[1]
    if (!c.includes('\x78\x9c') && !c.includes('\x78\x01')) {
      const readable = c.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ')
      if (readable.match(/\d{2}[\/\-]\d{2}[\/\-]\d{2,4}/)) chunks.push(readable)
    }
  }

  return chunks.join(' ')
}

// ─── Regex-based Transaction Parser (no AI needed) ───────────────────────────
type Tx = {
  date: string; amount: number; type: string
  merchant: string; description: string
  payment_method: string; category: string
}

const INCOME_KEYWORDS = [
  'nomina','nómina','salario','deposito','depósito','transferencia recibida',
  'credito','crédito','pago recibido','abono','ingreso','devolucion','devolución',
  'reembolso','interes','interés','dividendo'
]
const EXPENSE_KEYWORDS = [
  'pago','compra','cargo','debito','débito','retiro','supermercado','farmacia',
  'restaurante','gasolina','seguro','electricidad','agua','internet','telefono','teléfono'
]

function guessCategory(desc: string): string {
  const d = desc.toLowerCase()
  if (/supermercado|colmado|food|burger|pizza|pollo|restaurant|comida|cafe|cafetería/.test(d)) return 'Comida'
  if (/gasolina|gasolinera|uber|taxi|metro|combustible|shell|texaco/.test(d)) return 'Transporte'
  if (/farmacia|medico|médico|hospital|clinica|clínica|salud|doctor/.test(d)) return 'Salud'
  if (/netflix|spotify|cine|juego|entretenimiento/.test(d)) return 'Entretenimiento'
  if (/ropa|tienda|boutique|moda|zapato/.test(d)) return 'Ropa'
  if (/escuela|colegio|universidad|educacion|educación/.test(d)) return 'Educación'
  if (/luz|edeeste|edenorte|caasd|agua|claro|altice|internet|seguro|alquiler|renta/.test(d)) return 'Servicios'
  if (/nomina|nómina|salario|sueldo/.test(d)) return 'Salario'
  return 'Otros'
}

function parseAmount(s: string): number {
  // Remove currency symbols and spaces, handle RD$, $, commas as thousand separators
  const clean = s.replace(/[RD$\s]/g, '').replace(/,(?=\d{3})/g, '').replace(',', '.')
  return Math.abs(parseFloat(clean)) || 0
}

function parseDate(d: string, m: string, y: string): string {
  const year = y.length === 2 ? `20${y}` : y
  return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
}

function parseTransactionsFromText(rawText: string): Tx[] {
  const transactions: Tx[] = []
  const lines = rawText.split(/[\n\r]+/).map(l => l.trim()).filter(Boolean)

  // Pattern: date (DD/MM/YYYY or DD-MM-YYYY), description, amount
  // Handles: "01/05/2024  SUPERMERCADO NACIONAL  1,234.56"
  const txPattern = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\s+(.+?)\s+([\d,]+\.\d{2})\s*([+-]?)/
  // Alternative: amount first then date
  const txPattern2 = /([\d,]+\.\d{2})\s+(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\s+(.+)/

  for (const line of lines) {
    // Skip header lines
    if (line.length < 10) continue
    if (/^(fecha|date|descripcion|descripción|monto|amount|balance|saldo|referencia)/i.test(line)) continue

    let tx: Tx | null = null

    // Try pattern 1: date first
    let m = line.match(txPattern)
    if (m) {
      const desc = m[4].trim()
      const amount = parseAmount(m[5])
      if (amount > 0) {
        const descLower = desc.toLowerCase()
        const isIncome = INCOME_KEYWORDS.some(k => descLower.includes(k))
        tx = {
          date: parseDate(m[1], m[2], m[3]),
          amount,
          type: isIncome ? 'income' : 'expense',
          merchant: desc.substring(0, 60),
          description: desc,
          payment_method: 'card',
          category: guessCategory(desc),
        }
      }
    }

    // Try pattern 2: amount first
    if (!tx) {
      m = line.match(txPattern2)
      if (m) {
        const desc = m[5].trim()
        const amount = parseAmount(m[1])
        if (amount > 0) {
          const descLower = desc.toLowerCase()
          const isIncome = INCOME_KEYWORDS.some(k => descLower.includes(k))
          tx = {
            date: parseDate(m[2], m[3], m[4]),
            amount,
            type: isIncome ? 'income' : 'expense',
            merchant: desc.substring(0, 60),
            description: desc,
            payment_method: 'card',
            category: guessCategory(desc),
          }
        }
      }
    }

    if (tx) transactions.push(tx)
  }

  // Also try sliding window: collect tokens and assemble transactions
  if (transactions.length === 0) {
    const datePattern = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/
    const amountPattern = /^[\d,]+\.\d{2}$/

    let i = 0
    while (i < lines.length) {
      const dm = lines[i].match(datePattern)
      if (dm) {
        // Collect next 1-4 tokens as description, then find amount
        const descParts: string[] = []
        let j = i + 1
        let amount = 0
        while (j < lines.length && j < i + 6) {
          if (amountPattern.test(lines[j])) {
            amount = parseAmount(lines[j])
            break
          }
          if (lines[j].match(datePattern)) break
          descParts.push(lines[j])
          j++
        }
        if (amount > 0 && descParts.length > 0) {
          const desc = descParts.join(' ').trim()
          const descLower = desc.toLowerCase()
          const isIncome = INCOME_KEYWORDS.some(k => descLower.includes(k))
          transactions.push({
            date: parseDate(dm[1], dm[2], dm[3]),
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
  }

  return transactions
}

// ─── Gemini fallback (only if regex finds nothing) ───────────────────────────
async function parseWithGemini(pdfText: string, base64Data?: string, mediaType?: string): Promise<Tx[]> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (!apiKey) throw new Error('No Gemini API key configured')

  const prompt = `Eres un asistente financiero. Extrae TODAS las transacciones de este estado de cuenta dominicano.
Devuelve SOLO un JSON array con este formato exacto:
[{"date":"YYYY-MM-DD","amount":1234.56,"type":"expense","merchant":"Nombre","description":"Descripcion","payment_method":"card","category":"Comida"}]
Categorías válidas: Comida, Transporte, Entretenimiento, Salud, Ropa, Educación, Servicios, Salario, Otros
- amount siempre positivo
- type: "income" para créditos/depósitos/nómina, "expense" para débitos/pagos
- payment_method: "card", "cash" o "transfer"
Responde SOLO con el JSON array, sin texto adicional.`

  let body: object
  if (pdfText) {
    body = {
      contents: [{ parts: [{ text: `${prompt}\n\nTEXTO:\n${pdfText.substring(0, 15000)}` }] }]
    }
  } else if (base64Data && mediaType) {
    body = {
      contents: [{ parts: [
        { inline_data: { mime_type: mediaType, data: base64Data } },
        { text: prompt }
      ]}]
    }
  } else {
    throw new Error('No content to process')
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
      // Step 1: Extract text from PDF
      const pdfText = extractTextFromPdfBuffer(buffer)
      const hasText = pdfText.trim().length > 50

      // Step 2: Try regex parsing first (no API needed)
      if (hasText) {
        const transactions = parseTransactionsFromText(pdfText)
        if (transactions.length > 0) {
          return NextResponse.json({ transactions, source: 'regex' })
        }

        // Step 3: Text extracted but regex didn't match — try Gemini with text
        try {
          const transactions = await parseWithGemini(pdfText)
          return NextResponse.json({ transactions, source: 'gemini-text' })
        } catch (err: unknown) {
          const e = err as Error & { quota?: boolean }
          if (e.quota) {
            return NextResponse.json({ error: e.message, quota: true }, { status: 429 })
          }
          // Gemini failed, return empty rather than error
          return NextResponse.json({ transactions: [], source: 'regex', warning: 'No se encontraron transacciones con el formato detectado' })
        }
      } else {
        // Step 4: Scanned PDF — must use Gemini vision
        try {
          const transactions = await parseWithGemini('', buffer.toString('base64'), 'application/pdf')
          return NextResponse.json({ transactions, source: 'gemini-vision' })
        } catch (err: unknown) {
          const e = err as Error & { quota?: boolean }
          if (e.quota) {
            return NextResponse.json({ error: e.message, quota: true }, { status: 429 })
          }
          return NextResponse.json({ error: e.message || 'Error procesando PDF escaneado' }, { status: 500 })
        }
      }
    } else {
      // Image — must use Gemini vision
      try {
        const transactions = await parseWithGemini('', buffer.toString('base64'), mediaType)
        return NextResponse.json({ transactions, source: 'gemini-vision' })
      } catch (err: unknown) {
        const e = err as Error & { quota?: boolean }
        if (e.quota) {
          return NextResponse.json({ error: e.message, quota: true }, { status: 429 })
        }
        return NextResponse.json({ error: e.message || 'Error procesando imagen' }, { status: 500 })
      }
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
