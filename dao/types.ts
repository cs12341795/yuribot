
export enum TaskStatus {
  PENDING = 0,
  ERROR = 10,
  DONE = 20,
}

export interface ITask {
  id: number;
  status?: TaskStatus;
  author?: string;
  platform?: string;
  param?: any;
  response?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ITaskHandler {
  handleTask(task: ITask): Promise<any>;
}

export interface ITaskDao {
  getAllTasks(context?: any): Promise<Array<ITask>>;
  getUndoTasks(context?: any): Promise<Array<ITask>>;
  createTask(task: ITask, context?: any): Promise<ITask>;
  updateTask(task: ITask, context?: any): Promise<ITask>;
  deleteTask(task: ITask, context?: any): Promise<ITask>;
}

export interface IChannel {
  id: string;
  name: string;
  send(msg: string): Promise<any>;
}
