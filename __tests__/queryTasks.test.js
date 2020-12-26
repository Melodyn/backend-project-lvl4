import qs from 'querystring';
import users from '../__fixtures__/users.js';
import tasks from '../__fixtures__/tasks.js';
import statuses from '../__fixtures__/statuses.js';
import labels from '../__fixtures__/labels.js';
import { Task } from '../models/Task.js';
import { Status } from '../models/Status';
import { User } from '../models/User';
import createApp from '../server/index.js';
import { Label } from '../models/Label';

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

describe('Positive cases query', () => {
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

  const fixtureLabelBug = labels.bug;

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
    const { cookies: helloCookies } = await app.server.inject({
      method: 'POST',
      url: '/session',
      payload: { data: helloUserData },
    });
    const { cookies: kittyCookies } = await app.server.inject({
      method: 'POST',
      url: '/session',
      payload: { data: kittyUserData },
    });

    setCookie(fixtureUserHello, helloCookies);
    setCookie(fixtureUserKitty, kittyCookies);

    fixtureUserHello.id = await User.query()
      .findOne({ email: helloUserFields.email })
      .then(({ id }) => id);
    fixtureUserKitty.id = await User.query()
      .findOne({ email: kittyUserFields.email })
      .then(({ id }) => id);

    // create statuses and labels
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
    await app.server.inject({
      method: 'POST',
      url: '/labels',
      payload: { data: { name: fixtureLabelBug.name } },
      cookies: fixtureUserHello.cookies,
    });

    // set statuses
    const backlogStatus = await Status.query().findOne({ name: fixtureStatusBacklog.name });
    const todoStatus = await Status.query().findOne({ name: fixtureStatusToDo.name });
    const bugLabel = await Label.query().findOne({ name: fixtureLabelBug.name });
    fixtureStatusBacklog.id = backlogStatus.id;
    fixtureStatusToDo.id = todoStatus.id;
    fixtureLabelBug.id = bugLabel.id;

    // create tasks
    await app.server.inject({
      method: 'POST',
      url: '/tasks',
      payload: {
        data: {
          name: fixtureFirstTask.name,
          statusId: fixtureStatusBacklog.id,
          labels: fixtureLabelBug.id,
        },
      },
      cookies: fixtureUserHello.cookies,
    });
    await app.server.inject({
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
      cookies: fixtureUserKitty.cookies,
    });

    // set tasks
    const task1 = await Task.query().findOne({ name: fixtureFirstTask.name });
    fixtureFirstTask.id = task1.id;
    fixtureFirstTask.creatorId = task1.creatorId;
    fixtureFirstTask.statusId = task1.statusId;
    const task2 = await Task.query().findOne({ name: fixtureSecondTask.name });
    fixtureSecondTask.id = task2.id;
    fixtureSecondTask.name = task2.name;
    fixtureSecondTask.description = task2.description;
    fixtureSecondTask.statusId = task2.statusId;
    fixtureSecondTask.creatorId = task2.creatorId;
    fixtureSecondTask.executorId = task2.executorId;
  });

  test('Get all tasks', async () => {
    const result = await app.server.inject({
      method: 'GET',
      url: '/tasks',
      cookies: fixtureUserHello.cookies,
    });

    expect(result.payload.includes(fixtureFirstTask.name)).toEqual(true);
    expect(result.payload.includes(fixtureSecondTask.name)).toEqual(true);
  });

  test('Get creator tasks', async () => {
    const query = qs.encode({
      isCreatorUser: 'on',
      executor: '',
      status: '',
      label: '',
    });

    const result = await app.server.inject({
      method: 'GET',
      url: `/tasks?${query}`,
      cookies: fixtureUserHello.cookies,
    });

    expect(result.payload.includes(fixtureFirstTask.name)).toEqual(true);
    expect(result.payload.includes(fixtureSecondTask.name)).not.toEqual(true);
  });

  test('Get by executor', async () => {
    const query = qs.encode({
      executor: fixtureUserKitty.id,
      isCreatorUser: '',
      status: '',
      label: '',
    });

    const result = await app.server.inject({
      method: 'GET',
      url: `/tasks?${query}`,
      cookies: fixtureUserHello.cookies,
    });

    expect(result.payload.includes(fixtureFirstTask.name)).not.toEqual(true);
    expect(result.payload.includes(fixtureSecondTask.name)).toEqual(true);
  });

  test('Get by status', async () => {
    const query = qs.encode({
      status: fixtureStatusToDo.id,
      isCreatorUser: '',
      executor: '',
      label: '',
    });

    const result = await app.server.inject({
      method: 'GET',
      url: `/tasks?${query}`,
      cookies: fixtureUserHello.cookies,
    });

    expect(result.payload.includes(fixtureFirstTask.name)).not.toEqual(true);
    expect(result.payload.includes(fixtureSecondTask.name)).toEqual(true);
  });

  test('Get by label', async () => {
    const query = qs.encode({
      label: `${fixtureLabelBug.id}`,
      isCreatorUser: '',
      executor: '',
      status: '',
    });

    const result = await app.server.inject({
      method: 'GET',
      url: `/tasks?${query}`,
      cookies: fixtureUserHello.cookies,
    });

    expect(result.payload.includes(fixtureFirstTask.name)).toEqual(true);
    expect(result.payload.includes(fixtureSecondTask.name)).not.toEqual(true);
  });
});

// TODO написать негативные кейсы
