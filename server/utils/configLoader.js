import dotenv from 'dotenv';
import * as yup from 'yup';

export const envs = {
  test: 'test',
  hexlet: 'hexlet',
  dev: 'development',
  prod: 'production',
};

const readFromFile = (path) => dotenv.config({ path }).parsed;
const configByEnv = {
  [envs.test]: readFromFile('test.config'),
  [envs.hexlet]: readFromFile('hexlet.config'),
  [envs.dev]: readFromFile('development.env'),
  [envs.prod]: process.env,
};

const checkEnv = (expected) => (current, schema) => schema.default(current === expected);
const checkTestEnv = (current, schema) => schema
  .default(yup.string().oneOf([envs.test, envs.hexlet]).required().isValidSync(current));

export const configSchema = yup.object({
  NODE_ENV: yup.string().oneOf(Object.values(envs)).required(),
  IS_TEST_ENV: yup.boolean().when('NODE_ENV', checkTestEnv),
  IS_DEV_ENV: yup.boolean().when('NODE_ENV', checkEnv(envs.dev)).required(),
  IS_PROD_ENV: yup.boolean().when('NODE_ENV', checkEnv(envs.prod)).required(),
  STATIC_DIR: yup.string().required(),
  LOG_LEVEL: yup.string().required(),
  ROLLBAR_PSI_TOKEN: yup.string().required(),
  COOKIE_SECRET_KEY: yup.string().required(),
  HOST: yup.string().required(),
  PORT: yup.number().required(),
  DB_TYPE: yup.string().required(),
  DB_HOST: yup.string().required(),
  DB_PORT: yup.number().required(),
  DB_USER: yup.string().required(),
  DB_PASS: yup.string().required(),
  DB_NAME: yup.string().required(),
}).required();

/**
 * @typedef { ReturnType<typeof configSchema.validateSync> } Config
 */

/**
 * @param {string} envName
 * @returns {Config}
 */
export const loadConfig = (envName) => {
  try {
    return configSchema.validateSync(configByEnv[envName], { abortEarly: false });
  } catch (err) {
    const errorsString = ['Config validation error:', ...err.errors].join('\n');
    throw new Error(errorsString);
  }
};
