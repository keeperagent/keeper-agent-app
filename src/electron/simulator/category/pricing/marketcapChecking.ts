import { IPriceAndMarketcap, Pricing } from "./index";
import { QueueItem, TimeoutQueue } from "@/electron/service/timeoutQueue";
import { AxiosProxyConfig } from "axios";
import { ICheckTokenPriceNodeConfig } from "@/electron/type";
import { COMPARISION_EXPRESSION, PRICE_DATA_SOURCE } from "@/electron/constant";
import { sleep } from "@/electron/simulator/util";
import { logEveryWhere } from "@/electron/service/util";

export type ICheckMarketcapInput = {
  dataSource: string;
  tokenAddress: string;
  coingeckoId: string;
  chainId: number;
  apiTimeout: number;
  poolInterval: number;
  timeFrame: number;
  proxy?: AxiosProxyConfig;
};

export type ICheckMarketcapCondition = {
  compareCondition: string;
  compareValue: number;
};

export class MarketcapCheckingManager {
  private mapMarketcapChecking: Map<string, MarketcapChecking> = new Map();
  private mapMarketcapCheckingOfWorkflow: Map<string, MarketcapChecking[]> =
    new Map();

  private getKey = (input: ICheckMarketcapInput): string => {
    const proxyKey = input.proxy
      ? `${input.proxy.host}:${input.proxy.port}`
      : "";
    return `${input.dataSource}_${input.tokenAddress}_${input.coingeckoId}_${input.chainId}_${input.apiTimeout}_${input.poolInterval}_${input.timeFrame}_${proxyKey}`;
  };

  private getWorkflowKey = (workflowId: number): string => {
    return workflowId?.toString();
  };

  getMarketcapChecking = (
    input: ICheckMarketcapInput,
    workflowId: number,
  ): MarketcapChecking => {
    const key = this.getKey(input);
    if (!this.mapMarketcapChecking.has(key)) {
      const marketcapChecking = new MarketcapChecking(input);
      this.mapMarketcapChecking.set(key, marketcapChecking);

      const workflowAndCampaignKey = this.getWorkflowKey(workflowId);
      const listMarketcapChecking =
        this.mapMarketcapCheckingOfWorkflow.get(workflowAndCampaignKey) || [];
      listMarketcapChecking.push(marketcapChecking);
      this.mapMarketcapCheckingOfWorkflow.set(
        workflowAndCampaignKey,
        listMarketcapChecking,
      );
    }

    return this.mapMarketcapChecking.get(key)!;
  };

  stop = (input: ICheckMarketcapInput | null, workflowId: number): void => {
    if (input !== null) {
      const key = this.getKey(input);
      if (this.mapMarketcapChecking.has(key)) {
        this.mapMarketcapChecking.get(key)?.stop();
        this.mapMarketcapChecking.delete(key);
      }
    }

    if (workflowId) {
      const workflowKey = this.getWorkflowKey(workflowId);
      const listMarketcapChecking =
        this.mapMarketcapCheckingOfWorkflow.get(workflowKey) || [];
      for (const marketcapChecking of listMarketcapChecking) {
        marketcapChecking.stop();
      }
      this.mapMarketcapCheckingOfWorkflow.delete(workflowKey);
    }
  };
}

export class MarketcapChecking {
  private timeoutCache: TimeoutQueue<IPriceAndMarketcap>;
  private pricing: Pricing;
  private input: ICheckMarketcapInput | null = null;
  private proxy: AxiosProxyConfig | undefined;
  private isRunning = false;
  private error: Error | null = null;

  constructor(input: ICheckMarketcapInput) {
    this.input = input;
    this.proxy = input.proxy;
    this.pricing = new Pricing(0);

    this.timeoutCache = new TimeoutQueue(input.timeFrame * 1000);
    this.timeoutCache.cleanup();
  }

