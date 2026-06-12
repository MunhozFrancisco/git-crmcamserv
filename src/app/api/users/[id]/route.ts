import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'gestor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()

  const data: Record<string, unknown> = {}
  if (body.name !== undefined) data.name = body.name
  if (body.email !== undefined) data.email = body.email
  if (body.meta !== undefined) data.meta = body.meta
  if (body.active !== undefined) data.active = body.active
  if (body.password) data.passwordHash = await bcrypt.hash(body.password, 10)

  const user = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, name: true, email: true, role: true, meta: true, active: true },
  })

  return NextResponse.json(user)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'gestor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  if (id === session.user.id) {
    return NextResponse.json({ error: 'Não é possível excluir o próprio usuário' }, { status: 400 })
  }

  const body = await req.json().catch(() => ({}))
  const transferToId: string | undefined = body.transfer_to_id

  if (transferToId) {
    await prisma.opportunity.updateMany({
      where: { assignedTo: id },
      data: { assignedTo: transferToId },
    })
    await prisma.task.updateMany({
      where: { assignedTo: id },
      data: { assignedTo: transferToId },
    })
    await prisma.client.updateMany({
      where: { assignedTo: id },
      data: { assignedTo: transferToId },
    })
  }

  await prisma.user.update({ where: { id }, data: { active: false } })
  return NextResponse.json({ ok: true })
}
