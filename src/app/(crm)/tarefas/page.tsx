'use client'

import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@/contexts/user-context'
import { Header } from '@/components/layout/header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import type { Task } from '@/types'
import { formatDate, getInitials, cn } from '@/lib/utils'
import {
  CheckCircle2, Circle, Plus, Phone, Mail, Video,
  MessageCircle, Calendar, Loader2, MoreVertical, Pencil, Trash2,
  Briefcase, Building2,
} from 'lucide-react'

const typeIcons = {
  'ligação': Phone,
  'email': Mail,
  'reunião': Video,
  'whatsapp': MessageCircle,
  'outro': Calendar,
}

const priorityConfig = {
  alta:  { variant: 'destructive' as const, label: 'Alta' },
  media: { variant: 'warning' as const, label: 'Média' },
  baixa: { variant: 'secondary' as const, label: 'Baixa' },
}

type UserBasic = { id: string; name: string; role: string }
type ClientBasic = { id: string; name: string }
type OppBasic = { id: string; clientId: string; client?: { name: string } }

type TaskForm = {
  title: string
  type: Task['type']
  priority: Task['priority']
  due_date: string
  client_id: string
  opportunity_id: string
  assigned_to: string
}

function TarefaModal({
  open, onOpenChange, initial, currentUserId, isGestor,
  users, clients, opportunities, onSave,
}: {
  open: boolean; onOpenChange: (v: boolean) => void
  initial?: Task; currentUserId: string; isGestor: boolean
  users: UserBasic[]; clients: ClientBasic[]; opportunities: OppBasic[]
  onSave: (t: Task) => void
}) {
  const isEdit = !!initial
  const [form, setForm] = useState<TaskForm>({
    title: initial?.title ?? '',
    type: initial?.type ?? 'ligação',
    priority: initial?.priority ?? 'media',
    due_date: initial?.due_date ?? '',
    client_id: initial?.client_id ?? '',
    opportunity_id: initial?.opportunity_id ?? '',
    assigned_to: initial?.assigned_to ?? (isGestor ? (users[0]?.id ?? currentUserId) : currentUserId),
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [intType, setIntType] = useState('ligação')
  const [intDate, setIntDate] = useState(new Date().toISOString().split('T')[0])
  const [intDesc, setIntDesc] = useState('')

  useEffect(() => {
    if (open) {
      setForm({
        title: initial?.title ?? '',
        type: initial?.type ?? 'ligação',
        priority: initial?.priority ?? 'media',
        due_date: initial?.due_date ?? '',
        client_id: initial?.client_id ?? '',
        opportunity_id: initial?.opportunity_id ?? '',
        assigned_to: initial?.assigned_to ?? (isGestor ? (users[0]?.id ?? currentUserId) : currentUserId),
      })
      setError('')
      setIntType('ligação')
      setIntDate(new Date().toISOString().split('T')[0])
      setIntDesc('')
    }
  }, [open, initial, isGestor, users, currentUserId])

  function field(k: keyof TaskForm, v: string) { setForm(f => ({ ...f, [k]: v })) }

  const filteredOpps = form.client_id
    ? opportunities.filter(o => o.clientId === form.client_id)
    : opportunities

  async function handleSave() {
    if (!form.title || !form.due_date || !form.opportunity_id) return
    setSaving(true); setError('')
    try {
      const url = isEdit ? `/api/tasks/${initial!.id}` : '/api/tasks'
      const method = isEdit ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          type: form.type,
          priority: form.priority,
          due_date: form.due_date,
          client_id: form.client_id || null,
          opportunity_id: form.opportunity_id || null,
          assigned_to: form.assigned_to,
        }),
      })
      if (!res.ok) throw new Error()
      const saved = await res.json()

      if (intDesc.trim() && (form.opportunity_id || saved.opportunityId)) {
        const oppId = form.opportunity_id || saved.opportunityId
        await fetch(`/api/opportunities/${oppId}/activities`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: intType, description: intDesc, interaction_date: intDate }),
        })
      }

      onSave({
        id: saved.id,
        title: saved.title,
        type: saved.type,
        priority: saved.priority,
        due_date: saved.dueDate ?? saved.due_date,
        done: saved.done,
        assigned_to: saved.assignedTo ?? saved.assigned_to,
        client_id: saved.clientId ?? saved.client_id,
        opportunity_id: saved.opportunityId ?? saved.opportunity_id,
        client: saved.client,
        opportunity: saved.opportunity,
        assignee: saved.assignee,
      })
      onOpenChange(false)
    } catch {
      setError('Erro ao salvar tarefa.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Atualize os dados da tarefa.' : 'Crie uma tarefa vinculada a um cliente ou oportunidade.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="mb-1.5 block">Título *</Label>
            <Input placeholder="Ex: Ligar para cliente, Enviar proposta..."
              value={form.title} onChange={e => field('title', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Tipo</Label>
              <select value={form.type} onChange={e => field('type', e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="ligação">Ligação</option>
                <option value="email">E-mail</option>
                <option value="reunião">Reunião</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="outro">Outro</option>
              </select>
            </div>
            <div>
              <Label className="mb-1.5 block">Prioridade</Label>
              <select value={form.priority} onChange={e => field('priority', e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="alta">Alta</option>
                <option value="media">Média</option>
                <option value="baixa">Baixa</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Data de Vencimento *</Label>
              <Input type="date" value={form.due_date} onChange={e => field('due_date', e.target.value)} />
            </div>
            <div>
              <Label className="mb-1.5 block">Responsável</Label>
              {isGestor ? (
                <select value={form.assigned_to} onChange={e => field('assigned_to', e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  {users.map(u => <option key={u.id} value={u.id}>{u.name.split(' ')[0]}</option>)}
                </select>
              ) : (
                <Input value={users.find(u => u.id === currentUserId)?.name.split(' ')[0] ?? ''} disabled />
              )}
            </div>
          </div>

          {/* Vínculo com cliente */}
          <div className="p-3 rounded-lg border border-indigo-200 bg-indigo-50 space-y-3">
            <p className="text-xs font-semibold text-indigo-700 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" /> Vincular a Oportunidade <span className="text-red-500">*</span>
            </p>
            <div>
              <Label className="mb-1.5 block text-xs">Filtrar por cliente</Label>
              <select value={form.client_id}
                onChange={e => { field('client_id', e.target.value); field('opportunity_id', '') }}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Todos os clientes</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <Label className="mb-1.5 block text-xs">Oportunidade *</Label>
              <select value={form.opportunity_id} onChange={e => field('opportunity_id', e.target.value)}
                className={cn(
                  'w-full text-sm border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500',
                  !form.opportunity_id ? 'border-red-300' : 'border-slate-200'
                )}>
                <option value="">Selecionar oportunidade...</option>
                {filteredOpps.map(o => (
                  <option key={o.id} value={o.id}>
                    {o.client?.name ?? clients.find(c => c.id === o.clientId)?.name ?? o.id.slice(0, 8)}
                  </option>
                ))}
              </select>
              {!form.opportunity_id && (
                <p className="text-xs text-red-500 mt-1">Toda tarefa deve estar vinculada a uma oportunidade.</p>
              )}
            </div>
          </div>

          {form.opportunity_id && (
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                <MessageCircle className="h-3.5 w-3.5" /> Registrar Conversa (opcional)
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="mb-1.5 block text-xs">Data</Label>
                  <Input type="date" value={intDate} onChange={e => setIntDate(e.target.value)} />
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs">Tipo</Label>
                  <select value={intType} onChange={e => setIntType(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="ligação">Ligação</option>
                    <option value="email">E-mail</option>
                    <option value="reunião">Reunião</option>
                    <option value="whatsapp">WhatsApp</option>
                  </select>
                </div>
              </div>
              <div>
                <Label className="mb-1.5 block text-xs">Descrição da conversa</Label>
                <textarea value={intDesc} onChange={e => setIntDesc(e.target.value)}
                  placeholder="Deixe em branco para não registrar interação..."
                  rows={3}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <DialogFooter className="gap-2 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!form.title || !form.due_date || !form.opportunity_id || saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {isEdit ? 'Salvar Alterações' : 'Criar Tarefa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function TarefasPage() {
  const { currentUser } = useUser()
  const isGestor = currentUser?.role === 'gestor'
  const [tasks, setTasks] = useState<Task[]>([])
  const [users, setUsers] = useState<UserBasic[]>([])
  const [clients, setClients] = useState<ClientBasic[]>([])
  const [opportunities, setOpportunities] = useState<OppBasic[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Task | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadTasks = useCallback(async () => {
    const res = await fetch('/api/tasks')
    if (!res.ok) return
    const data = await res.json()
    setTasks(data.map((t: Record<string, unknown>) => ({
      id: t.id,
      title: t.title,
      type: t.type,
      priority: t.priority,
      due_date: t.dueDate ?? t.due_date,
      done: t.done,
      assigned_to: t.assignedTo ?? t.assigned_to,
      client_id: t.clientId ?? t.client_id,
      opportunity_id: t.opportunityId ?? t.opportunity_id,
      client: t.client,
      opportunity: t.opportunity,
      assignee: t.assignee,
    })))
  }, [])

  useEffect(() => {
    async function init() {
      setLoading(true)
      const [, usersRes, clientsRes, oppsRes] = await Promise.all([
        loadTasks(),
        fetch('/api/users'),
        fetch('/api/clients'),
        fetch('/api/opportunities'),
      ])
      if (usersRes.ok) setUsers(await usersRes.json())
      if (clientsRes.ok) {
        const data = await clientsRes.json()
        setClients(data.map((c: Record<string, unknown>) => ({ id: c.id, name: c.name })))
      }
      if (oppsRes.ok) {
        const data = await oppsRes.json()
        setOpportunities(data.map((o: Record<string, unknown>) => ({
          id: o.id,
          clientId: o.clientId ?? o.client_id,
          client: o.client,
        })))
      }
      setLoading(false)
    }
    init()
  }, [loadTasks])

  async function toggleTask(task: Task) {
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done: !task.done }),
    })
    if (res.ok) {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, done: !t.done } : t))
    }
  }

  async function handleDelete(id: string) {
    setDeleting(true)
    try {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
      setTasks(prev => prev.filter(t => t.id !== id))
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  function upsertTask(task: Task) {
    setTasks(prev => {
      const exists = prev.find(t => t.id === task.id)
      if (exists) return prev.map(t => t.id === task.id ? task : t)
      return [task, ...prev]
    })
    setEditTarget(undefined)
  }

  const myTasks = isGestor ? tasks : tasks.filter(t => t.assigned_to === currentUser?.id)
  const pending = myTasks.filter(t => !t.done)
  const done = myTasks.filter(t => t.done)

  function getClientName(task: Task) {
    if (task.client) return (task.client as { name?: string }).name ?? null
    if (task.client_id) return clients.find(c => c.id === task.client_id)?.name ?? null
    return null
  }

  function getUserName(id: string) {
    return users.find(u => u.id === id)?.name ?? '—'
  }

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Tarefas" subtitle="Carregando..." />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      </div>
    )
  }

  function TaskCard({ task, dimmed }: { task: Task; dimmed?: boolean }) {
    const Icon = typeIcons[task.type] ?? Calendar
    const priority = priorityConfig[task.priority]
    const clientName = getClientName(task)

    return (
      <Card className={cn('transition-all hover:shadow-sm', task.priority === 'alta' && !dimmed && 'border-red-100', dimmed && 'opacity-60')}>
        <CardContent className="py-3 px-4">
          <div className="flex items-center gap-3">
            <button onClick={() => toggleTask(task)} className="shrink-0">
              {task.done
                ? <CheckCircle2 className="h-5 w-5 text-green-500" />
                : <Circle className="h-5 w-5 text-slate-300 hover:text-indigo-500 transition-colors" />
              }
            </button>

            <div className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
              <Icon className="h-3.5 w-3.5 text-slate-500" />
            </div>

            <div className="flex-1 min-w-0">
              <p className={cn('text-sm font-medium text-slate-900', dimmed && 'line-through text-slate-500')}>{task.title}</p>
              {(clientName || task.opportunity) && (
                <div className="flex items-center gap-2 mt-0.5">
                  {clientName && (
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Building2 className="h-3 w-3" />{clientName}
                    </span>
                  )}
                  {task.opportunity && (
                    <span className="flex items-center gap-1 text-xs text-indigo-600">
                      <Briefcase className="h-3 w-3" />
                      {(task.opportunity as { client?: { name?: string } }).client?.name ?? 'Oportunidade'}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {!dimmed && <Badge variant={priority.variant} className="text-xs">{priority.label}</Badge>}
              <span className="text-xs text-slate-400">{formatDate(typeof task.due_date === 'string' ? task.due_date : '')}</span>
              <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-[10px] font-bold text-indigo-700">
                  {getInitials(getUserName(task.assigned_to))}
                </span>
              </div>

              {!dimmed && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1 rounded hover:bg-slate-100 transition-colors">
                      <MoreVertical className="h-3.5 w-3.5 text-slate-400" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => { setEditTarget(task); setModalOpen(true) }}>
                      <Pencil className="h-4 w-4 text-slate-500" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600 hover:bg-red-50 focus:bg-red-50"
                      onClick={() => setDeleteTarget(task)}>
                      <Trash2 className="h-4 w-4" /> Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Tarefas" subtitle={`${pending.length} pendentes${!isGestor ? ' — suas tarefas' : ''}`} />

      <div className="flex items-center justify-between px-4 lg:px-6 py-3 border-b border-slate-200 bg-white">
        <span className="text-sm text-slate-500">
          <span className="font-semibold text-slate-900">{pending.length}</span> pendentes ·{' '}
          <span className="font-semibold text-green-600">{done.length}</span> concluídas
        </span>
        <Button size="sm" className="gap-1.5" onClick={() => { setEditTarget(undefined); setModalOpen(true) }}>
          <Plus className="h-3.5 w-3.5" />
          Nova Tarefa
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
            Pendentes ({pending.length})
          </h2>
          <div className="space-y-2">
            {pending.map(task => <TaskCard key={task.id} task={task} />)}
            {pending.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-6">Sem tarefas pendentes!</p>
            )}
          </div>
        </div>

        {done.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Concluídas ({done.length})
            </h2>
            <div className="space-y-2">
              {done.map(task => <TaskCard key={task.id} task={task} dimmed />)}
            </div>
          </div>
        )}
      </div>

      {currentUser && (
        <TarefaModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          initial={editTarget}
          currentUserId={currentUser.id}
          isGestor={isGestor}
          users={users}
          clients={clients}
          opportunities={opportunities}
          onSave={upsertTask}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={v => !v && setDeleteTarget(null)}
        title="Excluir Tarefa"
        description={`Tem certeza que deseja excluir "${deleteTarget?.title}"?`}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget.id)}
        disabled={deleting}
      />
    </div>
  )
}
