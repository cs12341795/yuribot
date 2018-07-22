
exports.up = async function(knex, Promise) {
  await knex.schema.createTable('tasks', function (table) {
    table.increments('id');
    table.integer('status').defaultTo(0);
    table.string('author');
    table.string('platform');
    table.jsonb('param');
    table.string('response');
    table.timestamps(false, true);

    table.index(['created_at']);
    table.index(['status', 'created_at']);
  });
};

exports.down = async function(knex, Promise) {
  await knex.schema.dropTableIfExists('tasks');
};
