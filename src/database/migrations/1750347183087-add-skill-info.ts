import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSkillInfo1750347183087 implements MigrationInterface {
  name = 'AddSkillInfo1750347183087';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`player\` ADD \`skillMu\` decimal(10,6) NOT NULL DEFAULT '25.000000'`,
    );
    await queryRunner.query(
      `ALTER TABLE \`player\` ADD \`skillSigma\` decimal(10,6) NOT NULL DEFAULT '8.333000'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`player\` DROP COLUMN \`skillSigma\``,
    );
    await queryRunner.query(`ALTER TABLE \`player\` DROP COLUMN \`skillMu\``);
  }
}
