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

test.each([
  '/',
  '/users',
  '/users/new',
  '/users/0/edit',
  '/session/new',
])('Click pages %s', async (page) => {
  const response = await app.server.inject({
    method: 'GET',
    url: page,
  });

  expect(response.statusCode).toBeLessThanOrEqual(302);
  expect(response.body).not.toBeNull();
});
