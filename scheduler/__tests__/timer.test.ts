import { ITask, ITaskDao, ITaskHandler, TaskStatus } from '../../dao/types';
import TimerScheduler from '../timer';

let taskStore;

const mockTaskDao = jest.fn<ITaskDao>(() => ({
  getUndoTasks: async function (context?: any) {
    return JSON.parse(JSON.stringify(taskStore));
  },
  updateTask: async function (task: ITask, context?: any) {
    if (task.id === 2) {
      throw new Error('update failed');
    }
    taskStore[task.id] = task;
    return task;
  }
}));

const mockTaskHandler = jest.fn<ITaskHandler>(() => ({
  handleTask: async function (task: ITask) {
    if (task.id === 1) {
      throw new Error('handle failed');
    }
    return true;
  }
}));

const mockTaskDaoInstance = new mockTaskDao;
const mockTaskHandlerInstance = new mockTaskHandler;

let scheduler = new TimerScheduler(mockTaskDaoInstance, mockTaskHandlerInstance);

describe('TimerScheduler', () => {
  beforeEach(() => {
    taskStore = [
      { id: 0 },
      { id: 1 },
      { id: 2 }
    ];
    scheduler.stop();
    jest.useFakeTimers();
  });

  test('stop', () => {
    scheduler.stop();
    expect(clearTimeout).toHaveBeenCalledTimes(1);
  });

  test('getSchedule', () => {
    let now = new Date();
    scheduler.setInterval(3600);
    scheduler.start();
    let schedule = scheduler.getSchedule();
    let t1 = schedule.getTime();
    let t2 = now.getTime();
    expect(t1 - t2).toBe(3600);
  });

  test('start to work', (done) => {
    jest.useRealTimers();
    let scheduler = new TimerScheduler(mockTaskDaoInstance, mockTaskHandlerInstance);
    scheduler.work = jest.fn();
    scheduler.setInterval(10);
    scheduler.start(() => {
      scheduler.stop();
      expect(scheduler.work).toBeCalled();
      done();
    });
  });

  test('work', async () => {
    await scheduler.work();
    expect(taskStore).toMatchObject([
      { id: 0, status: TaskStatus.DONE, response: true },
      { id: 1, status: TaskStatus.ERROR, response: 'handle failed' },
      { id: 2 },
    ]);
  });
});