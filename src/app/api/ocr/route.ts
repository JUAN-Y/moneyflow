import { NextRequest, NextResponse } from 'next/server'
import { google } from '@ai-sdk/google'
import { generateText } from 'ai'

export const maxDuration = 30

const prompt = `Eres un asistente financiero experto en estados de cuenta dominicanos.
Analiza el siguiente texto de un estado de cuenta y extrae TODAS las transacciones.

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
- montos siempre positivos
- type "income" para depósitos/créditos/nómina, "expense" para débitos/pagos
- payment_method: "card", "cash" o "transfer"
Responde SOLO con el JSON array, sin texto adicional.`

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  // Dynamically import pdf-parse to avoid edge runtime issues
  const pdfParse = (await import('pdf-parse')).default
  const data = await pdfParse(buffer)
  return data.text
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

    let messages: Parameters<typeof generateText>[0]['messages']

    if (mediaType === 'application/pdf') {
      // Extract text first — uses text quota (much higher limits)
      try {
        const pdfText = await extractTextFromPdf(buffer)
        if (pdfText && pdfText.trim().length > 100) {
          messages = [{
            role: 'user',
            content: `${prompt}\n\nTEXTO DEL ESTADO DE CUENTA:\n${pdfText.substring(0, 15000)}`
          }]
        } else {
          throw new Error('PDF has no extractable text, falling back to vision')
        }
      } catch {
        // Fallback to vision for scanned PDFs
        const base64 = buffer.toString('base64')
        messages = [{
          role: 'user',
          content: [
            { type: 'file', data: base64, mediaType: 'application/pdf' },
            { type: 'text', text: prompt },
          ],
        }]
      }
    } else {
      // Images — use vision
      const base64 = buffer.toString('base64')
      messages = [{
        role: 'user',
        content: [
          { type: 'file', data: base64, mediaType: mediaType },
          { type: 'text', text: prompt },
        ],
      }]
    }

    const { text } = await generateText({
      model: google('gemini-2.0-flash'),
      messages,
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
