import config from './config';

module.exports = {
  development: config.knex,
  production: config.knex
};