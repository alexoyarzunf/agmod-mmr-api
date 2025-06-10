export interface PlayerResponseDto {
  id: number;
  steamID: string;
  matchHistory: MatchHistoryResponseDto[];
  mmr: number;
}

interface MatchHistoryResponseDto {
  matchId: number;
  serverIp: string;
  matchDate: Date;
  mapName: string;
  stats: MatchStatsResponseDto;
}

interface MatchStatsResponseDto {
  frags: number;
  deaths: number;
  averagePing: number;
  damageDealt: number;
  damageTaken: number;
  model: string;
}
