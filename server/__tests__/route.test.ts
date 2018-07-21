import * as request from 'supertest';
import { Server } from 'http';
import app from '../app';

describe('routes: index', () => {
  let server: Server;
  beforeAll(() => { server = app.listen() });
  afterAll(() => { server.close() });

  test('should respond as expected', async () => {
    const response = await request(server).get('/');
    expect(response.status).toEqual(200);
    expect(response.text).toEqual('Hello Yuribot');
  });
});
