import { Wallet, ethers } from "ethers";
import Big from "big.js";
import _ from "lodash";
import { ERC20_ABI, ERC721_ABI } from "./abi/erc20";
import { logEveryWhere } from "@/electron/service/util";
import { sendWithTimeout } from "@/electron/simulator/util";
import {
  ISelectChainOption,
  ISelectTokenOption,
  ITransactionConfigEVM,
} from "@/electron/type";
import { TimeoutCache } from "@/electron/service/timeoutCache";
import { EVM_TRANSACTION_TYPE, TOKEN_TYPE } from "@/electron/constant";
import { convertArgsToAbiTypesEVM } from "./util";

type ERC20Contract = {
  contract: ethers.Contract;
  decimal: number;
};

export type ListNodeEndpoint = {
  listEndpoint: string[];
  currentIndex: number;
};

const nativeTokenDecimal = 18;

export class EVMProvider {
  private provider: { [key: string]: ethers.providers.JsonRpcProvider };
  private mapERC20Token: { [key: string]: ERC20Contract };
  private mapERC721Token: { [key: string]: ethers.Contract };
  private mapListNodeEndpoint: { [key: string]: ListNodeEndpoint };
  private mapChainId: { [key: string]: number };
  private gasPriceCache: TimeoutCache<string>;

  constructor() {
    this.provider = {};
    this.mapERC20Token = {};
    this.mapERC721Token = {};
    this.mapListNodeEndpoint = {};
    this.mapChainId = {};
    this.gasPriceCache = new TimeoutCache(5000);
  }

  // generate uniq key from @listNodeEndpoint
  getListProviderKey = (listNodeEndpoint: string[]): string => {
    return _.sortBy(listNodeEndpoint).join("-");
  };

  getNextProvider = (
    listNodeEndpoint: string[],
  ): [ethers.providers.JsonRpcProvider | null, string | null, Error | null] => {
    if (listNodeEndpoint?.length === 0) {
      return [null, null, Error("node endpoint is empty")];
    }

    const key = this.getListProviderKey(listNodeEndpoint);
    if (!this.mapListNodeEndpoint[key]) {
      this.mapListNodeEndpoint[key] = {
        listEndpoint: listNodeEndpoint,
        currentIndex: 0,
      };
    }

    const { listEndpoint, currentIndex } = this.mapListNodeEndpoint[key];
    const nextKeyIndex = (currentIndex + 1) % listEndpoint.length;
    const endpoint = listEndpoint[nextKeyIndex];
    if (!endpoint) {
      return [null, endpoint, Error("missing Node endpoint")];
    }

    this.mapListNodeEndpoint[key].currentIndex = nextKeyIndex;
    return [this.getProvider(endpoint), endpoint, null];
  };

  private getProvider = (
    nodeEndpoint: string,
  ): ethers.providers.JsonRpcProvider => {
    let provider = this.provider[this.formatKey(nodeEndpoint)];
    if (provider) {
      return provider;
    }

    provider = new ethers.providers.JsonRpcProvider(nodeEndpoint);
    this.provider[this.formatKey(nodeEndpoint)] = provider;
    return provider;
  };

  convertTokenAmount = async (
    listNodeProvider: string[],
    tokenType: string,
    tokenAddress: string,
    rawAmount: string,
  ): Promise<[number | null, Error | null]> => {
    let decimal = 0;
    if (tokenType === TOKEN_TYPE.EVM_ERC20_TOKEN) {
      const [tokenContract, err] = await this.getTokenContract(
        listNodeProvider,
        tokenAddress,
      );
      if (err || !tokenContract) {
        return [null, err];
      }

      decimal = tokenContract?.decimal;
    } else if (tokenType === TOKEN_TYPE.NATIVE_TOKEN) {
      decimal = nativeTokenDecimal;
    }

    const amountBigInt = new Big(rawAmount);
    const tokenAmount = amountBigInt.div(new Big(10).pow(decimal));
    return [tokenAmount.toNumber(), null];
  };

