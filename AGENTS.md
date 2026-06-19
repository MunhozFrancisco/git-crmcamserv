# AGENTS.md — Agentes de IA da plataforma

> System prompts e configurações individuais ficam em `.agents/skills/` — um arquivo por agente.
> Este documento descreve responsabilidade, inputs, outputs, ferramentas e handoff de cada agente.

**Regra fundamental:** cada agente tem uma única responsabilidade. Um agente nunca faz o trabalho de outro. O handoff entre agentes é sempre explícito via JSON estruturado.

---

## Índice

| Agente | Arquivo | Responsabilidade | Status |
|---|---|---|---|
| Triagem / Roteador | `triagem.md` | Normaliza canal, classifica intenção, roteia para módulo | Fase 1 |
| CRM | `crm.md` | Preenche e atualiza banco Prisma automaticamente | Fase 1 |
| Monitor | `monitor.md` | Analisa KPIs e emite alertas proativos | Fase 1 |
| Copiloto | `copiloto.md` | Sugere respostas ao atendente em tempo real | Fase 2 |
| Notificação | `notificacao.md` | Dispara mensagens ao cliente via canal de origem | Fase 2 |
| Melhoria | `melhoria.md` | Observa padrões e gera relatório semanal | Fase 2 |

---

## Agente Triagem / Roteador

**Arquivo:** `.agents/skills/triagem.md`
**Modelo:** Claude Haiku — rápido, baixo custo, alto volume
**Status:** Fase 1

### Responsabilidade
Ponto único de entrada da plataforma. Recebe eventos dos três canais (WhatsApp, Telegram, Hermes) em formatos diferentes e normaliza tudo em um JSON padrão antes de distribuir para o módulo correto. Nunca responde ao cliente.

### Adaptadores de canal (rota de entrada)

| Canal | Rota webhook | Formato recebido |
|---|---|---|
| WhatsApp | `api/webhooks/whatsapp/route.ts` | Payload Meta JSON |
| Telegram | `api/webhooks/telegram/route.ts` | Update Telegram JSON |
| Hermes | `api/webhooks/hermes/route.ts` | Evento Hermes próprio |

### Output normalizado (JSON padrão para todos os canais)
```json
{
  "canal": "whatsapp | telegram | hermes",
  "canal_id": "id_do_remetente_no_canal",
  "cliente_id": "uuid_prisma_ou_null",
  "intencao": "abertura_os | reclamacao | duvida | cancelamento | outro",
  "urgencia": "alta | media | baixa",
  "modulo_destino": "crm | service-desk | pagamentos",
  "dados_extraidos": {
    "nome": "...",
    "telefone": "...",
    "cep": "...",
    "problema_descrito": "..."
  },
  "mensagem_original": "texto bruto recebido",
  "timestamp": "ISO 8601"
}
```

### Ferramentas que usa
- Prisma — verifica se `canal_id` já existe na tabela `ClienteCanal`
- ViaCEP — enriquece CEP quando endereço é mencionado (fase 2)

### Handoff
Passa JSON normalizado para **Agente CRM** (salvar dados) e/ou **Agente Copiloto** (atendente precisa responder). O campo `modulo_destino` define qual módulo recebe o evento.

---

## Agente CRM

**Arquivo:** `.agents/skills/crm.md`
**Modelo:** Claude Haiku
**Status:** Fase 1
**Módulo:** CRM

### Responsabilidade
Mantém o banco atualizado sem intervenção humana. Lê o JSON do Agente Triagem e executa operações Prisma — insert, update, upsert — sem que o atendente precise preencher nada manualmente.

### Inputs
- JSON normalizado do Agente Triagem
- Eventos de mudança de status (OS aberta → em andamento → encerrada)
- Desfecho registrado pelo atendente (quando age)

### Operações Prisma executadas
```ts
// Criar ou atualizar cliente
prisma.cliente.upsert({ where: { canalId }, create: {...}, update: {...} })

// Criar ordem de serviço
prisma.ordemServico.create({ data: { clienteId, descricao, urgencia, status: 'aberta' } })

// Registrar interação
prisma.interacao.create({ data: { clienteId, canal, mensagem, agente: 'ia', timestamp } })
```

