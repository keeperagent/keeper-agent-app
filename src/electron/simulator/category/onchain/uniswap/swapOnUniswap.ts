import { BigNumber, Wallet, ethers } from "ethers";
import {
  Currency,
  CurrencyAmount,
  Ether,
  Percent,
  Token,
  TradeType,
} from "@uniswap/sdk-core";
import Big from "big.js";
import {
  SwapOptions,
  UniswapTrade,
  SwapRouter,
  UNIVERSAL_ROUTER_ADDRESS,
  UniversalRouterVersion,
} from "@uniswap/universal-router-sdk";
import {
  Pool as V4Pool,
  Trade as V4Trade,
  Route as V4Route,
} from "@uniswap/v4-sdk";
import { Pool, Trade as V3Trade, Route as V3Route } from "@uniswap/v3-sdk";
import { Trade as V2Trade, Route as V2Route, Pair } from "@uniswap/v2-sdk";
import { Trade as RouterTrade } from "@uniswap/router-sdk";
import { Permit2Permit } from "@uniswap/universal-router-sdk/dist/utils/inputTokens";
import {
  permit2Address,
  AllowanceProvider,
  PermitSingle,
  AllowanceTransfer,
} from "@uniswap/permit2-sdk";
import { PoolProvider } from "./poolProvider";
import { EVMProvider } from "@/electron/simulator/category/onchain/evm";
import {
  TOKEN_TYPE,
  POOL_TYPE,
  EVM_TRANSACTION_TYPE,
} from "@/electron/constant";
import { ERC20_ABI } from "@/electron/simulator/category/onchain/abi/erc20";
import { ISwapEVMInput } from "@/electron/type";
import { sendWithTimeout } from "@/electron/simulator/util";
import { logEveryWhere } from "@/electron/service/util";
import type { IStructuredLogPayload } from "@/electron/type";

export const zero = ethers.BigNumber.from(0);
const nullAddress = "0x0000000000000000000000000000000000000000";

export class SwapOnUniswap {
  private chainId: number;
  private listNodeEndpoint: string[];
  private evmProvider: EVMProvider;
  private poolProvider: PoolProvider;