  getWalletBalance = async (
    listNodeProvider: string[],
    tokenType: string,
    walletAddress: string,
    tokenAddress: string,
    timeout: number,
  ): Promise<[string | null, Error | null | undefined]> => {
    let balance: string | null = "0";
    let error;
    if (tokenType === TOKEN_TYPE.NATIVE_TOKEN) {
      [balance, error] = await this.getNativeBalance(
        walletAddress,
        listNodeProvider,
      );
      return [balance, error];
    } else if (tokenType === TOKEN_TYPE.EVM_ERC20_TOKEN) {
      [balance, error] = await this.getTokenBalance(
        walletAddress,
        tokenAddress,
        listNodeProvider,
        timeout,
      );
    }
    if (error) {
      return [null, error];
    }

    return [balance, null];
  };

  getNativeBalance = async (
    walletAddress: string,
    listNodeEndpoint: string[],
  ): Promise<[string | null, Error | null]> => {
    try {
      if (!ethers.utils.isAddress(walletAddress)) {
        return [null, Error("@walletAddress is not EVM address format")];
      }

      const [provider, , err] = this.getNextProvider(listNodeEndpoint);
      if (err || !provider) {
        return [null, err];
      }

      const balance = await provider.getBalance(walletAddress);
      const balanceBigInt = new Big(balance.toString());
      const balanceFloat = balanceBigInt.div(
        new Big(10).pow(nativeTokenDecimal),
      );
      return [balanceFloat.toString(), null];
    } catch (err: any) {
      logEveryWhere({ message: `EVM getNativeBalance() error: ${err?.message}` });
      return [null, err];
    }
  };

  getTokenBalance = async (
    walletAddress: string,
    contractAdrress: string,
    listNodeEndpoint: string[],
    timeout: number,
  ): Promise<[string | null, Error | null]> => {
    try {
      if (!ethers.utils.isAddress(walletAddress)) {
        return [
          null,
          Error(`walletAddress is not valid EVM address: ${walletAddress}`),
        ];
      }
      if (!ethers.utils.isAddress(contractAdrress)) {
        return [
          null,
          Error(`contractAdrress is not valid EVM address: ${contractAdrress}`),
        ];
      }

      const [tokenContract, err] = await this.getTokenContract(
        listNodeEndpoint,
        contractAdrress,
      );
      if (err || !tokenContract) {
        return [null, err];
      }

      const { contract, decimal } = tokenContract;
      const balancePromise = contract?.balanceOf(walletAddress);
      const balance = await sendWithTimeout(balancePromise, timeout);

      const balanceBigInt = new Big(balance.toString());
      const balanceFloat = balanceBigInt.div(new Big(10).pow(decimal));
      return [balanceFloat.toString(), null];
    } catch (err: any) {
      logEveryWhere({ message: `EVM getTokenBalance() error: ${err?.message}` });
      return [null, err];
    }
  };

  selectToken = async (
    walletAddress: string,
    listTokenOption: ISelectTokenOption[],
    listNodeEndpoint: string[],
    timeout: number,
  ): Promise<[ISelectTokenOption | null, Error | null]> => {
    try {
      listTokenOption = _.shuffle(listTokenOption); // shuffle to get output randomly
      for (let i = 0; i < listTokenOption?.length; i++) {
        const option = listTokenOption[i];
        if (!option.tokenAddress || !option?.tokenName) {
          continue;
        }
        const [balance, err] = await this.getTokenBalance(
          walletAddress,
          option?.tokenAddress,
          listNodeEndpoint,
          timeout,
        );
        if (err) {
          return [null, err];
        }
        if (!balance) {
          continue;
        }
        if (Number(balance) > Number(option.minimumAmount)) {
          return [option, null];
        }
      }

      return [null, null];
    } catch (err: any) {
      logEveryWhere({ message: `selectToken() error: ${err?.message}` });
      return [null, err];
    }
  };

