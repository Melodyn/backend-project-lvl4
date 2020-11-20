exports.up = function up(knex) {
  return knex.schema.createTable('users', (tableBuilder) => {
    tableBuilder.increments('id');
    tableBuilder.string('email', 255).unique().notNullable();
    tableBuilder.string('firstName', 255).notNullable();
    tableBuilder.string('lastName', 255).notNullable();
    tableBuilder.string('password', 255).notNullable();
  });
};

exports.down = function down(knex) {
  return knex.schema.dropTable('users');
};
