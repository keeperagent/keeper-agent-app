import _ from "lodash";
import AsyncLock from "async-lock";
import { SwapOnKyberswap } from "./swapOnKyberswap";

export class KyberswapManager {
  private mapKyberswap: { [key: string]: SwapOnKyberswap };
  private lock: AsyncLock;
  private lockKey: string;

  constructor() {
    this.mapKyberswap = {};
    this.lock = new AsyncLock();
    this.lockKey = "KyberswapManager";
  }

  getKyberswap = async (
    listNodeEndpoint: string[]
  ): Promise<SwapOnKyberswap> => {
    return await this.lock.acquire(this.lockKey, () => {
      const key = this.getKey(listNodeEndpoint);
      if (this.mapKyberswap[key]) {
        return this.mapKyberswap[key];
      }

      this.mapKyberswap[key] = new SwapOnKyberswap(listNodeEndpoint);
      return this.mapKyberswap[key];
    });
  };

  private getKey = (listNodeEndpoint: string[]): string => {
    return _.sortBy(listNodeEndpoint).join("-");
  };
}
