import path from 'path';
import fastify from 'fastify';
import fastifyStatic from 'fastify-static';
import Rollbar from 'rollbar';
import knex from 'knex';
import models from '../models/index.js';
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
    DB_TYPE, DB_NAME, DB_USER, DB_PASS, DB_HOST,
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
    },
  };

  const db = knex({
    client: DB_TYPE,
    connection: databaseConnectionsByClient[DB_TYPE],
    useNullAsDefault: true,
    debug: true,
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

/**
 * @param {string} staticDir
 * @param {FastifyInstance} server
 */
const setStatic = (staticDir, server) => {
  server.register(fastifyStatic, {
    root: path.resolve(staticDir),
  });
};

/**
 * @param {Config} config
 * @param {FastifyInstance} server
 */
const setRollbar = (config, server) => {
  const rollbar = new Rollbar({
    enabled: !config.IS_TEST_ENV,
    accessToken: config.ROLLBAR_PSI_TOKEN,
  });

  server.setErrorHandler((err, req, res) => {
    rollbar.errorHandler()(err, req, res, (error) => res.send(error));
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

  setStatic(config.STATIC_DIR, server);
  setRollbar(config, server);

  await database.migrate.latest();
  await server.listen(config.PORT, config.HOST);

  process.on('SIGTERM', async () => {
    console.log('Stop app');
    await database.destroy();
    await server.close();
    console.log('App stopped');
    process.exit(0);
  });
};

export default app;
