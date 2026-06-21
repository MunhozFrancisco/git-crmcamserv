# Roteiro de Deploy — CRM Camserv (VPS Hostinger)

## Mapa do ambiente (atualizado 2026-06-21)

| Componente | Teste | Produção |
|---|---|---|
| URL | `http://72.61.78.176:3002` | `http://72.61.78.176` |
| Branch | `develop` | `master` |
| Container | `camserv-crm-dev` | `camserv-crm` |
| Porta | `3002` | `3001` |
| Banco | `camserv_dev` | `camserv_crm` |
| Compose | `docker-compose.dev.yml` | `docker-compose.yml` |
| Env file | `.env.dev` | `.env` |

| Componente | Detalhe |
|---|---|
| VPS | Hostinger · Ubuntu 24.04 · IP `72.61.78.176` |
| Banco container | `supabase_supabase-db-1` · PostgreSQL 15 · porta `5432` |
| Banco host interno | `172.16.2.12:5432` |
| Banco usuário | `camserv_app` / senha `Camserv2026` |
| Nginx | Porta 443 SSL → proxy `localhost:3001` (produção) |
| Easypanel | Container `easypanel` · porta `3000` (não usar) |
| Deploy dir | `/var/www/camserv-crm` |
| Repo | https://github.com/MunhozFrancisco/git-crmcamserv |

---

## Fluxo de trabalho

```
PC (edita código no VS Code)
    ↓ git push develop
VPS Teste :3002 (testa e valida)
    ↓ aprovado → merge develop → master → git push master
VPS Produção :3001
```

---

## Deploy no Ambiente de TESTE

```bash
ssh root@72.61.78.176
cd /var/www/camserv-crm
git checkout develop
git pull origin develop
docker build -t camserv-crm-dev:latest .
docker rm -f camserv-crm-dev
docker compose -f docker-compose.dev.yml -p camserv-dev up -d
curl -s http://localhost:3002/api/health
docker logs camserv-crm-dev --tail 20
```

---

## Deploy no Ambiente de PRODUÇÃO

```bash
ssh root@72.61.78.176
cd /var/www/camserv-crm
git checkout master
git pull origin master
docker build -t camserv-crm:latest .
docker rm -f camserv-crm
docker compose -f docker-compose.yml -p camserv-prod up -d
curl -s http://localhost:3001/api/health
docker logs camserv-crm --tail 20
```

---

## Promoção Teste → Produção (merge)

```bash
# No PC local
git checkout master
git merge develop
git push origin master
# Depois execute o deploy de produção acima na VPS
```

---

## Se mudou o schema Prisma — aplicar no banco

### No banco de TESTE
```bash
docker exec -it supabase_supabase-db-1 psql -U postgres -d camserv_dev
```
```sql
ALTER TABLE <tabela> ADD COLUMN IF NOT EXISTS <coluna> <tipo>;
GRANT ALL ON TABLE <tabela> TO camserv_app;
```

### No banco de PRODUÇÃO
```bash
docker exec -it supabase_supabase-db-1 psql -U postgres -d camserv_crm
```
```sql
ALTER TABLE <tabela> ADD COLUMN IF NOT EXISTS <coluna> <tipo>;
GRANT ALL ON TABLE <tabela> TO camserv_app;
```

### Mapeamento de tipos Prisma → PostgreSQL

| Prisma | PostgreSQL |
|---|---|
| `String` | `TEXT` |
| `String @db.Uuid` | `UUID` |
| `Int` | `INTEGER` |
| `Float` | `NUMERIC` |
| `Boolean` | `BOOLEAN` |
| `DateTime` | `TIMESTAMP WITH TIME ZONE` |
| `DateTime @db.Date` | `DATE` |
| `Json` | `JSONB` |

---

## Migração Teste → Produção (banco)

Quando os dados de teste estiverem validados e quiser migrar para produção:

```bash
# Exportar dados do banco de teste
docker exec -it supabase_supabase-db-1 pg_dump -U postgres -d camserv_dev \
  --data-only --no-owner --no-privileges > /tmp/dados_dev.sql

# Importar no banco de produção (CUIDADO — sobrescreve dados existentes)
docker exec -i supabase_supabase-db-1 psql -U postgres -d camserv_crm < /tmp/dados_dev.sql
```

---

## Usuários de acesso

| Ambiente | E-mail | Senha |
|---|---|---|
| Teste | `rafael@camserv.com.br` | `Camserv@2026` |
| Produção | `rafael@camserv.com.br` | `Camserv@2026` |

---

## Armadilhas conhecidas

| Problema | Causa | Solução |
|---|---|---|
| Container prod recriado ao subir dev | Docker compose sem `-p` lê os dois arquivos | Sempre usar `-p camserv-dev` e `-p camserv-prod` |
| Login não entra | `NEXTAUTH_URL` errado | Teste: `http://72.61.78.176:3002` · Prod: `http://72.61.78.176` |
| Porta 3002 inacessível | Firewall bloqueado | `ufw allow 3002/tcp` |
| `column does not exist` | Schema mudou, banco não migrado | `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` nos dois bancos |
| `permission denied for table` | Tabela nova sem GRANT | `GRANT ALL ON TABLE <tabela> TO camserv_app;` |
| Build local falha no `.next` | OneDrive bloqueia symlinks | Normal — build ocorre na VPS |
| Porta 3000 ocupada | Easypanel usa porta 3000 | App usa `PORT=3001/3002` — nunca mudar |

---

## Comandos úteis

```bash
# Status dos containers
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Logs em tempo real
docker logs -f camserv-crm        # produção
docker logs -f camserv-crm-dev    # teste

# Conectar ao banco de teste
docker exec -it supabase_supabase-db-1 psql -U postgres -d camserv_dev

# Conectar ao banco de produção
docker exec -it supabase_supabase-db-1 psql -U postgres -d camserv_crm

# Reiniciar sem rebuild
docker restart camserv-crm
docker restart camserv-crm-dev

# Gerar hash bcrypt para senha
cd /tmp && node -e "require('/tmp/node_modules/bcryptjs').hash('SENHA', 10).then(console.log)"

# Liberar porta no firewall
ufw allow 3002/tcp

# Health check
curl -s http://localhost:3001/api/health   # produção
curl -s http://localhost:3002/api/health   # teste
```

---

## Deploy de emergência (rollback produção)

```bash
# Taguear antes de cada deploy
docker tag camserv-crm:latest camserv-crm:backup-$(date +%Y%m%d)

# Rollback
docker rm -f camserv-crm
docker run -d --name camserv-crm --env-file /var/www/camserv-crm/.env \
  --network host camserv-crm:<tag_anterior>
```
