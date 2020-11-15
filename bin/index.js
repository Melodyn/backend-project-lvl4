#!/usr/bin/env node

import createApp from '../server/index.js';

let app;

try {
  app = createApp(process.env.NODE_ENV);
  app.start();
} catch (err) {
  console.error(err);
  if (app) app.stop();
  process.exit(1);
}
