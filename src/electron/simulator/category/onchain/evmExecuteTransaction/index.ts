import { ethers } from "ethers";
import { EVMProvider } from "@/electron/simulator/category/onchain/evm";
import { EVM_TRANSACTION_TYPE } from "@/electron/constant";
import { IExecuteTransactionNodeConfig } from "@/electron/type";
import { sendWithTimeout } from "@/electron/simulator/util";
import { logEveryWhere } from "@/electron/service/util";
import type { IStructuredLogPayload } from "@/electron/type";

export const zero = ethers.BigNumber.from(0);

export class EvmTransactionExecutor {
  private evmProvider: EVMProvider;

  constructor() {
    this.evmProvider = new EVMProvider();
  }

  private async getNonce(
    walletAddress: string,
    provider: ethers.providers.JsonRpcProvider,
  ): Promise<number> {
    const currentNonce = await provider?.getTransactionCount(walletAddress);
    return currentNonce;
  }

  async executeSingleTransaction(
    input: IExecuteTransactionNodeConfig,
    listNodeEndpoint: string[],
    privateKey: string,
    timeout: number,
    logInfo: IStructuredLogPayload,
  ): Promise<[string | null, Error | null]> {
    const [provider, , errProvider] =
      this.evmProvider.getNextProvider(listNodeEndpoint);
    if (!provider || errProvider) {
      return [null, Error("can not get provider " + errProvider?.message)];
    }

    const wallet = new ethers.Wallet(privateKey, provider);
    const nonce = await this.getNonce(wallet?.address, provider);
    return this.executeTransaction(
      input,
      provider,
      wallet,
      nonce,
      timeout,
      logInfo,
    );
  }

  executeTransaction = async (
    input: IExecuteTransactionNodeConfig,
    provider: ethers.providers.JsonRpcProvider,
    wallet: ethers.Wallet,
    nonce: number,
    timeout: number,
    logInfo: IStructuredLogPayload,
  ): Promise<[string | null, Error | null]> => {
    const gasPriceStr = input.gasPrice || "";
    const gasLimitStr = input.gasLimit || "";
    const isCustomGasLimit = gasLimitStr !== "" && gasLimitStr !== "0";
    const isCustomGasPrice = gasPriceStr !== "" && gasPriceStr !== "0";

    const transactionValue = input.transactionValue || zero;

    const [estimatedGasLimit, errGasLimit] = await this.getGasLimit(
      input?.transactionData,
      wallet?.address,
      input?.toAddress || "",
      transactionValue.toString(),
      provider,
    );
    if (errGasLimit) {
      return [null, errGasLimit];
    }

    const gasLimit: ethers.BigNumber | null = isCustomGasLimit
      ? ethers.BigNumber.from(gasLimitStr)
      : estimatedGasLimit;

    const isEip1559 = input.transactionType === EVM_TRANSACTION_TYPE.EIP_1559;
    let gasPrice: ethers.BigNumber = zero;
    let maxFeePerGas = input.maxFeePerGas;
    let maxPriorityFeePerGas = input.maxPriorityFeePerGas;

    if (isCustomGasPrice) {
      gasPrice = ethers.utils.parseUnits(gasPriceStr, "gwei");
    } else {
      const suggestedGasFee = await provider?.getFeeData();
      if (isEip1559) {
        maxFeePerGas = suggestedGasFee.maxFeePerGas || zero;
        maxPriorityFeePerGas = suggestedGasFee.maxPriorityFeePerGas || zero;
      } else {
        gasPrice = suggestedGasFee.gasPrice || zero;
        maxFeePerGas = zero;
        maxPriorityFeePerGas = zero;
      }
    }

    const txRequest: ethers.providers.TransactionRequest = {
      data: input?.transactionData,
      to: input?.toAddress ? input?.toAddress : undefined,
      value: transactionValue,
      from: wallet?.address,
      type: isEip1559 ? 2 : 1,
      gasPrice: isEip1559 ? 0 : gasPrice,
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
      message: `Execute transaction with wallet: ${
        wallet?.address
      }, nonce: ${nonce}, transaction hash: ${tx.hash} done, take: ${
        (endTime - startTime) / 1000
      } seconds`,
    });
    return [tx.hash, null];
  };

  private async getGasLimit(
    transactionData: any,
    from: string,
    to: string,
    value: string,
    provider: ethers.providers.JsonRpcProvider,
  ): Promise<[ethers.BigNumber | null, Error | null]> {
    try {
      const gasEstimate = await provider?.estimateGas({
        to,
        data: transactionData,
        from,
        value,
      });

      return [gasEstimate, null];
    } catch (err: any) {
      return [null, err];
    }
  }
}
