import _ from "lodash";
import AsyncLock from "async-lock";
import { SwapOnUniswap } from "./swapOnUniswap";

export class UniswapMultichain {
  private mapUniswap: { [key: string]: SwapOnUniswap };
  private lock: AsyncLock;
  private lockKey: string;

  constructor() {
    this.mapUniswap = {};
    this.lock = new AsyncLock();
    this.lockKey = "UniswapMultichain";
  }

  getUniswap = async (
    chainId: number,
    listNodeEndpoint: string[]
  ): Promise<SwapOnUniswap> => {
    return await this.lock.acquire(this.lockKey, () => {
      const key = this.getKey(chainId, listNodeEndpoint);
      if (this.mapUniswap[key]) {
        return this.mapUniswap[key];
      }

      this.mapUniswap[key] = new SwapOnUniswap(chainId, listNodeEndpoint);
      return this.mapUniswap[key];
    });
  };

  private getKey = (chainId: number, listNodeEndpoint: string[]): string => {
    return chainId?.toString() + "-" + _.sortBy(listNodeEndpoint).join("-");
  };
}
