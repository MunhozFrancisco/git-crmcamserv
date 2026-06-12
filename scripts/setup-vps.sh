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
log "Instalando dependências do sistema..."
apt-get install -y -qq curl git unzip ufw nginx ca-certificates gnupg

# ── 3. Docker Engine ──────────────────────────────────────
log "Instalando Docker..."
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  > /etc/apt/sources.list.d/docker.list
apt-get update -qq
apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin
systemctl enable --now docker
log "Docker instalado: $(docker --version)"

# ── 4. PostgreSQL 16 ──────────────────────────────────────
log "Instalando PostgreSQL 16..."
apt-get install -y -qq postgresql postgresql-contrib
systemctl enable --now postgresql
log "PostgreSQL rodando."

# ── 5. Criar banco e role da aplicação ───────────────────
warn "Configurando banco de dados..."
read -rsp "  Senha para o role '${DB_USER}' (aplicação): " DB_PASS; echo ""

sudo -u postgres psql <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASS}';
  ELSE
    ALTER ROLE ${DB_USER} PASSWORD '${DB_PASS}';
  END IF;
END
\$\$;
SQL

sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} ENCODING 'UTF8' OWNER ${DB_USER};"

sudo -u postgres psql -d "${DB_NAME}" -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};"
sudo -u postgres psql -d "${DB_NAME}" -c "GRANT ALL ON SCHEMA public TO ${DB_USER};"

log "Banco '${DB_NAME}' configurado."

# ── 6. Diretório da aplicação ─────────────────────────────
log "Criando diretório da aplicação em ${APP_DIR}..."
mkdir -p "${APP_DIR}"

# ── 7. Arquivo de ambiente ────────────────────────────────
VPS_IP=$(curl -s ifconfig.me)
NEXTAUTH_SECRET_VAL=$(openssl rand -base64 32)

cat > "${APP_DIR}/.env" <<ENV
# Banco de dados
DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}"

# Autenticação (NextAuth)
NEXTAUTH_URL="http://${VPS_IP}"
NEXTAUTH_SECRET="${NEXTAUTH_SECRET_VAL}"

# App
NODE_ENV=production
PORT=${APP_PORT}
ENV

chmod 600 "${APP_DIR}/.env"
log ".env criado em ${APP_DIR}/.env"
warn "NEXTAUTH_SECRET: ${NEXTAUTH_SECRET_VAL}"
warn "Guarde o NEXTAUTH_SECRET em lugar seguro!"

# ── 8. Aplicar schema SQL ─────────────────────────────────
if [ -f "${APP_DIR}/database/schema.sql" ]; then
  log "Aplicando schema principal..."
  sudo -u postgres psql -d "${DB_NAME}" -f "${APP_DIR}/database/schema.sql"
else
  warn "schema.sql não encontrado em ${APP_DIR}/database/schema.sql"
  warn "Copie o projeto primeiro, depois execute:"
  warn "  sudo -u postgres psql -d ${DB_NAME} -f ${APP_DIR}/database/schema.sql"
fi

# ── 9. Aplicar migrations ────────────────────────────────
if [ -d "${APP_DIR}/database/migrations" ]; then
  log "Aplicando migrations..."
  for f in "${APP_DIR}/database/migrations/"*.sql; do
    [ -f "$f" ] || continue
    log "  Aplicando: $(basename $f)"
    sudo -u postgres psql -d "${DB_NAME}" -f "$f" || warn "Migration $(basename $f) pode já ter sido aplicada."
  done
else
  warn "Pasta de migrations não encontrada. Execute manualmente após copiar o projeto:"
  warn "  sudo -u postgres psql -d ${DB_NAME} -f ${APP_DIR}/database/migrations/001_v01_updates.sql"
fi

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

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    location / {
        proxy_pass         http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header   Upgrade \$http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host \$host;
        proxy_set_header   X-Real-IP \$remote_addr;
        proxy_set_header   X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 60s;
    }

    location /_next/static/ {
        proxy_pass http://127.0.0.1:${APP_PORT};
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
echo "  Próximos passos para fazer o deploy:"
echo ""
echo "  1. Copie o projeto para ${APP_DIR}:"
echo "     git clone <repo-url> ${APP_DIR}"
echo "     # ou via scp:"
echo "     # scp -r ./CRM-Camserv root@${VPS_IP}:${APP_DIR}"
echo ""
echo "  2. Construa a imagem Docker:"
echo "     cd ${APP_DIR}"
echo "     docker build -t camserv-crm:latest ."
echo ""
echo "  3. Suba o container:"
echo "     docker compose up -d"
echo ""
echo "  4. Verifique se está rodando:"
echo "     docker compose ps"
echo "     curl http://localhost:${APP_PORT}/api/health"
echo ""
echo "  5. Para atualizar a senha do gestor padrão:"
echo "     node -e \"const b=require('bcryptjs');b.hash('SuaSenha@2025',10).then(h=>console.log(h))\""
echo "     psql -U postgres -d ${DB_NAME} -c \"UPDATE users SET password_hash='HASH' WHERE email='...' \""
echo ""
echo "  6. Para ver logs do container:"
echo "     docker compose logs -f"
echo ""
echo "  URL da aplicação: http://${VPS_IP}"
echo ""
