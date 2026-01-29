/**
 * Tipagens TypeScript para todas as respostas da API
 * Baseadas nos modelos Zod do backend
 */

// ==================== Auth Types ====================
export interface Session {
  user: {
    id: string;
    name: string | null;
    email: string;
    emailVerified: boolean;
    image: string | null;
    role?: "admin" | "user" | "moderator";
  };
  session: {
    id: string;
    expiresAt: string;
    token: string;
    ipAddress: string | null;
    userAgent: string | null;
    userId: string;
  };
}

// ==================== Clan Types ====================
export interface Clan {
  id: string;
  name: string;
  tag: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClanInfo {
  name: string;
  tag: string;
  description: string;
  badgeUrls: {
    small: string;
    medium: string;
    large: string;
  };
  totalWars: number;
  warWins: number;
  warTies: number;
  warLosses: number;
}

export interface CreateClanBody {
  clanTag: string;
  userEmail: string;
}

export interface CreateClanResponse {
  id: string;
  name: string;
  tag: string;
  createdAt: string;
  updatedAt: string;
}

// ==================== Dashboard Types ====================
export interface DashboardPlayer {
  tag: string;
  name: string;
  townhallLevel: number;
  allAttacks: Array<{
    date: string;
    stars: number;
    destruction: number;
    opponent: string;
  }>;
  allDefenses: Array<{
    date: string;
    stars: number;
    destruction: number;
  }>;
}

export interface DashboardData {
  players: DashboardPlayer[];
  cwlPlayers: DashboardPlayer[];
}

// ==================== Player Types ====================
export interface PlayerInfo {
  tag: string;
  name: string;
  townHallLevel: number;
  expLevel: number;
  trophies: number;
  bestTrophies: number;
  warStars: number;
  attackWins: number;
  defenseWins: number;
  builderHallLevel?: number;
  builderBaseTrophies?: number;
  versusTrophies?: number;
  role?: string;
  warPreference?: string;
  donations: number;
  donationsReceived: number;
  clan?: {
    tag: string;
    name: string;
    clanLevel: number;
    badgeUrls: {
      small: string;
      medium: string;
      large: string;
    };
  };
  leagueTier?: {
    id: number;
    name: string;
    iconUrls: {
      small: string;
      large: string;
    };
  };
  achievements: unknown[];
  versusBattleWinCount?: number;
  labels: Array<{
    id: number;
    name: string;
    iconUrls: {
      small: string;
      medium: string;
    };
  }>;
  troops: unknown[];
  heroes: unknown[];
  spells: unknown[];
}

export interface WarHistoryAttack {
  attackerTag: string;
  defenderTag: string;
  stars: number;
  destructionPercentage: number;
  duration: number;
  order: number;
  defender?: {
    name: string;
    townhallLevel: number;
  };
}

export interface WarHistoryItem {
  member_data: {
    tag: string;
    name: string;
    townhallLevel: number;
    mapPosition: number;
    opponentAttacks?: number;
  };
  war_data?: {
    state: string;
    teamSize: number;
    clan: {
      tag: string;
      name: string;
    };
    [key: string]: unknown;
  };
  attacks?: WarHistoryAttack[];
  defenses?: unknown[];
}

export interface WarHistory {
  items: WarHistoryItem[];
}

// ==================== Legend Logs Types ====================
export interface LegendLog {
  id: number;
  playerTag: string;
  playerName: string;
  clanTag: string | null;
  type: "ATTACK" | "DEFENSE";
  diff: number;
  trophiesResult: number;
  timestamp: string;
}

export interface PlayerLogsResponse {
  logs: LegendLog[];
  total: number;
  limit: number;
  offset: number;
}

export interface PlayerDayLog {
  playerTag: string;
  playerName: string;
  gain: number;
  gainCount: number;
  loss: number;
  lossCount: number;
  final: number;
  logs: Array<{
    id: number;
    type: "ATTACK" | "DEFENSE";
    diff: number;
    trophiesResult: number;
    timestamp: string;
  }>;
}

export interface ClanLogsResponse {
  clanName: string;
  clanTag: string;
  dates: string[]; // Datas ordenadas (mais recente primeiro)
  datesData: Record<string, PlayerDayLog[]>; // Dados agrupados por data
  total: number;
  limit: number;
  offset: number;
}

export interface ClanRankingPlayer {
  rank: number;
  playerTag: string;
  playerName: string;
  townHallLevel: number;
  trophies: number;
  bestTrophies: number;
  expLevel: number;
  role: string;
  leagueTier: {
    id: number;
    name: string;
    iconUrls?: {
      small?: string;
      large?: string;
    };
  } | null;
}

export interface ClanRankingResponse {
  clanName: string;
  clanTag: string;
  players: ClanRankingPlayer[];
}

// ==================== Admin Types ====================
export interface AdminClan {
  name: string;
  tag: string;
  userCount?: number;
  plan?: {
    isActive: boolean;
    activatedAt: string | null;
    activatedBy: string | null;
  } | null;
}

export interface AdminUserClan {
  tag: string;
  name: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user" | "moderator";
  clans: AdminUserClan[];
}

export interface CreateClanAdminBody {
  clanTag: string;
}

export interface CreateClanAdminResponse {
  message: string;
  clan: {
    id: string;
    name: string;
    tag: string;
  };
}

export interface AddClanToUserBody {
  userEmail: string;
  clanTag: string;
}

export interface AddClanToUserResponse {
  message: string;
  clan: {
    id: string;
    name: string;
    tag: string;
  };
}

export interface RevokeClanAccessBody {
  userId: string;
  clanTag: string;
}

export interface RevokeClanAccessResponse {
  message: string;
}

// ==================== Error Types ====================
export interface ApiErrorResponse {
  message: string;
}

