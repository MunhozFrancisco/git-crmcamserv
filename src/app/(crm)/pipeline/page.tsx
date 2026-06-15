'use client'

import { useState, useEffect, useRef } from 'react'
import { useUser } from '@/contexts/user-context'
import { Header } from '@/components/layout/header'
import { KanbanBoard } from '@/components/pipeline/kanban-board'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import type { Opportunity, Stage, OpportunityStatus, RiskLevel } from '@/types'
import { Plus, Filter, Search, Loader2, Phone, Mail, Video, MessageCircle, Clock } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────
type ClientOption = { id: string; name: string }
type UserOption = { id: string; name: string; role: string }

type OppForm = {
  client_id: string
  value: string
  stage_id: string
  assigned_to: string
  expected_close_date: string
  score: string
}

// ─── Map API response (camelCase) → frontend Opportunity ──
function mapOpp(data: Record<string, unknown>): Opportunity {
  const client = data.client as { id: string; name: string } | undefined
  const stage = data.stage as Record<string, unknown> | undefined
  const assignee = data.assignee as { id: string; name: string } | undefined

  return {
    id: data.id as string,
    client_id: (data.clientId ?? '') as string,
    lead_id: '',
    stage_id: (data.stageId ?? '') as string,
    value: Number(data.value),
    status: data.status as OpportunityStatus,
    assigned_to: (data.assignedTo ?? '') as string,
    score: Number(data.score),
    risk_level: (data.riskLevel ?? 'medio') as RiskLevel,
    expected_close_date: data.expectedCloseDate
      ? (data.expectedCloseDate as string).split('T')[0]
      : '',
    next_interaction_date: data.nextInteractionDate
      ? (data.nextInteractionDate as string).split('T')[0]
      : undefined,
    last_interaction: data.lastInteraction
      ? (data.lastInteraction as string).split('T')[0]
      : new Date().toISOString().split('T')[0],
    created_at: data.createdAt ? (data.createdAt as string).split('T')[0] : '',
    // KanbanCard usa lead.company_name — mapeamos do client
    lead: {
      id: client?.id ?? '',
      company_name: client?.name ?? '—',
      contact_name: '',
      email: '', phone: '', source: 'outro', temperature: 'morno',
      assigned_to: (data.assignedTo ?? '') as string,
      segment: '', created_at: '',
    },
    assignee: {
      id: assignee?.id ?? '',
      name: assignee?.name ?? '—',
      email: '', role: 'vendedor', meta: 0,
    },
    // stage não faz parte do tipo Opportunity mas é incluído para uso interno
    ...(stage ? {
      _stage: {
        id: stage.id,
        name: stage.name,
        order_index: stage.orderIndex,
        probability: stage.probability,
        color: stage.color,
        bgColor: stage.bgColor,
      }
    } : {}),
  }
}

function mapStage(s: Record<string, unknown>): Stage {
  return {
    id: s.id as string,
    name: s.name as string,
    order_index: (s.orderIndex ?? s.order_index) as number,
    probability: s.probability as number,
    color: (s.color ?? 'text-slate-600') as string,
    bgColor: (s.bgColor ?? 'bg-slate-100') as string,
  }
}

function statusFromStage(stages: Stage[], stageId: string): OpportunityStatus {
  const stage = stages.find((s) => s.id === stageId)
  if (!stage) return 'aberta'
  if (stage.order_index === 4) return 'ganha'
  if (stage.order_index === 5) return 'perdida'
  return 'aberta'
}

// ─── Combobox de Cliente com busca ────────────────────────
function ClientCombobox({
  clients, value, onChange,
}: {
  clients: ClientOption[]
  value: string
  onChange: (id: string) => void
}) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selected = clients.find((c) => c.id === value)
  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <span className={selected ? 'text-slate-900' : 'text-slate-400'}>
          {selected?.name ?? 'Selecionar cliente...'}
        </span>
        <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 flex flex-col">
          <div className="p-2 border-b border-slate-100">
            <Input
              autoFocus
              placeholder="Buscar cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-7 text-xs"
            />
          </div>
          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-3">Nenhum cliente encontrado</p>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                  onClick={() => { onChange(c.id); setOpen(false); setSearch('') }}
                >
                  {c.name}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Modal de Oportunidade ────────────────────────────────
