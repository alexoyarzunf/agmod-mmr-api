import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSteamInfo1749580244751 implements MigrationInterface {
  name = 'AddSteamInfo1749580244751';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`player\` ADD \`steamName\` varchar(255) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`player\` ADD \`avatarURL\` varchar(255) NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`player\` DROP COLUMN \`avatarURL\``);
    await queryRunner.query(`ALTER TABLE \`player\` DROP COLUMN \`steamName\``);
  }
}
