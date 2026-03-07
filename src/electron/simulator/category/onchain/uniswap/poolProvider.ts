import { ethers } from "ethers";
import {
  Pool,
  TICK_SPACINGS,
  nearestUsableTick,
  FeeAmount,
  TickMath,
} from "@uniswap/v3-sdk";
import { Pool as V4Pool } from "@uniswap/v4-sdk";
import { Pair, computePairAddress, FACTORY_ADDRESS_MAP } from "@uniswap/v2-sdk";
import { Token, CurrencyAmount, Ether } from "@uniswap/sdk-core";
import JSBI from "jsbi";
import { UNI_V2_PAIR_ABI } from "@/electron/simulator/category/onchain/abi/uniV2Pool";
import { UNIV3_POOL_ABI } from "@/electron/simulator/category/onchain/abi/uniV3Pool";
import { POOL_TYPE } from "@/electron/constant";
import { TimeoutCache } from "@/electron/service/timeoutCache";
import { UNIV4_STATE_VIEW_ABI } from "@/electron/simulator/category/onchain/abi/uniV4Pool";
import { UNIV4_POSITION_MANAGER_ABI } from "@/electron/simulator/category/onchain/abi/univ4PositionManager";
import { logEveryWhere } from "@/electron/service/util";
import { subgraphProvider, UniV4PoolInfo } from "./subgraph";

const mapUniV4StateView: { [key: number]: string } = {
  1: "0x7ffe42c4a5deea5b0fec41c94c136cf115597227",
  130: "0x86e8631a016f9068c3f085faf484ee3f5fdee8f2",
  8453: "0xa3c0c9b65bad0b08107aa264b0f3db444b867a71",
  10: "0xc18a3169788f4f75a170290584eca6395c75ecdb",
  42161: "0x76fd297e2d437cd7f76d50f01afe6160f86e9990",
  137: "0x5ea1bd7974c8a611cbab0bdcafcb1d9cc9b3ba5a",
  81457: "0x12a88ae16f46dce4e8b15368008ab3380885df30",
  7777777: "0x385785af07d63b50d0a0ea57c4ff89d06adf7328",
  480: "0x51d394718bc09297262e368c1a481217fdeb71eb",
  57073: "0x76fd297e2d437cd7f76d50f01afe6160f86e9990",
  1868: "0x76fd297e2d437cd7f76d50f01afe6160f86e9990",
  43114: "0xc3c9e198c735a4b97e3e683f391ccbdd60b69286",
  56: "0xd13dd3d6e93f276fafc9db9e6bb47c1180aee0c4",
};

const mapUniV4PositionManager: { [key: number]: string } = {
  1: "0xbd216513d74c8cf14cf4747e6aaa6420ff64ee9e",
  130: "0x4529a01c7a0410167c5740c487a8de60232617bf",
  8453: "0x7c5f5a4bbd8fd63184577525326123b519429bdc",
  10: "0x3c3ea4b57a46241e54610e5f022e5c45859a1017",
  42161: "0xd88f38f930b7952f2db2432cb002e7abbf3dd869",
  137: "0x1ec2ebf4f37e7363fdfe3551602425af0b3ceef9",
  81457: "0x4ad2f4cca2682cbb5b950d660dd458a1d3f1baad",
  7777777: "0xf66c7b99e2040f0d9b326b3b7c152e9663543d63",
  480: "0xc585e0f504613b5fbf874f21af14c65260fb41fa",
  57073: "0x1b35d13a2e2528f192637f14b05f0dc0e7deb566",
  1868: "0x1b35d13a2e2528f192637f14b05f0dc0e7deb566",
  43114: "0xb74b1f14d2754acfcbbe1a221023a5cf50ab8acd",
  56: "0x7a4a5c919ae2541aed11041a1aeee68f1287f95b",
};

export class PoolProvider {
  chainId: number;
  private poolTypeCache: TimeoutCache<string>;
  private uniV4PoolCache: TimeoutCache<UniV4PoolInfo>;

  constructor(_chainId: number) {
    this.chainId = _chainId;
    this.poolTypeCache = new TimeoutCache(5 * 60 * 60 * 1000); // 12 hours
    this.uniV4PoolCache = new TimeoutCache(5 * 60 * 60 * 1000); // 12 hours
  }

