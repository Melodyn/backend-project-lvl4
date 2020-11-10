import yup from 'yup';

export const validateConfig = (config) => {
  const checkEnv = (expected) => (current, schema) => schema.default(current === expected);

  const schema = yup.object().shape({
    NODE_ENV: yup.string().oneOf(['test', 'local', 'prod']).required(),
    HOST: yup.string().required(),
    PORT: yup.number().required(),
    ROLLBAR_PSI_TOKEN: yup.string().required(),
    IS_TEST_ENV: yup.boolean().when('NODE_ENV', checkEnv('test')),
    IS_LOCAL_ENV: yup.boolean().when('NODE_ENV', checkEnv('local')),
    IS_PROD_ENV: yup.boolean().when('NODE_ENV', checkEnv('prod')),
  });

  return schema.validateSync(config, { abortEarly: false });
};

export const noop = () => {};
