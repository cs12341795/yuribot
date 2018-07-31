import * as Knex from 'knex';
import * as Discord from 'discord.js';
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

/**********/
//TODO ping server to make it alive
const request = require('request');
const makeItAlive = (url:string) =>
{
  request.get
  (
    url,
    { json: { key: 'value' } },
    (err:any, response:any, body:any) =>
    {
      console.log(`send a post to ${url}`);
      if(!err && response.statusCode == 200)
        console.log(`OK`);
      else
        console.log(`return code: ${response.statusCode}`);
    }
  );
};
//10min
setInterval(makeItAlive, 600000, 'https://yuri-2018-04-21.herokuapp.com');
/**********/

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
