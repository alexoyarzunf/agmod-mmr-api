import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match } from './match.entity';
import { MatchesService } from './matches.service';
import { MatchesController } from './matches.controller';
import { MatchDetailsModule } from 'src/match_details/match-details.module';

@Module({
  imports: [TypeOrmModule.forFeature([Match]), MatchDetailsModule],
  providers: [MatchesService],
  exports: [MatchesService],
  controllers: [MatchesController],
})
export class MatchesModule {}
