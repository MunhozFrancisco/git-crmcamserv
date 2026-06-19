import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { tenantTemModulo } from '@/lib/modulos'
import { notFound, redirect } from 'next/navigation'
import { SugestaoResposta } from '@/components/copiloto/SugestaoResposta'

export default async function CopilotoOSPage({
  params,
}: {
  params: { osId: string }
}) {
  const session = await getServerSession(authOptions)
  if (!session) return notFound()

  const temModulo = await tenantTemModulo(session.user.tenantId, 'copiloto')
  if (!temModulo) redirect('/dashboard')

  const os = await prisma.ordemServico.findUnique({
    where: { id: params.osId },
    include: {
      client: { select: { name: true } },
      interacoes: {
        orderBy: { createdAt: 'asc' },
        select: { direcao: true, mensagem: true, createdAt: true },
      },
    },
  })

  if (!os || os.tenantId !== session.user.tenantId) return notFound()

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-4">
        <a href="/copiloto" className="text-sm text-blue-600 hover:underline">
          ← Voltar para lista
        </a>
      </div>
      <SugestaoResposta
        osId={os.id}
        clienteNome={os.client.name}
        descricao={os.descricao}
        intencao={os.intencao}
        urgencia={os.urgencia}
        canal={os.canal}
        protocolo={os.id.slice(0, 8)}
        interacoes={os.interacoes.map((i) => ({
          direcao: i.direcao,
          mensagem: i.mensagem,
          criadoEm: i.createdAt.toISOString(),
        }))}
      />
    </div>
  )
}
