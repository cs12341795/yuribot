import { LogLevel } from 'bunyan';

export interface IConfig {
  env: string;
  logger: {
    level: LogLevel;
  };
  server: {
    host: string;
    port: number;
  };
  discord: {
    bot: {
      token: string;
    };
    client: {
      id: string;
      secret: string;
    };
    auth: {
      guildId: string;
      tokenHost: string;
      tokenPath: string;
      authorizePath: string;
      revokePath: string;
      redirectUrl: string;
      scope: string;
      roles: string;
    };
  };
  knex: {
    client: string;
    connection: string;
  }
}

const env = process.env.NODE_ENV || 'development';
let config: IConfig = {
  env,
  logger: {
    level:
      (process.env.LOG_LEVEL as LogLevel) ||
      (env === 'development' ? 'trace' : 'warn')
  },
  server: {
    host: process.env.SERVER_HOST || '0.0.0.0',
    port: +(process.env.SERVER_PORT || '4000')
  },
  discord: {
    bot: {
      token: process.env.DISCORD_BOT_TOKEN || ''
    },
    client: {
      id: process.env.DISCORD_CLIENT_ID || '',
      secret: process.env.DISCORD_CLIENT_SECRET || '',
    },
    auth: {
      guildId: process.env.DISCORD_GUILD_ID || '',
      tokenHost: 'https://discordapp.com',
      tokenPath: '/api/oauth2/token',
      authorizePath: '/api/oauth2/authorize',
      revokePath: '/api/oauth2/token/revoke',
      scope: 'identify guilds',
      redirectUrl: process.env.DISCORD_OAUTH_REDIRECT || 'http://localhost:4000/discord/callback',
      roles: process.env.DISCORD_ROLES || ''
    }
  },
  knex: {
    client: 'postgresql',
    connection: process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/postgres'
  }
};

try {
  // tslint:disable-next-line:no-var-requires non-literal-require
  config = require('./' + config.env).default;
} catch (err) {
  // tslint:disable-next-line:no-console
  console.log('Failed to load config:', config.env, err);
}

export default config;
