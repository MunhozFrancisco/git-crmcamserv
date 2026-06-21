import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Anthropic from '@anthropic-ai/sdk'
import { readFileSync } from 'fs'
import { join } from 'path'
import { enviarMensagemTelegram } from '@/lib/canais/telegram'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const LIMITES = {
  horas_sem_resposta_alerta: 4,
  taxa_escala_humano_max: 0.30,
  tempo_medio_resolucao_max_horas: 24,
}

function carregarSystemPrompt(): string {
  return readFileSync(join(process.cwd(), '.agents', 'skills', 'monitor.md'), 'utf-8')
}

interface AlertaMonitor {
  nivel: 'info' | 'warning' | 'danger'
  metrica: string
  mensagem: string
  acao_sugerida: string
}

interface OutputMonitor {
  status_geral: 'normal' | 'atencao' | 'critico'
  alertas: AlertaMonitor[]
  pontos_principais: string[]
  resumo: string
}

async function coletarMetricas(tenantId: string) {
  const agora = new Date()
  const inicioDia = new Date(agora)
  inicioDia.setHours(0, 0, 0, 0)

  const limiteHoras = new Date(agora)
  limiteHoras.setHours(limiteHoras.getHours() - LIMITES.horas_sem_resposta_alerta)

  const [
    osAbertas,
    osEmAndamento,
    osEncerradasHoje,
    osUrgenciaAltaAbertas,
    todasOsAtivas,
    osEscalaHumano,
  ] = await Promise.all([
    prisma.ordemServico.count({
      where: { tenantId, status: 'aberta' },
    }),
    prisma.ordemServico.count({
      where: { tenantId, status: 'em_andamento' },
    }),
    prisma.ordemServico.count({
      where: { tenantId, status: 'encerrada', resolvidaEm: { gte: inicioDia } },
    }),
    prisma.ordemServico.count({
      where: { tenantId, status: { in: ['aberta', 'em_andamento'] }, urgencia: 'alta' },
    }),
    prisma.ordemServico.findMany({
      where: { tenantId, status: { in: ['aberta', 'em_andamento'] } },
      select: {
        canal: true,
        resolvidaEm: true,
        createdAt: true,
        escalaHumano: true,
        interacoes: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true },
        },
      },
    }),
    prisma.ordemServico.count({
      where: { tenantId, escalaHumano: true, status: { in: ['aberta', 'em_andamento'] } },
    }),
  ])

  const osSemResposta = todasOsAtivas.filter((os) => {
    const ultimaInteracao = os.interacoes[0]
    const referencia = ultimaInteracao ? ultimaInteracao.createdAt : os.createdAt
    return referencia < limiteHoras
  }).length

  const encerradasHojeDetalhes = await prisma.ordemServico.findMany({
    where: { tenantId, status: 'encerrada', resolvidaEm: { gte: inicioDia } },
    select: { createdAt: true, resolvidaEm: true },
  })
  const tempoMedioHoras =
    encerradasHojeDetalhes.length > 0
      ? encerradasHojeDetalhes.reduce((acc, os) => {
          const diff = os.resolvidaEm!.getTime() - os.createdAt.getTime()
          return acc + diff / 1000 / 60 / 60
        }, 0) / encerradasHojeDetalhes.length
      : 0

  const totalAtivas = osAbertas + osEmAndamento
  const taxaEscala = totalAtivas > 0 ? osEscalaHumano / totalAtivas : 0
  const taxaResolucao =
    totalAtivas + osEncerradasHoje > 0
      ? osEncerradasHoje / (totalAtivas + osEncerradasHoje)
      : 0

  const volumeCanal = todasOsAtivas.reduce(
    (acc, os) => ({ ...acc, [os.canal]: (acc[os.canal] ?? 0) + 1 }),
    { telegram: 0, whatsapp: 0, hermes: 0 } as Record<string, number>
  )

  return {
    timestamp: agora.toISOString(),
    limites: LIMITES,
    metricas: {
      os_abertas: osAbertas,
      os_em_andamento: osEmAndamento,
      os_encerradas_hoje: osEncerradasHoje,
      os_sem_resposta_ha_mais_de_x_horas: osSemResposta,
      tempo_medio_resolucao_horas: Math.round(tempoMedioHoras * 10) / 10,
      taxa_resolucao_primeiro_contato: Math.round(taxaResolucao * 100) / 100,
      taxa_escala_humano: Math.round(taxaEscala * 100) / 100,
      os_urgencia_alta_abertas: osUrgenciaAltaAbertas,
      volume_por_canal: volumeCanal,
    },
  }
}

async function notificarGestor(tenantId: string, resumo: string) {
  const osUrgente = await prisma.ordemServico.findFirst({
    where: { tenantId, urgencia: 'alta', status: { in: ['aberta', 'em_andamento'] } },
    orderBy: { createdAt: 'asc' },
    include: {
      client: { select: { name: true } },
      interacoes: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { canal: true, canalId: true },
      },
    },
  })

  if (!osUrgente) return

  const interacao = osUrgente.interacoes[0]
  if (!interacao?.canalId || interacao.canal !== 'telegram') return

  const mensagem = `⚠️ Alerta Monitor Camserv\n\n${resumo}\n\nOS urgente: #${osUrgente.id.slice(0, 8)} — ${osUrgente.client.name}`
  await enviarMensagemTelegram(interacao.canalId, mensagem)

  await prisma.logAgente.create({
    data: {
      tenantId,
      agente: 'notificacao',
      acao: 'alerta_monitor',
      input: { osId: osUrgente.id, canal: interacao.canal },
      output: { mensagem },
      sucesso: true,
    },
  })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const metricas = await coletarMetricas(session.user.tenantId)
  const systemPrompt = carregarSystemPrompt()

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: JSON.stringify(metricas) }],
  })

  const texto = response.content[0].type === 'text' ? response.content[0].text : ''

  let output: OutputMonitor
  try {
    output = JSON.parse(texto)
  } catch {
    return Response.json(
      { error: 'Agente retornou output inválido', raw: texto },
      { status: 502 }
    )
  }

  await prisma.logAgente.create({
    data: {
      tenantId: session.user.tenantId,
      agente: 'monitor',
      acao: 'analise_kpis',
      input: metricas,
      output: output as object,
      sucesso: true,
    },
  })

  const temAlertaDanger = output.alertas.some((a) => a.nivel === 'danger')
  if (temAlertaDanger) {
    await notificarGestor(session.user.tenantId, output.resumo)
  }

  return Response.json(output)
}
