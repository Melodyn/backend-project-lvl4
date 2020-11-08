import dotenv from 'dotenv';
import App from '../index.js';

let app;

beforeAll(() => {
  const { parsed: config } = dotenv.config({ path: 'test.env' });
  app = new App(config);
});

afterAll(() => {
  app.stop();
});

test('Check get', async () => {
  const response = await app.server.inject({
    method: 'GET',
    url: '/',
  });

  expect(response.statusCode).toEqual(200);
  expect(response.body).toEqual('Hello!');
});
