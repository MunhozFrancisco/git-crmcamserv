import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { sourceMap, mapEnum } from '@/lib/enum-maps'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const client = await prisma.client.findUnique({
    where: { id },
    include: { contacts: { orderBy: { isPrimary: 'desc' } }, opportunities: true },
  })

  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(client)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const client = await prisma.client.update({
    where: { id },
    data: {
      name: body.name,
      razaoSocial: body.razao_social,
      cnpj: body.cnpj,
      site: body.site,
      phone: body.phone,
      whatsapp: body.whatsapp,
      segment: body.segment,
      address: body.address,
      source: body.source ? mapEnum(sourceMap, body.source, 'outro') as never : undefined,
      temperature: body.temperature,
      clientType: body.client_type,
      status: body.status,
      responsibleName: body.responsible_name,
      assignedTo: body.assigned_to,
    },
    include: { contacts: true },
  })

  return NextResponse.json(client)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'gestor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  await prisma.client.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
