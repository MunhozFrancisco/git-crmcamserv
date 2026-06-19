import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { sourceMap, mapEnum } from '@/lib/enum-maps'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const isGestor = session.user.role === 'gestor'

  const clients = await prisma.client.findMany({
    where: isGestor ? undefined : { assignedTo: session.user.id },
    include: { contacts: { orderBy: { isPrimary: 'desc' } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(clients)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  const tenant = await prisma.tenant.findFirst({ where: { slug: 'camserv' } })
  if (!tenant) return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 500 })

  const client = await prisma.client.create({
    data: {
      tenantId: tenant.id,
      name: body.name,
      razaoSocial: body.razao_social ?? null,
      cnpj: body.cnpj ?? null,
      site: body.site ?? null,
      phone: body.phone ?? null,
      whatsapp: body.whatsapp ?? null,
      segment: body.segment ?? null,
      address: body.address ?? null,
      source: mapEnum(sourceMap, body.source ?? 'outro', 'outro') as never,
      temperature: body.temperature ?? 'morno',
      clientType: body.client_type ?? 'privado',
      status: body.status ?? 'lead',
      responsibleName: body.responsible_name ?? null,
      assignedTo: body.assigned_to ?? session.user.id,
    },
    include: { contacts: true },
  })

  return NextResponse.json(client, { status: 201 })
}
