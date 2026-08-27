import { walletActivityDB } from "@/electron/database/walletActivity";
import { logEveryWhere } from "@/electron/service/util";
import { IWalletActivity } from "@/electron/type";
import { getUsdValue } from "@/electron/service/tokenPrice";

const normalizeAddress = (address: string | undefined, chain: string) => {
  if (!address) {
    return address;
  }
  return chain === "solana" ? address : address.toLowerCase();
};

type IRecordActivityOptions = {
  isToken0Native?: boolean;
  isToken1Native?: boolean;
};

const recordActivity = async (
  data: IWalletActivity,
  options: IRecordActivityOptions = {},
): Promise<void> => {
  try {
    const [token0UsdValue, token1UsdValue] = await Promise.all([
      data.token0UsdValue ??
        getUsdValue(
          data.chain!,
          data.token0Address,
          data.token0Amount,
          options.isToken0Native,
        ),
      data.token1UsdValue ??
        getUsdValue(
          data.chain!,
          data.token1Address,
          data.token1Amount,
          options.isToken1Native,
        ),
    ]);

    const [, err] = await walletActivityDB.createWalletActivity({
      ...data,
      walletAddress: normalizeAddress(data.walletAddress, data.chain!)!,
      token0Address: normalizeAddress(data.token0Address, data.chain!),
      token1Address: normalizeAddress(data.token1Address, data.chain!),
      token0UsdValue,
      token1UsdValue,
    });
    if (err) {
      logEveryWhere({ message: `recordActivity() error: ${err?.message}` });
    }
  } catch (err: any) {
    logEveryWhere({ message: `recordActivity() error: ${err?.message}` });
  }
};

export { recordActivity };
