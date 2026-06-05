'use client'

import { useUser } from '@/contexts/user-context'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  TrendingUp, AlertTriangle, Trophy, Clock, DollarSign, ArrowRight, CheckSquare,
} from 'lucide-react'
import Link from 'next/link'
import {
  OPPORTUNITIES, ALERTS, SELLER_STATS, TASKS,
  getTotalPipelineValue, getAtRiskOpportunities,
} from '@/lib/mock-data'
import { formatCurrency, daysSince, getInitials, cn } from '@/lib/utils'

export default function DashboardPage() {
  const { currentUser } = useUser()
  const isGestor = currentUser?.role === 'gestor'

  const myOpps = isGestor
    ? OPPORTUNITIES
    : OPPORTUNITIES.filter((o) => o.assigned_to === currentUser?.id)

  const myTasks = isGestor
    ? TASKS
    : TASKS.filter((t) => t.assigned_to === currentUser?.id)

  const openOpps = myOpps.filter((o) => o.status === 'aberta')
  const totalPipeline = getTotalPipelineValue(myOpps)
  const atRisk = getAtRiskOpportunities(myOpps)
  const pendingTasks = myTasks.filter((t) => !t.done)

  const forecastValue = openOpps.reduce((sum, o) => sum + (o.value * o.score) / 100, 0)

  const myStats = isGestor
    ? null
    : SELLER_STATS.find((s) => s.user.id === currentUser?.id)

  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <div className="flex flex-col h-full">
      <Header
        title={isGestor ? 'Dashboard' : `Olá, ${currentUser?.name.split(' ')[0]}`}
        subtitle={`${today}${!isGestor ? ' — suas métricas' : ''}`}
      />

      <div className="flex-1 p-4 lg:p-6 space-y-5 overflow-y-auto">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-500 font-medium">
                  {isGestor ? 'Pipeline Total' : 'Meu Pipeline'}
                </p>
                <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-indigo-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalPipeline)}</p>
              <p className="text-xs text-slate-500 mt-1">{openOpps.length} oportunidades abertas</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-500 font-medium">Forecast do Mês</p>
                <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(forecastValue)}</p>
              <p className="text-xs text-slate-500 mt-1">Baseado no score das oportunidades</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-500 font-medium">Em Risco</p>
                <div className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </div>
              </div>
              <p className="text-2xl font-bold text-red-600">{atRisk.length}</p>
              <p className="text-xs text-slate-500 mt-1">Oportunidades sem interação</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-500 font-medium">Tarefas Pendentes</p>
                <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-amber-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900">{pendingTasks.length}</p>
              <p className="text-xs text-slate-500 mt-1">Para hoje e próximos dias</p>
            </CardContent>
          </Card>
        </div>

        {/* Linha de meta — só para vendedor */}
        {!isGestor && myStats && (
          <Card className="border-indigo-100 bg-indigo-50/50">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Progresso da Meta Mensal</p>
                  <p className="text-xs text-slate-500">
                    {formatCurrency(myStats.total_value)} de {formatCurrency(parseFloat(String(currentUser?.meta ?? 0)))}
                  </p>
                </div>
                <p className={cn(
                  'text-2xl font-black',
                  myStats.conversion_rate >= 35 ? 'text-green-600' : myStats.conversion_rate >= 25 ? 'text-amber-600' : 'text-red-500'
                )}>
                  {Math.min((myStats.total_value / (parseFloat(String(currentUser?.meta ?? 1)) || 1)) * 100, 100).toFixed(0)}%
                </p>
              </div>
              <div className="h-2.5 bg-white rounded-full overflow-hidden border border-indigo-100">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    myStats.conversion_rate >= 35 ? 'bg-green-500' : myStats.conversion_rate >= 25 ? 'bg-amber-400' : 'bg-red-400'
                  )}
                  style={{ width: `${Math.min((myStats.total_value / (parseFloat(String(currentUser?.meta ?? 1)) || 1)) * 100, 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 overflow-hidden">
          {/* Alertas — gestor vê todos, vendedor vê só os seus */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {isGestor ? 'Alertas da IA' : 'Seus Alertas'}
                </CardTitle>
                {isGestor && (
                  <Link href="/ai/insights" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
                    Ver todos <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {ALERTS.filter((a) =>
                isGestor || myOpps.some((o) => o.id === a.opportunity_id)
              ).map((alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg border',
                    alert.type === 'danger' && 'bg-red-50 border-red-100',
                    alert.type === 'warning' && 'bg-amber-50 border-amber-100',
                    alert.type === 'info' && 'bg-indigo-50 border-indigo-100',
                  )}
                >
                  <AlertTriangle className={cn(
                    'h-4 w-4 mt-0.5 shrink-0',
                    alert.type === 'danger' && 'text-red-500',
                    alert.type === 'warning' && 'text-amber-500',
                    alert.type === 'info' && 'text-indigo-500',
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800">{alert.message}</p>
                    {alert.opportunity && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        {alert.opportunity.lead.company_name} • {formatCurrency(alert.opportunity.value)}
                      </p>
                    )}
                  </div>
                  {alert.type === 'danger' && (
                    <Badge variant="destructive" className="shrink-0">Urgente</Badge>
                  )}
                </div>
              ))}
              {ALERTS.filter((a) => isGestor || myOpps.some((o) => o.id === a.opportunity_id)).length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">Nenhum alerta no momento.</p>
              )}
            </CardContent>
          </Card>

          {/* Ranking (gestor) ou Tarefas do dia (vendedor) */}
          {isGestor ? (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Ranking Vendedores</CardTitle>
                  <Trophy className="h-4 w-4 text-amber-500" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {SELLER_STATS.map((stat, i) => (
                  <div key={stat.user.id} className="flex items-center gap-3">
                    <span className={cn(
                      'text-xs font-bold w-5 text-center',
                      i === 0 && 'text-amber-500',
                      i === 1 && 'text-slate-400',
                      i === 2 && 'text-orange-400',
                      i > 2 && 'text-slate-300',
                    )}>
                      {i + 1}
                    </span>
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-xs bg-indigo-100 text-indigo-700">
                        {getInitials(stat.user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {stat.user.name.split(' ')[0]}
                      </p>
                      <p className="text-xs text-slate-500">{stat.conversion_rate.toFixed(0)}% conversão</p>
                    </div>
                    <p className="text-xs font-semibold text-slate-700">{stat.won}✓</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Suas Tarefas</CardTitle>
                  <Link href="/tarefas" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
                    Ver todas <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {pendingTasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-start gap-2 py-1.5 border-b border-slate-50 last:border-0">
                    <CheckSquare className="h-4 w-4 text-slate-300 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-800 leading-tight">{task.title}</p>
                    </div>
                    <Badge
                      variant={task.priority === 'alta' ? 'destructive' : task.priority === 'media' ? 'warning' : 'secondary'}
                      className="text-[10px] shrink-0"
                    >
                      {task.priority}
                    </Badge>
                  </div>
                ))}
                {pendingTasks.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-4">Sem tarefas pendentes!</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Oportunidades */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {isGestor ? 'Oportunidades Abertas' : 'Minhas Oportunidades'}
              </CardTitle>
              <Link href="/pipeline" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
                Ver pipeline <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {openOpps.slice(0, 5).map((opp) => (
                <div key={opp.id} className="flex items-center gap-4 py-2 border-b border-slate-50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">{opp.lead.company_name}</p>
                    {isGestor && <p className="text-xs text-slate-500">{opp.assignee.name}</p>}
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{formatCurrency(opp.value)}</p>
                  <div className="flex items-center gap-1">
                    <div className={cn(
                      'h-2 w-2 rounded-full',
                      opp.risk_level === 'baixo' && 'bg-green-500',
                      opp.risk_level === 'medio' && 'bg-amber-400',
                      opp.risk_level === 'alto' && 'bg-red-500',
                    )} />
                    <span className="text-xs text-slate-500 w-16">Score {opp.score}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {daysSince(opp.last_interaction)}d atrás
                  </Badge>
                </div>
              ))}
              {openOpps.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">Nenhuma oportunidade aberta.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
