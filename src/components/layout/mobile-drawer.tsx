'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { BarChart3, Package, Sparkles, LogOut, Building2, Shield, User as UserIcon, Briefcase } from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import { useUser } from '@/contexts/user-context'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Sheet, SheetTrigger, SheetContent, SheetClose } from '@/components/ui/sheet'
import type { ReactNode } from 'react'

const managerItems = [
  { href: '/admin/vendedores', label: 'Vendedores', icon: BarChart3 },
  { href: '/admin/produtos', label: 'Produtos & Serviços', icon: Package },
  { href: '/ai/insights', label: 'IA Insights', icon: Sparkles },
]

export function MobileDrawer({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { currentUser, logout } = useUser()
  const isGestor = currentUser?.role === 'gestor'

  function handleLogout() {
    logout()
    router.push('/login')
  }

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="right">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-6 pb-5 border-b border-slate-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 shrink-0">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Camserv CRM</p>
            <p className="text-xs text-slate-400">Menu</p>
          </div>
        </div>

        {/* User info */}
        <div className="px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className={cn(
                'font-semibold',
                isGestor ? 'bg-indigo-600 text-white' : 'bg-slate-600 text-slate-200'
              )}>
                {getInitials(currentUser?.name ?? 'U')}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold text-white">{currentUser?.name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                {isGestor
                  ? <Shield className="h-3 w-3 text-indigo-400" />
                  : <UserIcon className="h-3 w-3 text-slate-400" />
                }
                <p className="text-xs text-slate-400 capitalize">{currentUser?.role}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Clientes — ambos os papéis */}
        <div className="px-3 pt-3 pb-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 px-3 mb-2">Comercial</p>
          <SheetClose asChild>
            <Link
              href="/clientes"
              className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
                pathname === '/clientes' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Briefcase className="h-5 w-5 shrink-0" />
              Clientes
            </Link>
          </SheetClose>
        </div>

        {/* Gestor items */}
        {isGestor && (
          <div className="px-3 py-4 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 px-3 mb-2">Gestão</p>
            <div className="space-y-1">
              {managerItems.map((item) => {
                const Icon = item.icon
                const active = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <SheetClose asChild key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors',
                        active
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      {item.label}
                    </Link>
                  </SheetClose>
                )
              })}
            </div>
          </div>
        )}

        {!isGestor && (
          <div className="flex-1 px-5 py-4">
            <div className="rounded-xl bg-slate-800 p-4 text-center">
              <p className="text-xs text-slate-400">Você está vendo apenas</p>
              <p className="text-sm font-semibold text-indigo-400 mt-1">suas oportunidades</p>
            </div>
          </div>
        )}

        {/* Logout */}
        <div className="px-3 pb-6 mt-auto border-t border-slate-800 pt-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-red-400 hover:bg-slate-800 hover:text-red-300 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Sair do sistema
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
