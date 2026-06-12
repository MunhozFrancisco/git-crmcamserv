'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus, Search, MoreVertical, Phone, Mail, MessageCircle,
  LayoutGrid, List, Star, Building2, Trash2, Pencil,
} from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'

type Contact = {
  id: string
  name: string
  cargo: string | null
  department: string | null
  email: string | null
  phone: string | null
  whatsapp: string | null
  isPrimary: boolean
  clientId: string
  client?: { id: string; name: string }
}

type ClientOption = { id: string; name: string }

type FormState = {
  name: string
  cargo: string
  department: string
  email: string
  phone: string
  whatsapp: string
  is_primary: boolean
  client_id: string
}

const EMPTY: FormState = {
  name: '', cargo: '', department: '', email: '',
  phone: '', whatsapp: '', is_primary: false, client_id: '',
}

function normalizeContact(c: Record<string, unknown>): Contact {
  return {
    id: c.id as string,
    name: c.name as string,
    cargo: (c.cargo ?? null) as string | null,
    department: (c.department ?? null) as string | null,
    email: (c.email ?? null) as string | null,
    phone: (c.phone ?? null) as string | null,
    whatsapp: (c.whatsapp ?? null) as string | null,
    isPrimary: (c.isPrimary ?? c.is_primary ?? false) as boolean,
    clientId: (c.clientId ?? c.client_id ?? '') as string,
    client: c.client as { id: string; name: string } | undefined,
  }
}

