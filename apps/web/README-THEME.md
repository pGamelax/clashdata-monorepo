# Sistema de Tema - ClashData

## Tema Dark Moderno com Violeta Escuro

Este projeto utiliza um tema dark moderno baseado em violeta escuro, com suporte a customização da cor primária via variável de ambiente.

## Configuração da Cor Primária

### Definindo a Cor Personalizada

Para alterar a cor primária do tema, adicione a seguinte variável no seu arquivo `.env`:

```env
VITE_PRIMARY_COLOR=#8b5cf6
```

**Formatos aceitos:**
- Hexadecimal com `#`: `#8b5cf6`
- Hexadecimal sem `#`: `8b5cf6`
- OKLCH format: `oklch(0.65 0.18 285)`

**Exemplos de cores:**
- Violeta (padrão): `#8b5cf6`
- Azul: `#3b82f6`
- Verde: `#10b981`
- Rosa: `#ec4899`
- Amarelo: `#f59e0b`

### Cor Padrão

Se nenhuma cor for definida, o sistema utilizará automaticamente a cor violeta padrão:
- Violeta: `oklch(0.65 0.18 285)`

## Como Funciona

1. O sistema converte automaticamente hexadecimal para OKLCH (formato de cor moderno)
2. A cor é aplicada dinamicamente em tempo de execução
3. Todas as variantes da cor primária são geradas automaticamente
4. O tema é sempre dark - não há opção de trocar para light mode

## Arquitetura do Tema

- **Background**: Violeta escuro muito sutil (`oklch(0.08 0.005 285)`)
- **Cards**: Violeta escuro suave (`oklch(0.12 0.008 285)`)
- **Primary**: Customizável via `VITE_PRIMARY_COLOR`
- **Bordas**: Tons de violeta/cinza escuro
- **Texto**: Alto contraste para legibilidade

## Arquivos Relacionados

- `src/styles.css` - Definição das variáveis CSS do tema
- `src/lib/theme-utils.ts` - Utilitários de conversão de cores
- `src/lib/theme-init.ts` - Inicialização do tema
- `src/provider/theme-provider.tsx` - Provider do tema (sempre dark)

