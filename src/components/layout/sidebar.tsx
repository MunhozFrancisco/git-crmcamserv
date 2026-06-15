'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Kanban, CheckSquare,
  BarChart3, Sparkles, LogOut, Building2, Package, Briefcase, Users, KeyRound, Loader2,
} from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import { useUser } from '@/contexts/user-context'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function AlterarSenhaModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function reset() {
    setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
    setError(''); setSuccess(false)
  }

  function handleClose(v: boolean) {
    if (!v) reset()
    onOpenChange(v)
  }

  async function handleSave() {
    if (newPassword !== confirmPassword) {
      setError('A nova senha e a confirmação não coincidem.')
      return
    }
    if (newPassword.length < 6) {
      setError('A nova senha deve ter ao menos 6 caracteres.')
      return
    }
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/users/me/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao alterar senha')
      setSuccess(true)
      setTimeout(() => handleClose(false), 1500)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Alterar Senha</DialogTitle>
          <DialogDescription>Informe sua senha atual e escolha uma nova.</DialogDescription>
        </DialogHeader>
        {success ? (
          <p className="text-sm text-green-600 text-center py-2">Senha alterada com sucesso!</p>
        ) : (
          <div className="space-y-4">
            <div>
              <Label className="mb-1.5 block">Senha atual</Label>
              <Input type="password" value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)} placeholder="••••••" />
            </div>
            <div>
              <Label className="mb-1.5 block">Nova senha</Label>
              <Input type="password" value={newPassword}
                onChange={e => setNewPassword(e.target.value)} placeholder="Mín. 6 caracteres" />
            </div>
            <div>
              <Label className="mb-1.5 block">Confirmar nova senha</Label>
              <Input type="password" value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)} placeholder="Repita a nova senha" />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        )}
        <DialogFooter className="gap-2 mt-2">
          <Button variant="outline" onClick={() => handleClose(false)} disabled={saving}>Cancelar</Button>
          {!success && (
            <Button onClick={handleSave} disabled={!currentPassword || !newPassword || saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Salvar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/pipeline', label: 'Pipeline', icon: Kanban },
  { href: '/clientes', label: 'Clientes', icon: Briefcase },
  { href: '/contatos', label: 'Contatos', icon: Users },
  { href: '/tarefas', label: 'Tarefas', icon: CheckSquare },
]

const managerItems = [
  { href: '/admin/vendedores', label: 'Vendedores', icon: BarChart3 },
  { href: '/admin/produtos', label: 'Produtos & Serviços', icon: Package },
  { href: '/ai/insights', label: 'IA Insights', icon: Sparkles },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { currentUser, logout } = useUser()
  const [senhaOpen, setSenhaOpen] = useState(false)

  function handleLogout() {
    logout()
    router.push('/login')
  }

  const isGestor = currentUser?.role === 'gestor'
  const displayName = currentUser?.name ?? 'Usuário'
  const displayRole = currentUser?.role ?? 'vendedor'

  return (
    <aside className="flex h-screen w-60 flex-col bg-slate-900 text-slate-100">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-5 border-b border-slate-800">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
          <Building2 className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-none">Camserv</p>
          <p className="text-xs text-slate-400 leading-none mt-0.5">CRM</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}

        {isGestor && (
          <>
            <div className="pt-4 pb-1 px-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Gestão</p>
            </div>
            {managerItems.map((item) => {
              const Icon = item.icon
              const active = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              )
            })}
          </>
        )}
      </nav>

      {/* Role Badge for vendedor */}
      {!isGestor && (
        <div className="px-4 pb-2">
          <div className="rounded-lg bg-slate-800 px-3 py-2 text-center">
            <p className="text-xs text-slate-400">Você está vendo apenas</p>
            <p className="text-xs font-semibold text-indigo-400">suas oportunidades</p>
          </div>
        </div>
      )}

      {/* User */}
      <div className="border-t border-slate-800 p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className={cn(
              'text-xs font-semibold',
              isGestor ? 'bg-indigo-600 text-white' : 'bg-slate-600 text-slate-200'
            )}>
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{displayName}</p>
            <p className="text-xs text-slate-400 capitalize">{displayRole}</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSenhaOpen(true)}
              title="Alterar senha"
              className="text-slate-400 hover:text-white transition-colors p-1 rounded"
            >
              <KeyRound className="h-4 w-4" />
            </button>
            <button
              onClick={handleLogout}
              title="Sair"
              className="flex items-center gap-1.5 text-red-400 hover:text-red-300 hover:bg-slate-800 transition-colors px-2 py-1 rounded-lg text-xs font-medium"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sair
            </button>
          </div>
        </div>
      </div>

      <AlterarSenhaModal open={senhaOpen} onOpenChange={setSenhaOpen} />
    </aside>
  )
}
