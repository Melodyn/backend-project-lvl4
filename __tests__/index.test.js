import { promises as fs } from 'fs';
import createApp from '../server/index.js';

let app;

beforeAll(async () => {
  app = await createApp(process.env.NODE_ENV);
});

afterAll(async () => {
  if (app) await app.stop();
  await fs.unlink(process.env.DB_NAME);
});

test('Get users without auth', async () => {
  const response = await app.server.inject({
    method: 'GET',
    url: '/users',
  });

  expect(response.statusCode).toEqual(200);
  expect(response.body).not.toBeNull();
});
