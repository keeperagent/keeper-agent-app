import { ethers } from "ethers";
import axios, { AxiosProxyConfig } from "axios";
import Big from "big.js";
import { ISwapKyberswapInput } from "@/electron/type";
import { logEveryWhere } from "@/electron/service/util";

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

  constructor(platformFeeBps: number, platformFeeWalletAddress: string) {
    this.platformFeeBps = platformFeeBps;
    this.platformFeeWalletAddress = platformFeeWalletAddress;
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

      if (routeSummary?.amountInUsd === 0) {
        return [null, null, new Error("Invalid amountInUsd")];
      }
      let priceImpact = 100;
      if (routeSummary?.amountInUsd > 0) {
        priceImpact =
          ((routeSummary?.amountInUsd - routeSummary?.amountOutUsd) * 100) /
          routeSummary?.amountInUsd;
      }

      priceImpact = Math.abs(priceImpact);

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
