import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const contacts = await prisma.contact.findMany({
    orderBy: { name: 'asc' },
    include: { client: { select: { id: true, name: true } } },
  })

  return NextResponse.json(contacts)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  if (body.is_primary) {
    await prisma.contact.updateMany({
      where: { clientId: body.client_id },
      data: { isPrimary: false },
    })
  }

  const contact = await prisma.contact.create({
    data: {
      name: body.name,
      cargo: body.cargo ?? null,
      department: body.department ?? null,
      email: body.email ?? null,
      phone: body.phone ?? null,
      whatsapp: body.whatsapp ?? null,
      isPrimary: body.is_primary ?? false,
      clientId: body.client_id,
    },
    include: { client: { select: { id: true, name: true } } },
  })

  return NextResponse.json(contact, { status: 201 })
}
