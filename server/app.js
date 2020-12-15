import path from 'path';
import { constants } from 'http2';
// fastify
import fastifySession from 'fastify-secure-session';
import fastifyMethods from 'fastify-method-override';
import fastifyPass from 'fastify-passport';
import fastifyFormbody from 'fastify-formbody';
import fastifyStatic from 'fastify-static';
import fastify from 'fastify';
import LocalStrategy from 'passport-local';
// libs
import pointOfView from 'point-of-view';
import pug from 'pug';
import Rollbar from 'rollbar';
import knex from 'knex';
import i18next from 'i18next';
import yup, { ValidationError } from 'yup';
// app
import ru from '../locales/ru.js';
import formParser from './utils/formParser.js';
import models from '../models/index.js';
import { User } from '../models/User.js';
import routeGroups from '../routes/index.js';
import { loadConfig, configSchema } from './utils/configLoader.js';

const fastifyPassport = fastifyPass.default;

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
  server.register(fastifyFormbody, { parser: formParser });
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
  server.addHook('preHandler', (req, res, done) => {
    const [errors = {}] = res.flash('error') || [];
    const [values = {}] = res.flash('value') || [];
    const flash = res.flash('flash') || [];
    res.locals = {
      user: {
        ...req.user,
        isAuthenticated: req.isAuthenticated(),
      },
      flash,
      errors,
      values,
    };
    done();
  });
  server.register(fastifyMethods);
};

/**
 * @param {Config} config
 * @param {FastifyInstance} server
 */
const setAuth = (config, server) => {
  const strategy = new LocalStrategy(
    {
      usernameField: 'data[email]',
      passwordField: 'data[password]',
      passReqToCallback: true,
    },
    (req, email, password, done) => {
      if (req.isAuthenticated()) {
        return done(null, req.user);
      }

      return User.query().findOne({ email })
        .then((user) => {
          if (!user) {
            req.flash('error', { email: i18next.t('signin.error.not_found', { email }) });
            req.flash('value', { email });
            return done(null, false);
          }
          if (user.password !== User.hashPassword(password)) {
            req.flash('error', { password: i18next.t('signin.error.password') });
            req.flash('value', { email });
            return done(null, false);
          }

          req.flash('flash', [{ type: 'success', text: i18next.t('signin.success') }]);
          return done(null, user);
        })
        .catch(done);
    },
  );

  server.register(fastifySession, {
    key: Buffer.from(config.COOKIE_SECRET_KEY, 'hex'),
    cookie: {
      path: '/',
    },
  });

  fastifyPassport.use('local', strategy);
  fastifyPassport.registerUserSerializer(async (user) => user);
  fastifyPassport.registerUserDeserializer(async (user) => user);

  server.register(fastifyPassport.initialize());
  server.register(fastifyPassport.secureSession());
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
    enabled: config.IS_PROD_ENV,
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
  setAuth(config, server);
  setStatic(config.STATIC_DIR, server);
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
