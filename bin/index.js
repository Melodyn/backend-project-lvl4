#!/usr/bin/env node

import dotenv from 'dotenv';
import App from '../index.js';

try {
  const config = process.env.NODE_ENV === 'production'
    ? process.env
    : dotenv.config().parsed;
  const app = new App(config);
  app.start();
} catch (err) {
  console.error(err);
  process.exit(1);
}
