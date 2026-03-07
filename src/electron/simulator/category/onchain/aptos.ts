import _ from "lodash";
import {
  AccountAddressInput,
  Aptos,
  AptosConfig,
  Network,
  Account,
  Ed25519PrivateKey,
  AccountAddress,
  MoveStructId,
  APTOS_COIN,
} from "@aptos-labs/ts-sdk";
import Big from "big.js";
import { TOKEN_TYPE } from "@/electron/constant";
import { logEveryWhere } from "@/electron/service/util";
import { ListNodeEndpoint } from "./evm";
import { sendWithTimeout } from "@/electron/simulator/util";
import { TimeoutCache } from "@/electron/service/timeoutCache";

const APTOS_DECIMALS = 8;

export class AptosProvider {
  private provider: { [key: string]: Aptos };
  private mapListNodeEndpoint: { [key: string]: ListNodeEndpoint };
  private mapTokenDecimal: { [key: string]: number };
  private gasPriceCache: TimeoutCache<string>;

  constructor() {
    this.provider = {};
    this.mapListNodeEndpoint = {};
    this.mapTokenDecimal = {};
    this.gasPriceCache = new TimeoutCache(5000);
  }

  // generate uniq key from @listNodeEndpoint
  getListProviderKey(listNodeEndpoint: string[]): string {
    return _.sortBy(listNodeEndpoint).join("-");
  }

  getNextProvider(
    listNodeEndpoint: string[],
  ): [Aptos | null, string | null, Error | null] {
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
  }

  private formatKey(str: string): string {
    return str.toLowerCase();
  }

  getProvider(nodeEndpoint: string): Aptos {
    let provider = this.provider[this.formatKey(nodeEndpoint)];
    if (provider) {
      return provider;
    }

    const config = new AptosConfig({
      fullnode: nodeEndpoint,
      network: Network.MAINNET,
    });

    provider = new Aptos(config);
    this.provider[this.formatKey(nodeEndpoint)] = provider;
    return provider;
  }

  async convertTokenAmount(
    listNodeProvider: string[],
    tokenType: string,
    coinType: string,
    rawAmount: string,
  ): Promise<[number | null, Error | null]> {
    let decimal = 0;
    if (tokenType === TOKEN_TYPE.APTOS_COIN) {
      const [provider, , err] = this.getNextProvider(listNodeProvider);
      if (err || !provider) {
        return [null, err];
      }

      decimal = await this.getTokenDecimal(coinType, provider);
    } else if (tokenType === TOKEN_TYPE.NATIVE_TOKEN) {
      decimal = APTOS_DECIMALS;
    }

    const amountBigInt = new Big(rawAmount);
    const tokenAmount = amountBigInt.div(new Big(10).pow(decimal));
    return [tokenAmount.toNumber(), null];
  }

  async getWalletBalance(
    listNodeProvider: string[],
    tokenType: string,
    accountAddress: AccountAddressInput,
    contractAddress: string,
    timeout: number,
  ): Promise<[string | null, Error | null | undefined]> {
    let balance: string | null = "0";
    let error;
    if (tokenType === TOKEN_TYPE.NATIVE_TOKEN) {
      [balance, error] = await this.getNativeBalance(
        accountAddress,
        listNodeProvider,
        timeout,
      );
      return [balance, error];
    } else if (tokenType === TOKEN_TYPE.APTOS_COIN) {
      [balance, error] = await this.getTokenBalance(
        accountAddress,
        contractAddress,
        listNodeProvider,
        timeout,
      );
    }
    if (error) {
      return [null, error];
    }

    return [balance, null];
  }

  async getAptosAccount(
    listNodeProvider: string[],
    accountAddress: AccountAddressInput,
  ) {
    try {
      const [provider, err] = this.getNextProvider(listNodeProvider);
      if (err || !provider) {
        return [null, err];
      }
      const account = await provider?.getAccountInfo({ accountAddress });
      return account;
    } catch {
      return null;
    }
  }

