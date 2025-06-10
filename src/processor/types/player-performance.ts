export interface PlayerPerformance {
  score: number;
  adjustment: number;
  details: {
    fragRatio: number;
    deathRatio: number;
    damageRatio: number;
  };
}
