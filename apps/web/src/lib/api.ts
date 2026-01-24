export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public endpoint?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const apiFetch = async (
  endpoint: string,
  options?: RequestInit,
) => {
  const res = await fetch(endpoint, {
    credentials: "include",
    ...options,
  });

  // Tenta obter mensagem de erro do response se disponível
  let errorMessage = "Erro na requisição";
  try {
    if (!res.ok && res.headers.get("content-type")?.includes("application/json")) {
      const errorData = await res.json().catch(() => null);
      if (errorData?.message) {
        errorMessage = errorData.message;
      }
    }
  } catch {
    // Ignora erros ao ler o response
  }

  // Tratamento específico por status code
  if (res.status === 401) {
    throw new ApiError("Não autorizado. Faça login novamente.", 401, endpoint);
  }

  if (res.status === 403) {
    throw new ApiError(
      "Acesso negado. Este recurso não pertence ao seu usuário.",
      403,
      endpoint,
    );
  }

  if (res.status === 404) {
    throw new ApiError("Recurso não encontrado.", 404, endpoint);
  }

  if (res.status === 400) {
    throw new ApiError(
      errorMessage || "Requisição inválida. Verifique os dados fornecidos.",
      400,
      endpoint,
    );
  }

  if (!res.ok) {
    throw new ApiError(
      errorMessage || `Erro na requisição: ${res.statusText}`,
      res.status,
      endpoint,
    );
  }
  const resp = await res.json()

  return resp;
};