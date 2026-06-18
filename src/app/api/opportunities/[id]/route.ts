import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const opportunity = await prisma.opportunity.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true } },
      stage: true,
      assignee: { select: { id: true, name: true } },
      product: { select: { id: true, name: true, type: true } },
    },
  })

  if (!opportunity) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(opportunity)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const data: Record<string, unknown> = {}
  if (body.stage_id !== undefined) data.stageId = body.stage_id
  if (body.value !== undefined) data.value = body.value
  if (body.status !== undefined) data.status = body.status
  if (body.assigned_to !== undefined) data.assignedTo = body.assigned_to
  if (body.score !== undefined) data.score = body.score
  if (body.risk_level !== undefined) data.riskLevel = body.risk_level
  if (body.expected_close_date !== undefined) {
    data.expectedCloseDate = body.expected_close_date ? new Date(body.expected_close_date) : null
  }
  if (body.last_interaction !== undefined) {
    data.lastInteraction = new Date(body.last_interaction)
  }
  if (body.next_interaction_date !== undefined) {
    data.nextInteractionDate = body.next_interaction_date ? new Date(body.next_interaction_date) : null
  }
  if (body.product_id !== undefined) {
    data.productId = body.product_id || null
  }

  const opportunity = await prisma.opportunity.update({
    where: { id },
    data,
    include: {
      client: { select: { id: true, name: true } },
      stage: true,
      assignee: { select: { id: true, name: true } },
      product: { select: { id: true, name: true, type: true } },
    },
  })

  return NextResponse.json(opportunity)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'gestor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  await prisma.opportunity.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
