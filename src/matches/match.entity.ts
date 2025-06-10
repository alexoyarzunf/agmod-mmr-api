import { MatchDetail } from 'src/match_details/match-detail.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Match {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  serverIp: string;

  @Column({ type: 'timestamp', default: () => 'now()' })
  matchDate: Date;

  @Column()
  mapName: string;

  // Match detail relation
  @OneToMany(() => MatchDetail, (matchDetail) => matchDetail.match)
  matchDetails: MatchDetail[];
}
