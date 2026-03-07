import { ethers } from "ethers";
import {
  CurrencyAmount,
  ERC20Token,
  Pair,
  computePairAddress,
  FACTORY_ADDRESS_MAP,
  ChainId,
} from "@pancakeswap/sdk";
import {
  Pool,
  FeeAmount,
  nearestUsableTick,
  TickMath,
  TICK_SPACINGS,
} from "@pancakeswap/v3-sdk";
import JSBI from "jsbi";
import { UNI_V2_PAIR_ABI } from "@/electron/simulator/category/onchain/abi/uniV2Pool";
import { UNIV3_POOL_ABI } from "@/electron/simulator/category/onchain/abi/uniV3Pool";
import { POOL_TYPE } from "@/electron/constant";
import { TimeoutCache } from "@/electron/service/timeoutCache";
import { logEveryWhere } from "@/electron/service/util";

export class PoolProvider {
  chainId: number;
  private poolTypeCache: TimeoutCache<string>;

  constructor(_chainId: number) {
    this.chainId = _chainId;
    this.poolTypeCache = new TimeoutCache(5 * 60 * 60 * 1000); // 5 hours
  }

  getPancakeV3Pool = async (
    tokenA: ERC20Token,
    tokenB: ERC20Token,
    poolAddress: string,
    provider: ethers.providers.JsonRpcProvider,
  ): Promise<[Pool | null, Error | null]> => {
    const poolContract = new ethers.Contract(
      poolAddress,
      UNIV3_POOL_ABI,
      provider,
    );

    let [token0Address, token1Address, fee, liquidity, slot0] =
      await Promise.all([
        poolContract.token0(),
        poolContract.token1(),
        poolContract.fee(),
        poolContract.liquidity(),
        poolContract.slot0(),
      ]);

    if (
      (token0Address?.toLowerCase() !== tokenA?.address?.toLowerCase() &&
        token0Address?.toLowerCase() !== tokenB?.address?.toLowerCase()) ||
      (token1Address?.toLowerCase() !== tokenA?.address?.toLowerCase() &&
        token1Address?.toLowerCase() !== tokenB?.address?.toLowerCase())
    ) {
      return [null, Error("pool address and token address does not match")];
    }

    fee = Number(fee);
    liquidity = liquidity?.toString();
    let sqrtPriceX96 = slot0[0]?.toString();
    const tick = Number(slot0[1]);

    const feeTier = fee as FeeAmount;
    const [token0, token1] = tokenA.sortsBefore(tokenB)
      ? [tokenA, tokenB]
      : [tokenB, tokenA];

    liquidity = JSBI.BigInt(liquidity.toString());
    sqrtPriceX96 = JSBI.BigInt(sqrtPriceX96.toString());

    const pool = new Pool(
      token0,
      token1,
      feeTier,
      sqrtPriceX96?.toString(),
      liquidity?.toString(),
      Number(tick),
      [
        {
          index: nearestUsableTick(TickMath.MIN_TICK, TICK_SPACINGS[feeTier]),
          liquidityNet: liquidity,
          liquidityGross: liquidity,
        },
        {
          index: nearestUsableTick(TickMath.MAX_TICK, TICK_SPACINGS[feeTier]),
          liquidityNet: JSBI.multiply(liquidity, JSBI.BigInt("-1")),
          liquidityGross: liquidity,
        },
      ],
    );

    return [pool, null];
  };

  getPancakeV2Pool = async (
    tokenA: ERC20Token,
    tokenB: ERC20Token,
    poolAddress: string,
    provider: ethers.providers.JsonRpcProvider,
  ): Promise<[Pair | null, Error | null]> => {
    const computedPoolAddress = computePairAddress({
      factoryAddress: FACTORY_ADDRESS_MAP[this.chainId as ChainId],
      tokenA,
      tokenB,
    });
    if (poolAddress?.toLowerCase() !== computedPoolAddress?.toLowerCase()) {
      return [null, Error("pool address and token address does not match")];
    }
    const contract = new ethers.Contract(
      poolAddress,
      UNI_V2_PAIR_ABI,
      provider,
    );
    const { reserve0, reserve1 } = await contract.getReserves();
    const [token0, token1] = tokenA.sortsBefore(tokenB)
      ? [tokenA, tokenB]
      : [tokenB, tokenA];
    const pool = new Pair(
      CurrencyAmount.fromRawAmount(token0, reserve0),
      CurrencyAmount.fromRawAmount(token1, reserve1),
    );
    return [pool, null];
  };

  getPoolType = async (
    poolAddress: string,
    provider: ethers.providers.JsonRpcProvider,
  ): Promise<[string | null, Error | null]> => {
    const cachedPoolType = this.poolTypeCache.get(poolAddress);
    if (cachedPoolType) {
      return [cachedPoolType, null];
    }

    try {
      const poolContract = new ethers.Contract(
        poolAddress,
        UNIV3_POOL_ABI,
        provider,
      );
      await poolContract.slot0();
      this.poolTypeCache.set(poolAddress, POOL_TYPE.PANCAKESWAP_V3_POOL);
      return [POOL_TYPE.PANCAKESWAP_V3_POOL, null];
    } catch (err: any) {
      logEveryWhere({
        message: `getPoolType() PANCAKESWAP_V3_POOL error: ${err?.message}`,
      });
    }

    try {
      const poolContract = new ethers.Contract(
        poolAddress,
        UNI_V2_PAIR_ABI,
        provider,
      );
      await poolContract.getReserves();
      this.poolTypeCache.set(poolAddress, POOL_TYPE.PANCAKESWAP_V2_POOL);
      return [POOL_TYPE.PANCAKESWAP_V2_POOL, null];
    } catch (err: any) {
      logEveryWhere({
        message: `getPoolType() PANCAKESWAP_V2_POOL error: ${err?.message}`,
      });
    }

    return [null, Error("pool is not a valid pancakeswap pool")];
  };
}
