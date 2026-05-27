#0 building with "default" instance using docker driver

#1 [internal] load build definition from Dockerfile
#1 transferring dockerfile:
#1 transferring dockerfile: 123B 0.6s done
#1 DONE 1.3s
Dockerfile:1
--------------------
1 | >>> git add Dockerfile
2 |     git commit -m "chore: adiciona Dockerfile para deploy"
3 |     git push
--------------------
ERROR: failed to build: failed to run Build function: dockerfile parse error on line 1: unknown instruction: git
##########################################
### Error
### Wed, 27 May 2026 15:31:01 GMT
##########################################

Command failed with exit code 1: docker buildx build --network host -f /etc/easypanel/projects/supabase/crmcamserv/code/Dockerfile -t easypanel/supabase/crmcamserv --label 'keep=true' --build-arg 'DATABASE_URL=postgresql://postgres:your-super-secret-and-long-postgres-password@supabase_supabase_db:5432/postgres' --build-arg 'NEXTAUTH_SECRET=7f51b5e28a5a4cfabceef328400a4b77f98c47b59efccb7b752dfcd6cf03e839' --build-arg 'NEXTAUTH_URL=https://supabase-crmcamserv.wg7hod.easypanel.host/' --build-arg 'GIT_SHA=undefined' /etc/easypanel/projects/supabase/crmcamserv/code/FROM node:20-alpine
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copia os arquivos do projeto
COPY . .

# Instala as dependências e gera o Prisma Client
RUN npm ci
RUN npx prisma generate

# Executa o build de produção do Next.js
RUN npm run build

# Expõe a porta padrão
EXPOSE 3000

# Inicia o servidor do Next.js
CMD ["npm", "run", "start"]
