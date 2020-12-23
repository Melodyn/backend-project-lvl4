exports.up = function up(knex) {
  return knex.schema.createTable('tasks', (tableBuilder) => {
    tableBuilder.increments('id');
    tableBuilder.string('name', 255).unique().notNullable();
    tableBuilder.string('description', 255).defaultTo('');

    tableBuilder.integer('statusId').unsigned().notNullable();
    tableBuilder.foreign('statusId').references('id').inTable('statuses');

    tableBuilder.integer('creatorId').unsigned().notNullable();
    tableBuilder.foreign('creatorId').references('id').inTable('users');

    tableBuilder.integer('executorId').unsigned();
    tableBuilder.foreign('executorId').references('id').inTable('users');

    tableBuilder.timestamps(true, true);
  });
};

exports.down = function down(knex) {
  return knex.schema.dropTable('tasks');
};
