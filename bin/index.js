#!/usr/bin/env node

import app from '../index.js';

try {
  const { PORT = 8080, HOST = '0.0.0.0' } = process.env;

  app().listen(PORT, HOST, () => {
    console.log(`Server is running on http://${HOST}:${PORT}`);
  });
} catch (err) {
  console.error(err);
  process.exit(1);
}
