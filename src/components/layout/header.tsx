'use client'

import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { MobileHeader } from './mobile-header'
import { NotificationBell } from './notification-bell'

interface HeaderProps {
  title: string
  subtitle?: string
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <>
      <MobileHeader title={title} />

      <header className="hidden lg:flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 sticky top-0 z-30">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input className="pl-8 w-48 h-8 text-xs" placeholder="Buscar..." />
          </div>
          <NotificationBell />
        </div>
      </header>
    </>
  )
}
