import { MatchDetail } from 'src/match_details/match-detail.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Player {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  steamID: string;

  @Column({ default: 0 })
  mmr: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, default: 25.0 })
  skillMu: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, default: 8.333 })
  skillSigma: number;

  @Column()
  steamName: string;

  @Column()
  avatarURL: string;

  @OneToMany(() => MatchDetail, (matchDetail) => matchDetail.player)
  matchDetails: MatchDetail[];
}
