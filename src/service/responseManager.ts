// Prevents multiple components from registering the same electron.on() listener.
// Flow: client sends IPC → electron saves result via saveResponse → client awaits via getResponse.

class ResponseManager {
  private resolvers = new Map<string, (value: any) => void>();
  private earlyResponses = new Map<string, any>();

  getKey(message: string, requestId: number | string): string {
    return `${message}:${requestId}`;
  }

  saveResponse(key: string, value: any) {
    const resolve = this.resolvers.get(key);
    if (resolve) {
      this.resolvers.delete(key);
      resolve(value);
    } else {
      this.earlyResponses.set(key, value);
    }
  }

  getResponse(key: string): Promise<any> {
    if (this.earlyResponses.has(key)) {
      const value = this.earlyResponses.get(key);
      this.earlyResponses.delete(key);
      return Promise.resolve(value);
    }

    return new Promise((resolve) => {
      this.resolvers.set(key, resolve);
    });
  }

  cancelAll() {
    this.resolvers.forEach((resolve) => resolve(undefined));
    this.resolvers.clear();
    this.earlyResponses.clear();
  }
}

const responseManager = new ResponseManager();
export { responseManager };
