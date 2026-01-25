# 🚀 Guia de Deploy - ClashData com Coolify

Este guia explica como fazer deploy da aplicação ClashData (API + Web) usando Coolify na sua VPS.

## 📋 Pré-requisitos

- VPS com Ubuntu 20.04+ ou Debian 11+
- Coolify instalado e configurado na VPS
- Domínios configurados (ex: `seudominio.com` e `api.seudominio.com`)
- Acesso ao repositório Git
- Domínios apontando para o IP da VPS

## 🎯 Visão Geral

Coolify gerencia automaticamente:
- ✅ Build e deploy via Docker
- ✅ SSL/HTTPS com Let's Encrypt
- ✅ Deploy automático via Git
- ✅ Variáveis de ambiente
- ✅ Health checks
- ✅ Logs centralizados
- ✅ Backup de banco de dados

## 📦 Estrutura do Projeto

```
clashdata-monorepo/
├── apps/
│   ├── api/          # Backend (ElysiaJS + Prisma)
│   │   ├── Dockerfile
│   │   └── docker-entrypoint.sh
│   └── web/          # Frontend (React + Vite)
│       └── Dockerfile
```

## 🔧 Configuração no Coolify

### 1. Criar Serviço - PostgreSQL

1. **No Coolify, clique em "New Resource" → "Database" → "PostgreSQL"**
2. **Configure:**
   - **Name**: `clashdata-postgres`
   - **Version**: `17` (ou a versão desejada)
   - **Database**: `clashdata`
   - **User**: `postgres`
   - **Password**: Gere uma senha forte (anote para usar depois)

3. **Deploy** → Aguarde o serviço iniciar

4. **Anotar Connection String:**
   - Após o deploy, o Coolify mostrará a connection string
   - Formato: `postgresql://postgres:senha@host:5432/clashdata`
   - Você precisará disso para a API

### 2. Criar Serviço - Redis

1. **No Coolify, clique em "New Resource" → "Database" → "Redis"**
2. **Configure:**
   - **Name**: `clashdata-redis`
   - **Version**: `7-alpine` (ou a versão desejada)

3. **Deploy** → Aguarde o serviço iniciar

4. **Anotar Host e Port:**
   - Após o deploy, anote o host interno (geralmente `clashdata-redis`)
   - Porta padrão: `6379`

### 3. Criar Aplicação - API (Backend)

1. **No Coolify, clique em "New Resource" → "Application"**

2. **Configuração Básica:**
   - **Name**: `clashdata-api`
   - **Repository**: URL do seu repositório Git
   - **Branch**: `main` (ou sua branch de produção)
   - **Build Pack**: `Dockerfile`
   - **Dockerfile Location**: `apps/api/Dockerfile`
   - **Port**: `3333`

3. **Configurar Domínio:**
   - **Domain**: `api.seudominio.com`
   - Coolify configurará SSL automaticamente via Let's Encrypt

4. **Variáveis de Ambiente:**
   Na seção "Environment Variables", adicione:

   ```env
   # Database (use a connection string do PostgreSQL criado)
   DATABASE_URL=postgresql://postgres:senha@clashdata-postgres:5432/clashdata
   
   # Better Auth
   BETTER_AUTH_SECRET=GERE_UMA_STRING_ALEATORIA_LONGA_AQUI
   BETTER_AUTH_URL=https://api.seudominio.com
   BETTER_AUTH_TRUSTED_ORIGIN=https://seudominio.com
   BETTER_AUTH_TRUSTED_DOMAIN=seudominio.com
   
   # Clash of Clans API
   TOKEN_COC=SEU_TOKEN_DA_API_COC
   
   # Redis (use o host do Redis criado)
   REDIS_HOST=clashdata-redis
   REDIS_PORT=6379
   
   # ClashPerk (opcional)
   CLASHPERK_TOKEN=SEU_TOKEN_CLASHPERK_OPCIONAL
   
   # Node Environment
   NODE_ENV=production
   ```

5. **Conectar Serviços:**
   - Na seção "Connected Resources", conecte:
     - `clashdata-postgres` → Isso criará variáveis automáticas
     - `clashdata-redis` → Isso criará variáveis automáticas
   - **Importante**: Se o Coolify criar variáveis automáticas, use-as ao invés das manuais

6. **Health Check:**
   - **Path**: `/`
   - **Port**: `3333`
   - Coolify verificará automaticamente se a API está respondendo

7. **Deploy:**
   - Clique em "Deploy"
   - Aguarde o build completar (pode levar alguns minutos na primeira vez)
   - O `docker-entrypoint.sh` executará as migrations automaticamente

### 4. Criar Aplicação - Web (Frontend)

1. **No Coolify, clique em "New Resource" → "Application"**

2. **Configuração Básica:**
   - **Name**: `clashdata-web`
   - **Repository**: URL do seu repositório Git (mesmo repositório)
   - **Branch**: `main`
   - **Build Pack**: `Dockerfile`
   - **Dockerfile Location**: `apps/web/Dockerfile`
   - **Port**: `3000`

