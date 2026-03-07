import { Wallet, ethers } from "ethers";
import Big from "big.js";
import { EVMProvider } from "@/electron/simulator/category/onchain/evm";
import {
  TOKEN_TYPE,
  EVM_TRANSACTION_TYPE,
  MAP_KYBER_ROUTER_ADDRESS_BY_CHAIN,
  PLATFORM_EVM_WALLET,
  PLATFORM_SWAP_FEE_BPS,
} from "@/electron/constant";
import { ERC20_ABI } from "@/electron/simulator/category/onchain/abi/erc20";
import { ISwapKyberswapInput } from "@/electron/type";
import { sendWithTimeout } from "@/electron/simulator/util";
import { logEveryWhere } from "@/electron/service/util";
import type { IStructuredLogPayload } from "@/electron/type";
import { KyberSwapClient } from "./client";

export const zero = ethers.BigNumber.from(0);

export class SwapOnKyberswap {
  private listNodeEndpoint: string[];
  private evmProvider: EVMProvider;
  private kyberswapClient: KyberSwapClient;

  constructor(_listNodeEndpoint: string[]) {
    this.listNodeEndpoint = _listNodeEndpoint;
    this.evmProvider = new EVMProvider();
    this.kyberswapClient = new KyberSwapClient(
      PLATFORM_SWAP_FEE_BPS,
      PLATFORM_EVM_WALLET
    );
  }

  private async getNonce(
    walletAddress: string,
    provider: ethers.providers.JsonRpcProvider
  ): Promise<number> {
    const currentNonce = await provider?.getTransactionCount(walletAddress);
    return currentNonce;
  }

  async swapLikeBuyBot(
    input: ISwapKyberswapInput,
    privateKey: string,
    numberOfTransaction: number,
    timeout: number,
    logInfo: IStructuredLogPayload
  ): Promise<Error | null> {
    const startTime = new Date().getTime();
    const listResult: Promise<any>[] = [];

    const [provider, , errProvider] = this.evmProvider.getNextProvider(
      this.listNodeEndpoint
    );
    if (!provider) {
      return Error("can not get provider " + errProvider?.message);
    }
    const wallet = new ethers.Wallet(privateKey, provider);

    await this.checkApproval(input, wallet, provider, timeout, logInfo);
    const currentNonce = await this.getNonce(wallet?.address, provider);

    for (let i = 0; i < numberOfTransaction; i++) {
      const nonce = currentNonce! + i;
      const resultPromise = this.swap(
        input,
        wallet,
        nonce,
        provider,
        timeout,
        logInfo
      );
      listResult.push(resultPromise);
    }

    if (input.shouldWaitTransactionComfirmed) {
      await Promise.all(listResult);
    }
    const endTime = new Date().getTime();
    logEveryWhere({
      campaignId: logInfo.campaignId,
      workflowId: logInfo.workflowId,
      message: `Executing Kyberswap trade with wallet ${wallet?.address
        }, all ${numberOfTransaction} transaction done, take: ${(endTime - startTime) / 1000
        } seconds`,
    });
    return null;
  }

  async swapNormal(
    input: ISwapKyberswapInput,
    privateKey: string,
    timeout: number,
    logInfo: IStructuredLogPayload
  ): Promise<[string | null, Error | null]> {
    const [provider, , errProvider] = this.evmProvider.getNextProvider(
      this.listNodeEndpoint
    );
    if (!provider || errProvider) {
      return [null, Error("can not get provider " + errProvider?.message)];
    }

    const wallet = new ethers.Wallet(privateKey, provider);
    await this.checkApproval(input, wallet, provider, timeout, logInfo);
    const nonce = await this.getNonce(wallet?.address, provider);
    return this.swap(input, wallet, nonce, provider, timeout, logInfo);
  }

  private async validateSwap(
    input: ISwapKyberswapInput,
    wallet: ethers.Wallet
  ): Promise<Error | null> {
    if (isNaN(Number(input.amount)) || Number(input.amount) <= 0) {
      return Error("amount must greater or equal to 0");
    }

    const [balance, err] = await this.evmProvider.getWalletBalance(
      this.listNodeEndpoint,
      input.isInputNativeToken
        ? TOKEN_TYPE.NATIVE_TOKEN
        : TOKEN_TYPE.EVM_ERC20_TOKEN,
      wallet?.address,
      input.inputTokenAddress,
      15000
    );
    if (err) {
      return err;
    }

    if (Number(balance) < Number(input.amount)) {
      return Error("not enough balance");
    }

    return null;
  }

