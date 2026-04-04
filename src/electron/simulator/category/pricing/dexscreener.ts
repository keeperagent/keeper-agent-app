import axios, { AxiosProxyConfig } from "axios";
import { CUSTOM_CHAIN_ID } from "@/electron/constant";
import { TimeoutCache } from "@/electron/service/timeoutCache";
import { logEveryWhere } from "@/electron/service/util";
import { IPriceAndMarketcap } from "./index";

const mapChainIdToName: { [key: number]: string } = {
  1: "ethereum",
  56: "bsc",
  42161: "arbitrum",
  137: "polygon",
  43114: "avalanche",
  8453: "base",
  10: "optimism",
  369: "pulsechain",
  81457: "blast",
  7700: "canto",
  324: "zksync",
  5000: "mantle",
  250: "fantom",
  25: "cronos",
  169: "manta",
  534352: "scroll",
  59144: "linea",
  1088: "metis",
  1284: "moonbeam",
  295: "hedera",
  42220: "celo",
  1313161554: "aurora",
  1030: "conflux",
  34443: "mode",
  4337: "beam",
  1101: "polygonzkevm",
  2000: "dogechain",
  787: "acala",
  7000: "zetachain",
  4689: "iotex",
  592: "astar",
  204: "opbnb",
  288: "boba",
  42170: "arbitrumnova",
  1116: "core",
  1285: "moonriver",
  42766: "zkfair",
  9001: "evmos",
  416: "sxnetwork",
  106: "velas",
  14: "flare",
  108: "thundercore",
  40: "telos",
  888: "wanchain",
  314: "filecoin",
  1666600000: "harmony",
  10000: "smartbch",
  321: "kcc",
  20: "elastos",
  6969: "tombchain",
  109: "shibarium",
  245022934: "neonevm",
  82: "meter",
  42262: "oasisemerald",
  9980: "combo",
  122: "fuse",
  1234: "stepnetwork",
  61: "ethereumclassic",
  39797: "energi",
  57: "syscoin",
  32520: "bitgert",
  2611: "redlightchain",
  [CUSTOM_CHAIN_ID.SOLANA]: "solana",
  [CUSTOM_CHAIN_ID.SUI]: "sui",
  [CUSTOM_CHAIN_ID.APTOS]: "aptos",
  [CUSTOM_CHAIN_ID.TON]: "ton",
};

type DexScreenPool = {
  chainId: string;
  pairAddress: string;
  priceUsd: string;
  marketCap: number;
  liquidity: {
    usd: number;
  };
  baseToken: {
    address: string;
  };
};

export class Dexsceener {
  private endpoint: string;
  private timeoutCache: TimeoutCache<IPriceAndMarketcap>;

  constructor(endpoint: string, cacheTimeMilisecond: number) {
    this.endpoint = endpoint;
    this.timeoutCache = new TimeoutCache(cacheTimeMilisecond);
  }

  async getTokenPrice(
    tokenAddress: string,
    chainId: number,
    timeout: number,
    proxy?: AxiosProxyConfig,
  ): Promise<[number | null, Error | null]> {
    try {
      const cacheKey = `price_dexscreener_${chainId}_${tokenAddress}`;
      const cachedPrice = this.timeoutCache.get(cacheKey);
      if (cachedPrice !== null) {
        return [cachedPrice.price, null];
      }

      const url = `${this.endpoint}/latest/dex/tokens/${tokenAddress}`;
      const response = await axios.get(url, {
        timeout,
        proxy,
      });
      const listPool = (response?.data?.pairs as DexScreenPool[]) || [];

      // Optionally filter out noise data
      const filteredListPool =
        listPool.length > 4 ? this.filterOutNoiseData(listPool) : listPool;

      // Sort the pools based on liquidity
      filteredListPool.sort(
        (a, b) => (a?.liquidity?.usd || 0) - (b?.liquidity?.usd || 0),
      );

      let tokenPrice = 0;
      for (const pool of filteredListPool) {
        if (
          pool.baseToken.address.toLowerCase() !==
          tokenAddress?.toLocaleLowerCase()
        ) {
          continue;
        }
        const chainName = mapChainIdToName[chainId];
        if (chainName !== pool.chainId) {
          continue;
        }

        tokenPrice = parseFloat(pool.priceUsd);
      }

      this.timeoutCache.set(cacheKey, { price: tokenPrice, marketcap: null });
      return [tokenPrice, null];
    } catch (err: any) {
      logEveryWhere({
        message: `Dexscreener getTokenPrice() error: ${err?.message}`,
      });
      return [null, err];
    }
  }

  // Filter out noise data based on price deviation
  private filterOutNoiseData(data: DexScreenPool[]): DexScreenPool[] {
    const threshold = 2;
    const mean =
      data.reduce((sum, pool) => sum + parseFloat(pool.priceUsd), 0) /
      data.length;

    const stdDev = Math.sqrt(
      data.reduce(
        (sum, pool) => sum + Math.pow(parseFloat(pool.priceUsd) - mean, 2),
        0,
      ) / data.length,
    );

    return data.filter(
      (pool) =>
        Math.abs(parseFloat(pool.priceUsd) - mean) <= threshold * stdDev,
    );
  }

  getMarketcap = async (
    tokenAddress: string,
    chainId: number,
    timeout: number,
    proxy?: AxiosProxyConfig,
  ): Promise<[IPriceAndMarketcap | null, Error | null]> => {
    try {
      const cacheKey = `marketcap_dexscreener_${chainId}_${tokenAddress}`;
      const cachedMarketcap = this.timeoutCache.get(cacheKey);
      if (cachedMarketcap !== null) {
        return [cachedMarketcap, null];
      }

      const url = `${this.endpoint}/latest/dex/tokens/${tokenAddress}`;
      const response = await axios.get(url, {
        timeout,
        proxy,
      });
      const listPool = (response?.data?.pairs as DexScreenPool[]) || [];

      // Optionally filter out noise data
      const filteredListPool =
        listPool.length > 4 ? this.filterOutNoiseData(listPool) : listPool;

      // Sort the pools based on liquidity
      filteredListPool.sort(
        (a, b) => (a?.liquidity?.usd || 0) - (b?.liquidity?.usd || 0),
      );

      let marketcap = 0;
      let tokenPrice = 0;
      for (const pool of filteredListPool) {
        if (
          pool.baseToken.address.toLowerCase() !==
          tokenAddress?.toLocaleLowerCase()
        ) {
          continue;
        }
        const chainName = mapChainIdToName[chainId];
        if (chainName !== pool.chainId) {
          continue;
        }

        marketcap = Number(pool.marketCap);
        tokenPrice = parseFloat(pool.priceUsd);
      }

      const price: IPriceAndMarketcap = {
        marketcap,
        price: tokenPrice,
      };

      this.timeoutCache.set(cacheKey, { marketcap, price: tokenPrice });
      return [price, null];
    } catch (err: any) {
      logEveryWhere({
        message: `Dexscreener getMarketcap() error: ${err?.message}`,
      });
      return [null, err];
    }
  };
}
