import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: clientId } = await params
  const body = await req.json()

  if (body.is_primary) {
    await prisma.contact.updateMany({
      where: { clientId },
      data: { isPrimary: false },
    })
  }

  const contact = await prisma.contact.create({
    data: {
      clientId,
      name: body.name,
      cargo: body.cargo ?? null,
      department: body.department ?? null,
      email: body.email ?? null,
      phone: body.phone ?? null,
      whatsapp: body.whatsapp ?? null,
      isPrimary: body.is_primary ?? false,
    },
  })

  return NextResponse.json(contact, { status: 201 })
}
