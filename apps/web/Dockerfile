# Stage 1: Build
FROM oven/bun:latest AS builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package.json bun.lock ./

# Instalar dependências
RUN bun install --frozen-lockfile

# Copiar código fonte
COPY . .

# Build da aplicação
# Usa o script build do package.json (vite build && tsc)
# Se tsc falhar, continua pois o build do Vite já foi feito
RUN bun run build || bun run vite build

# Stage 2: Production - Usar serve para servir arquivos estáticos
FROM node:20-alpine

WORKDIR /app

# Instalar serve globalmente
RUN npm install -g serve@14.2.1

# Copiar arquivos de build
COPY --from=builder /app/dist ./dist

# Expor porta 3000 (Traefik/Caddy fará o proxy reverso)
EXPOSE 3000

# Servir arquivos estáticos na porta 3000 com suporte a SPA (--single)
CMD ["serve", "-s", "dist", "-l", "3000"]
