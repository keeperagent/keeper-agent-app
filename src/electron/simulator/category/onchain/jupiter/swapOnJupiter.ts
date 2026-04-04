import Big from "big.js";
import { AxiosProxyConfig } from "axios";
import { Keypair, PublicKey, VersionedTransaction } from "@solana/web3.js";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { logEveryWhere } from "@/electron/service/util";
import type { IStructuredLogPayload } from "@/electron/type";
import { SolanaProvider } from "@/electron/simulator/category/onchain/solana";
import { IJupiterSwapInput } from "@/electron/type";
import { getKeypairFromPrivateKey } from "@/electron/simulator/category/onchain/util";
import {
  PLATFORM_SOL_WALLET,
  PLATFORM_SWAP_FEE_BPS,
  SOL_MINT_ADDRESS,
  USD1_MINT_ADDRESS_ON_SOLANA,
} from "@/electron/constant";
import { JupiterClient } from "./client";

export class SwapOnJupiter {
  private listNodeEndpoint: string[];
  private listJupiterApiKey: string[];
  private provider: SolanaProvider;
  private jupiterClient: JupiterClient;
  private currentJupiterApiKeyIndex: number;
  private platformFeeBps: number;
  private platformFeeTokenAccountWithSol: PublicKey | null; // with SOL
  private platformFeeTokenAccountWithUsd1: PublicKey | null; // with USD1

  constructor(
    listNodeEndpoint: string[],
    listJupiterApiKey: string[],
    solanaProvider: SolanaProvider,
  ) {
    this.listNodeEndpoint = listNodeEndpoint;
    this.listJupiterApiKey = listJupiterApiKey;
    this.provider = solanaProvider;
    this.platformFeeBps = PLATFORM_SWAP_FEE_BPS;
    this.platformFeeTokenAccountWithSol = null;
    this.platformFeeTokenAccountWithUsd1 = null;
    this.jupiterClient = new JupiterClient(this.platformFeeBps);
    this.currentJupiterApiKeyIndex = 0;
  }

  private getFeeTokenAccountWithSol = async (): Promise<PublicKey | null> => {
    if (this.platformFeeTokenAccountWithSol) {
      return this.platformFeeTokenAccountWithSol;
    }

    const solTokenAccount = await getAssociatedTokenAddress(
      new PublicKey(SOL_MINT_ADDRESS),
      new PublicKey(PLATFORM_SOL_WALLET),
      false,
      TOKEN_PROGRAM_ID,
    );
    console.log(`Fee account for SOL: ${solTokenAccount.toBase58()}`);

    this.platformFeeTokenAccountWithSol = solTokenAccount;
    return this.platformFeeTokenAccountWithSol;
  };

  private getFeeTokenAccountWithUsd1 = async (): Promise<PublicKey | null> => {
    if (this.platformFeeTokenAccountWithUsd1) {
      return this.platformFeeTokenAccountWithUsd1;
    }

    const usd1TokenAccount = await getAssociatedTokenAddress(
      new PublicKey(USD1_MINT_ADDRESS_ON_SOLANA),
      new PublicKey(PLATFORM_SOL_WALLET),
      false,
      TOKEN_PROGRAM_ID,
    );
    console.log(`Fee account for USD1: ${usd1TokenAccount.toBase58()}`);

    this.platformFeeTokenAccountWithUsd1 = usd1TokenAccount;
    return this.platformFeeTokenAccountWithUsd1;
  };

  private getJupiterApiKey = (): string => {
    this.currentJupiterApiKeyIndex =
      (this.currentJupiterApiKeyIndex + 1) % this.listJupiterApiKey.length;
    return this.listJupiterApiKey[this.currentJupiterApiKeyIndex];
  };

  swapLikeBuyBot = async (
    swapInput: IJupiterSwapInput,
    privateKey: string,
    numberOfTransaction: number,
    logInfo: IStructuredLogPayload,
    proxy?: AxiosProxyConfig,
  ): Promise<Error | null> => {
    const startTime = new Date().getTime();
    const [wallet, errWallet] = getKeypairFromPrivateKey(privateKey);
    if (!wallet || errWallet) {
      return errWallet;
    }

    const listResult: Promise<any>[] = [];
    for (let i = 0; i < numberOfTransaction; i++) {
      const resultPromise = this.swap(swapInput, wallet, logInfo, proxy);
      listResult.push(resultPromise);
    }

    if (swapInput.shouldWaitTransactionComfirmed) {
      await Promise.all(listResult);
    }

    const endTime = new Date().getTime();
    logEveryWhere({
      campaignId: logInfo.campaignId,
      workflowId: logInfo.workflowId,
      message: `Executing Jupite trade with Wallet ${wallet?.publicKey.toBase58()}, all ${numberOfTransaction} transaction done, take: ${
        (endTime - startTime) / 1000
      } seconds`,
    });
    return null;
  };

