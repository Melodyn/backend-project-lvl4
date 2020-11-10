#!/usr/bin/env node

import createApp from '../index.js';

try {
  const app = createApp(process.env.NODE_ENV);
  app.start();
} catch (err) {
  console.error(err);
  process.exit(1);
}
