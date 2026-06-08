import { NextRequest, NextResponse } from 'next/server'
import { google } from '@ai-sdk/google'
import { generateText } from 'ai'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const bytes = await file.arrayBuffer()
  const base64 = Buffer.from(bytes).toString('base64')
  const mediaType = file.type as string

  const prompt = `Eres un asistente financiero experto en estados de cuenta dominicanos.
Analiza esta imagen/documento y extrae TODAS las transacciones que encuentres.

Para cada transacción devuelve un JSON array con este formato exacto:
[
  {
    "date": "YYYY-MM-DD",
    "amount": 1234.56,
    "type": "expense",
    "merchant": "Nombre del comercio",
    "description": "Descripción completa",
    "payment_method": "card"
  }
]

Reglas:
- Los montos siempre positivos
- type "income" para depósitos/créditos, "expense" para débitos/pagos
- payment_method: "card", "cash" o "transfer"
- Responde SOLO con el JSON array, sin texto adicional`

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

  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) return NextResponse.json({ error: 'No transactions found' }, { status: 422 })

  const transactions = JSON.parse(jsonMatch[0])
  return NextResponse.json({ transactions })
}
