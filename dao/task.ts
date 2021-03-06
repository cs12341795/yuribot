import * as Knex from 'knex';
import { ITask, ITaskDao, TaskStatus } from './types';

export default class KnexTaskDao implements ITaskDao {
  private knex: Knex;

  constructor(knex: Knex) {
    this.knex = knex;
  }

  async getAllTasks(context?: any) {
    let results = await this.knex.select()
      .from('tasks')
      .orderBy('created_at', 'desc') as Array<any>;

    return results.map(this.transform);
  }

  async getUndoTasks(context?: any) {
    let results = await this.knex.select()
      .from('tasks')
      .where('status', '<', TaskStatus.DONE)
      .where('publish_at', '<', new Date)
      .orderBy('status')
      .orderBy('publish_at') as Array<any>;

    return results.map(this.transform);
  }

  async getTask(task: ITask, context?: any) {
    let results = await this.knex.select()
      .from('tasks').where('id', '=', task.id) as Array<any>;
    return this.single(results);
  }

  async createTask(task: ITask, context?: any) {
    delete task.id;
    delete task.createdAt;
    delete task.updatedAt;
    let results = await this.knex.insert(this.format(task)).into('tasks').returning('*') as Array<any>;
    return this.single(results);
  }

  async updateTask(task: ITask, context?: any) {
    task.updatedAt = new Date();
    let results = await this.knex.table('tasks').update(this.format(task)).where('id', task.id).returning('*') as Array<any>;
    return this.single(results);
  }

  async deleteTask(task: ITask, context?: any) {
    let results = await this.knex.table('tasks').where('id', task.id).delete().returning('*') as Array<any>;
    return this.single(results);
  }

  private transform(r: any): ITask {
    const { id, author, status, platform, param, response, created_at: createdAt, updated_at:updatedAt, publish_at: publishAt, message_id:messageId } = r;
    return { id, author, status, platform, param, response, createdAt, updatedAt, publishAt, messageId };
  }

  private format(t: ITask): any {
    const { id, author, status, platform, param, response, createdAt: created_at, updatedAt: updated_at, publishAt: publish_at, messageId:message_id } = t;
    return { id, author, status, platform, param, response, created_at, updated_at, publish_at, message_id };
  }

  private single(r: Array<any>): ITask {
    if (r.length === 0) {
      throw new Error(`Task not found`);
    }
    return r.map(this.transform)[0];
  }
}
