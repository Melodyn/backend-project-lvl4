import createApp from './server/index.js';

export default () => ({
  listen: (port, host, cb = () => {}) => createApp('hexlet', { port, host, cb })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    }),
});
