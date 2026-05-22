import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const products = await prisma.product.findMany({
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(products)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'gestor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()

  const product = await prisma.product.create({
    data: {
      name: body.name,
      description: body.description ?? null,
      type: body.type,
      category: body.category,
      price: body.price ?? 0,
      unit: body.unit ?? 'único',
      active: body.active ?? true,
    },
  })

  return NextResponse.json(product, { status: 201 })
}