  selectChain = async (
    walletAddress: string,
    listChainOption: ISelectChainOption[],
    mapListNodeEndpoint: Map<number, string[]>,
    timeout: number,
  ): Promise<[ISelectChainOption | null, Error | null]> => {
    try {
      listChainOption = _.shuffle(listChainOption); // shuffle to get output randomly
      for (let i = 0; i < listChainOption?.length; i++) {
        const option = listChainOption[i];
        if (
          !option.tokenAddress ||
          !option?.tokenName ||
          !option?.chainName ||
          !option?.nodeEndpointGroupId
        ) {
          continue;
        }

        const listNodeEndpoint = mapListNodeEndpoint.get(
          option?.nodeEndpointGroupId,
        );
        if (!listNodeEndpoint || listNodeEndpoint?.length === 0) {
          continue;
        }

        const [balance, err] = await this.getTokenBalance(
          walletAddress,
          option?.tokenAddress,
          listNodeEndpoint,
          timeout,
        );
        if (err) {
          return [null, err];
        }
        if (!balance) {
          continue;
        }
        if (Number(balance) > Number(option.minimumAmount)) {
          return [option, null];
        }
      }
      return [null, null];
    } catch (err: any) {
      logEveryWhere({ message: `selectChain() error: ${err?.message}` });
      return [null, err];
    }
  };

  getGasPrice = async (
    listNodeEndpoint: string[],
    timeout: number,
  ): Promise<[string | null, Error | null]> => {
    try {
      const cachKey = this.getListProviderKey(listNodeEndpoint);
      const cachedGasPrice = this.gasPriceCache.get(cachKey);
      if (cachedGasPrice !== null) {
        return [cachedGasPrice, null];
      }

      const [provider, nodeEndpoint, err] =
        this.getNextProvider(listNodeEndpoint);
      if (err || !provider || !nodeEndpoint) {
        return [null, err];
      }

      const feePromise = provider.getFeeData();
      const fee = await sendWithTimeout(feePromise, timeout);

      if (!fee?.gasPrice) {
        return [null, Error("can not get gas price")];
      }

      const gasPrice = ethers.utils.formatUnits(fee.gasPrice, "gwei");
      this.gasPriceCache.set(cachKey, gasPrice);
      return [gasPrice, null];
    } catch (err: any) {
      logEveryWhere({ message: `getGasPrice() error: ${err?.message}` });
      return [null, err];
    }
  };

  private formatKey = (str: string): string => {
    return str.toLowerCase();
  };

  getTokenContract = async (
    listNodeEndpoint: string[],
    contractAddress: string,
  ): Promise<[ERC20Contract | null, Error | null]> => {
    const [provider, nodeEndpoint, err] =
      this.getNextProvider(listNodeEndpoint);
    if (err || !provider) {
      return [null, err];
    }

    const tokenContract: ERC20Contract =
      this.mapERC20Token[this.formatKey(contractAddress + nodeEndpoint)];
    if (tokenContract) {
      return [tokenContract, null];
    }

    const contract = new ethers.Contract(contractAddress, ERC20_ABI, provider);
    const decimal = await contract?.decimals();
    return [
      {
        contract,
        decimal: Number(decimal),
      },
      null,
    ];
  };

  private getNFTContract = async (
    listNodeEndpoint: string[],
    contractAddress: string,
  ): Promise<[ethers.Contract | null, Error | null]> => {
    const [provider, nodeEndpoint, err] =
      this.getNextProvider(listNodeEndpoint);
    if (err || !provider) {
      return [null, err];
    }

    const tokenContract: ethers.Contract =
      this.mapERC721Token[this.formatKey(contractAddress + nodeEndpoint)];
    if (tokenContract) {
      return [tokenContract, null];
    }

    const contract = new ethers.Contract(contractAddress, ERC721_ABI, provider);
    return [contract, null];
  };

