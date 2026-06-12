import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const isGestor = session.user.role === 'gestor'

  const alerts = await prisma.alert.findMany({
    where: {
      resolved: false,
      ...(isGestor ? {} : { opportunity: { assignedTo: session.user.id } }),
    },
    include: {
      opportunity: {
        select: { id: true, client: { select: { id: true, name: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  return NextResponse.json(alerts)
}
