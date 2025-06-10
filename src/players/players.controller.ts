import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
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

  @Get('/leaderboard')
  async getLeaderboard(
    @Query('limit') limit = 50,
    @Query('page') page = 1,
  ): Promise<Player[]> {
    let parsedLimit = Number(limit) > 0 ? Number(limit) : 50;
    parsedLimit = Math.min(parsedLimit, 50);
    const parsedPage = Number(page) > 0 ? Number(page) : 1;
    return await this.playersService.getLeaderboard(parsedLimit, parsedPage);
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
