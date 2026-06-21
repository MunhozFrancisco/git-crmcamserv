# CLAUDE.md — Contexto permanente do projeto

> Este arquivo é lido automaticamente pelo Claude Code a cada sessão.
> Não remover. Atualizar após decisões arquiteturais relevantes.

---

## Projeto

**git-crmcamserv** — Plataforma SaaS IA-First para MPMEs brasileiras.
**Repo:** https://github.com/MunhozFrancisco/git-crmcamserv
**Dev:** Francisco Munhoz · Antigravity IDE + Claude Code
**Branch principal:** master

---

## Regra absoluta

O CRM atual está **aprovado e funcionando**. A evolução é **sempre aditiva** — novas camadas sobre o que existe. Nunca alterar código existente sem instrução explícita do desenvolvedor.

---

## Stack (não alterar sem decisão explícita)

- **Framework:** Next.js 15 — App Router
- **Linguagem:** TypeScript
- **Estilo:** Tailwind CSS
- **Componentes:** Radix UI + Lucide React
- **ORM:** Prisma 5 — PostgreSQL em VPS própria
- **Auth:** NextAuth v4
- **Deploy:** Docker multi-stage + nixpacks
- **IA:** Claude API (Anthropic) — modelo Haiku para volume, Sonnet para raciocínio
- **Canais:** WhatsApp Business API · Telegram Bot API · Hermes (próprio)
- **Pagamentos:** Asaas / Mercado Pago
- **CEP:** ViaCEP (API pública)

---

## Arquitetura — três camadas

### Camada 1 — Canais de entrada
Todos normalizados pelo Agente Triagem antes de qualquer módulo:

| Canal | Webhook | Característica |
|---|---|---|
| WhatsApp | `api/webhooks/whatsapp/` | Terceiro — Meta |
| Telegram | `api/webhooks/telegram/` | Terceiro — Telegram |
| Hermes | `api/webhooks/hermes/` | Próprio — white-label |

**Regra:** cliente responde sempre no canal pelo qual entrou.

### Camada 2 — Núcleo IA-First (sempre ativo)
System prompts em `.agents/skills/` — um arquivo por agente:

| Agente | Arquivo | Modelo | Fase |
|---|---|---|---|
| Triagem / Roteador | `triagem.md` | Haiku | 1 |
| CRM | `crm.md` | Haiku | 1 |
| Monitor | `monitor.md` | Sonnet | 1 |
| Copiloto | `copiloto.md` | Sonnet | 2 |
| Notificação | `notificacao.md` | Haiku | 2 |
| Melhoria | `melhoria.md` | Sonnet | 2 |

**Três pilares permanentes (ativos em todas as fases):**
1. Automação IA — executa, não sugere
2. Melhoria contínua — relatório semanal automático
3. Desempenho e alertas — dashboard vivo, alertas proativos

### Camada 3 — Módulos Lego (vendidos separadamente)

| Módulo | Plano | Preço ref. |
|---|---|---|
| CRM | Starter | R$ 149/mês |
| CRM + Service Desk | Essential | R$ 249/mês |
| + IA / Copiloto | Growth | R$ 399/mês |
| Todos + Pagamentos | Full | R$ 549/mês |

---

## Princípios de código

- Outputs entre agentes sempre em **JSON estruturado** — nunca texto livre
- Um agente, uma responsabilidade — sem cruzamento de lógica
- Toda rota de agente em `src/app/api/agentes/[nome]/route.ts`
- Toda rota de webhook em `src/app/api/webhooks/[canal]/route.ts`
- Adaptadores de canal isolados em `src/lib/canais/`
- Prisma Client singleton em `src/lib/prisma.ts`
- Commits semânticos: `feat:` `fix:` `docs:` `refactor:` `chore:`
- Todo agente registra log no banco após cada ação

---

## Variáveis de ambiente

### Ativas
```
DATABASE_URL · NEXTAUTH_URL · NEXTAUTH_SECRET · NODE_ENV · PORT
```

### A adicionar por fase
```
ANTHROPIC_API_KEY          # fase 1
TELEGRAM_BOT_TOKEN         # fase 2
WHATSAPP_TOKEN             # fase 3 — aguarda plano Meta
WHATSAPP_PHONE_ID          # fase 3 — aguarda plano Meta
HERMES_API_KEY             # fase 4 — após validação com clientes reais
HERMES_WEBHOOK_SECRET      # fase 4 — após validação com clientes reais
ASAAS_API_KEY              # fase 4
```