3. **Configurar Domínio:**
   - **Domain**: `seudominio.com` e `www.seudominio.com`
   - Coolify configurará SSL automaticamente

4. **Variáveis de Ambiente:**
   ```env
   VITE_API_URL=https://api.seudominio.com
   ```

5. **Health Check:**
   - **Path**: `/`
   - **Port**: `3000`

6. **Deploy:**
   - Clique em "Deploy"
   - Aguarde o build completar

## 🔗 Conectar Serviços

### Conectar PostgreSQL e Redis à API

1. Na aplicação `clashdata-api`, vá em **"Connected Resources"**
2. **Conecte:**
   - `clashdata-postgres` → Isso criará variáveis de ambiente automaticamente
   - `clashdata-redis` → Isso criará variáveis de ambiente automaticamente

3. **Atualize as variáveis de ambiente:**
   - Se o Coolify criar variáveis automáticas (como `$POSTGRES_CONNECTION_STRING`), use-as
   - Caso contrário, use as variáveis manuais que você configurou

## 🔐 Gerar Secrets

```bash
# Gerar BETTER_AUTH_SECRET (execute na sua máquina local ou VPS)
openssl rand -base64 32

# Ou use um gerador online de strings aleatórias
```

## 🚀 Deploy

### Primeiro Deploy

1. **PostgreSQL:**
   - Deploy do serviço `clashdata-postgres`
   - Aguarde iniciar completamente

2. **Redis:**
   - Deploy do serviço `clashdata-redis`
   - Aguarde iniciar completamente

3. **API:**
   - Deploy da aplicação `clashdata-api`
   - Aguarde o build completar
   - O `docker-entrypoint.sh` executará as migrations automaticamente
   - Verifique os logs para confirmar que as migrations foram executadas

4. **Web:**
   - Deploy da aplicação `clashdata-web`
   - Aguarde o build completar

### Verificar Deploy

1. **API:**
   - Acesse `https://api.seudominio.com`
   - Deve retornar status da API

2. **Web:**
   - Acesse `https://seudominio.com`
   - Deve carregar a aplicação

## 🔄 Deploy Automático (Git Push)

Coolify pode fazer deploy automático quando você faz push:

1. **Configurar Webhook no Coolify:**
   - Na aplicação, vá em "Settings" → "Git"
   - Ative "Auto Deploy"
   - Copie o webhook URL

2. **Configurar no GitHub/GitLab:**
   - Vá em Settings → Webhooks
   - Adicione o webhook URL do Coolify
   - Eventos: `push`
   - Content type: `application/json`

3. **Testar:**
   - Faça um push para o repositório
   - O Coolify detectará automaticamente e iniciará o deploy

## 🔧 Configurações Avançadas

### Build Arguments (se necessário)

Se precisar passar argumentos durante o build, adicione em "Build Settings":

```env
BUILDKIT_INLINE_CACHE=1
```

### Resource Limits

Configure limites de recursos em "Settings" → "Resources":

- **API:**
  - **CPU**: 1-2 cores
  - **Memory**: 512MB - 1GB
  - **Storage**: Conforme necessário

- **Web:**
  - **CPU**: 0.5-1 core
  - **Memory**: 256MB - 512MB
  - **Storage**: Conforme necessário

### Health Checks

Coolify já faz health checks, mas você pode customizar:

- **API**: Path `/`, Port `3333`
- **Web**: Path `/`, Port `3000`

## 📝 Variáveis de Ambiente - Referência Completa

### API (Backend)

```env
# Database (use a connection string do PostgreSQL)
DATABASE_URL=postgresql://postgres:senha@clashdata-postgres:5432/clashdata

# Better Auth
BETTER_AUTH_SECRET=GERE_UMA_STRING_ALEATORIA_LONGA_AQUI
BETTER_AUTH_URL=https://api.seudominio.com
BETTER_AUTH_TRUSTED_ORIGIN=https://seudominio.com
BETTER_AUTH_TRUSTED_DOMAIN=seudominio.com

# Clash of Clans API
TOKEN_COC=SEU_TOKEN_DA_API_COC

# Redis
REDIS_HOST=clashdata-redis
REDIS_PORT=6379

# ClashPerk (opcional)
CLASHPERK_TOKEN=SEU_TOKEN_CLASHPERK_OPCIONAL

# Node Environment
NODE_ENV=production
```

### Web (Frontend)

```env
VITE_API_URL=https://api.seudominio.com
```

## 🔄 Atualizar Aplicação

### Deploy Manual

1. Faça push das mudanças para o repositório
2. No Coolify, clique em "Deploy" na aplicação desejada
3. Aguarde o build e deploy completarem

### Deploy Automático

1. Faça push das mudanças
2. O webhook do Coolify detectará automaticamente
3. O deploy iniciará automaticamente
4. Você pode acompanhar o progresso nos logs

## 📊 Monitoramento

### Logs

- **API**: Acesse "Logs" na aplicação `clashdata-api`
- **Web**: Acesse "Logs" na aplicação `clashdata-web`
- **PostgreSQL**: Acesse "Logs" no serviço `clashdata-postgres`
- **Redis**: Acesse "Logs" no serviço `clashdata-redis`

