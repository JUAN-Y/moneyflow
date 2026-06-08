import { NextRequest, NextResponse } from 'next/server'
import { google } from '@ai-sdk/google'
import { generateText } from 'ai'

export const maxDuration = 30

const prompt = `Eres un asistente financiero experto en estados de cuenta dominicanos.
Analiza el siguiente texto de un estado de cuenta y extrae TODAS las transacciones.

Devuelve un JSON array con este formato exacto (sin texto adicional):
[
  {
    "date": "YYYY-MM-DD",
    "amount": 1234.56,
    "type": "expense",
    "merchant": "Nombre del comercio",
    "description": "Descripción completa",
    "payment_method": "card",
    "category": "Comida"
  }
]

Categorías: Comida, Transporte, Entretenimiento, Salud, Ropa, Educación, Servicios, Salario, Otros
- montos siempre positivos
- type "income" para depósitos/créditos/nómina, "expense" para débitos/pagos
- payment_method: "card", "cash" o "transfer"
Responde SOLO con el JSON array.`

// Simple PDF text extractor using raw buffer parsing (no external deps)
function extractTextFromPdfBuffer(buffer: Buffer): string {
  const text = buffer.toString('latin1')
  const chunks: string[] = []

  // Extract text between BT and ET markers (PDF text objects)
  const btEtRegex = /BT([\s\S]*?)ET/g
  let match
  while ((match = btEtRegex.exec(text)) !== null) {
    const block = match[1]

    // Format 1: (string)Tj or (string)TJ — literal strings
    const strRegex = /\(([^)]*)\)\s*T[jJ]/g
    let strMatch
    while ((strMatch = strRegex.exec(block)) !== null) {
      const decoded = strMatch[1]
        .replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t')
        .replace(/\\\\/g, '\\').replace(/\\\(/g, '(').replace(/\\\)/g, ')')
      if (decoded.trim()) chunks.push(decoded)
    }

    // Format 2: <hex>Tj or <hex>TJ — hex-encoded strings (common in bank PDFs)
    const hexRegex = /<([0-9a-fA-F]+)>\s*T[jJ]/g
    let hexMatch
    while ((hexMatch = hexRegex.exec(block)) !== null) {
      const hex = hexMatch[1]
      let decoded = ''
      for (let i = 0; i < hex.length - 1; i += 2) {
        const code = parseInt(hex.substring(i, i + 2), 16)
        if (code > 31 && code < 127) decoded += String.fromCharCode(code)
        else if (code >= 160) decoded += String.fromCharCode(code) // latin-1 extended
      }
      if (decoded.trim()) chunks.push(decoded)
    }

    // Format 3: [(string1)(string2)...]TJ — array of strings
    const arrayRegex = /\[([^\]]*)\]\s*TJ/g
    let arrayMatch
    while ((arrayMatch = arrayRegex.exec(block)) !== null) {
      const inner = arrayMatch[1]
      const parts: string[] = []
      const partRegex = /\(([^)]*)\)/g
      let part
      while ((part = partRegex.exec(inner)) !== null) {
        const decoded = part[1]
          .replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t')
          .replace(/\\\\/g, '\\').replace(/\\\(/g, '(').replace(/\\\)/g, ')')
        if (decoded.trim()) parts.push(decoded)
      }
      if (parts.length) chunks.push(parts.join(''))
    }
  }

  // Also try to extract raw text streams (some PDFs use compressed streams but the decoded text may be visible)
  // Look for stream content between stream/endstream
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g
  let streamMatch
  while ((streamMatch = streamRegex.exec(text)) !== null) {
    const content = streamMatch[1]
    // Only process uncompressed streams (no /Filter FlateDecode etc.)
    if (!content.includes('\x78\x9c') && !content.includes('\x78\x01')) {
      // Look for readable text patterns like dates and amounts (e.g. "01/05/2024")
      const readable = content.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ')
      if (readable.match(/\d{2}[\/\-]\d{2}[\/\-]\d{4}/)) {
        chunks.push(readable)
      }
    }
  }

  return chunks.join(' ')
}

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

    let userMessage: string | Array<{ type: 'file'; data: string; mediaType: string } | { type: 'text'; text: string }>

    if (mediaType === 'application/pdf') {
      const pdfText = extractTextFromPdfBuffer(buffer)
      if (pdfText.trim().length > 100) {
        userMessage = `${prompt}\n\nTEXTO DEL ESTADO DE CUENTA:\n${pdfText.substring(0, 20000)}`
      } else {
        userMessage = [
          { type: 'file' as const, data: buffer.toString('base64'), mediaType: 'application/pdf' },
          { type: 'text' as const, text: prompt },
        ]
      }
    } else {
      userMessage = [
        { type: 'file' as const, data: buffer.toString('base64'), mediaType },
        { type: 'text' as const, text: prompt },
      ]
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { text } = await generateText({
      model: google('gemini-2.0-flash'),
      messages: [{ role: 'user', content: userMessage as any }],
    })

    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return NextResponse.json({ error: 'No transactions found' }, { status: 422 })

    const transactions = JSON.parse(jsonMatch[0])
    return NextResponse.json({ transactions })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    const isQuota = message.toLowerCase().includes('quota') || message.toLowerCase().includes('rate')
    return NextResponse.json({ error: message, quota: isQuota }, { status: isQuota ? 429 : 500 })
  }
}
