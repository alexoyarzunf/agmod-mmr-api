import { InjectRepository } from '@nestjs/typeorm';
import { Player } from './player.entity';
import { Repository } from 'typeorm';
import { PlayerResponseDto } from './dto/player.dto';
import { CreatePlayerDto } from './dto/create-player.dto';
import { firstValueFrom } from 'rxjs';
import { GetPlayerSummariesDto } from './dto/get-player-summaries.dto';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { InvalidSteamIDError } from './exceptions/invalid-steam-id.error';
import { ID } from '@node-steam/id';

export class PlayersService {
  constructor(
    @InjectRepository(Player)
    private readonly playersRepository: Repository<Player>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async getAllPlayers(): Promise<Player[]> {
    return await this.playersRepository.find();
  }

  async getLeaderboard(limit = 50, page = 1): Promise<Player[]> {
    const take = Number(limit) > 0 ? Number(limit) : 50;
    const skip = Number(page) > 1 ? (Number(page) - 1) * take : 0;
    return await this.playersRepository.find({
      order: { mmr: 'DESC' },
      take,
      skip,
    });
  }

  async getPlayerByID(id: number): Promise<PlayerResponseDto | null> {
    const player = await this.playersRepository.findOne({
      where: { id },
      relations: ['matchDetails', 'matchDetails.match'],
      order: {
        matchDetails: {
          match: {
            matchDate: 'DESC',
          },
        },
      },
    });

    if (!player) {
      return null;
    }

    const matchHistory = player.matchDetails.map((detail) => ({
      matchId: detail.match.id,
      serverIp: detail.match.serverIp,
      matchDate: detail.match.matchDate,
      mapName: detail.match.mapName,
      stats: {
        frags: detail.frags,
        deaths: detail.deaths,
        averagePing: detail.averagePing,
        damageDealt: detail.damageDealt,
        damageTaken: detail.damageTaken,
        model: detail.model,
      },
      mmrAfterMatch: detail.mmrAfterMatch,
      mmrDelta: detail.mmrDelta,
    }));

    return {
      id: player.id,
      steamID: player.steamID,
      steamName: player.steamName,
      avatarURL: player.avatarURL,
      mmr: player.mmr,
      matchHistory,
    };
  }

  async createPlayer(createPlayerDto: CreatePlayerDto): Promise<Player> {
    let steamAccount;

    try {
      steamAccount = new ID(createPlayerDto.steamID);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new InvalidSteamIDError(createPlayerDto.steamID);
    }

    const steamApiKey = this.configService.get<string>('STEAM_API_KEY');

    let playerSummaries: GetPlayerSummariesDto | undefined = undefined;
    try {
      const { data: playerData } = await firstValueFrom(
        this.httpService
          .get<{
            response: { players: GetPlayerSummariesDto[] };
          }>(
            `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${steamApiKey}&steamids=${steamAccount.getSteamID64()}`,
          )
          .pipe(),
      );

      playerSummaries = playerData.response.players[0];
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      console.error(
        'Error fetching player data from Steam API, setting default avatar URL for player with Steam ID:',
        createPlayerDto.steamID,
      );
    }

    const existingPlayer = await this.playersRepository.findOneBy({
      steamID: createPlayerDto.steamID,
    });

    let player: Player;

    const avatarURL = playerSummaries ? playerSummaries.avatarfull : '';
    const steamName = playerSummaries ? playerSummaries.personaname : '';

    if (existingPlayer === null) {
      player = this.playersRepository.create({
        ...createPlayerDto,
        avatarURL,
        steamName,
      });
      return await this.playersRepository.save(player);
    } else {
      player = existingPlayer;
      player.avatarURL = avatarURL;
      if (steamName !== '') {
        player.steamName = steamName;
      }
      await this.playersRepository.save(player);
    }

    return player;
  }
}
