import { test } from '@playwright/test';

export class TodosService {
  constructor(apiContext) {
    this.apiContext = apiContext;
    this.path = '/todos';
  }

  async getTodos() {
    return await test.step('Get list of todos', async () => {
      const response = await this.apiContext.get(this.path);
      const body = await response.json();
      const headers = response.headers();
      const status = response.status();
      return { status, headers, body };
    });
  }

  async getTodoById(id) {
    return await test.step('Get todo by its ID', async () => {
      const response = await this.apiContext.get(`${this.path}/${id}`);
      const body = await response.json();
      const headers = response.headers();
      const status = response.status();
      return { status, headers, body };
    });
  }

  async getHeadTodos() {
    return await test.step('Get headers and status by HEAD request', async () => {
      const response = await this.apiContext.head(this.path);
      const headers = response.headers();
      const status = response.status();
      return { status, headers };
    });
  }

  async createTodo(todoData) {
    return await test.step('Create todo', async () => {
      const response = await this.apiContext.post(this.path, {
        data: todoData,
      });
      const body = await response.json();
      const headers = response.headers();
      const status = response.status();
      return { status, headers, body };
    });
  }
}
