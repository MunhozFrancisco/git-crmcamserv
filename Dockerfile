# ============================================================
#  CAMSERV CRM — Dockerfile multi-stage (produção)
#  Base: node:20-slim (Debian bookworm) → compatível com
#  binaryTarget "debian-openssl-3.0.x" do Prisma
# ============================================================

# ── Estágio 1: instalar dependências ─────────────────────────
FROM node:20-slim AS deps

RUN apt-get update && \
    apt-get install -y openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps --prefer-offline

# ── Estágio 2: build da aplicação ────────────────────────────
FROM node:20-slim AS builder

RUN apt-get update && \
    apt-get install -y openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Gerar o Prisma Client para linux (debian-openssl-3.0.x)
RUN npx prisma generate

# Variáveis mínimas para o next build não falhar na validação
# (não são usadas em runtime — os valores reais vêm do .env na VPS)
ENV NEXTAUTH_SECRET="build-placeholder"
ENV NEXTAUTH_URL="http://localhost:3000"
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
ENV NODE_ENV=production

RUN npm run build

# ── Estágio 3: imagem de produção (apenas o necessário) ───────
FROM node:20-slim AS runner

RUN apt-get update && \
    apt-get install -y openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Usuário não-root para segurança
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Arquivos públicos e estáticos
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static    ./.next/static

USER nextjs

EXPOSE 3000

# next build com output:'standalone' gera server.js na raiz
CMD ["node", "server.js"]
