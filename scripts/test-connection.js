const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Tentando conectar ao banco de dados...');
    const result = await prisma.$queryRaw`SELECT 1 as connected`;
    console.log('Sucesso! Conexão estabelecida:', result);
  } catch (error) {
    console.error('Erro ao conectar ao banco de dados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
