import createApp from '../server/index.js';

let app;

beforeAll(async () => {
  app = await createApp(process.env.NODE_ENV);
});

afterAll(() => {
  if (app) app.stop();
});

test('GET', async () => {
  const response = await app.server.inject({
    method: 'GET',
    url: '/users',
  });

  expect(response.statusCode).toEqual(200);
  expect(JSON.parse(response.body)).toEqual([]);
});

const user = {
  firstName: 'hello',
  lastName: 'world',
  email: 'hello@world.com',
};
let passHash = 'password';

test('POST', async () => {
  const response = await app.server.inject({
    method: 'POST',
    url: '/users',
    payload: {
      ...user,
      password: passHash,
    },
  });

  expect(response.statusCode).toEqual(200);
  const { id, password, ...createdUser } = JSON.parse(response.body);
  expect(createdUser).toEqual(user);
  expect(password).not.toEqual(passHash);
  passHash = password;
});

test('PATCH', async () => {
  const response = await app.server.inject({
    method: 'PATCH',
    url: '/users/1',
    payload: {
      ...user,
      password: 'newPassword',
    },
  });

  expect(response.statusCode).toEqual(200);
});

test('GET 2', async () => {
  const response = await app.server.inject({
    method: 'GET',
    url: '/users',
  });

  expect(response.statusCode).toEqual(200);
  const [{ id, password, ...createdUser }] = JSON.parse(response.body);
  expect(createdUser).toEqual(user);
  expect(password).not.toEqual(passHash);
});
