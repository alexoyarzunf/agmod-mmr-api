import { MatchDetail } from 'src/match_details/match-detail.entity';
import { PlayerPerformance } from '../types/player-performance';

/**
 * Performance utilities for calculating individual player performance and
 * performance-based MMR adjustments.
 */

/**
 * Calculates a player's performance score based on their stats compared to match averages.
 * @param matchDetail - The player's match detail.
 * @param matchDetails - All match details for the match.
 * @returns PlayerPerformance object with score and breakdown.
 */
export function calculateIndividualPerformance(
  matchDetail: MatchDetail,
  matchDetails: MatchDetail[],
): PlayerPerformance {
  // Calculate average metrics for all players in the match
  const avgFrags =
    matchDetails.reduce((sum, p) => sum + p.frags, 0) / matchDetails.length;
  const avgDeaths =
    matchDetails.reduce((sum, p) => sum + p.deaths, 0) / matchDetails.length;
  const avgDamage =
    matchDetails.reduce((sum, p) => sum + p.damageDealt, 0) /
    matchDetails.length;

  // Calculate player ratios vs average
  const fragRatio = matchDetail.frags / Math.max(avgFrags, 1);
  const deathRatio = avgDeaths / Math.max(matchDetail.deaths, 1); // Inverted: fewer deaths = better
  const damageRatio = matchDetail.damageDealt / Math.max(avgDamage, 1);

  // Composite score (1.0 = average, >1.0 = above average, <1.0 = below average)
  const performanceScore =
    fragRatio * 0.4 + // 40% weight to frags
    deathRatio * 0.3 + // 30% weight to survivability
    damageRatio * 0.3; // 30% weight to damage

  return {
    score: performanceScore,
    adjustment: 0,
    details: {
      fragRatio: fragRatio,
      deathRatio: deathRatio,
      damageRatio: damageRatio,
    },
  };
}

/**
 * Calculates the MMR adjustment for a player based on their performance and match outcome.
 * @param playerPerformance - The player's performance object.
 * @param isWinner - Whether the player's team won.
 * @returns MMR adjustment value.
 */
export function calculatePerformanceAdjustment(
  playerPerformance: PlayerPerformance,
  isWinner: boolean,
): number {
  // Adjustment range: -30 to +30 MMR based on performance
  const baseAdjustment = (playerPerformance.score - 1.0) * 30; // -30 to +30 for performance 0.0-2.0

  // If your team won but you played poorly, reduce gain.
  // If your team lost but you played well, reduce loss.
  let adjustment = baseAdjustment;

  if (isWinner) {
    // On win: bad performance reduces gain, good performance increases it
    adjustment = Math.max(-15, Math.min(25, baseAdjustment));
  } else {
    // On loss: good performance reduces loss, bad performance increases it
    adjustment = Math.max(-25, Math.min(15, baseAdjustment));
  }

  return adjustment;
}
