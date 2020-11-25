import { promises as fs } from 'fs';
import { constants } from 'http2';
import createApp from '../server/index.js';
import users from '../__fixtures__/users';

let app;

const setCookie = (user, cookies) => {
  user.cookies = cookies.reduce((acc, { name, value }) => ({ ...acc, [name]: value }), {});
};

beforeAll(async () => {
  app = await createApp(process.env.NODE_ENV);
});

afterAll(async () => {
  if (app) await app.stop();
  await fs.unlink(process.env.DB_NAME);
});

describe('Positive cases', () => {
  const fixtureUser = { ...(users.helloWorld) };
  const { cookies: defaultCookies, ...userWithPass } = fixtureUser;
  const { password, ...userWithoutPass } = userWithPass;

  test('Create', async () => {
    const { statusCode } = await app.server.inject({
      method: 'POST',
      url: '/users',
      payload: userWithPass,
    });

    expect(statusCode).toEqual(constants.HTTP_STATUS_CREATED);
  });

  test('Login', async () => {
    const { statusCode, cookies } = await app.server.inject({
      method: 'POST',
      url: '/login',
      payload: userWithPass,
    });

    expect(statusCode).toEqual(constants.HTTP_STATUS_OK);
    expect(cookies).toEqual(expect.arrayContaining([expect.any(Object)]));
    setCookie(fixtureUser, cookies);
    expect(fixtureUser.cookies).toEqual(expect.objectContaining({
      id: expect.any(String),
      token: expect.any(String),
    }));
  });

  test('Update', async () => {
    const { cookies } = fixtureUser;
    const newPassword = password.split('').reverse().join('');

    const { statusCode, body } = await app.server.inject({
      method: 'PATCH',
      url: `/users/${cookies.id}`,
      payload: {
        ...userWithoutPass,
        password: newPassword,
      },
      cookies,
    });

    expect(statusCode).toEqual(constants.HTTP_STATUS_NO_CONTENT);
    expect(body).toBeFalsy();
  });
});

describe('Negative cases', () => {
  const kittyUser = { ...users.helloKitty };
  const { cookies: kittyCookies, ...kittyWithPass } = kittyUser;
  const { password: kittyPass, ...kittyWithoutPass } = kittyWithPass;

  const cruelUser = { ...users.cruelWorld };
  const { cookies: userCookies, ...cruelWithPass } = cruelUser;
  const { password: cruelPass, ...cruelWithoutPass } = cruelWithPass;

  test.each([
    ['Prepare create', kittyUser, constants.HTTP_STATUS_CREATED],
    ['Prepare create', cruelWithPass, constants.HTTP_STATUS_CREATED],
    ['Create exists user', cruelWithPass, constants.HTTP_STATUS_BAD_REQUEST],
    ['Create without password', cruelWithoutPass, constants.HTTP_STATUS_BAD_REQUEST],
  ])('%s', async (caseName, payload, expectedCode) => {
    const { statusCode } = await app.server.inject({
      method: 'POST',
      url: '/users',
      payload,
    });

    expect(statusCode).toEqual(expectedCode);
  });

  // TODO написать негативные кейсы с куками
});
