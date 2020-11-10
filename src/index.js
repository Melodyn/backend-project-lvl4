import fastify from 'fastify';
import Rollbar from 'rollbar';

export default (config) => {
  const rollbar = new Rollbar(config.ROLLBAR_PSI_TOKEN);
  return fastify()
    .get('/', (req, res) => {
      const { name } = req.query;
      if (!name) throw new Error('AaaaaaaaaaaAAAAaAAaAAaAaAAA!!!!1!!!1!!!!!!!!!!!1111');
      if (name === 'Kitty') throw new Error('I need a pussy, not kitty!');
      res.send(`Hello, ${name}!`);
    })
    .setErrorHandler((err, req, res) => {
      if (config.NODE_ENV !== 'test') rollbar.errorHandler()(err, req, res);
      res.send(err);
    });
};
