import { MatchDetail } from 'src/match_details/match-detail.entity';
import { PlayerPerformance } from '../types/player-performance';

/**
 * Performance Calculation Module
 *
 * This module handles individual player performance analysis within matches.
 * It calculates how well a player performed relative to the match average
 * and converts this into MMR adjustments that reward exceptional play.
 */

/**
 * Calculates a comprehensive performance score for a player relative to match averages
 *
 * The performance system evaluates players across multiple dimensions:
 * - K/D Ratio: Primary indicator of combat effectiveness
 * - Frags: Raw kill count relative to other players
 * - Damage: Total damage output efficiency
 *
 * All metrics are normalized against match averages to ensure fairness
 * across different match intensities and player counts.
 *
 * @param matchDetail - Individual player's match statistics
 * @param matchDetails - All players' match data for normalization
 * @returns PlayerPerformance object with score and detailed breakdowns
 */
export function calculateIndividualPerformance(
  matchDetail: MatchDetail,
  matchDetails: MatchDetail[],
): PlayerPerformance {
  // Calculate match-wide averages for normalization
  // This ensures performance is relative to the specific match context
  const avgFrags =
    matchDetails.reduce((sum, p) => sum + p.frags, 0) / matchDetails.length;
  const avgDeaths =
    matchDetails.reduce((sum, p) => sum + p.deaths, 0) / matchDetails.length;
  const avgDamage =
    matchDetails.reduce((sum, p) => sum + p.damageDealt, 0) /
    matchDetails.length;

  // Calculate player's K/D ratio with protection against division by zero
  // Cap at 5.0 to prevent extreme outliers from skewing the system
  const playerKD =
    matchDetail.deaths > 0
      ? matchDetail.frags / matchDetail.deaths
      : Math.min(matchDetail.frags, 5); // Perfect K/D capped at 5 to prevent exploitation

  // Calculate match average K/D for comparison baseline
  const avgKD = avgDeaths > 0 ? avgFrags / avgDeaths : avgFrags;

  // Convert raw stats to performance ratios (1.0 = average performance)
  // Each ratio is capped to prevent extreme values from dominating

  // K/D Performance: How player's kill efficiency compares to match average
  const kdRatio = avgKD > 0 ? Math.min(3, playerKD / avgKD) : 1; // Cap at 3x average

  // Frag Performance: How player's kill count compares to others
  const fragRatio =
    avgFrags > 0 ? Math.min(2.5, matchDetail.frags / avgFrags) : 1;

  // Damage Performance: How player's damage output compares to others
  const damageRatio =
    avgDamage > 0 ? Math.min(2.5, matchDetail.damageDealt / avgDamage) : 1;

  // Calculate weighted composite performance score
  // K/D ratio gets highest weight as it's the most important combat metric
  const performanceScore =
    kdRatio * 0.5 + // 50% weight - kill efficiency is most important
    fragRatio * 0.3 + // 30% weight - raw killing power
    damageRatio * 0.2; // 20% weight - damage contribution

  return {
    // Clamp final score to reasonable bounds (0.2 to 2.5)
    // 0.2 = very poor performance, 1.0 = average, 2.5 = exceptional
    score: Math.max(0.2, Math.min(2.5, performanceScore)),
    adjustment: 0, // Will be populated later with MMR adjustment
    details: {
      fragRatio: Number(fragRatio.toFixed(2)),
      deathRatio: Number(kdRatio.toFixed(2)), // Note: deathRatio actually stores K/D ratio
      damageRatio: Number(damageRatio.toFixed(2)),
    },
  };
}

/**
 * Converts player performance scores into MMR point adjustments
 *
 * This function translates performance metrics into concrete MMR changes:
 * - Above-average performance = bonus MMR (for wins) or reduced loss (for defeats)
 * - Below-average performance = reduced MMR gain (for wins) or increased loss (for defeats)
 *
 * The system scales based on team size - smaller teams have higher individual impact.
 *
 * @param playerPerformance - Player's calculated performance metrics
 * @param isWinner - Whether the player's team won the match
 * @param teamSize - Number of players on the team (affects individual impact)
 * @returns MMR adjustment points (positive = bonus, negative = penalty)
 */
export function calculatePerformanceAdjustment(
  playerPerformance: PlayerPerformance,
  isWinner: boolean,
  teamSize: number,
): number {
  // Base MMR changes scale inversely with team size
  // Smaller teams = higher individual impact = larger base changes
  // 1v1: 20 points, 2v2: 18 points, 3v3: 16 points, 5v5: 12 points
  const baseWinGain = Math.max(8, 22 - teamSize * 2);
  const baseLossAmount = Math.max(8, 22 - teamSize * 2);

  // Maximum performance multiplier - controls how much individual play matters
  // Reduced value (0.35) ensures team results still matter more than individual stats
  const maxPerformanceMultiplier = 0.35;

  // Calculate how much player deviated from average performance
  // Positive = above average, Negative = below average
  const performanceDeviation = playerPerformance.score - 1.0;

  // Clamp deviation to prevent extreme adjustments
  // ±0.5 represents the maximum deviation we'll consider for MMR purposes
  const clampedDeviation = Math.max(-0.5, Math.min(0.5, performanceDeviation));

  // Convert performance deviation to multiplier
  const performanceMultiplier = clampedDeviation * maxPerformanceMultiplier;

  if (isWinner) {
    // Winners: Base MMR gain modified by performance
    // Good performance = bonus MMR, poor performance = reduced gain
    const adjustment = baseWinGain * (1 + performanceMultiplier);
    return Math.max(4, Math.round(adjustment)); // Minimum 4 MMR for any win
  } else {
    // Losers: Base MMR loss modified by performance
    // Good performance = reduced loss, poor performance = increased loss
    const adjustment = -baseLossAmount * (1 - performanceMultiplier);
    return Math.min(-4, Math.round(adjustment)); // Minimum 4 MMR loss for any defeat
  }
}
