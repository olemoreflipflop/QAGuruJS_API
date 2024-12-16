import {
  TodosService,
  ChallengerService,
  ChallengesService,
} from '../services/index';
import { test, request } from '@playwright/test';

export class ApiClient {
  constructor(apiContext) {
    this.challenges = new ChallengesService(apiContext);
    this.challenger = new ChallengerService(apiContext);
    this.todos = new TodosService(apiContext);
    this.apiContext = apiContext;
  }

  static async getAuthorizedClient() {
    return await test.step('Create new authorised challenger client', async () => {
      const context = await request.newContext();
      const client = this.getUnauthorizedClient(context);

      const challenger = await client.challenger.getNewChallenger();

      process.env.CHALLENGER = challenger;
      const userContext = await request.newContext({
        extraHTTPHeaders: {
          'x-challenger': process.env.CHALLENGER,
        },
      });

      return new ApiClient(userContext);
    });
  }

  static getUnauthorizedClient(context) {
    return new ApiClient(context);
  }
}
