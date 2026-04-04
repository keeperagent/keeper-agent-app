import _ from "lodash";
import axios, { AxiosProxyConfig } from "axios";
import { PublicKey } from "@solana/web3.js";
import { IJupiterSwapInput } from "@/electron/type";
import { logEveryWhere } from "@/electron/service/util";

const JUPITER_BASE_URL = "https://api.jup.ag/swap/v1";

export class JupiterClient {
  private platformFeeBps: number;

  constructor(platformFeeBps: number) {
    this.platformFeeBps = platformFeeBps;
  }

  getQuote = async (
    input: IJupiterSwapInput,
    apiKey: string,
    platformFeeTokenAccount: PublicKey | null,
    proxy?: AxiosProxyConfig,
  ): Promise<[any, Error | null]> => {
    try {
      if (!apiKey) {
        return [null, new Error("apiKey is required")];
      }

      let params: any = {
        inputMint: input.inputTokenAddress,
        outputMint: input.outputTokenAddress,
        amount: input.amount,
        slippageBps: input.slippagePercentage * 100,
        dynamicSlippage: input.dynamicSlippage,
      };
      if (this.platformFeeBps > 0 && platformFeeTokenAccount) {
        params = {
          ...params,
          platformFeeBps: this.platformFeeBps,
          feeAccount: platformFeeTokenAccount.toBase58(),
          instructionVersion: "V2",
        };
      }
      if (input.dynamicSlippage || input.slippagePercentage === 0) {
        params = _.omit(params, ["slippageBps"]);
      }
      const response = await axios.get(`${JUPITER_BASE_URL}/quote`, {
        params,
        headers: {
          "x-api-key": apiKey,
        },
        proxy,
      });

      return [response?.data, null];
    } catch (err: any) {
      logEveryWhere({
        message: `JupiterClient getQuote error: ${JSON.stringify(
          err,
          null,
          2,
        )}`,
      });
      return [null, err];
    }
  };

  buildSwapTransaction = async (
    quoteResponse: any,
    walletAddress: string,
    input: IJupiterSwapInput,
    apiKey: string,
    platformFeeTokenAccount: PublicKey | null,
    proxy?: AxiosProxyConfig,
  ): Promise<[any, Error | null]> => {
    try {
      if (!apiKey) {
        return [null, new Error("apiKey is required")];
      }

      let maxLamports = Number(input?.pritorityFeeMicroLamport || 0);
      if (maxLamports === 0) {
        maxLamports = 100;
      }

      let swapPayload: any = {
        quoteResponse,
        userPublicKey: walletAddress,
        wrapUnwrapSOL: true,
        dynamicComputeUnitLimit: true,
        dynamicSlippage: input.dynamicSlippage,
        prioritizationFeeLamports: {
          priorityLevelWithMaxLamports: {
            maxLamports: maxLamports * 1.25,
            priorityLevel: "high",
          },
        },
      };

      if (this.platformFeeBps > 0 && platformFeeTokenAccount) {
        swapPayload = {
          ...swapPayload,
          platformFeeBps: this.platformFeeBps,
          feeAccount: platformFeeTokenAccount.toBase58(),
        };
      }

      const response = await axios.post(
        `${JUPITER_BASE_URL}/swap`,
        swapPayload,
        {
          headers: {
            "x-api-key": apiKey,
          },
          proxy,
        },
      );

      logEveryWhere({
        message: `JupiterClient buildSwapTransaction response: ${JSON.stringify(
          response?.data,
          null,
          2,
        )}`,
      });
      return [response?.data, null];
    } catch (err: any) {
      logEveryWhere({
        message: `JupiterClient buildSwapTransaction error: ${JSON.stringify(
          err,
          null,
          2,
        )}`,
      });
      return [null, err];
    }
  };
}
