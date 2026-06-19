# git-crmcamserv — Plataforma IA-First para MPMEs brasileiras

> CRM e Service Desk com arquitetura modular (Lego), três canais de mensageria nativos e fundação IA-First permanente. Desenvolvido em Next.js 15 + Prisma + TypeScript. Desenvolvido no Claude Desktop.

---

## Visão geral

O **git-crmcamserv** é uma plataforma de atendimento e gestão de clientes construída em camadas independentes que podem ser comercializadas separadamente — como peças de Lego. O cliente compra o que precisa agora e expande sem trocar de sistema.

A inteligência artificial não é uma funcionalidade adicionada depois. É o sistema nervoso central desde o primeiro uso. O humano age apenas quando a IA não resolve.

---

## Arquitetura em três camadas

### Camada 1 — Canais de entrada

Três canais de mensageria normalizados pelo Roteador IA antes de tocar qualquer módulo:

| Canal | Tipo | Dependência |
|---|---|---|
| WhatsApp | Business API (Meta) | Terceiro — sujeito a política da Meta |
| Telegram | Bot API | Terceiro — sujeito a política do Telegram |
| Hermes | Mensageria própria | Independente — white-label para revendas |

O **Hermes** é o diferencial competitivo da plataforma. Canal próprio, sem dependência de terceiros, podendo ser oferecido como white-label para parceiros e revendas.

### Camada 2 — Núcleo IA-First (fundação permanente)

Seis agentes de IA ativos em todas as fases, desde o primeiro cliente:

| Agente | Função |
|---|---|
| Roteador / Triagem | Normaliza canal, classifica intenção, distribui para módulo correto |
| CRM | Preenche o banco Prisma automaticamente sem ação humana |
| Copiloto | Sugere respostas ao atendente em tempo real |
| Notificação | Dispara mensagens ao cliente via canal de origem |
| Monitor | Analisa KPIs e emite alertas proativos ao gestor |
| Melhoria | Observa padrões e gera relatório semanal de otimizações |

### Camada 3 — Módulos Lego (comercializados separadamente)

| Módulo | Funcionalidades principais |
|---|---|
| CRM | Clientes, funil de vendas, histórico, ordens de serviço |
| Service Desk | Tickets, SLA, filas por prioridade, escalação, base de conhecimento |
| IA / Copiloto | Sugestão de respostas, resumo automático, sentimento, relatórios preditivos |
| Pagamentos | Pix automático, boleto, NF, integração Asaas / Mercado Pago |

---

## Planos e combinações disponíveis

| Plano | Módulos incluídos | Referência de preço |
|---|---|---|
| Starter | CRM | R$ 149/mês |
| Essential | CRM + Service Desk | R$ 249/mês |
| Growth | CRM + Service Desk + IA/Copiloto | R$ 399/mês |
| Full | Todos os módulos | R$ 549/mês |

Upgrade de plano é habilitação de módulo — sem migração, sem troca de sistema.

---

## Princípios do projeto

- **IA-First** — triagem, sugestão, notificação e relatório passam pela IA antes de tocar o banco ou o atendente. Três pilares permanentes: automação, melhoria contínua e monitoramento de desempenho.
- **Arquitetura Lego** — módulos independentes, banco único. O cliente começa pequeno e cresce sem fricção.
- **Brasil-nativo** — preços em BRL, WhatsApp e Telegram nativos, Hermes como canal próprio, Pix integrado, CEP via ViaCEP, suporte a ERPs nacionais (Bling, Tiny) nas próximas fases.
- **Modular e desacoplado** — cada agente tem responsabilidade única. Cada canal tem seu adaptador isolado. Cada módulo tem seu schema Prisma separado.
- **Versionado e documentado** — agentes, schemas e decisões arquiteturais versionados no GitHub com commits semânticos.

---

## Stack tecnológica

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 15 (App Router) |
| Linguagem | TypeScript |
| Estilo | Tailwind CSS |
| Componentes | Radix UI + Lucide React |
| ORM | Prisma 5 |
| Banco de dados | PostgreSQL (VPS própria) |
| Autenticação | NextAuth v4 |
| Deploy | Docker multi-stage + nixpacks |
| IA principal | Claude API (Anthropic) |
| Canal 1 | WhatsApp Business API (Meta) — fase 2 |
| Canal 2 | Telegram Bot API — fase 2 |
| Canal 3 | Hermes (mensageria própria) — fase 3 |
| Pagamentos | Asaas / Mercado Pago — fase 3 |
| CEP | ViaCEP (API pública) — fase 2 |

---

## Estrutura do repositório

