
exports.up = async function(knex, Promise) {
  await knex.schema.alterTable('tasks', function (table) {
    table.string('message_id');
  });
};

exports.down = async function(knex, Promise) {
  await knex.schema.alterTable('tasks', function (table) {
    table.dropColumn('message_id');
  });
};
