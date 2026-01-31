import { Queue, Worker } from "bullmq";
import { redisConnection } from "@/config/redis";
import { prisma } from "@/lib/prisma";
import { SeasonService } from "@/modules/seasons/service";

export const seasonQueue = new Queue("season-fetch", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: { count: 10 },
    removeOnFail: { count: 50 },
  },
});

/**
 * Agenda a busca de dados da temporada para a data/hora especificada
 */
export async function scheduleSeasonDataFetch(configId: string) {
  try {
    const seasonConfig = await prisma.seasonConfig.findUnique({
      where: { id: configId },
    });

    if (!seasonConfig) {
      return;
    }

    // Se já foi processada, não agenda novamente
    if (seasonConfig.isProcessed) {
      return;
    }

    const scheduledAt = new Date(seasonConfig.scheduledAt);
    const now = new Date();

    // Se a data já passou, não agenda
    if (scheduledAt < now) {
      return;
    }

    // Verifica se já existe um job agendado para esta configuração
    const existingJobs = await seasonQueue.getJobs(["delayed", "waiting"]);
    const existingJob = existingJobs.find(
      (job) => job.data.configId === seasonConfig.id
    );

    if (existingJob) {
      return;
    }

    // Agenda o job
    await seasonQueue.add(
      "fetch-season-data",
      {
        configId: seasonConfig.id,
        type: "season-fetch",
      },
      {
        jobId: `season-fetch-${seasonConfig.id}`,
        delay: scheduledAt.getTime() - now.getTime(),
      }
    );
  } catch (error: any) {
    // Erro ao agendar busca de temporada
  }
}

/**
 * Inicia o scheduler verificando e agendando jobs pendentes
 * Executa ao iniciar o servidor para manter consistência após reload
 */
export async function initializeSeasonScheduler() {
  try {
    // Busca todas as configurações não processadas
    const pendingConfigs = await prisma.seasonConfig.findMany({
      where: {
        isProcessed: false,
      },
    });

    // Agenda cada configuração pendente
    for (const config of pendingConfigs) {
      await scheduleSeasonDataFetch(config.id);
    }

  } catch (error: any) {
    // Erro ao inicializar scheduler de temporada
  }
}

/**
 * Worker para processar os jobs de busca de temporada
 */
export const seasonWorker = new Worker(
  "season-fetch",
  async (job) => {
    const { configId } = job.data;

    const seasonService = new SeasonService();
    const result = await seasonService.fetchAndSaveSeasonData(configId);

    return result;
  },
  {
    connection: redisConnection,
    concurrency: 1, // Processa um job por vez
  }
);

seasonWorker.on("completed", () => {
  // Job concluído
});

seasonWorker.on("failed", () => {
  // Job falhou
});

