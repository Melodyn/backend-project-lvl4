import { promises as fs } from 'fs';
import createApp from '../server/index.js';

let app;

beforeAll(async () => {
  app = await createApp(process.env.NODE_ENV);
});

afterAll(async () => {
  if (app) await app.stop();
});

test.each([
  '/',
  '/users',
  '/users/new',
  '/users/0/edit',
  '/session/new',
  '/statuses',
  '/statuses/new',
  '/statuses/0/edit',
  '/tasks',
  '/tasks/new',
  '/tasks/0/edit',
])('Click pages %s', async (page) => {
  const response = await app.server.inject({
    method: 'GET',
    url: page,
  });

  expect(response.statusCode).toBeLessThanOrEqual(302);
  expect(response.body).not.toBeNull();
});
