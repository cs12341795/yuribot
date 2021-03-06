import knex from '../knex';
import KnexTaskDao from '../task';
import { TaskStatus } from '../types';

const fixtures = [{
  id: undefined,
  status: TaskStatus.PENDING,
  platform: '1',
  publish_at: '2018-08-20 00:00:00'
}, {
  id: undefined,
  status: TaskStatus.DONE,
  platform: '2',
  publish_at: '2018-08-20 00:00:00'
}, {
  id: undefined,
  status: TaskStatus.ERROR,
  platform: '3',
  publish_at: '2018-08-20 00:00:00'
}, {
  id: undefined,
  status: TaskStatus.PENDING,
  platform: '4',
  publish_at: '2999-08-20 00:00:00'
}];

const dao = new KnexTaskDao(knex);

describe('KnexTaskDao', () => {
  beforeEach(async () => {
    await knex.table('tasks').truncate();
    for(let f of fixtures) {
      f.id = undefined;
      let ret = await knex.insert(f).into('tasks').returning('id');
      f.id = ret[0];
    }
  });
  afterAll(async () => await knex.destroy());

  test('getAllTasks', async () => {
    let results = await dao.getAllTasks();
    expect(results.length).toBe(4);
    if (results.length === 4) {
      expect(results[0].createdAt >= results[1].createdAt)
      expect(results[1].createdAt >= results[2].createdAt)
      expect(results[2].createdAt >= results[3].createdAt)
    }
  });

  test('getUndoTasks', async () => {
    let results = await dao.getUndoTasks();
    expect(results.length).toBe(2);
    if (results.length === 2) {
      expect(results[0].publishAt <= results[1].publishAt)
    }
  });

  test('getTask', async () => {
    let result = await dao.getTask({ id: fixtures[0].id });
    expect(result.id).toBe(fixtures[0].id);
    expect(result.status).toBe(fixtures[0].status);
  });

  test('createTask', async () => {
    let task = await dao.createTask({ id: 0, platform: '4', param: { some: '4' } });
    expect(task.id).not.toBe(0);
    expect(task.status).toBe(TaskStatus.PENDING);
    expect(task.platform).toBe('4');
    expect(task.param).toMatchObject({ some: '4' });
  });

  test('updateTask', async () => {
    expect(dao.updateTask({ id: 0 })).rejects.toThrow('Task not found');

    let task = await dao.updateTask({ id: fixtures[2].id, status: TaskStatus.DONE });
    expect(task.id).toBe(fixtures[2].id);
    expect(task.status).toBe(TaskStatus.DONE);
  });

  test('deleteTask', async () => {
    expect(dao.deleteTask({ id: 0 })).rejects.toThrow('Task not found');

    let task = await dao.deleteTask({ id: fixtures[2].id });
    expect(task.id).toBe(fixtures[2].id);
  });
});