  transferToken = async (
    privateKey: string,
    toAddress: string,
    tokenType: string,
    tokenAdrress: string,
    amount: string,
    listNodeEndpoint: string[],
    timeout: number,
    gasPrice: string,
  ): Promise<[string | null, string | null, Error | null]> => {
    try {
      if (!ethers.utils.isAddress(toAddress)) {
        return [
          null,
          null,
          Error(`Receipient address is not valid EVM address: ${toAddress}`),
        ];
      }

      const isNativeToken = tokenType === TOKEN_TYPE.NATIVE_TOKEN;
      if (isNaN(Number(amount)) || Number(amount) < 0) {
        return [
          null,
          null,
          Error("@tokenAmount must be greater than or equal to 0"),
        ];
      }

      const [provider, , errProvider] = this.getNextProvider(listNodeEndpoint);
      if (errProvider || !provider) {
        return [null, null, errProvider];
      }

      const wallet = new Wallet(privateKey, provider);
      let balance: string | null = "0";
      let errBalance = null;
      if (isNativeToken) {
        [balance, errBalance] = await this.getNativeBalance(
          wallet?.address,
          listNodeEndpoint,
        );
      } else {
        [balance, errBalance] = await this.getTokenBalance(
          wallet?.address,
          tokenAdrress,
          listNodeEndpoint,
          timeout,
        );
      }
      if (errBalance || !balance) {
        return [null, null, errBalance];
      }
      if (Number(balance) < Number(amount)) {
        return [
          null,
          null,
          Error(`not enough balance, current balance: ${balance}`),
        ];
      }

      let txHash = null;
      let gasPriceValue = ethers.BigNumber.from(0);
      if (gasPrice !== "" && !isNaN(Number(gasPrice))) {
        gasPriceValue = ethers.utils.parseUnits(gasPrice, "gwei");
      }
      if (gasPriceValue.eq(ethers.BigNumber.from(0))) {
        const suggestedGasFee = await provider?.getFeeData();
        gasPriceValue = suggestedGasFee.gasPrice || ethers.BigNumber.from(0);
      }

      if (isNativeToken) {
        const tx = {
          to: toAddress,
          value: ethers.utils.parseEther(amount),
          gasPrice: gasPriceValue,
        };
        const txResponse = await wallet.sendTransaction(tx);
        await txResponse.wait();
        txHash = txResponse.hash;
      } else {
        const [tokenContract, errToken] = await this.getTokenContract(
          listNodeEndpoint,
          tokenAdrress,
        );
        if (errToken || !tokenContract) {
          return [null, null, errToken];
        }
        const rawAmount = ethers.utils.parseUnits(
          amount,
          tokenContract.decimal,
        );
        const tx = await tokenContract?.contract
          ?.connect(wallet)
          ?.transfer(toAddress, rawAmount, {
            gasPrice: gasPriceValue,
          });
        await sendWithTimeout(tx.wait(), timeout);
        txHash = tx.hash;
      }

      return [txHash, wallet?.address, null];
    } catch (err: any) {
      logEveryWhere({ message: `EVM transferToken() error: ${err?.message}` });
      return [null, null, err];
    }
  };

