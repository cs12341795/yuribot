import { Client, Guild, TextChannel } from 'discord.js';
import { ITaskHandler, ITask, IChannel, IMessage } from './types';

export interface IDiscordDao {
  getGuild(guildId: string): Promise<Guild>;
  listTextChannels(guildId: string): Promise<Array<IChannel>>;
  getTextChannel(guildId: string, channelId: string): Promise<IChannel>;
  deleteMessage(channelId:string, messageId: string): Promise<IMessage>;
}

export interface IDiscordChannelFactory {
  (guild: Guild, data: any): IChannel
}
export interface IDiscordTask extends ITask {
  param: {
    content: string;
    guild: {
      id: string;
      name: string;
    };
    channel: {
      id: string;
      name: string;
    };
  }
}

export default class DiscordDao implements IDiscordDao, ITaskHandler {
  private client: Client;
  private channelFactory: IDiscordChannelFactory;

  constructor(client: Client, channelFactory?: IDiscordChannelFactory) {
    this.client = client;
    if (channelFactory) {
      this.channelFactory = channelFactory;
    } else {
      this.channelFactory = (guild, data) => new TextChannel(guild, data);
    }
  }

  async getGuild(id: string): Promise<Guild> {
    if (!this.client.guilds.has(id)) {
      throw new Error(`Guild ${id} not found`);
    }
    return this.client.guilds.get(id) as Guild;
  }

  async listTextChannels(guildId: string) {
    const guild = await this.getGuild(guildId);
    return guild.channels
      .filter(c => c.type === 'text')
      .map(c => this.channelFactory(guild, c)).sort((a, b) => a.position - b.position);
  }

  async getTextChannel(guildId: string, channelId: string) {
    const channels = await this.listTextChannels(guildId);
    for (let c of channels) {
      if (c.id === channelId) return c;
    }

    throw new Error(`Channel ${channelId} not found`);
  }

  async deleteMessage(channelId: string, messageId: string) {
    const channel = this.client.channels.get(channelId);
    if(!(channel instanceof TextChannel))
      throw new Error(`TextChannel ${channelId} not found`);
    const message = await (<TextChannel>channel).fetchMessage(messageId);
    if(!message) throw new Error(`Message ${messageId} in Channel ${channelId} not found`);
    return await message.delete();
  }

  async handleTask(task: IDiscordTask) {
    if (task.platform !== 'discord') {
      throw new Error(`Task ${task.id} not for discord`);
    }
    const channel = await this.getTextChannel(task.param.guild.id, task.param.channel.id);
    return await channel.send(task.param.content);
  }
}
