import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  if (body.is_primary) {
    const contact = await prisma.contact.findUnique({ where: { id } })
    if (contact) {
      await prisma.contact.updateMany({
        where: { clientId: contact.clientId },
        data: { isPrimary: false },
      })
    }
  }

  const updated = await prisma.contact.update({
    where: { id },
    data: {
      name: body.name,
      cargo: body.cargo,
      department: body.department,
      email: body.email,
      phone: body.phone,
      whatsapp: body.whatsapp,
      isPrimary: body.is_primary,
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await prisma.contact.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
