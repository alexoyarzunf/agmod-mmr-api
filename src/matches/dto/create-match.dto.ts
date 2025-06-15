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
  playerSteamName: string;
  playerAvatarUrl: string;
  playerSteamID: string;
  frags: number;
  deaths: number;
  damageDealt: number;
  damageTaken: number;
  model: string;
  mmrDelta: number;
}
