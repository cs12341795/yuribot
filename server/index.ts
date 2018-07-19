import * as Koa from 'koa';
import config from './config';
import logger from './logger';

const app = new Koa();

app.use(async (ctx) => {
  ctx.set('Content-Type', 'text/plain');
  ctx.body = 'Hello Yuribot';
})

const server = app.listen(config.server.port, config.server.host, () => {
  logger.info(`Server listening on ${config.server.host}:${config.server.port}`);
});

export default server;