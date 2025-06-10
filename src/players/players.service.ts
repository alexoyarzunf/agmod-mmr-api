import { InjectRepository } from '@nestjs/typeorm';
import { Player } from './player.entity';
import { Repository } from 'typeorm';
import { PlayerResponseDto } from './dto/player.dto';
import { CreatePlayerDto } from './dto/create-player.dto';

export class PlayersService {
  constructor(
    @InjectRepository(Player)
    private readonly playersRepository: Repository<Player>,
  ) {}

  async getAllPlayers(): Promise<Player[]> {
    return await this.playersRepository.find();
  }

  async getPlayerBySteamID(steamID: string): Promise<PlayerResponseDto | null> {
    const player = await this.playersRepository.findOne({
      where: { steamID },
      relations: ['matchDetails', 'matchDetails.match'],
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
    }));

    return {
      id: player.id,
      steamID: player.steamID,
      mmr: player.mmr,
      matchHistory,
    };
  }

  async createPlayer(createPlayerDto: CreatePlayerDto): Promise<Player> {
    const existingPlayer = await this.playersRepository.findOneBy({
      steamID: createPlayerDto.steamID,
    });

    let player = new Player();

    if (existingPlayer === null) {
      player = this.playersRepository.create(createPlayerDto);
      return await this.playersRepository.save(player);
    } else {
      player = existingPlayer;
    }

    return player;
  }
}
