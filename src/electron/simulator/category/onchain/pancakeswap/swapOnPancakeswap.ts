import { ChainId } from "@pancakeswap/chains";
import { BigNumber, Wallet, ethers } from "ethers";
import Big from "big.js";
import {
  CurrencyAmount,
  ERC20Token,
  Native,
  Pair,
  Percent,
  TradeType,
  Route as V2Route,
  Trade as V2Trade,
} from "@pancakeswap/sdk";
import { Pool, Trade as V3Trade, Route as V3Route } from "@pancakeswap/v3-sdk";
import {
  PoolType,
  RouteType,
  SmartRouterTrade,
  V2Pool,
  V3Pool,
  SmartRouter,
} from "@pancakeswap/smart-router";
import { getBinPoolTokenPrice } from "@pancakeswap/infinity-sdk";
import {
  PermitSingle,
  AllowanceTransfer,
  getPermit2Address,
} from "@pancakeswap/permit2-sdk";
import { AllowanceProvider } from "@uniswap/permit2-sdk";
import {
  PancakeSwapOptions,
  Permit2Signature,
  getUniversalRouterAddress,
  PancakeSwapUniversalRouter,
} from "@pancakeswap/universal-router-sdk";
import { PoolProvider } from "./poolProvider";
import type { InfinityClPoolData } from "./poolProvider";
import type { InfinityBinPool as SmartRouterInfinityBinPool } from "@pancakeswap/smart-router";
import { EVMProvider } from "@/electron/simulator/category/onchain/evm";
import {
  TOKEN_TYPE,
  POOL_TYPE,
  EVM_TRANSACTION_TYPE,
} from "@/electron/constant";
import { ERC20_ABI } from "@/electron/simulator/category/onchain/abi/erc20";
import { ISwapEVMInput } from "@/electron/type";
import { sendWithTimeout } from "@/electron/simulator/util";
import { zero } from "@/electron/simulator/category/onchain/uniswap/swapOnUniswap";
import { logEveryWhere } from "@/electron/service/util";
import type { IStructuredLogPayload } from "@/electron/type";

type AddressType = `0x${string}`;

export class SwapOnPancakeswap {
  private chainId: ChainId;
  private listNodeEndpoint: string[];
  private evmProvider: EVMProvider;
  private poolProvider: PoolProvider;

  constructor(_chainId: ChainId, _listNodeEndpoint: string[]) {
    this.chainId = _chainId;
    this.listNodeEndpoint = _listNodeEndpoint;
    this.evmProvider = new EVMProvider();
    this.poolProvider = new PoolProvider(this.chainId);
  }

  private async getNonce(
    walletAddress: string,
    provider: ethers.providers.JsonRpcProvider,
  ): Promise<number> {
    const currentNonce = await provider?.getTransactionCount(walletAddress);
    return currentNonce;
  }

  async swapLikeBuyBot(
    input: ISwapEVMInput,
    privateKey: string,
    numberOfTransaction: number,
    timeout: number,
    logInfo: IStructuredLogPayload,
  ): Promise<Error | null> {
    const startTime = new Date().getTime();
    const listResult: Promise<any>[] = [];

    const [provider, , errProvider] = this.evmProvider.getNextProvider(
      this.listNodeEndpoint,
    );
    if (!provider) {
      return Error("can not get provider " + errProvider?.message);
    }
    const wallet = new ethers.Wallet(privateKey, provider);
    await this.checkApprovalForPermit2Contract(
      input,
      wallet,
      provider,
      timeout,
      logInfo,
    );
    const currentNonce = await this.getNonce(wallet?.address, provider);

    for (let i = 0; i < numberOfTransaction; i++) {
      const nonce = currentNonce! + i;
      const resultPromise = this.swap(
        input,
        wallet,
        nonce,
        provider,
        timeout,
        i,
        logInfo,
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
      message: `Executing Pancakeswap trade with wallet ${
        wallet?.address
      }, all ${numberOfTransaction} transaction done, take: ${
        (endTime - startTime) / 1000
      } seconds`,
    });
    return null;
  }

