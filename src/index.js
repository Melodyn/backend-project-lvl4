import fastify from 'fastify';

export default () => fastify()
  .get('/', (req, res) => {
    res.send('Hello!');
  });
