
exports.up = async function (knex, Promise) {
  await knex.schema.alterTable('tasks', function (table) {
    table.timestamp('publish_at');
    table.dropIndex(['status', 'created_at']);
    table.index(['status', 'publish_at']);
  });
};

exports.down = async function (knex, Promise) {
  await knex.schema.alterTable('tasks', function (table) {
    table.dropIndex(['status', 'publish_at']);
    table.index(['status', 'created_at']);
    table.dropColumn('publish_at');
  });
};
