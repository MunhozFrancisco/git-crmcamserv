'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Kanban, Briefcase, CheckSquare, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MobileDrawer } from './mobile-drawer'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/pipeline', label: 'Pipeline', icon: Kanban },
  { href: '/clientes', label: 'Clientes', icon: Briefcase },
  { href: '/tarefas', label: 'Tarefas', icon: CheckSquare },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 flex items-center lg:hidden safe-area-pb">
      {navItems.map((item) => {
        const Icon = item.icon
        const active = pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors',
              active ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
            )}
          >
            <Icon className={cn('h-5 w-5', active && 'stroke-[2.5]')} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        )
      })}

      {/* More — opens drawer */}
      <MobileDrawer>
        <button className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-slate-400 hover:text-slate-600 transition-colors">
          <MoreHorizontal className="h-5 w-5" />
          <span className="text-[10px] font-medium">Mais</span>
        </button>
      </MobileDrawer>
    </nav>
  )
}
