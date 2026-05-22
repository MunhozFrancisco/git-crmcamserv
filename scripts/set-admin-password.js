#!/usr/bin/env node
// Uso: node scripts/set-admin-password.js "NovaSenha@2025"
// Gera o hash bcrypt e atualiza o banco de dados via DATABASE_URL do .env

require('dotenv').config()
const bcrypt = require('bcryptjs')
const { PrismaClient } = require('@prisma/client')

const password = process.argv[2]
if (!password) {
  console.error('Uso: node scripts/set-admin-password.js "SuaSenha@2025"')
  process.exit(1)
}

async function main() {
  const prisma = new PrismaClient()
  const hash = await bcrypt.hash(password, 10)

  const user = await prisma.user.updateMany({
    where: { role: 'gestor' },
    data: { passwordHash: hash },
  })

  console.log(`✓ Senha atualizada para ${user.count} usuário(s) gestor.`)
  await prisma.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
