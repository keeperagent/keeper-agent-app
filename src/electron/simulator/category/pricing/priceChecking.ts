import { Pricing } from "./index";
import { QueueItem, TimeoutQueue } from "@/electron/service/timeoutQueue";
import { AxiosProxyConfig } from "axios";
import { ICheckTokenPriceNodeConfig } from "@/electron/type";
import { COMPARISION_EXPRESSION, PRICE_DATA_SOURCE } from "@/electron/constant";
import { sleep } from "@/electron/simulator/util";
import { logEveryWhere } from "@/electron/service/util";

export type ICheckTokenPriceInput = {
  dataSource: string;
  tokenAddress: string;
  coingeckoId: string;
  chainId: number;
  apiTimeout: number;
  poolInterval: number;
  timeFrame: number;
  proxy?: AxiosProxyConfig;
};

export type ICheckTokenPriceCondition = {
  compareCondition: string;
  compareValue: number;
};

export class PriceCheckingManager {
  private mapPriceChecking: Map<string, PriceChecking> = new Map();
  private mapPriceCheckingOfWorkflow: Map<string, PriceChecking[]> = new Map();

  private getKey = (input: ICheckTokenPriceInput): string => {
    const proxyKey = input.proxy
      ? `${input.proxy.host}:${input.proxy.port}`
      : "";
    return `${input.dataSource}_${input.tokenAddress}_${input.coingeckoId}_${input.chainId}_${input.apiTimeout}_${input.poolInterval}_${input.timeFrame}_${proxyKey}`;
  };

  private getWorkflowKey = (workflowId: number): string => {
    return workflowId?.toString();
  };

  getPriceChecking = (
    input: ICheckTokenPriceInput,
    workflowId: number,
  ): PriceChecking => {
    const key = this.getKey(input);
    if (!this.mapPriceChecking.has(key)) {
      const priceChecking = new PriceChecking(input);
      this.mapPriceChecking.set(key, priceChecking);

      const workflowKey = this.getWorkflowKey(workflowId);
      const listPriceChecking =
        this.mapPriceCheckingOfWorkflow.get(workflowKey) || [];
      listPriceChecking.push(priceChecking);
      this.mapPriceCheckingOfWorkflow.set(workflowKey, listPriceChecking);
    }

    return this.mapPriceChecking.get(key)!;
  };

  stop = (input: ICheckTokenPriceInput | null, workflowId: number): void => {
    if (input !== null) {
      const key = this.getKey(input);
      if (this.mapPriceChecking.has(key)) {
        this.mapPriceChecking.get(key)?.stop();
        this.mapPriceChecking.delete(key);
      }
    }

    if (workflowId) {
      const workflowAndCampaignKey = this.getWorkflowKey(workflowId);
      const listPriceChecking =
        this.mapPriceCheckingOfWorkflow.get(workflowAndCampaignKey) || [];
      for (const priceChecking of listPriceChecking) {
        priceChecking.stop();
      }
      this.mapPriceCheckingOfWorkflow.delete(workflowAndCampaignKey);
    }
  };
}

export class PriceChecking {
  private timeoutCache: TimeoutQueue<number>;
  private pricing: Pricing;
  private input: ICheckTokenPriceInput | null = null;
  private proxy: AxiosProxyConfig | undefined;
  private isRunning = false;
  private error: Error | null = null;

  constructor(input: ICheckTokenPriceInput) {
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
      this.error = await this.updatePrice();
      await sleep(this.input?.poolInterval * 1000);
    }

    return null;
  };

  stop = (): void => {
    logEveryWhere({ message: "stop cron price checking" });
    this.timeoutCache.stop();
    this.isRunning = false;
  };

  checkPrice = (
    condition: ICheckTokenPriceCondition,
  ): [boolean, number, Error | null] => {
    if (this.error !== null) {
      return [false, 0, this.error];
    }

    const [listPrice, allPrice] = this.timeoutCache.get(
      this.getCacheKey(),
      this.input?.timeFrame! * 1000,
    );
    logEveryWhere({
      message: `checkPrice with cache length: ${allPrice?.length}`,
    });

    if (listPrice.length === 0 || allPrice?.length <= 1) {
      return [false, 0, null];
    }

    const firstSnapshot = allPrice[0];
    const lastSnapshot = allPrice[allPrice.length - 1];
    const currentPrice = Number(lastSnapshot.value);
    // if the time frame is not enough to compare, return false
    if (
      lastSnapshot.createdAt - firstSnapshot.createdAt <
      this.input?.timeFrame! * 1000
    ) {
      return [false, currentPrice, null];
    }

    let result = true;
    for (const price of listPrice) {
      if (
        condition.compareCondition === COMPARISION_EXPRESSION.EQUAL &&
        Number(price.value) !== Number(condition.compareValue)
      ) {
        result = false;
        break;
      }

      if (
        condition.compareCondition === COMPARISION_EXPRESSION.LARGER &&
        Number(price.value) <= Number(condition.compareValue)
      ) {
        result = false;
        break;
      }

      if (
        condition.compareCondition === COMPARISION_EXPRESSION.SMALLER &&
        Number(price.value) >= Number(condition.compareValue)
      ) {
        result = false;
        break;
      }

      if (
        condition.compareCondition === COMPARISION_EXPRESSION.NOT_EQUAL &&
        Number(price.value) === Number(condition.compareValue)
      ) {
        result = false;
        break;
      }
    }

    return [result, currentPrice, null];
  };

  getAllData = (): QueueItem<number>[] => {
    return this.timeoutCache.getAll(this.getCacheKey());
  };

  private getCacheKey = (): string => {
    let key = this.input?.tokenAddress;
    if (this.input?.dataSource === PRICE_DATA_SOURCE.COINGECKO) {
      key = this.input?.coingeckoId;
    }

    return key!;
  };

  private updatePrice = async (): Promise<Error | null> => {
    if (!this.input) {
      return new Error("input is null");
    }

    const [tokenPrice, err] = await this.pricing.getTokenPrice(
      {
        coingeckoId: this.input?.coingeckoId,
        timeout: this.input.apiTimeout,
        tokenAddress: this.input.tokenAddress,
        chainId: this.input.chainId,
        dataSource: this.input.dataSource,
      } as ICheckTokenPriceNodeConfig,
      this.proxy,
    );
    if (err || tokenPrice === null) {
      return err;
    }

    const cacheItem: QueueItem<number> = {
      key: this?.getCacheKey(),
      value: tokenPrice,
      createdAt: Date.now(),
    };
    this.timeoutCache.push(cacheItem);
    return null;
  };
}
