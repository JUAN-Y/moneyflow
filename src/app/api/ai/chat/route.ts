import { google } from '@ai-sdk/google'
import { streamText, createUIMessageStream, createUIMessageStreamResponse } from 'ai'

export const maxDuration = 30

export async function POST(req: Request) {
  const { messages } = await req.json()

  const coreMessages = (messages as Array<{ role: string; parts?: Array<{ type: string; text: string }>; content?: string }>)
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.parts?.find(p => p.type === 'text')?.text ?? m.content ?? '',
    }))

  const result = streamText({
    model: google('gemini-2.0-flash'),
    system: `Eres MoneyFlow AI, el asistente financiero personal de esta app dominicana.
Ayuda al usuario con sus finanzas, sugiere formas de ahorro y responde preguntas.
Usa pesos dominicanos (RD$) siempre. Sé conciso, amigable y práctico.`,
    messages: coreMessages,
  })

  const stream = createUIMessageStream({
    execute: ({ writer }) => {
      writer.merge(result.toUIMessageStream())
    },
  })

  return createUIMessageStreamResponse({ stream })
}
