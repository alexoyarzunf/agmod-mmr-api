import { MatchDetail } from 'src/match_details/match-detail.entity';
import { PlayerPerformance } from '../types/player-performance';
import { rate, Rating } from 'openskill';
import {
  calculateIndividualPerformance,
  calculatePerformanceAdjustment,
} from './performance';
import {
  calculateInitialMMR,
  calculateInitialRating,
  calculateSkillProxy,
} from './rating';
import { determineWinner, organizeTeams } from './team';

/**
 * AGMMRCalculator is responsible for orchestrating the MMR calculation process for a match.
 * It uses helper functions from performance, rating, and team modules to:
 *  - Organize players into teams
 *  - Retrieve or initialize player ratings
 *  - Calculate individual player performance
 *  - Determine the match winner
 *  - Update player ratings and MMR based on match results and performance
 *
 * Usage:
 *   const calculator = new AGMMRCalculator();
 *   calculator.processMatch(matchDetails, previousMatchDetails);
 */
export class AGMMRCalculator {
  private playerRatings: Map<string, Rating> = new Map();

  /**
   * Processes a match, updating MMR and ratings for each player.
   * @param matchDetails - Array of player match details for the current match.
   * @param previousMatchDetails - Map of previous match details by player SteamID.
   * @returns Updated match details with new MMR and deltas.
   */
  public processMatch(
    matchDetails: MatchDetail[],
    previousMatchDetails: Record<string, MatchDetail | null>,
  ): MatchDetail[] {
    const { blueTeam, redTeam } = organizeTeams(matchDetails);

    // Get current ratings and stats for both teams
    const blueRatings = blueTeam.map((match) =>
      this.getOrCreatePlayerRating(match.player.steamID, match),
    );
    const redRatings = redTeam.map((match) =>
      this.getOrCreatePlayerRating(match.player.steamID, match),
    );

    // Determine match winner
    const winner = determineWinner(blueTeam, redTeam);

    // Calculate individual performance for each player
    const playerPerformances = new Map<string, PlayerPerformance>();
    matchDetails.forEach((player) => {
      const performance = calculateIndividualPerformance(player, matchDetails);
      playerPerformances.set(player.player.steamID, performance);
    });

    // Calculate new ratings using OpenSkill
    const ratings =
      winner === 'blue'
        ? rate([blueRatings, redRatings], { rank: [1, 2] })
        : rate([blueRatings, redRatings], { rank: [2, 1] });

    // Update ratings and stats for all players
    [blueTeam, redTeam].forEach((team, teamIdx) => {
      team.forEach((match, idx) => {
        const steamId = match.player.steamID;
        const previousMatchDetail = previousMatchDetails[steamId];

        const isFirstMatch = previousMatchDetail === null;
        const previousMMR = previousMatchDetail
          ? previousMatchDetail.mmrAfterMatch
          : 0;
        const isWinner =
          (winner === 'blue' && teamIdx === 0) ||
          (winner === 'red' && teamIdx === 1);
        const rating = ratings[teamIdx]?.[idx];
        const performance = playerPerformances.get(match.player.steamID)!;
        const performanceAdjustment = calculatePerformanceAdjustment(
          performance,
          isWinner,
        );
        performance.adjustment = performanceAdjustment;

        let mmrAfterMatch: number;
        let mmrDelta: number;

        if (isFirstMatch) {
          mmrAfterMatch = calculateInitialMMR(
            match,
            matchDetails,
            rating,
            performance,
          );
          mmrDelta = mmrAfterMatch;
        } else {
          mmrAfterMatch = Math.max(
            0,
            Math.round(previousMMR + performanceAdjustment),
          );
          mmrDelta = mmrAfterMatch - previousMMR;
        }

        match.mmrAfterMatch = mmrAfterMatch;
        match.mmrDelta = mmrDelta;
      });
    });

    return matchDetails;
  }

  /**
   * Retrieves the player's rating or creates an initial one if not present.
   * @param steamId - Player's SteamID.
   * @param matchDetail - Player's match detail.
   * @returns Player's rating.
   */
  private getOrCreatePlayerRating(
    steamID: string,
    matchDetail: MatchDetail,
  ): Rating {
    if (!this.playerRatings.has(steamID)) {
      const skillProxy = calculateSkillProxy(matchDetail);
      const initialRating = calculateInitialRating(skillProxy);
      this.playerRatings.set(steamID, initialRating);
    }
    return this.playerRatings.get(steamID)!;
  }
}
