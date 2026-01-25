# 🚀 Deploy Rápido - Coolify

## 📋 Pré-requisitos

- Coolify instalado na VPS
- Repositório Git configurado
- Domínios apontando para VPS

## 🎯 Passos Rápidos

### 1. Criar PostgreSQL

1. Coolify → **New Resource** → **Database** → **PostgreSQL**
2. **Name**: `clashdata-postgres`
3. **Deploy** → Anotar connection string

### 2. Criar Redis

1. Coolify → **New Resource** → **Database** → **Redis**
2. **Name**: `clashdata-redis`
3. **Deploy** → Anotar host (geralmente `clashdata-redis`)

### 3. Criar API (Backend)

1. Coolify → **New Resource** → **Application**
2. **Config:**
   - **Name**: `clashdata-api`
   - **Repository**: URL do Git
   - **Branch**: `main`
   - **Build Pack**: `Dockerfile`
   - **Dockerfile Location**: `apps/api/Dockerfile`
   - **Port**: `3333`
   - **Domain**: `api.seudominio.com`

3. **Variáveis de Ambiente:**
   ```env
   DATABASE_URL=postgresql://postgres:senha@clashdata-postgres:5432/clashdata
   BETTER_AUTH_SECRET=<gerar_com_openssl_rand_base64_32>
   BETTER_AUTH_URL=https://api.seudominio.com
   BETTER_AUTH_TRUSTED_ORIGIN=https://seudominio.com
   BETTER_AUTH_TRUSTED_DOMAIN=seudominio.com
   TOKEN_COC=<seu_token_coc>
   REDIS_HOST=clashdata-redis
   REDIS_PORT=6379
   CLASHPERK_TOKEN=<opcional>
   NODE_ENV=production
   ```

4. **Conectar Serviços:**
   - **Connected Resources** → Conecte `clashdata-postgres`
   - **Connected Resources** → Conecte `clashdata-redis`
   - Use as variáveis automáticas se o Coolify criar

5. **Deploy** → Aguardar build (migrations executam automaticamente)

### 4. Criar Web (Frontend)

1. Coolify → **New Resource** → **Application**
2. **Config:**
   - **Name**: `clashdata-web`
   - **Repository**: URL do Git (mesmo repo)
   - **Branch**: `main`
   - **Build Pack**: `Dockerfile`
   - **Dockerfile Location**: `apps/web/Dockerfile`
   - **Port**: `3000`
   - **Domain**: `seudominio.com`

3. **Variáveis de Ambiente:**
   ```env
   VITE_API_URL=https://api.seudominio.com
   ```

4. **Deploy** → Aguardar build

## 🔄 Atualizar

1. **Push para Git**
2. **Coolify detecta automaticamente** (se webhook configurado)
3. **Ou clique em "Deploy" manualmente**

## 🔐 Gerar Secrets

```bash
# BETTER_AUTH_SECRET
openssl rand -base64 32
```

## 📚 Documentação Completa

Veja `DEPLOY.md` para instruções detalhadas e troubleshooting.
