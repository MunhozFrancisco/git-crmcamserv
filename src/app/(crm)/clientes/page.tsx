'use client'

import { useState } from 'react'
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
import { CLIENTS, USERS } from '@/lib/mock-data'
import type { Client, Contact } from '@/types'
import { formatDate, getInitials, cn } from '@/lib/utils'
import {
  Search, Plus, MoreVertical, Pencil, Trash2,
  Globe, MapPin, Hash, Briefcase, Users,
  Phone, Mail, MessageCircle, Star, ChevronLeft,
  ArrowUpCircle,
} from 'lucide-react'

const vendedores = USERS.filter(u => u.role === 'vendedor')

const temperatureConfig = {
  quente: { label: 'Quente', color: 'text-red-600 bg-red-50 border-red-100', dot: 'bg-red-500', icon: '🔥' },
  morno: { label: 'Morno', color: 'text-amber-600 bg-amber-50 border-amber-100', dot: 'bg-amber-400', icon: '🌤' },
  frio: { label: 'Frio', color: 'text-blue-600 bg-blue-50 border-blue-100', dot: 'bg-blue-400', icon: '🧊' },
}

function formatCNPJ(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 14)
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

/* ═══════════════════════════════════════════
   CLIENT MODAL
══════════════════════════════════════════════ */
type ClientForm = {
  status: 'lead' | 'cliente'
  name: string; razao_social: string; cnpj: string; site: string
  segment: string; address: string; source: Client['source']
  temperature: Client['temperature']; responsible_name: string; assigned_to: string
}

