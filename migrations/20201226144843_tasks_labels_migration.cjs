exports.up = function up(knex) {
  return knex.schema.createTable('tasks_labels', (tableBuilder) => {
    tableBuilder.increments('id');

    tableBuilder.integer('taskId').unsigned().notNullable();
    tableBuilder.foreign('taskId').references('id').inTable('tasks');

    tableBuilder.integer('labelId').unsigned().notNullable();
    tableBuilder.foreign('labelId').references('id').inTable('labels');
  });
};

exports.down = function down(knex) {
  return knex.schema.dropTable('tasks_labels');
};
