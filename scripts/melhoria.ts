// scripts/melhoria.ts
// Job semanal — executar via: npx ts-node scripts/melhoria.ts
// Ou agendar com cron: 0 8 * * 1 (toda segunda às 8h)

import { PrismaClient } from '@prisma/client'
import Anthropic from '@anthropic-ai/sdk'
import { readFileSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function carregarSystemPrompt(): string {
  return readFileSync(join(process.cwd(), '.agents', 'skills', 'melhoria.md'), 'utf-8')
}

async function coletarMetricas(tenantId: string, inicio: Date, fim: Date) {
  const [osAbertas, osEncerradas, todasOs, escalas, logsCopiloto, anomalias] =
    await Promise.all([
      prisma.ordemServico.count({
        where: { tenantId, createdAt: { gte: inicio, lte: fim } },
      }),
      prisma.ordemServico.count({
        where: { tenantId, status: 'encerrada', resolvidaEm: { gte: inicio, lte: fim } },
      }),
      prisma.ordemServico.findMany({
        where: { tenantId, createdAt: { gte: inicio, lte: fim } },
        select: {
          intencao: true,
          canal: true,
          urgencia: true,
          resolvidaEm: true,
          createdAt: true,
          escalaHumano: true,
        },
      }),
      prisma.ordemServico.count({
        where: { tenantId, escalaHumano: true, createdAt: { gte: inicio, lte: fim } },
      }),
      prisma.logAgente.findMany({
        where: { tenantId, agente: 'copiloto', createdAt: { gte: inicio, lte: fim } },
        select: { sucesso: true },
      }),
      prisma.logAgente.findMany({
        where: { tenantId, agente: 'monitor', sucesso: false, createdAt: { gte: inicio, lte: fim } },
        select: { erroMsg: true },
      }),
    ])

  const resolvidas = todasOs.filter((os) => os.resolvidaEm)
  const tempoMedioHoras =
    resolvidas.length > 0
      ? resolvidas.reduce((acc, os) => {
          const diff = os.resolvidaEm!.getTime() - os.createdAt.getTime()
          return acc + diff / 1000 / 60 / 60
        }, 0) / resolvidas.length
      : 0

  const porIntencao = todasOs.reduce(
    (acc, os) => ({ ...acc, [os.intencao]: (acc[os.intencao] ?? 0) + 1 }),
    {} as Record<string, number>
  )
  const porCanal = todasOs.reduce(
    (acc, os) => ({ ...acc, [os.canal]: (acc[os.canal] ?? 0) + 1 }),
    {} as Record<string, number>
  )
  const porUrgencia = todasOs.reduce(
    (acc, os) => ({ ...acc, [os.urgencia]: (acc[os.urgencia] ?? 0) + 1 }),
    {} as Record<string, number>
  )

  const taxaAceitacaoCopiloto =
    logsCopiloto.length > 0
      ? logsCopiloto.filter((l) => l.sucesso).length / logsCopiloto.length
      : 1

  const inicio30d = new Date(inicio)
  inicio30d.setDate(inicio30d.getDate() - 30)
  const [volume30d, encerradas30d] = await Promise.all([
    prisma.ordemServico.count({
      where: { tenantId, createdAt: { gte: inicio30d, lt: inicio } },
    }),
    prisma.ordemServico.count({
      where: { tenantId, status: 'encerrada', resolvidaEm: { gte: inicio30d, lt: inicio } },
    }),
  ])

  const variacaoVolume =
    volume30d > 0 ? ((osAbertas - volume30d) / volume30d) * 100 : 0
  const variacaoCancelamentos =
    encerradas30d > 0 ? ((osEncerradas - encerradas30d) / encerradas30d) * 100 : 0

  return {
    periodo: { inicio: inicio.toISOString(), fim: fim.toISOString() },
    metricas: {
      total_os_abertas: osAbertas,
      total_os_encerradas: osEncerradas,
      tempo_medio_resolucao_horas: Math.round(tempoMedioHoras * 10) / 10,
      taxa_resolucao_primeiro_contato: osAbertas > 0 ? osEncerradas / osAbertas : 0,
      os_por_intencao: porIntencao,
      os_por_canal: porCanal,
      os_por_urgencia: porUrgencia,
      taxa_escala_humano: osAbertas > 0 ? escalas / osAbertas : 0,
      taxa_aceitacao_copiloto: taxaAceitacaoCopiloto,
    },
    anomalias: anomalias.map((a) => a.erroMsg ?? '').filter(Boolean),
    comparativo_30d: {
      variacao_volume_pct: Math.round(variacaoVolume * 10) / 10,
      variacao_tempo_resolucao_pct: 0,
      variacao_cancelamentos_pct: Math.round(variacaoCancelamentos * 10) / 10,
    },
  }
}

async function salvarRelatorio(tenantId: string, relatorio: object) {
  const dir = join(process.cwd(), 'database', 'relatorios', tenantId)
  mkdirSync(dir, { recursive: true })
  const nome = `melhoria_${new Date().toISOString().slice(0, 10)}.json`
  writeFileSync(join(dir, nome), JSON.stringify(relatorio, null, 2), 'utf-8')
  console.log(`Relatório salvo: database/relatorios/${tenantId}/${nome}`)
}

async function rodar() {
  const tenants = await prisma.tenant.findMany({
    where: { active: true },
    select: { id: true, name: true },
  })

  const fim = new Date()
  const inicio = new Date()
  inicio.setDate(inicio.getDate() - 7)

  for (const tenant of tenants) {
    console.log(`\nProcessando tenant: ${tenant.name}`)

    const metricas = await coletarMetricas(tenant.id, inicio, fim)
    const systemPrompt = carregarSystemPrompt()

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: JSON.stringify(metricas) }],
    })

    const texto = response.content[0].type === 'text' ? response.content[0].text : ''

    let relatorio: object
    try {
      relatorio = JSON.parse(texto)
    } catch {
      console.error(`Tenant ${tenant.name}: agente retornou output inválido`)
      console.error(texto)
      continue
    }

    await salvarRelatorio(tenant.id, relatorio)

    await prisma.logAgente.create({
      data: {
        tenantId: tenant.id,
        agente: 'melhoria',
        acao: 'relatorio_semanal',
        input: metricas,
        output: relatorio as object,
        sucesso: true,
      },
    })

    console.log(`Relatório gerado para ${tenant.name}`)
  }

  await prisma.$disconnect()
}

rodar().catch(async (err) => {
  console.error(err)
  await prisma.$disconnect()
  process.exit(1)
})
