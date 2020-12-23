exports.up = function up(knex) {
  return knex.schema.createTable('tasks', (tableBuilder) => {
    tableBuilder.increments('id');
    tableBuilder.string('name', 255).unique().notNullable();
    tableBuilder.string('description', 255).defaultTo('');

    tableBuilder.integer('status_id').unsigned().notNullable();
    tableBuilder.foreign('status_id').references('id').inTable('statuses');

    tableBuilder.integer('creator_id').unsigned().notNullable();
    tableBuilder.foreign('creator_id').references('id').inTable('users');

    tableBuilder.integer('executor_id').unsigned();
    tableBuilder.foreign('executor_id').references('id').inTable('users');

    tableBuilder.timestamps(true, true);
  });
};

exports.down = function down(knex) {
  return knex.schema.dropTable('tasks');
};
