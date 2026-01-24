import { Queue } from "bullmq";
import { redisConnection } from "@/config/redis";

export const legendPlayerQueue = new Queue("legend-player", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 5, // Aumentado para lidar melhor com rate limits
    backoff: {
      type: "exponential",
      delay: 10000, // Começa com 10s, depois 20s, 40s, 80s, 160s
    },
    removeOnComplete: { count: 10 }, // Reduzido para limpar mais rápido
    removeOnFail: { count: 50 }, // Reduzido para limpar mais rápido
  },
});

