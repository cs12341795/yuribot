import * as Knex from 'knex';
import * as Discord from 'discord.js';
import axios from 'axios';
import config from '../config';
import logger from '../logger';
import DiscordDao from '../dao/discord';
import KnexTaskDao from '../dao/task';
import TimerScheduler from '../scheduler/timer';
import KoaApp from './koa';

const client = new Discord.Client();
const discordDao = new DiscordDao(client);
const knex = Knex(config.knex);
const taskDao = new KnexTaskDao(knex);
const scheduler = new TimerScheduler(taskDao, discordDao);
scheduler.start();

const makeItAlive = async (url: string) => {
  try {
    await axios.get(url);
    logger.info('makeItAlive success');
  } catch (err) {
    if (err.response) {
      logger.error('makeItAlive error', err.response.status, err.response.data);
    } else {
      logger.error('makeItAlive error', err);
    }
  }
};
//10min
if (config.server.pingPath) {
  setInterval(makeItAlive, 10 * 60 * 1000, config.server.pingPath);
}

client.on('ready', async () => {
  logger.info('Discord client is ready');
});

client.login(config.discord.bot.token).catch(err => {
  logger.error(`Discord client fail to login`, err);
  process.exit(1);
});

const app = new KoaApp({
  taskDao,
  discordDao,
  scheduler,
  bypassLogin: false,
  healthChecker: async () => {
    // DISCONNECTED https://github.com/discordjs/discord.js/blob/master/src/util/Constants.js
    if (client.status === 5) throw 'discord disconnected';

    try {
      await knex.raw('select 1');
    } catch (err) {
      throw 'knex disconnected';
    }
  }
});

const server = app.listen(config.server.port, config.server.host);

export default server;
