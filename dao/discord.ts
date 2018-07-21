import { Client, Guild, TextChannel } from 'discord.js';

export interface IChannel {
  id: string;
  name: string;
  send(msg: string): Promise<any>;
}

export interface IDiscordDao {
  listTextChannels(guildId: string): Promise<Array<IChannel>>;
  getTextChannel(guildId: string, channelId: string): Promise<IChannel>;
}

export default class DiscordDao implements IDiscordDao {
  private client: Client;

  constructor(client: Client) {
    this.client = client;
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
      .map(c => new TextChannel(guild, c));
  }

  async getTextChannel(guildId: string, channelId: string) {
    const channels = await this.listTextChannels(guildId);
    for (let c of channels) {
      if (c.id === channelId) return c;
    }

    throw new Error(`Channel ${channelId} not found`);
  }
}
