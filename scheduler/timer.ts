import { IScheduler } from './types';
import { ITaskHandler, ITaskDao, TaskStatus } from '../dao/types';
import logger from '../logger';

export default class TimerScheduler implements IScheduler {
  private taskDao: ITaskDao;
  private taskHandler: ITaskHandler;
  private scheduled: Date;
  private interval: number = 3600 * 1000;
  private timer: any;
  private lock: boolean;

  constructor(taskDao: ITaskDao, taskHandler: ITaskHandler) {
    this.taskDao = taskDao;
    this.taskHandler = taskHandler;
  }

  start(cb?: () => void) {
    this.stop();
    this.scheduled = new Date();
    this.scheduled.setMilliseconds(this.scheduled.getMilliseconds() + this.interval);
    this.timer = setTimeout(() => {
      this.work();
      this.start();
      if (typeof cb === 'function') cb();
    }, this.interval);
  }

  stop() {
    clearTimeout(this.timer);
  }

  setInterval(interval: number) {
    this.interval = interval;
  }

  getSchedule() {
    return this.scheduled;
  }

  async work() {
    if (this.lock) return
    this.lock = true;
    try {
      let tasks = await this.taskDao.getUndoTasks();
      for (let task of tasks) {
        try {
          const message = await this.taskHandler.handleTask(task);
          task.messageId = message.id;
          task.status = TaskStatus.DONE;
        } catch (err) {
          task.status = TaskStatus.ERROR;
          task.response = err.message;
        }
        await this.taskDao.updateTask(task);
      }
    } catch (err) {
      logger.error(err);
    }
    this.lock = false;
  }
}
