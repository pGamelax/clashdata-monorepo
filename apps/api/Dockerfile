FROM oven/bun:1

WORKDIR /app

# Copia arquivos de dependências
COPY package.json bun.lock* ./

# Instala todas as dependências (incluindo devDependencies para build)
RUN bun install --frozen-lockfile

# Copia o resto do código
COPY . .

# Gera Prisma Client
RUN bunx --bun prisma generate

# Expõe a porta
EXPOSE 3333

# Script de entrada que executa migrations e inicia a aplicação
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh

ENTRYPOINT ["./docker-entrypoint.sh"]
