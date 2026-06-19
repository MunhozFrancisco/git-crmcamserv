import { prisma } from '@/lib/db'

export async function tenantTemModulo(
  tenantId: string,
  modulo: string
): Promise<boolean> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { modules: true, active: true },
  })

  if (!tenant || !tenant.active) return false
  return tenant.modules.includes(modulo)
}
