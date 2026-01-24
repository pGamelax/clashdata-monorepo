import { Redis } from "ioredis";
import { env } from "@/env";

// Configuração do Redis compatível com BullMQ
export const redisConnection = new Redis({
  host: env.REDIS_HOST,
  port: parseInt(env.REDIS_PORT),
  password: env.REDIS_PASSWORD,
  maxRetriesPerRequest: null, // BullMQ requer null para blocking operations
  enableReadyCheck: true,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError: (err) => {
    const targetError = "READONLY";
    if (err.message.includes(targetError)) {
      return true;
    }
    return false;
  },
});

redisConnection.on("error", (err) => {
  console.error("❌ Redis connection error:", err.message);
});

redisConnection.on("connect", () => {
  console.log("🔄 Conectando ao Redis...");
});

redisConnection.on("ready", () => {
  console.log("✅ Redis conectado e pronto");
});

redisConnection.on("close", () => {
  console.log("⚠️ Conexão Redis fechada");
});

