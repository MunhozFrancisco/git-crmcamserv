'use client'

import { Menu } from 'lucide-react'
import { Building2 } from 'lucide-react'
import { MobileDrawer } from './mobile-drawer'
import { NotificationBell } from './notification-bell'

interface MobileHeaderProps {
  title: string
}

export function MobileHeader({ title }: MobileHeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden sticky top-0 z-30">
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
          <Building2 className="h-3.5 w-3.5 text-white" />
        </div>
        <h1 className="text-base font-semibold text-slate-900">{title}</h1>
      </div>

      <div className="flex items-center gap-1">
        <NotificationBell />
        <MobileDrawer>
          <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <Menu className="h-5 w-5 text-slate-600" />
          </button>
        </MobileDrawer>
      </div>
    </header>
  )
}