  async swapNormal(
    input: ISwapEVMInput,
    privateKey: string,
    timeout: number,
    logInfo: IStructuredLogPayload,
  ): Promise<[string | null, Error | null]> {
    const [provider, , errProvider] = this.evmProvider.getNextProvider(
      this.listNodeEndpoint,
    );
    if (!provider || errProvider) {
      return [null, Error("can not get provider " + errProvider?.message)];
    }

    const wallet = new ethers.Wallet(privateKey, provider);
    await this.checkApprovalForPermit2Contract(
      input,
      wallet,
      provider,
      timeout,
      logInfo,
    );
    const nonce = await this.getNonce(wallet?.address, provider);
    return this.swap(input, wallet, nonce, provider, timeout, 0, logInfo);
  }

  private async validateSwap(
    input: ISwapEVMInput,
    wallet: ethers.Wallet,
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
      15000,
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
    input: ISwapEVMInput,
    wallet: ethers.Wallet,
    nonce: number,
    provider: ethers.providers.JsonRpcProvider,
    timeout: number,
    txIndex: number,
    logInfo: IStructuredLogPayload,
  ): Promise<[string | null, Error | null]> {
    try {
      const [poolType, poolTypeErr] = await this.poolProvider.getPoolType(
        input.poolAddress,
        provider,
      );
      if (poolTypeErr) {
        return [null, poolTypeErr];
      }
      if (!poolType) {
        return [null, Error("can not get pool type")];
      }

      input = {
        ...input,
        poolType: poolType! as POOL_TYPE,
      };

      const validatedErr = await this.validateSwap(input, wallet);
      if (validatedErr) {
        return [null, validatedErr];
      }

      const [inputTokenContract] = await this.evmProvider.getTokenContract(
        [provider.connection.url],
        input.inputTokenAddress,
      );
      input.inputTokenDecimal = inputTokenContract?.decimal || 0;
      if (input.isInputNativeToken) {
        input.inputTokenDecimal = Native.onChain(this.chainId).decimals;
      }

      const [outputTokenContract] = await this.evmProvider.getTokenContract(
        [provider.connection.url],
        input.outputTokenAddress,
      );
      input.outputTokenDecimal = outputTokenContract?.decimal || 0;
      if (input.isOutputNativeToken) {
        input.outputTokenDecimal = Native.onChain(this.chainId).decimals;
      }

      const [inputTokenPermit, err] = await this.prepareSwap(
        input,
        wallet,
        provider,
        txIndex,
      );
      if (err) {
        return [null, err];
      }

      return this.executeSwap(
        input,
        wallet,
        inputTokenPermit,
        nonce,
        timeout,
        logInfo,
      );
    } catch (err: any) {
      return [null, err];
    }
  }

  // return [inputTokenPermit, error]
  private async prepareSwap(
    input: ISwapEVMInput,
    wallet: Wallet,
    provider: ethers.providers.JsonRpcProvider,
    txIndex: number,
  ): Promise<[Permit2Signature | undefined, Error | null]> {
    if (input.isInputNativeToken) {
      return [undefined, null];
    }
    const permit2Address = getPermit2Address(this.chainId as any);
    if (!permit2Address) {
      return [undefined, Error("can not get permit2 address")];
    }

    // get permit signature for swap
    const allowanceProvider = new AllowanceProvider(provider, permit2Address);
    let inputTokenPermit: Permit2Signature | undefined = undefined;
    const {
      amount: permitAmount,
      expiration,
      nonce,
    } = await allowanceProvider.getAllowanceData(
      input.inputTokenAddress,
      wallet?.address,
      getUniversalRouterAddress(this.chainId as any),
    );

    if (permitAmount.eq(0) || new Date().getTime() / 1000 > expiration) {
      const maxValue = ethers.constants.MaxUint256;
      let approvalAmount = this.getAmountIn(
        input.amount,
        input.inputTokenDecimal,
      );
      if (maxValue.lt(approvalAmount)) {
        approvalAmount = maxValue;
      }

      const permitSingle: PermitSingle = {
        details: {
          token: input.inputTokenAddress,
          amount: approvalAmount.toString(),
          expiration: this.toDeadline(input.dealineInSecond),
          nonce: nonce + txIndex, // use with @txIndex to prevent duplicate @nonce in permit approval
        },
        spender: getUniversalRouterAddress(this.chainId as any),
        sigDeadline: this.toDeadline(input.dealineInSecond),
      };

      const { domain, types, values } = AllowanceTransfer.getPermitData(
        permitSingle,
        getPermit2Address(this.chainId as any),
        this.chainId,
      );
      const permitSignature = await wallet._signTypedData(
        domain,
        types,
        values,
      );
      inputTokenPermit = {
        ...permitSingle,
        signature: permitSignature as AddressType,
      };
    }

    return [inputTokenPermit, null];
  }

