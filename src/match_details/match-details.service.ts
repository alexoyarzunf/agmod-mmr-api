import { InjectRepository } from '@nestjs/typeorm';
import { MatchDetail } from './match-detail.entity';
import { In, Repository } from 'typeorm';
import {
  CreateMatchDetailDto,
  MatchDetailResponseDto,
} from './dto/create-match-detail.dto';
import { Player } from 'src/players/player.entity';
import { ProcessorService } from 'src/processor/processor.service';
import { InvalidModelError } from './exceptions/invalid-model.error';
import { InvalidModelCountError } from './exceptions/invalid-model-count.error';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MatchDetailsService {
  private readonly logger = new Logger(MatchDetailsService.name);

  constructor(
    @InjectRepository(MatchDetail)
    private readonly matchDetailsRepository: Repository<MatchDetail>,
    @InjectRepository(Player)
    private readonly playersRepository: Repository<Player>,
    private readonly processorService: ProcessorService,
  ) {}

  async onModuleInit(): Promise<void> {
    const allPlayers = await this.getAllPlayers();
    this.processorService.ensurePlayerRatings(allPlayers);

    this.logger.log('Ratings initialized for all players');
  }

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

  private async getPlayers(steamIDs: string[]): Promise<Player[]> {
    return await this.playersRepository.find({
      where: { steamID: In(steamIDs) },
    });
  }

  private async getAllPlayers(): Promise<Player[]> {
    return await this.playersRepository.find();
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

  async updatePlayerRatings(
    updatedRatings: Map<string, { mu: number; sigma: number }>,
  ): Promise<void> {
    for (const [steamID, rating] of updatedRatings.entries()) {
      await this.playersRepository.update(
        { steamID },
        {
          skillMu: rating.mu,
          skillSigma: rating.sigma,
        },
      );
    }
  }

  private async updateMatchDetail(
    id: number,
    matchDetail: MatchDetail,
  ): Promise<void> {
    await this.matchDetailsRepository.update(id, matchDetail);
  }

  public async reprocessMatchDetails(): Promise<MatchDetailResponseDto> {
    const matchDetails = await this.getAllMatchDetails();

    const uniqueSteamIDs = [
      ...new Set(matchDetails.map((md) => md.player.steamID)),
    ];
    const allPlayers = await this.getPlayers(uniqueSteamIDs);

    for (const player of allPlayers) {
      player.skillMu = 25.0;
      player.skillSigma = 8.333;
    }
    this.processorService.ensurePlayerRatings(allPlayers);

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

    const finalRatings = this.processorService.getPlayerRatings();
    await this.updatePlayerRatings(finalRatings);

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
    const steamIDs: string[] = [];

    for (const dto of createMatchDetailsDto) {
      steamIDs.push(dto.playerSteamId);
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

    const players = await this.getPlayers(steamIDs);
    this.processorService.ensurePlayerRatings(players);

    matchDetails = this.processorService.processMatch(
      matchDetails,
      previousMatchDetails,
    );

    const playerRatings = this.processorService.getPlayerRatings();

    for (const matchDetail of matchDetails) {
      const isValidMatch =
        matchDetail.mmrAfterMatch !== 0 ||
        Math.abs(matchDetail.mmrDelta) > 0;

      if (!isValidMatch) {
        continue;
      }

      await this.updateMatchDetail(matchDetail.id, matchDetail);
      await this.updatePlayerMMR(
        matchDetail.player.steamID,
        matchDetail.mmrAfterMatch,
      );
    }

    await this.updatePlayerRatings(playerRatings);

    return { success: true };
  }
}
