import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { ApiClient } from '../src/api/client/api.client';
import { TodoBuilder } from '../src/helpers/todo.builder';

let client;

const todoData = new TodoBuilder()
  .addTitle()
  .addDescription()
  .addDoneStatus(true)
  .generate();

test.describe.serial('API challenges', () => {
  test.beforeAll(async ({}) => {
    client = await ApiClient.getAuthorizedClient();
  });

  test.afterAll(async ({}) => {
    console.log(
      `https://apichallenges.herokuapp.com/gui/challenges/${process.env.CHALLENGER}`,
    );
  });

  test('GET /challenges (200) @API', async ({}) => {
    const { body, status, headers } = await client.challenges.getChallenges();
    expect(status).toBe(200);
    expect(headers).toEqual(
      expect.objectContaining({ 'x-challenger': process.env.CHALLENGER }),
    );
    expect(body.challenges.length).toBe(59);
  });

  test('GET /todos (200) @API', async ({}) => {
    const { body, status } = await client.todos.getTodos();

    expect(status).toBe(200);
    expect(body.todos.length).toBe(10);
  });

  test('GET /todo (404) @API', async ({}) => {
    const response = await client.apiContext.get('/todo');
    expect(response.status()).toBe(404);
  });

  test('GET /todos/{id} (200) @API', async ({}) => {
    const id = faker.helpers.rangeToNumber({ min: 1, max: 10 });
    const { status } = await client.todos.getTodoById(id);

    expect(status).toBe(200);
  });

  test('GET /todos/{id} (404) @API', async ({}) => {
    const id = faker.helpers.rangeToNumber({ min: 11, max: 100 });
    const { body, status } = await client.todos.getTodoById(id);

    expect(status).toBe(404);
    expect(body.errorMessages).toBeTruthy();
  });

  test('HEAD /todos (200) @API', async ({}) => {
    const { status } = await client.todos.getHeadTodos();
    expect(status).toBe(200);
  });

  test('POST /todos (201) @API', async ({}) => {
    const { status, body } = await client.todos.createTodo(todoData);

    expect(status).toBe(201);
    expect(body.title).toEqual(todoData.title);
  });

  test('POST /todos (400) invalid type of doneStatus @API', async ({}) => {
    const invalidTodo = { ...todoData, doneStatus: 'yes' };
    const { status, body } = await client.todos.createTodo(invalidTodo);

    expect(status).toBe(400);
    expect(body.errorMessages[0]).toContain(
      'doneStatus should be BOOLEAN but was STRING',
    );
  });
});