  private async checkApprovalForPermit2Contract(
    input: ISwapEVMInput,
    wallet: ethers.Wallet,
    provider: ethers.providers.JsonRpcProvider,
    timeout: number,
    logInfo: IStructuredLogPayload,
  ): Promise<[string | null, Error | null]> {
    // do not need approval if input is native token
    if (input.isInputNativeToken) {
      return [null, null];
    }

    const permit2Address = getPermit2Address(this.chainId as any);
    const inputTokenContract = new ethers.Contract(
      input.inputTokenAddress,
      ERC20_ABI,
      wallet,
    );
    const approvalAmount = await inputTokenContract?.allowance(
      wallet?.address,
      permit2Address,
    );
    let approvalTxHash: string | null = null;
    let gasPrice = input?.gasPrice || ethers.BigNumber.from(0);
    if (!input.isUseCustomGasPrice) {
      const suggestedGasFee = await provider?.getFeeData();
      gasPrice = suggestedGasFee.gasPrice || ethers.BigNumber.from(0);
    }

    if (
      !ethers.constants.MaxUint256.eq(
        ethers.BigNumber.from(approvalAmount?.toString()),
      )
    ) {
      // approve unlimit amount for Permit2 contract
      const approvalTx = await inputTokenContract.approve(
        permit2Address,
        ethers.constants.MaxUint256,
        { gasPrice },
      );
      await sendWithTimeout(approvalTx.wait(), timeout);
      approvalTxHash = approvalTx.hash;
      logEveryWhere({
        campaignId: logInfo.campaignId,
        workflowId: logInfo.workflowId,
        message: `Executing Pancakeswap trade with wallet: ${wallet?.address}, approve tx hash: ${approvalTx.hash}`,
      });
    }

    return [approvalTxHash, null];
  }

  private getSwapToken(input: ISwapEVMInput): [ERC20Token, ERC20Token] {
    const inputToken = new ERC20Token(
      this.chainId,
      input.inputTokenAddress as AddressType,
      input.inputTokenDecimal,
      "",
    );

    const outputToken = new ERC20Token(
      this.chainId,
      input.outputTokenAddress as AddressType,
      input.outputTokenDecimal,
      "",
    );

    return [inputToken, outputToken];
  }

