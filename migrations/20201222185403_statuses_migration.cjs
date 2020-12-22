exports.up = function up(knex) {
  return knex.schema.createTable('statuses', (tableBuilder) => {
    tableBuilder.increments('id');
    tableBuilder.string('name', 255).unique().notNullable();
    tableBuilder.timestamps(true, true);
  });
};

exports.down = function down(knex) {
  return knex.schema.dropTable('statuses');
};
