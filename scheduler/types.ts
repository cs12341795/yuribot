
export interface IScheduler {
  start(): void
  stop(): void
  setInterval(interval: number): void
  getSchedule(): Date
}

export interface IWorker {
  work(): Promise<any>
}