  private async swap(
    input: ISwapKyberswapInput,
    wallet: ethers.Wallet,
    nonce: number,
    provider: ethers.providers.JsonRpcProvider,
    timeout: number,
    logInfo: IStructuredLogPayload
  ): Promise<[string | null, Error | null]> {
    try {
      const validatedErr = await this.validateSwap(input, wallet);
      if (validatedErr) {
        return [null, validatedErr];
      }

      if (input.isInputNativeToken) {
        input.inputTokenDecimal = 18;
      } else {
        const [inputTokenContract] = await this.evmProvider.getTokenContract(
          [provider.connection.url],
          input.inputTokenAddress
        );
        input.inputTokenDecimal = inputTokenContract?.decimal || 0;
      }

      if (input.isOutputNativeToken) {
        input.outputTokenDecimal = 18;
      } else {
        const [outputTokenContract] = await this.evmProvider.getTokenContract(
          [provider.connection.url],
          input.outputTokenAddress
        );
        input.outputTokenDecimal = outputTokenContract?.decimal || 0;
      }

      return this.executeSwap(input, wallet, nonce, timeout, logInfo);
    } catch (err: any) {
      return [null, err];
    }
  }

  private async checkApproval(
    input: ISwapKyberswapInput,
    wallet: ethers.Wallet,
    provider: ethers.providers.JsonRpcProvider,
    timeout: number,
    logInfo: IStructuredLogPayload
  ): Promise<[string | null, Error | null]> {
    // do not need approval if input is native token
    if (input.isInputNativeToken) {
      return [null, null];
    }

    const inputTokenContract = new ethers.Contract(
      input.inputTokenAddress,
      ERC20_ABI,
      wallet
    );
    const approvalAmount = await inputTokenContract?.allowance(
      wallet?.address,
      MAP_KYBER_ROUTER_ADDRESS_BY_CHAIN[input.chainKey]
    );

    const amountIn = this.getAmountIn(
      input.amount,
      input.inputTokenDecimal
    ).toString();
    if (new Big(approvalAmount).gte(new Big(amountIn.toString()))) {
      return [null, null];
    }

    let approvalTxHash: string | null = null;
    let gasPrice = input?.gasPrice || ethers.BigNumber.from(0);
    if (!input.isUseCustomGasPrice) {
      const suggestedGasFee = await provider?.getFeeData();
      gasPrice = suggestedGasFee.gasPrice || ethers.BigNumber.from(0);
    }

    const approvalTx = await inputTokenContract.approve(
      MAP_KYBER_ROUTER_ADDRESS_BY_CHAIN[input.chainKey],
      ethers.constants.MaxUint256,
      {
        gasPrice,
      }
    );
    await sendWithTimeout(approvalTx.wait(), timeout);
    approvalTxHash = approvalTx.hash;
    logEveryWhere({
      campaignId: logInfo.campaignId,
      workflowId: logInfo.workflowId,
      message: `Executing Kyberswap trade with wallet: ${wallet?.address}, approve transaction hash: ${approvalTx.hash}`,
    });

    return [approvalTxHash, null];
  }

