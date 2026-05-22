'use client'

import { Bell, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ALERTS } from '@/lib/mock-data'
import { MobileHeader } from './mobile-header'

interface HeaderProps {
  title: string
  subtitle?: string
}

export function Header({ title, subtitle }: HeaderProps) {
  const unreadAlerts = ALERTS.filter((a) => a.type === 'danger').length

  return (
    <>
      {/* Mobile header */}
      <MobileHeader title={title} />

      {/* Desktop header */}
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

          <button className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <Bell className="h-4 w-4 text-slate-600" />
            {unreadAlerts > 0 && (
              <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">
                {unreadAlerts}
              </span>
            )}
          </button>
        </div>
      </header>
    </>
  )
}
