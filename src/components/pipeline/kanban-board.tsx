'use client'

import { useState } from 'react'
import { DragDropContext, Droppable, type DropResult } from '@hello-pangea/dnd'
import { KanbanCard } from './kanban-card'
import type { Opportunity, Stage } from '@/types'
import { formatCurrency, cn } from '@/lib/utils'
import { Plus } from 'lucide-react'

interface KanbanColumn {
  stage: Stage
  opportunities: Opportunity[]
}

interface KanbanBoardProps {
  columns: KanbanColumn[]
  onEdit?: (opp: Opportunity) => void
  onDelete?: (opp: Opportunity) => void
  onAddToStage?: (stageId: string) => void
}

export function KanbanBoard({ columns: initialColumns, onEdit, onDelete, onAddToStage }: KanbanBoardProps) {
  const [columns, setColumns] = useState(initialColumns)

  function onDragEnd(result: DropResult) {
    const { source, destination } = result
    if (!destination) return
    if (source.droppableId === destination.droppableId && source.index === destination.index) return

    const sourceColIdx = columns.findIndex((c) => c.stage.id === source.droppableId)
    const destColIdx = columns.findIndex((c) => c.stage.id === destination.droppableId)

    const newColumns = columns.map((col) => ({ ...col, opportunities: [...col.opportunities] }))

    const [movedCard] = newColumns[sourceColIdx].opportunities.splice(source.index, 1)
    movedCard.stage_id = destination.droppableId
    movedCard.status =
      destination.droppableId === 's5' ? 'ganha'
      : destination.droppableId === 's6' ? 'perdida'
      : 'aberta'
    newColumns[destColIdx].opportunities.splice(destination.index, 0, movedCard)

    setColumns(newColumns)
  }

  function handleEdit(opp: Opportunity) {
    onEdit?.(opp)
  }

  function handleDelete(opp: Opportunity) {
    if (onDelete) {
      onDelete(opp)
    } else {
      setColumns((prev) =>
        prev.map((col) => ({
          ...col,
          opportunities: col.opportunities.filter((o) => o.id !== opp.id),
        }))
      )
    }
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-3 h-full overflow-x-auto pb-4 snap-x snap-mandatory lg:snap-none">
        {columns.map((column) => {
          const total = column.opportunities.reduce((sum, o) => sum + o.value, 0)
          return (
            <div key={column.stage.id} className="flex flex-col w-[78vw] sm:w-64 shrink-0 snap-start lg:snap-align-none">
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <div className={cn('h-2 w-2 rounded-full', column.stage.bgColor.replace('bg-', 'bg-').replace('-100', '-400'))} />
                  <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    {column.stage.name}
                  </span>
                  <span className={cn(
                    'text-xs font-bold rounded-full px-1.5 py-0.5',
                    column.stage.bgColor,
                    column.stage.color
                  )}>
                    {column.opportunities.length}
                  </span>
                </div>
              </div>

              {/* Total value */}
              {total > 0 && (
                <p className="text-xs text-slate-400 px-1 mb-2">{formatCurrency(total)}</p>
              )}

              {/* Drop Zone */}
              <Droppable droppableId={column.stage.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      'flex-1 rounded-xl p-2 space-y-2 min-h-[200px] transition-colors',
                      snapshot.isDraggingOver ? 'bg-indigo-50 border-2 border-dashed border-indigo-200' : 'bg-slate-100/60'
                    )}
                  >
                    {column.opportunities.map((opp, idx) => (
                      <KanbanCard
                        key={opp.id}
                        opportunity={opp}
                        index={idx}
                        onEdit={onEdit ? handleEdit : undefined}
                        onDelete={handleDelete}
                      />
                    ))}
                    {provided.placeholder}

                    {column.opportunities.length === 0 && !snapshot.isDraggingOver && (
                      <div className="flex items-center justify-center h-20">
                        <p className="text-xs text-slate-400">Sem oportunidades</p>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>

              {/* Add button */}
              <button
                className="mt-2 flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                onClick={() => onAddToStage?.(column.stage.id)}
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar
              </button>
            </div>
          )
        })}
      </div>
    </DragDropContext>
  )
}
