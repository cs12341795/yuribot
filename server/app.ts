import * as Koa from 'koa';

const app = new Koa();

app.use(async ctx => {
  ctx.set('Content-Type', 'text/plain');
  ctx.body = 'Hello Yuribot';
});

export default app;
