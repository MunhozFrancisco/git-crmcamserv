'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Kanban, CheckSquare,
  BarChart3, Sparkles, LogOut, Building2, Package, Briefcase,
} from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import { useUser } from '@/contexts/user-context'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/pipeline', label: 'Pipeline', icon: Kanban },
  { href: '/clientes', label: 'Clientes', icon: Briefcase },
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
          <button
            onClick={handleLogout}
            title="Sair"
            className="text-slate-400 hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
