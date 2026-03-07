export type QueueItem<T> = {
  key: string;
  value: T;
  createdAt: number;
};

export class TimeoutQueue<T> {
  private timeoutMilisecond: number;
  private cache: QueueItem<T>[] = [];
  private interval: any = null;

  constructor(timeoutMilisecond: number) {
    this.timeoutMilisecond = timeoutMilisecond;
  }

  get = (
    key: string,
    durationMilisecond: number
  ): [QueueItem<T>[], QueueItem<T>[]] => {
    const now = Date.now();
    const results = this.cache.filter((item) => {
      if (item.key === key && now - item.createdAt <= durationMilisecond) {
        return true;
      }
      return false;
    });
    return [results, this.cache];
  };

  getAll = (key: string): QueueItem<T>[] => {
    return this.cache.filter((item) => item.key === key);
  };

  push = (item: QueueItem<T>): void => {
    this.cache.push({
      ...item,
      createdAt: Date.now(),
    });
  };

  cleanup = (): void => {
    const cacheAge = this.timeoutMilisecond * 50;
    clearInterval(this.interval);
    this.interval = setInterval(() => {
      const now = Date.now();
      this.cache = this.cache.filter(
        (item) => now - item.createdAt <= cacheAge
      );
    }, this.timeoutMilisecond);
  };

  stop = (): void => {
    clearInterval(this.interval);
  };
}
