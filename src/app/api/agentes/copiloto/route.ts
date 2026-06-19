import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { tenantTemModulo } from '@/lib/modulos'
import Anthropic from '@anthropic-ai/sdk'
import { readFileSync } from 'fs'
import { join } from 'path'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function carregarSystemPrompt(): string {
  const caminho = join(process.cwd(), '.agents', 'skills', 'copiloto.md')
  return readFileSync(caminho, 'utf-8')
}

interface InputCopiloto {
  osId: string
  textoAtendente?: string
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const temModulo = await tenantTemModulo(session.user.tenantId, 'copiloto')
  if (!temModulo) {
    return new Response(JSON.stringify({ error: 'Módulo Copiloto não disponível neste plano' }), { status: 403 })
  }

  const body: InputCopiloto = await req.json()
  if (!body.osId) {
    return new Response(JSON.stringify({ error: 'osId obrigatório' }), { status: 400 })
  }

  // Buscar OS + histórico de interações
  const os = await prisma.ordemServico.findUnique({
    where: { id: body.osId },
    include: {
      client: { select: { name: true } },
      interacoes: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { direcao: true, mensagem: true, createdAt: true },
      },
    },
  })

  if (!os || os.tenantId !== session.user.tenantId) {
    return new Response(JSON.stringify({ error: 'OS não encontrada' }), { status: 404 })
  }

  const historicoResumido = os.interacoes
    .reverse()
    .map((i) => `[${i.direcao === 'entrada' ? 'Cliente' : 'Atendente'}]: ${i.mensagem}`)
    .join('\n')

  const inputCopiloto = {
    os: {
      id: os.id.slice(0, 8),
      descricao: os.descricao,
      intencao: os.intencao,
      urgencia: os.urgencia,
      status: os.status,
      canal: os.canal,
    },
    cliente: {
      nome: os.client.name,
      historico_resumido: historicoResumido || 'Sem histórico anterior.',
    },
    texto_atendente: body.textoAtendente ?? '',
  }

  const systemPrompt = carregarSystemPrompt()

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        stream: true,
        system: systemPrompt,
        messages: [{ role: 'user', content: JSON.stringify(inputCopiloto) }],
      })

      for await (const event of response) {
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          controller.enqueue(encoder.encode(event.delta.text))
        }
      }

      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
