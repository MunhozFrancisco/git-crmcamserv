# Roteiro de Deploy — CRM Camserv (VPS Hostinger)

## Mapa do ambiente (atualizado 2026-06-21)

| Componente | Detalhe |
|---|---|
| VPS | Hostinger · Ubuntu 24.04 · IP `72.61.78.176` |
| App | Container `camserv-crm` · porta **3001** · `network_mode: host` |
| Banco | Container `supabase_supabase-db-1` · PostgreSQL 15 · porta **5432** |
| Banco host | `172.16.2.12:5432` (IP interno da VPS acessível pelo app) |
| Banco usuário | `camserv_app` / senha `Camserv2026` |
| Banco nome | `camserv_crm` |
| Nginx | Porta 443 SSL → proxy `localhost:3001` |
| Easypanel | Container `easypanel` · porta **3000** (não usar para o app) |
| Deploy dir | `/var/www/camserv-crm` |
| Repo | https://github.com/MunhozFrancisco/git-crmcamserv |

---

## Containers relevantes

| Nome | Função |
|---|---|
| `camserv-crm` | App Next.js (nosso) |
| `supabase_supabase-db-1` | PostgreSQL 15 |
| `easypanel.1.*` | Painel de gestão (porta 3000 — não conflitar) |
| demais `supabase_*` | Infraestrutura Supabase (não mexer) |

---

## .env da VPS (`/var/www/camserv-crm/.env`)

```env
DATABASE_URL="postgresql://camserv_app:Camserv2026@172.16.2.12:5432/camserv_crm?schema=public"
NEXTAUTH_URL="http://72.61.78.176"
NEXTAUTH_SECRET="8KOj3ihVlsJqy8WughCR6Qq7N9tQZClm3aGcpTVNq+g="
NODE_ENV=production
PORT=3001
ANTHROPIC_API_KEY="sk-ant-api03-..."
TELEGRAM_BOT_TOKEN="..."
```

> `NEXTAUTH_URL` deve ser `http://72.61.78.176` — sem porta e sem `/` no final.
> Não usar `localhost` — quebra o cookie de sessão.

---

## Checklist de Deploy (atualizações de código)

### 1. Local — antes de subir

```powershell
# Gerar Prisma Client
npx prisma generate

# Verificar TypeScript (deve retornar sem erros)
npx tsc --noEmit

# Commitar e subir
git add <arquivos>
git commit -m "feat: ..."
git push origin master
```

> O build local (`npm run build`) falha por causa do OneDrive interferindo nos symlinks do `.next`.
> Isso é normal — o build real ocorre dentro do Docker na VPS.

### 2. Na VPS — via SSH

```bash
ssh root@72.61.78.176
# senha: Geral244095441
cd /var/www/camserv-crm
```

### 3. Atualizar código

```bash
git pull origin master
```

> Se aparecer conflito: `git stash && git pull && git stash pop`

### 4. Se mudou o schema Prisma — aplicar colunas novas no banco

Conectar no banco como superuser:
```bash
docker exec -it supabase_supabase-db-1 psql -U postgres -d camserv_crm
```

Aplicar as alterações manualmente com `ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...`

Após aplicar, verificar permissões do `camserv_app` na tabela nova:
```sql
GRANT ALL ON TABLE <nome_tabela> TO camserv_app;
```

### 5. Rebuild e restart do container

```bash
docker build -t camserv-crm:latest .
docker rm -f camserv-crm
docker compose up -d
```

### 6. Verificar saúde

```bash
docker compose ps
curl -s http://localhost:3001/api/health
# Esperado: {"ok":true}

docker logs camserv-crm --tail 30
# Não deve ter erros de Prisma
```

### 7. Testar no browser

Abrir em **aba anônima**: `http://72.61.78.176`

---

## Checklist de Teste Pós-Deploy

- [ ] Login como **gestor** (`rafael@camserv.com.br` / `Camserv@2026`)
- [ ] Dashboard carrega KPIs
- [ ] Página Clientes mostra registros
- [ ] Pipeline carrega oportunidades
- [ ] `/monitor` — dashboard da IA carrega
- [ ] `/copiloto` — lista de ordens de serviço carrega

---

## Procedimento para nova coluna no banco

Sempre que o `prisma/schema.prisma` ganhar um campo novo em uma model existente:

1. Identificar a tabela (`@@map`) e a coluna (`@map`) no schema
2. Conectar: `docker exec -it supabase_supabase-db-1 psql -U postgres -d camserv_crm`
3. Aplicar: `ALTER TABLE <tabela> ADD COLUMN IF NOT EXISTS <coluna> <tipo>;`
4. Garantir permissão: `GRANT ALL ON TABLE <tabela> TO camserv_app;`
5. Reiniciar container: `docker restart camserv-crm`

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

## Armadilhas conhecidas

| Problema | Causa | Solução |
|---|---|---|
| Login não entra (sem erro) | `NEXTAUTH_URL` errado ou `localhost` na VPS | Corrigir para `http://72.61.78.176` no `.env` da VPS |
| Cookie de sessão não funciona em HTTP | NextAuth usa `Secure` em produção | Fix em `src/lib/auth.ts` — detecta HTTP automaticamente |
| `git pull` abortado | Arquivo editado direto na VPS | `git stash && git pull && git stash pop` |
| Container com nome duplicado | `docker rm` não feito | `docker rm -f camserv-crm` antes do `up` |
| `column does not exist` (Prisma) | Schema mudou mas banco não foi migrado | Ver procedimento acima para nova coluna |
| `permission denied for table` | Tabela nova sem GRANT para `camserv_app` | `GRANT ALL ON TABLE <tabela> TO camserv_app;` |
| Build local falha no `.next` | OneDrive bloqueia symlinks | Normal — build ocorre na VPS |
| Fonte Google falha no build local | Certificado SSL corporativo | `NODE_TLS_REJECT_UNAUTHORIZED=0` no build local |
| Porta 3000 ocupada | Easypanel usa porta 3000 | App usa `PORT=3001` — nunca mudar |
| `camserv-crm` unhealthy | Healthcheck aponta para porta 3000 no compose | Corrigir healthcheck para porta 3001 |

---

## Comandos úteis

```bash
# Logs em tempo real
docker logs -f camserv-crm

# Entrar no container do app
docker exec -it camserv-crm sh

# Conectar ao banco como superuser
docker exec -it supabase_supabase-db-1 psql -U postgres -d camserv_crm

# Conectar ao banco como app user
psql -h 172.16.2.12 -U camserv_app -d camserv_crm

# Listar tabelas
\dt

# Ver estrutura de uma tabela
\d <nome_tabela>

# Ver permissões do camserv_app
SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE grantee = 'camserv_app'
ORDER BY table_name;

# Reiniciar app sem rebuild
docker restart camserv-crm

# Status dos containers
docker compose ps

# Gerar hash bcrypt para senha (no container do app)
docker exec camserv-crm node -e "require('bcryptjs').hash('SENHA', 10).then(console.log)"
# Se falhar, usar /tmp:
cd /tmp && npm install bcryptjs && node -e "require('/tmp/node_modules/bcryptjs').hash('SENHA', 10).then(console.log)"
```

---

## Deploy de emergência (rollback)

```bash
# Taguear antes de cada deploy
docker tag camserv-crm:latest camserv-crm:backup-$(date +%Y%m%d)

# Rollback para versão anterior
docker rm -f camserv-crm
docker run -d --name camserv-crm --env-file /var/www/camserv-crm/.env \
  --network host camserv-crm:<tag_anterior>
```
