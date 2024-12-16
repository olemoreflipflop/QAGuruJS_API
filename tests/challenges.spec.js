import { test as base, expect, request } from '@playwright/test';
import { faker } from '@faker-js/faker';

const test = base.extend({
  api: async ({}, use) => {
    const api = await request.newContext({
      extraHTTPHeaders: {
        'x-challenger': process.env.CHALLENGER,
      },
    });
    await use(api);
  },
});

test.describe.serial('API challenges', () => {
  const todo = {
    title: 'title_1',
    doneStatus: true,
    description: '',
  };

  test.beforeAll(async ({ request }) => {
    const response = await request.post(`/challenger`);
    let headers = response.headers();
    process.env.CHALLENGER = headers['x-challenger'];

    const responseToken = await request.post(`/secret/token`, {
      headers: {
        'x-challenger': process.env.CHALLENGER,
        authorization: `Basic YWRtaW46cGFzc3dvcmQ=`,
      },
    });
    let headersToken = responseToken.headers();
    process.env.TOKEN = headersToken['x-auth-token'];
  });

  test.afterAll(async ({}) => {
    console.log(
      `https://apichallenges.herokuapp.com/gui/challenges/${process.env.CHALLENGER}`,
    );
  });

  test('GET /challenges (200) @API', async ({ api }) => {
    const response = await api.get(`/challenges`);
    const body = await response.json();

    expect(response.status()).toBe(200);
    expect(response.headers()).toEqual(
      expect.objectContaining({ 'x-challenger': process.env.CHALLENGER }),
    );
    expect(body.challenges.length).toBe(59);
  });

  test('GET /todos (200) @API', async ({ api }) => {
    const response = await api.get(`/todos`);
    const body = await response.json();

    expect(response.status()).toBe(200);
    expect(body.todos.length).toBe(10);
  });

  test('GET /todo (404) @API', async ({ api }) => {
    const response = await api.get(`/todo`);
    expect(response.status()).toBe(404);
  });

  test('GET /todos/{id} (200) @API', async ({ api }) => {
    const id = faker.helpers.rangeToNumber({ min: 1, max: 10 });
    const response = await api.get(`/todos/${id}`);

    expect(response.status()).toBe(200);
  });

  test('GET /todos/{id} (404) @API', async ({ api }) => {
    const id = faker.helpers.rangeToNumber({ min: 11, max: 100 });
    const response = await api.get(`/todos/${id}`);
    const body = await response.json();

    expect(response.status()).toBe(404);
    expect(body.errorMessages).toBeTruthy();
  });

  test('HEAD /todos (200) @API', async ({ api }) => {
    const response = await api.head(`/todos`);
    expect(response.status()).toBe(200);
  });

  test('POST /todos (201) @API', async ({ api }) => {
    const response = await api.post(`/todos`, { data: todo });
    const body = await response.json();

    expect(response.status()).toBe(201);
    expect(body.title).toEqual(todo.title);
  });

  test('POST /todos (400) invalid type of doneStatus @API', async ({ api }) => {
    const todoData = { ...todo, doneStatus: 'yes' };

    const response = await api.post(`/todos`, { data: todoData });
    const body = await response.json();

    expect(response.status()).toBe(400);
    expect(body.errorMessages[0]).toContain(
      'doneStatus should be BOOLEAN but was STRING',
    );
  });

  test('GET /todos?donesStatus=true (200) @API', async ({ api }) => {
    const response = await api.get(`/todos`, {
      params: {
        doneStatus: true,
      },
    });
    const body = await response.json();

    expect(response.status()).toBe(200);
    expect(body.todos.length).toBeGreaterThan(0);
    body.todos.forEach((entry) => {
      expect(entry.doneStatus).toBe(true);
    });
  });

  test('POST /todos (400) title too long @API', async ({ api }) => {
    const todoData = { ...todo, title: faker.string.alpha(51) };

    const response = await api.post(`/todos`, { data: todoData });
    const body = await response.json();

    expect(response.status()).toBe(400);
    expect(body.errorMessages[0]).toContain(
      'Maximum allowable length exceeded for title - maximum allowed is 50',
    );
  });

  test('POST /todos (400) description too long @API', async ({ api }) => {
    const todoData = { ...todo, description: faker.string.alpha(201) };

    const response = await api.post(`/todos`, { data: todoData });
    const body = await response.json();

    expect(response.status()).toBe(400);
    expect(body.errorMessages[0]).toContain(
      'Maximum allowable length exceeded for description - maximum allowed is 200',
    );
  });

  test('POST /todos (201) max out content	 @API', async ({ api }) => {
    const todoData = {
      ...todo,
      description: faker.string.alpha(200),
      title: faker.string.alpha(50),
    };

    const response = await api.post(`/todos`, { data: todoData });
    const body = await response.json();

    expect(response.status()).toBe(201);
    expect(body.title).toEqual(todoData.title);
    expect(body.description).toEqual(todoData.description);
  });

  test('POST /todos (413) content too long @API', async ({ api }) => {
    const todoData = {
      ...todo,
      description: faker.string.alpha(5001),
    };
    const response = await api.post(`/todos`, { data: todoData });
    const body = await response.json();

    expect(response.status()).toBe(413);
    expect(body.errorMessages[0]).toContain(
      'Request body too large, max allowed is 5000 bytes',
    );
  });

  test('POST /todos (400) extra	key @API', async ({ api }) => {
    const todoData = { tag: 'tag', ...todo };

    const response = await api.post(`/todos`, { data: todoData });
    const body = await response.json();

    expect(response.status()).toBe(400);
    expect(response.headers()).toEqual(
      expect.objectContaining({ 'x-challenger': process.env.CHALLENGER }),
    );
    expect(body.errorMessages[0]).toContain('Could not find field: tag');
  });

  test('PUT /todos/{id} (400) @API', async ({ api }) => {
    const id = faker.helpers.rangeToNumber({ min: 11, max: 100 });
    const response = await api.put(`/todos/${id}`, { data: todo });
    const body = await response.json();

    expect(response.status()).toBe(400);
    expect(body.errorMessages[0]).toContain(
      'Cannot create todo with PUT due to Auto fields id',
    );
  });

  test('POST /todos/{id} (200) @API', async ({ api }) => {
    const id = faker.helpers.rangeToNumber({ min: 1, max: 10 });
    const todoData = { ...todo, title: faker.string.alpha(10) };

    const response = await api.post(`/todos/${id}`, { data: todoData });
    const body = await response.json();

    expect(response.status()).toBe(200);
    expect(body.title).toEqual(todoData.title);
    expect(body.id).toEqual(id);
  });

  test('POST /todos/{id} (404) @API', async ({ api }) => {
    const id = faker.helpers.rangeToNumber({ min: 50, max: 100 });

    const response = await api.post(`/todos/${id}`, { data: todo });
    const body = await response.json();

    expect(response.status()).toBe(404);
    expect(body.errorMessages[0]).toContain(
      `No such todo entity instance with id == ${id} found`,
    );
  });

  test('PUT /todos/{id} (200) @API', async ({ api }) => {
    const id = faker.helpers.rangeToNumber({ min: 1, max: 10 });

    const response = await api.put(`/todos/${id}`, { data: todo });
    const body = await response.json();

    expect(response.status()).toBe(200);
    expect(body).toEqual({ ...todo, id });
  });

  test('PUT /todos/{id} partial (200) @API', async ({ api }) => {
    const id = faker.helpers.rangeToNumber({ min: 1, max: 10 });
    const title = faker.lorem.word();
    const response = await api.put(`/todos/${id}`, { data: { title } });
    const body = await response.json();

    expect(response.status()).toBe(200);
    expect(body.title).toEqual(title);
    expect(body.id).toEqual(id);
  });

  test('PUT /todos/{id} no title (400) @API', async ({ api }) => {
    const id = faker.helpers.rangeToNumber({ min: 1, max: 10 });
    const description = faker.lorem.word();
    const response = await api.put(`/todos/${id}`, { data: { description } });
    const body = await response.json();

    expect(response.status()).toBe(400);
    expect(body.errorMessages[0]).toContain(`title : field is mandatory`);
  });

  test('PUT /todos/{id} no amend id (400) @API', async ({ api }) => {
    const id = faker.helpers.rangeToNumber({ min: 1, max: 10 });
    const response = await api.put(`/todos/${id}`, {
      data: { ...todo, id: id + 1 },
    });
    const body = await response.json();

    expect(response.status()).toBe(400);
    expect(body.errorMessages[0]).toContain(
      `Can not amend id from ${id} to ${id + 1}`,
    );
  });

  test('DELETE /todos/{id} (200) @API', async ({ api }) => {
    const id = faker.helpers.rangeToNumber({ min: 1, max: 10 });
    const response = await api.delete(`/todos/${id}`);

    expect(response.status()).toBe(200);
    let getResponse = await api.get(`/todos/${id}`);
    const body = await getResponse.json();
    expect(body.errorMessages[0]).toContain(
      `Could not find an instance with todos/${id}`,
    );
  });

  test('OPTIONS /todos (200) @API', async ({ api }) => {
    const id = faker.helpers.rangeToNumber({ min: 1, max: 10 });
    const response = await api.fetch('/todos', {
      method: 'options',
    });
    expect(response.status()).toBe(200);
    expect(response.headers()).toEqual(
      expect.objectContaining({ allow: 'OPTIONS, GET, HEAD, POST' }),
    );
  });

  test('GET /todos (200) XML @API', async ({ api }) => {
    const response = await api.get(`/todos`, {
      headers: {
        Accept: 'application/xml',
      },
    });

    expect(response.status()).toBe(200);
    expect(response.headers()).toEqual(
      expect.objectContaining({
        'content-type': 'application/xml',
      }),
    );
  });

  test('GET /todos (200) JSON @API', async ({ api }) => {
    const response = await api.get(`/todos`, {
      headers: {
        Accept: 'application/json',
      },
    });

    expect(response.status()).toBe(200);
    expect(response.headers()).toEqual(
      expect.objectContaining({
        'content-type': 'application/json',
      }),
    );
  });

  test('GET /todos (200) XML pref @API', async ({ api }) => {
    const response = await api.get(`/todos`, {
      headers: {
        Accept: 'application/xml, application/json',
      },
    });

    expect(response.status()).toBe(200);
    expect(response.headers()).toEqual(
      expect.objectContaining({
        'content-type': 'application/xml',
      }),
    );
  });

  test('GET /todos (200) no accept @API', async ({ api }) => {
    const response = await api.get(`/todos`, {
      headers: {
        Accept: '',
      },
    });

    expect(response.status()).toBe(200);
    expect(response.headers()).toEqual(
      expect.objectContaining({
        'content-type': 'application/json',
      }),
    );
  });

  test('GET /todos (406) @API', async ({ api }) => {
    const response = await api.get(`/todos`, {
      headers: {
        Accept: 'application/gzip',
      },
    });
    const body = await response.json();

    expect(response.status()).toBe(406);
    expect(body.errorMessages[0]).toContain(`Unrecognised Accept Type`);
  });

  test('POST /todos XML (201) @API', async ({ api }) => {
    const response = await api.post(`/todos`, {
      headers: {
        Accept: 'application/xml',
        'Content-Type': 'application/xml',
      },
      data: '<title>file paperwork today</title>',
    });
    expect(response.status()).toBe(201);
    expect(response.headers()).toEqual(
      expect.objectContaining({
        'content-type': 'application/xml',
      }),
    );
  });

  test('POST /todos JSON (201) @API', async ({ api }) => {
    const response = await api.post(`/todos`, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      data: todo,
    });

    expect(response.status()).toBe(201);
    expect(response.headers()).toEqual(
      expect.objectContaining({
        'content-type': 'application/json',
      }),
    );
  });

  test('POST /todos invalid content-type (415) @API', async ({ api }) => {
    const type = 'type';
    const response = await api.post(`/todos`, {
      headers: {
        'Content-Type': type,
      },
      data: todo,
    });
    const body = await response.json();

    expect(response.status()).toBe(415);
    expect(body.errorMessages[0]).toContain(
      `Unsupported Content Type - ${type}`,
    );
  });

  test('GET /challenger/guid (existing X-CHALLENGER) (200) @API', async ({
    api,
  }) => {
    const response = await api.get(`/challenger/${process.env.CHALLENGER}`);
    const body = await response.json();

    expect(response.status()).toBe(200);
    expect(body.xChallenger).toBe(process.env.CHALLENGER);
  });

  test('PUT /challenger/guid RESTORE (200) @API', async ({ api }) => {
    const responseGet = await api.get(`/challenger/${process.env.CHALLENGER}`);
    const body = await responseGet.json();

    const responsePut = await api.put(`/challenger/${process.env.CHALLENGER}`, {
      data: body,
    });

    expect(responsePut.status()).toBe(200);
  });

  test('GET /challenger/database/guid (200) @API', async ({ api }) => {
    const response = await api.get(
      `/challenger/database/${process.env.CHALLENGER}`,
    );

    expect(response.status()).toBe(200);
  });

  test('PUT /challenger/database/guid Update (204) @API', async ({ api }) => {
    const responseGet = await api.get(
      `/challenger/database/${process.env.CHALLENGER}`,
    );
    const dataJson = await responseGet.json();

    const responsePut = await api.put(
      `/challenger/database/${process.env.CHALLENGER}`,
      {
        data: dataJson,
      },
    );

    expect(responsePut.status()).toBe(204);
  });

  test('POST /todos XML to JSON (201) @API', async ({ api }) => {
    const response = await api.post(`/todos`, {
      headers: {
        'Content-Type': 'application/xml',
        Accept: 'application/json',
      },
      data: '<title> paperwork today</title>',
    });

    expect(response.status()).toEqual(201);
    expect(response.headers()).toEqual(
      expect.objectContaining({
        'content-type': 'application/json',
      }),
    );
  });

  test('POST /todos JSON to XML (201) @API', async ({ api }) => {
    const response = await api.post(`/todos`, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/xml',
      },
      data: { ...todo, title: 'todo_XML' },
    });

    expect(response.status()).toEqual(201);
    expect(response.headers()).toEqual(
      expect.objectContaining({
        'content-type': 'application/xml',
      }),
    );
  });

  test('DELETE /heartbeat (405) @API', async ({ api }) => {
    const response = await api.delete(`/heartbeat`);

    expect(response.status()).toEqual(405);
  });

  test('PATCH /heartbeat (500) @API', async ({ api }) => {
    const response = await api.fetch('/heartbeat', {
      method: 'patch',
    });
    expect(response.status()).toEqual(500);
  });

  test('TRACE /heartbeat (501) @API', async ({ api }) => {
    const response = await api.fetch('/heartbeat', {
      method: 'trace',
    });
    expect(response.status()).toEqual(501);
  });

  test('GET /heartbeat (204) @API', async ({ api }) => {
    const response = await api.get(`/heartbeat`);
    expect(response.status()).toEqual(204);
  });

  test('POST /heartbeat as DELETE (405) @API', async ({ api }) => {
    const response = await api.post(`/heartbeat`, {
      headers: {
        'X-HTTP-Method-Override': 'Delete',
      },
    });
    expect(response.status()).toEqual(405);
  });

  test('POST /heartbeat as PATCH (500) @API', async ({ api }) => {
    const response = await api.post(`/heartbeat`, {
      headers: {
        'X-HTTP-Method-Override': 'PATCH',
      },
    });
    expect(response.status()).toEqual(500);
  });

  test('POST /heartbeat as Trace (501) @API', async ({ api }) => {
    const response = await api.post(`/heartbeat`, {
      headers: {
        'X-HTTP-Method-Override': 'Trace',
      },
    });
    expect(response.status()).toEqual(501);
  });

  test('POST /secret/token (401) @API', async ({ api }) => {
    const response = await api.post(`/secret/token`, {
      headers: {
        authorization: `Basic YWRtaW46cGFzc3vmQ=`,
      },
    });
    expect(response.status()).toEqual(401);
  });

  test('POST /secret/token (201) @API', async ({ api }) => {
    const response = await api.post(`/secret/token`, {
      headers: {
        authorization: `Basic YWRtaW46cGFzc3dvcmQ=`,
      },
    });
    const headers = response.headers();
    expect(response.status()).toEqual(201);
    expect(headers).toHaveProperty('x-auth-token');
  });

  test('GET /secret/note (403) @API', async ({ api }) => {
    const response = await api.get(`/secret/note`, {
      headers: {
        'x-auth-token': `${faker.string.uuid()}`,
      },
    });
    expect(response.status()).toEqual(403);
  });

  test('GET /secret/note (401) @API', async ({ api }) => {
    const response = await api.get(`/secret/note`);
    expect(response.status()).toEqual(401);
  });

  test('GET /secret/note (200) @API', async ({ api }) => {
    const response = await api.get(`/secret/note`, {
      headers: {
        'x-auth-token': `${process.env.TOKEN}`,
      },
    });
    expect(response.status()).toEqual(200);
  });

  test('POST /secret/note (200) @API', async ({ api }) => {
    const response = await api.post(`/secret/note`, {
      headers: {
        'x-auth-token': `${process.env.TOKEN}`,
      },
      data: { note: 'my note' },
    });
    expect(response.status()).toEqual(200);
  });

  test('POST /secret/note (401) @API', async ({ api }) => {
    const response = await api.post(`/secret/note`, {
      data: { note: 'my note' },
    });
    expect(response.status()).toEqual(401);
  });

  test('POST /secret/note (403) @API', async ({ api }) => {
    const response = await api.post(`/secret/note`, {
      headers: {
        'x-auth-token': `${faker.string.uuid()}`,
      },
      data: { note: 'my note' },
    });
    expect(response.status()).toEqual(403);
  });

  test('GET /secret/note (Bearer) (200) @API', async ({ api }) => {
    const response = await api.get(`/secret/note`, {
      headers: {
        Authorization: `Bearer ${process.env.TOKEN}`,
      },
    });
    expect(response.status()).toEqual(200);
  });

  test('POST /secret/note (Bearer) (200) @API', async ({ api }) => {
    const response = await api.post(`/secret/note`, {
      headers: {
        Authorization: `Bearer ${process.env.TOKEN}`,
      },
      data: { note: 'my note' },
    });
    expect(response.status()).toEqual(200);
  });

  test('DELETE /todos/{id} all (200) @API', async ({ api }) => {
    let response = await api.get('/todos');
    let body = await response.json();
    for (let todo of body.todos) {
      await api.delete(`/todos/${todo.id}`);
    }
    response = await api.get('/todos');
    body = await response.json();

    expect(response.status()).toBe(200);
    expect(body.todos.length).toBe(0);
  });

  test('59 Create maximum number of todos @API', async ({ api }) => {
    let response = await api.get('/todos');
    let body = await response.json();
    for (let todo of body.todos) {
      await api.delete(`/todos/${todo.id}`);
    }
    const maxTodos = 20;

    for (let i = 0; i < maxTodos; i++) {
      const newTodo = { ...todo, title: `todo ${i}` };

      const response = await api.post(`/todos`, { data: newTodo });
      expect(response.status()).toBe(201);
    }

    const extraResponse = await api.post(`/todos`, { data: todo });

    expect(extraResponse.status()).toBe(400);
  });

  test('PUT /challenger/guid CREATE (200) @API', async ({ api }) => {
    let guid = faker.string.uuid();

    const response = await api.get(`/challenger/${process.env.CHALLENGER}`);
    const body = await response.json();
    const responsePut = await api.put(`/challenger/${guid}`, {
      headers: {
        'x-challenger': `${guid}`,
      },
      data: { ...body, xChallenger: `${guid}` },
    });

    expect(responsePut.status()).toBe(201);
    process.env.CHALLENGER = guid;
  });

  // 59	POST /todos (201) all	false
  // Issue as many POST requests as it takes to add the maximum number of TODOS allowed for a user. The maximum number should be listed in the documentation.
});