  // return [txHash, error]
  private async executeSwap(
    input: ISwapKyberswapInput,
    wallet: Wallet,
    nonce: number,
    timeout: number,
    logInfo: IStructuredLogPayload
  ): Promise<[string | null, Error | null]> {
    const [routeSummary, priceImpact, err] =
      await this.kyberswapClient.getSwapRoute(input);
    if (err) {
      return [null, err];
    }
    if (!priceImpact) {
      return [null, Error("can not get price impact")];
    }
    if (!routeSummary) {
      return [null, Error("can not get swap route")];
    }

    logEveryWhere({
      campaignId: logInfo.campaignId,
      workflowId: logInfo.workflowId,
      message: `Executing Kyberswap trade with price impact: ${priceImpact?.toFixed(
        2
      )}%, slippage: ${input.slippage}%`,
    });

    if (input.priceImpact && priceImpact > input.priceImpact) {
      return [
        null,
        Error(
          `Kyberswap trade error, price impact is too high, max is ${input.priceImpact
          }%, current is ${priceImpact?.toFixed(2)}%`
        ),
      ];
    }

    const [swapTxData, errSwapTxData] =
      await this.kyberswapClient.getSwapTxData(input, routeSummary, wallet);
    if (errSwapTxData) {
      return [null, errSwapTxData];
    }
    if (!swapTxData) {
      return [null, Error("can not get swap tx data")];
    }
    if (
      swapTxData?.routerAddress?.toLowerCase() !==
      MAP_KYBER_ROUTER_ADDRESS_BY_CHAIN[input.chainKey]
    ) {
      return [
        null,
        Error(
          `router address is not correct, get ${swapTxData?.routerAddress
          }, expect ${MAP_KYBER_ROUTER_ADDRESS_BY_CHAIN[input.chainKey]}`
        ),
      ];
    }

    const amountIn = this.getAmountIn(input.amount, input.inputTokenDecimal);
    const [provider, , errProvider] = this.evmProvider.getNextProvider(
      this.listNodeEndpoint
    );
    if (!provider || errProvider) {
      return [null, Error("can not get provider " + errProvider?.message)];
    }

    let gasLimit = input.gasLimit;
    const transactionValue = input.isInputNativeToken ? amountIn : zero;

    const [estimatedGasLimit, errGasLimit] = await this.getGasLimit(
      swapTxData?.data,
      wallet?.address,
      swapTxData?.routerAddress,
      transactionValue.toString(),
      provider
    );
    if (errGasLimit) {
      return [null, errGasLimit];
    }
    if (
      (!input.isUseCustomGasLimit || gasLimit.toString() === "0") &&
      estimatedGasLimit !== null
    ) {
      // Multiply by 1.5 (add 50% buffer) - use mul(3).div(2) since BigNumber doesn't accept decimals
      gasLimit = estimatedGasLimit.mul(3).div(2);
    }

    const isEip1559 = input.transactionType === EVM_TRANSACTION_TYPE.EIP_1559;
    let gasPrice = input.gasPrice;
    let maxFeePerGas = input.maxFeePerGas;
    let maxPriorityFeePerGas = input.maxPriorityFeePerGas;
    if (!input.isUseCustomGasPrice) {
      const suggestedGasFee = await provider?.getFeeData();

      if (isEip1559) {
        gasPrice = zero;
        maxFeePerGas = suggestedGasFee.maxFeePerGas || zero;
        maxPriorityFeePerGas = suggestedGasFee.maxPriorityFeePerGas || zero;
      } else {
        gasPrice = suggestedGasFee.gasPrice || zero;
        maxFeePerGas = zero;
        maxPriorityFeePerGas = zero;
      }
    }

    const txRequest: ethers.providers.TransactionRequest = {
      data: swapTxData?.data,
      to: swapTxData?.routerAddress,
      value: transactionValue,
      from: wallet?.address,
      type: isEip1559 ? 2 : 1,
      gasPrice: isEip1559 ? undefined : gasPrice || undefined,
      maxFeePerGas: isEip1559 ? maxFeePerGas : undefined,
      maxPriorityFeePerGas: isEip1559 ? maxPriorityFeePerGas : undefined,
      nonce,
      gasLimit: gasLimit || undefined,
    };

    const startTime = new Date().getTime();
    const tx = await wallet.sendTransaction(txRequest);
    if (!input.shouldWaitTransactionComfirmed) {
      return [tx.hash, null];
    }

    await sendWithTimeout(tx.wait(), timeout);
    const endTime = new Date().getTime();
    logEveryWhere({
      campaignId: logInfo.campaignId,
      workflowId: logInfo.workflowId,
      message: `Executing Kyberswap trade with wallet: ${wallet?.address
        }, nonce: ${nonce}, transaction hash: ${tx.hash} done, take: ${(endTime - startTime) / 1000
        } seconds`,
    });
    return [tx.hash, null];
  }

  private async getGasLimit(
    transactionData: any,
    from: string,
    to: string,
    value: string,
    provider: ethers.providers.JsonRpcProvider
  ): Promise<[ethers.BigNumber | null, Error | null]> {
    try {
      const gasEstimate = await provider?.estimateGas({
        to,
        data: transactionData,
        from,
        value,
      });
      return [gasEstimate, null];
    } catch (error: any) {
      return [null, error];
    }
  }

  private getAmountIn(amount: string, tokenDecimal: number): ethers.BigNumber {
    // Round amount to token decimal precision to avoid "fractional component exceeds decimals" error
    // Use Big.js to avoid floating point precision issues
    const roundedAmount = new Big(amount).toFixed(tokenDecimal, Big.roundDown);

    const amountIn = ethers.utils.parseUnits(roundedAmount, tokenDecimal);
    return amountIn;
  }
}
