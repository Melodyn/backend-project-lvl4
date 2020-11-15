// @ts-check

import dotenv from 'dotenv';
import yup from 'yup';

const envs = {
  test: 'test',
  dev: 'development',
  prod: 'production',
};

const readFromFile = (path) => dotenv.config({ path }).parsed;
const configByEnv = {
  [envs.test]: readFromFile('test.config'),
  [envs.dev]: readFromFile('development.env'),
  [envs.prod]: process.env,
};

const checkEnv = (expected) => (current, schema) => schema.default(current === expected);
const configSchema = yup.object({
  NODE_ENV: yup.string().oneOf(Object.values(envs)).required(),
  HOST: yup.string().required(),
  PORT: yup.number().required(),
  LOG_LEVEL: yup.string().required(),
  ROLLBAR_PSI_TOKEN: yup.string().required(),
  IS_TEST_ENV: yup.boolean().when('NODE_ENV', checkEnv(envs.test)).required(),
  IS_DEV_ENV: yup.boolean().when('NODE_ENV', checkEnv(envs.dev)).required(),
  IS_PROD_ENV: yup.boolean().when('NODE_ENV', checkEnv(envs.prod)).required(),
}).required();

export default (envName) => {
  try {
    return configSchema.validateSync(configByEnv[envName], { abortEarly: false });
  } catch (err) {
    const errorsString = ['Config validation error:', ...err.errors].join('\n');
    throw new Error(errorsString);
  }
};
