import * as request from 'supertest';
import server from '../';

describe("routes: index", () => {
  test("should respond as expected", async () => {
    const response = await request(server).get('/');
    expect(response.status).toEqual(200);
    expect(response.text).toEqual('Hello Yuribot');
  });
});