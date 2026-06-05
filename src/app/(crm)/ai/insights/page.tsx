import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ALERTS, OPPORTUNITIES, SELLER_STATS } from '@/lib/mock-data'
import { formatCurrency, daysSince, cn } from '@/lib/utils'
import { Sparkles, AlertTriangle, TrendingUp, Brain, Zap, Clock } from 'lucide-react'

export default function InsightsPage() {
  const atRisk = OPPORTUNITIES.filter((o) => o.risk_level === 'alto' && o.status === 'aberta')
  const healthy = OPPORTUNITIES.filter((o) => o.risk_level === 'baixo' && o.status === 'aberta')

  const insights = [
    {
      icon: TrendingUp,
      title: 'Oportunidades acima de R$ 30k convertem 70% mais quando a proposta é enviada em até 48h.',
      type: 'insight' as const,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50 border-indigo-100',
    },
    {
      icon: Brain,
      title: 'Carlos Mendes tem a maior taxa de conversão (41,7%) quando o lead vem por indicação.',
      type: 'insight' as const,
      color: 'text-violet-600',
      bg: 'bg-violet-50 border-violet-100',
    },
    {
      icon: Zap,
      title: 'Leads do segmento Saúde têm tempo médio de fechamento 30% menor que a média.',
      type: 'insight' as const,
      color: 'text-green-600',
      bg: 'bg-green-50 border-green-100',
    },
    {
      icon: Clock,
      title: 'Pedro Alves tem o maior ciclo de vendas médio (42 dias). Recomenda-se coaching de urgência.',
      type: 'warning' as const,
      color: 'text-amber-600',
      bg: 'bg-amber-50 border-amber-100',
    },
  ]

  return (
    <div className="flex flex-col h-full">
      <Header title="IA Insights" subtitle="Inteligência comercial gerada automaticamente" />

      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
        {/* Score das oportunidades */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-500" />
              <CardTitle>Score das Oportunidades</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {OPPORTUNITIES
                .filter((o) => o.status === 'aberta')
                .sort((a, b) => b.score - a.score)
                .map((opp) => (
                  <div key={opp.id} className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-slate-900">{opp.lead.company_name}</p>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'text-xs font-bold',
                            opp.score >= 70 ? 'text-green-600' : opp.score >= 40 ? 'text-amber-600' : 'text-red-500'
                          )}>
                            {opp.score}/100
                          </span>
                          <Badge variant={
                            opp.risk_level === 'baixo' ? 'success' : opp.risk_level === 'medio' ? 'warning' : 'destructive'
                          }>
                            {opp.risk_level === 'baixo' ? 'Saudável' : opp.risk_level === 'medio' ? 'Atenção' : 'Risco Alto'}
                          </Badge>
                        </div>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            opp.score >= 70 ? 'bg-green-500' : opp.score >= 40 ? 'bg-amber-400' : 'bg-red-500'
                          )}
                          style={{ width: `${opp.score}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {opp.assignee.name} • {formatCurrency(opp.value)} • {daysSince(opp.last_interaction)}d sem interação
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Alertas */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <CardTitle>Alertas Ativos</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {ALERTS.map((alert) => (
              <div key={alert.id} className={cn(
                'flex items-start gap-3 p-4 rounded-xl border',
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
                <div>
                  <p className="text-sm font-medium text-slate-800">{alert.message}</p>
                  {alert.opportunity && (
                    <p className="text-xs text-slate-500 mt-1">
                      {formatCurrency(alert.opportunity.value)} • Responsável: {alert.opportunity.assignee.name}
                    </p>
                  )}
                </div>
                <Badge
                  variant={alert.type === 'danger' ? 'destructive' : alert.type === 'warning' ? 'warning' : 'default'}
                  className="ml-auto shrink-0"
                >
                  {alert.type === 'danger' ? 'Urgente' : alert.type === 'warning' ? 'Atenção' : 'Info'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Insights da IA */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-violet-500" />
              <CardTitle>Insights Gerados pela IA</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.map((insight, i) => {
              const Icon = insight.icon
              return (
                <div key={i} className={cn('flex items-start gap-3 p-4 rounded-xl border', insight.bg)}>
                  <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', insight.color)} />
                  <p className="text-sm text-slate-800">{insight.title}</p>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
