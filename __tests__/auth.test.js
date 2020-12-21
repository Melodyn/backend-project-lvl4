import { promises as fs } from 'fs';
import { constants } from 'http2';
import createApp from '../server/index.js';
import users from '../__fixtures__/users';
import { User } from '../models/User.js';

let app;

const mergeData = (fields, password) => ({ ...fields, password });
const setCookie = (user, cookies) => {
  user.cookies = cookies.reduce((acc, { name, value }) => ({ ...acc, [name]: value }), {});
};

beforeAll(async () => {
  app = await createApp(process.env.NODE_ENV);
});

afterAll(async () => {
  if (app) await app.stop();
});

describe('Positive cases', () => {
  const fixtureUser = { ...(users.helloWorld) };
  const { fields: userFields, password: userPassword } = fixtureUser;
  const userData = mergeData(userFields, userPassword);

  test('Create', async () => {
    const { statusCode } = await app.server.inject({
      method: 'POST',
      url: '/users',
      payload: { data: userData },
    });

    expect(statusCode).toEqual(constants.HTTP_STATUS_FOUND);
  });

  test('DB user created', async () => {
    const user = await User.query().findOne({ email: userFields.email });
    expect(user).toEqual(expect.objectContaining({
      id: expect.any(Number),
      password: expect.not.stringContaining(userPassword),
    }));
    fixtureUser.id = user.id;
    fixtureUser.passhash = user.password;
  });

  test('Login', async () => {
    const { statusCode, cookies } = await app.server.inject({
      method: 'POST',
      url: '/session',
      payload: { data: userData },
    });

    expect(statusCode).toEqual(constants.HTTP_STATUS_FOUND);
    expect(cookies).toEqual(expect.arrayContaining([expect.objectContaining({
      name: expect.any(String),
      value: expect.any(String),
      path: expect.any(String),
    })]));
    setCookie(fixtureUser, cookies);
  });

  test('Update', async () => {
    const { cookies, id } = fixtureUser;
    const newPassword = userPassword.split('').reverse().join('');

    const { statusCode } = await app.server.inject({
      method: 'PATCH',
      url: `/users/${id}`,
      payload: { data: mergeData(userFields, newPassword) },
      cookies,
    });

    expect(statusCode).toEqual(constants.HTTP_STATUS_FOUND);
  });

  test('DB user updated', async () => {
    const user = await User.query().findOne({ email: userFields.email });

    expect(user.id).toEqual(fixtureUser.id);
    expect(user.password).not.toEqual(fixtureUser.passhash);
    fixtureUser.passhash = user.password;
  });

  test('Logout', async () => {
    const { statusCode } = await app.server.inject({
      method: 'DELETE',
      url: '/session',
      cookies: fixtureUser.cookies,
    });

    expect(statusCode).toEqual(constants.HTTP_STATUS_FOUND);
  });

  test('Update logout', async () => {
    const { cookies, id } = fixtureUser;
    const newPassword = userPassword.split('').reverse().join('');

    await app.server.inject({
      method: 'PATCH',
      url: `/users/${id}`,
      payload: { data: mergeData(userFields, newPassword) },
      cookies,
    });
    const user = await User.query().findOne({ email: userFields.email });

    expect(user.password).toEqual(fixtureUser.passhash);
    fixtureUser.password = newPassword;
  });

  test('Delete user', async () => {
    const { cookies } = await app.server.inject({
      method: 'POST',
      url: '/session',
      payload: { data: mergeData(fixtureUser.fields, fixtureUser.password) },
    });
    setCookie(fixtureUser, cookies);

    const { statusCode } = await app.server.inject({
      method: 'DELETE',
      url: `/users/${fixtureUser.id}`,
      cookies: fixtureUser.cookies,
    });

    expect(statusCode).toEqual(constants.HTTP_STATUS_FOUND);
  });

  test('DB user deleted', async () => {
    const userByEmail = await User.query().findOne({ email: userFields.email });
    expect(userByEmail).toBeFalsy();

    const userById = await User.query().findById(fixtureUser.id);
    expect(userById).toBeFalsy();
  });
});

// TODO написать негативные кейсы
