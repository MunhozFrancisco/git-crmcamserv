FROM node:20-alpine
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
