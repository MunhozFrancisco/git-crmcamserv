import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Inbox,
  Loader2,
  Zap,
} from 'lucide-react'

const urgenciaCor: Record<string, string> = {
  alta:  'bg-red-100 text-red-700',
  media: 'bg-yellow-100 text-yellow-700',
  baixa: 'bg-green-100 text-green-700',
}

const statusLabel: Record<string, string> = {
  aberta:       'Aberta',
  em_andamento: 'Em andamento',
  encerrada:    'Encerrada',
}

export default async function MonitorPage() {
  const session = await getServerSession(authOptions)
  if (!session) return notFound()

  const tenantId = session.user.tenantId
  const agora = new Date()
  const inicioDia = new Date(agora)
  inicioDia.setHours(0, 0, 0, 0)
  const limiteHoras = new Date(agora)
  limiteHoras.setHours(limiteHoras.getHours() - 4)

  const [
    osAbertas,
    osEmAndamento,
    osEncerradasHoje,
    osUrgenciaAlta,
    encerradasDetalhes,
    osAtivasRecentes,
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
      where: { tenantId, status: 'encerrada', resolvidaEm: { gte: inicioDia } },
      select: { createdAt: true, resolvidaEm: true },
    }),
    prisma.ordemServico.findMany({
      where: { tenantId, status: { in: ['aberta', 'em_andamento'] } },
      orderBy: { createdAt: 'asc' },
      take: 10,
      include: {
        client: { select: { name: true } },
        interacoes: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true },
        },
      },
    }),
  ])

  const tempoMedioHoras =
    encerradasDetalhes.length > 0
      ? encerradasDetalhes.reduce((acc, os) => {
          const diff = os.resolvidaEm!.getTime() - os.createdAt.getTime()
          return acc + diff / 1000 / 60 / 60
        }, 0) / encerradasDetalhes.length
      : null

  const osSemResposta = osAtivasRecentes.filter((os) => {
    const ref = os.interacoes[0]?.createdAt ?? os.createdAt
    return ref < limiteHoras
  })

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Monitor IA</h1>
        <p className="text-sm text-gray-500 mt-1">
          KPIs de atendimento em tempo real —{' '}
          {agora.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500 font-medium">OS Abertas</p>
              <Inbox className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{osAbertas}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500 font-medium">Em Andamento</p>
              <Loader2 className="h-4 w-4 text-yellow-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{osEmAndamento}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500 font-medium">Encerradas Hoje</p>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-green-600">{osEncerradasHoje}</p>
          </CardContent>
        </Card>

        <Card className={osUrgenciaAlta > 0 ? 'border-red-200' : ''}>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500 font-medium">Urgência Alta</p>
              <AlertTriangle className={`h-4 w-4 ${osUrgenciaAlta > 0 ? 'text-red-500' : 'text-gray-300'}`} />
            </div>
            <p className={`text-3xl font-bold ${osUrgenciaAlta > 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {osUrgenciaAlta}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500 font-medium">Tempo Médio</p>
              <Clock className="h-4 w-4 text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {tempoMedioHoras !== null ? `${tempoMedioHoras.toFixed(1)}h` : '—'}
            </p>
            <p className="text-xs text-gray-400 mt-1">resolução hoje</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerta OS sem resposta */}
      {osSemResposta.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-red-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {osSemResposta.length} OS sem resposta há mais de 4 horas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {osSemResposta.map((os) => (
              <div
                key={os.id}
                className="flex items-center justify-between bg-white border border-red-100 rounded-lg px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{os.client.name}</p>
                  <p className="text-xs text-gray-400">
                    protocolo #{os.id.slice(0, 8)} · {os.canal}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${urgenciaCor[os.urgencia]}`}>
                    {os.urgencia.toUpperCase()}
                  </span>
                  <Badge variant="destructive" className="text-xs">
                    Sem resposta
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Lista de OS ativas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            OS Ativas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {osAtivasRecentes.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              Nenhuma OS ativa no momento.
            </p>
          ) : (
            <ul className="space-y-2">
              {osAtivasRecentes.map((os) => {
                const ultimaInteracao = os.interacoes[0]
                const semResposta = ultimaInteracao
                  ? ultimaInteracao.createdAt < limiteHoras
                  : os.createdAt < limiteHoras

                return (
                  <li
                    key={os.id}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg border ${
                      semResposta ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-white'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{os.client.name}</p>
                      <p className="text-xs text-gray-400">
                        #{os.id.slice(0, 8)} · {os.canal} ·{' '}
                        {ultimaInteracao
                          ? new Date(ultimaInteracao.createdAt).toLocaleString('pt-BR', {
                              timeStyle: 'short',
                              dateStyle: 'short',
                            })
                          : 'sem interação'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${urgenciaCor[os.urgencia]}`}>
                        {os.urgencia.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">{statusLabel[os.status]}</span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
