import path from 'path';
import qs from 'querystring';
import { constants } from 'http2';
// fastify
import fastifyFormbody from 'fastify-formbody';
import fastifyStatic from 'fastify-static';
import fastifyCookie from 'fastify-cookie';
import fastifyAuth from 'fastify-auth';
import fastify from 'fastify';
// libs
import pointOfView from 'point-of-view';
import pug from 'pug';
import Rollbar from 'rollbar';
import knex from 'knex';
import i18next from 'i18next';
import yup, { ValidationError } from 'yup';
// app
import ru from '../locales/ru.js';
import models from '../models/index.js';
import { User } from '../models/User.js';
import routeGroups from '../routes/index.js';
import { loadConfig, configSchema } from './utils/configLoader.js';

/**
 * @typedef { ReturnType<typeof configSchema.validateSync> } Config
 */

/**
 * @typedef {import('fastify').FastifyInstance} FastifyInstance
 */

/**
 * @typedef {import('knex')} Knex
 */

/**
 * @param {Config} config
 * @returns {Knex}
 */
const initDatabase = (config) => {
  const {
    DB_TYPE, DB_NAME, DB_USER, DB_PASS, DB_HOST, DB_PORT,
  } = config;

  const databaseConnectionsByClient = {
    sqlite3: {
      filename: DB_NAME,
    },
    pg: {
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASS,
      database: DB_NAME,
      port: DB_PORT,
    },
  };

  const db = knex({
    client: DB_TYPE,
    connection: databaseConnectionsByClient[DB_TYPE],
    useNullAsDefault: true,
    migrations: {
      tableName: 'migrations',
    },
  });
  models.forEach((model) => model.knex(db));

  return db;
};

/**
 * @param {Config} config
 * @returns {FastifyInstance}
 */
const initServer = (config) => fastify({
  logger: {
    prettyPrint: config.IS_DEV_ENV,
    level: config.LOG_LEVEL,
  },
});

const setInternalization = (config) => i18next.init({
  lng: 'ru',
  debug: config.IS_DEV_ENV,
  resources: {
    ru,
  },
});

/**
 * @param {string} staticDir
 * @param {FastifyInstance} server
 */
const setStatic = (staticDir, server) => {
  const formFieldRegex = new RegExp('data\\[(?<field>(.+))\\]');
  server.register(fastifyFormbody, {
    parser: (str) => {
      const parsed = qs.parse(str);
      return Object.entries(parsed).reduce((acc, [key, value]) => {
        const formFields = key.match(formFieldRegex);
        if (!formFields) {
          const { data } = acc;
          acc[key] = value;
          acc.data = data;
          return acc;
        }
        const { field } = formFields.groups;
        acc.data[field] = value;
        return acc;
      }, { data: {} });
    },
  });
  server.register(fastifyStatic, {
    root: path.resolve(staticDir),
  });
  server.register(pointOfView, {
    engine: {
      pug,
    },
    defaultContext: {
      t: i18next.t.bind(i18next),
    },
    includeViewExtension: true,
    templates: path.resolve(staticDir, 'templates'),
  });
};

/**
 * @param {string} secret
 * @param {FastifyInstance} server
 */
const setAuth = (secret, server) => {
  server.decorateRequest('auth', {
    isAuthorized: false,
    user: {},
    errors: {},
  });
  server.register(fastifyCookie, {
    secret,
  });
  server.register(fastifyAuth)
    .after(() => {
      server.addHook('preHandler', server.auth([
        (req) => {
          req.log.debug('Request cookies', req.cookies);
          const { id, token } = yup.object({
            id: yup.number().default(0).optional(),
            token: yup.string().default('').optional(),
          }).required().validateSync(req.cookies);

          if (token === '') return Promise.resolve('ok');

          return User.query().findById(id)
            .then((user) => {
              if (!user) {
                throw new Error(`Not found user with id "${id}"`);
              }
              if (user.password !== token) {
                throw new Error('Incorrect password');
              }

              req.auth = {
                isAuthorized: true,
                user,
              };
            });
        },
      ]));
    });
};

/**
 * @param {FastifyInstance} server
 */
const setRoutes = (server) => {
  routeGroups.forEach((routes) => routes.forEach((route) => server.route(route)));
};

/**
 * @param {Config} config
 * @param {FastifyInstance} server
 */
const setRollbar = (config, server) => {
  const rollbar = new Rollbar({
    enabled: !config.IS_TEST_ENV && !config.IS_DEV_ENV,
    accessToken: config.ROLLBAR_PSI_TOKEN,
  });

  server.setErrorHandler((err, req, res) => {
    server.log.debug(err);
    rollbar.errorHandler()(err, req, res, (error) => {
      if (error instanceof ValidationError) {
        res.code(constants.HTTP_STATUS_BAD_REQUEST).send(error.errors.join('\n'));
        return;
      }
      res.code(constants.HTTP_STATUS_INTERNAL_SERVER_ERROR).send(error.message);
    });
  });
};

const app = async (envName) => {
  process.on('unhandledRejection', (err) => {
    console.error(err);
    process.exit(1);
  });

  const config = loadConfig(envName);
  const database = initDatabase(config);
  const server = initServer(config);

  await setInternalization(config);
  setStatic(config.STATIC_DIR, server);
  setAuth(config.NODE_ENV, server);
  setRoutes(server);
  setRollbar(config, server);

  await database.migrate.latest();
  await server.listen(config.PORT, config.HOST);

  const stop = async () => {
    server.log.info('Stop app', config);
    await database.destroy();
    await server.close();
    server.log.info('App stopped');
    if (!config.IS_TEST_ENV) {
      process.exit(0);
    }
  };

  process.on('SIGTERM', stop);

  return {
    server,
    stop,
  };
};

export default app;
