'use client'

import { useState, useEffect, useCallback } from 'react'
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
import type { User } from '@/types'
import { formatCurrency, getInitials, cn } from '@/lib/utils'
import {
  Trophy, TrendingUp, Target, UserPlus, MoreVertical,
  Pencil, Trash2, RefreshCw, Loader2, LayoutGrid, List,
} from 'lucide-react'

/* ─── Tipo para estatísticas de vendedor (calculadas localmente) ── */
type SellerRow = {
  user: User
  total_opportunities: number
  won: number
  lost: number
  open: number
  conversion_rate: number
  total_value: number
  avg_ticket: number
  avg_close_days: number
}

type FormState = { name: string; email: string; phone: string; password: string; meta: string }

/* ─── Normalizar usuário do banco → User ────────────────── */
function normalizeUser(u: Record<string, unknown>): User {
  return {
    id: u.id as string,
    name: u.name as string,
    email: u.email as string,
    role: u.role as 'gestor' | 'vendedor',
    meta: Number(u.meta ?? 0),
    active: (u.active ?? true) as boolean,
  }
}

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
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setForm({
        name: initial?.name ?? '',
        email: initial?.email ?? '',
        phone: '',
        password: '',
        meta: String(initial?.meta ?? ''),
      })
      setSaved(false)
      setError('')
    }
  }, [open, initial])

  function field(key: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function generatePassword() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    const pw = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    setForm((f) => ({ ...f, password: `Camserv@${pw}` }))
  }

  async function handleSave() {
    if (!form.name || !form.email || !form.meta) return
    if (!isEdit && !form.password) {
      setError('Senha é obrigatória para novo vendedor.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        email: form.email,
        meta: parseFloat(form.meta),
        role: 'vendedor',
      }
      if (form.password) payload.password = form.password

      const url = isEdit ? `/api/users/${initial!.id}` : '/api/users'
      const method = isEdit ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Erro ao salvar')
      }

      const saved = await res.json()
      onSave(normalizeUser(saved))

      if (!isEdit) {
        setSaved(true)
        setTimeout(() => {
          onOpenChange(false)
          setSaved(false)
        }, 1200)
      } else {
        onOpenChange(false)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar. Tente novamente.')
    } finally {
      setSaving(false)
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
                <Label className="mb-1.5 block">{isEdit ? 'Nova senha (deixe em branco para manter)' : 'Senha *'}</Label>
                <div className="flex gap-2">
                  <Input
                    value={form.password}
                    onChange={(e) => field('password', e.target.value)}
                    placeholder={isEdit ? 'Deixe em branco para não alterar' : 'Ex: Camserv@2025'}
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
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
            <DialogFooter className="gap-2 mt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
              <Button onClick={handleSave} disabled={!form.name || !form.email || !form.meta || saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {isEdit ? 'Salvar Alterações' : 'Cadastrar Vendedor'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function TransferDeleteDialog({
  open, onOpenChange, seller, otherSellers, onConfirm, disabled,
}: {
  open: boolean; onOpenChange: (v: boolean) => void
  seller: SellerRow | null; otherSellers: SellerRow[]
  onConfirm: (transferToId: string) => void; disabled: boolean
}) {
  const [transferToId, setTransferToId] = useState('')

  useEffect(() => {
    if (open && otherSellers.length > 0) {
      setTransferToId(otherSellers[0].user.id)
    }
  }, [open, otherSellers])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Desativar Vendedor</DialogTitle>
          <DialogDescription>
            As oportunidades, clientes e tarefas de <strong>{seller?.user.name}</strong> serão transferidos para outro vendedor antes da desativação.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="mb-1.5 block">Transferir registros para</Label>
            {otherSellers.length === 0 ? (
              <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                Nenhum outro vendedor disponível. Cadastre outro vendedor antes de desativar este.
              </p>
            ) : (
              <select value={transferToId} onChange={e => setTransferToId(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {otherSellers.map(s => (
                  <option key={s.user.id} value={s.user.id}>{s.user.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={disabled}>Cancelar</Button>
          <Button variant="destructive" disabled={!transferToId || otherSellers.length === 0 || disabled}
            onClick={() => onConfirm(transferToId)}>
            {disabled && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Desativar e Transferir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function VendedoresPage() {
  const [sellers, setSellers] = useState<SellerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'card' | 'list'>('card')
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<User | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<SellerRow | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await fetch('/api/users')
        if (res.ok) {
          const data = await res.json()
          // Filtrar apenas vendedores ativos e montar estrutura SellerRow
          const rows: SellerRow[] = data
            .filter((u: Record<string, unknown>) => u.role === 'vendedor' && u.active !== false)
            .map((u: Record<string, unknown>) => ({
              user: normalizeUser(u),
              total_opportunities: 0,
              won: 0,
              lost: 0,
              open: 0,
              conversion_rate: 0,
              total_value: 0,
              avg_ticket: 0,
              avg_close_days: 0,
            }))
          setSellers(rows)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  function handleSave(user: User) {
    setSellers((prev) => {
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

  async function handleDelete(id: string, transferToId: string) {
    setDeleting(true)
    try {
      await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transfer_to_id: transferToId }),
      })
      setSellers((prev) => prev.filter((s) => s.user.id !== id))
    } catch {
      // Manter estado local
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  function openEdit(user: User) {
    setEditTarget(user)
    setModalOpen(true)
  }

  function openNew() {
    setEditTarget(undefined)
    setModalOpen(true)
  }

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Vendedores" subtitle="Carregando equipe..." />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Vendedores" subtitle="Equipe comercial — gerenciado pelo gestor" />

      <div className="flex items-center justify-between px-4 lg:px-6 py-3 border-b border-slate-200 bg-white">
        <p className="text-sm text-slate-500">
          <span className="font-semibold text-slate-900">{sellers.length}</span> vendedor{sellers.length !== 1 ? 'es' : ''} na equipe
        </p>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            <button onClick={() => setView('card')} title="Cards"
              className={cn('px-2.5 py-1.5 transition-colors', view === 'card' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50')}>
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => setView('list')} title="Lista"
              className={cn('px-2.5 py-1.5 transition-colors', view === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50')}>
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
          <Button size="sm" className="gap-1.5" onClick={openNew}>
            <UserPlus className="h-3.5 w-3.5" />
            Novo Vendedor
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
        {/* Resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3 mb-2">
                <Trophy className="h-4 w-4 text-amber-500" />
                <p className="text-sm text-slate-500">Melhor Conversão</p>
              </div>
              <p className="text-lg font-bold text-slate-900">
                {sellers.sort((a, b) => b.conversion_rate - a.conversion_rate)[0]?.user.name.split(' ')[0] ?? '—'}
              </p>
              <p className="text-xs text-green-600 font-semibold">
                {sellers[0]?.conversion_rate.toFixed(1) ?? '0.0'}% taxa
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3 mb-2">
                <Target className="h-4 w-4 text-indigo-500" />
                <p className="text-sm text-slate-500">Total em Aberto</p>
              </div>
              <p className="text-lg font-bold text-slate-900">{sellers.reduce((s, v) => s + v.open, 0)}</p>
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
                {formatCurrency(sellers.reduce((s, v) => s + v.total_value, 0))}
              </p>
              <p className="text-xs text-slate-500">em negócios fechados</p>
            </CardContent>
          </Card>
        </div>

        {sellers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <UserPlus className="h-10 w-10 text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">Nenhum vendedor cadastrado</p>
              <p className="text-sm text-slate-400 mt-1">Adicione o primeiro membro da equipe.</p>
            </CardContent>
          </Card>
        ) : view === 'card' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sellers.map((stat, i) => {
              const metaProgress = stat.user.meta > 0 ? Math.min((stat.total_value / stat.user.meta) * 100, 100) : 0
              const isNew = stat.total_opportunities === 0
              return (
                <Card key={stat.user.id} className="hover:shadow-md transition-all hover:border-indigo-200">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className={cn('text-lg font-black w-6 text-center',
                          i === 0 && 'text-amber-500', i === 1 && 'text-slate-400',
                          i === 2 && 'text-orange-400', i > 2 && 'text-slate-300',
                        )}>{i + 1}</span>
                        <Avatar>
                          <AvatarFallback className="bg-indigo-100 text-indigo-700 font-semibold">
                            {getInitials(stat.user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{stat.user.name}</p>
                          <p className="text-xs text-slate-500">{stat.user.email}</p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                            <MoreVertical className="h-4 w-4 text-slate-400" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(stat.user)}>
                            <Pencil className="h-4 w-4 text-slate-500" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600 hover:bg-red-50 focus:bg-red-50"
                            onClick={() => setDeleteTarget(stat)}>
                            <Trash2 className="h-4 w-4" /> Desativar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="mb-3">
                      <div className="flex items-center gap-1 mb-1">
                        <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                          <div className={cn('h-full rounded-full',
                            metaProgress >= 80 ? 'bg-green-500' : metaProgress >= 50 ? 'bg-amber-400' : 'bg-red-400'
                          )} style={{ width: `${metaProgress}%` }} />
                        </div>
                        <span className="text-xs text-slate-500 shrink-0">{metaProgress.toFixed(0)}%</span>
                      </div>
                      <p className="text-xs text-slate-400">Meta: {formatCurrency(stat.user.meta)}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center border-t border-slate-100 pt-3">
                      <div>
                        <p className="text-xs text-slate-400">Ganhos</p>
                        <p className="text-sm font-bold text-green-600">{stat.won}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Conversão</p>
                        <p className={cn('text-sm font-bold',
                          stat.conversion_rate >= 35 ? 'text-green-600' : stat.conversion_rate >= 25 ? 'text-amber-600' : 'text-red-500'
                        )}>{stat.conversion_rate.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Em aberto</p>
                        <p className="text-sm font-bold text-slate-700">{stat.open}</p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <Badge variant={isNew ? 'secondary' : stat.conversion_rate >= 35 ? 'success' : stat.conversion_rate >= 25 ? 'warning' : 'destructive'}>
                        {isNew ? 'Novo' : stat.conversion_rate >= 35 ? 'Destaque' : stat.conversion_rate >= 25 ? 'Regular' : 'Atenção'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card>
            <CardHeader><CardTitle>Equipe Comercial</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sellers.map((stat, i) => {
                  const metaProgress = stat.user.meta > 0 ? Math.min((stat.total_value / stat.user.meta) * 100, 100) : 0
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
                          <span className="text-xs text-slate-500">{metaProgress.toFixed(0)}% de {formatCurrency(stat.user.meta)}</span>
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors shrink-0">
                            <MoreVertical className="h-4 w-4 text-slate-400" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(stat.user)}>
                            <Pencil className="h-4 w-4 text-slate-500" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600 hover:bg-red-50 focus:bg-red-50"
                            onClick={() => setDeleteTarget(stat)}>
                            <Trash2 className="h-4 w-4" /> Desativar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <VendedorModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        initial={editTarget}
        onSave={handleSave}
      />

      <TransferDeleteDialog
        open={!!deleteTarget}
        onOpenChange={v => !v && setDeleteTarget(null)}
        seller={deleteTarget}
        otherSellers={sellers.filter(s => s.user.id !== deleteTarget?.user.id)}
        onConfirm={transferToId => deleteTarget && handleDelete(deleteTarget.user.id, transferToId)}
        disabled={deleting}
      />
    </div>
  )
}