  approveToken = async (
    privateKey: string,
    spenderAddress: string,
    tokenAdrress: string,
    amount: string,
    isUnlimitedAmount: boolean,
    isRevoke: boolean,
    listNodeEndpoint: string[],
    timeout: number,
    gasPrice: string,
  ): Promise<[string | null, Error | null]> => {
    try {
      if (!ethers.utils.isAddress(spenderAddress)) {
        return [
          null,
          Error(`Spender address is not valid EVM address: ${spenderAddress}`),
        ];
      }
      if (!ethers.utils.isAddress(tokenAdrress)) {
        return [
          null,
          Error(`Token address is not valid EVM address: ${tokenAdrress}`),
        ];
      }

      const [provider, , errProvider] = this.getNextProvider(listNodeEndpoint);
      if (errProvider || !provider) {
        return [null, errProvider];
      }

      const wallet = new Wallet(privateKey, provider);
      const [tokenContract, errToken] = await this.getTokenContract(
        listNodeEndpoint,
        tokenAdrress,
      );
      if (errToken || !tokenContract) {
        return [null, errToken];
      }

      const { contract, decimal } = tokenContract;
      const approvalAmountPromise = contract?.allowance(
        wallet?.address,
        spenderAddress,
      );
      const approvalAmount = await sendWithTimeout(
        approvalAmountPromise,
        timeout,
      );
      const approvalAmountBigInt = new Big(approvalAmount.toString()); // amount already approve

      let amountToApprove = ethers.constants.MaxUint256;
      if (isRevoke) {
        amountToApprove = ethers.utils.parseUnits("0", decimal);
      } else if (!isUnlimitedAmount) {
        const approvalAmount = ethers.utils.parseUnits(amount, decimal);
        if (approvalAmount.lte(amountToApprove)) {
          amountToApprove = approvalAmount;
        }
      }
      if (approvalAmountBigInt.gte(new Big(amountToApprove.toString()))) {
        return [null, null];
      }

      let gasPriceValue = ethers.BigNumber.from(0);
      if (gasPrice !== "" && !isNaN(Number(gasPrice))) {
        gasPriceValue = ethers.utils.parseUnits(gasPrice, "gwei");
      }
      if (gasPriceValue.eq(ethers.BigNumber.from(0))) {
        const suggestedGasFee = await provider?.getFeeData();
        gasPriceValue = suggestedGasFee.gasPrice || ethers.BigNumber.from(0);
      }

      const tx = await contract
        ?.connect(wallet)
        ?.approve(spenderAddress, amountToApprove, {
          gasPrice: gasPriceValue,
        });
      await sendWithTimeout(tx.wait(), timeout);
      const txHash = tx.hash;

      return [txHash, null];
    } catch (err: any) {
      logEveryWhere({ message: `EVM approveToken() error: ${err?.message}` });
      return [null, err];
    }
  };

  readFromContract = async (
    contractAddress: string,
    contractABI: string[],
    method: string,
    listInput: string[],
    listNodeEndpoint: string[],
    timeout: number,
  ): Promise<[string | string[] | null, Error | null]> => {
    try {
      if (!ethers.utils.isAddress(contractAddress)) {
        return [
          null,
          Error(
            `Contract address is not valid EVM address: ${contractAddress}`,
          ),
        ];
      }
      if (!contractABI) {
        return [null, Error("ABI is empty")];
      }
      if (!method) {
        return [null, Error("@method is empty")];
      }

      const [provider, , errProvider] = this.getNextProvider(listNodeEndpoint);
      if (errProvider || !provider) {
        return [null, errProvider];
      }
      const contract = new ethers.Contract(
        contractAddress,
        contractABI,
        provider,
      );
      if (typeof contract[method] !== "function") {
        return [null, Error("@method does not exit")];
      }
      let [convertedArgs, err] = convertArgsToAbiTypesEVM(
        method,
        listInput,
        contractABI,
      );
      if (err) {
        return [null, err];
      }
      convertedArgs = convertedArgs || [];
      const resultPromise = contract?.[method](...convertedArgs);
      let result = await sendWithTimeout(resultPromise, timeout);
      if (_.isArray(result)) {
        result = result?.map((item) => item?.toString());
      } else {
        result = result?.toString();
      }
      return [result, null];
    } catch (err: any) {
      logEveryWhere({ message: `EVM readFromContract() error: ${err?.message}` });
      return [null, err];
    }
  };

  private getChainId = async (
    provider: ethers.providers.JsonRpcProvider,
    endpoint: string,
  ): Promise<number> => {
    if (this.mapChainId[endpoint] !== undefined) {
      return this.mapChainId[endpoint];
    }

    const network = await provider.getNetwork();
    this.mapChainId[endpoint] = network?.chainId;
    return this.mapChainId[endpoint];
  };