### Handoff
Após salvar, notifica **Agente Notificação** quando cliente deve ser avisado, e **Agente Monitor** para atualização de KPIs.

---

## Agente Monitor

**Arquivo:** `.agents/skills/monitor.md`
**Modelo:** Claude Sonnet
**Status:** Fase 1 (versão básica), Fase 2 (sentimento e churn)
**Módulo:** Todos (fundação permanente)

### Responsabilidade
Observa KPIs em tempo real e alerta proativamente. O gestor não precisa verificar relatório — o Monitor fala quando algo sai do padrão.

### KPIs monitorados

**Fase 1 (dados Prisma):**
- Tickets abertos há mais de X horas (configurável por cliente)
- Volume de OS por status e por técnico
- Tempo médio de primeira resposta por canal
- Taxa de resolução no primeiro contato

**Fase 2 (com IA):**
- Satisfação estimada via análise de sentimento das conversas
- Risco de churn por cliente (padrão de comportamento)
- Comparativo de desempenho entre técnicos

### Outputs
- Alerta interno no dashboard Next.js (fase 1)
- Mensagem ao gestor via canal preferido (fase 2)
- Relatório diário automático — 5 pontos principais

### Integração
- Job periódico em `scripts/monitor.ts` (a criar)
- Queries analíticas via Prisma no PostgreSQL
- Dashboard em `src/app/(modulos)/dashboard/`

### Handoff
Aciona **Agente Melhoria** quando detecta anomalia recorrente.

---

## Agente Copiloto

**Arquivo:** `.agents/skills/copiloto.md`
**Modelo:** Claude Sonnet
**Status:** Fase 2
**Módulo:** IA / Copiloto (vendido separadamente)

### Responsabilidade
Auxilia o atendente humano em tempo real dentro da interface Next.js. Nunca fala diretamente com o cliente. Gera sugestões de resposta, resume históricos longos e consulta a base de conhecimento.

### Inputs
- JSON normalizado do Agente Triagem
- Histórico completo do cliente via Prisma (`Interacao`, `OrdemServico`)
- Base de conhecimento da empresa (arquivos em `database/conhecimento/`)
- Texto parcial que o atendente está digitando

### Outputs
- Sugestão de resposta completa (editável pelo atendente antes de enviar)
- Resumo do histórico em até 3 tópicos (ao transferir ticket entre atendentes)
- Alerta de escalação quando o caso exige nível superior

### Integração
- Componente de UI em `src/components/copiloto/SugestaoResposta.tsx` (a criar)
- Rota de streaming: `src/app/api/agentes/copiloto/route.ts` (a criar)
- Usa `ReadableStream` do Next.js para entregar sugestão token a token

### Handoff
Terminal para o atendente. Após resposta enviada, **Agente CRM** registra o desfecho e **Agente Notificação** confirma o envio ao cliente.

---

## Agente Notificação

**Arquivo:** `.agents/skills/notificacao.md`
**Modelo:** Claude Haiku
**Status:** Fase 2
**Módulo:** Todos

### Responsabilidade
Dispara mensagens ao cliente via **o mesmo canal pelo qual ele entrou** — responde no WhatsApp quem chegou pelo WhatsApp, no Telegram quem chegou pelo Telegram, no Hermes quem chegou pelo Hermes. Nunca decide sozinho o que enviar.

### Lógica de canal de retorno
```ts
switch (interacao.canal) {
  case 'whatsapp':  enviarWhatsApp(cliente.whatsappId, mensagem); break;
  case 'telegram':  enviarTelegram(cliente.telegramId, mensagem); break;
  case 'hermes':    enviarHermes(cliente.hermesId, mensagem);     break;
}
```

### Templates padrão
```
OS aberta:      "Olá {nome}, sua OS #{numero} foi aberta. Prazo: {prazo}."
Atualização:    "Olá {nome}, sua OS #{numero} foi atualizada: {status}."
Encerramento:   "Olá {nome}, sua OS #{numero} foi encerrada. Obrigado!"
Lembrete:       "Olá {nome}, seu agendamento é amanhã às {hora}. Confirma?"
Cobrança:       "Olá {nome}, seu boleto #{numero} vence em {data}. Pague pelo Pix: {chave}."
```

