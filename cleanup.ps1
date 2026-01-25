# Script de limpeza para Windows
# Remove arquivos desnecessários antes do deploy

Write-Host "🧹 Limpando arquivos desnecessários..." -ForegroundColor Yellow

# Remover dados de desenvolvimento do PostgreSQL e Redis
if (Test-Path "apps\api\data") {
    Write-Host "Removendo apps\api\data..." -ForegroundColor Cyan
    Remove-Item -Recurse -Force "apps\api\data" -ErrorAction SilentlyContinue
}

# Remover node_modules (serão reinstalados no deploy)
Write-Host "Removendo node_modules..." -ForegroundColor Cyan
Get-ChildItem -Path . -Recurse -Directory -Filter "node_modules" | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

# Remover arquivos de build
Write-Host "Removendo arquivos de build..." -ForegroundColor Cyan
if (Test-Path "apps\web\dist") {
    Remove-Item -Recurse -Force "apps\web\dist" -ErrorAction SilentlyContinue
}

# Remover arquivos gerados do Prisma
if (Test-Path "apps\api\src\generated") {
    Write-Host "Removendo apps\api\src\generated..." -ForegroundColor Cyan
    Remove-Item -Recurse -Force "apps\api\src\generated" -ErrorAction SilentlyContinue
}

Write-Host "✅ Limpeza concluída!" -ForegroundColor Green
Write-Host "📝 Arquivos removidos:" -ForegroundColor Yellow
Write-Host "   - apps/api/data/ (dados de desenvolvimento)" -ForegroundColor Gray
Write-Host "   - node_modules/ (serão reinstalados)" -ForegroundColor Gray
Write-Host "   - apps/web/dist/ (será reconstruído)" -ForegroundColor Gray
Write-Host "   - apps/api/src/generated/ (será regenerado)" -ForegroundColor Gray