  swapNormal = async (
    swapInput: IJupiterSwapInput,
    privateKey: string,
    logInfo: IStructuredLogPayload,
    proxy?: AxiosProxyConfig,
  ): Promise<[string | null, Error | null]> => {
    const [wallet, errWallet] = getKeypairFromPrivateKey(privateKey);
    if (!wallet || errWallet) {
      return [null, errWallet];
    }
    return this.swap(swapInput, wallet, logInfo, proxy);
  };

  private swap = async (
    swapInput: IJupiterSwapInput,
    wallet: Keypair,
    logInfo: IStructuredLogPayload,
    proxy?: AxiosProxyConfig,
  ): Promise<[string | null, Error | null]> => {
    const [provider, , errProvider] = this.provider.getNextProvider(
      this.listNodeEndpoint,
    );
    if (!provider || errProvider) {
      return [null, Error("can not get provider " + errProvider?.message)];
    }

    const decimals = await this.provider.getTokenDecimal(
      swapInput.inputTokenAddress,
      provider,
    );

    // convert readable amount to raw amount
    swapInput = {
      ...swapInput,
      inputTokenDecimals: decimals,
    };
    // Convert readable amount to raw units and ensure it is an integer (no decimals)
    swapInput = {
      ...swapInput,
      amount: new Big(swapInput.amount)
        .mul(Math.pow(10, swapInput.inputTokenDecimals))
        .round(0, Big.roundDown)
        .toString(),
    };

    const apiKey = this.getJupiterApiKey();
    if (!apiKey) {
      return [
        null,
        Error(
          "Jupiter API key is not found, please set it in the Settings page",
        ),
      ];
    }

    let platformFeeTokenAccountWithSol = null;
    // we can only take fee if input token or output token is SOL
    if (
      swapInput.inputTokenAddress === SOL_MINT_ADDRESS ||
      swapInput.outputTokenAddress === SOL_MINT_ADDRESS
    ) {
      platformFeeTokenAccountWithSol = await this.getFeeTokenAccountWithSol();
    }

    let platformFeeTokenAccountWithUsd1 = null;
    if (
      swapInput.inputTokenAddress === USD1_MINT_ADDRESS_ON_SOLANA ||
      swapInput.outputTokenAddress === USD1_MINT_ADDRESS_ON_SOLANA
    ) {
      platformFeeTokenAccountWithUsd1 = await this.getFeeTokenAccountWithUsd1();
    }
    const platformFeeTokenAccount =
      platformFeeTokenAccountWithSol || platformFeeTokenAccountWithUsd1;

    const [quote, errQuote] = await this.jupiterClient.getQuote(
      swapInput,
      apiKey,
      platformFeeTokenAccount,
      proxy,
    );
    if (errQuote || !quote) {
      return [
        null,
        Error("Swap on Jupiter error, can not get quote " + errQuote?.message),
      ];
    }

    const priceImpactPercentage = Math.abs(Number(quote?.priceImpactPct) * 100);
    logEveryWhere({
      campaignId: logInfo.campaignId,
      workflowId: logInfo.workflowId,
      message: `Executing Jupiter trade for wallet ${wallet.publicKey.toBase58()} with price impact: ${priceImpactPercentage}%, slippage: ${
        quote?.slippageBps / 100
      }%`,
    });
    if (priceImpactPercentage > swapInput.maxPriceImpactPercentage) {
      return [
        null,
        Error(
          `Jupiter trade error, price impact is too high, max is ${swapInput.maxPriceImpactPercentage}%, current is ${priceImpactPercentage}%`,
        ),
      ];
    }

    const [swapResponse, errBuildTx] =
      await this.jupiterClient.buildSwapTransaction(
        quote,
        wallet.publicKey.toBase58(),
        swapInput,
        apiKey,
        platformFeeTokenAccount,
        proxy,
      );
    if (errBuildTx) {
      return [null, errBuildTx];
    }

    if (swapResponse.simulationError) {
      return [
        null,
        Error(
          `Simulation failed: ${swapResponse.simulationError.error || swapResponse.simulationError.errorCode}`,
        ),
      ];
    }

    const transactionBase64 = swapResponse.swapTransaction;
    const transaction = VersionedTransaction.deserialize(
      Buffer.from(transactionBase64, "base64") as any,
    );

    transaction.sign([wallet]);
    const transactionBinary = transaction.serialize();

    const startTime = new Date().getTime();
    const signature = await provider.sendRawTransaction(transactionBinary, {
      maxRetries: 5,
      skipPreflight: true,
    });
    if (!swapInput.shouldWaitTransactionComfirmed) {
      return [signature, null];
    }

    const confirmation = await provider.confirmTransaction(
      signature,
      "confirmed",
    );
    if (confirmation.value.err) {
      return [signature, Error(confirmation?.value?.err?.toString())];
    }

    const endTime = new Date().getTime();
    logEveryWhere({
      campaignId: logInfo.campaignId,
      workflowId: logInfo.workflowId,
      message: `Executing Jupiter trade with wallet: ${wallet.publicKey.toBase58()}, transaction hash: ${signature} done, take: ${
        (endTime - startTime) / 1000
      } seconds`,
    });
    return [signature, null];
  };
}
