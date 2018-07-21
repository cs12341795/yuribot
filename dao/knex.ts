import * as Knex from 'knex';
import config from '../config';

export default Knex(config.knex);