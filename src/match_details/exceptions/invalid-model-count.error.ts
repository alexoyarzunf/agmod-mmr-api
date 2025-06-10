export class InvalidModelCountError extends Error {
  constructor() {
    super(`There must be two teams with the same number of players.`);
    this.name = 'InvalidModelCountError';
  }
}
