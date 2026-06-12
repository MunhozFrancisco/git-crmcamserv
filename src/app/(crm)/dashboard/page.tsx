'use client'

import { useUser } from '@/contexts/user-context'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  TrendingUp, AlertTriangle, Trophy, Clock, DollarSign, ArrowRight, CheckSquare,
  TrendingDown, Target, CalendarCheck,
} from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { formatCurrency, daysSince, getInitials, cn } from '@/lib/utils'
import type { Alert } from '@/types'

type OppRow = {
  id: string
  value: number
  status: string
  score: number
  risk_level: string
  last_interaction: string
  assigned_to: string
  client?: { name: string }
  assignee?: { name: string }
}

type TaskRow = { id: string; title: string; priority: string; done: boolean; assigned_to: string }
type UserRow = { id: string; name: string; meta: number }

export default function DashboardPage() {
  const { currentUser } = useUser()
  const isGestor = currentUser?.role === 'gestor'

  const [opps, setOpps] = useState<OppRow[]>([])
  const [tasks, setTasks] = useState<TaskRow[]>([])
  const [users, setUsers] = useState<UserRow[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])

  useEffect(() => {
    Promise.all([
      fetch('/api/opportunities').then(r => r.ok ? r.json() : []),
      fetch('/api/tasks').then(r => r.ok ? r.json() : []),
      fetch('/api/users').then(r => r.ok ? r.json() : []),
      fetch('/api/alerts').then(r => r.ok ? r.json() : []),
    ]).then(([oppsData, tasksData, usersData, alertsData]) => {
      setOpps(oppsData.map((o: Record<string, unknown>) => ({
        id: o.id,
        value: Number(o.value ?? 0),
        status: o.status,
        score: Number(o.score ?? 0),
        risk_level: o.riskLevel ?? o.risk_level,
        last_interaction: (o.lastInteraction ?? o.last_interaction ?? '') as string,
        assigned_to: (o.assignedTo ?? o.assigned_to) as string,
        client: o.client as { name: string } | undefined,
        assignee: o.assignee as { name: string } | undefined,
      })))
      setTasks(tasksData.map((t: Record<string, unknown>) => ({
        id: t.id as string,
        title: t.title as string,
        priority: t.priority as string,
        done: t.done as boolean,
        assigned_to: (t.assignedTo ?? t.assigned_to) as string,
      })))
      setUsers(usersData.map((u: Record<string, unknown>) => ({
        id: u.id as string,
        name: u.name as string,
        meta: Number(u.meta ?? 0),
      })))
      setAlerts(alertsData.map((a: Record<string, unknown>) => ({
        id: a.id as string,
        opportunity_id: (a.opportunityId ?? a.opportunity_id) as string,
        message: a.message as string,
        type: a.type as 'warning' | 'danger' | 'info',
        resolved: (a.resolved ?? false) as boolean,
        created_at: (a.createdAt ?? a.created_at ?? '') as string,
        opportunity: a.opportunity as { id?: string; client?: { name?: string } } | undefined,
      })))
    })
  }, [])

  const myOpps = isGestor ? opps : opps.filter(o => o.assigned_to === currentUser?.id)
  const myTasks = isGestor ? tasks : tasks.filter(t => t.assigned_to === currentUser?.id)

  const openOpps = myOpps.filter(o => o.status === 'aberta')
  const wonOpps = myOpps.filter(o => o.status === 'ganha')
  const lostOpps = myOpps.filter(o => o.status === 'perdida')
  const pendingTasks = myTasks.filter(t => !t.done)

  const totalPipeline = openOpps.reduce((s, o) => s + o.value, 0)
  const totalGanho = wonOpps.reduce((s, o) => s + o.value, 0)
  const totalPerdido = lostOpps.reduce((s, o) => s + o.value, 0)
  const forecastValue = openOpps.reduce((s, o) => s + (o.value * o.score) / 100, 0)
  const atRisk = openOpps.filter(o => daysSince(typeof o.last_interaction === 'string' ? o.last_interaction.split('T')[0] : '') > 7)

  // Meta mensal e anual
  const now = new Date()
  const metaMensal = isGestor
    ? users.reduce((s, u) => s + u.meta, 0)
    : (currentUser?.meta ? Number(currentUser.meta) : 0)
  const metaAnual = metaMensal * 12

  // Ganho no mês atual
  const ganhoMes = wonOpps.reduce((s, o) => s + o.value, 0)
  const ganhoAno = ganhoMes
  const faltaMes = Math.max(metaMensal - ganhoMes, 0)
  const faltaAno = Math.max(metaAnual - ganhoAno, 0)

  const today = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="flex flex-col h-full">
      <Header
        title={isGestor ? 'Dashboard' : `Olá, ${currentUser?.name.split(' ')[0]}`}
        subtitle={`${today}${!isGestor ? ' — suas métricas' : ''}`}
      />

      <div className="flex-1 p-4 lg:p-6 space-y-5 overflow-y-auto">
        {/* KPI Cards — linha 1 */}
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
              <p className="text-xs text-slate-500 mt-1">Sem interação há +7 dias</p>
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

        {/* KPI Cards — linha 2: Ganho, Perdido, Falta Mês, Falta Ano */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-green-100">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-500 font-medium">Total Ganho</p>
                <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalGanho)}</p>
              <p className="text-xs text-slate-500 mt-1">{wonOpps.length} negócio{wonOpps.length !== 1 ? 's' : ''} fechado{wonOpps.length !== 1 ? 's' : ''}</p>
            </CardContent>
          </Card>

          <Card className="border-red-100">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-500 font-medium">Total Perdido</p>
                <div className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                </div>
              </div>
              <p className="text-2xl font-bold text-red-500">{formatCurrency(totalPerdido)}</p>
              <p className="text-xs text-slate-500 mt-1">{lostOpps.length} oportunidade{lostOpps.length !== 1 ? 's' : ''} perdida{lostOpps.length !== 1 ? 's' : ''}</p>
            </CardContent>
          </Card>

          <Card className="border-amber-100">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-500 font-medium">Falta para o Mês</p>
                <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Target className="h-4 w-4 text-amber-600" />
                </div>
              </div>
              <p className={cn('text-2xl font-bold', faltaMes === 0 ? 'text-green-600' : 'text-amber-600')}>
                {faltaMes === 0 ? 'Meta atingida!' : formatCurrency(faltaMes)}
              </p>
              <p className="text-xs text-slate-500 mt-1">Meta: {formatCurrency(metaMensal)}</p>
            </CardContent>
          </Card>

          <Card className="border-indigo-100">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-500 font-medium">Falta para o Ano</p>
                <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <CalendarCheck className="h-4 w-4 text-indigo-600" />
                </div>
              </div>
              <p className={cn('text-2xl font-bold', faltaAno === 0 ? 'text-green-600' : 'text-indigo-600')}>
                {faltaAno === 0 ? 'Meta atingida!' : formatCurrency(faltaAno)}
              </p>
              <p className="text-xs text-slate-500 mt-1">Meta anual: {formatCurrency(metaAnual)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Barra de meta — vendedor */}
        {!isGestor && metaMensal > 0 && (
          <Card className="border-indigo-100 bg-indigo-50/50">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Progresso da Meta Mensal</p>
                  <p className="text-xs text-slate-500">
                    {formatCurrency(ganhoMes)} de {formatCurrency(metaMensal)}
                  </p>
                </div>
                <p className={cn(
                  'text-2xl font-black',
                  (ganhoMes / metaMensal) >= 0.35 ? 'text-green-600' : (ganhoMes / metaMensal) >= 0.25 ? 'text-amber-600' : 'text-red-500'
                )}>
                  {Math.min((ganhoMes / (metaMensal || 1)) * 100, 100).toFixed(0)}%
                </p>
              </div>
              <div className="h-2.5 bg-white rounded-full overflow-hidden border border-indigo-100">
                <div className={cn(
                  'h-full rounded-full transition-all',
                  (ganhoMes / metaMensal) >= 0.35 ? 'bg-green-500' : (ganhoMes / metaMensal) >= 0.25 ? 'bg-amber-400' : 'bg-red-400'
                )} style={{ width: `${Math.min((ganhoMes / (metaMensal || 1)) * 100, 100)}%` }} />
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 overflow-hidden">
          {/* Alertas */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {isGestor ? 'Alertas da IA' : 'Seus Alertas'}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {alerts.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">Nenhum alerta no momento.</p>
              ) : (
                alerts.slice(0, 5).map(alert => (
                  <div key={alert.id} className={cn(
                    'flex items-start gap-3 p-3 rounded-lg border',
                    alert.type === 'danger' && 'bg-red-50 border-red-100',
                    alert.type === 'warning' && 'bg-amber-50 border-amber-100',
                    alert.type === 'info' && 'bg-indigo-50 border-indigo-100',
                  )}>
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
                          {(alert.opportunity as { client?: { name?: string } }).client?.name ?? '—'}
                        </p>
                      )}
                    </div>
                    {alert.type === 'danger' && (
                      <Badge variant="destructive" className="shrink-0">Urgente</Badge>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Ranking (gestor) ou Tarefas (vendedor) */}
          {isGestor ? (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Ranking Vendedores</CardTitle>
                  <Trophy className="h-4 w-4 text-amber-500" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {users.filter(u => u.id !== currentUser?.id).slice(0, 5).map((u, i) => {
                  const userWon = opps.filter(o => o.status === 'ganha' && o.assigned_to === u.id)
                  const userWonVal = userWon.reduce((s, o) => s + o.value, 0)
                  const progress = u.meta > 0 ? Math.min((userWonVal / u.meta) * 100, 100) : 0
                  return (
                    <div key={u.id} className="flex items-center gap-3">
                      <span className={cn('text-xs font-bold w-5 text-center',
                        i === 0 && 'text-amber-500', i === 1 && 'text-slate-400',
                        i === 2 && 'text-orange-400', i > 2 && 'text-slate-300'
                      )}>{i + 1}</span>
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="text-xs bg-indigo-100 text-indigo-700">
                          {getInitials(u.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{u.name.split(' ')[0]}</p>
                        <p className="text-xs text-slate-500">{progress.toFixed(0)}% da meta</p>
                      </div>
                      <p className="text-xs font-semibold text-green-600">{userWon.length}✓</p>
                    </div>
                  )
                })}
                {users.filter(u => u.id !== currentUser?.id).length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-4">Nenhum vendedor cadastrado.</p>
                )}
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
                {pendingTasks.slice(0, 5).map(task => (
                  <div key={task.id} className="flex items-start gap-2 py-1.5 border-b border-slate-50 last:border-0">
                    <CheckSquare className="h-4 w-4 text-slate-300 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-800 leading-tight">{task.title}</p>
                    </div>
                    <Badge variant={task.priority === 'alta' ? 'destructive' : task.priority === 'media' ? 'warning' : 'secondary'}
                      className="text-[10px] shrink-0">
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

        {/* Oportunidades abertas */}
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
              {openOpps.slice(0, 5).map(opp => (
                <div key={opp.id} className="flex items-center gap-4 py-2 border-b border-slate-50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">{opp.client?.name ?? '—'}</p>
                    {isGestor && <p className="text-xs text-slate-500">{opp.assignee?.name ?? ''}</p>}
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{formatCurrency(opp.value)}</p>
                  <div className="flex items-center gap-1">
                    <div className={cn('h-2 w-2 rounded-full',
                      opp.risk_level === 'baixo' && 'bg-green-500',
                      opp.risk_level === 'medio' && 'bg-amber-400',
                      opp.risk_level === 'alto' && 'bg-red-500',
                    )} />
                    <span className="text-xs text-slate-500 w-16">Score {opp.score}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {daysSince(typeof opp.last_interaction === 'string' ? opp.last_interaction.split('T')[0] : '')}d atrás
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
