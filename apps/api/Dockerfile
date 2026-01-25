FROM oven/bun:1

WORKDIR /app

# Copia arquivos de dependências do monorepo
COPY apps/api/package.json apps/api/bun.lock* ./

# Instala todas as dependências (incluindo devDependencies para build)
RUN bun install --frozen-lockfile

# Copia o código da API
COPY apps/api/ ./

# Gera Prisma Client
RUN bunx --bun prisma generate

# Expõe a porta
EXPOSE 3333

# Script de entrada que executa migrations e inicia a aplicação
RUN chmod +x docker-entrypoint.sh

ENTRYPOINT ["./docker-entrypoint.sh"]
