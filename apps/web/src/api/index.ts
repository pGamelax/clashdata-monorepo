/**
 * Exportações centralizadas da API
 * Facilita imports em todo o projeto
 */

// Client
export { apiFetch, ApiError, normalizeTag } from "./client";
export { endpoints } from "./endpoints";

// Types
export * from "./types";

// Queries
export * from "./queries/auth";
export * from "./queries/clans";
export * from "./queries/dashboard";
export * from "./queries/players";
export * from "./queries/legend-logs";
export * from "./queries/admin";
export * from "./queries/seasons";

