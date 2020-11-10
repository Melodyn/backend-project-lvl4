import yup from 'yup';

export const validateConfig = (config) => {
  const checkEnv = (expected) => (current, schema) => schema.default(current === expected);

  const schema = yup.object().shape({
    NODE_ENV: yup.string().oneOf(['test', 'local', 'production']).required(),
    HOST: yup.string().required()
      .when('NODE_ENV', {
        is: 'production',
        then: yup.string().matches('0.0.0.0').required(),
        otherwise: yup.string().required(),
      }),
    PORT: yup.number().required(),
    ROLLBAR_PSI_TOKEN: yup.string().required(),
    IS_TEST_ENV: yup.boolean().when('NODE_ENV', checkEnv('test')),
    IS_LOCAL_ENV: yup.boolean().when('NODE_ENV', checkEnv('local')),
    IS_PROD_ENV: yup.boolean().when('NODE_ENV', checkEnv('production')),
  });

  try {
    return schema.validateSync(config, { abortEarly: false });
  } catch (err) {
    const errorsString = ['Config validation error:', ...err.errors].join('\n');
    throw new Error(errorsString);
  }
};

export const noop = () => {};
