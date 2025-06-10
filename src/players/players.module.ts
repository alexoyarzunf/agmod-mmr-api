import { Module } from '@nestjs/common';
import { PlayersService } from './players.service';
import { PlayersController } from './players.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Player } from './player.entity';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [TypeOrmModule.forFeature([Player]), HttpModule, ConfigModule],
  providers: [PlayersService],
  exports: [PlayersService, TypeOrmModule],
  controllers: [PlayersController],
})
export class PlayersModule {}
