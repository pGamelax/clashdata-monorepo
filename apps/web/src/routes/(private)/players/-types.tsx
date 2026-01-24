export interface Achievement {
  name: string;
  stars: number;
  value: number;
  target: number;
  info: string;
  id: number;
}

export interface Equipment {
  name: string;
  level: number;
  maxLevel: number;
  village: string;
}

export interface Hero {
  name: string;
  level: number;
  maxLevel: number;
  village: string;
  equipment?: Equipment[];
}

export interface Troop {
  name: string;
  level: number;
  maxLevel: number;
  village: string;
  iconUrls?: {
    small?: string;
    medium?: string;
    tiny?: string;
  };
}

export interface PlayerLabel {
  id: number;
  name: string;
  iconUrls: {
    small: string;
    medium: string;
  };
}

export interface PlayerInfo {
  name: string;
  tag: string;
  townHallLevel: number;
  expLevel: number;
  trophies: number;
  bestTrophies: number;
  warStars: number;
  role: string;
  builderHallLevel?: number;
  builderBaseTrophies?: number;
  clanCapitalContributions: number;
  leagueTier?: {
    iconUrls: {
      large: string;
      medium: string;
      small: string;
    };
  };
  clan?: {
    tag: string;
    name: string;
    badgeUrls: {
      small: string;
    };
  };
  labels: PlayerLabel[];
  heroes: Hero[];
  troops?: Troop[];
  achievements: Achievement[];
}

interface RawAttack {
  stars: number;
  destructionPercentage: number;
}

export interface RawWarItem {
  war_data: {
    endTime: string;
    type: string;
    clan: { name?: string; tag?: string; stars: number };
    opponent: { name: string; tag: string; stars: number };
  };
  attacks?: RawAttack[];
}

export interface WarHistoryProps {
  items: RawWarItem[];
}

export interface PlayerViewProps {
  playerInfo: PlayerInfo;
  warHistory: WarHistoryProps;
}

export interface RawData {
  items: RawWarItem[];
}

export interface WarHistorySectionProps {
  rawData: RawData;
  playerClanTag?: string;
}