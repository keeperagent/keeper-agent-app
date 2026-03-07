import { sleep } from "./util";

// used to get response from electron backend, to prevent too many component register the same event listener in electron.on(), which cause leak of memory
// client send message to electron -> electron save result in @responseManager -> client get result from @responseManager

class ResponseManager {
  private mapResponse: { [key: string]: any };
  private shouldStop: boolean;
  private mapWaitingKey: { [key: string]: boolean };

  constructor() {
    this.mapResponse = {};
    this.shouldStop = false;
    this.mapWaitingKey = {};
  }

  getKey(message: string, requestId: number | string): string {
    return `${message}:${requestId}`;
  }

  saveResponse(key: string, value: any) {
    this.mapResponse[key] = value;
  }

  async getResponse(key: string): Promise<any> {
    this.mapWaitingKey[key] = true;
    return await new Promise(async (resolve) => {
      while (this.mapResponse[key] === undefined && !this.shouldStop) {
        console.log("wait 50ms to get response");
        await sleep(50);
      }

      delete this.mapWaitingKey[key];
      resolve(this.mapResponse[key]);
    });
  }

  removeKey(key: string) {
    delete this.mapResponse[key];
  }

  async removeAllKey() {
    this.shouldStop = true;
    this.mapResponse = {};

    while (Object.keys(this.mapWaitingKey).length > 0) {
      console.error("wait 50s for all running key completed");
      await sleep(50);
    }
    this.shouldStop = false;
  }
}

const responseManager = new ResponseManager();
export { responseManager };
