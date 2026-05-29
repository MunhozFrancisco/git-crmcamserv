'use client'

import { useState } from 'react'
import { useUser } from '@/contexts/user-context'
import { Header } from '@/components/layout/header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { TASKS, USERS, OPPORTUNITIES } from '@/lib/mock-data'
import type { Task } from '@/types'
import { formatDate, getInitials, cn } from '@/lib/utils'
import { CheckCircle2, Circle, Plus, Phone, Mail, Video, MessageCircle, Calendar } from 'lucide-react'

const typeIcons = {
  ligação: Phone,
  email: Mail,
  reunião: Video,
  whatsapp: MessageCircle,
  outro: Calendar,
}

const priorityConfig = {
  alta: { variant: 'destructive' as const, label: 'Alta' },
  media: { variant: 'warning' as const, label: 'Média' },
  baixa: { variant: 'secondary' as const, label: 'Baixa' },
}

const vendedores = USERS.filter((u) => u.role === 'vendedor')

type TaskForm = {
  title: string
  type: Task['type']
  priority: Task['priority']
  due_date: string
  opportunity_id: string
  assigned_to: string
}

function NovaTarefaModal({
  open, onOpenChange, currentUserId, isGestor, onSave,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  currentUserId: string
  isGestor: boolean
  onSave: (t: Task) => void
}) {
  const [form, setForm] = useState<TaskForm>({
    title: '',
    type: 'ligação',
    priority: 'media',
    due_date: '',
    opportunity_id: '',
    assigned_to: isGestor ? (vendedores[0]?.id ?? currentUserId) : currentUserId,
  })

  function field(key: keyof TaskForm, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleSave() {
    if (!form.title) return
    const task: Task = {
      id: `t${Date.now()}`,
      title: form.title,
      type: form.type,
      priority: form.priority,
      due_date: form.due_date || new Date().toISOString().split('T')[0],
      done: false,
      assigned_to: form.assigned_to,
      opportunity_id: form.opportunity_id || undefined,
    }
    onSave(task)
    onOpenChange(false)
    setForm({
      title: '', type: 'ligação', priority: 'media', due_date: '',
      opportunity_id: '', assigned_to: isGestor ? (vendedores[0]?.id ?? currentUserId) : currentUserId,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Tarefa</DialogTitle>
          <DialogDescription>Crie uma tarefa para acompanhar suas atividades comerciais.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="mb-1.5 block">Título *</Label>
            <Input
              placeholder="Ex: Ligar para cliente, Enviar proposta..."
              value={form.title}
              onChange={(e) => field('title', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Tipo</Label>
              <select
                value={form.type}
                onChange={(e) => field('type', e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ligação">Ligação</option>
                <option value="email">E-mail</option>
                <option value="reunião">Reunião</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="outro">Outro</option>
              </select>
            </div>
            <div>
              <Label className="mb-1.5 block">Prioridade</Label>
              <select
                value={form.priority}
                onChange={(e) => field('priority', e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="alta">Alta</option>
                <option value="media">Média</option>
                <option value="baixa">Baixa</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Data de Vencimento</Label>
              <Input
                type="date"
                value={form.due_date}
                onChange={(e) => field('due_date', e.target.value)}
              />
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
                <Input value={USERS.find((u) => u.id === currentUserId)?.name.split(' ')[0] ?? ''} disabled />
              )}
            </div>
          </div>

          <div>
            <Label className="mb-1.5 block">Oportunidade (opcional)</Label>
            <select
              value={form.opportunity_id}
              onChange={(e) => field('opportunity_id', e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Nenhuma</option>
              {OPPORTUNITIES.map((o) => (
                <option key={o.id} value={o.id}>{o.lead.company_name}</option>
              ))}
            </select>
          </div>
        </div>

        <DialogFooter className="gap-2 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!form.title}>Criar Tarefa</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function TarefasPage() {
  const { currentUser } = useUser()
  const isGestor = currentUser?.role === 'gestor'
  const [tasks, setTasks] = useState(TASKS)
  const [modalOpen, setModalOpen] = useState(false)

  const myTasks = isGestor ? tasks : tasks.filter((t) => t.assigned_to === currentUser?.id)

  function toggleTask(id: string) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))
  }

  function addTask(task: Task) {
    setTasks((prev) => [task, ...prev])
  }

  const pending = myTasks.filter((t) => !t.done)
  const done = myTasks.filter((t) => t.done)

  function getOppName(id?: string) {
    if (!id) return null
    return OPPORTUNITIES.find((o) => o.id === id)?.lead.company_name ?? null
  }

  function getUserName(id: string) {
    return USERS.find((u) => u.id === id)?.name ?? '—'
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Tarefas" subtitle={`${pending.length} pendentes${!isGestor ? ' — suas tarefas' : ''}`} />

      <div className="flex items-center justify-between px-4 lg:px-6 py-3 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">
            <span className="font-semibold text-slate-900">{pending.length}</span> pendentes ·{' '}
            <span className="font-semibold text-green-600">{done.length}</span> concluídas
          </span>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setModalOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          Nova Tarefa
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
        {/* Pendentes */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
            Pendentes ({pending.length})
          </h2>
          <div className="space-y-2">
            {pending.map((task) => {
              const Icon = typeIcons[task.type]
              const priority = priorityConfig[task.priority]
              const oppName = getOppName(task.opportunity_id)

              return (
                <Card key={task.id} className={cn(
                  'transition-all hover:shadow-sm',
                  task.priority === 'alta' && 'border-red-100'
                )}>
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <button onClick={() => toggleTask(task.id)} className="shrink-0">
                        <Circle className="h-5 w-5 text-slate-300 hover:text-indigo-500 transition-colors" />
                      </button>

                      <div className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                        <Icon className="h-3.5 w-3.5 text-slate-500" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900">{task.title}</p>
                        {oppName && (
                          <p className="text-xs text-slate-500">{oppName}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={priority.variant} className="text-xs">{priority.label}</Badge>
                        <span className="text-xs text-slate-400">{formatDate(task.due_date)}</span>
                        <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-indigo-700">
                            {getInitials(getUserName(task.assigned_to))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            {pending.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-6">Sem tarefas pendentes!</p>
            )}
          </div>
        </div>

        {/* Concluídas */}
        {done.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Concluídas ({done.length})
            </h2>
            <div className="space-y-2">
              {done.map((task) => (
                <Card key={task.id} className="opacity-60">
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <button onClick={() => toggleTask(task.id)} className="shrink-0">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      </button>
                      <p className="text-sm text-slate-500 line-through">{task.title}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {currentUser && (
        <NovaTarefaModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          currentUserId={currentUser.id}
          isGestor={isGestor}
          onSave={addTask}
        />
      )}
    </div>
  )
}
