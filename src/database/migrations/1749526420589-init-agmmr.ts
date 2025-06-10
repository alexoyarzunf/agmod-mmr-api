import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitAgmmr1749526420589 implements MigrationInterface {
  name = 'InitAgmmr1749526420589';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`match\` (\`id\` int NOT NULL AUTO_INCREMENT, \`serverIp\` varchar(255) NOT NULL, \`matchDate\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP(), \`mapName\` varchar(255) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`match_detail\` (\`id\` int NOT NULL AUTO_INCREMENT, \`frags\` int NOT NULL, \`deaths\` int NOT NULL, \`averagePing\` int NOT NULL, \`damageDealt\` int NOT NULL, \`damageTaken\` int NOT NULL, \`model\` varchar(255) NOT NULL, \`mmrDelta\` int NOT NULL DEFAULT '0', \`mmrAfterMatch\` int NOT NULL DEFAULT '0', \`playerId\` int NULL, \`matchId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`player\` (\`id\` int NOT NULL AUTO_INCREMENT, \`steamID\` varchar(255) NOT NULL, \`mmr\` int NOT NULL DEFAULT '0', PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`match_detail\` ADD CONSTRAINT \`FK_a000ad8b8012b1316bf48a50b22\` FOREIGN KEY (\`playerId\`) REFERENCES \`player\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`match_detail\` ADD CONSTRAINT \`FK_e83c39eff52c37e32f68f0a2154\` FOREIGN KEY (\`matchId\`) REFERENCES \`match\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`match_detail\` DROP FOREIGN KEY \`FK_e83c39eff52c37e32f68f0a2154\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`match_detail\` DROP FOREIGN KEY \`FK_a000ad8b8012b1316bf48a50b22\``,
    );
    await queryRunner.query(`DROP TABLE \`player\``);
    await queryRunner.query(`DROP TABLE \`match_detail\``);
    await queryRunner.query(`DROP TABLE \`match\``);
  }
}
