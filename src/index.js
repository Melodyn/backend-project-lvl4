import fastify from 'fastify';
import Rollbar from 'rollbar';

export default (config) => {
  const { ROLLBAR_PSI_TOKEN, IS_TEST_ENV } = config;
  const rollbar = new Rollbar(ROLLBAR_PSI_TOKEN);
  const server = fastify({ logger: !IS_TEST_ENV });

  return server
    .get('/', (req, res) => {
      const { name } = req.query;
      if (!name) throw new Error('AaaaaaaaaaaAAAAaAAaAAaAaAAA!!!!1!!!1!!!!!!!!!!!1111');
      if (name === 'Kitty') throw new Error('I need a pussy, not kitty!');
      res.send(`Hello, ${name}!`);
    })
    .setErrorHandler((err, req, res) => {
      server.log.error(err.message);
      if (IS_TEST_ENV) rollbar.errorHandler()(err, req, res);
      res.send(err);
    });
};
