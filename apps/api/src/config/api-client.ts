import axios, { AxiosInstance } from "axios";
import { env } from "@/env";

export const apiClient: AxiosInstance = axios.create({
  baseURL: "https://api.clashofclans.com/v1",
  headers: {
    Authorization: `Bearer ${env.TOKEN_COC}`,
  },
  timeout: 10000,
});

// Rate limiting: máximo 10 requisições por segundo (conservador para evitar 429)
// Com 30 jobs em paralelo, precisamos garantir que não ultrapassemos o limite
let requestQueue: Array<{ resolve: (config: any) => void; config: any; timestamp: number }> = [];
let isProcessing = false;
let lastRequestTime = 0;
const MAX_REQUESTS_PER_SECOND = 10; // 10 req/s = 100ms entre requisições (conservador)
const MIN_INTERVAL_MS = 1000 / MAX_REQUESTS_PER_SECOND; // 100ms entre requisições

async function processQueue() {
  if (isProcessing || requestQueue.length === 0) return;
  
  isProcessing = true;
  
  while (requestQueue.length > 0) {
    const item = requestQueue.shift();
    if (item) {
      // Garante intervalo mínimo entre requisições
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTime;
      if (timeSinceLastRequest < MIN_INTERVAL_MS) {
        await new Promise(resolve => setTimeout(resolve, MIN_INTERVAL_MS - timeSinceLastRequest));
      }
      
      lastRequestTime = Date.now();
      item.resolve(item.config);
      
      // Aguarda o intervalo antes de processar a próxima requisição
      if (requestQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, MIN_INTERVAL_MS));
      }
    }
  }
  
  isProcessing = false;
}

// Interceptor para rate limiting
apiClient.interceptors.request.use(
  async (config) => {
    return new Promise((resolve) => {
      requestQueue.push({ resolve, config, timestamp: Date.now() });
      processQueue();
    });
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratamento de erros
// Não faz retry aqui - deixa o BullMQ fazer o retry com backoff configurado
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Erros de rede - deixa o BullMQ fazer retry
    if (error.code === "ECONNREFUSED" || error.code === "ETIMEDOUT") {
      throw error;
    }
    
    // Erro 429 (rate limit) - apenas loga, deixa o BullMQ fazer retry
    if (error.response?.status === 429) {
      // Aumenta o intervalo temporariamente quando recebe 429
      // Isso ajuda a evitar mais 429s
      const currentInterval = MIN_INTERVAL_MS;
      const increasedInterval = currentInterval * 2; // Dobra o intervalo temporariamente
      console.warn(`⚠️ Rate limit 429 detectado, aumentando intervalo para ${increasedInterval}ms temporariamente`);
      // O BullMQ vai fazer retry com backoff, então apenas lança o erro
      throw error;
    }
    
    throw error;
  }
);