### Integração
- Adaptadores isolados: `src/lib/canais/whatsapp.ts`, `telegram.ts`, `hermes.ts`
- Log de envios via Prisma: `prisma.logNotificacao.create(...)`
- Rota: `src/app/api/agentes/notificacao/route.ts`

### Handoff
Terminal. Registra o envio e encerra.

---

## Agente Melhoria

**Arquivo:** `.agents/skills/melhoria.md`
**Modelo:** Claude Sonnet
**Status:** Fase 2
**Módulo:** Todos (fundação permanente)

### Responsabilidade
Agente estratégico. Analisa padrões ao longo do tempo e recomenda melhorias de processo sem que ninguém precise pedir. Gera relatório semanal com oportunidades identificadas.

### Inputs
- Dados agregados do banco — últimos 7, 30 e 90 dias (via Prisma)
- Alertas e anomalias do Agente Monitor
- Taxa de aceitação das sugestões do Copiloto (quantas vezes o atendente editou antes de enviar)
- Canal mais usado por segmento de cliente

### Exemplos de insights gerados
```
"OS do tipo 'instalação' demoram 3× mais às sextas-feiras.
 Sugestão: criar fila dedicada com técnico de plantão."

"Clientes que chegam pelo Telegram têm 40% menos churn.
 Sugestão: priorizar aquisição por este canal."

"Atendentes editam sempre a sugestão sobre garantia do Copiloto.
 Sugestão: revisar template de garantia na base de conhecimento."

"80% dos clientes do Hermes não respondem ao lembrete de 24h.
 Sugestão: testar lembrete de 2h antes pelo mesmo canal."
```

### Outputs
- Relatório semanal com 3 a 5 recomendações priorizadas
- Sugestão de novos fluxos de automação
- Identificação de gaps na base de conhecimento do Copiloto

### Integração
- Job semanal em `scripts/melhoria.ts` (a criar)
- Relatório salvo em `database/relatorios/` e notificado ao gestor

### Handoff
Envia relatório ao gestor via canal preferido. Não aciona outros agentes diretamente.

---

## Fluxo completo entre canais e agentes

```
WhatsApp ──┐
Telegram ──┼──► [Agente Triagem / Roteador]
Hermes  ───┘     Normaliza + classifica
                       |
              _________|_________
             |                   |
             v                   v
       [Agente CRM]       [Agente Copiloto]
        Salva no            Sugere resposta
        Prisma              ao atendente
             |
             v
     [Agente Notificação]
      Responde no canal
      de origem do cliente
             |
             v
      [Agente Monitor]
       KPIs em tempo real
             |
             v
      [Agente Melhoria]
       Relatório semanal ↻
```

---

## Regras de ouro dos agentes

1. **Um agente, uma responsabilidade.** Nunca adicione lógica de outro agente dentro de um agente.
2. **Outputs sempre em JSON.** Comunicação entre agentes é sempre estruturada — nunca texto livre.
3. **Logs obrigatórios.** Todo agente registra no banco (via Prisma) o que fez, quando e qual o resultado.
4. **Canal de retorno = canal de entrada.** O cliente sempre recebe resposta no mesmo canal pelo qual entrou.
5. **Fallback humano.** Se um agente não consegue agir com confiança suficiente, escala para o atendente e registra o motivo.
6. **System prompts versionados.** Toda alteração em `.agents/skills/` é um commit com justificativa.

---

## Módulos e quais agentes cada um usa

| Módulo | Agentes envolvidos |
|---|---|
| CRM | Triagem, CRM, Notificação, Monitor, Melhoria |
| Service Desk | Triagem, CRM, Copiloto, Notificação, Monitor, Melhoria |
| IA / Copiloto | Copiloto, Melhoria |
| Pagamentos | Notificação (cobrança), Monitor (inadimplência) |

---

## Histórico de versões

| Versão | Data | O que mudou |
|---|---|---|
| v0.1 | Jun/2026 | Definição inicial — 6 agentes, 3 canais, 4 módulos Lego |

---

*Documento mantido por Francisco Munhoz — atualizar a cada criação, modificação ou descontinuação de agente.*
