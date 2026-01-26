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
      console.log("⚠️ Configuração de temporada não encontrada");
      return;
    }

    // Se já foi processada, não agenda novamente
    if (seasonConfig.isProcessed) {
      console.log(`⚠️ Configuração ${configId} já foi processada`);
      return;
    }

    const scheduledAt = new Date(seasonConfig.scheduledAt);
    const now = new Date();

    // Se a data já passou, não agenda
    if (scheduledAt < now) {
      console.log(`⚠️ Data de execução já passou para configuração ${configId}`);
      return;
    }

    // Verifica se já existe um job agendado para esta configuração
    const existingJobs = await seasonQueue.getJobs(["delayed", "waiting"]);
    const existingJob = existingJobs.find(
      (job) => job.data.configId === seasonConfig.id
    );

    if (existingJob) {
      console.log(
        `✅ Job já agendado para configuração ${seasonConfig.id} em ${scheduledAt.toISOString()}`
      );
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

    console.log(
      `✅ Job agendado para buscar dados da configuração ${seasonConfig.id} em ${scheduledAt.toISOString()}`
    );
  } catch (error: any) {
    console.error("Erro ao agendar busca de temporada:", error.message);
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

    console.log(`✅ Scheduler inicializado: ${pendingConfigs.length} configurações pendentes`);
  } catch (error: any) {
    console.error("Erro ao inicializar scheduler de temporada:", error.message);
  }
}

/**
 * Worker para processar os jobs de busca de temporada
 */
export const seasonWorker = new Worker(
  "season-fetch",
  async (job) => {
    const { configId } = job.data;

    console.log(`🔄 Iniciando busca de dados para configuração ${configId}`);

    const seasonService = new SeasonService();
    const result = await seasonService.fetchAndSaveSeasonData(configId);

    console.log(
      `✅ Dados da configuração ${configId} salvos: ${result.totalPlayersSaved} jogadores`
    );

    return result;
  },
  {
    connection: redisConnection,
    concurrency: 1, // Processa um job por vez
  }
);

seasonWorker.on("completed", (job) => {
  console.log(`✅ Job ${job.id} concluído com sucesso`);
});

seasonWorker.on("failed", (job, err) => {
  console.error(`❌ Job ${job?.id} falhou:`, err.message);
});

