import { Injectable } from '@nestjs/common';
import { MatchDetail } from 'src/match_details/match-detail.entity';
import { AGMMRCalculator } from './core/calculator';

@Injectable()
export class ProcessorService {
  constructor() {}

  processMatch(
    matchDetails: MatchDetail[],
    previousMatchDetails: Record<string, MatchDetail | null>,
  ) {
    const calculator = new AGMMRCalculator();
    return calculator.processMatch(matchDetails, previousMatchDetails);
  }
}
