import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { activityTypeMap, mapEnum } from '@/lib/enum-maps'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const activities = await prisma.activity.findMany({
    where: { opportunityId: id },
    include: { user: { select: { id: true, name: true, avatar: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(activities)
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const activity = await prisma.activity.create({
    data: {
      opportunityId: id,
      userId: session.user.id,
      type: mapEnum(activityTypeMap, body.type ?? 'tarefa', 'tarefa') as never,
      description: body.description,
      interactionDate: body.interaction_date ? new Date(body.interaction_date) : new Date(),
    },
    include: { user: { select: { id: true, name: true, avatar: true } } },
  })

  await prisma.opportunity.update({
    where: { id },
    data: { lastInteraction: new Date() },
  })

  return NextResponse.json(activity, { status: 201 })
}
