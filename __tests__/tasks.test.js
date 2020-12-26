/* eslint-disable no-param-reassign */
import { constants } from 'http2';
import createApp from '../server/index.js';
import users from '../__fixtures__/users.js';
import tasks from '../__fixtures__/tasks.js';
import statuses from '../__fixtures__/statuses.js';
import { Task } from '../models/Task.js';
import { Status } from '../models/Status';
import { User } from '../models/User';

let app;

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
  const fixtureUserHello = { ...(users.helloWorld) };
  const { fields: helloUserFields, password: helloUserPass } = fixtureUserHello;
  const helloUserData = { ...helloUserFields, password: helloUserPass };

  const fixtureUserKitty = { ...(users.helloKitty) };
  const { fields: kittyUserFields, password: kittyUserPass } = fixtureUserKitty;
  const kittyUserData = { ...kittyUserFields, password: kittyUserPass };

  const fixtureStatusBacklog = statuses.backlog;
  const fixtureStatusToDo = statuses.todo;

  const fixtureFirstTask = tasks.firstTask;
  const fixtureSecondTask = tasks.secondTask;

  beforeAll(async () => {
    // sign up
    await app.server.inject({
      method: 'POST',
      url: '/users',
      payload: { data: helloUserData },
    });
    await app.server.inject({
      method: 'POST',
      url: '/users',
      payload: { data: kittyUserData },
    });

    // sign in
    const { cookies } = await app.server.inject({
      method: 'POST',
      url: '/session',
      payload: { data: helloUserData },
    });

    setCookie(fixtureUserHello, cookies);
    fixtureUserHello.id = await User.query()
      .findOne({ email: helloUserFields.email })
      .then(({ id }) => id);
    fixtureUserKitty.id = await User.query()
      .findOne({ email: kittyUserFields.email })
      .then(({ id }) => id);

    // create statuses
    await app.server.inject({
      method: 'POST',
      url: '/statuses',
      payload: { data: { name: fixtureStatusBacklog.name } },
      cookies: fixtureUserHello.cookies,
    });
    await app.server.inject({
      method: 'POST',
      url: '/statuses',
      payload: { data: { name: fixtureStatusToDo.name } },
      cookies: fixtureUserHello.cookies,
    });

    // set statuses id
    const backlogStatus = await Status.query().findOne({ name: fixtureStatusBacklog.name });
    const todoStatus = await Status.query().findOne({ name: fixtureStatusToDo.name });
    fixtureStatusBacklog.id = backlogStatus.id;
    fixtureStatusToDo.id = todoStatus.id;
  });

  test('Create without executor and description', async () => {
    const { statusCode } = await app.server.inject({
      method: 'POST',
      url: '/tasks',
      payload: {
        data: {
          name: fixtureFirstTask.name,
          statusId: fixtureStatusBacklog.id,
        },
      },
      cookies: fixtureUserHello.cookies,
    });

    expect(statusCode).toEqual(constants.HTTP_STATUS_FOUND);
  });

  test('DB task created without executor and description', async () => {
    const task = await Task.query().findOne({ name: fixtureFirstTask.name });

    expect(task).toEqual(expect.objectContaining({
      id: expect.any(Number),
      name: expect.any(String),
      statusId: expect.any(Number),
      creatorId: expect.any(Number),
    }));
    expect(task.name).toEqual(fixtureFirstTask.name);
    expect(task.statusId).toEqual(fixtureStatusBacklog.id);
    expect(task.creatorId).toEqual(fixtureUserHello.id);
    fixtureFirstTask.id = task.id;
    fixtureFirstTask.creatorId = task.creatorId;
    fixtureFirstTask.statusId = task.statusId;
  });

  test('Create with executor and description', async () => {
    const { statusCode } = await app.server.inject({
      method: 'POST',
      url: '/tasks',
      payload: {
        data: {
          name: fixtureSecondTask.name,
          description: fixtureSecondTask.description,
          statusId: fixtureStatusToDo.id,
          executorId: fixtureUserKitty.id,
        },
      },
      cookies: fixtureUserHello.cookies,
    });

    expect(statusCode).toEqual(constants.HTTP_STATUS_FOUND);
  });

  test('DB task created with executor and description', async () => {
    const task = await Task.query().findOne({ name: fixtureSecondTask.name });

    expect(task).toEqual(expect.objectContaining({
      id: expect.any(Number),
      description: expect.any(String),
      statusId: expect.any(Number),
      executorId: expect.any(Number),
    }));
    expect(task.name).toEqual(fixtureSecondTask.name);
    expect(task.description).toEqual(fixtureSecondTask.description);
    expect(task.statusId).toEqual(fixtureStatusToDo.id);
    expect(task.creatorId).toEqual(fixtureFirstTask.creatorId);
    expect(task.executorId).toEqual(fixtureUserKitty.id);
    fixtureSecondTask.id = task.id;
    fixtureSecondTask.name = task.name;
    fixtureSecondTask.description = task.description;
    fixtureSecondTask.statusId = task.statusId;
    fixtureSecondTask.creatorId = task.creatorId;
    fixtureSecondTask.executorId = task.executorId;
  });

  test('Update', async () => {
    const { statusCode } = await app.server.inject({
      method: 'PATCH',
      url: `/tasks/${fixtureFirstTask.id}`,
      payload: { data: { statusId: fixtureStatusToDo.id } },
      cookies: fixtureUserHello.cookies,
    });

    expect(statusCode).toEqual(constants.HTTP_STATUS_FOUND);
  });

  test('DB task updated', async () => {
    const taskByName = await Task.query().findOne({ name: fixtureFirstTask.name });

    expect(taskByName.statusId).toEqual(fixtureStatusToDo.id);
    fixtureFirstTask.statusId = taskByName.statusId;
  });

  test('Delete', async () => {
    const { statusCode } = await app.server.inject({
      method: 'DELETE',
      url: `/tasks/${fixtureFirstTask.id}`,
      cookies: fixtureUserHello.cookies,
    });

    expect(statusCode).toEqual(constants.HTTP_STATUS_FOUND);
  });

  test('DB task deleted', async () => {
    const taskByName = await Task.query().findOne({ name: fixtureFirstTask.name });
    expect(taskByName).toBeFalsy();

    const taskById = await Task.query().findById(fixtureFirstTask.id);
    expect(taskById).toBeFalsy();
  });
});

// TODO написать негативные кейсы
