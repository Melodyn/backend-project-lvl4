import dotenv from 'dotenv';
import { validateConfig } from './src/utils.js';
import App from './App.js';

const readFromFile = (path) => dotenv.config({ path }).parsed;
const configByEnv = {
  test: readFromFile('test.config'),
  local: readFromFile('local.env'),
  production: process.env,
};

export default (envName) => new App(validateConfig(configByEnv[envName]));
