import { Coingecko } from "./coingecko";
import { Dexsceener } from "./dexscreener";
import { IGetTokenPriceNodeConfig } from "@/electron/type";
import { PRICE_DATA_SOURCE } from "@/electron/constant";

export type IPriceAndMarketcap = {
  price: number | null;
  marketcap: number | null;
};

export class Pricing {
  private coingecko: Coingecko;
  private dexscreener: Dexsceener;

  constructor(cacheTimeMilisecond: number) {
    this.coingecko = new Coingecko(
      "https://api.coingecko.com/api/v3",
      cacheTimeMilisecond
    );
    this.dexscreener = new Dexsceener(
      "https://api.dexscreener.com",
      cacheTimeMilisecond
    );
  }

  getTokenPrice = async (
    config: IGetTokenPriceNodeConfig
  ): Promise<[number | null, Error | null]> => {
    let price;
    let err;

    if (config?.dataSource === PRICE_DATA_SOURCE.COINGECKO) {
      [price, err] = await this.coingecko.getTokenPrice(
        config?.coingeckoId!,
        config?.timeout! * 1000
      );
    } else {
      [price, err] = await this.dexscreener.getTokenPrice(
        config?.tokenAddress!,
        config?.chainId!,
        config?.timeout! * 1000
      );
    }

    return [price, err];
  };

  getMarketcap = async (
    config: IGetTokenPriceNodeConfig
  ): Promise<[IPriceAndMarketcap | null, Error | null]> => {
    let item: IPriceAndMarketcap | null = null;
    let err;

    if (config?.dataSource === PRICE_DATA_SOURCE.COINGECKO) {
      [item, err] = await this.coingecko.getMarketcap(
        config?.coingeckoId!,
        config?.timeout! * 1000
      );
    } else {
      [item, err] = await this.dexscreener.getMarketcap(
        config?.tokenAddress!,
        config?.chainId!,
        config?.timeout! * 1000
      );
    }

    return [item, err];
  };
}
