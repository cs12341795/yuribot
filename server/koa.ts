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
      }

      try {
        // get access token from discord
        const result = await this.oauth2.authorizationCode.getToken({
          code: code,
          redirect_uri: config.discord.auth.redirectUrl,
          scope: config.discord.auth.scope
        });
        const token = this.oauth2.accessToken.create(result);
        // get user data with access token
        const client = axios.create();
        client.defaults.headers.common['Authorization'] = `${token.token.token_type} ${token.token.access_token}`;
        let user = await client.get('https://discordapp.com/api/users/@me');
        let guilds = await client.get('https://discordapp.com/api/users/@me/guilds');
        // No need access anymore
        await token.revoke('access_token');
        await token.revoke('refresh_token');
        // make sure user is in the guild
        for (let guild of guilds.data) {
          if (guild.id === config.discord.auth.guildId && ctx.session) {
            ctx.session.userId = user.data.id;
            ctx.session.username = user.data.username;
            ctx.session.avatar = user.data.avatar;
            ctx.redirect('/');
            return;
          }
        }

        ctx.throw(401, 'You are not in the guild');
      } catch (err) {
        ctx.throw(401, 'Authentication failed');
      }
    });

    router.get('/', this.checkLogin, async (ctx: Koa.Context) => {
      let tasks = await this.opt.taskDao.getAllTasks();
      let scheduled = this.opt.scheduler.getSchedule();
      let channels = await this.opt.discordDao.listTextChannels(config.discord.auth.guildId);

      await this.render(ctx, 'index', { tasks, scheduled, channels, session: ctx.session });
    });

    router.post('/tasks', this.checkLogin, async (ctx: Koa.Context) => {
      if (!ctx.request.body) {
        ctx.throw(400);
        return;
      }
      let { content, channel_id } = ctx.request.body as any;
      let guild = await this.opt.discordDao.getGuild(config.discord.auth.guildId);
      let channel = await this.opt.discordDao.getTextChannel(config.discord.auth.guildId, channel_id);
      await this.opt.taskDao.createTask({
        id: 0,
        author: ctx.session ? ctx.session.username : '',
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
      await this.opt.taskDao.deleteTask({ id: ctx.params.id });
      ctx.body = 'ok';
    });
    router.post('/schedule', this.checkLogin, async (ctx: Koa.Context) => {
      if (!ctx.request.body) {
        ctx.throw(400);
        return;
      }
      let { intervel } = ctx.request.body as any;
      intervel = +intervel;
      if (!intervel) {
        ctx.throw(400);
        return;
      }
      this.opt.scheduler.setInterval(intervel * 60 * 1000);
      this.opt.scheduler.start();
      await this.opt.scheduler.work();
      ctx.redirect('/');
    });
    router.delete('/logout', async (ctx: Koa.Context) => {
      if (ctx.session) {
        ctx.session.userId = null;
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

    if (ctx.session.userId) {
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
}