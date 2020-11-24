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

test('Login', async () => {
  const response = await app.server.inject({
    method: 'POST',
    url: '/login',
    payload: {
      ...user,
      password: 'password',
    },
  });

  expect(response.statusCode).toEqual(200);
  expect(response.body).toEqual(passHash);
});

test('Login fail', async () => {
  const response = await app.server.inject({
    method: 'POST',
    url: '/login',
    payload: {
      ...user,
      password: 'notPassword',
    },
  });

  expect(response.statusCode).toEqual(401);
  expect(response.body).toEqual('Incorrect password');
});

test('PATCH', async () => {
  const response = await app.server.inject({
    method: 'PATCH',
    url: '/users/1',
    headers: {
      authorization: passHash,
    },
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
  passHash = password;
});

test('new user', async () => {
  const response = await app.server.inject({
    method: 'POST',
    url: '/users',
    payload: {
      ...user,
      email: 'new@email.com',
      password: 'newPassword',
    },
  });

  expect(response.statusCode).toEqual(200);
});

test('PATCH another user', async () => {
  const response = await app.server.inject({
    method: 'PATCH',
    url: '/users/2',
    headers: {
      authorization: passHash,
    },
    payload: {
      ...user,
      password: 'newPassword',
    },
  });

  expect(response.statusCode).not.toEqual(200);
});
