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

  @OneToMany(() => MatchDetail, (matchDetail) => matchDetail.player)
  matchDetails: MatchDetail[];
}
