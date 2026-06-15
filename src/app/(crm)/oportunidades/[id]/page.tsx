'use client'

import { useState, useEffect, use } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import type { Activity, Stage } from '@/types'
import { formatCurrency, formatDate, daysSince, getInitials, cn } from '@/lib/utils'
import {
  Phone, Mail, Video, MessageCircle, Clock, TrendingUp,
  Plus, ArrowLeft, Loader2, Calendar,
} from 'lucide-react'
import Link from 'next/link'

const typeIcons = {
  'ligação': Phone, email: Mail, 'reunião': Video,
  whatsapp: MessageCircle, tarefa: Clock,
}

type OppDetail = {
  id: string
  value: number
  status: string
  score: number
  risk_level: string
  expected_close_date: string
  next_interaction_date: string | null
  last_interaction: string
  client?: { id: string; name: string }
  stage?: Stage
  assignee?: { id: string; name: string }
}

function NovaInteracaoModal({
  open, onOpenChange, opportunityId, onSave,
}: {
  open: boolean; onOpenChange: (v: boolean) => void
  opportunityId: string; onSave: (a: Activity) => void
}) {
  const [type, setType] = useState<Activity['type']>('ligação')
  const [interactionDate, setInteractionDate] = useState(new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setType('ligação')
      setInteractionDate(new Date().toISOString().split('T')[0])
      setDescription('')
      setError('')
    }
  }, [open])

  async function handleSave() {
    if (!description.trim()) return
    setSaving(true); setError('')
    try {
      const res = await fetch(`/api/opportunities/${opportunityId}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, description, interaction_date: interactionDate }),
      })
      if (!res.ok) throw new Error()
      const saved = await res.json()
      onSave({
        id: saved.id,
        opportunity_id: saved.opportunityId,
        user_id: saved.userId,
        type: saved.type,
        description: saved.description,
        created_at: saved.createdAt,
        user: saved.user,
      })
      onOpenChange(false)
    } catch {
      setError('Erro ao registrar interação.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Interação</DialogTitle>
          <DialogDescription>Documente o contato realizado com o cliente.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Data do Contato *</Label>
              <Input
                type="date"
                value={interactionDate}
                onChange={e => setInteractionDate(e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-1.5 block">Tipo</Label>
              <select value={type} onChange={e => setType(e.target.value as Activity['type'])}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="ligação">Ligação</option>
                <option value="email">E-mail</option>
                <option value="reunião">Reunião</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="tarefa">Tarefa</option>
              </select>
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block">Descrição do Contato *</Label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Descreva o que foi falado, combinado com o cliente..."
              rows={5}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <DialogFooter className="gap-2 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!description.trim() || !interactionDate || saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Registrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function NovaInteracaoInline({
  opportunityId, onSave,
}: {
  opportunityId: string
  onSave: (a: Activity) => void
}) {
  const [type, setType] = useState<Activity['type']>('ligação')
  const [interactionDate, setInteractionDate] = useState(new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    if (!description.trim() || !interactionDate) return
    setSaving(true); setError('')
    try {
      const res = await fetch(`/api/opportunities/${opportunityId}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, description, interaction_date: interactionDate }),
      })
      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg)
      }
      const saved = await res.json()
      onSave({
        id: saved.id,
        opportunity_id: saved.opportunityId,
        user_id: saved.userId,
        type: saved.type,
        description: saved.description,
        created_at: saved.createdAt,
        user: saved.user,
      })
      setDescription('')
      setInteractionDate(new Date().toISOString().split('T')[0])
      setType('ligação')
    } catch (e) {
      setError(`Erro ao registrar interação: ${(e as Error).message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="border-indigo-200">
      <CardHeader>
        <CardTitle className="text-base">Registrar Contato com o Cliente</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="mb-1.5 block text-sm font-medium text-slate-700">Data do Contato</Label>
            <Input
              type="date"
              value={interactionDate}
              onChange={e => setInteractionDate(e.target.value)}
            />
          </div>
          <div>
            <Label className="mb-1.5 block text-sm font-medium text-slate-700">Tipo</Label>
            <select
              value={type}
              onChange={e => setType(e.target.value as Activity['type'])}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ligação">Ligação</option>
              <option value="email">E-mail</option>
              <option value="reunião">Reunião</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="tarefa">Tarefa</option>
            </select>
          </div>
        </div>
        <div>
          <Label className="mb-1.5 block text-sm font-medium text-slate-700">Descrição do Contato</Label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Descreva o que foi falado, combinado com o cliente..."
            rows={6}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={!description.trim() || !interactionDate || saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            <Plus className="h-4 w-4 mr-1.5" />
            Salvar Interação
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function OportunidadePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [opp, setOpp] = useState<OppDetail | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [nextDate, setNextDate] = useState('')
  const [savingDate, setSavingDate] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [oppRes, actRes] = await Promise.all([
        fetch(`/api/opportunities/${id}`),
        fetch(`/api/opportunities/${id}/activities`),
      ])
      if (oppRes.ok) {
        const data = await oppRes.json()
        const mapped: OppDetail = {
          id: data.id,
          value: Number(data.value),
          status: data.status,
          score: data.score,
          risk_level: data.riskLevel ?? data.risk_level,
          expected_close_date: data.expectedCloseDate ?? data.expected_close_date ?? '',
          next_interaction_date: data.nextInteractionDate ?? data.next_interaction_date ?? null,
          last_interaction: data.lastInteraction ?? data.last_interaction ?? '',
          client: data.client,
          stage: data.stage,
          assignee: data.assignee,
        }
        setOpp(mapped)
        setNextDate(mapped.next_interaction_date ?? '')
      }
      if (actRes.ok) {
        const acts = await actRes.json()
        setActivities(acts.map((a: Record<string, unknown>) => ({
          id: a.id,
          opportunity_id: a.opportunityId ?? a.opportunity_id,
          user_id: a.userId ?? a.user_id,
          type: a.type,
          description: a.description,
          created_at: a.createdAt ?? a.created_at,
          user: a.user,
        })))
      }
      setLoading(false)
    }
    load()
  }, [id])

  async function saveNextDate() {
    if (!opp) return
    setSavingDate(true)
    await fetch(`/api/opportunities/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ next_interaction_date: nextDate || null }),
    })
    setOpp(prev => prev ? { ...prev, next_interaction_date: nextDate || null } : prev)
    setSavingDate(false)
  }

  function addActivity(a: Activity) {
    setActivities(prev => [a, ...prev])
  }

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Oportunidade" subtitle="Carregando..." />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      </div>
    )
  }

  if (!opp) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Oportunidade" subtitle="Não encontrada" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-slate-500">Oportunidade não encontrada.</p>
        </div>
      </div>
    )
  }

  const stage = opp.stage

  return (
    <div className="flex flex-col h-full">
      <Header title={opp.client?.name ?? 'Oportunidade'} subtitle={`Oportunidade • ${stage?.name ?? '—'}`} />

      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
        <Link href="/pipeline" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-600">
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao Pipeline
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Info principal */}
          <Card className="lg:col-span-2">
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
                <Badge className={cn(stage?.bgColor, stage?.color, 'border-0')}>{stage?.name ?? '—'}</Badge>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Responsável</p>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs bg-indigo-100 text-indigo-700">
                      {getInitials(opp.assignee?.name ?? '?')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-slate-800">{opp.assignee?.name ?? '—'}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Previsão de Fechamento</p>
                <p className="text-sm font-medium text-slate-800">{formatDate(opp.expected_close_date)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Última Interação</p>
                <p className="text-sm font-medium text-slate-800">
                  {formatDate(opp.last_interaction)}
                  {opp.last_interaction && ` (${daysSince(opp.last_interaction)}d atrás)`}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Risco</p>
                <Badge variant={opp.risk_level === 'baixo' ? 'success' : opp.risk_level === 'medio' ? 'warning' : 'destructive'}>
                  {opp.risk_level === 'baixo' ? 'Baixo' : opp.risk_level === 'medio' ? 'Médio' : 'Alto'}
                </Badge>
              </div>

              {/* Próxima interação */}
              <div className="col-span-2">
                <Label className="text-xs text-slate-500 mb-1.5 flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Próxima Interação / Tarefa
                </Label>
                <div className="flex items-center gap-2">
                  <Input type="date" value={nextDate} onChange={e => setNextDate(e.target.value)}
                    className="max-w-48 h-8 text-sm" />
                  <Button size="sm" variant="outline" onClick={saveNextDate} disabled={savingDate}>
                    {savingDate ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Salvar'}
                  </Button>
                  {opp.next_interaction_date && (
                    <span className="text-xs text-indigo-600 font-medium">
                      {formatDate(opp.next_interaction_date)}
                    </span>
                  )}
                </div>
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

        {/* Formulário de nova interação — sempre visível */}
        <NovaInteracaoInline opportunityId={id} onSave={addActivity} />

        {/* Histórico de interações */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Interações</CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Nenhuma interação registrada.</p>
            ) : (
              <div className="space-y-4">
                {activities.map(act => {
                  const Icon = typeIcons[act.type] ?? Clock
                  return (
                    <div key={act.id} className="flex gap-3">
                      <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-xs capitalize">{act.type}</Badge>
                          <span className="text-xs text-slate-400">
                            {formatDate(typeof act.created_at === 'string' ? act.created_at.split('T')[0] : '')}
                          </span>
                          {act.user && (
                            <span className="text-xs text-slate-500">
                              por {(act.user as { name?: string }).name ?? ''}
                            </span>
                          )}
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
