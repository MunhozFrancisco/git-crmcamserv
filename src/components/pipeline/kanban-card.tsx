'use client'

import { Draggable } from '@hello-pangea/dnd'
import { Clock, DollarSign, AlertTriangle, TrendingUp, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import type { Opportunity } from '@/types'
import { formatCurrency, daysSince, getInitials, cn } from '@/lib/utils'

interface KanbanCardProps {
  opportunity: Opportunity
  index: number
  onEdit?: (opp: Opportunity) => void
  onDelete?: (opp: Opportunity) => void
}

export function KanbanCard({ opportunity, index, onEdit, onDelete }: KanbanCardProps) {
  const dias = daysSince(opportunity.last_interaction)

  const riskColor = {
    baixo: 'bg-green-500',
    medio: 'bg-amber-400',
    alto: 'bg-red-500',
  }[opportunity.risk_level]

  const scoreColor =
    opportunity.score >= 70
      ? 'text-green-600 bg-green-50'
      : opportunity.score >= 40
      ? 'text-amber-600 bg-amber-50'
      : 'text-red-600 bg-red-50'

  return (
    <Draggable draggableId={opportunity.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            'bg-white rounded-xl border border-slate-200 p-3.5 cursor-grab active:cursor-grabbing select-none',
            'hover:shadow-md hover:border-indigo-200 transition-all duration-150',
            snapshot.isDragging && 'shadow-lg border-indigo-300 rotate-1'
          )}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2.5">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 leading-tight truncate">
                {opportunity.lead.company_name}
              </p>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {opportunity.lead.contact_name}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <div className={cn('flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold', scoreColor)}>
                <TrendingUp className="h-3 w-3" />
                {opportunity.score}
              </div>
              {(onEdit || onDelete) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="p-0.5 rounded hover:bg-slate-100 transition-colors"
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-3.5 w-3.5 text-slate-400" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(opportunity)}>
                        <Pencil className="h-4 w-4 text-slate-500" />
                        Editar
                      </DropdownMenuItem>
                    )}
                    {onEdit && onDelete && <DropdownMenuSeparator />}
                    {onDelete && (
                      <DropdownMenuItem
                        className="text-red-600 hover:bg-red-50 focus:bg-red-50"
                        onClick={() => onDelete(opportunity)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Valor */}
          <div className="flex items-center gap-1 mb-2.5">
            <DollarSign className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-sm font-bold text-slate-800">{formatCurrency(opportunity.value)}</span>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <div className={cn('h-2 w-2 rounded-full shrink-0', riskColor)} />
              <div className={cn(
                'flex items-center gap-1 text-xs',
                dias > 7 ? 'text-red-500 font-medium' : 'text-slate-400'
              )}>
                <Clock className="h-3 w-3" />
                {dias}d
                {dias > 7 && <AlertTriangle className="h-3 w-3" />}
              </div>
            </div>

            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-[10px] bg-indigo-100 text-indigo-700">
                {getInitials(opportunity.assignee.name)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      )}
    </Draggable>
  )
}
