import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PlayersService } from './players.service';
import { Player } from './player.entity';
import { CreatePlayerDto } from './dto/create-player.dto';

@Controller('players')
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Get()
  async getAllPlayers(): Promise<Player[]> {
    return await this.playersService.getAllPlayers();
  }

  @Get(':steamID')
  async getPlayerBySteamID(@Param('steamID') steamID: string): Promise<any> {
    return await this.playersService.getPlayerBySteamID(steamID);
  }

  @Post()
  async createPlayer(
    @Body() createPlayerDto: CreatePlayerDto,
  ): Promise<Player> {
    return await this.playersService.createPlayer(createPlayerDto);
  }
}
