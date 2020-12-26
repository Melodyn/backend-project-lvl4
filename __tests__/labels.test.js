import { constants } from 'http2';
import createApp from '../server/index.js';
import users from '../__fixtures__/users.js';
import labels from '../__fixtures__/labels.js';
import { Label } from '../models/Label.js';

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
  const fixtureUser = { ...(users.helloWorld) };
  const { fields: userFields, password: userPassword } = fixtureUser;
  const userData = { ...userFields, password: userPassword };

  const fixtureLabelFeature = labels.feature;
  const fixtureLabelBug = labels.bug;

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
      url: '/labels',
      payload: { data: { name: fixtureLabelFeature.name } },
      cookies: fixtureUser.cookies,
    });

    expect(statusCode).toEqual(constants.HTTP_STATUS_FOUND);
  });

  test('DB label created', async () => {
    const label = await Label.query().findOne({ name: fixtureLabelFeature.name });

    expect(label).toEqual(expect.objectContaining({
      id: expect.any(Number),
      name: expect.any(String),
      created_at: expect.any(String),
    }));
    expect(label.name).toEqual(fixtureLabelFeature.name);
    fixtureLabelFeature.id = label.id;
  });

  test('Update', async () => {
    const { statusCode } = await app.server.inject({
      method: 'PATCH',
      url: `/labels/${fixtureLabelFeature.id}`,
      payload: { data: { name: fixtureLabelBug.name } },
      cookies: fixtureUser.cookies,
    });

    expect(statusCode).toEqual(constants.HTTP_STATUS_FOUND);
  });

  test('DB label updated', async () => {
    const labelByName = await Label.query().findOne({ name: fixtureLabelFeature.name });
    const labelById = await Label.query().findById(fixtureLabelFeature.id);

    expect(labelByName).toBeFalsy();
    expect(labelById.name).toEqual(fixtureLabelBug.name);
    fixtureLabelFeature.name = labelById.name;
  });

  test('Delete', async () => {
    const { statusCode } = await app.server.inject({
      method: 'DELETE',
      url: `/labels/${fixtureLabelFeature.id}`,
      cookies: fixtureUser.cookies,
    });

    expect(statusCode).toEqual(constants.HTTP_STATUS_FOUND);
  });

  test('DB label deleted', async () => {
    const labelByName = await Label.query().findOne({ name: fixtureLabelFeature.name });
    expect(labelByName).toBeFalsy();

    const labelById = await Label.query().findById(fixtureLabelFeature.id);
    expect(labelById).toBeFalsy();
  });
});

// TODO написать негативные кейсы
