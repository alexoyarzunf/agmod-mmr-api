import { MatchDetail } from 'src/match_details/match-detail.entity';
import { rating, Rating } from 'openskill';
import { PlayerPerformance } from '../types/player-performance';

/**
 * Rating utilities for skill proxy calculation, initial rating, and initial MMR.
 */

/**
 * Calculates a skill proxy value for a player based on their match stats.
 * @param matchDetail - The player's match detail.
 * @returns Skill proxy value (normalized).
 */
export function calculateSkillProxy(matchDetail: MatchDetail): number {
  const kd = matchDetail.frags - matchDetail.deaths;
  const damageRatio = matchDetail.damageDealt / matchDetail.damageTaken;

  // Normalize values to create a composite score
  const kdScore = Math.max(0, Math.min(kd / 50, 2)); // Normalized between 0-2
  const damageScore = Math.max(0, Math.min(damageRatio / 3, 2)); // Normalized between 0-2

  // Weighted average (more weight to K/D and damage)
  const skillProxy = kdScore * 0.5 + damageScore * 0.5;

  return skillProxy;
}

/**
 * Calculates an initial OpenSkill rating for a player based on their skill proxy.
 * @param skillProxy - The player's skill proxy value.
 * @returns Initial Rating object.
 */
export function calculateInitialRating(skillProxy: number): Rating {
  // Higher base rating to avoid negative MMRs
  const baseRating = 35; // Increased from 25 to 35
  // Adjustment based on skill proxy: +/-8 points
  const adjustment = (skillProxy - 1) * 8; // skillProxy between 0-2, adjustment between -8 and +8

  const initialMu = Math.max(25, Math.min(50, baseRating + adjustment));

  // Lower sigma for new players for higher initial MMRs
  const initialSigma = 6.0; // Reduced from 8.33 to 6.0

  return rating({ mu: initialMu, sigma: initialSigma });
}

/**
 * Calculates the initial MMR for a player in their first match.
 * @param matchDetail - The player's match detail.
 * @param matchDetails - All match details for the match.
 * @param rating - The player's OpenSkill rating.
 * @param playerPerformance - The player's performance object.
 * @returns Initial MMR value.
 */
export function calculateInitialMMR(
  matchDetail: MatchDetail,
  matchDetails: MatchDetail[],
  rating: Rating,
  playerPerformance: PlayerPerformance,
): number {
  // Scaled MMR base value
  const baseMMR = 700; // System midpoint

  const kd = matchDetail.frags - matchDetail.deaths;
  const avgDamage =
    matchDetails.reduce((sum, p) => sum + p.damageDealt, 0) /
    matchDetails.length;

  // Calculate boost based on metrics (max +/-300 points)
  const kdBoost = Math.max(-150, Math.min(150, (kd - 1.0) * 100)); // K/D above 1.0 gives boost
  const damageBoost = Math.max(-75, Math.min(75, (avgDamage - 2500) / 50)); // Damage above 2500 gives boost

  const performanceBoost = kdBoost + damageBoost;

  // Convert OpenSkill rating to MMR scale
  const skillFactor = (rating.mu - 25) * 20; // Each mu point ≈ 20 MMR
  const uncertaintyPenalty = rating.sigma * 10; // Penalty for uncertainty

  const scaledMMR =
    baseMMR +
    skillFactor +
    performanceBoost -
    uncertaintyPenalty +
    playerPerformance.adjustment;

  return Math.max(0, Math.round(scaledMMR));
}
