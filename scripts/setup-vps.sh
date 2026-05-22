#!/bin/bash
# ============================================================
#  CAMSERV CRM — Setup VPS Hostinger (Ubuntu 22.04/24.04)
#  Execute como root: bash setup-vps.sh
# ============================================================
set -e

APP_DIR="/var/www/camserv-crm"
APP_PORT=3000
DB_NAME="camserv_crm"
DB_USER="camserv_app"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }

echo ""
echo "=================================================="
echo "  CAMSERV CRM — Instalação na VPS"
echo "=================================================="
echo ""

# ── 1. Atualizar sistema ──────────────────────────────────
log "Atualizando sistema..."
apt-get update -qq && apt-get upgrade -y -qq

# ── 2. Dependências básicas ───────────────────────────────
log "Instalando dependências..."
apt-get install -y -qq curl git unzip ufw nginx

# ── 3. Node.js 20 (LTS) via NodeSource ───────────────────
log "Instalando Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
apt-get install -y -qq nodejs
node --version
npm --version

# ── 4. PM2 ───────────────────────────────────────────────
log "Instalando PM2..."
npm install -g pm2 --silent
pm2 startup systemd -u root --hp /root | tail -1 | bash

# ── 5. PostgreSQL 16 ──────────────────────────────────────
log "Instalando PostgreSQL 16..."
apt-get install -y -qq postgresql postgresql-contrib

# Iniciar e habilitar serviço
systemctl start postgresql
systemctl enable postgresql
log "PostgreSQL rodando."

# ── 6. Criar banco e role da aplicação ───────────────────
warn "Configurando banco de dados..."
read -rsp "  Senha para o role '${DB_USER}' (aplicação): " DB_PASS; echo ""
read -rsp "  Senha do admin PostgreSQL (postgres): " PG_PASS; echo ""

sudo -u postgres psql -c "ALTER USER postgres PASSWORD '${PG_PASS}';"
sudo -u postgres psql <<SQL
CREATE DATABASE ${DB_NAME} ENCODING 'UTF8' LC_COLLATE 'pt_BR.UTF-8' LC_CTYPE 'pt_BR.UTF-8' TEMPLATE template0;
CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASS}';
SQL

log "Banco '${DB_NAME}' criado."

# ── 7. Aplicar schema SQL ─────────────────────────────────
log "Aplicando schema do banco..."
sudo -u postgres psql -d "${DB_NAME}" -f /tmp/schema.sql 2>/dev/null || \
  warn "schema.sql não encontrado em /tmp — rode manualmente depois."

# ── 8. Diretório da aplicação ─────────────────────────────
log "Criando diretório da aplicação..."
mkdir -p "${APP_DIR}"
chown -R root:root "${APP_DIR}"

# ── 9. Arquivo de ambiente ────────────────────────────────
VPS_IP=$(curl -s ifconfig.me)

cat > "${APP_DIR}/.env" <<ENV
# ── Banco de dados ──────────────────────────────────────
DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}"

# ── Autenticação (NextAuth) ──────────────────────────────
NEXTAUTH_URL="http://${VPS_IP}"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"

# ── App ──────────────────────────────────────────────────
NODE_ENV=production
PORT=${APP_PORT}
ENV

log ".env criado em ${APP_DIR}/.env"
warn "NEXTAUTH_SECRET gerado automaticamente. Guarde-o em lugar seguro."

# ── 10. Firewall (UFW) ────────────────────────────────────
log "Configurando firewall..."
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
log "UFW ativo: portas 22, 80 e 443 liberadas."

# ── 11. Nginx como reverse proxy ─────────────────────────
log "Configurando Nginx..."
cat > /etc/nginx/sites-available/camserv-crm <<NGINX
server {
    listen 80;
    server_name ${VPS_IP} _;

    # Segurança básica
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    # Proxy para o Next.js
    location / {
        proxy_pass         http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header   Upgrade \$http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host \$host;
        proxy_set_header   X-Real-IP \$remote_addr;
        proxy_set_header   X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_cache_bypass \$http_upgrade;
    }

    # Arquivos estáticos Next.js
    location /_next/static/ {
        alias ${APP_DIR}/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGINX

ln -sf /etc/nginx/sites-available/camserv-crm /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
log "Nginx configurado."

# ── 12. Resumo ────────────────────────────────────────────
echo ""
echo "=================================================="
echo -e "  ${GREEN}VPS configurada com sucesso!${NC}"
echo "=================================================="
echo ""
echo "  Próximos passos:"
echo ""
echo "  1. Copie o projeto para ${APP_DIR}:"
echo "     git clone <repo> ${APP_DIR}"
echo "     # ou: scp -r ./camserv-crm root@${VPS_IP}:${APP_DIR}"
echo ""
echo "  2. Na pasta ${APP_DIR}, execute:"
echo "     npm install --legacy-peer-deps"
echo "     npx prisma generate"
echo "     psql -U camserv_app -d camserv_crm -h localhost -f database/schema.sql"
echo "     # Para atualizar a senha do gestor padrão:"
echo "     node -e \"const b=require('bcryptjs'); b.hash('SuaSenha@2025',10).then(h=>console.log(h))\""
echo "     # Cole o hash gerado no UPDATE abaixo:"
echo "     psql -U postgres -d camserv_crm -c \"UPDATE users SET password_hash='HASH_AQUI' WHERE email='rafael@camserv.com.br'\""
echo "     npm run build"
echo "     pm2 start npm --name camserv-crm -- start"
echo "     pm2 save"
echo ""
echo "  3. Acesse: http://${VPS_IP}"
echo ""
