import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, meta: true, avatar: true, active: true, createdAt: true },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(users)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'gestor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()

  if (!body.password || body.password.length < 6) {
    return NextResponse.json({ error: 'Senha deve ter ao menos 6 caracteres' }, { status: 400 })
  }

  const passwordHash = await bcrypt.hash(body.password, 10)

  const tenant = await prisma.tenant.findFirst({ where: { slug: 'camserv' } })
  if (!tenant) return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 500 })

  const user = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: body.name,
      email: body.email,
      passwordHash,
      role: body.role ?? 'vendedor',
      meta: body.meta ?? 0,
    },
    select: { id: true, name: true, email: true, role: true, meta: true, active: true },
  })

  return NextResponse.json(user, { status: 201 })
}
