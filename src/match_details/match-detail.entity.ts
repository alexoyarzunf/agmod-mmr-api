import { Match } from 'src/matches/match.entity';
import { Player } from 'src/players/player.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class MatchDetail {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Player, (player) => player.matchDetails)
  player: Player;

  @ManyToOne(() => Match, (match) => match.matchDetails)
  match: Match;

  @Column()
  frags: number;

  @Column()
  deaths: number;

  @Column()
  averagePing: number;

  @Column()
  damageDealt: number;

  @Column()
  damageTaken: number;

  @Column()
  model: string;

  @Column({ default: 0 })
  mmrDelta: number;

  @Column({ default: 0 })
  mmrAfterMatch: number;
}