  writeToContract = async (
    privateKey: string,
    contractAddress: string,
    contractABI: string[],
    method: string,
    listInput: string[],
    listNodeEndpoint: string[],
    transactionConfig: ITransactionConfigEVM,
    timeout: number,
  ): Promise<[string | null, Error | null]> => {
    try {
      if (!privateKey) {
        return [null, Error("missing privateKey")];
      }
      if (!ethers.utils.isAddress(contractAddress)) {
        return [
          null,
          Error(
            `Contract address is not valid EVM address: ${contractAddress}`,
          ),
        ];
      }
      if (!contractABI) {
        return [null, Error("ABI is empty")];
      }
      if (!method) {
        return [null, Error("@method is empty")];
      }

      const [provider, nodeEndpoint, errProvider] =
        this.getNextProvider(listNodeEndpoint);
      if (errProvider || !provider || !nodeEndpoint) {
        return [null, errProvider];
      }

      const [convertedArgs, err] = convertArgsToAbiTypesEVM(
        method,
        listInput,
        contractABI,
      );
      if (err) {
        return [null, err];
      }
      const contractInterface = new ethers.utils.Interface(contractABI);
      const callData = contractInterface.encodeFunctionData(
        method,
        convertedArgs || [],
      );

      const isEip1559 =
        transactionConfig.transactionType === EVM_TRANSACTION_TYPE.EIP_1559;
      const wallet = new ethers.Wallet(privateKey, provider);
      const zero = ethers.BigNumber.from(0);
      let gasPrice = ethers.utils.parseUnits(
        transactionConfig.gasPrice?.toString() || "0",
        "gwei",
      );
      let maxFeePerGas = ethers.utils.parseUnits(
        transactionConfig.maxFeePerGas?.toString() || "0",
        "gwei",
      );
      let maxPriorityFeePerGas = ethers.utils.parseUnits(
        transactionConfig.maxPriorityFeePerGas?.toString() || "0",
        "gwei",
      );
      if (!transactionConfig.isUseCustomGasPrice) {
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
      let gasLimit = transactionConfig.gasLimit;
      const transactionValue = ethers.utils.parseEther(
        transactionConfig?.nativeTokenAmount || "0",
      );
      const [estimatedGasLimit, errorGasLimit] = await this.getGasLimit(
        callData,
        wallet?.address,
        contractAddress,
        transactionValue.toString(),
        provider,
      );
      if (errorGasLimit) {
        return [null, errorGasLimit];
      }
      if (
        !transactionConfig.isUseCustomGasLimit &&
        estimatedGasLimit !== null
      ) {
        gasLimit = estimatedGasLimit;
      }

      const currentNonce = await this.getNonce(wallet?.address, provider);
      const chainId = await this.getChainId(provider, nodeEndpoint);
      const txRequest: ethers.providers.TransactionRequest = {
        data: callData,
        from: wallet?.address,
        to: contractAddress,
        value: transactionValue,
        type: isEip1559 ? 2 : 1,
        gasPrice: isEip1559 ? 0 : gasPrice,
        maxFeePerGas: isEip1559 ? maxFeePerGas : undefined,
        maxPriorityFeePerGas: isEip1559 ? maxPriorityFeePerGas : undefined,
        nonce: currentNonce,
        gasLimit,
        chainId,
      };
      const signedTx = await wallet.signTransaction(txRequest);
      const tx = await provider.sendTransaction(signedTx);
      if (!transactionConfig.shouldWaitTransactionComfirmed) {
        return [tx.hash, null];
      }
      await sendWithTimeout(tx.wait(), timeout);
      return [tx.hash, null];
    } catch (err: any) {
      logEveryWhere({ message: `EVM writeToContract() error: ${err?.message}` });
      return [null, err];
    }
  };

  private getGasLimit = async (
    transactionData: any,
    from: string,
    to: string,
    value: string,
    provider: ethers.providers.JsonRpcProvider,
  ): Promise<[string | null, Error | null]> => {
    try {
      const gasEstimate = await provider?.estimateGas({
        to,
        data: transactionData,
        from,
        value,
      });

      return [gasEstimate?.toString(), null];
    } catch (err: any) {
      return [null, err];
    }
  };

  private getNonce = async (
    walletAddress: string,
    provider: ethers.providers.JsonRpcProvider,
  ): Promise<number> => {
    const currentNonce = await provider?.getTransactionCount(walletAddress);
    return currentNonce;
  };
}
