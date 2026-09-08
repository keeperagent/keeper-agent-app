import axios from "axios";
import { MAP_CHAIN_KEY_TO_GECKOTERMINAL_NETWORK } from "@/electron/constant";
import { TimeoutCache } from "@/electron/service/timeoutCache";
import { logEveryWhere } from "@/electron/service/util";
import { ICandle, ITokenCandles } from "@/electron/type";

const BASE_URL = "https://api.geckoterminal.com/api/v2";

type GeckoTimeframe = "second" | "minute" | "hour" | "day";

type PoolAttributes = {
  address: string;
  volume_usd?: { h24?: string };
  reserve_in_usd?: string;
};

export class GeckoTerminal {
  private poolCache: TimeoutCache<string>;
  private candleCache: TimeoutCache<ICandle[]>;

  constructor(cacheTimeMilisecond: number) {
    this.poolCache = new TimeoutCache(cacheTimeMilisecond);
    this.candleCache = new TimeoutCache(cacheTimeMilisecond);
  }

  // Candle width for a span, snapped to GeckoTerminal's supported granularities; widens as the span grows.
  private pickTimeframe(spanSeconds: number): {
    timeframe: GeckoTimeframe;
    aggregate: number;
    intervalSeconds: number;
  } {
    if (spanSeconds <= 15 * 60) {
      return { timeframe: "second", aggregate: 30, intervalSeconds: 30 };
    }
    if (spanSeconds <= 60 * 60) {
      return { timeframe: "minute", aggregate: 1, intervalSeconds: 60 };
    }
    if (spanSeconds <= 6 * 60 * 60) {
      return { timeframe: "minute", aggregate: 5, intervalSeconds: 300 };
    }
    if (spanSeconds <= 24 * 60 * 60) {
      return { timeframe: "minute", aggregate: 15, intervalSeconds: 900 };
    }
    if (spanSeconds <= 4 * 24 * 60 * 60) {
      return { timeframe: "hour", aggregate: 1, intervalSeconds: 3_600 };
    }
    if (spanSeconds <= 12 * 24 * 60 * 60) {
      return { timeframe: "hour", aggregate: 4, intervalSeconds: 14_400 };
    }
    if (spanSeconds <= 30 * 24 * 60 * 60) {
      return { timeframe: "hour", aggregate: 12, intervalSeconds: 43_200 };
    }
    return { timeframe: "day", aggregate: 1, intervalSeconds: 86_400 };
  }

  // Ranked by volume first, not reserve_in_usd
  private pickBestPool(pools: { attributes: PoolAttributes }[]): string | null {
    if (pools.length === 0) {
      return null;
    }
    const ranked = [...pools].sort((a, b) => {
      const volumeA = Number(a.attributes.volume_usd?.h24 || 0);
      const volumeB = Number(b.attributes.volume_usd?.h24 || 0);
      if (volumeB !== volumeA) {
        return volumeB - volumeA;
      }
      return (
        Number(b.attributes.reserve_in_usd || 0) -
        Number(a.attributes.reserve_in_usd || 0)
      );
    });
    return ranked[0]?.attributes.address || null;
  }

  private resolvePool = async (
    network: string,
    tokenAddress: string,
  ): Promise<[string | null, Error | null]> => {
    const cacheKey = `pool_${network}_${tokenAddress}`;
    const cached = this.poolCache.get(cacheKey);
    if (cached !== null) {
      return [cached, null];
    }

    try {
      const response = await axios.get(
        `${BASE_URL}/networks/${network}/tokens/${tokenAddress}/pools`,
        { params: { page: 1 }, timeout: 10_000 },
      );
      const pools = (response.data?.data || []) as {
        attributes: PoolAttributes;
      }[];
      const poolAddress = this.pickBestPool(pools);
      if (poolAddress) {
        this.poolCache.set(cacheKey, poolAddress);
      }
      return [poolAddress, null];
    } catch (err: any) {
      logEveryWhere({ message: `resolvePool() error: ${err?.message}` });
      return [null, err];
    }
  };

  private fetchOhlcv = async (
    network: string,
    poolAddress: string,
    tokenAddress: string,
    timeframe: GeckoTimeframe,
    aggregate: number,
    beforeTimestamp: number,
    limit: number,
  ): Promise<[ICandle[] | null, Error | null]> => {
    try {
      const response = await axios.get(
        `${BASE_URL}/networks/${network}/pools/${poolAddress}/ohlcv/${timeframe}`,
        {
          params: {
            aggregate,
            token: tokenAddress,
            currency: "usd",
            limit: Math.min(limit, 1000),
            before_timestamp: beforeTimestamp,
          },
          timeout: 10_000,
        },
      );
      const rows = (response.data?.data?.attributes?.ohlcv_list ||
        []) as number[][];
      const candles: ICandle[] = rows
        .map(([timestamp, open, high, low, close, volume]) => ({
          timestamp,
          open,
          high,
          low,
          close,
          volume,
        }))
        .sort((a, b) => a.timestamp - b.timestamp);
      return [candles, null];
    } catch (err: any) {
      logEveryWhere({ message: `fetchOhlcv() error: ${err?.message}` });
      return [null, err];
    }
  };

  // Single call, capped at 1,000 bars
  getTokenCandles = async (
    chain: string,
    tokenAddress: string,
    fromTimestamp: number,
    toTimestamp: number,
  ): Promise<[ITokenCandles | null, Error | null]> => {
    const network = MAP_CHAIN_KEY_TO_GECKOTERMINAL_NETWORK[chain];
    if (!network) {
      return [
        null,
        new Error(`No GeckoTerminal coverage for chain "${chain}"`),
      ];
    }

    const spanSeconds = Math.max(toTimestamp - fromTimestamp, 60);
    const { timeframe, aggregate, intervalSeconds } =
      this.pickTimeframe(spanSeconds);
    const cacheKey = `candles_${network}_${tokenAddress}_${timeframe}_${aggregate}_${fromTimestamp}_${toTimestamp}`;
    const cached = this.candleCache.get(cacheKey);
    if (cached !== null) {
      return [
        { candles: cached, intervalSeconds, timeframe, aggregate, network },
        null,
      ];
    }

    const [poolAddress, poolErr] = await this.resolvePool(
      network,
      tokenAddress,
    );
    if (poolErr || !poolAddress) {
      return [null, poolErr || new Error("No pool found for this token")];
    }

    const limit = Math.min(1000, Math.ceil(spanSeconds / intervalSeconds) + 5);
    const [candles, ohlcvErr] = await this.fetchOhlcv(
      network,
      poolAddress,
      tokenAddress,
      timeframe,
      aggregate,
      toTimestamp,
      limit,
    );
    if (ohlcvErr || !candles) {
      return [null, ohlcvErr || new Error("Failed to load candles")];
    }

    this.candleCache.set(cacheKey, candles);
    return [{ candles, intervalSeconds, timeframe, aggregate, network }, null];
  };
}

const CACHE_TIME_MS = 60_000;
const geckoTerminal = new GeckoTerminal(CACHE_TIME_MS);
export { geckoTerminal };
