import _ from "lodash";
import AsyncLock from "async-lock";
import { SwapOnJupiter } from "./swapOnJupiter";
import { getSolanaProvider } from "@/electron/inject";
import { preferenceDB } from "@/electron/database/preference";

export class SwapOnJupiterManager {
  private mapSwapOnJupiter: { [key: string]: SwapOnJupiter };
  private lock: AsyncLock;
  private lockKey: string;

  constructor() {
    this.mapSwapOnJupiter = {};
    this.lock = new AsyncLock();
    this.lockKey = "SwapOnJupiterManager";
  }

  getSwapOnJupiter = async (
    listNodeEndpoint: string[]
  ): Promise<SwapOnJupiter> => {
    return await this.lock.acquire(this.lockKey, async () => {
      const key = this.getKey(listNodeEndpoint);
      if (this.mapSwapOnJupiter[key]) {
        return this.mapSwapOnJupiter[key];
      }

      const [preference] = await preferenceDB.getOnePreference();
      const listJupiterApiKey = preference?.jupiterApiKeys || [];

      const solanaProvider = getSolanaProvider();
      this.mapSwapOnJupiter[key] = new SwapOnJupiter(
        listNodeEndpoint,
        listJupiterApiKey,
        solanaProvider
      );
      return this.mapSwapOnJupiter[key];
    });
  };

  private getKey = (listNodeEndpoint: string[]): string => {
    return _.sortBy(listNodeEndpoint).join("-");
  };
}
