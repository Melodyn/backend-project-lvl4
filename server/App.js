import path from 'path';
import fastify from 'fastify';
import fastifyStatic from 'fastify-static';
import Rollbar from 'rollbar';
import knex from 'knex';
import User, { userValidator } from '../models/User.js';
import loadConfig from './utils/configLoader.js';

class App {
  constructor(envName) {
    this.config = loadConfig(envName);
    this.server = this.initServer();
    this.setStatic();
    this.setRoutes();
    this.setRollbar();
    this.database = this.setDatabase();
  }

  start() {
    const { PORT, HOST } = this.config;

    this.server.listen(PORT, HOST);
  }

  stop() {
    this.server.close();
  }

  initServer() {
    return fastify({
      logger: {
        prettyPrint: this.config.IS_DEV_ENV,
        level: this.config.LOG_LEVEL,
      },
    });
  }

  setStatic() {
    this.server.register(fastifyStatic, {
      root: path.resolve('dist'),
    });
  }

  setRoutes() {
    this.server
      .get('/', (req, res) => {
        res.sendFile('index.html');
      })
      .get('/api', (req, res) => {
        const { name } = req.query;
        if (!name) throw new Error('AaaaaaaaaaaAAAAaAAaAAaAaAAA!!!!1!!!1!!!!!!!!!!!1111');
        if (name === 'Kitty') throw new Error('I need a pussy, not kitty!');
        return `Hello, ${name}!`;
      })
      .get('/users/insert', (req, res) => {
        const data = userValidator.validateSync(req.query);
        return this.database.User.query().insert(data);
      })
      .get('/users', (req, res) => this.database.User.query());
  }

  setRollbar() {
    const rollbar = new Rollbar({
      enabled: !this.config.IS_TEST_ENV,
      accessToken: this.config.ROLLBAR_PSI_TOKEN,
    });

    this.server.setErrorHandler((err, req, res) => {
      rollbar.errorHandler()(err, req, res, (error) => res.send(error));
    });
  }

  setDatabase() {
    const {
      DB_TYPE, DB_NAME, DB_USER, DB_PASS, DB_HOST,
    } = this.config;

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
    });
    User.knex(db);

    return { User };
  }
}

export default App;