function ClienteModal({ open, onOpenChange, initial, currentUserId, isGestor, onSave }: {
  open: boolean; onOpenChange: (v: boolean) => void
  initial?: Client; currentUserId: string; isGestor: boolean
  onSave: (c: Client) => void
}) {
  const isEdit = !!initial
  const [form, setForm] = useState<ClientForm>({
    status: initial?.status ?? 'lead',
    name: initial?.name ?? '',
    razao_social: initial?.razao_social ?? '',
    cnpj: initial?.cnpj ?? '',
    site: initial?.site ?? '',
    segment: initial?.segment ?? '',
    address: initial?.address ?? '',
    source: initial?.source ?? 'outro',
    temperature: initial?.temperature ?? 'morno',
    responsible_name: initial?.responsible_name ?? '',
    assigned_to: initial?.assigned_to ?? (isGestor ? (vendedores[0]?.id ?? currentUserId) : currentUserId),
  })

  function field(k: keyof ClientForm, v: string) { setForm(f => ({ ...f, [k]: v })) }

  function handleSave() {
    if (!form.name) return
    onSave({
      id: initial?.id ?? `c${Date.now()}`,
      contacts: initial?.contacts ?? [],
      created_at: initial?.created_at ?? new Date().toISOString().split('T')[0],
      ...form,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Cadastro' : 'Novo Cadastro'}</DialogTitle>
          <DialogDescription>{isEdit ? 'Atualize os dados.' : 'Preencha os dados do lead ou cliente.'}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Status */}
          <div className="grid grid-cols-2 gap-2">
            {(['lead', 'cliente'] as const).map(s => (
              <button
                key={s}
                type="button"
                onClick={() => field('status', s)}
                className={cn(
                  'py-2 rounded-lg text-sm font-medium border transition-all',
                  form.status === s
                    ? s === 'cliente' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-amber-500 text-white border-amber-500'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300'
                )}
              >
                {s === 'lead' ? '🎯 Lead' : '✅ Cliente Ativo'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <Label className="mb-1.5 block">Nome / Nome Fantasia *</Label>
              <Input placeholder="Ex: Grupo Horizonte" value={form.name} onChange={e => field('name', e.target.value)} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Label className="mb-1.5 block">Razão Social</Label>
              <Input placeholder="Ex: Horizonte Tecnologia Ltda" value={form.razao_social} onChange={e => field('razao_social', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">CNPJ</Label>
              <Input placeholder="00.000.000/0001-00" value={form.cnpj} maxLength={18}
                onChange={e => field('cnpj', formatCNPJ(e.target.value))} />
            </div>
            <div>
              <Label className="mb-1.5 block">Site</Label>
              <Input placeholder="www.empresa.com.br" value={form.site} onChange={e => field('site', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Segmento</Label>
              <Input placeholder="Ex: Tecnologia, Saúde..." value={form.segment} onChange={e => field('segment', e.target.value)} />
            </div>
            <div>
              <Label className="mb-1.5 block">Temperatura</Label>
              <select value={form.temperature} onChange={e => field('temperature', e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="quente">🔥 Quente</option>
                <option value="morno">🌤 Morno</option>
                <option value="frio">🧊 Frio</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Origem</Label>
              <select value={form.source} onChange={e => field('source', e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="indicação">Indicação</option>
                <option value="site">Site</option>
                <option value="linkedin">LinkedIn</option>
                <option value="evento">Evento</option>
                <option value="cold-call">Cold Call</option>
                <option value="outro">Outro</option>
              </select>
            </div>
            <div>
              <Label className="mb-1.5 block">Vendedor Responsável</Label>
              {isGestor ? (
                <select value={form.assigned_to} onChange={e => field('assigned_to', e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  {vendedores.map(u => <option key={u.id} value={u.id}>{u.name.split(' ')[0]}</option>)}
                </select>
              ) : (
                <Input value={USERS.find(u => u.id === currentUserId)?.name.split(' ')[0] ?? ''} disabled />
              )}
            </div>
          </div>

          <div>
            <Label className="mb-1.5 block">Endereço Completo</Label>
            <Input placeholder="Rua, número, bairro, cidade/UF, CEP" value={form.address} onChange={e => field('address', e.target.value)} />
          </div>

          <div>
            <Label className="mb-1.5 block">Nome do Responsável Principal</Label>
            <Input placeholder="Contato principal na empresa" value={form.responsible_name} onChange={e => field('responsible_name', e.target.value)} />
          </div>
        </div>
        <DialogFooter className="gap-2 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!form.name}>
            {isEdit ? 'Salvar Alterações' : 'Cadastrar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ═══════════════════════════════════════════
   CONTACT FORM MODAL
══════════════════════════════════════════════ */
type ContactForm = {
  name: string; cargo: string; department: string
  email: string; phone: string; whatsapp: string; is_primary: boolean
}

function ContatoModal({ open, onOpenChange, clientId, initial, onSave }: {
  open: boolean; onOpenChange: (v: boolean) => void
  clientId: string; initial?: Contact; onSave: (c: Contact) => void
}) {
  const isEdit = !!initial
  const [form, setForm] = useState<ContactForm>({
    name: initial?.name ?? '', cargo: initial?.cargo ?? '',
    department: initial?.department ?? '', email: initial?.email ?? '',
    phone: initial?.phone ?? '', whatsapp: initial?.whatsapp ?? '',
    is_primary: initial?.is_primary ?? false,
  })

  function field(k: keyof ContactForm, v: string | boolean) { setForm(f => ({ ...f, [k]: v })) }

  function handleSave() {
    if (!form.name) return
    onSave({ id: initial?.id ?? `ct${Date.now()}`, client_id: clientId, ...form })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Contato' : 'Novo Contato'}</DialogTitle>
          <DialogDescription>{isEdit ? 'Atualize os dados do interlocutor.' : 'Adicione um interlocutor a este cadastro.'}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="mb-1.5 block">Nome *</Label>
            <Input placeholder="Nome completo" value={form.name} onChange={e => field('name', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Cargo</Label>
              <Input placeholder="Ex: Diretor de TI" value={form.cargo} onChange={e => field('cargo', e.target.value)} />
            </div>
            <div>
              <Label className="mb-1.5 block">Departamento</Label>
              <Input placeholder="Ex: Tecnologia" value={form.department} onChange={e => field('department', e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block">E-mail</Label>
            <Input type="email" placeholder="contato@empresa.com" value={form.email} onChange={e => field('email', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Telefone</Label>
              <Input type="tel" placeholder="(11) 99999-0000" value={form.phone} onChange={e => field('phone', e.target.value)} />
            </div>
            <div>
              <Label className="mb-1.5 block">WhatsApp</Label>
              <Input type="tel" placeholder="(11) 99999-0000" value={form.whatsapp} onChange={e => field('whatsapp', e.target.value)} />
            </div>
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input type="checkbox" checked={form.is_primary} onChange={e => field('is_primary', e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
            <span className="text-sm text-slate-700">Marcar como contato principal</span>
          </label>
        </div>
        <DialogFooter className="gap-2 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!form.name}>
            {isEdit ? 'Salvar Alterações' : 'Adicionar Contato'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ═══════════════════════════════════════════
   CONTACTS MANAGER MODAL
══════════════════════════════════════════════ */
function ContatosManager({ client, onUpdate }: { client: Client; onUpdate: (c: Client) => void }) {
  const [open, setOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editContact, setEditContact] = useState<Contact | undefined>()
  const [deleteContact, setDeleteContact] = useState<Contact | null>(null)
  const count = client.contacts.length

  function saveContact(contact: Contact) {
    const exists = client.contacts.find(c => c.id === contact.id)
    let updated = exists
      ? client.contacts.map(c => c.id === contact.id ? contact : c)
      : [...client.contacts, contact]
    if (contact.is_primary) updated = updated.map(c => ({ ...c, is_primary: c.id === contact.id }))
    onUpdate({ ...client, contacts: updated })
    setEditContact(undefined)
  }

  function deleteById(id: string) {
    onUpdate({ ...client, contacts: client.contacts.filter(c => c.id !== id) })
    setDeleteContact(null)
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-indigo-600 font-medium hover:text-indigo-800 transition-colors">
        <Users className="h-3.5 w-3.5" />
        {count === 0 ? 'Sem contatos' : `${count} contato${count !== 1 ? 's' : ''}`}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0">
          <DialogTitle className="sr-only">Contatos — {client.name}</DialogTitle>
          <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-slate-100">
            <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              <ChevronLeft className="h-4 w-4 text-slate-500" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-slate-900">Contatos — {client.name}</p>
              <p className="text-xs text-slate-500">{count} interlocutor{count !== 1 ? 'es' : ''} cadastrado{count !== 1 ? 's' : ''}</p>
            </div>
            <Button size="sm" className="gap-1.5 shrink-0" onClick={() => { setEditContact(undefined); setFormOpen(true) }}>
              <Plus className="h-3.5 w-3.5" />
              Novo Contato
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
            {count === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-10 w-10 text-slate-300 mb-3" />
                <p className="text-slate-500 font-medium">Nenhum contato cadastrado</p>
                <p className="text-sm text-slate-400 mt-1">Adicione os interlocutores deste cadastro.</p>
              </div>
            ) : (
              client.contacts.map(contact => (
                <div key={contact.id} className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-slate-50 transition-all">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-indigo-700">{getInitials(contact.name)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="text-sm font-semibold text-slate-900">{contact.name}</p>
                      {contact.is_primary && (
                        <Badge variant="default" className="text-[10px] py-0 gap-1">
                          <Star className="h-2.5 w-2.5" /> Principal
                        </Badge>
                      )}
                    </div>
                    {(contact.cargo || contact.department) && (
                      <p className="text-xs text-slate-500 mb-2">
                        {contact.cargo}{contact.cargo && contact.department ? ' · ' : ''}{contact.department}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      {contact.email && (
                        <a href={`mailto:${contact.email}`} className="flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-600 transition-colors">
                          <Mail className="h-3 w-3 shrink-0" />{contact.email}
                        </a>
                      )}
                      {contact.phone && (
                        <a href={`tel:${contact.phone}`} className="flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-600 transition-colors">
                          <Phone className="h-3 w-3 shrink-0" />{contact.phone}
                        </a>
                      )}
                      {contact.whatsapp && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <MessageCircle className="h-3 w-3 shrink-0 text-green-500" />{contact.whatsapp}
                        </span>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1.5 rounded-lg hover:bg-slate-200 transition-colors shrink-0">
                        <MoreVertical className="h-4 w-4 text-slate-400" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {!contact.is_primary && (
                        <>
                          <DropdownMenuItem onClick={() => saveContact({ ...contact, is_primary: true })}>
                            <Star className="h-4 w-4 text-amber-500" />Tornar Principal
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      <DropdownMenuItem onClick={() => { setEditContact(contact); setFormOpen(true) }}>
                        <Pencil className="h-4 w-4 text-slate-500" />Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600 hover:bg-red-50 focus:bg-red-50"
                        onClick={() => setDeleteContact(contact)}>
                        <Trash2 className="h-4 w-4" />Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ContatoModal open={formOpen} onOpenChange={setFormOpen}
        clientId={client.id} initial={editContact} onSave={saveContact} />

      <ConfirmDialog open={!!deleteContact} onOpenChange={v => !v && setDeleteContact(null)}
        title="Excluir Contato"
        description={`Tem certeza que deseja excluir "${deleteContact?.name}"?`}
        onConfirm={() => deleteContact && deleteById(deleteContact.id)} />
    </>
  )
}

/* ═══════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════ */
type StatusFilter = 'todos' | 'lead' | 'cliente'

export default function ClientesPage() {
  const { currentUser } = useUser()
  const isGestor = currentUser?.role === 'gestor'

  const [clients, setClients] = useState<Client[]>(CLIENTS)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos')
  const [tempFilter, setTempFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Client | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null)

  const getUserName = (id: string) => USERS.find(u => u.id === id)?.name ?? '—'

  const visible = isGestor ? clients : clients.filter(c => c.assigned_to === currentUser?.id)

  const filtered = visible.filter(c => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.razao_social.toLowerCase().includes(search.toLowerCase()) ||
      c.cnpj.includes(search) ||
      c.responsible_name.toLowerCase().includes(search.toLowerCase()) ||
      c.segment.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'todos' || c.status === statusFilter
    const matchTemp = !tempFilter || c.temperature === tempFilter
    return matchSearch && matchStatus && matchTemp
  })

  const countLeads = visible.filter(c => c.status === 'lead').length
  const countClientes = visible.filter(c => c.status === 'cliente').length

  function updateClient(client: Client) {
    setClients(prev => {
      const exists = prev.find(c => c.id === client.id)
      if (exists) return prev.map(c => c.id === client.id ? client : c)
      return [client, ...prev]
    })
    setEditTarget(undefined)
  }

  function handleDelete(id: string) {
    setClients(prev => prev.filter(c => c.id !== id))
    setDeleteTarget(null)
  }

  function convertToCliente(client: Client) {
    updateClient({ ...client, status: 'cliente' })
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Clientes"
        subtitle={`${countClientes} cliente${countClientes !== 1 ? 's' : ''} ativos · ${countLeads} lead${countLeads !== 1 ? 's' : ''}${!isGestor ? ' — seus registros' : ''}`}
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 lg:px-6 py-3 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status tabs */}
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            {([['todos', 'Todos'], ['cliente', 'Clientes'], ['lead', 'Leads']] as [StatusFilter, string][]).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setStatusFilter(val)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium transition-colors',
                  statusFilter === val
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 hover:bg-slate-50'
                )}
              >
                {label}
                {val === 'cliente' && <span className="ml-1 opacity-70">({countClientes})</span>}
                {val === 'lead' && <span className="ml-1 opacity-70">({countLeads})</span>}
              </button>
            ))}
          </div>

          <select value={tempFilter} onChange={e => setTempFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Temperatura</option>
            <option value="quente">🔥 Quente</option>
            <option value="morno">🌤 Morno</option>
            <option value="frio">🧊 Frio</option>
          </select>

          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
            <Input className="pl-8 w-52 h-8 text-xs" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <Button size="sm" className="gap-1.5" onClick={() => { setEditTarget(undefined); setModalOpen(true) }}>
          <Plus className="h-3.5 w-3.5" />
          Novo
        </Button>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Briefcase className="h-10 w-10 text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">Nenhum registro encontrado</p>
            <p className="text-sm text-slate-400 mt-1">Ajuste os filtros ou cadastre um novo cliente.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(client => {
              const sellerName = getUserName(client.assigned_to)
              const primaryContact = client.contacts.find(c => c.is_primary) ?? client.contacts[0]
              const temp = temperatureConfig[client.temperature]
              const isLead = client.status === 'lead'

              return (
                <Card key={client.id} className={cn(
                  'hover:shadow-md transition-all',
                  isLead ? 'hover:border-amber-200 border-amber-100/80' : 'hover:border-indigo-200'
                )}>
                  <CardContent className="pt-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={cn(
                          'h-10 w-10 rounded-xl flex items-center justify-center shrink-0',
                          isLead ? 'bg-amber-100' : 'bg-indigo-100'
                        )}>
                          <span className={cn('text-sm font-bold', isLead ? 'text-amber-700' : 'text-indigo-700')}>
                            {getInitials(client.name)}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 leading-tight truncate">{client.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Badge
                              variant={isLead ? 'warning' : 'success'}
                              className="text-[10px] py-0"
                            >
                              {isLead ? '🎯 Lead' : '✅ Cliente'}
                            </Badge>
                            {client.segment && (
                              <span className="text-xs text-slate-400 truncate">{client.segment}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors shrink-0 ml-1">
                            <MoreVertical className="h-4 w-4 text-slate-400" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {isLead && (
                            <>
                              <DropdownMenuItem onClick={() => convertToCliente(client)}>
                                <ArrowUpCircle className="h-4 w-4 text-green-600" />
                                Converter para Cliente
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          <DropdownMenuItem onClick={() => { setEditTarget(client); setModalOpen(true) }}>
                            <Pencil className="h-4 w-4 text-slate-500" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600 hover:bg-red-50 focus:bg-red-50"
                            onClick={() => setDeleteTarget(client)}>
                            <Trash2 className="h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Info */}
                    <div className="space-y-1.5 mb-3">
                      {/* Temperature + source */}
                      <div className="flex items-center gap-2">
                        <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', temp.color)}>
                          {temp.icon} {temp.label}
                        </span>
                        <span className="text-xs text-slate-400 capitalize">{client.source}</span>
                      </div>

                      {client.cnpj && (
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <Hash className="h-3 w-3 text-slate-400 shrink-0" />
                          <span className="font-mono">{client.cnpj}</span>
                        </div>
                      )}
                      {primaryContact && (
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <Star className="h-3 w-3 text-amber-400 shrink-0" />
                          <span className="truncate">
                            {primaryContact.name}{primaryContact.cargo ? ` · ${primaryContact.cargo}` : ''}
                          </span>
                        </div>
                      )}
                      {client.site && (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Globe className="h-3 w-3 text-slate-400 shrink-0" />
                          <span className="truncate">{client.site}</span>
                        </div>
                      )}
                      {client.address && (
                        <div className="flex items-start gap-2 text-xs text-slate-500">
                          <MapPin className="h-3 w-3 text-slate-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{client.address}</span>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <ContatosManager
                        client={client}
                        onUpdate={updated => setClients(prev => prev.map(c => c.id === updated.id ? updated : c))}
                      />
                      <div className="flex items-center gap-1.5">
                        <div className="h-5 w-5 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="text-[9px] font-bold text-indigo-700">{getInitials(sellerName)}</span>
                        </div>
                        <span className="text-xs text-slate-400">{formatDate(client.created_at)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {currentUser && (
        <ClienteModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          initial={editTarget}
          currentUserId={currentUser.id}
          isGestor={isGestor}
          onSave={updateClient}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={v => !v && setDeleteTarget(null)}
        title="Excluir Registro"
        description={`Tem certeza que deseja excluir "${deleteTarget?.name}" e todos os seus contatos?`}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget.id)}
      />
    </div>
  )
}