function OportunidadeModal({
  open, onOpenChange, initial, defaultStageId,
  stages, clients, users, currentUserId, isGestor, onSave,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  initial?: Opportunity
  defaultStageId?: string
  stages: Stage[]
  clients: ClientOption[]
  users: UserOption[]
  currentUserId: string
  isGestor: boolean
  onSave: (opp: Opportunity) => void
}) {
  const isEdit = !!initial
  const vendedores = users.filter((u) => u.role === 'vendedor')

  const defaultForm = (): OppForm => ({
    client_id: initial?.client_id ?? '',
    value: initial?.value != null ? String(initial.value) : '',
    stage_id: initial?.stage_id ?? defaultStageId ?? stages[0]?.id ?? '',
    assigned_to: initial?.assigned_to
      ?? (isGestor ? (vendedores[0]?.id ?? currentUserId) : currentUserId),
    expected_close_date: initial?.expected_close_date ?? '',
    score: initial?.score != null ? String(initial.score) : '50',
  })

  const [form, setForm] = useState<OppForm>(defaultForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setForm(defaultForm())
      setError('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial?.id])

  function field(key: keyof OppForm, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSave() {
    if (!form.client_id || !form.value) return
    setSaving(true)
    setError('')
    try {
      const score = Math.min(100, Math.max(0, parseInt(form.score) || 50))
      const risk_level: RiskLevel = score >= 70 ? 'baixo' : score >= 40 ? 'medio' : 'alto'
      const status = statusFromStage(stages, form.stage_id)

      const payload = {
        client_id: form.client_id,
        stage_id: form.stage_id,
        value: parseFloat(form.value),
        status,
        assigned_to: form.assigned_to,
        score,
        risk_level,
        expected_close_date: form.expected_close_date || null,
      }

      const url = isEdit ? `/api/opportunities/${initial!.id}` : '/api/opportunities'
      const method = isEdit ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error(await res.text())
      const saved = await res.json()
      onSave(mapOpp(saved))
      onOpenChange(false)
    } catch {
      setError('Erro ao salvar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Oportunidade' : 'Nova Oportunidade'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Atualize os dados da oportunidade.'
              : 'Preencha os dados para criar uma nova oportunidade no pipeline.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="mb-1.5 block">Cliente *</Label>
            <ClientCombobox
              clients={clients}
              value={form.client_id}
              onChange={(id) => field('client_id', id)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Valor (R$) *</Label>
              <Input
                type="number" min="0" step="1000" placeholder="0,00"
                value={form.value}
                onChange={(e) => field('value', e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-1.5 block">Score (0–100)</Label>
              <Input
                type="number" min="0" max="100" placeholder="50"
                value={form.score}
                onChange={(e) => field('score', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Etapa</Label>
              <select
                value={form.stage_id}
                onChange={(e) => field('stage_id', e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="mb-1.5 block">Responsável</Label>
              {isGestor ? (
                <select
                  value={form.assigned_to}
                  onChange={(e) => field('assigned_to', e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {vendedores.map((u) => (
                    <option key={u.id} value={u.id}>{u.name.split(' ')[0]}</option>
                  ))}
                </select>
              ) : (
                <Input
                  value={users.find((u) => u.id === currentUserId)?.name.split(' ')[0] ?? ''}
                  disabled
                />
              )}
            </div>
          </div>

          <div>
            <Label className="mb-1.5 block">Previsão de Fechamento</Label>
            <Input
              type="date"
              value={form.expected_close_date}
              onChange={(e) => field('expected_close_date', e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <DialogFooter className="gap-2 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!form.client_id || !form.value || saving}
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {isEdit ? 'Salvar Alterações' : 'Criar Oportunidade'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Modal de Interação pós-criação ───────────────────────
function InteracaoModal({
  open, onOpenChange, opportunityId,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  opportunityId: string
}) {
  const [type, setType] = useState('ligação')
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
      if (!res.ok) {
        const body = await res.text()
        throw new Error(body || `HTTP ${res.status}`)
      }
      onOpenChange(false)
    } catch (e) {
      setError(`Erro: ${(e as Error).message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Primeiro Contato</DialogTitle>
          <DialogDescription>
            Oportunidade criada! Registre o primeiro contato com o cliente.
          </DialogDescription>
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
              <select
                value={type}
                onChange={e => setType(e.target.value)}
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
            <Label className="mb-1.5 block">Descrição do Contato *</Label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Descreva o que foi falado, combinado com o cliente..."
              rows={5}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <DialogFooter className="gap-2 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Pular
          </Button>
          <Button onClick={handleSave} disabled={!description.trim() || !interactionDate || saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Registrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Page ─────────────────────────────────────────────────
export default function PipelinePage() {
  const { currentUser } = useUser()
  const isGestor = currentUser?.role === 'gestor'

  const [stages, setStages] = useState<Stage[]>([])
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [clients, setClients] = useState<ClientOption[]>([])
  const [users, setUsers] = useState<UserOption[]>([])
  const [loading, setLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Opportunity | undefined>()
  const [defaultStageId, setDefaultStageId] = useState<string | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<Opportunity | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [filterUser, setFilterUser] = useState('')
  const [interacaoOppId, setInteracaoOppId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [stagesRes, oppsRes, clientsRes, usersRes] = await Promise.all([
          fetch('/api/stages'),
          fetch('/api/opportunities'),
          fetch('/api/clients'),
          fetch('/api/users'),
        ])
        if (stagesRes.ok) {
          const data = await stagesRes.json()
          setStages(data.map(mapStage))
        }
        if (oppsRes.ok) {
          const data = await oppsRes.json()
          setOpportunities(data.map(mapOpp))
        }
        if (clientsRes.ok) {
          const data = await clientsRes.json()
          setClients(
            data.map((c: Record<string, unknown>) => ({ id: c.id, name: c.name }))
          )
        }
        if (usersRes.ok) {
          const data = await usersRes.json()
          setUsers(
            data
              .filter((u: Record<string, unknown>) => u.active !== false)
              .map((u: Record<string, unknown>) => ({
                id: u.id, name: u.name, role: u.role,
              }))
          )
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const visibleOpps = filterUser
    ? opportunities.filter((o) => o.assigned_to === filterUser)
    : opportunities

  const columns = stages.map((stage) => ({
    stage,
    opportunities: visibleOpps.filter((o) => o.stage_id === stage.id),
  }))

  const totalOpen = visibleOpps.filter((o) => o.status === 'aberta').length
  const totalValue = visibleOpps
    .filter((o) => o.status === 'aberta')
    .reduce((sum, o) => sum + o.value, 0)

  function handleSave(opp: Opportunity) {
    setOpportunities((prev) => {
      const exists = prev.find((o) => o.id === opp.id)
      if (exists) return prev.map((o) => (o.id === opp.id ? opp : o))
      return [...prev, opp]
    })
    setEditTarget(undefined)
    setDefaultStageId(undefined)
    setInteracaoOppId(opp.id)
  }

  async function handleMove(oppId: string, newStageId: string) {
    const newStatus = statusFromStage(stages, newStageId)
    setOpportunities((prev) =>
      prev.map((o) =>
        o.id === oppId ? { ...o, stage_id: newStageId, status: newStatus } : o
      )
    )
    await fetch(`/api/opportunities/${oppId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage_id: newStageId, status: newStatus }),
    })
  }

  async function handleDelete(id: string) {
    setDeleting(true)
    try {
      await fetch(`/api/opportunities/${id}`, { method: 'DELETE' })
      setOpportunities((prev) => prev.filter((o) => o.id !== id))
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  function openEdit(opp: Opportunity) {
    setEditTarget(opp)
    setDefaultStageId(undefined)
    setModalOpen(true)
  }

  function openNew(stageId?: string) {
    setEditTarget(undefined)
    setDefaultStageId(stageId)
    setModalOpen(true)
  }

  const vendedores = users.filter((u) => u.role === 'vendedor')

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Pipeline de Vendas" subtitle="Carregando..." />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Pipeline de Vendas"
        subtitle={`${totalOpen} oportunidades • ${formatCurrency(totalValue)} em aberto${!isGestor ? ' — suas oportunidades' : ''}`}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 px-4 lg:px-6 py-3 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-2">
          {isGestor && vendedores.length > 0 && (
            <>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Filter className="h-3.5 w-3.5" />
                Filtrar
              </Button>
              <select
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Todos os vendedores</option>
                {vendedores.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </>
          )}
          {!isGestor && (
            <p className="text-xs text-slate-500 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-1.5">
              Mostrando apenas suas oportunidades
            </p>
          )}
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => openNew()}>
          <Plus className="h-3.5 w-3.5" />
          Nova Oportunidade
        </Button>
      </div>

      <div className="flex-1 overflow-hidden p-3 lg:p-6">
        <KanbanBoard
          columns={columns}
          onEdit={openEdit}
          onDelete={setDeleteTarget}
          onAddToStage={openNew}
          onMove={handleMove}
        />
      </div>

      {currentUser && (
        <OportunidadeModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          initial={editTarget}
          defaultStageId={defaultStageId}
          stages={stages}
          clients={clients}
          users={users}
          currentUserId={currentUser.id}
          isGestor={isGestor}
          onSave={handleSave}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Excluir Oportunidade"
        description={`Tem certeza que deseja excluir a oportunidade de "${deleteTarget?.lead.company_name}"? Esta ação não pode ser desfeita.`}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget.id)}
        disabled={deleting}
      />

      {interacaoOppId && (
        <InteracaoModal
          open={!!interacaoOppId}
          onOpenChange={(v) => { if (!v) setInteracaoOppId(null) }}
          opportunityId={interacaoOppId}
        />
      )}
    </div>
  )
}