---

## Estrutura de pastas relevante

```
.agents/skills/        ← system prompts dos agentes
src/app/api/
  agentes/             ← rotas dos agentes
  webhooks/            ← entrada dos canais
src/lib/
  prisma.ts            ← singleton Prisma
  canais/              ← adaptadores WhatsApp, Telegram, Hermes
prisma/schema.prisma   ← schema principal
docs/
  AGENTS.md            ← spec completa dos agentes
  CONTEXTO.md          ← briefing detalhado
  ROADMAP.md           ← fases de evolução
  DECISOES.md          ← log de decisões (ADR)
```

---

## Próximos passos (em ordem)

### Fase 1 — concluída ✅
1. ✅ Redesenhar `prisma/schema.prisma` — 4 novas tabelas IA + enums
2. ✅ Criar system prompt do Agente Triagem em `.agents/skills/triagem.md`
3. ✅ Integrar `ANTHROPIC_API_KEY` e testar primeira chamada Claude API
4. ✅ Criar `src/app/api/agentes/triagem/route.ts`
5. ✅ Criar `src/app/api/agentes/crm/route.ts`
6. ✅ Criar `src/app/api/webhooks/telegram/route.ts` — testado e funcionando em produção

### Fase 2 — Telegram completo (foco atual)
7. ✅ Criar system prompt do Agente Copiloto em `.agents/skills/copiloto.md`
8. ✅ Criar `src/app/api/agentes/copiloto/route.ts` — streaming com `ReadableStream`
9. ✅ Criar componente UI `src/components/copiloto/SugestaoResposta.tsx`
10. ✅ Criar system prompt do Agente Notificação em `.agents/skills/notificacao.md`
11. ✅ Criar `src/app/api/agentes/notificacao/route.ts`
12. Criar system prompt do Agente Melhoria em `.agents/skills/melhoria.md`
13. Criar `scripts/melhoria.ts` — job semanal automático

### Fase 3 — WhatsApp (aguarda plano Meta)
- Criar `src/app/api/webhooks/whatsapp/route.ts`
- Criar `src/lib/canais/whatsapp.ts`
- Variáveis: `WHATSAPP_TOKEN` · `WHATSAPP_PHONE_ID`

### Fase 4 — Hermes (após validação com clientes reais)
- Criar `src/app/api/webhooks/hermes/route.ts`
- Criar `src/lib/canais/hermes.ts`
- Variáveis: `HERMES_API_KEY` · `HERMES_WEBHOOK_SECRET`

### Infraestrutura pendente
- Trocar `ANTHROPIC_API_KEY` e `TELEGRAM_BOT_TOKEN` no deploy definitivo
- Configurar domínio com SSL para substituir IP direto
- Sincronizar `DATABASE_URL` local com IP `172.16.2.12` (banco Supabase na VPS)

---

## Contexto de mercado

- **Público:** MPMEs brasileiras — alta sensibilidade a preço, WhatsApp como canal principal
- **Diferencial:** preço em BRL, Hermes white-label, IA-First desde o dia 1, suporte em PT-BR
- **Concorrentes:** Zendesk, Freshdesk, HubSpot — todos dolarizados e complexos
- **GTM:** Product-Led Growth — free trial 7 dias sem cartão

---

## Documentação completa

- Spec de agentes → `docs/AGENTS.md`
- Briefing detalhado → `docs/CONTEXTO.md`
- Decisões arquiteturais → `docs/DECISOES.md`

---

## Leitura obrigatória antes de qualquer tarefa

Antes de escrever qualquer código, leia os seguintes arquivos nesta ordem:
1. `docs/AGENTS.md` — spec completa dos agentes
2. `.agents/skills/triagem.md` — se a tarefa envolve triagem ou webhooks
3. `.agents/skills/crm.md` — se a tarefa envolve banco ou ordens de serviço
4. `.agents/skills/monitor.md` — se a tarefa envolve KPIs ou dashboard
5. `.agents/skills/copiloto.md` — se a tarefa envolve sugestão de respostas
6. `.agents/skills/notificacao.md` — se a tarefa envolve envio de mensagens
7. `.agents/skills/melhoria.md` — se a tarefa envolve relatórios ou análise

Confirme a leitura antes de propor qualquer implementação.