  async getNativeBalance(
    accountAddress: AccountAddressInput,
    listNodeProvider: string[],
    timeout: number,
  ): Promise<[string | null, Error | null | undefined]> {
    try {
      if (!this.getAptosAccount(listNodeProvider, accountAddress)) {
        return [null, Error("@walletAddress is not Aptos address")];
      }

      const [provider, , err] = this.getNextProvider(listNodeProvider);
      if (err || !provider) {
        return [null, err];
      }
      const balancePromise = provider?.getAccountAPTAmount({ accountAddress });
      const balance = await sendWithTimeout(balancePromise, timeout);
      const balanceBigInt = new Big(balance?.toString() || "0");
      const standardBalance = balanceBigInt.div(
        new Big(10).pow(APTOS_DECIMALS),
      );
      return [standardBalance.toString(), null];
    } catch (error: any) {
      logEveryWhere({ message: `Aptos getNativeBalance() error: ${error?.message}` });
      return [null, error];
    }
  }

  async getTokenDecimal(coinType: string, provider: Aptos): Promise<number> {
    if (this.mapTokenDecimal[this.formatKey(coinType)]) {
      return this.mapTokenDecimal[this.formatKey(coinType)];
    }

    const metadata = await provider.getFungibleAssetMetadataByAssetType({
      assetType: coinType,
    });

    this.mapTokenDecimal[this.formatKey(coinType)] = metadata?.decimals;
    return metadata?.decimals;
  }

  async getTokenBalance(
    accountAddress: AccountAddressInput,
    coinType: any,
    listNodeProvider: string[],
    timeout: number,
  ): Promise<[string | null, Error | null]> {
    try {
      if (!this.getAptosAccount(listNodeProvider, accountAddress)) {
        return [null, Error("@walletAddress is not Aptos address")];
      }

      const [provider, , err] = this.getNextProvider(listNodeProvider);
      if (err || !provider) {
        return [null, err];
      }

      const accountBalancePromise = provider?.getAccountCoinAmount({
        accountAddress,
        coinType,
      });
      const accountBalance = await sendWithTimeout(
        accountBalancePromise,
        timeout,
      );
      const decimals = await this.getTokenDecimal(coinType, provider);
      const balanceBigInt = new Big(accountBalance?.toString() || "0");
      const standardBalance = balanceBigInt.div(new Big(10).pow(decimals));

      return [standardBalance.toString(), null];
    } catch (error: any) {
      logEveryWhere({ message: `Aptos getTokenBalance() error: ${error?.message}` });
      return [null, error];
    }
  }

  async transferToken(
    privateKey: string,
    recipientAddress: string,
    tokenType: string,
    coinType: string,
    amount: string,
    listNodeEndpoint: string[],
    timeout: number,
    _gasPrice: string,
  ): Promise<[string | null, string | null, Error | null]> {
    try {
      const [provider, , err] = this.getNextProvider(listNodeEndpoint);
      if (err || !provider) {
        return [null, null, err];
      }

      if (!this.getAptosAccount(listNodeEndpoint, recipientAddress)) {
        return [null, null, Error("@recipientAddress is not Aptos address")];
      }

      if (tokenType === TOKEN_TYPE.NATIVE_TOKEN) {
        coinType = APTOS_COIN;
      }
      const decimals = await this.getTokenDecimal(coinType, provider);
      const amountTransfer = new Big(amount).mul(Math.pow(10, decimals));

      const account = Account.fromPrivateKey({
        privateKey: new Ed25519PrivateKey(privateKey),
      });
      const transaction = await provider.transferCoinTransaction({
        sender: account.accountAddress,
        recipient: AccountAddress.from(recipientAddress),
        coinType: coinType as MoveStructId,
        amount: BigInt(amountTransfer.toString()),
      });
      const pendingTransaction = await provider.signAndSubmitTransaction({
        signer: account,
        transaction,
      });
      const res = await provider.waitForTransaction({
        transactionHash: pendingTransaction.hash,
        options: {
          timeoutSecs: timeout / 1000,
          checkSuccess: true,
          waitForIndexer: true,
        },
      });
      if (res?.success) {
        return [
          pendingTransaction.hash,
          account.accountAddress.toString(),
          null,
        ];
      }

      return [null, null, Error("transaction failed")];
    } catch (err: any) {
      logEveryWhere({ message: `Aptos transferToken() error: ${err?.message}` });
      return [null, null, err];
    }
  }

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

      const gasPricePromise = provider.getGasPriceEstimation();
      const gasPrice = await sendWithTimeout(gasPricePromise, timeout);

      this.gasPriceCache.set(cachKey, gasPrice?.gas_estimate?.toString());
      return [gasPrice?.gas_estimate?.toString(), null];
    } catch (err: any) {
      logEveryWhere({ message: `getGasPrice() error: ${err?.message}` });
      return [null, err];
    }
  };
}
