import { MatchDetail } from 'src/match_details/match-detail.entity';

/**
 * Team Management Module
 *
 * This module provides utilities for organizing players into teams and
 * determining match outcomes. It handles the basic team-based logic
 * that the MMR system relies on for calculating rating changes.
 */

/**
 * Organizes match details into blue and red teams.
 * @param matchDetails - All match details for the match.
 * @returns Object with blueTeam and redTeam arrays.
 */
export function organizeTeams(matchDetails: MatchDetail[]): {
  blueTeam: MatchDetail[];
  redTeam: MatchDetail[];
} {
  const blueTeam = matchDetails.filter((player) => player.model === 'blue');
  const redTeam = matchDetails.filter((player) => player.model === 'red');
  return { blueTeam, redTeam };
}

/**
 * Determines the winner of the match based on total frags.
 * @param blueTeam - Array of blue team match details.
 * @param redTeam - Array of red team match details.
 * @returns 'blue' if blue team wins, 'red' otherwise.
 */
export function determineWinner(
  blueTeam: MatchDetail[],
  redTeam: MatchDetail[],
): 'blue' | 'red' {
  const blueFrags = blueTeam.reduce((sum, player) => sum + player.frags, 0);
  const redFrags = redTeam.reduce((sum, player) => sum + player.frags, 0);

  return blueFrags > redFrags ? 'blue' : 'red';
}
