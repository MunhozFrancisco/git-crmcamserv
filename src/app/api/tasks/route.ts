import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const isGestor = session.user.role === 'gestor'

  const tasks = await prisma.task.findMany({
    where: isGestor ? undefined : { assignedTo: session.user.id },
    include: {
      assignee: { select: { id: true, name: true } },
      client: { select: { id: true, name: true } },
      opportunity: { select: { id: true, client: { select: { name: true } } } },
    },
    orderBy: [{ done: 'asc' }, { dueDate: 'asc' }],
  })

  return NextResponse.json(tasks)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  const task = await prisma.task.create({
    data: {
      title: body.title,
      type: body.type ?? 'outro',
      priority: body.priority ?? 'media',
      dueDate: new Date(body.due_date),
      assignedTo: body.assigned_to ?? session.user.id,
      opportunityId: body.opportunity_id ?? null,
      clientId: body.client_id ?? null,
    },
    include: {
      assignee: { select: { id: true, name: true } },
    },
  })

  return NextResponse.json(task, { status: 201 })
}
