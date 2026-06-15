import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })

  const valid = await bcrypt.compare(body.current_password ?? '', user.passwordHash)
  if (!valid) {
    return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 400 })
  }

  if (!body.new_password || body.new_password.length < 6) {
    return NextResponse.json(
      { error: 'Nova senha deve ter ao menos 6 caracteres' },
      { status: 400 }
    )
  }

  const passwordHash = await bcrypt.hash(body.new_password, 10)
  await prisma.user.update({ where: { id: session.user.id }, data: { passwordHash } })

  return NextResponse.json({ ok: true })
}