### Status

- Verifique o status de cada serviço no dashboard do Coolify
- Health checks são executados automaticamente
- Coolify mostrará alertas se algo estiver errado

## 🐛 Troubleshooting

### API não inicia

1. **Verificar logs:**
   - Acesse "Logs" da aplicação `clashdata-api`
   - Procure por erros de conexão com banco ou Redis

2. **Verificar variáveis de ambiente:**
   - Confirme que todas as variáveis estão configuradas
   - Verifique especialmente `DATABASE_URL` e `REDIS_HOST`
   - Use as variáveis automáticas do Coolify se disponíveis

3. **Verificar migrations:**
   - Veja os logs do primeiro deploy
   - O `docker-entrypoint.sh` deve executar as migrations automaticamente
   - Se falhar, você pode executar manualmente via terminal do Coolify

### Web não carrega

1. **Verificar logs:**
   - Acesse "Logs" da aplicação `clashdata-web`

2. **Verificar variável de ambiente:**
   - Confirme que `VITE_API_URL` está configurada corretamente
   - Deve ser a URL completa: `https://api.seudominio.com`

3. **Verificar build:**
   - Veja os logs de build para erros de compilação
   - O build pode falhar se houver erros de TypeScript

### Erro de conexão com banco

1. **Verificar se PostgreSQL está rodando:**
   - No dashboard do Coolify, verifique o status do serviço `clashdata-postgres`

2. **Verificar connection string:**
   - Use a connection string fornecida pelo Coolify
   - Formato: `postgresql://user:password@host:port/database`
   - Se conectou os serviços, use as variáveis automáticas

3. **Verificar rede:**
   - Certifique-se de que os serviços estão na mesma rede
   - Coolify gerencia isso automaticamente quando você conecta os recursos

### SSL não funciona

1. **Verificar domínios:**
   - Confirme que os domínios estão apontando para o IP da VPS
   - Use `dig seudominio.com` ou `nslookup seudominio.com` para verificar

2. **Verificar certificados:**
   - Coolify gerencia SSL automaticamente via Let's Encrypt
   - Verifique em "Settings" → "SSL" da aplicação
   - Pode levar alguns minutos para o certificado ser emitido

### Build falha

1. **Verificar Dockerfile:**
   - Confirme que o caminho do Dockerfile está correto
   - API: `apps/api/Dockerfile`
   - Web: `apps/web/Dockerfile`

2. **Verificar logs de build:**
   - Veja os logs completos do build no Coolify
   - Procure por erros específicos

3. **Verificar dependências:**
   - Confirme que o `package.json` está correto
   - Verifique se há problemas com o `bun.lock`

## 🔄 Backup

### Backup do PostgreSQL

1. **Via Coolify:**
   - Acesse o serviço `clashdata-postgres`
   - Use a funcionalidade de backup do Coolify (se disponível)

2. **Manual via terminal:**
   ```bash
   # Acesse o terminal do container PostgreSQL no Coolify
   docker exec clashdata-postgres pg_dump -U postgres clashdata > backup.sql
   ```

### Restaurar Backup

```bash
# Via terminal do Coolify
cat backup.sql | docker exec -i clashdata-postgres psql -U postgres clashdata
```

## 📚 Estrutura Final no Coolify

```
Coolify Dashboard
├── Applications
│   ├── clashdata-api (Backend)
│   │   ├── Domain: api.seudominio.com
│   │   ├── Port: 3333
│   │   ├── Connected: clashdata-postgres, clashdata-redis
│   │   └── Auto Deploy: ✅
│   └── clashdata-web (Frontend)
│       ├── Domain: seudominio.com
│       ├── Port: 3000
│       └── Auto Deploy: ✅
└── Databases
    ├── clashdata-postgres
    └── clashdata-redis
```

## ✅ Checklist de Deploy

- [ ] Coolify instalado e configurado
- [ ] Repositório Git configurado
- [ ] Domínios apontando para VPS
- [ ] PostgreSQL criado no Coolify
- [ ] Redis criado no Coolify
- [ ] API criada e configurada
- [ ] Web criada e configurada
- [ ] Variáveis de ambiente configuradas
- [ ] Serviços conectados (PostgreSQL e Redis na API)
- [ ] Primeiro deploy realizado
- [ ] Migrations executadas (automático via docker-entrypoint.sh)
- [ ] SSL configurado automaticamente
- [ ] Webhook configurado para auto-deploy
- [ ] Testes de funcionamento realizados

## 🎉 Pronto!

Sua aplicação está no ar! Coolify gerencia tudo automaticamente:
- ✅ Deploy contínuo via Git
- ✅ SSL automático via Let's Encrypt
- ✅ Health checks automáticos
- ✅ Logs centralizados
- ✅ Backup de banco de dados
- ✅ Gerenciamento de recursos

## 📞 Suporte

Em caso de problemas:
1. Verifique os logs no Coolify
2. Confirme que todas as variáveis de ambiente estão corretas
3. Verifique se os serviços estão conectados corretamente
4. Consulte a documentação do Coolify: https://coolify.io/docs
