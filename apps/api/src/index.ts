import { Elysia } from "elysia";
import { openapi } from "@elysiajs/openapi";
import { cors } from "@elysiajs/cors";
import { z } from "zod";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ElysiaAdapter } from "@bull-board/elysia";

import { adminPlugin } from "./http/plugins/admin-auth";
import { betterAuthPlugin, OpenAPI } from "./http/plugins/better-auth";

//controllers
import { dashboard } from "./modules/dashboard";
import { clans } from "./modules/clans";
import { players } from "./modules/players";
import { push } from "./modules/push";
import { legendLogs } from "./modules/legend-logs";
import { admin } from "./modules/admin";

//workers
import "./workers/legend-player-worker";
import { startClanMembersScheduler } from "./workers/clan-members-scheduler";
import { startPlayerSnapshotScheduler, initializePlayerSnapshotQueue } from "./workers/player-snapshot-scheduler";

//queues
import { legendPlayerQueue } from "./queue/legend-player-queue";

//config
import { redisConnection } from "./config/redis";

//errors handler
import { BadRequest, Forbidden, Unauthorized, NotFound } from "./errors/Errors";
import { env } from "./env";

// Configuração do Bull Board
const serverAdapter = new ElysiaAdapter("/admin/queues");

createBullBoard({
  queues: [new BullMQAdapter(legendPlayerQueue)],
  serverAdapter,
});

const app = new Elysia()
  .use(
    cors({
      origin: (request: Request) => {
        const origin = request.headers.get("origin");
        
        // Permite requisições sem origem (Postman, curl, etc)
        if (!origin) {
          return true;
        }
        
        // Verifica se a origem está na lista de origens confiáveis
        const trustedOrigins = env.BETTER_AUTH_TRUSTED_ORIGIN;
        
        // Se for array, verifica cada origem
        if (Array.isArray(trustedOrigins)) {
          const isAllowed = trustedOrigins.some((trusted) => {
            const normalizedTrusted = trusted.trim();
            const normalizedOrigin = origin.trim();
            return normalizedOrigin === normalizedTrusted || 
                   normalizedOrigin.startsWith(normalizedTrusted);
          });
          
          if (!isAllowed) {
            console.warn(`⚠️ CORS bloqueado para origem: ${origin}. Origens permitidas:`, trustedOrigins);
          }
          
          return isAllowed;
        }
        
        // Se for string única
        const normalizedTrusted = String(trustedOrigins).trim();
        const normalizedOrigin = origin.trim();
        const isAllowed = normalizedOrigin === normalizedTrusted || normalizedOrigin.startsWith(normalizedTrusted);
        
        if (!isAllowed) {
          console.warn(`⚠️ CORS bloqueado para origem: ${origin}. Origem permitida: ${normalizedTrusted}`);
        }
        
        return isAllowed;
      },
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization", "Cookie", "X-Requested-With"],
      exposeHeaders: ["set-cookie", "Content-Type"],
    })
  )
  .use(
    openapi({
      documentation: {
        components: await OpenAPI.components,
        paths: await OpenAPI.getPaths(),
      },
    })
  )
  .error({ BadRequest, Forbidden, Unauthorized, NotFound })
  .use(betterAuthPlugin)
  .use(adminPlugin)
  .use(serverAdapter.registerPlugin())
  .use(admin)
  .use(clans)
  .use(dashboard)
  .use(players)
  .use(push)
  .use(legendLogs)
  .listen({ hostname: "0.0.0.0", port: 3333 });

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
 
redisConnection.on("ready", async () => {
  console.log("🚀 Iniciando schedulers de monitoramento de jogadores...");
  
  // Inicializa a queue com todos os jogadores do playerSnapshot
  await initializePlayerSnapshotQueue();
  
  // Inicia o scheduler que busca jogadores dos clans a cada 5 minutos
  startClanMembersScheduler();
  
  // Inicia o scheduler que monitora todos os jogadores do playerSnapshot a cada 2 minutos
  startPlayerSnapshotScheduler();
});

// Se já estiver pronto, inicia imediatamente
if (redisConnection.status === "ready") {
  (async () => {
    console.log("🚀 Iniciando schedulers de monitoramento de jogadores...");
    await initializePlayerSnapshotQueue();
    startClanMembersScheduler();
    startPlayerSnapshotScheduler();
  })();
}
