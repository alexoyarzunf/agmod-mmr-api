export interface CreateMatchDetailDto {
  id: number;
  playerSteamId: string;
  matchId: number;
  frags: number;
  deaths: number;
  averagePing: number;
  mostUsedWeapon: string;
  accuracy: number;
  damageDealt: number;
  damageTaken: number;
  model: string;
}

export interface MatchDetailResponseDto {
  success: boolean;
}
