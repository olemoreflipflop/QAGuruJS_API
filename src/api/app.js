import {
  TodoService,
  ChallengerService,
  HeartbeatService,
  SecretService,
} from '../services/index';

export class App {
  constructor(token) {
    this.todos = new TodoService(token);
    this.challenger = new ChallengerService(token);
    this.heartbeat = new HeartbeatService(token);
    this.secret = new SecretService(token);
  }

  static async getAuthorizedClient() {
    const client = this.unauthorized();
    const challenger = await client.challenger.getNewChallenger();

    process.env.CHALLENGER = challenger;

    return new App({ challenger });
  }

  static async getUnauthorizedClient() {
    return new App();
  }
}
