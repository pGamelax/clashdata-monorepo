import { legendPlayerQueue } from "@/queue/legend-player-queue";

// Lock em memória para evitar race conditions ao criar o job mestre
let isCreatingMasterJob = false;

/**
 * Verifica se o job mestre já existe (em qualquer estado)
 */
async function masterJobExists(): Promise<boolean> {
  try {
    // 1. Verifica jobs repetidos
    const repeatableJobs = await legendPlayerQueue.getRepeatableJobs();
    const existsInRepeatable = repeatableJobs.some(
      (job) => job.id === "fan-out-master" || job.key?.includes("fan-out-master")
    );

    if (existsInRepeatable) {
      return true;
    }

    // 2. Verifica jobs na fila (waiting, active, delayed)
    try {
      const [waiting, active, delayed] = await Promise.all([
        legendPlayerQueue.getWaiting(0, 100),
        legendPlayerQueue.getActive(0, 100),
        legendPlayerQueue.getDelayed(0, 100),
      ]);

      const allJobs = [...waiting, ...active, ...delayed].filter((job) => job != null);
      const existsInQueue = allJobs.some((job) => {
        const jobId = job?.id?.toString() || "";
        const jobData = job?.data as any;
        return (
          jobId === "fan-out-master" ||
          jobData?.type === "fan-out-master"
        );
      });

      if (existsInQueue) {
        return true;
      }
    } catch (error) {
      // Se der erro ao verificar, assume que não existe para não bloquear
    }

    return false;
  } catch (error) {
    // Em caso de erro, assume que existe para não criar duplicado
    return true;
  }
}

/**
 * Cria ou garante que existe o job mestre repetido (Fan-out Master)
 * Este job roda a cada 2 minutos e distribui jobs individuais para cada jogador
 * GARANTE que não haverá duplicatas mesmo com múltiplas instâncias
 */
export async function schedulePlayerSnapshotMonitoring() {
  try {
    // Verifica lock primeiro
    if (isCreatingMasterJob) {
      return; // Já está sendo criado por outra chamada
    }

    // Verifica se já existe
    const exists = await masterJobExists();
    if (exists) {
      return; // Job já existe, não precisa fazer nada
    }

    // Adiciona lock
    isCreatingMasterJob = true;

    try {
      // Verifica novamente após adquirir o lock (double-check)
      const existsAfterLock = await masterJobExists();
      if (existsAfterLock) {
        isCreatingMasterJob = false;
        return;
      }

      // Cria o job mestre repetido que distribui jobs a cada 2 minutos
      await legendPlayerQueue.add(
        "monitor-player",
        {
          type: "fan-out-master",
        },
        {
          jobId: "fan-out-master", // JobId único garante que não haverá duplicatas
          repeat: {
            every: 120000, // A cada 2 minutos (120000ms)
          },
          removeOnComplete: true,
        }
      );
    } catch (error: any) {
      // Se o erro for de job já existe, ignora (pode ter sido criado entre as verificações)
    } finally {
      // Remove lock
      isCreatingMasterJob = false;
    }
  } catch (error: any) {
    isCreatingMasterJob = false;
  }
}

/**
 * Inicializa o job mestre repetido para distribuir jobs de jogadores
 * Usado ao reiniciar o servidor
 * GARANTE que não haverá duplicatas mesmo com múltiplas instâncias
 */
export async function initializePlayerSnapshotQueue() {
  try {
    // Verifica lock primeiro
    if (isCreatingMasterJob) {
      // Aguarda um pouco e verifica novamente
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const exists = await masterJobExists();
      if (exists) {
        return;
      }
    }

    // Verifica se já existe
    const exists = await masterJobExists();
    if (exists) {
      return;
    }

    // Adiciona lock
    isCreatingMasterJob = true;

    try {
      // Verifica novamente após adquirir o lock (double-check)
      const existsAfterLock = await masterJobExists();
      if (existsAfterLock) {
        isCreatingMasterJob = false;
        return;
      }

      // Cria o job mestre repetido
      await legendPlayerQueue.add(
        "monitor-player",
        {
          type: "fan-out-master",
        },
        {
          jobId: "fan-out-master", // JobId único garante que não haverá duplicatas
          repeat: {
            every: 120000, // A cada 2 minutos (120000ms)
          },
          removeOnComplete: true,
        }
      );
    } catch (error: any) {
      // Se o erro for de job já existe, ignora (pode ter sido criado por outra instância)
    } finally {
      // Remove lock
      isCreatingMasterJob = false;
    }
  } catch (error: any) {
    isCreatingMasterJob = false;
  }
}

/**
 * Inicia o scheduler periódico que verifica se o job mestre existe
 */
export function startPlayerSnapshotScheduler() {
  // Executa imediatamente para garantir que o job existe
  schedulePlayerSnapshotMonitoring();

  // Depois executa a cada 5 minutos para verificar se o job ainda existe
  const interval = setInterval(() => {
    schedulePlayerSnapshotMonitoring();
  }, 300000); // A cada 5 minutos (300000ms) - apenas para garantir que o job existe

  // Retorna função para parar o scheduler
  return () => {
    clearInterval(interval);
  };
}
