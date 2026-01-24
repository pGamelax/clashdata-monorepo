import { ApiError } from "./api";
import { redirect } from "@tanstack/react-router";

/**
 * Tipos de erro relacionados a clãs
 */
export enum ClanErrorType {
  /** Clã não encontrado ou não registrado no sistema */
  NOT_FOUND = "NOT_FOUND",
  /** Clã não pertence ao usuário logado */
  NOT_OWNED = "NOT_OWNED",
  /** Clã não possui assinatura ativa (para implementação futura) */
  NO_SUBSCRIPTION = "NO_SUBSCRIPTION",
  /** Tag inválida */
  INVALID_TAG = "INVALID_TAG",
  /** Não autorizado - sessão expirada */
  UNAUTHORIZED = "UNAUTHORIZED",
  /** Pagamento necessário (para implementação futura) */
  PAYMENT_REQUIRED = "PAYMENT_REQUIRED",
}

/**
 * Informações sobre o erro de clã
 */
export interface ClanErrorInfo {
  type: ClanErrorType;
  message: string;
  redirectTo: string;
  redirectSearch?: Record<string, unknown>;
}

/**
 * Analisa um erro da API e retorna informações sobre o erro de clã
 * Preparado para implementação futura de assinaturas
 */
export function handleClanError(
  error: unknown,
  clanTag?: string,
): ClanErrorInfo {
  if (!(error instanceof ApiError)) {
    throw error;
  }

  const { status, message } = error;

  // 401: Não autorizado - sessão expirada
  if (status === 401) {
    return {
      type: ClanErrorType.UNAUTHORIZED,
      message: "Sua sessão expirou. Faça login novamente.",
      redirectTo: "/sign-in",
      redirectSearch: {
        error: "Sua sessão expirou. Faça login novamente.",
      },
    };
  }

  // 402: Pagamento necessário (para implementação futura de assinaturas)
  if (status === 402) {
    return {
      type: ClanErrorType.PAYMENT_REQUIRED,
      message:
        message ||
        "Este clã requer uma assinatura ativa para acessar este recurso.",
      redirectTo: "/clans",
      redirectSearch: {
        error:
          message ||
          "Este clã requer uma assinatura ativa. Entre em contato para mais informações.",
        clanTag: clanTag?.replace(/#|%23/g, "").trim(),
      },
    };
  }

  // 403: Clã não pertence ao usuário OU não possui assinatura ativa
  if (status === 403) {
    // Verifica se a mensagem indica problema de assinatura
    const isSubscriptionError =
      message?.toLowerCase().includes("assinatura") ||
      message?.toLowerCase().includes("subscription") ||
      message?.toLowerCase().includes("assinatura expirada") ||
      message?.toLowerCase().includes("subscription expired");

    if (isSubscriptionError) {
      return {
        type: ClanErrorType.NO_SUBSCRIPTION,
        message:
          message ||
          "Este clã não possui uma assinatura ativa. Renove sua assinatura para continuar acessando.",
        redirectTo: "/clans",
        redirectSearch: {
          error:
            message ||
            "Este clã não possui uma assinatura ativa. Renove sua assinatura para continuar acessando.",
          clanTag: clanTag?.replace(/#|%23/g, "").trim(),
        },
      };
    }

    // Caso contrário, é um problema de propriedade
    return {
      type: ClanErrorType.NOT_OWNED,
      message:
        message ||
        "Acesso negado. Este clã não pertence ao seu usuário ou você não tem permissão para acessá-lo.",
      redirectTo: "/clans",
      redirectSearch: {
        error:
          message ||
          "Acesso negado. Este clã não pertence ao seu usuário ou você não tem permissão para acessá-lo.",
      },
    };
  }

  // 404: Clã não encontrado ou não registrado
  if (status === 404) {
    return {
      type: ClanErrorType.NOT_FOUND,
      message:
        message ||
        "Clã não encontrado ou não registrado. Verifique a tag fornecida ou registre o clã primeiro.",
      redirectTo: "/clans",
      redirectSearch: {
        error:
          message ||
          "Clã não encontrado ou não registrado. Verifique a tag fornecida ou registre o clã primeiro.",
      },
    };
  }

  // 400: Tag inválida
  if (status === 400) {
    return {
      type: ClanErrorType.INVALID_TAG,
      message: message || "Tag inválida. Verifique o formato da tag.",
      redirectTo: "/clans",
      redirectSearch: {
        error: message || "Tag inválida. Verifique o formato da tag.",
      },
    };
  }

  // Erro desconhecido - re-lança
  throw error;
}

/**
 * Trata erros de clã e faz redirect apropriado
 * Usado nos loaders das rotas
 */
export function handleClanErrorWithRedirect(
  error: unknown,
  clanTag?: string,
): never {
  const errorInfo = handleClanError(error, clanTag);
  throw redirect({
    to: errorInfo.redirectTo as any,
    search: errorInfo.redirectSearch as any,
  });
}

