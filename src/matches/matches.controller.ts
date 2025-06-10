import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { Match } from './match.entity';
import {
  CreateMatchDto,
  MatchExtendedResponseDto,
} from './dto/create-match.dto';

@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get()
  async getAllMatches(): Promise<Match[]> {
    return await this.matchesService.getAllMatches();
  }

  @Get(':matchId')
  async getMatchById(
    @Param('matchId') matchId: number,
  ): Promise<MatchExtendedResponseDto | undefined> {
    return await this.matchesService.getMatchById(matchId);
  }

  @Post()
  async createMatch(@Body() createMatchDto: CreateMatchDto): Promise<Match> {
    return await this.matchesService.createMatch(createMatchDto);
  }
}
