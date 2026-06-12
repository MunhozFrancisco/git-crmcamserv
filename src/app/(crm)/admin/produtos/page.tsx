'use client'

import { useState, useEffect } from 'react'
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
import type { Product, ProductCategory, ProductType } from '@/types'
import { formatCurrency } from '@/lib/utils'
import {
  Plus, Package, Wrench, ToggleLeft, ToggleRight,
  Search, MoreVertical, Pencil, Trash2, Loader2,
} from 'lucide-react'

const CATEGORIES: ProductCategory[] = [
  'Software', 'Hardware', 'Consultoria', 'Suporte', 'Treinamento', 'Infraestrutura', 'Outro'
]

type FormState = {
  name: string
  description: string
  type: ProductType
  category: ProductCategory
  price: string
  unit: string
}

const EMPTY_FORM: FormState = {
  name: '', description: '', type: 'serviço', category: 'Software', price: '', unit: '/mês',
}

/* ─── Normalizar produto do banco → frontend ─────────────── */
function normalizeProduct(p: Record<string, unknown>): Product {
  return {
    id: p.id as string,
    name: p.name as string,
    description: (p.description ?? '') as string,
    type: p.type as ProductType,
    category: p.category as ProductCategory,
    price: Number(p.price ?? 0),
    unit: (p.unit ?? 'único') as string,
    active: (p.active ?? true) as boolean,
    created_at: p.createdAt
      ? (p.createdAt as string).split('T')[0]
      : (p.created_at as string ?? ''),
  }
}

