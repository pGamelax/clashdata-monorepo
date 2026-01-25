# 🚀 Deploy no Coolify - Guia Visual

## 📋 Checklist Rápido

- [ ] PostgreSQL criado
- [ ] Redis criado  
- [ ] API configurada e deployada
- [ ] Web configurada e deployada
- [ ] Variáveis de ambiente configuradas
- [ ] Serviços conectados
- [ ] Domínios configurados

## 🎯 Configuração no Coolify

### Passo 1: PostgreSQL

```
New Resource → Database → PostgreSQL
├── Name: clashdata-postgres
├── Version: 17
├── Database: clashdata
└── Deploy → Anotar connection string
```

### Passo 2: Redis

```
New Resource → Database → Redis
├── Name: clashdata-redis
├── Version: 7-alpine
└── Deploy → Anotar host (clashdata-redis)
```

### Passo 3: API (Backend)

```
New Resource → Application
├── Name: clashdata-api
├── Repository: <seu-repo-git>
├── Branch: main
├── Build Pack: Dockerfile
├── Dockerfile Location: apps/api/Dockerfile
├── Port: 3333
├── Domain: api.seudominio.com
├── Environment Variables: (ver abaixo)
├── Connected Resources: 
│   ├── clashdata-postgres ✅
│   └── clashdata-redis ✅
└── Deploy
```

**Variáveis de Ambiente da API:**
```env
DATABASE_URL=postgresql://postgres:senha@clashdata-postgres:5432/clashdata
BETTER_AUTH_SECRET=<gerar>
BETTER_AUTH_URL=https://api.seudominio.com
BETTER_AUTH_TRUSTED_ORIGIN=https://seudominio.com
BETTER_AUTH_TRUSTED_DOMAIN=seudominio.com
TOKEN_COC=<seu_token>
REDIS_HOST=clashdata-redis
REDIS_PORT=6379
CLASHPERK_TOKEN=<opcional>
NODE_ENV=production
```

### Passo 4: Web (Frontend)

```
New Resource → Application
├── Name: clashdata-web
├── Repository: <seu-repo-git>
├── Branch: main
├── Build Pack: Dockerfile
├── Dockerfile Location: apps/web/Dockerfile
├── Port: 3000
├── Domain: seudominio.com
├── Environment Variables:
│   └── VITE_API_URL=https://api.seudominio.com
└── Deploy
```

## 🔄 Auto-Deploy

1. **Na aplicação** → Settings → Git
2. **Ativar "Auto Deploy"**
3. **Copiar Webhook URL**
4. **No GitHub/GitLab** → Settings → Webhooks → Add
5. **Colar URL** → Event: `push`

## ✅ Pronto!

Agora é só fazer push e o Coolify faz o resto! 🎉

