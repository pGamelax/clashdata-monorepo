# Guia de Deploy no Coolify

## Pré-requisitos

1. VPS com Coolify instalado
2. Banco de dados PostgreSQL (pode ser gerenciado pelo Coolify ou externo)
3. Redis (pode ser gerenciado pelo Coolify ou externo)

## Variáveis de Ambiente Necessárias

Configure as seguintes variáveis de ambiente no Coolify:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/clashdata

# Better Auth
BETTER_AUTH_SECRET=seu-secret-aqui
BETTER_AUTH_URL=https://seu-dominio.com
BETTER_AUTH_TRUSTED_ORIGIN=https://seu-frontend.com,https://seu-dominio.com
BETTER_AUTH_TRUSTED_DOMAIN=seu-dominio.com

# Clash of Clans API
TOKEN_COC=seu-token-da-api-supercell

# Redis (se não usar serviço do Coolify)
REDIS_HOST=redis
REDIS_PORT=6379
```

## Passos para Deploy no Coolify

### 1. Criar Novo Projeto

1. Acesse o Coolify
2. Clique em "New Project"
3. Escolha "Docker Compose" ou "Dockerfile"
4. Conecte seu repositório Git

### 2. Configurar Build

- **Build Pack**: Dockerfile
- **Dockerfile Path**: `Dockerfile` (raiz do projeto)
- **Port**: `3333`

### 3. Configurar Serviços Adicionais (se necessário)

Se você não usar serviços gerenciados pelo Coolify:

#### PostgreSQL
- Adicione como serviço adicional ou use um banco gerenciado
- Certifique-se de que `DATABASE_URL` está configurado corretamente

#### Redis
- Adicione como serviço adicional ou use um Redis gerenciado
- Configure `REDIS_HOST` e `REDIS_PORT` nas variáveis de ambiente

### 4. Executar Migrations

Após o primeiro deploy, execute as migrations do Prisma:

```bash
# Via terminal do Coolify ou SSH na VPS
bunx --bun prisma migrate deploy
```

Ou adicione um script de inicialização no Dockerfile se preferir.

### 5. Health Check

O Coolify pode configurar o health check automaticamente. A rota de health check é:
- `GET /` - Retorna `{ status: "online" }`

## Estrutura do Dockerfile

O Dockerfile usa multi-stage build para otimizar:

1. **Stage 1 (deps)**: Instala dependências
2. **Stage 2 (builder)**: Gera Prisma Client
3. **Stage 3 (runner)**: Imagem final otimizada para produção

## Troubleshooting

### Erro de conexão com banco
- Verifique se `DATABASE_URL` está correto
- Verifique se o PostgreSQL está acessível
- Execute migrations: `bunx --bun prisma migrate deploy`

### Erro de conexão com Redis
- Verifique `REDIS_HOST` e `REDIS_PORT`
- Verifique se o Redis está rodando e acessível

### Erro ao gerar Prisma Client
- Certifique-se de que o schema Prisma está correto
- Verifique se todas as migrations foram aplicadas

## Monitoramento

- **Bull Board UI**: `http://seu-dominio.com/admin/queues`
- **OpenAPI Docs**: `http://seu-dominio.com/docs` (se configurado)

## Atualizações

Para atualizar a aplicação:
1. Faça push das mudanças para o repositório
2. O Coolify detectará automaticamente e fará rebuild
3. Ou force rebuild manualmente no painel do Coolify

