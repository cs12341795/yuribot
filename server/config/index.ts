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
}

const env = process.env.NODE_ENV || 'development'
const config: IConfig = {
  env,
  logger: {
    level: (process.env.LOG_LEVEL as LogLevel) || (env === 'development' ? 'trace' : 'warn')
  },
  server: {
    host: process.env.SERVER_HOST || '0.0.0.0',
    port: +(process.env.SERVER_PORT || '4000')
  }
};

export default config;