export default function ContatosPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [clients, setClients] = useState<ClientOption[]>([])
  const [search, setSearch] = useState('')
  const [filterClient, setFilterClient] = useState('')
  const [view, setView] = useState<'card' | 'list'>('card')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Contact | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/contacts').then(r => r.ok ? r.json() : []),
      fetch('/api/clients').then(r => r.ok ? r.json() : []),
    ]).then(([cData, clData]) => {
      setContacts(cData.map(normalizeContact))
      setClients(clData.map((c: Record<string, unknown>) => ({ id: c.id as string, name: c.name as string })))
    })
  }, [])

  function openNew() {
    setEditing(null)
    setForm(EMPTY)
    setModalOpen(true)
  }

  function openEdit(c: Contact) {
    setEditing(c)
    setForm({
      name: c.name,
      cargo: c.cargo ?? '',
      department: c.department ?? '',
      email: c.email ?? '',
      phone: c.phone ?? '',
      whatsapp: c.whatsapp ?? '',
      is_primary: c.isPrimary,
      client_id: c.clientId,
    })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.name.trim() || !form.client_id) return
    setSaving(true)
    try {
      if (editing) {
        const res = await fetch(`/api/contacts/${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (!res.ok) throw new Error()
        const updated = normalizeContact(await res.json())
        updated.client = clients.find(c => c.id === updated.clientId)
        setContacts(prev => prev.map(c => c.id === updated.id ? updated : c))
      } else {
        const res = await fetch('/api/contacts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (!res.ok) throw new Error()
        const created = normalizeContact(await res.json())
        created.client = clients.find(c => c.id === created.clientId)
        setContacts(prev => [...prev, created])
      }
      setModalOpen(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/contacts/${id}`, { method: 'DELETE' })
    setContacts(prev => prev.filter(c => c.id !== id))
  }

  const filtered = contacts.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (c.cargo ?? '').toLowerCase().includes(search.toLowerCase())
    const matchClient = !filterClient || c.clientId === filterClient
    return matchSearch && matchClient
  })

  return (
    <div className="flex flex-col h-full">
      <Header title="Contatos" subtitle={`${filtered.length} contato${filtered.length !== 1 ? 's' : ''}`} />

      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input className="pl-8 h-9 text-sm" placeholder="Buscar contatos..."
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select
              value={filterClient}
              onChange={e => setFilterClient(e.target.value)}
              className="h-9 text-sm border border-slate-200 rounded-lg px-3 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-36"
            >
              <option value="">Todos os clientes</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex border border-slate-200 rounded-lg overflow-hidden">
              <button onClick={() => setView('card')}
                className={cn('p-2', view === 'card' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50')}>
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button onClick={() => setView('list')}
                className={cn('p-2', view === 'list' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50')}>
                <List className="h-4 w-4" />
              </button>
            </div>
            <Button size="sm" className="gap-1.5" onClick={openNew}>
              <Plus className="h-4 w-4" /> Novo Contato
            </Button>
          </div>
        </div>

        {/* Card view */}
        {view === 'card' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(c => (
              <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="text-sm bg-indigo-100 text-indigo-700 font-semibold">
                        {getInitials(c.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate leading-tight">{c.name}</p>
                      {c.isPrimary && (
                        <div className="flex items-center gap-0.5">
                          <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                          <span className="text-[10px] text-amber-600 font-medium">Principal</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1 rounded-md hover:bg-slate-100 text-slate-400">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(c)}>
                        <Pencil className="h-4 w-4 mr-2" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => handleDelete(c.id)}>
                        <Trash2 className="h-4 w-4 mr-2" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {c.cargo && <p className="text-xs text-slate-500 mb-1">{c.cargo}{c.department ? ` • ${c.department}` : ''}</p>}

                <div className="flex items-center gap-1.5 mb-1">
                  <Building2 className="h-3 w-3 text-slate-400 shrink-0" />
                  <span className="text-xs text-indigo-600 truncate">{c.client?.name ?? '—'}</span>
                </div>

                <div className="space-y-1 mt-2">
                  {c.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                      <span className="text-xs text-slate-600 truncate">{c.email}</span>
                    </div>
                  )}
                  {c.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                      <span className="text-xs text-slate-600">{c.phone}</span>
                    </div>
                  )}
                  {c.whatsapp && (
                    <div className="flex items-center gap-1.5">
                      <MessageCircle className="h-3 w-3 text-green-500 shrink-0" />
                      <span className="text-xs text-slate-600">{c.whatsapp}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full py-16 text-center text-slate-400 text-sm">
                Nenhum contato encontrado.
              </div>
            )}
          </div>
        )}

        {/* List view */}
        {view === 'list' && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Nome</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Cargo</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Cliente</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Contato</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="text-xs bg-indigo-100 text-indigo-700">
                            {getInitials(c.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-slate-900">{c.name}</p>
                          {c.isPrimary && <Badge variant="warning" className="text-[10px] px-1 py-0">Principal</Badge>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {c.cargo ?? '—'}
                      {c.department && <span className="text-slate-400"> · {c.department}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-indigo-600 text-xs">{c.client?.name ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {c.email && <a href={`mailto:${c.email}`} className="text-slate-400 hover:text-indigo-600"><Mail className="h-4 w-4" /></a>}
                        {c.phone && <a href={`tel:${c.phone}`} className="text-slate-400 hover:text-indigo-600"><Phone className="h-4 w-4" /></a>}
                        {c.whatsapp && <a href={`https://wa.me/${c.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-green-600"><MessageCircle className="h-4 w-4" /></a>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1 rounded-md hover:bg-slate-100 text-slate-400">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(c)}>
                            <Pencil className="h-4 w-4 mr-2" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => handleDelete(c.id)}>
                            <Trash2 className="h-4 w-4 mr-2" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 text-sm">
                      Nenhum contato encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Contato' : 'Novo Contato'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Atualize os dados do contato.' : 'Preencha os dados do novo contato.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="mb-1.5 block">Cliente *</Label>
              <select
                value={form.client_id}
                onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Selecione o cliente...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="mb-1.5 block">Nome *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Nome completo" />
              </div>
              <div>
                <Label className="mb-1.5 block">Cargo</Label>
                <Input value={form.cargo} onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))}
                  placeholder="Ex: Diretor Comercial" />
              </div>
              <div>
                <Label className="mb-1.5 block">Departamento</Label>
                <Input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                  placeholder="Ex: Compras" />
              </div>
              <div className="col-span-2">
                <Label className="mb-1.5 block">E-mail</Label>
                <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="email@empresa.com" />
              </div>
              <div>
                <Label className="mb-1.5 block">Telefone</Label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="(11) 1234-5678" />
              </div>
              <div>
                <Label className="mb-1.5 block">WhatsApp</Label>
                <Input value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))}
                  placeholder="(11) 9 1234-5678" />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_primary}
                onChange={e => setForm(f => ({ ...f, is_primary: e.target.checked }))}
                className="rounded border-slate-300 text-indigo-600" />
              <span className="text-sm text-slate-700">Contato principal</span>
            </label>
          </div>

          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.name.trim() || !form.client_id || saving}>
              {saving ? 'Salvando...' : editing ? 'Salvar' : 'Criar Contato'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
