import createApp from '../server/index.js';

let app;

beforeAll(() => {
  app = createApp(process.env.NODE_ENV);
});

afterAll(() => {
  if (app) app.stop();
});

test('Check get', async () => {
  const response = await app.server.inject({
    method: 'GET',
    url: '/api?name=World',
  });

  expect(response.statusCode).toEqual(200);
  expect(response.body).toEqual('Hello, World!');
});
