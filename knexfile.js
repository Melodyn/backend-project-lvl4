export default {
  client: process.env.DB_TYPE,
  useNullAsDefault: true,
  connection: {
    filename: process.env.DB_NAME,
  },
  migrations: {
    tableName: 'migrations',
  },
};
