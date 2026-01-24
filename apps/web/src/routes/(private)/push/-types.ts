export interface LegendLog {
  id: number;
  playerTag: string;
  playerName: string;
  clanTag: string;
  type: "ATTACK" | "DEFENSE";
  diff: number;
  trophiesResult: number;
  timestamp: string;
}

export interface LegendLogPlayer {
  playerTag: string;
  playerName: string;
  townHallLevel: number;
  trophies: number;
  role: string;
  logs: LegendLog[];
  totalLogs: number;
}

export interface LegendLogsResponse {
  clanName: string;
  clanTag: string;
  players: LegendLogPlayer[];
  total: number;
  limit: number;
  offset: number;
}


