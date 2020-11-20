#!/usr/bin/env node

import createApp from '../server/index.js';

createApp(process.env.NODE_ENV)
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