  start = async (): Promise<Error | null> => {
    if (!this.input) {
      return new Error("input is null");
    }
    if (this.isRunning) {
      return null;
    }

    this.isRunning = true;
    while (this.isRunning) {
      this.error = await this.updateMarketcap();
      await sleep(this.input?.poolInterval * 1000);
    }

    return null;
  };

  stop = (): void => {
    logEveryWhere({ message: "stop cron marketcap checking" });
    this.isRunning = false;
    this.timeoutCache.stop();
  };

  checkMarketcap = (
    condition: ICheckMarketcapCondition,
  ): [boolean, IPriceAndMarketcap, Error | null] => {
    const snapshot: IPriceAndMarketcap = { price: 0, marketcap: 0 };
    if (this.error !== null) {
      return [false, snapshot, this.error];
    }
    const [listMarketcap, allMarketcap] = this.timeoutCache.get(
      this.getCacheKey(),
      (this.input?.timeFrame || 0) * 1000,
    );
    logEveryWhere({
      message: `checkMarketcap with cache length: ${allMarketcap?.length}`,
    });

    if (listMarketcap.length === 0 || allMarketcap?.length <= 1) {
      return [false, snapshot, null];
    }

    const firstSnapshot = allMarketcap[0];
    const lastSnapshot = allMarketcap[allMarketcap.length - 1];
    const priceAndMarketcap: IPriceAndMarketcap = {
      price: (lastSnapshot.value as IPriceAndMarketcap)?.marketcap,
      marketcap: (lastSnapshot.value as IPriceAndMarketcap)?.price,
    };

    // if the time frame is not enough to compare, return false
    if (
      lastSnapshot.createdAt - firstSnapshot.createdAt <
      this.input?.timeFrame! * 1000
    ) {
      return [false, priceAndMarketcap, null];
    }

    let result = true;
    for (const item of listMarketcap) {
      const { marketcap } = item?.value as IPriceAndMarketcap;
      if (
        condition.compareCondition === COMPARISION_EXPRESSION.EQUAL &&
        Number(marketcap) !== Number(condition.compareValue)
      ) {
        result = false;
        break;
      }

      if (
        condition.compareCondition === COMPARISION_EXPRESSION.LARGER &&
        Number(marketcap) <= Number(condition.compareValue)
      ) {
        result = false;
        break;
      }

      if (
        condition.compareCondition === COMPARISION_EXPRESSION.SMALLER &&
        Number(marketcap) >= Number(condition.compareValue)
      ) {
        result = false;
        break;
      }

      if (
        condition.compareCondition === COMPARISION_EXPRESSION.NOT_EQUAL &&
        Number(marketcap) === Number(condition.compareValue)
      ) {
        result = false;
        break;
      }
    }

    return [result, priceAndMarketcap, null];
  };

  getAllData = (): QueueItem<number>[] => {
    return this.timeoutCache.getAll(this.getCacheKey())?.map((item) => ({
      ...item,
      value: (item?.value as IPriceAndMarketcap)?.marketcap || 0,
    }));
  };

  private getCacheKey = (): string => {
    let key = this.input?.tokenAddress;
    if (this.input?.dataSource === PRICE_DATA_SOURCE.COINGECKO) {
      key = this.input?.coingeckoId;
    }

    return key!;
  };

  private updateMarketcap = async (): Promise<Error | null> => {
    if (!this.input) {
      return new Error("input is null");
    }

    const [data, err] = await this.pricing.getMarketcap(
      {
        coingeckoId: this.input?.coingeckoId,
        timeout: this.input.apiTimeout,
        tokenAddress: this.input.tokenAddress,
        chainId: this.input.chainId,
        dataSource: this.input.dataSource,
      } as ICheckTokenPriceNodeConfig,
      this.proxy,
    );
    if (err || data === null) {
      return err;
    }

    const cacheItem: QueueItem<IPriceAndMarketcap> = {
      key: this?.getCacheKey(),
      value: data,
      createdAt: Date.now(),
    };
    this.timeoutCache.push(cacheItem);
    return null;
  };
}
