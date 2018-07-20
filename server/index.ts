import * as Discord from 'discord.js';
import config from './config';
import logger from './logger';

const client = new Discord.Client();

client.on('ready', () => {
  logger.info('Discord client is ready');
});

client.on('message', message => {
  const { author, content } = message;
  logger.info(`${author.username}: ${content}`);
});

client.login(config.discord.token).catch(err => {
  logger.error(`Discord client fail to login`, err);
  process.exit(1);
});

export default client;

/*import * as Koa from 'koa';
const app = new Koa();

app.use(async (ctx) => {
  ctx.set('Content-Type', 'text/plain');
  ctx.body = 'Hello Yuribot';
})

const server = app.listen(config.server.port, config.server.host, () => {
  logger.info(`Server listening on ${config.server.host}:${config.server.port}`);
});

export default server;*/