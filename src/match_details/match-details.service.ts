import { InjectRepository } from '@nestjs/typeorm';
import { MatchDetail } from './match-detail.entity';
import { Repository } from 'typeorm';
import {
  CreateMatchDetailDto,
  MatchDetailResponseDto,
} from './dto/create-match-detail.dto';
import { Player } from 'src/players/player.entity';
import { ProcessorService } from 'src/processor/processor.service';
import { InvalidModelError } from './exceptions/invalid-model.error';
import { InvalidModelCountError } from './exceptions/invalid-model-count.error';

export class MatchDetailsService {
  constructor(
    @InjectRepository(MatchDetail)
    private readonly matchDetailsRepository: Repository<MatchDetail>,
    @InjectRepository(Player)
    private readonly playersRepository: Repository<Player>,
    private readonly processorService: ProcessorService,
  ) {}

  private async getMatchDetail(
    matchDetailId: number,
    steamID: string,
  ): Promise<MatchDetail> {
    return await this.matchDetailsRepository.findOneOrFail({
      where: {
        id: matchDetailId,
        player: {
          steamID: steamID,
        },
      },
      relations: ['player', 'match'],
    });
  }

  private async getAllMatchDetails(): Promise<MatchDetail[]> {
    return await this.matchDetailsRepository.find({
      relations: ['player', 'match'],
      order: { id: 'ASC' },
    });
  }

  private async getLatestMatchDetail(
    steamID: string,
  ): Promise<MatchDetail | null> {
    const matchDetails = await this.matchDetailsRepository.find({
      where: { player: { steamID } },
      order: { id: 'DESC' },
      take: 1,
    });
    return matchDetails.length > 0 ? matchDetails[0] : null;
  }

  private async createMatchDetail(
    createMatchDetailDto: CreateMatchDetailDto,
  ): Promise<MatchDetail> {
    const existingPlayer = await this.playersRepository.findOneByOrFail({
      steamID: createMatchDetailDto.playerSteamId,
    });

    const matchDetail = this.matchDetailsRepository.create({
      ...createMatchDetailDto,
      player: { id: existingPlayer.id },
      match: { id: createMatchDetailDto.matchId },
    });
    return await this.matchDetailsRepository.save(matchDetail);
  }

  async updatePlayerMMR(steamID: string, newMMR: number): Promise<void> {
    const player = await this.playersRepository.findOneOrFail({
      where: { steamID },
    });

    await this.playersRepository.update(player.id, {
      mmr: newMMR,
    });
  }

  private async updateMatchDetail(
    id: number,
    matchDetail: MatchDetail,
  ): Promise<void> {
    await this.matchDetailsRepository.update(id, matchDetail);
  }

  public async reprocessMatchDetails(): Promise<MatchDetailResponseDto> {
    const matchDetails = await this.getAllMatchDetails();

    const matchDetailsByMatch: Record<number, MatchDetail[]> = {};
    for (const matchDetail of matchDetails) {
      const matchId = matchDetail.match.id;
      if (!matchDetailsByMatch[matchId]) {
        matchDetailsByMatch[matchId] = [];
      }
      matchDetailsByMatch[matchId].push(matchDetail);
    }

    const previousMatchDetails: Record<string, MatchDetail | null> = {};

    const updatedMatchDetails: MatchDetail[] = [];
    for (const matchId of Object.keys(matchDetailsByMatch)) {
      const matchDetails = matchDetailsByMatch[parseInt(matchId)];

      const prevForThisMatch: Record<string, MatchDetail | null> = {};
      for (const matchDetail of matchDetails) {
        prevForThisMatch[matchDetail.player.steamID] =
          previousMatchDetails[matchDetail.player.steamID] ?? null;
      }

      const processed = this.processorService.processMatch(
        matchDetails,
        prevForThisMatch,
      );

      for (let i = 0; i < matchDetails.length; i++) {
        updatedMatchDetails.push(processed[i]);
        previousMatchDetails[matchDetails[i].player.steamID] = processed[i];
      }
    }

    for (const matchDetail of updatedMatchDetails) {
      await this.updateMatchDetail(matchDetail.id, matchDetail);
      await this.updatePlayerMMR(
        matchDetail.player.steamID,
        matchDetail.mmrAfterMatch,
      );
    }

    return { success: true };
  }
  public async createMatchDetails(
    createMatchDetailsDto: CreateMatchDetailDto[],
  ): Promise<MatchDetailResponseDto> {
    const teams: Record<string, number> = {};
    for (const dto of createMatchDetailsDto) {
      const model = dto.model?.toLowerCase();
      if (model !== 'blue' && model !== 'red') {
        throw new InvalidModelError(model);
      }
      teams[model] = (teams[model] ?? 0) + 1;
    }
    const teamSizes = Object.values(teams);

    if (teamSizes.length !== 2 || teamSizes[0] !== teamSizes[1]) {
      throw new InvalidModelCountError();
    }

    let matchDetails: MatchDetail[] = [];
    const previousMatchDetails: Record<string, MatchDetail | null> = {};
    for (const dto of createMatchDetailsDto) {
      const previousMatchDetail = await this.getLatestMatchDetail(
        dto.playerSteamId,
      );
      previousMatchDetails[dto.playerSteamId] = previousMatchDetail;

      const createdMatchDetail = await this.createMatchDetail(dto);
      const matchDetail = await this.getMatchDetail(
        createdMatchDetail.id,
        dto.playerSteamId,
      );

      matchDetails.push(matchDetail);
    }

    matchDetails = this.processorService.processMatch(
      matchDetails,
      previousMatchDetails,
    );

    for (const matchDetail of matchDetails) {
      await this.updateMatchDetail(matchDetail.id, matchDetail);
      await this.updatePlayerMMR(
        matchDetail.player.steamID,
        matchDetail.mmrAfterMatch,
      );
    }

    return { success: true };
  }
}