function ProdutoModal({
  open, onOpenChange, initial, onSave,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  initial?: Product
  onSave: (p: Product) => void
}) {
  const isEdit = !!initial
  const [form, setForm] = useState<FormState>(
    initial
      ? {
          name: initial.name,
          description: initial.description,
          type: initial.type,
          category: initial.category,
          price: String(initial.price),
          unit: initial.unit,
        }
      : EMPTY_FORM
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setForm(
        initial
          ? {
              name: initial.name,
              description: initial.description,
              type: initial.type,
              category: initial.category,
              price: String(initial.price),
              unit: initial.unit,
            }
          : EMPTY_FORM
      )
      setError('')
    }
  }, [open, initial])

  function field(key: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSave() {
    if (!form.name || !form.price) return
    setSaving(true)
    setError('')
    try {
      const payload = {
        name: form.name,
        description: form.description,
        type: form.type,
        category: form.category,
        price: parseFloat(form.price),
        unit: form.unit,
        active: initial?.active ?? true,
      }

      const url = isEdit ? `/api/products/${initial!.id}` : '/api/products'
      const method = isEdit ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error(await res.text())
      const saved = await res.json()
      onSave(normalizeProduct(saved))
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
          <DialogTitle>{isEdit ? 'Editar Produto / Serviço' : 'Novo Produto / Serviço'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Altere os dados do item no catálogo.' : 'Preencha os dados. Somente o gestor pode cadastrar itens no catálogo.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Tipo</Label>
              <select
                value={form.type}
                onChange={(e) => field('type', e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="produto">Produto</option>
                <option value="serviço">Serviço</option>
              </select>
            </div>
            <div>
              <Label className="mb-1.5 block">Categoria</Label>
              <select
                value={form.category}
                onChange={(e) => field('category', e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <Label className="mb-1.5 block">Nome *</Label>
            <Input
              placeholder="Ex: CRM Pro, Suporte Técnico..."
              value={form.name}
              onChange={(e) => field('name', e.target.value)}
            />
          </div>

          <div>
            <Label className="mb-1.5 block">Descrição</Label>
            <textarea
              value={form.description}
              onChange={(e) => field('description', e.target.value)}
              placeholder="Descreva o produto ou serviço..."
              rows={3}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Preço (R$) *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
                value={form.price}
                onChange={(e) => field('price', e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-1.5 block">Unidade</Label>
              <Input
                placeholder="Ex: /mês, único, /hora"
                value={form.unit}
                onChange={(e) => field('unit', e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <DialogFooter className="gap-2 mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!form.name || !form.price || saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {isEdit ? 'Salvar Alterações' : 'Cadastrar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function ProdutosPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('')
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Product | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await fetch('/api/products')
        if (res.ok) {
          const data = await res.json()
          setProducts(data.map(normalizeProduct))
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function toggleActive(product: Product) {
    const novoEstado = !product.active
    // Atualização otimista na UI
    setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, active: novoEstado } : p))
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: novoEstado }),
      })
      if (!res.ok) {
        // Reverter se falhou
        setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, active: product.active } : p))
      }
    } catch {
      setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, active: product.active } : p))
    }
  }

  function handleSave(p: Product) {
    setProducts((prev) => {
      const exists = prev.find((x) => x.id === p.id)
      if (exists) return prev.map((x) => x.id === p.id ? p : x)
      return [p, ...prev]
    })
    setEditTarget(undefined)
  }

  async function handleDelete(id: string) {
    setDeleting(true)
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' })
      setProducts((prev) => prev.filter((p) => p.id !== id))
    } catch {
      // Manter estado local
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  function openEdit(product: Product) {
    setEditTarget(product)
    setModalOpen(true)
  }

  function openNew() {
    setEditTarget(undefined)
    setModalOpen(true)
  }

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
    const matchType = !filterType || p.type === filterType
    const matchCat = !filterCategory || p.category === filterCategory
    return matchSearch && matchType && matchCat
  })

  const ativos = filtered.filter((p) => p.active).length
  const inativos = filtered.filter((p) => !p.active).length

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Produtos & Serviços" subtitle="Carregando catálogo..." />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Produtos & Serviços"
        subtitle={`Catálogo padronizado — ${ativos} ativos · ${inativos} inativos`}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 px-4 lg:px-6 py-3 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
            <Input
              className="pl-8 w-52 h-8 text-xs"
              placeholder="Buscar produto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Produto & Serviço</option>
            <option value="produto">Produtos</option>
            <option value="serviço">Serviços</option>
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Todas as categorias</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <Button size="sm" className="gap-1.5" onClick={openNew}>
          <Plus className="h-3.5 w-3.5" />
          Novo Produto / Serviço
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((product) => (
            <Card
              key={product.id}
              className={`transition-all hover:shadow-md ${!product.active ? 'opacity-60' : 'hover:border-indigo-200'}`}
            >
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${product.type === 'serviço' ? 'bg-indigo-100' : 'bg-slate-100'
                      }`}>
                      {product.type === 'serviço'
                        ? <Wrench className="h-4 w-4 text-indigo-600" />
                        : <Package className="h-4 w-4 text-slate-600" />
                      }
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 leading-tight">{product.name}</p>
                      <p className="text-xs text-slate-500 capitalize">{product.type}</p>
                    </div>
                  </div>
                  <Badge variant={product.active ? 'success' : 'secondary'}>
                    {product.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>

                <p className="text-xs text-slate-500 mb-3 leading-relaxed line-clamp-2">
                  {product.description}
                </p>

                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="secondary" className="text-xs">{product.category}</Badge>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div>
                    <p className="text-base font-bold text-slate-900">{formatCurrency(product.price)}</p>
                    <p className="text-xs text-slate-400">{product.unit}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      title={product.active ? 'Desativar' : 'Ativar'}
                      onClick={() => toggleActive(product)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-700"
                    >
                      {product.active
                        ? <ToggleRight className="h-5 w-5 text-green-500" />
                        : <ToggleLeft className="h-5 w-5" />
                      }
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors shrink-0">
                          <MoreVertical className="h-4 w-4 text-slate-400" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(product)}>
                          <Pencil className="h-4 w-4 text-slate-500" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 hover:bg-red-50 focus:bg-red-50"
                          onClick={() => setDeleteTarget(product)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-3 flex flex-col items-center justify-center py-16 text-center">
              <Package className="h-10 w-10 text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">Nenhum produto encontrado</p>
              <p className="text-sm text-slate-400 mt-1">Ajuste os filtros ou adicione um novo produto</p>
            </div>
          )}
        </div>
      </div>

      <ProdutoModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        initial={editTarget}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Excluir Produto"
        description={`Tem certeza que deseja excluir "${deleteTarget?.name}"? Esta ação não pode ser desfeita.`}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget.id)}
        disabled={deleting}
      />
    </div>
  )
}
