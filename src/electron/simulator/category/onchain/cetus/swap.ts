import BN from "bn.js";
import Big from "big.js";
import { fromHEX } from "@mysten/sui/utils";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import {
  adjustForSlippage,
  d,
  Percentage,
  TickMath,
} from "@cetusprotocol/cetus-sui-clmm-sdk";
import { ICetusSwapInput } from "@/electron/type";
import { CetusProvider } from "./provider";
import { logEveryWhere } from "@/electron/service/util";
import type { IStructuredLogPayload } from "@/electron/type";
import { SuiProvider } from "@/electron/simulator/category/onchain/sui";

export class SwapOnCetus {
  private listNodeEndpoint: string[];
  private provider: CetusProvider;
  private suiProvider: SuiProvider;

  constructor(listNodeEndpoint: string[], suiProvider: SuiProvider) {
    this.listNodeEndpoint = listNodeEndpoint;
    this.provider = new CetusProvider();
    this.suiProvider = suiProvider;
  }

  swapLikeBuyBot = async (
    swapInput: ICetusSwapInput,
    privateKey: string,
    numberOfTransaction: number,
    logInfo: IStructuredLogPayload
  ): Promise<Error | null> => {
    const startTime = new Date().getTime();
    const wallet = Ed25519Keypair.fromSecretKey(fromHEX(privateKey));

    const listResult: Promise<any>[] = [];
    for (let i = 0; i < numberOfTransaction; i++) {
      const resultPromise = this.swap(swapInput, wallet, logInfo);
      listResult.push(resultPromise);
    }

    if (swapInput.shouldWaitTransactionComfirmed) {
      await Promise.all(listResult);
    }

    const endTime = new Date().getTime();
    logEveryWhere({
      campaignId: logInfo.campaignId,
      workflowId: logInfo.workflowId,
      message: `Executing Cetus trade with wallet ${wallet?.toSuiAddress()}, all ${numberOfTransaction} transaction done, take: ${
        (endTime - startTime) / 1000
      } seconds`,
    });
    return null;
  };

  swapNormal = async (
    swapInput: ICetusSwapInput,
    privateKey: string,
    logInfo: IStructuredLogPayload
  ): Promise<[string | null, Error | null]> => {
    const wallet = Ed25519Keypair.fromSecretKey(fromHEX(privateKey));
    return this.swap(swapInput, wallet, logInfo);
  };

  swap = async (
    swapInput: ICetusSwapInput,
    wallet: Ed25519Keypair,
    logInfo: IStructuredLogPayload
  ): Promise<[string | null, Error | null]> => {
    const startTime = new Date().getTime();
    const {
      poolAddress,
      inputTokenAddress,
      outputTokenAddress,
      slippagePercentage,
      amount,
    } = swapInput;

    const [client, , errProvider] = this.provider.getNextClient(
      this.listNodeEndpoint
    );
    if (!client) {
      return [null, Error("can not get provider " + errProvider?.message)];
    }

    client.senderAddress = wallet.toSuiAddress(); // sdk will raise error if senderAddress is not set

    const [pool, errPool] = await this.provider.getPool(
      inputTokenAddress,
      outputTokenAddress,
      poolAddress,
      this.listNodeEndpoint
    );
    if (errPool || !pool) {
      return [null, errPool];
    }

    const decimalsA = await this.suiProvider.getTokenDecimal(
      pool?.coinTypeA,
      client.fullClient
    );
    const decimalsB = await this.suiProvider.getTokenDecimal(
      pool?.coinTypeB,
      client.fullClient
    );
    const byAmountIn = true;
    const slippage = Percentage.fromDecimal(d(slippagePercentage));
    const a2b = inputTokenAddress === pool?.coinTypeA;
    // Round amount to token decimal precision before converting to raw units
    const roundedAmount = new Big(amount).toFixed(decimalsA, Big.roundDown);
    const amountIn = new Big(roundedAmount)
      .mul(new Big(Math.pow(10, decimalsA)))
      .round(0, Big.roundDown)
      .toString();
    const res: any = await client.Swap.preswap({
      pool,
      currentSqrtPrice: pool.current_sqrt_price,
      coinTypeA: pool.coinTypeA,
      coinTypeB: pool.coinTypeB,
      decimalsA,
      decimalsB,
      a2b,
      byAmountIn,
      amount: amountIn,
    });
    const { currentSqrtPrice, estimatedEndSqrtPrice } = res;
    const beforePrice = TickMath.sqrtPriceX64ToPrice(
      currentSqrtPrice,
      decimalsA,
      decimalsB
    ).toNumber();
    const afterPrice = TickMath.sqrtPriceX64ToPrice(
      estimatedEndSqrtPrice,
      decimalsA,
      decimalsB
    ).toNumber();
    const priceImpact =
      (Math.abs(afterPrice - beforePrice) * 100) / beforePrice;
    logEveryWhere({
      campaignId: logInfo.campaignId,
      workflowId: logInfo.workflowId,
      message: `Executing Cetus trade with price impact: ${priceImpact}%, slippage: ${swapInput.priceImpactPercentage}%`,
    });
    if (
      swapInput.priceImpactPercentage &&
      priceImpact > swapInput.priceImpactPercentage
    ) {
      return [
        null,
        Error(
          `Cetus trade error, price impact is too high, max is ${swapInput.priceImpactPercentage}%, current is ${priceImpact}%`
        ),
      ];
    }

    const toAmount = byAmountIn
      ? new BN(res.estimatedAmountOut)
      : new BN(res.estimatedAmountIn);

    const amountLimit = adjustForSlippage(toAmount, slippage, !byAmountIn);

    const transaction = await client.Swap.createSwapTransactionPayload({
      pool_id: pool.poolAddress,
      a2b,
      by_amount_in: byAmountIn,
      amount: amount.toString(),
      amount_limit: amountLimit.toString(),
      coinTypeA: pool.coinTypeA,
      coinTypeB: pool.coinTypeB,
    });

    if (swapInput.gasPrice) {
      transaction.setGasPrice(swapInput.gasPrice);
    }
    const transactionBlockRes =
      await client.fullClient.signAndExecuteTransaction({
        transaction,
        signer: wallet,
      });

    const txHash = transactionBlockRes?.digest;

    if (!swapInput.shouldWaitTransactionComfirmed) {
      return [txHash, null];
    }

    await client.fullClient.waitForTransaction({ digest: txHash });
    const endTime = new Date().getTime();
    logEveryWhere({
      campaignId: logInfo.campaignId,
      workflowId: logInfo.workflowId,
      message: `Executing Cetus trade with wallet: ${wallet.toSuiAddress()}, transaction hash: ${txHash} done, take: ${
        (endTime - startTime) / 1000
      } seconds`,
    });
    return [txHash, null];
  };
}
