import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/Badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { OPPORTUNITIES, ACTIVITIES, STAGES } from '@/lib/mock-data'
import { formatCurrency, formatDate, daysSince, getInitials, cn } from '@/lib/utils'
import { Phone, Mail, Video, MessageCircle, Clock, TrendingUp, Plus, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const typeIcons = { ligação: Phone, email: Mail, reunião: Video, whatsapp: MessageCircle, tarefa: Clock }

export default async function OportunidadePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const opp = OPPORTUNITIES.find((o) => o.id === id)
  if (!opp) notFound()

  const stage = STAGES.find((s) => s.id === opp.stage_id)
  const activities = ACTIVITIES.filter((a) => a.opportunity_id === opp.id)

  return (
    <div className="flex flex-col h-full">
      <Header title={opp.lead.company_name} subtitle={`Oportunidade • ${stage?.name}`} />

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <Link href="/pipeline" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-600">
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao Pipeline
        </Link>

        <div className="grid grid-cols-3 gap-4">
          {/* Info principal */}
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Detalhes da Oportunidade</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Valor</p>
                <p className="text-xl font-bold text-slate-900">{formatCurrency(opp.value)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Etapa</p>
                <Badge className={cn(stage?.bgColor, stage?.color, 'border-0')}>{stage?.name}</Badge>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Responsável</p>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs bg-indigo-100 text-indigo-700">
                      {getInitials(opp.assignee.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-slate-800">{opp.assignee.name}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Previsão de Fechamento</p>
                <p className="text-sm font-medium text-slate-800">{formatDate(opp.expected_close_date)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Última Interação</p>
                <p className="text-sm font-medium text-slate-800">
                  {formatDate(opp.last_interaction)} ({daysSince(opp.last_interaction)}d atrás)
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Risco</p>
                <Badge variant={opp.risk_level === 'baixo' ? 'success' : opp.risk_level === 'medio' ? 'warning' : 'destructive'}>
                  {opp.risk_level === 'baixo' ? 'Baixo' : opp.risk_level === 'medio' ? 'Médio' : 'Alto'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Score */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-indigo-500" />
                <CardTitle>Score IA</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className={cn(
                'h-24 w-24 rounded-full flex items-center justify-center text-3xl font-black border-4',
                opp.score >= 70 ? 'border-green-400 text-green-600' : opp.score >= 40 ? 'border-amber-400 text-amber-600' : 'border-red-400 text-red-600'
              )}>
                {opp.score}
              </div>
              <p className="text-xs text-slate-500 mt-3 text-center">
                {opp.score >= 70 ? 'Alta chance de fechamento' : opp.score >= 40 ? 'Oportunidade em atenção' : 'Alto risco de perda'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Histórico */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Histórico de Interações</CardTitle>
              <Button size="sm" variant="outline" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Registrar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Nenhuma interação registrada.</p>
            ) : (
              <div className="space-y-4">
                {activities.map((act) => {
                  const Icon = typeIcons[act.type]
                  return (
                    <div key={act.id} className="flex gap-3">
                      <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-xs capitalize">{act.type}</Badge>
                          <span className="text-xs text-slate-400">{formatDate(act.created_at)}</span>
                          {act.user && <span className="text-xs text-slate-500">por {act.user.name}</span>}
                        </div>
                        <p className="text-sm text-slate-700">{act.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
