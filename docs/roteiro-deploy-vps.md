# Roteiro de Deploy — CRM Camserv (VPS Hostinger)

## Contexto da infraestrutura

| Componente | Detalhe |
|---|---|
| VPS | Hostinger, Ubuntu |
| Banco | PostgreSQL 16 gerenciado pelo Easypanel |
| Easypanel | Ocupa porta 3000; Traefik roda como Docker Swarm service |
| App | Container Docker, porta **3001** |
| Proxy | Nginx na porta 80 → 3001 |
| Repositório | https://github.com/MunhozFrancisco/git-crmcamserv |
| Deploy dir | `/var/www/camserv-crm` |

---

## Pré-requisitos (feito uma vez)

- [ ] Docker instalado (`apt install docker.io docker-compose-plugin`)
- [ ] Nginx instalado e configurado (`/etc/nginx/sites-enabled/camserv`)
- [ ] Banco criado no Easypanel com role `camserv_app`
- [ ] Schema aplicado: `psql -U camserv_app -d camserv_crm < database/schema.sql`
- [ ] Migrations aplicadas: `psql ... < database/migrations/*.sql`
- [ ] Arquivo `.env` criado em `/var/www/camserv-crm/.env`
- [ ] Senha do usuário gestor atualizada no banco (hash bcrypt real)

---

## Checklist de Deploy (atualizações de código)

### 1. Local (Windows) — antes de subir

- [ ] Rodar `npx prisma generate` se mudou o schema
- [ ] Verificar TypeScript: `npx tsc --noEmit`
- [ ] Testar build local: `npm run build`
- [ ] Commitar **tudo** (incluindo migrations novas se houver)
- [ ] `git push origin master`

### 2. Na VPS — acesso SSH

```bash
ssh root@<IP_DA_VPS>
cd /var/www/camserv-crm
```

### 3. Atualizar código

```bash
git checkout -- Dockerfile   # só se editou Dockerfile direto na VPS
git pull origin master
```

> Se aparecer conflito em outro arquivo: `git stash && git pull && git stash pop`

### 4. Aplicar migrations (se houver alteração no banco)

```bash
psql -h localhost -U camserv_app -d camserv_crm \
  < database/migrations/<nome_do_arquivo>.sql
```

> Verificar se o tipo já existe antes de criar: o script deve ter `IF NOT EXISTS` ou testar manualmente com `\dT` no psql.

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
```

```bash
docker logs camserv-crm --tail 50
# Verificar: sem erros de Prisma, sem "type does not exist"
```

### 7. Testar no browser

Abrir `http://<IP_DA_VPS>` em aba anônima (evita cache).

---

## Checklist de Teste Pós-Deploy

- [ ] Login como **gestor** (`rafael@camserv.com.br`)
- [ ] Login como **vendedor**
- [ ] Cadastrar vendedor
- [ ] Cadastrar cliente (testar campo "origem": indicação, cold-call etc.)
- [ ] Cadastrar produto (tipo: serviço, produto)
- [ ] Criar oportunidade **selecionando um produto/serviço** e mover no kanban
- [ ] Confirmar que o badge do produto aparece no card do kanban
- [ ] Filtrar o pipeline pelo produto cadastrado
- [ ] Registrar atividade na oportunidade
- [ ] Criar tarefa vinculada a cliente/oportunidade
- [ ] Editar tarefa → preencher "Registrar Conversa" → abrir a oportunidade e confirmar que a interação aparece no histórico
- [ ] Verificar dashboard (cards de KPI, ranking de vendedores para gestor)
- [ ] Clicar no sino de notificações
- [ ] Acessar página de Contatos

---

## Armadilhas conhecidas (já resolvidas)

| Problema | Causa | Solução |
|---|---|---|
| `git pull` abortado | Dockerfile editado diretamente na VPS | `git checkout -- Dockerfile` antes do pull |
| Container com nome duplicado | `docker rm` não foi feito antes | `docker rm -f camserv-crm` |
| CSS/JS não carregam | Cache do browser | Abrir em aba anônima |
| Porta 80 ocupada pelo Traefik | Traefik é Swarm service, não para com `docker stop` | `docker service scale easypanel-traefik=0` |
| Porta 3000 ocupada pelo Easypanel | Conflito com app | App usa PORT=3001 no `.env` |
| `type "UserRole" does not exist` | PostgreSQL criou enums em snake_case, Prisma espera PascalCase | `ALTER TYPE user_role RENAME TO "UserRole"` (já feito) |
| `Invalid value for argument 'type'` | Form envia "serviço" mas Prisma espera "servico" | `enum-maps.ts` + `mapEnum()` nas rotas (já feito) |
| Login com senha errada | schema.sql tem hash placeholder | Gerar hash real: `node -e "require('bcryptjs').hash('senha',10).then(console.log)"` e fazer UPDATE no banco |
| `curl ifconfig.me` retorna IPv6 | VPS tem IPv6 habilitado | Usar `curl -s -4 ifconfig.me` para forçar IPv4 |

---

## Comandos úteis

```bash
# Ver logs em tempo real
docker logs -f camserv-crm

# Entrar no container
docker exec -it camserv-crm sh

# Conectar ao banco
psql -h localhost -U camserv_app -d camserv_crm

# Ver tipos do banco
\dT

# Listar enums e valores
SELECT typname, enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid ORDER BY typname;

# Reiniciar Nginx
systemctl restart nginx

# Status dos containers
docker compose ps

# Ver IP público (IPv4)
curl -s -4 ifconfig.me
```

---

## Variáveis de ambiente necessárias (`.env`)

```env
DATABASE_URL=postgresql://camserv_app:<senha>@localhost:5432/camserv_crm
NEXTAUTH_URL=http://<IP_VPS>
NEXTAUTH_SECRET=<string_aleatoria_longa>
PORT=3001
NODE_ENV=production
```

---

## Deploy de emergência (rollback)

```bash
# Ver imagens disponíveis
docker images camserv-crm

# Subir versão anterior (se tiver tag)
docker rm -f camserv-crm
docker run -d --name camserv-crm --env-file .env --network host camserv-crm:<tag_anterior>
```

> Boas práticas: antes de cada deploy em produção, taguear a imagem atual:
> ```bash
> docker tag camserv-crm:latest camserv-crm:backup-$(date +%Y%m%d)
> ```
