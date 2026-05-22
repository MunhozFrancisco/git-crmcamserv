'use client'

import { useState } from 'react'
import { useUser } from '@/contexts/user-context'
import { Header } from '@/components/layout/header'
import { KanbanBoard } from '@/components/pipeline/kanban-board'
import { OPPORTUNITIES, LEADS, STAGES, USERS, getPipelineByStage } from '@/lib/mock-data'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import type { Opportunity, Lead, User } from '@/types'
import { Plus, Filter } from 'lucide-react'

type OppForm = {
  company_name: string
  contact_name: string
  value: string
  stage_id: string
  assigned_to: string
  expected_close_date: string
  score: string
}

const vendedores = USERS.filter((u) => u.role === 'vendedor')

function OportunidadeModal({
  open, onOpenChange, initial, defaultStageId, currentUserId, isGestor, onSave,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  initial?: Opportunity
  defaultStageId?: string
  currentUserId: string
  isGestor: boolean
  onSave: (opp: Opportunity) => void
}) {
  const isEdit = !!initial
  const [form, setForm] = useState<OppForm>({
    company_name: initial?.lead.company_name ?? '',
    contact_name: initial?.lead.contact_name ?? '',
    value: initial?.value != null ? String(initial.value) : '',
    stage_id: initial?.stage_id ?? defaultStageId ?? STAGES[0].id,
    assigned_to: initial?.assigned_to ?? (isGestor ? vendedores[0]?.id ?? currentUserId : currentUserId),
    expected_close_date: initial?.expected_close_date ?? '',
    score: initial?.score != null ? String(initial.score) : '50',
  })

  function field(key: keyof OppForm, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleSave() {
    if (!form.company_name || !form.value) return

    const assigneeUser: User = USERS.find((u) => u.id === form.assigned_to) ?? USERS[1]

    const existingLead: Lead | undefined = initial?.lead.company_name === form.company_name
      ? initial.lead
      : LEADS.find((l) => l.company_name.toLowerCase() === form.company_name.toLowerCase())

    const lead: Lead = existingLead ?? {
      id: `l${Date.now()}`,
      company_name: form.company_name,
      contact_name: form.contact_name,
      email: '',
      phone: '',
      source: 'outro',
      temperature: 'morno',
      assigned_to: form.assigned_to,
      segment: 'Outro',
      created_at: new Date().toISOString().split('T')[0],
    }

    const score = Math.min(100, Math.max(0, parseInt(form.score) || 50))
    const risk_level = score >= 70 ? 'baixo' : score >= 40 ? 'medio' : 'alto'

    const status =
      form.stage_id === 's5' ? 'ganha'
      : form.stage_id === 's6' ? 'perdida'
      : 'aberta'

    const opp: Opportunity = {
      id: initial?.id ?? `o${Date.now()}`,
      lead_id: lead.id,
      stage_id: form.stage_id,
      value: parseFloat(form.value),
      status,
      assigned_to: form.assigned_to,
      score,
      risk_level,
      expected_close_date: form.expected_close_date || new Date().toISOString().split('T')[0],
      last_interaction: initial?.last_interaction ?? new Date().toISOString().split('T')[0],
      created_at: initial?.created_at ?? new Date().toISOString().split('T')[0],
      lead: { ...lead, contact_name: form.contact_name || lead.contact_name },
      assignee: assigneeUser,
    }

    onSave(opp)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Oportunidade' : 'Nova Oportunidade'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Atualize os dados da oportunidade.' : 'Preencha os dados para criar uma nova oportunidade no pipeline.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="mb-1.5 block">Empresa *</Label>
              <Input
                placeholder="Ex: Grupo Horizonte"
                value={form.company_name}
                onChange={(e) => field('company_name', e.target.value)}
              />
            </div>
            <div className="col-span-2">
              <Label className="mb-1.5 block">Contato</Label>
              <Input
                placeholder="Ex: João da Silva"
                value={form.contact_name}
                onChange={(e) => field('contact_name', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Valor (R$) *</Label>
              <Input
                type="number"
                min="0"
                step="1000"
                placeholder="0,00"
                value={form.value}
                onChange={(e) => field('value', e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-1.5 block">Score (0–100)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                placeholder="50"
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
                {STAGES.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <Label className="mb-1.5 block">
                {isGestor ? 'Responsável' : 'Responsável'}
              </Label>
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
                <Input value={USERS.find((u) => u.id === currentUserId)?.name.split(' ')[0] ?? ''} disabled />
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
        </div>

        <DialogFooter className="gap-2 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!form.company_name || !form.value}>
            {isEdit ? 'Salvar Alterações' : 'Criar Oportunidade'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function PipelinePage() {
  const { currentUser } = useUser()
  const isGestor = currentUser?.role === 'gestor'

  const [opportunities, setOpportunities] = useState<Opportunity[]>(
    isGestor ? OPPORTUNITIES : OPPORTUNITIES.filter((o) => o.assigned_to === currentUser?.id)
  )
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Opportunity | undefined>()
  const [defaultStageId, setDefaultStageId] = useState<string | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<Opportunity | null>(null)

  const visibleOpps = opportunities
  const columns = getPipelineByStage(visibleOpps)
  const totalOpen = visibleOpps.filter((o) => o.status === 'aberta').length
  const totalValue = visibleOpps
    .filter((o) => o.status === 'aberta')
    .reduce((sum, o) => sum + o.value, 0)

  function handleSave(opp: Opportunity) {
    setOpportunities((prev) => {
      const exists = prev.find((o) => o.id === opp.id)
      if (exists) return prev.map((o) => o.id === opp.id ? opp : o)
      return [...prev, opp]
    })
    setEditTarget(undefined)
    setDefaultStageId(undefined)
  }

  function handleDelete(id: string) {
    setOpportunities((prev) => prev.filter((o) => o.id !== id))
    setDeleteTarget(null)
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

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Pipeline de Vendas"
        subtitle={`${totalOpen} oportunidades • ${formatCurrency(totalValue)} em aberto${!isGestor ? ' — suas oportunidades' : ''}`}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 px-4 lg:px-6 py-3 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-2">
          {isGestor && (
            <>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Filter className="h-3.5 w-3.5" />
                Filtrar
              </Button>
              <select className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
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
        />
      </div>

      {currentUser && (
        <OportunidadeModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          initial={editTarget}
          defaultStageId={defaultStageId}
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
      />
    </div>
  )
}