  constructor(_chainId: number, _listNodeEndpoint: string[]) {
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

    if (input.inputTokenAddress === nullAddress) {
      input.isInputNativeToken = true;
    }
    if (input.outputTokenAddress === nullAddress) {
      input.isOutputNativeToken = true;
    }

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
      message: `Executing Uniswap trade with wallet ${
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

    if (input.inputTokenAddress === nullAddress) {
      input.isInputNativeToken = true;
    }
    if (input.outputTokenAddress === nullAddress) {
      input.isOutputNativeToken = true;
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

      if (input.isInputNativeToken) {
        input.inputTokenDecimal = Ether.onChain(this.chainId)?.decimals;
      } else {
        if (
          poolType === POOL_TYPE.UNISWAP_V4_POOL &&
          input.inputTokenAddress === nullAddress
        ) {
          input.inputTokenDecimal = Ether.onChain(this.chainId)?.decimals;
        } else {
          const [inputTokenContract] = await this.evmProvider.getTokenContract(
            [provider.connection.url],
            input.inputTokenAddress,
          );
          input.inputTokenDecimal = inputTokenContract?.decimal || 0;
        }
      }

      if (input.isOutputNativeToken) {
        input.outputTokenDecimal = Ether.onChain(this.chainId)?.decimals;
      } else {
        if (
          poolType === POOL_TYPE.UNISWAP_V4_POOL &&
          input.outputTokenAddress === nullAddress
        ) {
          input.outputTokenDecimal = Ether.onChain(this.chainId)?.decimals;
        } else {
          const [outputTokenContract] = await this.evmProvider.getTokenContract(
            [provider.connection.url],
            input.outputTokenAddress,
          );
          input.outputTokenDecimal = outputTokenContract?.decimal || 0;
        }
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
  ): Promise<[Permit2Permit | undefined, Error | null]> {
    if (input.isInputNativeToken) {
      return [undefined, null];
    }

    // get permit signature for swap
    const allowanceProvider = new AllowanceProvider(
      provider,
      permit2Address(this.chainId),
    );
    let inputTokenPermit: Permit2Permit | undefined = undefined;
    const {
      amount: permitAmount,
      expiration,
      nonce,
    } = await allowanceProvider.getAllowanceData(
      input.inputTokenAddress,
      wallet?.address,
      UNIVERSAL_ROUTER_ADDRESS(UniversalRouterVersion.V2_0, this.chainId),
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
          amount: approvalAmount,
          expiration: this.toDeadline(input.dealineInSecond),
          nonce: nonce + txIndex, // use with @txIndex to prevent duplicate @nonce in permit approval
        },
        spender: UNIVERSAL_ROUTER_ADDRESS(
          UniversalRouterVersion.V2_0,
          this.chainId,
        ),
        sigDeadline: this.toDeadline(input.dealineInSecond),
      };

      const { domain, types, values } = AllowanceTransfer.getPermitData(
        permitSingle,
        permit2Address(this.chainId),
        this.chainId,
      );
      const permitSignature = await wallet._signTypedData(
        domain,
        types,
        values,
      );
      inputTokenPermit = {
        ...permitSingle,
        signature: permitSignature,
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

    const inputTokenContract = new ethers.Contract(
      input.inputTokenAddress,
      ERC20_ABI,
      wallet,
    );
    const approvalAmount = await inputTokenContract?.allowance(
      wallet?.address,
      permit2Address(this.chainId),
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
        permit2Address(this.chainId),
        ethers.constants.MaxUint256,
        {
          gasPrice,
        },
      );
      await sendWithTimeout(approvalTx.wait(), timeout);
      approvalTxHash = approvalTx.hash;
      logEveryWhere({
        campaignId: logInfo.campaignId,
        workflowId: logInfo.workflowId,
        message: `Executing Uniswap trade with wallet: ${wallet?.address}, approve transaction hash: ${approvalTx.hash}`,
      });
    }

    return [approvalTxHash, null];
  }

  private getSwapToken(input: ISwapEVMInput): [Token, Token] {
    const inputToken = new Token(
      this.chainId,
      input?.inputTokenAddress,
      input.inputTokenDecimal,
    );

    const outputToken = new Token(
      this.chainId,
      input?.outputTokenAddress,
      input.outputTokenDecimal,
    );

    return [inputToken, outputToken];
  }

  // return [txHash, error]
  private async executeSwap(
    input: ISwapEVMInput,
    wallet: Wallet,
    inputTokenPermit: Permit2Permit | undefined,
    nonce: number,
    timeout: number,
    logInfo: IStructuredLogPayload,
  ): Promise<[string | null, Error | null]> {
    const [inputToken, outputToken] = this.getSwapToken(input);
    const amountIn = this.getAmountIn(input.amount, input.inputTokenDecimal);

    const nativeToken = Ether.onChain(this.chainId);
    const tokenUsedAsInput = input.isInputNativeToken
      ? nativeToken
      : inputToken;
    const tokenUsedAsOutput = input.isOutputNativeToken
      ? nativeToken
      : outputToken;

    const options: SwapOptions = {
      slippageTolerance: this.createPercentFromString(
        input.slippage?.toString(),
      ),
      deadlineOrPreviousBlockhash: this.toDeadline(input.dealineInSecond),
      recipient: wallet?.address,
      inputTokenPermit,
    };

    const [provider, , errProvider] = this.evmProvider.getNextProvider(
      this.listNodeEndpoint,
    );
    if (!provider || errProvider) {
      return [null, Error("can not get provider " + errProvider?.message)];
    }

    let tradeCommand: UniswapTrade | null = null;
    let isZeroToOne = true; // is swap from token0 to token1
    let priceBeforeSwap = 0;
    if (input.poolType === POOL_TYPE.UNISWAP_V3_POOL) {
      const [pool, v3PoolErr] = await this.poolProvider.getUniV3Pool(
        inputToken,
        outputToken,
        input.poolAddress,
        provider,
      );
      if (v3PoolErr || !pool) {
        return [null, v3PoolErr];
      }

      if (inputToken.address === pool.token1.address) {
        isZeroToOne = false; // swap from token1 to token0
      }

      tradeCommand = await this.getUniV3TradeCommand(
        tokenUsedAsInput,
        tokenUsedAsOutput,
        pool,
        amountIn,
        options,
      );
    } else if (input.poolType === POOL_TYPE.UNISWAP_V4_POOL) {
      const [pool, v4PoolErr] = await this.poolProvider.getUniV4Pool(
        inputToken.address === nullAddress ? nativeToken : inputToken,
        outputToken,
        input.poolAddress,
        provider,
      );
      if (v4PoolErr || !pool) {
        return [null, v4PoolErr];
      }

      const deltaDecimal = pool.token0.decimals - pool.token1.decimals;
      priceBeforeSwap = this.sqrtPriceX96ToPrice(
        Big(pool.sqrtRatioX96.toString()),
        deltaDecimal,
      );
      if (priceBeforeSwap === 0) {
        return [
          null,
          Error(
            `can not get price before swap, sqrtRatioX96: ${pool.sqrtRatioX96.toString()}, deltaDecimal: ${deltaDecimal}`,
          ),
        ];
      }

      if (pool.token1.isNative && outputToken.address === nullAddress) {
        isZeroToOne = false; // swap from token1 to token0
      } else if (inputToken.address === (pool.token1 as Token).address) {
        isZeroToOne = false; // swap from token1 to token0
      }

      tradeCommand = await this.getUniV4TradeCommand(
        tokenUsedAsInput,
        tokenUsedAsOutput,
        pool,
        amountIn,
        options,
      );
    } else if (input.poolType === POOL_TYPE.UNISWAP_V2_POOL) {
      const [pool, v2PoolErr] = await this.poolProvider.getUniV2Pool(
        inputToken,
        outputToken,
        input.poolAddress,
        provider,
      );
      if (v2PoolErr || !pool) {
        return [null, v2PoolErr];
      }

      if (inputToken.address === pool.token1.address) {
        isZeroToOne = false; // swap from token1 to token0
      }

      tradeCommand = this.getUniV2TradeCommand(
        tokenUsedAsInput,
        tokenUsedAsOutput,
        pool,
        amountIn,
        options,
      );
    }
    if (tradeCommand === null) {
      return [null, Error("can not build trade")];
    }

    let priceImpact = Math.abs(
      Number(tradeCommand.trade.priceImpact?.toSignificant(2)),
    );

    // Uniswap V4 may return weird price impact, so we calculate it manually
    if (input.poolType === POOL_TYPE.UNISWAP_V4_POOL) {
      let priceAfterSwap = Number(
        tradeCommand.trade
          .worstExecutionPrice(options.slippageTolerance)
          .toSignificant(2),
      );
      if (priceAfterSwap === 0) {
        return [
          null,
          Error(
            `can not get price after swap, poolAddress: ${input.poolAddress}`,
          ),
        ];
      }

      if (!isZeroToOne) {
        priceAfterSwap = 1 / priceAfterSwap;
      }

      const deltaPrice = priceAfterSwap - priceBeforeSwap;
      priceImpact = Math.abs((deltaPrice / priceBeforeSwap) * 100);
    }

    logEveryWhere({
      campaignId: logInfo.campaignId,
      workflowId: logInfo.workflowId,
      message: `Executing Uniswap trade with price impact: ${priceImpact}%, slippage: ${input.slippage}%`,
    });

    if (input.priceImpact && priceImpact > input.priceImpact) {
      return [
        null,
        Error(
          `Uniswap trade error, price impact is too high, max is ${input.priceImpact}%, current is ${priceImpact}%`,
        ),
      ];
    }

    const params = SwapRouter.swapCallParameters(tradeCommand.trade, {
      slippageTolerance: options.slippageTolerance,
      deadlineOrPreviousBlockhash: options?.deadlineOrPreviousBlockhash,
    });

    const toAddress = UNIVERSAL_ROUTER_ADDRESS(
      UniversalRouterVersion.V2_0,
      this.chainId,
    );
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
      value: input.isInputNativeToken ? amountIn : zero,
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
      message: `Executing Uniswap trade with wallet: ${
        wallet?.address
      }, nonce: ${nonce}, transaction hash: ${tx.hash} done, take: ${
        (endTime - startTime) / 1000
      } seconds`,
    });
    return [tx.hash, null];
  }

  private getUniV2TradeCommand(
    inputToken: Token | Ether,
    outputToken: Token | Ether,
    pair: Pair,
    amountIn: ethers.BigNumber,
    options: SwapOptions,
  ): UniswapTrade {
    const swapRoute = new V2Route([pair], inputToken, outputToken);
    const trade = new V2Trade(
      swapRoute,
      CurrencyAmount.fromRawAmount(inputToken, amountIn.toString()),
      TradeType.EXACT_INPUT,
    );

    const buildedTrade = this.buildTrade([trade]);
    const uniswapTrade = new UniswapTrade(buildedTrade, options);
    return uniswapTrade;
  }

  private async getUniV3TradeCommand(
    inputToken: Token | Ether,
    outputToken: Token | Ether,
    pool: Pool,
    amountIn: ethers.BigNumber,
    options: SwapOptions,
  ): Promise<UniswapTrade> {
    const swapRoute = new V3Route([pool], inputToken, outputToken);
    const trade = await V3Trade.fromRoute(
      swapRoute,
      CurrencyAmount.fromRawAmount(inputToken, amountIn.toString()),
      TradeType.EXACT_INPUT,
    );

    const buildedTrade = this.buildTrade([trade]);
    const uniswapTrade = new UniswapTrade(buildedTrade, options);
    return uniswapTrade;
  }

  private async getUniV4TradeCommand(
    inputToken: Token | Ether,
    outputToken: Token | Ether,
    pool: V4Pool,
    amountIn: ethers.BigNumber,
    options: SwapOptions,
  ): Promise<UniswapTrade> {
    const swapRoute = new V4Route([pool], inputToken, outputToken);
    const trade = await V4Trade.fromRoute(
      swapRoute,
      CurrencyAmount.fromRawAmount(inputToken, amountIn.toString()),
      TradeType.EXACT_INPUT,
    );

    const buildedTrade = this.buildTrade([trade]);
    const uniswapTrade = new UniswapTrade(buildedTrade, options);
    return uniswapTrade;
  }

  private buildTrade(
    trades: (
      | V2Trade<Currency, Currency, TradeType>
      | V3Trade<Currency, Currency, TradeType>
      | V4Trade<Currency, Currency, TradeType>
    )[],
  ): RouterTrade<Currency, Currency, TradeType> {
    const routerTrade = new RouterTrade({
      v2Routes: trades
        .filter((trade) => trade instanceof V2Trade)
        .map((trade) => ({
          routev2: trade.route as V2Route<Currency, Currency>,
          inputAmount: trade.inputAmount,
          outputAmount: trade.outputAmount,
        })),
      v3Routes: trades
        .filter((trade) => trade instanceof V3Trade)
        .map((trade) => ({
          routev3: trade.route as V3Route<Currency, Currency>,
          inputAmount: trade.inputAmount,
          outputAmount: trade.outputAmount,
        })),
      v4Routes: trades
        .filter((trade) => trade instanceof V4Trade)
        .map((trade) => ({
          routev4: trade.route as V4Route<Currency, Currency>,
          inputAmount: trade.inputAmount,
          outputAmount: trade.outputAmount,
        })),
      tradeType: trades[0].tradeType,
      mixedRoutes: [],
    });

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
    } catch (err: any) {
      return [null, err];
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
    const [, decimalPart] = percentString.split(".");
    const decimalPlaces = decimalPart ? decimalPart.length : 0;
    const numerator = BigNumber.from(percentString.replace(".", ""));
    const denominator = BigNumber.from(10).pow(decimalPlaces + 2); // +2 to account for percentage

    return new Percent(numerator.toString(), denominator.toString());
  }

  private sqrtPriceX96ToPrice = (
    sqrtPriceX96: Big,
    deltaDecimal: number,
  ): number => {
    const Q96 = Big(2).pow(96);
    const price = Big(sqrtPriceX96).div(Q96);
    const squared = price.times(price);
    const result = squared.times(Big(10).pow(deltaDecimal));
    return Number(result.toString());
  };
}
