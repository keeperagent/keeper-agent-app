import { ethers } from "ethers";
import axios, { AxiosProxyConfig } from "axios";
import Big from "big.js";
import { ISwapKyberswapInput } from "@/electron/type";
import { logEveryWhere } from "@/electron/service/util";
import { TimeoutCache } from "@/electron/service/timeoutCache";

const KYBER_BASE_URL = "https://aggregator-api.kyberswap.com";

type ISwapTxData = {
  amountIn: string;
  amountInUsd: number;
  amountOut: string;
  amountOutUsd: number;
  data: string;
  routerAddress: string;
  gas: string;
  transactionValue: string;
};

export class KyberSwapClient {
  private platformFeeBps: number;
  private platformFeeWalletAddress: string;
  private spotRateCache: TimeoutCache<number>;
  private spotRateInFlight: Map<string, Promise<Big>>;

  constructor(platformFeeBps: number, platformFeeWalletAddress: string) {
    this.platformFeeBps = platformFeeBps;
    this.platformFeeWalletAddress = platformFeeWalletAddress;
    this.spotRateCache = new TimeoutCache<number>(1000); // 1 second TTL
    this.spotRateInFlight = new Map();
  }

  getSwapRoute = async (
    input: ISwapKyberswapInput,
    proxy?: AxiosProxyConfig,
  ): Promise<[any, number | null, Error | null]> => {
    const targetPath = `${KYBER_BASE_URL}/${input.chainKey}/api/v1/routes`;

    try {
      // Round amount to token decimal precision to avoid "fractional component exceeds decimals" error
      // Use Big.js to avoid floating point precision issues
      const roundedAmount = new Big(input.amount).toFixed(
        input.inputTokenDecimal,
        Big.roundDown,
      );

      // Convert amount to BigNumber and then to string to avoid scientific notation
      const amountInBigNumber = ethers.utils.parseUnits(
        roundedAmount,
        input.inputTokenDecimal,
      );
      const amountInString = amountInBigNumber.toString();

      let params: any = {
        tokenIn: input.inputTokenAddress,
        tokenOut: input.outputTokenAddress,
        amountIn: amountInString,
        includedSources: input.includedSources,
        excludedSources: input.excludedSources,
      };
      if (this.platformFeeBps > 0 && this.platformFeeWalletAddress) {
        let chargeFeeBy = "currency_in";
        if (input.isInputNativeToken) {
          chargeFeeBy = "currency_in";
        }
        if (input.isOutputNativeToken) {
          chargeFeeBy = "currency_out";
        }
        params = {
          ...params,
          isInBps: true,
          feeAmount: this.platformFeeBps,
          feeReceiver: this.platformFeeWalletAddress,
          chargeFeeBy: chargeFeeBy,
        };
      }

      const { data } = await axios.get(targetPath, {
        params,
        timeout: 10000,
        headers: { "x-client-id": "KeeperAgent" },
        proxy,
      });

      const routeSummary = data?.data?.routeSummary;

      // KyberSwap public API sometimes returns amountOutUsd=0 when it can't price
      // the output token — this makes the USD-based formula produce 100% impact.
      // Fall back to spot rate calculation in that case.
      let priceImpact: number | null = null;
      if (routeSummary?.amountInUsd > 0 && routeSummary?.amountOutUsd > 0) {
        priceImpact = Math.abs(
          ((routeSummary.amountInUsd - routeSummary.amountOutUsd) * 100) /
            routeSummary.amountInUsd,
        );
      }

      return [routeSummary, priceImpact, null];
    } catch (error: any) {
      logEveryWhere({
        message: `KyberSwap getSwapRoute error: ${JSON.stringify(
          error,
          null,
          2,
        )}`,
      });
      return [null, null, new Error(error?.message)];
    }
  };

  private buildSpotRateCacheKey = (input: ISwapKyberswapInput): string => {
    const feeKeyPart =
      this.platformFeeBps > 0 && this.platformFeeWalletAddress
        ? `-fee${this.platformFeeBps}-${this.platformFeeWalletAddress}`
        : "";
    return `${input.chainKey}-${input.inputTokenAddress}-${input.outputTokenAddress}-${input.includedSources}-${input.excludedSources}${feeKeyPart}`;
  };

  private buildSpotRateRouteParams = (
    input: ISwapKyberswapInput,
    amountIn: string,
  ): Record<string, unknown> => {
    const params: Record<string, unknown> = {
      tokenIn: input.inputTokenAddress,
      tokenOut: input.outputTokenAddress,
      amountIn,
      includedSources: input.includedSources,
      excludedSources: input.excludedSources,
    };
    if (this.platformFeeBps > 0 && this.platformFeeWalletAddress) {
      return {
        ...params,
        isInBps: true,
        feeAmount: this.platformFeeBps,
        feeReceiver: this.platformFeeWalletAddress,
        chargeFeeBy: input.isOutputNativeToken ? "currency_out" : "currency_in",
      };
    }
    return params;
  };

