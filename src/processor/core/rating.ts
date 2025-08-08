import { MatchDetail } from 'src/match_details/match-detail.entity';
import { rating, Rating } from 'openskill';
import { PlayerPerformance } from '../types/player-performance';

/**
 * Rating System Module
 *
 * This module handles the initialization and calculation of player ratings and MMR.
 * It provides utilities for:
 * - Analyzing new player skill from their first match
 * - Creating appropriate initial OpenSkill ratings
 * - Calculating placement MMR for new players
 *
 * The system tries to place new players at appropriate skill levels quickly
 * rather than forcing everyone to start from the bottom.
 */

/**
 * Analyzes a player's first match performance to estimate their skill level
 *
 * This function creates a "skill proxy" - a rough estimate of player ability
 * based on their debut match statistics. This helps place new players at
 * appropriate skill levels instead of always starting them at the bottom.
 *
 * The skill proxy considers:
 * - Kill/Death ratio efficiency
 * - Damage dealt vs damage taken ratio
 *
 * @param matchDetail - The player's first match statistics
 * @returns Skill proxy value (0-2 range, where 1.0 = average skill)
 */
export function calculateSkillProxy(matchDetail: MatchDetail): number {
  // Analyze kill efficiency - how well the player traded kills for deaths
  const kd =
    matchDetail.deaths > 0
      ? matchDetail.frags / matchDetail.deaths
      : matchDetail.frags; // Handle perfect K/D (no deaths)

  // Normalize K/D around 1.5 as "average good" performance
  // K/D of 1.5 = skill score of 1.0, higher K/D = higher score
  const kdScore = Math.max(0, Math.min(2, kd / 1.5));

  // Analyze damage efficiency - how much damage dealt vs received
  const damageRatio =
    matchDetail.damageTaken > 0
      ? matchDetail.damageDealt / matchDetail.damageTaken
      : matchDetail.damageDealt / 1000; // Fallback for players who took no damage

  // Normalize damage ratio around 1.2 as "good" efficiency
  // Ratio of 1.2 = skill score of 1.0 (dealing 20% more damage than receiving)
  const damageScore = Math.max(0, Math.min(2, damageRatio / 1.2));

  // Combine metrics with weighted average
  // K/D gets more weight (60%) as it's more directly related to winning
  const skillProxy = kdScore * 0.6 + damageScore * 0.4;

  return Number(skillProxy.toFixed(2));
}

/**
 * Creates an initial OpenSkill rating for a new player based on their skill proxy
 *
 * Instead of starting all players at the default rating, this function adjusts
 * the initial rating based on observed skill in their first match. This helps
 * reduce the number of unbalanced matches during the "placement" period.
 *
 * @param skillProxy - Estimated skill level from first match (0-2 range)
 * @returns OpenSkill Rating object with appropriate mu and sigma values
 */
export function calculateInitialRating(skillProxy: number): Rating {
  // OpenSkill default rating is approximately 25 mu (skill estimate)
  const baseRating = 25;

  // Adjust initial rating based on skill proxy
  // skillProxy: 0-2 range, where 1.0 = average
  // Adjustment: -5 to +5 points from base rating
  const adjustment = (skillProxy - 1) * 5;

  // Calculate initial mu (skill estimate) with bounds
  // Range: 15-35 (prevents extreme starting ratings)
  const initialMu = Math.max(15, Math.min(35, baseRating + adjustment));

  // Use standard OpenSkill uncertainty for new players
  // Higher sigma means the system is less confident about the rating
  const initialSigma = 8.333; // OpenSkill default uncertainty

  return rating({ mu: initialMu, sigma: initialSigma });
}

/**
 * Calculates the initial MMR for a player's first match (placement match)
 *
 * This function determines where a new player should start in the MMR ladder
 * based on multiple factors:
 * - Their OpenSkill rating (skill estimate)
 * - Their performance in the placement match
 * - Rating uncertainty (less certain = lower starting MMR)
 *
 * The goal is to place new players at appropriate skill levels quickly
 * while being conservative to avoid overrating beginners.
 *
 * @param playerRating - Player's calculated OpenSkill rating
 * @param playerPerformance - Player's performance metrics
 * @returns Initial MMR value (0 or higher)
 */
export function calculateInitialMMR(
  playerRating: Rating,
  playerPerformance: PlayerPerformance,
): number {
  // Base MMR for new players - middle of the ladder
  // This represents "average" skill level in the player base
  const baseMMR = 1000;

  // Convert OpenSkill rating to MMR adjustment
  // mu = 25 (default) results in no adjustment
  // Each point above/below default = ±40 MMR adjustment
  const ratingAdjustment = (playerRating.mu - 25) * 40;

  // Performance bonus/penalty based on placement match results
  // Exceptional performance can add up to 200 MMR to starting rating
  // Poor performance can subtract up to 200 MMR
  const performanceBonus = (playerPerformance.score - 1.0) * 200;

  // Uncertainty penalty - less certain ratings start lower
  // Higher sigma (uncertainty) = lower initial MMR
  // This prevents overconfident placement of potentially weaker players
  const uncertaintyPenalty = (playerRating.sigma - 8.333) * 20;

  // Combine all factors to get initial MMR
  const initialMMR =
    baseMMR + ratingAdjustment + performanceBonus - uncertaintyPenalty;

  // Ensure MMR is never negative
  return Math.max(0, Math.round(initialMMR));
}
