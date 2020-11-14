import path from 'path';
import fastify from 'fastify';
import fastifyStatic from 'fastify-static';
import Rollbar from 'rollbar';
import loadConfig from './utils/configLoader.js';

class App {
  constructor(config) {
    this.config = loadConfig(config);
    this.setServer();
    this.setStatic();
    this.setRoutes();
    this.setRollbar();
  }

  get server() {
    return this.appServer;
  }

  start() {
    const { PORT, HOST } = this.config;

    this.appServer.listen(PORT, HOST);
  }

  stop() {
    this.appServer.close();
  }

  setServer() {
    this.appServer = fastify({
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
        res.send(`Hello, ${name}!`);
      });
  }

  setRollbar() {
    const { ROLLBAR_PSI_TOKEN, IS_TEST_ENV } = this.config;
    const rollbar = new Rollbar({
      enabled: !IS_TEST_ENV,
      accessToken: ROLLBAR_PSI_TOKEN,
    });

    this.server.setErrorHandler((err, req, res) => {
      rollbar.errorHandler()(err, req, res);
      res.send(err);
    });
  }
}

export default App;
