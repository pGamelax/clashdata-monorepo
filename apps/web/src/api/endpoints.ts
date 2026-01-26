/**
 * Constantes de endpoints da API
 * Centraliza todas as URLs dos endpoints para facilitar manutenção
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

export const endpoints = {
  // Auth
  auth: {
    getSession: `${API_BASE_URL}/auth/get-session`,
  },

  // Clans
  clans: {
    getClans: `${API_BASE_URL}/clans/get-clans`,
    getClanInfo: (clanTag: string) =>
      `${API_BASE_URL}/clans/clan-info?clanTag=${encodeURIComponent(clanTag)}`,
    create: `${API_BASE_URL}/clans/create`,
  },

  // Dashboard
  dashboard: {
    getData: (clanTag: string, limit?: number) => {
      const params = new URLSearchParams({ clanTag });
      if (limit) params.append("limit", limit.toString());
      return `${API_BASE_URL}/dashboard/data?${params.toString()}`;
    },
  },

  // Players
  players: {
    getInfo: (playerTag: string) =>
      `${API_BASE_URL}/players/info?playerTag=${encodeURIComponent(playerTag)}`,
    getWarHistory: (playerTag: string) =>
      `${API_BASE_URL}/players/war-history?playerTag=${encodeURIComponent(playerTag)}`,
  },

  // Push / Legend Logs
  legendLogs: {
    getPlayerLogs: (playerTag: string) =>
      `${API_BASE_URL}/legend-logs/player?playerTag=${encodeURIComponent(playerTag)}`,
    getClanLogs: (clanTag: string) =>
      `${API_BASE_URL}/legend-logs/clan?clanTag=${encodeURIComponent(clanTag)}`,
    getClanRanking: (clanTag: string) =>
      `${API_BASE_URL}/legend-logs/clan-ranking?clanTag=${encodeURIComponent(clanTag)}`,
  },

  // Admin
  admin: {
    getAllClans: `${API_BASE_URL}/admin/clans`,
    getAllUsers: `${API_BASE_URL}/admin/users`,
    createClan: `${API_BASE_URL}/admin/create-clan`,
    addClanToUser: `${API_BASE_URL}/admin/add-clan-to-user`,
    revokeClanAccess: `${API_BASE_URL}/admin/revoke-clan-access`,
  },

  // Seasons
  seasons: {
    getAllConfigs: `${API_BASE_URL}/seasons/all`,
    setSeasonEndDate: `${API_BASE_URL}/seasons/set-season-end-date`,
    getSeasonsByClan: (clanTag: string) =>
      `${API_BASE_URL}/seasons/by-clan/${encodeURIComponent(clanTag)}`,
    getLogsBySeason: (seasonId: string, clanTag: string) => {
      const params = new URLSearchParams({ clanTag });
      return `${API_BASE_URL}/seasons/${encodeURIComponent(seasonId)}/logs?${params.toString()}`;
    },
    fetchSeasonData: `${API_BASE_URL}/seasons/fetch-season-data`,
  },
} as const;

