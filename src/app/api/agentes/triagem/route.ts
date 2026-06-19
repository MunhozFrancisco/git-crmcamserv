import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import { join } from "path";
import { MensagemNormalizada } from "@/lib/canais/telegram";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function carregarSystemPrompt(): string {
  const caminho = join(process.cwd(), ".agents", "skills", "triagem.md");
  return readFileSync(caminho, "utf-8");
}

export async function POST(req: NextRequest) {
  try {
    const mensagem: MensagemNormalizada = await req.json();

    const systemPrompt = carregarSystemPrompt();

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: JSON.stringify(mensagem) }],
    });

    const texto = response.content[0].type === "text" ? response.content[0].text : "";

    let json: unknown;
    try {
      json = JSON.parse(texto);
    } catch {
      return NextResponse.json(
        { error: "Triagem retornou resposta inválida", raw: texto },
        { status: 502 }
      );
    }

    return NextResponse.json(json);
  } catch (err) {
    console.error("[Agente Triagem]", err);
    return NextResponse.json({ error: "Erro interno do Agente Triagem" }, { status: 500 });
  }
}
