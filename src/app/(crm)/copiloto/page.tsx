import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { tenantTemModulo } from '@/lib/modulos'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'

const urgenciaCor: Record<string, string> = {
  alta:  'bg-red-100 text-red-700',
  media: 'bg-yellow-100 text-yellow-700',
  baixa: 'bg-green-100 text-green-700',
}

const intencaoLabel: Record<string, string> = {
  abertura_os:  'Abertura de OS',
  reclamacao:   'Reclamação',
  duvida:       'Dúvida',
  cancelamento: 'Cancelamento',
  outro:        'Outro',
}

export default async function CopilotoPage() {
  const session = await getServerSession(authOptions)
  if (!session) return notFound()

  const temModulo = await tenantTemModulo(session.user.tenantId, 'copiloto')
  if (!temModulo) redirect('/dashboard')

  const ordensAbertas = await prisma.ordemServico.findMany({
    where: {
      tenantId: session.user.tenantId,
      status: { in: ['aberta', 'em_andamento'] },
    },
    include: {
      client: { select: { name: true } },
      interacoes: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: [{ urgencia: 'asc' }, { createdAt: 'asc' }],
  })

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Copiloto IA</h1>
        <p className="text-sm text-gray-500 mt-1">
          Selecione uma OS para receber sugestões de resposta em tempo real.
        </p>
      </div>

      {ordensAbertas.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          Nenhuma OS aberta no momento.
        </div>
      ) : (
        <ul className="space-y-3">
          {ordensAbertas.map((os) => (
            <li key={os.id}>
              <Link
                href={`/copiloto/${os.id}`}
                className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-sm transition"
              >
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-gray-900">
                    {os.client.name}
                  </span>
                  <span className="text-sm text-gray-500 line-clamp-1">
                    {os.descricao}
                  </span>
                  <span className="text-xs text-gray-400">
                    {intencaoLabel[os.intencao]} · {os.canal} · protocolo #{os.id.slice(0, 8)}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-2 ml-4 shrink-0">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${urgenciaCor[os.urgencia]}`}>
                    {os.urgencia.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-400">
                    {os.interacoes[0]
                      ? new Date(os.interacoes[0].createdAt).toLocaleString('pt-BR')
                      : '—'}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
