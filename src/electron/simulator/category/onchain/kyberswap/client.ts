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

  constructor(platformFeeBps: number, platformFeeWalletAddress: string) {
    this.platformFeeBps = platformFeeBps;
    this.platformFeeWalletAddress = platformFeeWalletAddress;
    this.spotRateCache = new TimeoutCache<number>(1000); // 1 second TTL
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

      logEveryWhere({
        message: `KyberSwap getSwapRoute response: ${JSON.stringify(
          routeSummary,
          null,
          2,
        )}`,
      });

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

  getPriceImpactFromSpotRate = async (
    input: ISwapKyberswapInput,
    routeSummary: any,
    proxy?: AxiosProxyConfig,
  ): Promise<[number | null, Error | null]> => {
    try {
      // Cache the spot rate for 1 second to avoid spamming the API
      // when many workflow threads swap the same token pair simultaneously
      const cacheKey = `${input.chainKey}-${input.inputTokenAddress}-${input.outputTokenAddress}`;
      let spotRate: Big;
      const cachedSpotRate = this.spotRateCache.get(cacheKey);
      if (cachedSpotRate !== null) {
        spotRate = new Big(cachedSpotRate);
      } else {
        // Query a 1-unit reference amount to get the spot rate (near-zero price impact)
        const referenceAmountIn = ethers.utils
          .parseUnits("1", input.inputTokenDecimal)
          .toString();

        const { data } = await axios.get(
          `${KYBER_BASE_URL}/${input.chainKey}/api/v1/routes`,
          {
            params: {
              tokenIn: input.inputTokenAddress,
              tokenOut: input.outputTokenAddress,
              amountIn: referenceAmountIn,
            },
            timeout: 10000,
            headers: { "x-client-id": "KeeperAgent" },
            proxy,
          },
        );

        const refSummary = data?.data?.routeSummary;
        if (!refSummary?.amountIn || !refSummary?.amountOut) {
          return [
            null,
            new Error("can not get reference route for price impact"),
          ];
        }

        spotRate = new Big(refSummary.amountOut)
          .div(new Big(10).pow(input.outputTokenDecimal))
          .div(
            new Big(refSummary.amountIn).div(
              new Big(10).pow(input.inputTokenDecimal),
            ),
          );

        this.spotRateCache.set(cacheKey, spotRate.toNumber());
      }

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
      logEveryWhere({
        message: `KyberSwap getSwapTxData response: ${JSON.stringify(
          txData,
          null,
          2,
        )}`,
      });
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
