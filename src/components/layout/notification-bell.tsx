'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, AlertTriangle, Info, X, CheckCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Alert } from '@/types'

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/alerts')
      .then(r => r.ok ? r.json() : [])
      .then(setAlerts)
  }, [])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  async function markResolved(id: string) {
    await fetch(`/api/alerts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resolved: true }),
    })
    setAlerts(prev => prev.filter(a => a.id !== id))
  }

  async function markAllResolved() {
    await Promise.all(alerts.map(a =>
      fetch(`/api/alerts/${a.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolved: true }),
      })
    ))
    setAlerts([])
  }

  const count = alerts.length

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
      >
        <Bell className="h-4 w-4 text-slate-600" />
        {count > 0 && (
          <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-slate-200 shadow-lg z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-900">Notificações</p>
            {count > 0 && (
              <button
                onClick={markAllResolved}
                className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
              >
                <CheckCheck className="h-3 w-3" />
                Marcar todas como lidas
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
            {count === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">Nenhuma notificação</p>
              </div>
            ) : (
              alerts.map(alert => (
                <div key={alert.id} className={cn(
                  'flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors',
                )}>
                  <div className={cn(
                    'h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                    alert.type === 'danger' && 'bg-red-100',
                    alert.type === 'warning' && 'bg-amber-100',
                    alert.type === 'info' && 'bg-indigo-100',
                  )}>
                    {alert.type === 'info'
                      ? <Info className="h-3.5 w-3.5 text-indigo-500" />
                      : <AlertTriangle className={cn(
                          'h-3.5 w-3.5',
                          alert.type === 'danger' ? 'text-red-500' : 'text-amber-500'
                        )} />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800 leading-snug">{alert.message}</p>
                    {alert.opportunity && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        {(alert.opportunity as { client?: { name?: string } }).client?.name ?? ''}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => markResolved(alert.id)}
                    className="text-slate-300 hover:text-slate-500 shrink-0 mt-0.5"
                    title="Marcar como lida"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
