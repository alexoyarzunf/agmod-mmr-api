import { Module } from '@nestjs/common';
import * as Joi from 'joi';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { PlayersModule } from './players/players.module';
import { MatchesModule } from './matches/matches.module';
import { ProcessorModule } from './processor/processor.module';
import { ScheduleModule } from '@nestjs/schedule';
import { MatchDetailsModule } from './match_details/match-details.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().required(),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().allow('').required(),
        DB_DATABASE: Joi.string().required(),
        DB_SYNCHRONIZE: Joi.boolean().required(),
      }),
    }),
    DatabaseModule,
    PlayersModule,
    MatchesModule,
    MatchDetailsModule,
    ProcessorModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
