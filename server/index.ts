import * as Discord from 'discord.js';
import config from '../config';
import logger from '../logger';
import DiscordDao from '../dao/discord';

const client = new Discord.Client();

client.on('ready', async () => {
  logger.info('Discord client is ready');
  // use discord dao
  // const dao = new DiscordDao(client);
  // const channel = await dao.getTextChannel('guildId', 'channelId');
  // const resp = await channel.send('hihi~~ I am yuribot!');
});

client.login(config.discord.token).catch(err => {
  logger.error(`Discord client fail to login`, err);
  process.exit(1);
});
