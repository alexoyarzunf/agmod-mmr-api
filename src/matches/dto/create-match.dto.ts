export interface CreateMatchDto {
  serverIp: string;
  matchDate: Date;
  mapName: string;
}

export interface MatchExtendedResponseDto {
  id: number;
  serverIp: string;
  matchDate: Date;
  mapName: string;
  matchDetails: MatchDetailsResponseDto[];
}

export interface MatchDetailsResponseDto {
  playerId: number;
  playerSteamID: string;
  frags: number;
  deaths: number;
  damageDealt: number;
  damageTaken: number;
  model: string;
}
