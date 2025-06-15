import { InjectRepository } from '@nestjs/typeorm';
import { Match } from './match.entity';
import { Repository } from 'typeorm';
import {
  CreateMatchDto,
  MatchExtendedResponseDto,
} from './dto/create-match.dto';
import { MatchDetail } from 'src/match_details/match-detail.entity';

export class MatchesService {
  constructor(
    @InjectRepository(Match)
    private readonly matchesRepository: Repository<Match>,
    @InjectRepository(MatchDetail)
    private readonly matchDetailRepository: Repository<MatchDetail>,
  ) {}

  async getAllMatches(): Promise<Match[]> {
    return await this.matchesRepository.find();
  }

  async getMatchById(
    matchId: number,
  ): Promise<MatchExtendedResponseDto | undefined> {
    const match = await this.matchesRepository.findOne({
      where: { id: matchId },
      relations: ['matchDetails', 'matchDetails.player'],
    });

    if (!match) {
      return undefined;
    }

    const matchDetails = match.matchDetails.map((detail) => ({
      playerId: detail.player.id,
      playerSteamName: detail.player.steamName,
      playerSteamID: detail.player.steamID,
      playerAvatarUrl: detail.player.avatarURL,
      frags: detail.frags,
      deaths: detail.deaths,
      averagePing: detail.averagePing,
      damageDealt: detail.damageDealt,
      damageTaken: detail.damageTaken,
      model: detail.model,
      mmrDelta: detail.mmrDelta,
    }));

    return {
      id: match.id,
      serverIp: match.serverIp,
      matchDate: match.matchDate,
      mapName: match.mapName,
      matchDetails,
    };
  }

  async createMatch(createMatchDto: CreateMatchDto): Promise<Match> {
    const match = this.matchesRepository.create(createMatchDto);
    return await this.matchesRepository.save(match);
  }
}
