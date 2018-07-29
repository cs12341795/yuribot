import { Client, Collection } from 'discord.js';
import DiscordDao from '../discord';
import { IChannel } from '../types';

const mockChannel = jest.fn<IChannel>(impl => impl);
const mockClient = jest.fn<Client>(() => {
  return {
    guilds: new Collection([
      ['1', {
        id: '1',
        name: '1',
        channels: new Collection([
          ['1', { id: '1', name: '1', type: 'text' }],
          ['2', { id: '2', name: '2', type: 'text' }],
          ['3', { id: '3', name: '3', type: 'none' }]
        ])
      }],
    ])
  }
});
const dao = new DiscordDao(new mockClient(), (guild, data) => {
  return new mockChannel(Object.assign({
    send: async (msg) => msg
  }, data));
});

describe('DiscordDao', () => {
  test('getGuild', async () => {
    let guild = await dao.getGuild('1');
    expect(guild.id).toBe('1');
    expect(guild.name).toBe('1');
  });

  test('listTextChannels', async () => {
    let channels = await dao.listTextChannels('1');
    expect(channels.length).toBe(2);
    expect(dao.listTextChannels('2')).rejects.toThrow('Guild 2 not found');
  });

  test('getTextChannel', async () => {
    let channel = await dao.getTextChannel('1', '1');
    expect(channel.id).toBe('1');
    expect(channel.name).toBe('1');
    expect(dao.getTextChannel('2', '3')).rejects.toThrow('Guild 2 not found');
    expect(dao.getTextChannel('1', '3')).rejects.toThrow('Channel 3 not found');
  });

  test('handleTask', async () => {
    let task = {
      id: 1,
      platform: 'discord',
      param: {
        content: 'hahaha',
        guild: { id: '1', name: '1' },
        channel: { id: '1', name: '1' }
      }
    }
    let resp = await dao.handleTask(task);
    expect(resp).toBe('hahaha');
  });
});