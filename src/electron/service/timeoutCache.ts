class TimeoutCache<T> {
  private cache: Map<
    string,
    { value: T; timeoutId: ReturnType<typeof setTimeout> }
  >;
  private timeout: number;

  constructor(timeoutMilisecond: number = 5000) {
    this.cache = new Map();
    this.timeout = timeoutMilisecond;
  }

  set(key: string, value: T): void {
    if (this.cache.has(key)) {
      clearTimeout(this.cache.get(key)!.timeoutId);
    }

    const timeoutId = setTimeout(() => {
      this.cache.delete(key);
    }, this.timeout);

    this.cache.set(key, { value, timeoutId });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    return entry.value;
  }

  delete(key: string): void {
    const entry = this.cache.get(key);
    if (!entry) return;

    clearTimeout(entry.timeoutId);
    this.cache.delete(key);
  }
}

export { TimeoutCache };
