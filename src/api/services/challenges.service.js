import { test } from '@playwright/test';

export class ChallengesService {
  constructor(apiContext) {
    this.apiContext = apiContext;
    this.path = '/challenges';
  }

  async getChallenges() {
    return await test.step('Get list of challenges', async () => {
      const response = await this.apiContext.get(this.path);
      const body = await response.json();
      const headers = response.headers();
      const status = response.status();
      return { status, headers, body };
    });
  }
}
