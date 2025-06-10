export class InvalidModelError extends Error {
  constructor(model: string) {
    super(`Invalid player model: ${model}.`);
    this.name = 'InvalidModelError';
  }
}
