export class SmoketapeError extends Error {
  constructor(message: string, readonly code = 'SMOKETAPE_ERROR') {
    super(message);
    this.name = 'SmoketapeError';
  }
}
