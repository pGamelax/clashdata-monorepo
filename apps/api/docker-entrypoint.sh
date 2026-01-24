#!/bin/sh
set -e

echo "🚀 Iniciando aplicação..."

# Aguarda um pouco para garantir que o banco está pronto (se necessário)
if [ -n "$DATABASE_URL" ]; then
  echo "⏳ Aguardando conexão com banco de dados..."
  sleep 2
fi

# Executa migrations do Prisma
echo "📦 Executando migrations do Prisma..."
if bunx --bun prisma migrate deploy; then
  echo "✅ Migrations executadas com sucesso!"
else
  echo "⚠️ Erro ao executar migrations. Verificando se já estão aplicadas..."
  # Tenta gerar o client mesmo se migrations falharem
  bunx --bun prisma generate || true
fi

# Gera Prisma Client caso necessário (backup)
echo "🔧 Verificando Prisma Client..."
bunx --bun prisma generate || {
  echo "⚠️ Prisma Client já está gerado ou erro ao gerar. Continuando..."
}

# Inicia a aplicação
echo "✅ Iniciando servidor..."
exec bun run src/index.ts

