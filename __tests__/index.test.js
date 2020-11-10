import dotenv from 'dotenv';
import App from '../index.js';

let app;

beforeAll(() => {
  const { parsed: config } = dotenv.config({ path: 'test.env' });
  app = new App(config);
});

test('Check get', async () => {
  const response = await app.server.inject({
    method: 'GET',
    url: '/?name=World',
  });

  expect(response.statusCode).toEqual(200);
  expect(response.body).toEqual('Hello, World!');
});
