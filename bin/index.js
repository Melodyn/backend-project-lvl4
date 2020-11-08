#!/usr/bin/env node

import dotenv from 'dotenv';
import App from '../index.js';

try {
  const { parsed: config } = dotenv.config();
  const app = new App(config);
  app.start();
} catch (err) {
  console.error(err);
  process.exit(1);
}
