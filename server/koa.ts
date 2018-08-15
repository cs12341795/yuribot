import * as Koa from 'koa';
import * as bodyParser from 'koa-bodyparser';
import * as Router from 'koa-router';
import * as session from 'koa-session';
import * as Oauth2 from 'simple-oauth2';
import * as ejs from 'ejs';
import axios from 'axios';
import { Server } from 'http';

import config from '../config';
import { ITaskDao } from '../dao/types';
import { IDiscordDao } from '../dao/discord';
import { IScheduler } from '../scheduler/types';

interface IYuriKoaHealtherChecker {
  (): Promise<any>
}

interface IYuriKoaOption {
  taskDao: ITaskDao;
  discordDao: IDiscordDao;
  scheduler: IScheduler;
  bypassLogin: boolean;
  healthChecker: IYuriKoaHealtherChecker
}

interface IRole {
  id: string;
  name: string;
}

export default class YuriKoa {
  private opt: IYuriKoaOption;
  private app: Koa;
  private oauth2: Oauth2.OAuthClient;

  constructor(option: IYuriKoaOption) {
    this.opt = option;
    this.app = new Koa();

    if (!this.opt.bypassLogin) {
      this.oauth2 = Oauth2.create({
        client: {
          id: config.discord.client.id,
          secret: config.discord.client.secret,
        },
        auth: {
          tokenHost: config.discord.auth.tokenHost,
          tokenPath: config.discord.auth.tokenPath,
          authorizePath: config.discord.auth.authorizePath,
          revokePath: config.discord.auth.revokePath
        },
      });
    }

    const router = new Router();
    router.get('/healthz', async ctx => {
      try {
        await this.opt.healthChecker()
      } catch (err) {
        ctx.throw(500, 'healthcheck failed', err);
      }

      ctx.body = 'ok';
    });

    router.get('/discord/callback', async (ctx: Koa.Context) => {
      const { state, code }: { state: string, code: string} = ctx.query;
      if (!ctx.session || ctx.session.state !== state) {
        ctx.throw(400, 'Bad Oauth state');
        return;
      }

      let token: Oauth2.Token | undefined;
      try {
        // get access token from discord
        const result = await this.oauth2.authorizationCode.getToken({
          code: code,
          redirect_uri: config.discord.auth.redirectUrl,
          scope: config.discord.auth.scope
        });
        token = this.oauth2.accessToken.create(result);
        // get user data with access token
        const client = axios.create();
        client.defaults.headers.common['Authorization'] = `${token.token.token_type} ${token.token.access_token}`;
        let user = await client.get('https://discordapp.com/api/users/@me');
        // make sure user is in the guild and get roles at the same time
        let roles = await this.getMemberRoles(user.data.id);
        // make sure user has required roles
        for (let role of roles) {
          if (config.discord.auth.roles.split(' ').indexOf(role.name) !== -1) {
            ctx.session.id = user.data.id;
            ctx.session.username = user.data.username;
            ctx.session.avatar = user.data.avatar;
            ctx.session.discriminator = user.data.discriminator;
            ctx.redirect('/');
            return;
          }
        }
        ctx.throw(401, 'You are not in the guild');
      } catch (err) {
        ctx.throw(401, 'Authentication failed');
      } finally {
        // No need access anymore
        if (token) {
          await token.revoke('access_token');
          await token.revoke('refresh_token');
        }
      }
    });

    router.get('/', this.checkLogin, async (ctx: Koa.Context) => {
      if (!ctx.session) {
        ctx.throw(401);
        return;
      }

      let tasks = await this.opt.taskDao.getAllTasks();
      let scheduled = this.opt.scheduler.getSchedule();
      let channels = await this.opt.discordDao.listTextChannels(config.discord.auth.guildId);
      let guild = await this.opt.discordDao.getGuild(config.discord.auth.guildId);
      let members = guild.members;

      let member = members.get(ctx.session.id);
      if (!(member && (member.roles.exists('name', '姊姊大人') || member.roles.exists('name', '程式組')))) {
        channels = channels.filter(c => c.name === '發佈機debug專用');
      }

      await this.render(ctx, 'index', { tasks, scheduled, channels, members, session: ctx.session, config: {maxInterval: config.server.maxInterval} });
    });

    router.post('/tasks', this.checkLogin, async (ctx: Koa.Context) => {
      if (!ctx.session) {
        ctx.throw(401);
        return;
      }
      if (!ctx.request.body) {
        ctx.throw(400);
        return;
      }

      let { content, channel_id } = ctx.request.body as any;
      let guild = await this.opt.discordDao.getGuild(config.discord.auth.guildId);
      let channel = await this.opt.discordDao.getTextChannel(config.discord.auth.guildId, channel_id);

      if (channel.name !== '發佈機debug專用') {
        let roles = await this.getMemberRoles(ctx.session.id);
        let allowed = false;
        for (let role of roles) {
          if (['姊姊大人', '程式組'].indexOf(role.name) > -1) {
            allowed = true;
          }
        }
        if (!allowed) {
          ctx.throw(401);
          return;
        }
      }

      await this.opt.taskDao.createTask({
        id: 0,
        author: ctx.session.id,
        platform: 'discord',
        param: {
          content: content,
          channel: { id: channel.id, name: channel.name },
          guild: { id: guild.id, name: guild.name }
        }
      });
      ctx.redirect('/');
    });
    router.delete('/tasks/:id', this.checkLogin, async (ctx: Koa.Context) => {
      const task = await this.opt.taskDao.deleteTask({ id: ctx.params.id });
      if(task.messageId)
        await this.opt.discordDao.deleteMessage(task.param.channel.id, task.messageId);
      ctx.body = 'ok';
    });
    router.post('/schedule', this.checkLogin, async (ctx: Koa.Context) => {
      if (!ctx.request.body) {
        ctx.throw(400);
        return;
      }
      let { interval } = ctx.request.body as any;
      interval = +interval;
      if (!(interval>0 && interval<=config.server.maxInterval)) {
        ctx.throw(400);
        return;
      }
      this.opt.scheduler.setInterval(interval * 60 * 1000);
      this.opt.scheduler.start();
      await this.opt.scheduler.work();
      ctx.redirect('/');
    });
    router.delete('/logout', async (ctx: Koa.Context) => {
      if (ctx.session) {
        ctx.session.id = null;
        ctx.session.username = null;
      }
      ctx.body = 'bye';
    });

    this.app.keys = ['some session secret hurr'];
    this.app.use(session({}, this.app));
    this.app.use(bodyParser());
    this.app.use(router.routes());
  }

