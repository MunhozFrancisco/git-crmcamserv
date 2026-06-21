import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Anthropic from '@anthropic-ai/sdk'
import { readFileSync } from 'fs'
import { join } from 'path'
import { enviarMensagemTelegram } from '@/lib/canais/telegram'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function carregarSystemPrompt(): string {
  const caminho = join(process.cwd(), '.agents', 'skills', 'notificacao.md')
  return readFileSync(caminho, 'utf-8')
}

type TipoNotificacao = 'os_aberta' | 'os_atualizada' | 'os_encerrada' | 'lembrete' | 'cobranca'

interface InputNotificacao {
  tipo: TipoNotificacao
  osId: string
}

interface OutputAgente {
  canal: string
  canal_id: string
  mensagem: string
  tipo: string
  log: {
    template_usado: string
    variaveis_preenchidas: string[]
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: InputNotificacao = await req.json()
  if (!body.tipo || !body.osId) {
    return Response.json({ error: 'tipo e osId são obrigatórios' }, { status: 400 })
  }

  const os = await prisma.ordemServico.findUnique({
    where: { id: body.osId },
    include: {
      client: { select: { name: true } },
      interacoes: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { canal: true, canalId: true },
      },
    },
  })

  if (!os || os.tenantId !== session.user.tenantId) {
    return Response.json({ error: 'OS não encontrada' }, { status: 404 })
  }

  const ultimaInteracao = os.interacoes[0]
  if (!ultimaInteracao?.canalId) {
    return Response.json(
      { error: 'OS sem canalId registrado — canal de retorno desconhecido' },
      { status: 422 }
    )
  }

  const inputAgente = {
    tipo: body.tipo,
    canal: ultimaInteracao.canal,
    canal_id: ultimaInteracao.canalId,
    cliente: { nome: os.client.name },
    os: {
      id: os.id.slice(0, 8),
      status: os.status,
      prazo: null,
      hora_agendamento: null,
    },
    cobranca: { numero: null, vencimento: null, pix: null },
  }

  const systemPrompt = carregarSystemPrompt()

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    system: systemPrompt,
    messages: [{ role: 'user', content: JSON.stringify(inputAgente) }],
  })

  const textoResposta =
    response.content[0].type === 'text' ? response.content[0].text : ''

  let output: OutputAgente
  try {
    output = JSON.parse(textoResposta)
  } catch {
    return Response.json(
      { error: 'Agente retornou output inválido', raw: textoResposta },
      { status: 502 }
    )
  }

  let enviado = false
  let erroMsg: string | null = null

  if (output.canal === 'telegram') {
    await enviarMensagemTelegram(output.canal_id, output.mensagem)
    enviado = true
  } else {
    erroMsg = `Adaptador para canal '${output.canal}' ainda não implementado`
  }

  await prisma.logAgente.create({
    data: {
      tenantId: session.user.tenantId,
      agente: 'notificacao',
      acao: body.tipo,
      osId: os.id,
      input: inputAgente,
      output: output as object,
      sucesso: enviado,
      erroMsg,
    },
  })

  if (!enviado) {
    return Response.json({ error: erroMsg, output }, { status: 501 })
  }

  return Response.json({ ok: true, canal: output.canal, mensagem: output.mensagem })
}
