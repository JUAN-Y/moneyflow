import { NextRequest, NextResponse } from 'next/server'
import { google } from '@ai-sdk/google'
import { generateText } from 'ai'

export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    let mediaType = file.type || 'application/octet-stream'

    if (!mediaType || mediaType === 'application/octet-stream') {
      const name = file.name.toLowerCase()
      if (name.endsWith('.pdf')) mediaType = 'application/pdf'
      else if (name.endsWith('.png')) mediaType = 'image/png'
      else if (name.endsWith('.jpg') || name.endsWith('.jpeg')) mediaType = 'image/jpeg'
      else if (name.endsWith('.webp')) mediaType = 'image/webp'
    }

    const prompt = `Eres un asistente financiero experto en estados de cuenta dominicanos.
Analiza este documento y extrae TODAS las transacciones que encuentres.

Para cada transacción devuelve un JSON array con este formato exacto:
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
Reglas: montos positivos, type "income" para depósitos/créditos, "expense" para débitos/pagos.
Responde SOLO con el JSON array, sin texto adicional ni bloques de código.`

    const { text } = await generateText({
      model: google('gemini-2.0-flash'),
      messages: [{
        role: 'user',
        content: [
          { type: 'file', data: base64, mediaType: mediaType },
          { type: 'text', text: prompt },
        ],
      }],
    })

    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return NextResponse.json({ error: 'No transactions found' }, { status: 422 })

    const transactions = JSON.parse(jsonMatch[0])
    return NextResponse.json({ transactions })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    // Signal quota/rate errors distinctly so frontend can retry
    const isQuota = message.toLowerCase().includes('quota') || message.toLowerCase().includes('rate')
    return NextResponse.json({ error: message, quota: isQuota }, { status: isQuota ? 429 : 500 })
  }
}
