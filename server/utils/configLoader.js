import dotenv from 'dotenv';
import yup from 'yup';

const envs = {
  test: 'test',
  hexlet: 'hexlet',
  dev: 'development',
  prod: 'production',
};

const readFromFile = (path) => dotenv.config({ path }).parsed;
const configByEnv = {
  [envs.test]: readFromFile('test.config'),
  [envs.hexlet]: readFromFile('test.config'),
  [envs.dev]: readFromFile('development.env'),
  [envs.prod]: process.env,
};

const checkEnv = (expected) => (current, schema) => schema.default(current === expected);
export const configSchema = yup.object({
  NODE_ENV: yup.string().oneOf(Object.values(envs)).required(),
  IS_TEST_ENV: yup.boolean().when('NODE_ENV', checkEnv(envs.test)).required(),
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

export const loadConfig = (envName) => {
  try {
    return configSchema.validateSync(configByEnv[envName], { abortEarly: false });
  } catch (err) {
    const errorsString = ['Config validation error:', ...err.errors].join('\n');
    throw new Error(errorsString);
  }
};
