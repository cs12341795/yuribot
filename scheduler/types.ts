
export interface IScheduler {
  start(): void
  stop(): void
  setInterval(interval: number): void
  getSchedule(): Date
  work(): Promise<any>
}