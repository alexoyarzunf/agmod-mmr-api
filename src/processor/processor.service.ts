import { Injectable } from '@nestjs/common';
import { MatchDetail } from 'src/match_details/match-detail.entity';
import { AGMMRCalculator } from './core/calculator';
import { Player } from 'src/players/player.entity';

@Injectable()
export class ProcessorService {
  constructor(private readonly calculator: AGMMRCalculator) {}

  ensurePlayerRatings(players: Player[]): void {
    this.calculator.ensurePlayerRatings(players);
  }

  processMatch(
    matchDetails: MatchDetail[],
    previousMatchDetails: Record<string, MatchDetail | null>,
  ) {
    return this.calculator.processMatch(matchDetails, previousMatchDetails);
  }

  getPlayerRatings() {
    return this.calculator.playerRatings;
  }
}
