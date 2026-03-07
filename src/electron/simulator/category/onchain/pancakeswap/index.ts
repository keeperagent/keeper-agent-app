import _ from "lodash";
import AsyncLock from "async-lock";
import { SwapOnPancakeswap } from "./swapOnPancakeswap";

export class PancakeswapMultichain {
  private mapPancakeswap: { [key: string]: SwapOnPancakeswap };
  private lock: AsyncLock;
  private lockKey: string;

  constructor() {
    this.mapPancakeswap = {};
    this.lock = new AsyncLock();
    this.lockKey = "PancakeswapMultichain";
  }

  getPancakeswap = async (
    chainId: number,
    listNodeEndpoint: string[]
  ): Promise<SwapOnPancakeswap> => {
    return await this.lock.acquire(this.lockKey, () => {
      const key = this.getKey(chainId, listNodeEndpoint);
      if (this.mapPancakeswap[key]) {
        return this.mapPancakeswap[key];
      }

      this.mapPancakeswap[key] = new SwapOnPancakeswap(
        chainId,
        listNodeEndpoint
      );
      return this.mapPancakeswap[key];
    });
  };

  private getKey = (chainId: number, listNodeEndpoint: string[]): string => {
    return chainId?.toString() + "-" + _.sortBy(listNodeEndpoint).join("-");
  };
}
