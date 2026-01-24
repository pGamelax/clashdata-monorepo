import axios, { AxiosInstance } from "axios";
import { env } from "@/env";

export const apiClient: AxiosInstance = axios.create({
  baseURL: "https://api.clashofclans.com/v1",
  headers: {
    Authorization: `Bearer ${env.TOKEN_COC}`,
  },
  timeout: 10000,
});

// Rate limiting: máximo 5 requisições por segundo (muito conservador para evitar 429)
let requestQueue: Array<{ resolve: (config: any) => void; config: any; timestamp: number }> = [];
let isProcessing = false;
let lastRequestTime = 0;
const MAX_REQUESTS_PER_SECOND = 20; // Reduzido para 5 para evitar 429
const REQUEST_INTERVAL = 50 / MAX_REQUESTS_PER_SECOND; // 200ms entre requisições
const MIN_INTERVAL = 50; // Mínimo de 200ms entre requisições

async function processQueue() {
  if (isProcessing || requestQueue.length === 0) return;
  
  isProcessing = true;
  
  while (requestQueue.length > 0) {
    const item = requestQueue.shift();
    if (item) {
      // Garante intervalo mínimo entre requisições
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTime;
      if (timeSinceLastRequest < MIN_INTERVAL) {
        await new Promise(resolve => setTimeout(resolve, MIN_INTERVAL - timeSinceLastRequest));
      }
      
      lastRequestTime = Date.now();
      item.resolve(item.config);
      
      // Aguarda o intervalo antes de processar a próxima requisição
      if (requestQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, REQUEST_INTERVAL));
      }
    }
  }
  
  isProcessing = false;
}

// Interceptor para rate limiting
apiClient.interceptors.request.use(
  async (config) => {
    return new Promise((resolve) => {
      requestQueue.push({ resolve, config });
      processQueue();
    });
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratamento de erros
let rateLimitRetries = 0;
const MAX_RATE_LIMIT_RETRIES = 3;

apiClient.interceptors.response.use(
  (response) => {
    // Reset contador de retries em caso de sucesso
    rateLimitRetries = 0;
    return response;
  },
  async (error) => {
    if (error.code === "ECONNREFUSED" || error.code === "ETIMEDOUT") {
      throw error;
    }
    if (error.response?.status === 429) {
      rateLimitRetries++;
      if (rateLimitRetries <= MAX_RATE_LIMIT_RETRIES) {
        // Backoff exponencial: 10s, 20s, 40s
        const backoffDelay = Math.min(10000 * Math.pow(2, rateLimitRetries - 1), 60000);
        console.warn(`⚠️ Rate limit 429 (tentativa ${rateLimitRetries}/${MAX_RATE_LIMIT_RETRIES}), aguardando ${backoffDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
        // Não relança o erro, permite que o BullMQ faça o retry
        throw error;
      }
      console.error("❌ Rate limit persistente após múltiplas tentativas");
      throw error;
    }
    rateLimitRetries = 0;
    throw error;
  }
);

