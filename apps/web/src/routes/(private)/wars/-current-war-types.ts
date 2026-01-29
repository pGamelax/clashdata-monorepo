export interface CurrentWarAttack {
  attackerTag: string;
  defenderTag: string;
  stars: number;
  destructionPercentage: number;
  order: number;
  duration: number;
}

export interface CurrentWarMember {
  tag: string;
  name: string;
  townhallLevel: number;
  mapPosition: number;
  opponentAttacks?: number;
  bestOpponentAttack?: CurrentWarAttack;
  attacks?: CurrentWarAttack[];
}

export interface CurrentWarClan {
  tag: string;
  name: string;
  badgeUrls: {
    small: string;
    large: string;
    medium: string;
  };
  clanLevel: number;
  attacks: number;
  stars: number;
  destructionPercentage: number;
  members: CurrentWarMember[];
}

export interface CurrentWar {
  state: string;
  teamSize: number;
  attacksPerMember: number;
  battleModifier: string;
  preparationStartTime: string;
  startTime: string;
  endTime: string;
  clan: CurrentWarClan;
  opponent?: CurrentWarClan;
  // A API pode retornar o oponente diretamente ou dentro de um objeto
  [key: string]: unknown;
}

export interface StarClosureInfo {
  playerTag: string;
  playerName: string;
  attackOrder: number;
  defenderTag: string;
  defenderName: string;
  timestamp: number;
}

