import { Pricing } from "@/electron/simulator/category/pricing";
import {
  CUSTOM_CHAIN_ID,
  EVM_CHAIN_ID,
  MAP_CHAIN_KEY_TO_NATIVE_COINGECKO_ID,
  PRICE_DATA_SOURCE,
} from "@/electron/constant";
import { logEveryWhere } from "@/electron/service/util";

const CACHE_TIME_MS = 15000;
const pricing = new Pricing(CACHE_TIME_MS);

const getUsdValue = async (
  chain: string,
  tokenAddress: string | undefined,
  humanAmount: string | number | undefined,
  isNative?: boolean,
): Promise<number | undefined> => {
  try {
    const amount = Number(humanAmount);
    if (!amount || Number.isNaN(amount)) {
      return undefined;
    }

    let price: number | null = null;
    let err: Error | null = null;

    if (isNative) {
      const coingeckoId = MAP_CHAIN_KEY_TO_NATIVE_COINGECKO_ID[chain];
      if (!coingeckoId) {
        return undefined;
      }
      [price, err] = await pricing.getTokenPrice({
        name: "wallet_activity_pricing",
        sleep: 0,
        dataSource: PRICE_DATA_SOURCE.COINGECKO,
        coingeckoId,
        timeout: 8,
      });
    } else {
      if (!tokenAddress) {
        return undefined;
      }
      const chainId =
        chain === "solana" ? CUSTOM_CHAIN_ID.SOLANA : EVM_CHAIN_ID[chain];
      if (chainId === undefined) {
        return undefined;
      }
      [price, err] = await pricing.getTokenPrice({
        name: "wallet_activity_pricing",
        sleep: 0,
        dataSource: PRICE_DATA_SOURCE.DEXSCREENER,
        tokenAddress,
        chainId,
        timeout: 8,
      });
    }

    if (err || price === null) {
      return undefined;
    }

    return amount * price;
  } catch (err: any) {
    logEveryWhere({ message: `getUsdValue() error: ${err?.message}` });
    return undefined;
  }
};

export { getUsdValue };
