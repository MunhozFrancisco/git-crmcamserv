'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { SELLER_STATS } from '@/lib/mock-data'
import type { SellerStats, User } from '@/types'
import { formatCurrency, getInitials, cn } from '@/lib/utils'
import { Trophy, TrendingUp, Target, UserPlus, MoreVertical, Pencil, Trash2, RefreshCw } from 'lucide-react'

type FormState = { name: string; email: string; phone: string; password: string; meta: string }

function VendedorModal({
  open, onOpenChange, initial, onSave,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  initial?: User
  onSave: (u: User) => void
}) {
  const isEdit = !!initial
  const [form, setForm] = useState<FormState>({
    name: initial?.name ?? '',
    email: initial?.email ?? '',
    phone: '',
    password: '',
    meta: String(initial?.meta ?? ''),
  })
  const [saved, setSaved] = useState(false)

  function field(key: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function generatePassword() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    const pw = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    setForm((f) => ({ ...f, password: `Camserv@${pw}` }))
  }

  function handleSave() {
    if (!form.name || !form.email || !form.meta) return
    const user: User = {
      id: initial?.id ?? `u${Date.now()}`,
      name: form.name,
      email: form.email,
      role: 'vendedor',
      meta: parseFloat(form.meta),
    }
    onSave(user)
    if (!isEdit) {
      setSaved(true)
      setTimeout(() => {
        onOpenChange(false)
        setSaved(false)
        setForm({ name: '', email: '', phone: '', password: '', meta: '' })
      }, 1200)
    } else {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Vendedor' : 'Adicionar Vendedor'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Altere os dados do vendedor.' : 'Somente o gestor pode cadastrar novos vendedores.'}
          </DialogDescription>
        </DialogHeader>

        {saved ? (
          <div className="flex flex-col items-center py-6 gap-3">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <Trophy className="h-6 w-6 text-green-600" />
            </div>
            <p className="font-semibold text-slate-900">Vendedor cadastrado!</p>
            <p className="text-sm text-slate-500">O acesso será enviado por e-mail.</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div>
                <Label className="mb-1.5 block">Nome completo *</Label>
                <Input value={form.name} onChange={(e) => field('name', e.target.value)} placeholder="Ex: João da Silva" />
              </div>
              <div>
                <Label className="mb-1.5 block">E-mail corporativo *</Label>
                <Input type="email" value={form.email} onChange={(e) => field('email', e.target.value)} placeholder="vendedor@camserv.com.br" />
              </div>
              <div>
                <Label className="mb-1.5 block">Senha sugerida</Label>
                <div className="flex gap-2">
                  <Input
                    value={form.password}
                    onChange={(e) => field('password', e.target.value)}
                    placeholder="Ex: Camserv@2025"
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={generatePassword} title="Gerar senha">
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <p className="text-xs text-slate-400 mt-1">Será enviada por e-mail ao vendedor</p>
              </div>
              <div>
                <Label className="mb-1.5 block">WhatsApp / Telefone</Label>
                <Input type="tel" value={form.phone} onChange={(e) => field('phone', e.target.value)} placeholder="(11) 99999-0000" />
              </div>
              <div>
                <Label className="mb-1.5 block">Meta mensal (R$) *</Label>
                <Input type="number" min="0" step="1000" value={form.meta} onChange={(e) => field('meta', e.target.value)} placeholder="Ex: 25000" />
                <p className="text-xs text-slate-400 mt-1">Define a barra de progresso no ranking</p>
              </div>
            </div>
            <DialogFooter className="gap-2 mt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={!form.name || !form.email || !form.meta}>
                {isEdit ? 'Salvar Alterações' : 'Cadastrar Vendedor'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default function VendedoresPage() {
  const [stats, setStats] = useState<SellerStats[]>(SELLER_STATS)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<User | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<SellerStats | null>(null)

  function handleSave(user: User) {
    setStats((prev) => {
      const exists = prev.find((s) => s.user.id === user.id)
      if (exists) {
        return prev.map((s) => s.user.id === user.id ? { ...s, user } : s)
      }
      return [...prev, {
        user, total_opportunities: 0, won: 0, lost: 0,
        open: 0, conversion_rate: 0, total_value: 0, avg_ticket: 0, avg_close_days: 0,
      }]
    })
    setEditTarget(undefined)
  }

  function handleDelete(id: string) {
    setStats((prev) => prev.filter((s) => s.user.id !== id))
    setDeleteTarget(null)
  }

  function openEdit(user: User) {
    setEditTarget(user)
    setModalOpen(true)
  }

  function openNew() {
    setEditTarget(undefined)
    setModalOpen(true)
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Vendedores" subtitle="Equipe comercial — gerenciado pelo gestor" />

      <div className="flex items-center justify-between px-4 lg:px-6 py-3 border-b border-slate-200 bg-white">
        <p className="text-sm text-slate-500">
          <span className="font-semibold text-slate-900">{stats.length}</span> vendedor{stats.length !== 1 ? 'es' : ''} na equipe
        </p>
        <Button size="sm" className="gap-1.5" onClick={openNew}>
          <UserPlus className="h-3.5 w-3.5" />
          Novo Vendedor
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3 mb-2">
                <Trophy className="h-4 w-4 text-amber-500" />
                <p className="text-sm text-slate-500">Melhor Conversão</p>
              </div>
              <p className="text-lg font-bold text-slate-900">{stats[0]?.user.name.split(' ')[0] ?? '—'}</p>
              <p className="text-xs text-green-600 font-semibold">{stats[0]?.conversion_rate.toFixed(1)}% taxa</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3 mb-2">
                <Target className="h-4 w-4 text-indigo-500" />
                <p className="text-sm text-slate-500">Total em Aberto</p>
              </div>
              <p className="text-lg font-bold text-slate-900">{stats.reduce((s, v) => s + v.open, 0)}</p>
              <p className="text-xs text-slate-500">oportunidades ativas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <p className="text-sm text-slate-500">Volume Total</p>
              </div>
              <p className="text-lg font-bold text-slate-900">
                {formatCurrency(stats.reduce((s, v) => s + v.total_value, 0))}
              </p>
              <p className="text-xs text-slate-500">em negócios fechados</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ranking da Equipe</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.map((stat, i) => {
                const metaProgress = stat.user.meta > 0
                  ? Math.min((stat.total_value / stat.user.meta) * 100, 100) : 0
                const isNew = stat.total_opportunities === 0

                return (
                  <div key={stat.user.id} className="flex flex-wrap items-center gap-3 p-4 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-slate-50 transition-all">
                    <span className={cn('text-lg font-black w-6 text-center shrink-0',
                      i === 0 && 'text-amber-500', i === 1 && 'text-slate-400',
                      i === 2 && 'text-orange-400', i > 2 && 'text-slate-300',
                    )}>{i + 1}</span>

                    <Avatar>
                      <AvatarFallback className="bg-indigo-100 text-indigo-700 font-semibold">
                        {getInitials(stat.user.name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">{stat.user.name}</p>
                        {isNew && <Badge variant="default" className="text-[10px] py-0">Novo</Badge>}
                      </div>
                      <p className="text-xs text-slate-500 mb-1">{stat.user.email}</p>
                      <div className="flex items-center gap-1">
                        <div className="h-1.5 flex-1 max-w-32 bg-slate-100 rounded-full overflow-hidden">
                          <div className={cn('h-full rounded-full',
                            metaProgress >= 80 ? 'bg-green-500' : metaProgress >= 50 ? 'bg-amber-400' : 'bg-red-400'
                          )} style={{ width: `${metaProgress}%` }} />
                        </div>
                        <span className="text-xs text-slate-500">
                          {metaProgress.toFixed(0)}% de {formatCurrency(stat.user.meta)}
                        </span>
                      </div>
                    </div>

                    {!isNew && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 text-center w-full lg:w-auto">
                        <div>
                          <p className="text-xs text-slate-400">Conversão</p>
                          <p className={cn('text-sm font-bold',
                            stat.conversion_rate >= 35 ? 'text-green-600' : stat.conversion_rate >= 25 ? 'text-amber-600' : 'text-red-500'
                          )}>{stat.conversion_rate.toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Ticket Médio</p>
                          <p className="text-sm font-bold text-slate-800">{formatCurrency(stat.avg_ticket)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Ganhos</p>
                          <p className="text-sm font-bold text-green-600">{stat.won}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Ciclo Médio</p>
                          <p className="text-sm font-bold text-slate-800">{stat.avg_close_days}d</p>
                        </div>
                      </div>
                    )}

                    <Badge variant={isNew ? 'secondary' : stat.conversion_rate >= 35 ? 'success' : stat.conversion_rate >= 25 ? 'warning' : 'destructive'}>
                      {isNew ? 'Novo' : stat.conversion_rate >= 35 ? 'Destaque' : stat.conversion_rate >= 25 ? 'Regular' : 'Atenção'}
                    </Badge>

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors shrink-0">
                          <MoreVertical className="h-4 w-4 text-slate-400" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(stat.user)}>
                          <Pencil className="h-4 w-4 text-slate-500" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 hover:bg-red-50 focus:bg-red-50"
                          onClick={() => setDeleteTarget(stat)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <VendedorModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        initial={editTarget}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Excluir Vendedor"
        description={`Tem certeza que deseja excluir ${deleteTarget?.user.name}? Esta ação não pode ser desfeita.`}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget.user.id)}
      />
    </div>
  )
}
