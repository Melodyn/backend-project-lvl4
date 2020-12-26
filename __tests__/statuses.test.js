/* eslint-disable no-param-reassign */
import { constants } from 'http2';
import createApp from '../server/index.js';
import users from '../__fixtures__/users.js';
import statuses from '../__fixtures__/statuses.js';
import { Status } from '../models/Status.js';

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

  const fixtureStatusBacklog = statuses.backlog;
  const fixtureStatusToDo = statuses.todo;

  beforeAll(async () => {
    // sign up
    await app.server.inject({
      method: 'POST',
      url: '/users',
      payload: { data: userData },
    });

    // sign in
    const { cookies } = await app.server.inject({
      method: 'POST',
      url: '/session',
      payload: { data: userData },
    });

    setCookie(fixtureUser, cookies);
  });

  test('Create', async () => {
    const { statusCode } = await app.server.inject({
      method: 'POST',
      url: '/statuses',
      payload: { data: { name: fixtureStatusBacklog.name } },
      cookies: fixtureUser.cookies,
    });

    expect(statusCode).toEqual(constants.HTTP_STATUS_FOUND);
  });

  test('DB status created', async () => {
    const status = await Status.query().findOne({ name: fixtureStatusBacklog.name });

    expect(status).toEqual(expect.objectContaining({
      id: expect.any(Number),
      name: expect.any(String),
      created_at: expect.any(String),
    }));
    expect(status.name).toEqual(fixtureStatusBacklog.name);
    fixtureStatusBacklog.id = status.id;
  });

  test('Update', async () => {
    const { statusCode } = await app.server.inject({
      method: 'PATCH',
      url: `/statuses/${fixtureStatusBacklog.id}`,
      payload: { data: { name: fixtureStatusToDo.name } },
      cookies: fixtureUser.cookies,
    });

    expect(statusCode).toEqual(constants.HTTP_STATUS_FOUND);
  });

  test('DB status updated', async () => {
    const statusByName = await Status.query().findOne({ name: fixtureStatusBacklog.name });
    const statusById = await Status.query().findById(fixtureStatusBacklog.id);

    expect(statusByName).toBeFalsy();
    expect(statusById.name).toEqual(fixtureStatusToDo.name);
    fixtureStatusBacklog.name = statusById.name;
  });

  test('Delete', async () => {
    const { statusCode } = await app.server.inject({
      method: 'DELETE',
      url: `/statuses/${fixtureStatusBacklog.id}`,
      cookies: fixtureUser.cookies,
    });

    expect(statusCode).toEqual(constants.HTTP_STATUS_FOUND);
  });

  test('DB status deleted', async () => {
    const statusByName = await Status.query().findOne({ name: fixtureStatusBacklog.name });
    expect(statusByName).toBeFalsy();

    const statusById = await Status.query().findById(fixtureStatusBacklog.id);
    expect(statusById).toBeFalsy();
  });
});

// TODO написать негативные кейсы
