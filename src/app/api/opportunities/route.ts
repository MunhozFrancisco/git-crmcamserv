import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const isGestor = session.user.role === 'gestor'

  const opportunities = await prisma.opportunity.findMany({
    where: isGestor ? undefined : { assignedTo: session.user.id },
    include: {
      client: { select: { id: true, name: true } },
      stage: true,
      assignee: { select: { id: true, name: true } },
      product: { select: { id: true, name: true, type: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(opportunities)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  const stageId = body.stage_id
  const isWon = stageId === (await getStageIdByOrderIndex(4))
  const isLost = stageId === (await getStageIdByOrderIndex(5))

  const opportunity = await prisma.opportunity.create({
    data: {
      clientId: body.client_id,
      stageId,
      productId: body.product_id || null,
      value: body.value ?? 0,
      status: isWon ? 'ganha' : isLost ? 'perdida' : 'aberta',
      assignedTo: body.assigned_to ?? session.user.id,
      score: body.score ?? 50,
      riskLevel: body.risk_level ?? 'medio',
      expectedCloseDate: body.expected_close_date ? new Date(body.expected_close_date) : null,
      nextInteractionDate: body.next_interaction_date ? new Date(body.next_interaction_date) : null,
    },
    include: {
      client: { select: { id: true, name: true } },
      stage: true,
      assignee: { select: { id: true, name: true } },
      product: { select: { id: true, name: true, type: true } },
    },
  })

  return NextResponse.json(opportunity, { status: 201 })
}

async function getStageIdByOrderIndex(index: number) {
  const stage = await prisma.stage.findFirst({ where: { orderIndex: index } })
  return stage?.id ?? ''
}
