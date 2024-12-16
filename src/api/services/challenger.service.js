import { request, test } from '@playwright/test';

export class ChallengerService {
  constructor(apiContext) {
    this.apiContext = apiContext;
    this.path = '/challenger';
  }

  async getNewChallenger() {
    return await test.step('Get new challenger token', async () => {
      const response = await this.apiContext.post(this.path);
      let headers = response.headers();
      return headers['x-challenger'];
    });
  }
}
