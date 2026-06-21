// scripts/monitor.ts
// Job periódico — executar via: npx ts-node scripts/monitor.ts
// Sugestão de cron: */30 * * * * (a cada 30 minutos)

import { PrismaClient } from '@prisma/client'
import Anthropic from '@anthropic-ai/sdk'
import { readFileSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const LIMITES = {
  horas_sem_resposta_alerta: 4,
  taxa_escala_humano_max: 0.30,
  tempo_medio_resolucao_max_horas: 24,
}

function carregarSystemPrompt(): string {
  return readFileSync(join(process.cwd(), '.agents', 'skills', 'monitor.md'), 'utf-8')
}

async function coletarMetricas(tenantId: string) {
  const agora = new Date()
  const inicioDia = new Date(agora)
  inicioDia.setHours(0, 0, 0, 0)
  const limiteHoras = new Date(agora)
  limiteHoras.setHours(limiteHoras.getHours() - LIMITES.horas_sem_resposta_alerta)

  const [osAbertas, osEmAndamento, osEncerradasHoje, osUrgenciaAlta, todasAtivas, osEscala] =
    await Promise.all([
      prisma.ordemServico.count({ where: { tenantId, status: 'aberta' } }),
      prisma.ordemServico.count({ where: { tenantId, status: 'em_andamento' } }),
      prisma.ordemServico.count({ where: { tenantId, status: 'encerrada', resolvidaEm: { gte: inicioDia } } }),
      prisma.ordemServico.count({ where: { tenantId, status: { in: ['aberta', 'em_andamento'] }, urgencia: 'alta' } }),
      prisma.ordemServico.findMany({
        where: { tenantId, status: { in: ['aberta', 'em_andamento'] } },
        select: {
          canal: true,
          createdAt: true,
          escalaHumano: true,
          interacoes: { orderBy: { createdAt: 'desc' }, take: 1, select: { createdAt: true } },
        },
      }),
      prisma.ordemServico.count({
        where: { tenantId, escalaHumano: true, status: { in: ['aberta', 'em_andamento'] } },
      }),
    ])

  const osSemResposta = todasAtivas.filter((os) => {
    const ref = os.interacoes[0]?.createdAt ?? os.createdAt
    return ref < limiteHoras
  }).length

  const encerradasDetalhes = await prisma.ordemServico.findMany({
    where: { tenantId, status: 'encerrada', resolvidaEm: { gte: inicioDia } },
    select: { createdAt: true, resolvidaEm: true },
  })
  const tempoMedioHoras =
    encerradasDetalhes.length > 0
      ? encerradasDetalhes.reduce((acc, os) => {
          return acc + (os.resolvidaEm!.getTime() - os.createdAt.getTime()) / 1000 / 60 / 60
        }, 0) / encerradasDetalhes.length
      : 0

  const totalAtivas = osAbertas + osEmAndamento
  const volumeCanal = todasAtivas.reduce(
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
      taxa_resolucao_primeiro_contato:
        totalAtivas + osEncerradasHoje > 0
          ? Math.round((osEncerradasHoje / (totalAtivas + osEncerradasHoje)) * 100) / 100
          : 0,
      taxa_escala_humano: totalAtivas > 0 ? Math.round((osEscala / totalAtivas) * 100) / 100 : 0,
      os_urgencia_alta_abertas: osUrgenciaAlta,
      volume_por_canal: volumeCanal,
    },
  }
}

async function notificarTelegram(canalId: string, mensagem: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: canalId, text: mensagem }),
  })
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

async function rodar() {
  const tenants = await prisma.tenant.findMany({
    where: { active: true },
    select: { id: true, name: true },
  })

  const systemPrompt = carregarSystemPrompt()

  for (const tenant of tenants) {
    console.log(`\nProcessando tenant: ${tenant.name}`)

    const metricas = await coletarMetricas(tenant.id)

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
      console.error(`Tenant ${tenant.name}: output inválido`)
      console.error(texto)
      continue
    }

    await prisma.logAgente.create({
      data: {
        tenantId: tenant.id,
        agente: 'monitor',
        acao: 'analise_kpis',
        input: metricas,
        output: output as object,
        sucesso: true,
      },
    })

    console.log(`Status: ${output.status_geral} — ${output.resumo}`)

    const alertasDanger = output.alertas.filter((a) => a.nivel === 'danger')
    if (alertasDanger.length > 0) {
      const osUrgente = await prisma.ordemServico.findFirst({
        where: { tenantId: tenant.id, urgencia: 'alta', status: { in: ['aberta', 'em_andamento'] } },
        orderBy: { createdAt: 'asc' },
        include: {
          interacoes: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { canal: true, canalId: true },
          },
        },
      })

      const interacao = osUrgente?.interacoes[0]
      if (interacao?.canalId && interacao.canal === 'telegram') {
        const mensagem = `⚠️ Alerta Monitor Camserv\n\n${output.resumo}\n\n${alertasDanger.map((a) => `• ${a.mensagem}`).join('\n')}`
        await notificarTelegram(interacao.canalId, mensagem)
        console.log(`Alerta danger enviado via Telegram`)
      }
    }
  }

  await prisma.$disconnect()
}

rodar().catch(async (err) => {
  console.error(err)
  await prisma.$disconnect()
  process.exit(1)
})
