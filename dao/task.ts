import * as Knex from 'knex';

export enum TaskStatus {
  PENDING = 0,
  ERROR = 10,
  DONE = 20,
}

export interface ITask {
  id: number;
  status?: TaskStatus;
  author?: string;
  content?: string;
  channel?: string;
  response?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ITaskDao {
  getAllTasks(context?: any): Promise<Array<ITask>>;
  getUndoTasks(context?: any): Promise<Array<ITask>>;
  createTask(task: ITask, context?: any): Promise<ITask>;
  updateTask(task: ITask, context?: any): Promise<ITask>;
  deleteTask(task: ITask, context?: any): Promise<ITask>;
}

export class KnexTaskDao implements ITaskDao {
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
      .orderBy('status')
      .orderBy('created_at', 'desc') as Array<any>;

    return results.map(this.transform);
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
    const { id, author, status, content, channel, response, created_at: createdAt, updated_at:updatedAt } = r;
    return { id, author, status, content, channel, response, createdAt, updatedAt };
  }

  private format(t: ITask): any {
    const { id, author, status, content, channel, response, createdAt:created_at, updatedAt:updated_at } = t;
    return { id, author, status, content, channel, response, created_at, updated_at };
  }

  private single(r: Array<any>): ITask {
    if (r.length === 0) {
      throw new Error(`Task not found`);
    }
    return r.map(this.transform)[0];
  }
}