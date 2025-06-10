import { Module } from '@nestjs/common';
import { PlayersService } from './players.service';
import { PlayersController } from './players.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Player } from './player.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Player])],
  providers: [PlayersService],
  exports: [PlayersService, TypeOrmModule],
  controllers: [PlayersController],
})
export class PlayersModule {}