  // Call the Kyber /routes endpoint with a 1-unit reference amount to obtain
  // the spot rate (near-zero price impact)
  private callSpotRateApi = async (
    input: ISwapKyberswapInput,
    cacheKey: string,
    proxy?: AxiosProxyConfig,
  ): Promise<Big> => {
    try {
      const referenceAmountIn = ethers.utils
        .parseUnits("1", input.inputTokenDecimal)
        .toString();

      const { data } = await axios.get(
        `${KYBER_BASE_URL}/${input.chainKey}/api/v1/routes`,
        {
          params: this.buildSpotRateRouteParams(input, referenceAmountIn),
          timeout: 10000,
          headers: { "x-client-id": "KeeperAgent" },
          proxy,
        },
      );

      const refSummary = data?.data?.routeSummary;
      if (!refSummary?.amountIn || !refSummary?.amountOut) {
        throw new Error("can not get reference route for price impact");
      }

      const spotRate = new Big(refSummary.amountOut)
        .div(new Big(10).pow(input.outputTokenDecimal))
        .div(
          new Big(refSummary.amountIn).div(
            new Big(10).pow(input.inputTokenDecimal),
          ),
        );

      this.spotRateCache.set(cacheKey, spotRate.toNumber());
      return spotRate;
    } finally {
      this.spotRateInFlight.delete(cacheKey);
    }
  };

  // Return the cached spot rate, or start/join a single in-flight request so
  // concurrent callers with the same cacheKey share one API call
  private resolveSpotRate = (
    input: ISwapKyberswapInput,
    cacheKey: string,
    proxy?: AxiosProxyConfig,
  ): Promise<Big> => {
    const cached = this.spotRateCache.get(cacheKey);
    if (cached !== null) {
      return Promise.resolve(new Big(cached));
    }

    let inFlightPromise = this.spotRateInFlight.get(cacheKey);
    if (!inFlightPromise) {
      inFlightPromise = this.callSpotRateApi(input, cacheKey, proxy);
      this.spotRateInFlight.set(cacheKey, inFlightPromise);
    }
    return inFlightPromise;
  };

  getPriceImpactFromSpotRate = async (
    input: ISwapKyberswapInput,
    routeSummary: any,
    proxy?: AxiosProxyConfig,
  ): Promise<[number | null, Error | null]> => {
    try {
      const cacheKey = this.buildSpotRateCacheKey(input);
      const spotRate = await this.resolveSpotRate(input, cacheKey, proxy);

      const executionRate = new Big(routeSummary.amountOut)
        .div(new Big(10).pow(input.outputTokenDecimal))
        .div(
          new Big(routeSummary.amountIn).div(
            new Big(10).pow(input.inputTokenDecimal),
          ),
        );

      const priceImpact = spotRate
        .minus(executionRate)
        .div(spotRate)
        .times(100)
        .toNumber();

      return [Math.abs(priceImpact), null];
    } catch (error: any) {
      return [null, new Error(error?.message)];
    }
  };

  getSwapTxData = async (
    input: ISwapKyberswapInput,
    routeSummary: any,
    wallet: ethers.Wallet,
    proxy?: AxiosProxyConfig,
  ): Promise<[ISwapTxData | null, Error | null]> => {
    try {
      const targetPath = `${KYBER_BASE_URL}/${input.chainKey}/api/v1/route/build`;

      const requestBody = {
        routeSummary: routeSummary,
        sender: wallet.address,
        recipient: wallet.address,
        slippageTolerance: input.slippage * 100, // because slippageTolerance is in bps (1/100 of 1%), input.slippage is in percentage
        deadline: this.toDeadline(input.dealineInSecond),
        source: "KeeperAgent",
      };

      const { data } = await axios.post(targetPath, requestBody, {
        timeout: 10000,
        headers: { "x-client-id": "KeeperAgent" },
        proxy,
      });
      const resData = data?.data;
      const txData: ISwapTxData = {
        amountIn: resData?.amountIn,
        amountInUsd: Number(resData?.amountInUsd),
        amountOut: resData?.amountOut,
        amountOutUsd: Number(resData?.amountOutUsd),
        data: resData?.data,
        routerAddress: resData?.routerAddress,
        gas: resData?.gas,
        transactionValue: resData?.transactionValue,
      };

      return [txData, null];
    } catch (error: any) {
      logEveryWhere({
        message: `KyberSwap getSwapTxData error: ${JSON.stringify(
          error,
          null,
          2,
        )}`,
      });
      return [null, new Error(error?.message)];
    }
  };

  private toDeadline(expirationInSecond: number) {
    return Math.floor((Date.now() + expirationInSecond * 1000) / 1000);
  }
}
