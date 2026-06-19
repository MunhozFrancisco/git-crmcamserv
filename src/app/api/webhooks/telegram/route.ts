import { NextRequest, NextResponse } from "next/server";
import { normalizarTelegram, enviarMensagemTelegram, TelegramUpdate } from "@/lib/canais/telegram";

const BASE_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3001";

export async function POST(req: NextRequest) {
  try {
    const update: TelegramUpdate = await req.json();

    const mensagem = normalizarTelegram(update);
    if (!mensagem) return NextResponse.json({ ok: true }); // ignora updates sem texto

    // 1. Agente Triagem — classifica intenção e urgência
    const triagemRes = await fetch(`${BASE_URL}/api/agentes/triagem`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mensagem),
    });

    if (!triagemRes.ok) {
      console.error("[Webhook Telegram] Triagem falhou:", await triagemRes.text());
      return NextResponse.json({ ok: true }); // não retorna 500 ao Telegram para evitar retry loop
    }

    const jsonTriagem = await triagemRes.json();

    // 2. Agente CRM — persiste cliente, OS e interação
    const crmRes = await fetch(`${BASE_URL}/api/agentes/crm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(jsonTriagem),
    });

    if (!crmRes.ok) {
      console.error("[Webhook Telegram] CRM falhou:", await crmRes.text());
      return NextResponse.json({ ok: true });
    }

    const { osId } = await crmRes.json();

    // 3. Confirmar recebimento ao cliente no canal de origem
    const confirmacao =
      jsonTriagem.urgencia === "alta"
        ? `Olá ${mensagem.nome_remetente}! Recebemos sua mensagem com prioridade ALTA. Um atendente entrará em contato em breve. OS #${osId?.slice(0, 8)}`
        : `Olá ${mensagem.nome_remetente}! Recebemos sua mensagem e abrimos o protocolo #${osId?.slice(0, 8)}. Em breve retornaremos.`;

    await enviarMensagemTelegram(mensagem.canal_id, confirmacao);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Webhook Telegram]", err);
    return NextResponse.json({ ok: true }); // sempre 200 para o Telegram
  }
}
