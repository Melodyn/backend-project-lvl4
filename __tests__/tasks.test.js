import { constants } from 'http2';
import createApp from '../server/index.js';
import users from '../__fixtures__/users.js';
import tasks from '../__fixtures__/tasks.js';
import statuses from '../__fixtures__/statuses.js';
import { Task } from '../models/Task.js';
import { Status } from '../models/Status';

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

    // create statuses
    await app.server.inject({
      method: 'POST',
      url: '/statuses',
      payload: { data: { name: fixtureStatusBacklog.name } },
      cookies: fixtureUser.cookies,
    });
    await app.server.inject({
      method: 'POST',
      url: '/statuses',
      payload: { data: { name: fixtureStatusToDo.name } },
      cookies: fixtureUser.cookies,
    });

    // set statuses id
    const backlogStatus = await Status.query().findOne({ name: fixtureStatusBacklog.name });
    const todoStatus = await Status.query().findOne({ name: fixtureStatusToDo.name });
    fixtureStatusBacklog.id = backlogStatus.id;
    fixtureStatusToDo.id = todoStatus.id;
  });

  test('Create', async () => {
    const { statusCode } = await app.server.inject({
      method: 'POST',
      url: '/tasks',
      payload: { data: {} },
      cookies: fixtureUser.cookies,
    });

    expect(statusCode).toEqual(constants.HTTP_STATUS_FOUND);
  });

  // test('DB task created', async () => {
  //   const task = await Task.query().findOne({ name: fixtureTaskBacklog.name });
  //
  //   expect(task).toEqual(expect.objectContaining({
  //     id: expect.any(Number),
  //     name: expect.any(String),
  //     created_at: expect.any(String),
  //   }));
  //   expect(task.name).toEqual(fixtureTaskBacklog.name);
  //   fixtureTaskBacklog.id = task.id;
  // });
  //
  // test('Update', async () => {
  //   const { statusCode } = await app.server.inject({
  //     method: 'PATCH',
  //     url: `/tasks/${fixtureTaskBacklog.id}`,
  //     payload: { data: { name: fixtureTaskToDo.name } },
  //     cookies: fixtureUser.cookies,
  //   });
  //
  //   expect(statusCode).toEqual(constants.HTTP_STATUS_FOUND);
  // });
  //
  // test('DB task updated', async () => {
  //   const taskByName = await Task.query().findOne({ name: fixtureTaskBacklog.name });
  //   const taskById = await Task.query().findById(fixtureTaskBacklog.id);
  //
  //   expect(taskByName).toBeFalsy();
  //   expect(taskById.name).toEqual(fixtureTaskToDo.name);
  //   fixtureTaskBacklog.name = taskById.name;
  // });
  //
  // test('Delete', async () => {
  //   const { statusCode } = await app.server.inject({
  //     method: 'DELETE',
  //     url: `/tasks/${fixtureTaskBacklog.id}`,
  //     cookies: fixtureUser.cookies,
  //   });
  //
  //   expect(statusCode).toEqual(constants.HTTP_STATUS_FOUND);
  // });
  //
  // test('DB task deleted', async () => {
  //   const taskByName = await Task.query().findOne({ name: fixtureTaskBacklog.name });
  //   expect(taskByName).toBeFalsy();
  //
  //   const taskById = await Task.query().findById(fixtureTaskBacklog.id);
  //   expect(taskById).toBeFalsy();
  // });
});

// TODO написать негативные кейсы