  // return [txHash, error]
  private async executeSwap(
    input: ISwapEVMInput,
    wallet: Wallet,
    inputTokenPermit: Permit2Signature | undefined,
    nonce: number,
    timeout: number,
    logInfo: IStructuredLogPayload,
  ): Promise<[string | null, Error | null]> {
    const [inputToken, outputToken] = this.getSwapToken(input);
    const amountIn = this.getAmountIn(input.amount, input.inputTokenDecimal);

    const nativeToken = Native.onChain(this.chainId);
    const tokenUsedAsInput = input.isInputNativeToken
      ? nativeToken
      : inputToken;
    const tokenUsedAsOutput = input.isOutputNativeToken
      ? nativeToken
      : outputToken;

    const options: PancakeSwapOptions = {
      slippageTolerance: this.createPercentFromString(
        input.slippage?.toString(),
      ),
      deadlineOrPreviousBlockhash: this.toDeadline(input.dealineInSecond),
      recipient: wallet?.address as AddressType,
      inputTokenPermit,
    };

    const [provider, , errProvider] = this.evmProvider.getNextProvider(
      this.listNodeEndpoint,
    );
    if (!provider || errProvider) {
      return [null, Error("can not get provider " + errProvider?.message)];
    }

    let tradeCommand: SmartRouterTrade<TradeType> | null = null;
    if (input.poolType === POOL_TYPE.PANCAKESWAP_V3_POOL) {
      const [pool, v3PoolErr] = await this.poolProvider.getPancakeV3Pool(
        inputToken,
        outputToken,
        input.poolAddress,
        provider,
      );
      if (v3PoolErr || !pool) {
        return [null, v3PoolErr];
      }

      tradeCommand = await this.getPancakeV3TradeCommand(
        tokenUsedAsInput,
        tokenUsedAsOutput,
        pool,
        amountIn,
      );
    } else if (input.poolType === POOL_TYPE.PANCAKESWAP_V2_POOL) {
      const [pool, v2PoolErr] = await this.poolProvider.getPancakeV2Pool(
        inputToken,
        outputToken,
        input.poolAddress,
        provider,
      );
      if (v2PoolErr || !pool) {
        return [null, v2PoolErr];
      }

      tradeCommand = this.getPancakeV2TradeCommand(
        tokenUsedAsInput,
        tokenUsedAsOutput,
        pool,
        amountIn,
      );
    } else if (input.poolType === POOL_TYPE.PANCAKESWAP_INFINITY_CL_POOL) {
      const [clPool, clPoolErr] = await this.poolProvider.getInfinityClPool(
        input.poolAddress,
        inputToken,
        outputToken,
        provider,
      );
      if (clPoolErr || !clPool) {
        return [null, clPoolErr];
      }
      tradeCommand = await this.getInfinityClTradeCommand(
        tokenUsedAsInput,
        tokenUsedAsOutput,
        clPool,
        amountIn,
      );
    } else if (input.poolType === POOL_TYPE.PANCAKESWAP_INFINITY_BIN_POOL) {
      const [binPool, binPoolErr] = await this.poolProvider.getInfinityBinPool(
        input.poolAddress,
        inputToken,
        outputToken,
        provider,
      );
      if (binPoolErr || !binPool) {
        return [null, binPoolErr];
      }
      tradeCommand = this.getInfinityBinTradeCommand(
        tokenUsedAsInput,
        tokenUsedAsOutput,
        binPool,
        amountIn,
      );
    }
    if (tradeCommand === null) {
      return [null, Error("can not build trade")];
    }

    const priceImpact = Math.abs(
      Number(SmartRouter.getPriceImpact(tradeCommand)?.toSignificant(2)),
    );
    logEveryWhere({
      campaignId: logInfo.campaignId,
      workflowId: logInfo.workflowId,
      message: `Execute Pancakeswap trade with price impact: ${priceImpact}%, slippage: ${input.slippage}%`,
    });
    if (input.priceImpact && priceImpact > input.priceImpact) {
      return [
        null,
        Error(
          `Pancakeswap trade error, price impact is too high, max is ${input.priceImpact}%, current is ${priceImpact}%`,
        ),
      ];
    }

    const params = PancakeSwapUniversalRouter.swapERC20CallParameters(
      tradeCommand,
      options,
    );

    const toAddress = getUniversalRouterAddress(this.chainId as any);
    let gasLimit = input.gasLimit;
    const transactionValue = input.isInputNativeToken ? amountIn : zero;
    const [estimatedGasLimit, errGasLimit] = await this.getGasLimit(
      params?.calldata,
      wallet?.address,
      toAddress,
      transactionValue.toString(),
      provider,
    );
    if (errGasLimit) {
      return [null, errGasLimit];
    }
    if (!input.isUseCustomGasLimit && estimatedGasLimit !== null) {
      gasLimit = estimatedGasLimit;
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
      data: params.calldata,
      to: toAddress,
      value: transactionValue,
      from: wallet?.address,
      type: isEip1559 ? 2 : 1,
      gasPrice: isEip1559 ? 0 : gasPrice,
      maxFeePerGas: isEip1559 ? maxFeePerGas : undefined,
      maxPriorityFeePerGas: isEip1559 ? maxPriorityFeePerGas : undefined,
      nonce,
      gasLimit,
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
      message: `Executing Pancakeswap trade with wallet: ${
        wallet?.address
      }, nonce: ${nonce}, transaction hash: ${tx.hash} done, take: ${
        (endTime - startTime) / 1000
      } seconds`,
    });
    return [tx.hash, null];
  }

  private getPancakeV2TradeCommand(
    inputToken: ERC20Token | Native,
    outputToken: ERC20Token | Native,
    pair: Pair,
    amountIn: ethers.BigNumber,
  ): SmartRouterTrade<TradeType> {
    const swapRoute = new V2Route([pair], inputToken, outputToken);
    const trade = new V2Trade(
      swapRoute,
      CurrencyAmount.fromRawAmount(inputToken, amountIn.toString()),
      TradeType.EXACT_INPUT,
    );

    const v2Pool: V2Pool = {
      type: PoolType.V2,
      reserve0: pair.reserve0,
      reserve1: pair.reserve1,
    };

    const routerTrade: SmartRouterTrade<TradeType> = {
      tradeType: trade.tradeType,
      inputAmount: trade.inputAmount,
      outputAmount: trade.outputAmount,
      routes: [
        {
          type: RouteType.V2,
          path: trade.route.path,
          inputAmount: trade.inputAmount,
          outputAmount: trade.outputAmount,
          percent: 100,
          pools: [v2Pool],
        },
      ],
      gasEstimate: BigInt(0),
      gasEstimateInUSD: CurrencyAmount.fromRawAmount(trade.route.input, 0),
    };
    return routerTrade;
  }

  private async getPancakeV3TradeCommand(
    inputToken: ERC20Token | Native,
    outputToken: ERC20Token | Native,
    pool: Pool,
    amountIn: ethers.BigNumber,
  ): Promise<SmartRouterTrade<TradeType>> {
    const swapRoute = new V3Route([pool], inputToken, outputToken);
    const trade = await V3Trade.fromRoute(
      swapRoute,
      CurrencyAmount.fromRawAmount(inputToken, amountIn.toString()),
      TradeType.EXACT_INPUT,
    );

    const v3Pool: V3Pool = {
      type: PoolType.V3,
      token0: pool.token0,
      token1: pool.token1,
      fee: pool.fee,
      sqrtRatioX96: pool.sqrtRatioX96,
      liquidity: pool.liquidity,
      tick: pool.tickCurrent,
      address: Pool.getAddress(pool.token0, pool.token1, pool.fee),
      token0ProtocolFee: new Percent(0, 100),
      token1ProtocolFee: new Percent(0, 100),
    };

    const routerTrade: SmartRouterTrade<TradeType> = {
      tradeType: trade.tradeType,
      inputAmount: trade.inputAmount,
      outputAmount: trade.outputAmount,
      routes: [
        {
          type: RouteType.V3,
          path: trade.swaps[0].route.tokenPath,
          inputAmount: trade.inputAmount,
          outputAmount: trade.outputAmount,
          percent: 100,
          pools: [v3Pool],
        },
      ],
      gasEstimate: BigInt(0),
      gasEstimateInUSD: CurrencyAmount.fromRawAmount(trade.route.input, 0),
    };
    return routerTrade;
  }

  private async getInfinityClTradeCommand(
    inputToken: ERC20Token | Native,
    outputToken: ERC20Token | Native,
    clPool: InfinityClPoolData,
    amountIn: ethers.BigNumber,
  ): Promise<SmartRouterTrade<TradeType>> {
    const inputCurrencyAmount = CurrencyAmount.fromRawAmount(
      inputToken,
      amountIn.toString(),
    );
    const inputTokenForPool = inputToken.isNative
      ? inputToken.wrapped
      : (inputToken as ERC20Token);
    const inputAmountForPool = CurrencyAmount.fromRawAmount(
      inputTokenForPool,
      amountIn.toString(),
    );
    const [outputCurrencyAmount] = await clPool.sdkPool.getOutputAmount(
      inputAmountForPool as any,
    );

    const routerTrade: SmartRouterTrade<TradeType> = {
      tradeType: TradeType.EXACT_INPUT,
      inputAmount: inputCurrencyAmount,
      outputAmount: outputCurrencyAmount,
      routes: [
        {
          type: RouteType.InfinityCL,
          path: [inputToken, outputToken],
          inputAmount: inputCurrencyAmount,
          outputAmount: outputCurrencyAmount,
          percent: 100,
          pools: [clPool],
        },
      ],
      gasEstimate: BigInt(0),
      gasEstimateInUSD: CurrencyAmount.fromRawAmount(inputToken, 0),
    };
    return routerTrade;
  }

  private getInfinityBinTradeCommand(
    inputToken: ERC20Token | Native,
    outputToken: ERC20Token | Native,
    binPool: SmartRouterInfinityBinPool,
    amountIn: ethers.BigNumber,
  ): SmartRouterTrade<TradeType> {
    const inputCurrencyAmount = CurrencyAmount.fromRawAmount(
      inputToken,
      amountIn.toString(),
    );

    const price = getBinPoolTokenPrice(
      {
        currencyX: binPool.currency0,
        currencyY: binPool.currency1,
        binStep: BigInt(binPool.binStep),
        activeId: BigInt(binPool.activeId),
      },
      inputToken,
    );
    const outputCurrencyAmount = price.quote(
      inputCurrencyAmount as any,
    ) as typeof inputCurrencyAmount;

    const routerTrade: SmartRouterTrade<TradeType> = {
      tradeType: TradeType.EXACT_INPUT,
      inputAmount: inputCurrencyAmount,
      outputAmount: outputCurrencyAmount,
      routes: [
        {
          type: RouteType.InfinityBIN,
          path: [inputToken, outputToken],
          inputAmount: inputCurrencyAmount,
          outputAmount: outputCurrencyAmount,
          percent: 100,
          pools: [binPool],
        },
      ],
      gasEstimate: BigInt(0),
      gasEstimateInUSD: CurrencyAmount.fromRawAmount(inputToken, 0),
    };
    return routerTrade;
  }

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
    } catch (error: any) {
      return [null, error];
    }
  }

  private toDeadline(expirationInSecond: number) {
    return Math.floor((Date.now() + expirationInSecond * 1000) / 1000);
  }

  private getAmountIn(amount: string, tokenDecimal: number): ethers.BigNumber {
    // Round amount to token decimal precision to avoid "fractional component exceeds decimals" error
    // Use Big.js to avoid floating point precision issues
    const roundedAmount = new Big(amount).toFixed(tokenDecimal, Big.roundDown);

    const amountIn = ethers.utils.parseUnits(roundedAmount, tokenDecimal);
    return amountIn;
  }

  private createPercentFromString(percentString: string): Percent {
    const [_integerPart, decimalPart] = percentString.split(".");
    const decimalPlaces = decimalPart ? decimalPart.length : 0;
    const numerator = BigNumber.from(percentString.replace(".", ""));
    const denominator = BigNumber.from(10).pow(decimalPlaces + 2); // +2 to account for percentage

    return new Percent(numerator.toString(), denominator.toString());
  }
}