```
git-crmcamserv/
│
├── .agents/
│   └── skills/                  ← System prompts dos agentes (um arquivo por agente)
│       ├── triagem.md
│       ├── crm.md
│       ├── copiloto.md
│       ├── notificacao.md
│       ├── monitor.md
│       └── melhoria.md
│
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── agentes/         ← Rotas dos agentes de IA
│   │   │   │   ├── triagem/
│   │   │   │   ├── crm/
│   │   │   │   ├── copiloto/
│   │   │   │   ├── notificacao/
│   │   │   │   ├── monitor/
│   │   │   │   └── melhoria/
│   │   │   └── webhooks/        ← Entrada dos canais
│   │   │       ├── whatsapp/
│   │   │       ├── telegram/
│   │   │       └── hermes/
│   │   └── (modulos)/           ← Páginas por módulo
│   │       ├── crm/
│   │       ├── service-desk/
│   │       ├── copiloto/
│   │       └── pagamentos/
│   ├── components/
│   └── lib/
│       └── prisma.ts            ← Prisma Client singleton
│
├── prisma/
│   ├── schema.prisma            ← Schema principal
│   └── migrations/              ← Migrations versionadas
│
├── database/                    ← Scripts SQL auxiliares
├── scripts/                     ← Setup VPS, seeds, jobs periódicos
│
├── docs/
│   ├── AGENTS.md                ← Este documento
│   ├── ROADMAP.md               ← Fases de evolução
│   └── DECISOES.md              ← Log de decisões arquiteturais (ADR)
│
├── .env.example
├── .gitignore
├── Dockerfile
├── nixpacks.toml
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## Três pilares permanentes de IA

Ativos em todas as fases, em todos os módulos, desde o primeiro cliente:

### 1. Automação IA
A IA executa — não apenas sugere. Abre tickets, atualiza status, preenche o banco, dispara notificações. O atendente humano aprova ou corrige quando necessário.

### 2. Melhoria contínua
A IA observa os próprios dados, detecta gargalos e sugere novos fluxos. Gera relatório semanal de oportunidades sem que ninguém precise solicitar.

### 3. Desempenho e alertas
Dashboard vivo com KPIs em tempo real. A IA alerta proativamente sobre desvios — tempo de resposta crítico, ticket parado, risco de churn — antes que o gestor precise verificar.

---

## Fases de evolução

| Fase | Período | Foco | Meta |
|---|---|---|---|
| Fase 1 | 0–3 meses | Base inteligente — formulário + agentes IA ativos | 10–30 clientes |
| Fase 2 | 3–6 meses | WhatsApp + Telegram + CRM auto-preenchido | 50–150 clientes |
| Fase 3 | 6–12 meses | Hermes + Copiloto avançado + Pagamentos | 200–500 clientes |
| Fase 4 | 12–24 meses | Plataforma autônoma + ERPs + app mobile | 1.000+ clientes |

---

## Como rodar localmente

```bash
# 1. Clone o repositório
git clone https://github.com/MunhozFrancisco/git-crmcamserv.git
cd git-crmcamserv

# 2. Instale as dependências
npm install --legacy-peer-deps

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com os dados reais

# 4. Gere o Prisma Client e rode as migrations
npx prisma generate
npx prisma migrate dev

# 5. Suba o servidor de desenvolvimento
npm run dev
```

---

## Variáveis de ambiente

### Já existem (funcionando)
```
DATABASE_URL=postgresql://usuario:senha@ip_da_vps:5432/camserv_crm
NEXTAUTH_URL=http://ip_da_vps
NEXTAUTH_SECRET=gere-com-openssl-rand-base64-32
NODE_ENV=production
PORT=3000
```

### A adicionar por fase
```
# Fase 1 — IA
ANTHROPIC_API_KEY=

# Fase 2 — Canais
WHATSAPP_TOKEN=
WHATSAPP_PHONE_ID=
TELEGRAM_BOT_TOKEN=

# Fase 3 — Hermes e Pagamentos
HERMES_API_KEY=
HERMES_WEBHOOK_SECRET=
ASAAS_API_KEY=
```

---

## Padrão de commits

```
feat(crm): adiciona preenchimento automático via Agente CRM
feat(hermes): cria adaptador de webhook para mensageria própria
fix(triagem): corrige normalização de mensagens de voz do WhatsApp
docs(agents): atualiza system prompt do Agente Copiloto
refactor(prisma): separa schemas por módulo
chore(env): adiciona variáveis Telegram e Hermes ao .env.example
```

---

## Deploy em produção (VPS)

```bash
docker build -t camserv-crm .
docker run -p 3000:3000 --env-file .env camserv-crm
```

---

## Desenvolvido por

**Francisco Munhoz** — [@MunhozFrancisco](https://github.com/MunhozFrancisco)
Desenvolvido no Claude Desktop · Arquitetura IA-First · Plataforma Lego para MPMEs brasileiras