  checkLogin = async (ctx: Koa.Context, next: Koa.Middleware): Promise<any> => {
    if (!this.oauth2 || !ctx.session) {
      await next(ctx, async () => null);
      return;
    }

    if (ctx.session.id) {
      await next(ctx, async () => null);
      return;
    }

    ctx.session.state = Math.random().toString(36).substring(7);;
    const authorizationUri = this.oauth2.authorizationCode.authorizeURL({
      redirect_uri: config.discord.auth.redirectUrl,
      scope: config.discord.auth.scope,
      state: ctx.session.state,
    });
    ctx.redirect(authorizationUri);
  }

  render = async (ctx: Koa.Context, filename: string, data: any, options: ejs.Options = {}) => {
    return new Promise((resolve, reject) => {
      ejs.renderFile(`${__dirname}/views/${filename}.html.ejs`, data, options, (err, str) => {
        if (err) {
          return reject(err);
        }

        ctx.set('Content-Type', 'text/html');
        ctx.body = str;
        resolve();
      });
    })
  }

  listen(...args: Array<any>): Server {
    return this.app.listen(...args);
  }

  private async getMemberRoles(memberId: string): Promise<Array<IRole>> {
    const client = axios.create();
    client.defaults.headers.common['Authorization'] = 'Bot ' + config.discord.bot.token;
    let roles = await client.get(`https://discordapp.com/api/guilds/${config.discord.auth.guildId}/roles`);
    let member = await client.get(`https://discordapp.com/api/guilds/${config.discord.auth.guildId}/members/${memberId}`);

    let result = [];
    for (let roleId of member.data.roles) {
      for (let role of roles.data) {
        if (role.id === roleId) {
          result.push(role);
        }
      }
    }
    return result;
  }
}
