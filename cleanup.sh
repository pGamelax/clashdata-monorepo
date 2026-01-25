#!/bin/bash
# Script de limpeza para Linux/Mac
# Remove arquivos desnecessários antes do deploy

echo "🧹 Limpando arquivos desnecessários..."

# Remover dados de desenvolvimento do PostgreSQL e Redis
if [ -d "apps/api/data" ]; then
    echo "Removendo apps/api/data..."
    rm -rf apps/api/data
fi

# Remover node_modules (serão reinstalados no deploy)
echo "Removendo node_modules..."
find . -type d -name "node_modules" -exec rm -rf {} + 2>/dev/null

# Remover arquivos de build
echo "Removendo arquivos de build..."
rm -rf apps/web/dist

# Remover arquivos gerados do Prisma
if [ -d "apps/api/src/generated" ]; then
    echo "Removendo apps/api/src/generated..."
    rm -rf apps/api/src/generated
fi

echo "✅ Limpeza concluída!"
echo "📝 Arquivos removidos:"
echo "   - apps/api/data/ (dados de desenvolvimento)"
echo "   - node_modules/ (serão reinstalados)"
echo "   - apps/web/dist/ (será reconstruído)"
echo "   - apps/api/src/generated/ (será regenerado)"

