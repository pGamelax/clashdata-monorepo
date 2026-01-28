import axios, { AxiosInstance } from "axios";
import { env } from "@/env";

export const apiClient: AxiosInstance = axios.create({
  baseURL: "https://api.clashofclans.com/v1",
  headers: {
    Authorization: `Bearer ${env.TOKEN_COC}`,
  },
  timeout: 30000, 
});

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {

    if (error.code === "ECONNREFUSED" || error.code === "ETIMEDOUT") {
      throw error;
    }
    

    if (error.response?.status === 429) {
      throw error;
    }
    
    throw error;
  }
);

