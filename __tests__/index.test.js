import server from '../index.js';

let app;

beforeAll(() => {
  app = server();
});

test('Check get', async () => {
  const response = await app.inject({
    method: 'GET',
    url: '/',
  });

  expect(response.statusCode).toEqual(200);
  expect(response.body).toEqual('Hello!');
});
