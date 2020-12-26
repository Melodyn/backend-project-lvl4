exports.up = function up(knex) {
  return knex.schema.createTable('labels', (tableBuilder) => {
    tableBuilder.increments('id');
    tableBuilder.string('name', 255).unique().notNullable();
    tableBuilder.timestamps(true, true);
  });
};

exports.down = function down(knex) {
  return knex.schema.dropTable('labels');
};
