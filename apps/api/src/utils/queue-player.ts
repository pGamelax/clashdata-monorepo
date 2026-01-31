import { prisma } from "@/lib/prisma";

/**
 * Normaliza a tag do jogador (garante que comece com #)
 */
function normalizeTag(tag: string): string {
  return tag.startsWith("#") ? tag : `#${tag}`;
}

/**
 * Adiciona um jogador ao playerSnapshot (sem duplicatas)
 */
export async function addPlayerToSnapshot(
  playerTag: string,
  playerName?: string
): Promise<boolean> {
  try {
    const normalizedTag = normalizeTag(playerTag);

    // Verifica se já existe
    const existing = await prisma.playerSnapshot.findUnique({
      where: { playerTag: normalizedTag },
    });

    if (existing) {
      // Já existe, apenas atualiza o nome se fornecido
      if (playerName) {
        await prisma.playerSnapshot.update({
          where: { playerTag: normalizedTag },
          data: { playerName },
        });
      }
      return false; // Já existia
    }

    // Cria novo snapshot
    await prisma.playerSnapshot.create({
      data: {
        playerTag: normalizedTag,
        playerName: playerName || "Unknown",
        lastTrophies: 0,
        lastAttackWins: 0,
      },
    });

    return true; // Foi criado
  } catch (error: any) {
    return false;
  }
}

/**
 * Adiciona um jogador ao snapshot (não cria job individual mais)
 * O job repetido processa todos os jogadores do snapshot automaticamente
 */
export async function addPlayerToMonitoringQueue(
  playerTag: string,
  clanTag?: string
): Promise<boolean> {
  // Agora apenas adiciona ao snapshot - o job repetido processa todos
  return await addPlayerToSnapshot(playerTag);
}

/**
 * Adiciona um jogador ao snapshot E garante que está na lista de monitoramento
 */
export async function addPlayerToSnapshotAndQueue(
  playerTag: string,
  playerName?: string,
  clanTag?: string
): Promise<{ addedToSnapshot: boolean; addedToQueue: boolean }> {
  const addedToSnapshot = await addPlayerToSnapshot(playerTag, playerName);
  // Não precisa mais adicionar à queue individual - o job repetido processa todos
  return { addedToSnapshot, addedToQueue: addedToSnapshot };
}
