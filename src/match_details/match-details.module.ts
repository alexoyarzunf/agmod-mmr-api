import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MatchDetail } from './match-detail.entity';
import { MatchDetailsService } from './match-details.service';
import { MatchDetailsController } from './match-details.controller';
import { ProcessorModule } from 'src/processor/processor.module';
import { PlayersModule } from 'src/players/players.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MatchDetail]),
    ProcessorModule,
    PlayersModule,
  ],
  providers: [MatchDetailsService],
  exports: [MatchDetailsService, TypeOrmModule],
  controllers: [MatchDetailsController],
})
export class MatchDetailsModule {}
