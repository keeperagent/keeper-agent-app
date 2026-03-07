import _ from "lodash";
import AsyncLock from "async-lock";
import { SwapOnCetus } from "./swap";
import { getSuiProvider } from "@/electron/inject";

export class SwapOnCetusManager {
  private mapSwapOnCetus: { [key: string]: SwapOnCetus };
  private lock: AsyncLock;
  private lockKey: string;

  constructor() {
    this.mapSwapOnCetus = {};
    this.lock = new AsyncLock();
    this.lockKey = "SwapOnCetusManager";
  }

  getSwapOnCetus = async (listNodeEndpoint: string[]): Promise<SwapOnCetus> => {
    return await this.lock.acquire(this.lockKey, () => {
      const key = this.getKey(listNodeEndpoint);
      if (this.mapSwapOnCetus[key]) {
        return this.mapSwapOnCetus[key];
      }

      this.mapSwapOnCetus[key] = new SwapOnCetus(
        listNodeEndpoint,
        getSuiProvider()
      );
      return this.mapSwapOnCetus[key];
    });
  };

  private getKey = (listNodeEndpoint: string[]): string => {
    return _.sortBy(listNodeEndpoint).join("-");
  };
}
