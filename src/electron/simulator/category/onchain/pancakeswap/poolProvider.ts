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
import {
  PoolType as SmartRouterPoolType,
  InfinityClPool as SmartRouterInfinityClPool,
  InfinityBinPool as SmartRouterInfinityBinPool,
} from "@pancakeswap/smart-router";
import {
  INFI_CL_POOL_MANAGER_ADDRESSES,
  INFI_BIN_POOL_MANAGER_ADDRESSES,
  Pool as InfinityClPool,
  decodeCLPoolParameters,
  decodeBinPoolParameters,
} from "@pancakeswap/infinity-sdk";
import JSBI from "jsbi";
import { UNI_V2_PAIR_ABI } from "@/electron/simulator/category/onchain/abi/uniV2Pool";
import { UNIV3_POOL_ABI } from "@/electron/simulator/category/onchain/abi/uniV3Pool";
import { POOL_TYPE } from "@/electron/constant";
import { TimeoutCache } from "@/electron/service/timeoutCache";
import { logEveryWhere } from "@/electron/service/util";

export type InfinityClPoolData = SmartRouterInfinityClPool & {
  sdkPool: InstanceType<typeof InfinityClPool>;
};

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

    const chainId = this.chainId.toString();
    const clManagerAddress = (
      INFI_CL_POOL_MANAGER_ADDRESSES as Record<string, string>
    )[chainId];
    if (clManagerAddress) {
      try {
        const clManagerContract = new ethers.Contract(
          clManagerAddress,
          [
            "function getSlot0(bytes32 id) view returns (uint160, int24, uint24, uint24)",
          ],
          provider,
        );
        await clManagerContract.getSlot0(poolAddress);
        this.poolTypeCache.set(
          poolAddress,
          POOL_TYPE.PANCAKESWAP_INFINITY_CL_POOL,
        );
        return [POOL_TYPE.PANCAKESWAP_INFINITY_CL_POOL, null];
      } catch (err: any) {
        logEveryWhere({
          message: `getPoolType() PANCAKESWAP_INFINITY_CL_POOL error: ${err?.message}`,
        });
      }
    }

    const binManagerAddress = (
      INFI_BIN_POOL_MANAGER_ADDRESSES as Record<string, string>
    )[chainId];
    if (binManagerAddress) {
      try {
        const binManagerContract = new ethers.Contract(
          binManagerAddress,
          [
            "function getSlot0(bytes32 id) view returns (uint24, uint24, uint24)",
          ],
          provider,
        );
        await binManagerContract.getSlot0(poolAddress);
        this.poolTypeCache.set(
          poolAddress,
          POOL_TYPE.PANCAKESWAP_INFINITY_BIN_POOL,
        );
        return [POOL_TYPE.PANCAKESWAP_INFINITY_BIN_POOL, null];
      } catch (err: any) {
        logEveryWhere({
          message: `getPoolType() PANCAKESWAP_INFINITY_BIN_POOL error: ${err?.message}`,
        });
      }
    }

    return [null, Error("pool is not a valid pancakeswap pool")];
  };

  getInfinityClPool = async (
    poolAddress: string,
    tokenA: ERC20Token,
    tokenB: ERC20Token,
    provider: ethers.providers.JsonRpcProvider,
  ): Promise<[InfinityClPoolData | null, Error | null]> => {
    try {
      const chainId = this.chainId.toString();
      const clManagerAddress = (
        INFI_CL_POOL_MANAGER_ADDRESSES as Record<string, string>
      )[chainId];

      const clManagerContract = new ethers.Contract(
        clManagerAddress,
        [
          "function getSlot0(bytes32 id) view returns (uint160 sqrtPriceX96, int24 tick, uint24 protocolFee, uint24 lpFee)",
          "function getLiquidity(bytes32 id) view returns (uint128 liquidity)",
          "function poolIdToPoolKey(bytes32 id) view returns (address currency0, address currency1, address hooks, address poolManager, uint24 fee, bytes32 parameters)",
        ],
        provider,
      );

      const [slot0, liquidity, poolKey] = await Promise.all([
        clManagerContract.getSlot0(poolAddress),
        clManagerContract.getLiquidity(poolAddress),
        clManagerContract.poolIdToPoolKey(poolAddress),
      ]);

      const sqrtPriceX96 = slot0.sqrtPriceX96.toString();
      const tick = Number(slot0.tick);
      const fee = Number(poolKey.fee);
      const { tickSpacing } = decodeCLPoolParameters(poolKey.parameters);

      const [token0, token1] = tokenA.sortsBefore(tokenB)
        ? [tokenA, tokenB]
        : [tokenB, tokenA];

      const infinityPool = new InfinityClPool({
        poolType: "CL",
        tokenA: token0,
        tokenB: token1,
        fee,
        protocolFee: 0,
        sqrtRatioX96: sqrtPriceX96,
        liquidity: liquidity.toString(),
        tickCurrent: tick,
        tickSpacing,
        ticks: [
          {
            index: nearestUsableTick(TickMath.MIN_TICK, tickSpacing),
            liquidityNet: BigInt(liquidity.toString()),
            liquidityGross: BigInt(liquidity.toString()),
          },
          {
            index: nearestUsableTick(TickMath.MAX_TICK, tickSpacing),
            liquidityNet: -BigInt(liquidity.toString()),
            liquidityGross: BigInt(liquidity.toString()),
          },
        ],
      });

      const clPool: InfinityClPoolData = {
        id: poolAddress as `0x${string}`,
        type: SmartRouterPoolType.InfinityCL as SmartRouterPoolType.InfinityCL,
        currency0: token0,
        currency1: token1,
        fee,
        tickSpacing,
        hooks: poolKey.hooks as `0x${string}`,
        poolManager: clManagerAddress as `0x${string}`,
        sqrtRatioX96: BigInt(sqrtPriceX96),
        liquidity: BigInt(liquidity.toString()),
        tick,
        sdkPool: infinityPool,
      };

      return [clPool, null];
    } catch (err: any) {
      return [null, err];
    }
  };

  getInfinityBinPool = async (
    poolAddress: string,
    tokenA: ERC20Token,
    tokenB: ERC20Token,
    provider: ethers.providers.JsonRpcProvider,
  ): Promise<[SmartRouterInfinityBinPool | null, Error | null]> => {
    try {
      const chainId = this.chainId.toString();
      const binManagerAddress = (
        INFI_BIN_POOL_MANAGER_ADDRESSES as Record<string, string>
      )[chainId];

      const binManagerContract = new ethers.Contract(
        binManagerAddress,
        [
          "function getSlot0(bytes32 id) view returns (uint24 activeId, uint24 protocolFee, uint24 lpFee)",
          "function poolIdToPoolKey(bytes32 id) view returns (address currency0, address currency1, address hooks, address poolManager, uint24 fee, bytes32 parameters)",
        ],
        provider,
      );

      const [slot0, poolKey] = await Promise.all([
        binManagerContract.getSlot0(poolAddress),
        binManagerContract.poolIdToPoolKey(poolAddress),
      ]);

      const activeId = Number(slot0.activeId);
      const fee = Number(poolKey.fee);
      const { binStep } = decodeBinPoolParameters(poolKey.parameters);

      const [token0, token1] = tokenA.sortsBefore(tokenB)
        ? [tokenA, tokenB]
        : [tokenB, tokenA];

      const binPool: SmartRouterInfinityBinPool = {
        id: poolAddress as `0x${string}`,
        type: SmartRouterPoolType.InfinityBIN as SmartRouterPoolType.InfinityBIN,
        currency0: token0,
        currency1: token1,
        fee,
        binStep,
        hooks: poolKey.hooks as `0x${string}`,
        poolManager: binManagerAddress as `0x${string}`,
        activeId,
      };

      return [binPool, null];
    } catch (err: any) {
      return [null, err];
    }
  };
}