  getUniV3Pool = async (
    tokenA: Token,
    tokenB: Token,
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

  getUniV4Pool = async (
    tokenA: Token | Ether,
    tokenB: Token | Ether,
    poolAddress: string,
    provider: ethers.providers.JsonRpcProvider,
  ): Promise<[V4Pool | null, Error | null]> => {
    const stateViewContract = new ethers.Contract(
      mapUniV4StateView[this.chainId],
      UNIV4_STATE_VIEW_ABI,
      provider,
    );
    const positionManagerContract = new ethers.Contract(
      mapUniV4PositionManager[this.chainId],
      UNIV4_POSITION_MANAGER_ABI,
      provider,
    );

    let [slot0, liquidity, poolInfo] = await Promise.all([
      stateViewContract.getSlot0(poolAddress),
      stateViewContract.getLiquidity(poolAddress),
      positionManagerContract.poolKeys(poolAddress?.slice(0, 52)),
    ]);
    const sqrtPriceX96 = JSBI.BigInt(slot0[0]?.toString());
    liquidity = JSBI.BigInt(liquidity?.toString());
    const tick = Number(slot0[1]?.toString());
    const fee = Number(slot0[3]?.toString());
    let tickSpacing = Number(poolInfo[3]);
    let hooks = poolInfo[4];

    if (tickSpacing === 0) {
      const cachedPoolInfo = this.uniV4PoolCache.get(poolAddress);
      if (cachedPoolInfo) {
        tickSpacing = Number(cachedPoolInfo?.tickSpacing);
        hooks = cachedPoolInfo?.hooks;
      } else {
        const [poolInfo, error] = await subgraphProvider.getPool(
          this.chainId,
          poolAddress,
        );
        if (error) {
          return [null, error];
        }

        if (!poolInfo) {
          return [null, Error(`pool not found, poolAddress: ${poolAddress}`)];
        }
        tickSpacing = Number(poolInfo?.tickSpacing);
        hooks = poolInfo?.hooks;
        this.uniV4PoolCache.set(poolAddress, poolInfo);
      }
    }

    if (tickSpacing === 0 || isNaN(tickSpacing)) {
      return [null, Error("tickSpacing is not valid")];
    }

    let token0: Token | Ether = tokenA;
    let token1: Token | Ether = tokenB;
    if (tokenA.isNative) {
      token0 = tokenA;
      token1 = tokenB;
    } else if (tokenB.isNative) {
      token0 = tokenB;
      token1 = tokenA;
    } else {
      [token0, token1] = tokenA.sortsBefore(tokenB)
        ? [tokenA, tokenB]
        : [tokenB, tokenA];
    }

    const pool = new V4Pool(
      token0,
      token1,
      fee,
      tickSpacing,
      hooks,
      sqrtPriceX96,
      liquidity,
      tick,
      [
        {
          index: nearestUsableTick(TickMath.MIN_TICK, tickSpacing),
          liquidityNet: liquidity,
          liquidityGross: liquidity,
        },
        {
          index: nearestUsableTick(TickMath.MAX_TICK, tickSpacing),
          liquidityNet: JSBI.multiply(liquidity, JSBI.BigInt("-1")),
          liquidityGross: liquidity,
        },
      ],
    );
    return [pool, null];
  };

  getUniV2Pool = async (
    tokenA: Token,
    tokenB: Token,
    poolAddress: string,
    provider: ethers.providers.JsonRpcProvider,
  ): Promise<[Pair | null, Error | null]> => {
    const computedPoolAddress = computePairAddress({
      factoryAddress: FACTORY_ADDRESS_MAP[this.chainId],
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
      this.poolTypeCache.set(poolAddress, POOL_TYPE.UNISWAP_V3_POOL);
      return [POOL_TYPE.UNISWAP_V3_POOL, null];
    } catch (err: any) {
      logEveryWhere({
        message: `getPoolType() UNISWAP_V3_POOL error: ${err?.message}`,
      });
    }

    try {
      const poolContract = new ethers.Contract(
        poolAddress,
        UNI_V2_PAIR_ABI,
        provider,
      );
      await poolContract.getReserves();
      this.poolTypeCache.set(poolAddress, POOL_TYPE.UNISWAP_V2_POOL);
      return [POOL_TYPE.UNISWAP_V2_POOL, null];
    } catch (err: any) {
      logEveryWhere({
        message: `getPoolType() UNISWAP_V2_POOL error: ${err?.message}`,
      });
    }

    try {
      const stateViewContract = new ethers.Contract(
        mapUniV4StateView[this.chainId],
        UNIV4_STATE_VIEW_ABI,
        provider,
      );
      await stateViewContract.getLiquidity(poolAddress);
      this.poolTypeCache.set(poolAddress, POOL_TYPE.UNISWAP_V4_POOL);
      return [POOL_TYPE.UNISWAP_V4_POOL, null];
    } catch (err: any) {
      logEveryWhere({
        message: `getPoolType() UNISWAP_V4_POOL error: ${err?.message}`,
      });
    }

    return [null, Error("pool is not a valid uniswap pool")];
  };
}
