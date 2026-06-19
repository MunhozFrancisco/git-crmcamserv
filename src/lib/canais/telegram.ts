import { Canal } from "@prisma/client";

export interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    chat: { id: number };
    text?: string;
    date: number;
  };
}

export interface MensagemNormalizada {
  canal: Canal;
  canal_id: string;
  nome_remetente: string;
  mensagem_original: string;
  timestamp: string;
}

export function normalizarTelegram(update: TelegramUpdate): MensagemNormalizada | null {
  const msg = update.message;
  if (!msg || !msg.text) return null;

  const nome = [msg.from.first_name, msg.from.last_name].filter(Boolean).join(" ");

  return {
    canal: Canal.telegram,
    canal_id: String(msg.from.id),
    nome_remetente: nome,
    mensagem_original: msg.text,
    timestamp: new Date(msg.date * 1000).toISOString(),
  };
}

export async function enviarMensagemTelegram(chatId: string, texto: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN não configurado");

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: texto }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Telegram sendMessage falhou: ${err}`);
  }
}
