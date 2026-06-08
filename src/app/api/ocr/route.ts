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
    // Extract strings inside parentheses: (text)Tj or (text)TJ
    const strRegex = /\(([^)]*)\)\s*T[jJ]/g
    let strMatch
    while ((strMatch = strRegex.exec(block)) !== null) {
      const decoded = strMatch[1]
        .replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t')
        .replace(/\\\\/g, '\\').replace(/\\\(/g, '(').replace(/\\\)/g, ')')
      if (decoded.trim()) chunks.push(decoded)
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

    let messageContent: Parameters<typeof generateText>[0]['messages'][0]['content']

    if (mediaType === 'application/pdf') {
      const pdfText = extractTextFromPdfBuffer(buffer)
      if (pdfText.trim().length > 100) {
        // Use text API — much higher free tier limits
        messageContent = `${prompt}\n\nTEXTO DEL ESTADO DE CUENTA:\n${pdfText.substring(0, 20000)}`
      } else {
        // Scanned PDF — fall back to vision
        messageContent = [
          { type: 'file' as const, data: buffer.toString('base64'), mediaType: 'application/pdf' },
          { type: 'text' as const, text: prompt },
        ]
      }
    } else {
      // Image file — use vision
      messageContent = [
        { type: 'file' as const, data: buffer.toString('base64'), mediaType: mediaType },
        { type: 'text' as const, text: prompt },
      ]
    }

    const { text } = await generateText({
      model: google('gemini-2.0-flash'),
      messages: [{ role: 'user', content: messageContent }],
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
