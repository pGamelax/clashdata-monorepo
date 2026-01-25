# Estrutura de API do Frontend

Esta pasta contém toda a organização das requisições HTTP do frontend para a API backend.

## Estrutura de Diretórios

```
api/
├── index.ts              # Exportações centralizadas
├── client.ts             # Cliente HTTP base com tratamento de erros
├── endpoints.ts          # Constantes de endpoints da API
├── types/
│   └── index.ts          # Tipagens TypeScript para todas as respostas
└── queries/
    ├── auth.ts           # Queries de autenticação
    ├── clans.ts          # Queries de clãs
    ├── dashboard.ts       # Queries do dashboard
    ├── players.ts        # Queries de jogadores
    ├── legend-logs.ts    # Queries de logs da Legend League
    └── admin.ts          # Queries administrativas
```

## Como Usar

### Importar queries e tipos

```typescript
import { 
  getClansQueryOptions,
  getPlayerInfoQueryOptions,
  type Clan,
  type PlayerInfo 
} from "@/api";
```

### Usar em componentes React

```typescript
import { useSuspenseQuery } from "@tanstack/react-query";
import { getPlayerInfoQueryOptions } from "@/api";

function PlayerComponent({ playerTag }: { playerTag: string }) {
  const { data: playerInfo } = useSuspenseQuery(
    getPlayerInfoQueryOptions(playerTag)
  );
  
  return <div>{playerInfo.name}</div>;
}
```

### Usar em loaders do TanStack Router

```typescript
import { createFileRoute } from "@tanstack/react-router";
import { getClansQueryOptions } from "@/api";

export const Route = createFileRoute("/clans")({
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData(getClansQueryOptions);
  },
  component: ClansComponent,
});
```

### Fazer requisições manuais (mutations)

```typescript
import { createClanAdmin, addClanToUser } from "@/api";

// Em um handler de evento
const handleCreateClan = async () => {
  try {
    const result = await createClanAdmin({ clanTag: "#ABC123" });
    console.log("Clã criado:", result);
  } catch (error) {
    if (error instanceof ApiError) {
      console.error("Erro:", error.message);
    }
  }
};
```

## Módulos Disponíveis

### Auth (`queries/auth.ts`)
- `getSessionQueryOptions` - Obter sessão do usuário

### Clans (`queries/clans.ts`)
- `getClansQueryOptions` - Listar todos os clãs do usuário
- `getClanInfoQueryOptions(clanTag)` - Obter informações de um clã
- `createClan(body)` - Criar um clã (admin only)

### Dashboard (`queries/dashboard.ts`)
- `getDashboardDataQueryOptions(clanTag)` - Obter dados do dashboard de guerra

### Players (`queries/players.ts`)
- `getPlayerInfoQueryOptions(playerTag)` - Obter informações de um jogador
- `getPlayerWarHistoryQueryOptions(playerTag)` - Obter histórico de guerra
- `searchPlayerQueryOptions(playerTag)` - Buscar jogador (para página de busca)

### Legend Logs (`queries/legend-logs.ts`)
- `getPlayerLogsQueryOptions(playerTag)` - Obter logs de Legend League de um jogador
- `getClanLogsQueryOptions(clanTag)` - Obter logs de Legend League de um clã

### Admin (`queries/admin.ts`)
- `getAllClansQueryOptions` - Listar todos os clãs (admin only)
- `getAllUsersQueryOptions` - Listar todos os usuários (admin only)
- `createClanAdmin(body)` - Criar clã (admin only)
- `addClanToUser(body)` - Atribuir clã a usuário (admin only)
- `revokeClanAccess(body)` - Revogar acesso de usuário a clã (admin only)

## Tratamento de Erros

Todas as requisições usam a classe `ApiError` que fornece:
- `message`: Mensagem de erro
- `status`: Código HTTP de status
- `endpoint`: URL do endpoint que falhou

```typescript
import { ApiError } from "@/api";

try {
  await someApiCall();
} catch (error) {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      // Redirecionar para login
    } else if (error.status === 403) {
      // Acesso negado
    } else if (error.status === 404) {
      // Recurso não encontrado
    }
  }
}
```

## Normalização de Tags

A função `normalizeTag` remove automaticamente `#` e espaços das tags:

```typescript
import { normalizeTag } from "@/api";

normalizeTag("#ABC123"); // "ABC123"
normalizeTag("ABC123");  // "ABC123"
normalizeTag("# ABC 123"); // "ABC123"
```

Todas as queries já fazem essa normalização automaticamente.

## Tipagens

Todas as tipagens estão em `types/index.ts` e são baseadas nos modelos Zod do backend:

- `Session` - Sessão do usuário
- `Clan`, `ClanInfo` - Dados de clãs
- `PlayerInfo`, `WarHistory` - Dados de jogadores
- `DashboardData` - Dados do dashboard
- `LegendLog`, `PlayerLogsResponse`, `ClanLogsResponse` - Logs da Legend League
- `AdminClan`, `AdminUser` - Dados administrativos

## Endpoints

Todos os endpoints estão centralizados em `endpoints.ts`:

```typescript
import { endpoints } from "@/api";

// Usar endpoints diretamente (se necessário)
const url = endpoints.players.getInfo("ABC123");
```

## Boas Práticas

1. **Sempre use as queries exportadas** ao invés de criar novas queries manualmente
2. **Use as tipagens exportadas** para garantir type-safety
3. **Trate erros** usando `ApiError` para diferentes status codes
4. **Não normalize tags manualmente** - as queries já fazem isso
5. **Use `useSuspenseQuery` em loaders** para melhor UX
6. **Use `useQuery` em componentes** quando precisar de loading states

