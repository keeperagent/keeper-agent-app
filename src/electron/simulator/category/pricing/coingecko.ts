import axios, { AxiosProxyConfig } from "axios";
import { TimeoutCache } from "@/electron/service/timeoutCache";
import { IPriceAndMarketcap } from "./index";

export class Coingecko {
  private endpoint: string;
  private timeoutCache: TimeoutCache<IPriceAndMarketcap>;

  constructor(endpoint: string, cacheTimeMilisecond: number) {
    this.endpoint = endpoint;
    this.timeoutCache = new TimeoutCache(cacheTimeMilisecond);
  }

  async getTokenPrice(
    coingeckoId: string,
    timeout: number,
    proxy?: AxiosProxyConfig,
  ): Promise<[number | null, Error | null]> {
    try {
      const cacheKey = `price_coingeko_${coingeckoId}`;
      const cachedPrice = this.timeoutCache.get(cacheKey);
      if (cachedPrice !== null) {
        return [cachedPrice.price, null];
      }

      const url = `${this.endpoint}/coins/markets?ids=${coingeckoId}&vs_currency=usd`;
      const response = await axios.get(url, {
        timeout,
        proxy,
      });
      const price: IPriceAndMarketcap = {
        price: response?.data?.[0]?.current_price,
        marketcap: response?.data?.[0]?.market_cap,
      };
      this.timeoutCache.set(cacheKey, price);
      return [price.price, null];
    } catch (err: any) {
      return [null, err];
    }
  }

  getMarketcap = async (
    coingeckoId: string,
    timeout: number,
    proxy?: AxiosProxyConfig,
  ): Promise<[IPriceAndMarketcap | null, Error | null]> => {
    try {
      const cacheKey = `marketcap_coingeko_${coingeckoId}`;
      const cachedPrice = this.timeoutCache.get(cacheKey);
      if (cachedPrice !== null) {
        return [cachedPrice, null];
      }

      const url = `${this.endpoint}/coins/markets?ids=${coingeckoId}&vs_currency=usd`;
      const response = await axios.get(url, {
        timeout,
        proxy,
      });
      const marketcap: IPriceAndMarketcap = {
        price: response?.data?.[0]?.current_price,
        marketcap: response?.data?.[0]?.market_cap,
      };
      this.timeoutCache.set(cacheKey, marketcap);
      return [marketcap, null];
    } catch (err: any) {
      return [null, err];
    }
  };
}
