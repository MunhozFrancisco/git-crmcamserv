import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Canal, IntencaoTriagem, Urgencia } from "@prisma/client";

interface JsonTriagem {
  canal: Canal;
  canal_id: string;
  intencao: IntencaoTriagem;
  urgencia: Urgencia;
  dados_extraidos: {
    nome: string | null;
    telefone: string | null;
    problema_descrito: string;
  };
  mensagem_original: string;
  timestamp: string;
}

export async function POST(req: NextRequest) {
  const inicio = Date.now();
  let json: JsonTriagem | null = null;

  try {
    json = await req.json();
    if (!json) throw new Error("Body vazio");

    // 1. Resolver ou criar cliente pelo canal_id
    let clienteCanal = await prisma.clienteCanal.findUnique({
      where: { canal_canalId: { canal: json.canal, canalId: json.canal_id } },
      include: { client: true },
    });

    if (!clienteCanal) {
      // Criar cliente novo a partir dos dados extraídos
      const nome = json.dados_extraidos.nome ?? `Contato ${json.canal} ${json.canal_id}`;

      // Buscar o primeiro gestor para atribuir o cliente
      const gestor = await prisma.user.findFirst({ where: { role: "gestor" } });
      if (!gestor) throw new Error("Nenhum gestor encontrado para atribuir cliente");

      const novoCliente = await prisma.client.create({
        data: {
          name: nome,
          phone: json.dados_extraidos.telefone ?? undefined,
          assignedTo: gestor.id,
        },
      });

      clienteCanal = await prisma.clienteCanal.create({
        data: { clientId: novoCliente.id, canal: json.canal, canalId: json.canal_id },
        include: { client: true },
      });
    }

    const clienteId = clienteCanal.clientId;

    // 2. Criar Ordem de Serviço
    const os = await prisma.ordemServico.create({
      data: {
        clientId: clienteId,
        canal: json.canal,
        descricao: json.dados_extraidos.problema_descrito,
        intencao: json.intencao,
        urgencia: json.urgencia,
      },
    });

    // 3. Registrar interação de entrada
    await prisma.interacao.create({
      data: {
        clientId: clienteId,
        osId: os.id,
        canal: json.canal,
        direcao: "entrada",
        mensagem: json.mensagem_original,
        geradoPorIa: false,
      },
    });

    // 4. Log do agente
    await prisma.logAgente.create({
      data: {
        agente: "crm",
        acao: "processar_mensagem",
        input: json as object,
        output: { clienteId, osId: os.id },
        sucesso: true,
      },
    });

    return NextResponse.json({ clienteId, osId: os.id, duracao_ms: Date.now() - inicio });
  } catch (err) {
    console.error("[Agente CRM]", err);

    // Registrar falha no log
    if (json) {
      await prisma.logAgente.create({
        data: {
          agente: "crm",
          acao: "processar_mensagem",
          input: json as object,
          output: { erro: String(err) },
          sucesso: false,
          erroMsg: String(err),
        },
      });
    }

    return NextResponse.json({ error: "Erro interno do Agente CRM" }, { status: 500 });
  }
}
