import _ from "lodash";
import { SuiClient } from "@mysten/sui/client";
import {
  isValidSuiAddress,
  SUI_DECIMALS,
  SUI_TYPE_ARG,
} from "@mysten/sui/utils";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction, coinWithBalance } from "@mysten/sui/transactions";
import { fromHEX } from "@mysten/sui/utils";
import Big from "big.js";
import { TOKEN_TYPE } from "@/electron/constant";
import { logEveryWhere } from "@/electron/service/util";
import { ListNodeEndpoint } from "./evm";
import { sendWithTimeout } from "@/electron/simulator/util";
import { TimeoutCache } from "@/electron/service/timeoutCache";

export class SuiProvider {
  private provider: { [key: string]: SuiClient };
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
  ): [SuiClient | null, string | null, Error | null] {
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

  getProvider(nodeEndpoint: string): SuiClient {
    let provider = this.provider[this.formatKey(nodeEndpoint)];
    if (provider) {
      return provider;
    }

    provider = new SuiClient({
      url: nodeEndpoint,
    });

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
    if (tokenType === TOKEN_TYPE.SUI_COIN) {
      const [provider, , err] = this.getNextProvider(listNodeProvider);
      if (err || !provider) {
        return [null, err];
      }

      decimal = await this.getTokenDecimal(coinType, provider);
    } else if (tokenType === TOKEN_TYPE.NATIVE_TOKEN) {
      decimal = SUI_DECIMALS;
    }

    const amountBigInt = new Big(rawAmount);
    const tokenAmount = amountBigInt.div(new Big(10).pow(decimal));
    return [tokenAmount.toNumber(), null];
  }

  async getWalletBalance(
    listNodeProvider: string[],
    tokenType: string,
    walletAddress: string,
    contractAddress: string,
    timeout: number,
  ): Promise<[string | null, Error | null | undefined]> {
    let balance: string | null = "0";
    let error;
    if (tokenType === TOKEN_TYPE.NATIVE_TOKEN) {
      [balance, error] = await this.getNativeBalance(
        walletAddress,
        listNodeProvider,
        timeout,
      );
      return [balance, error];
    } else if (tokenType === TOKEN_TYPE.SUI_COIN) {
      [balance, error] = await this.getTokenBalance(
        walletAddress,
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

  async getNativeBalance(
    walletAddress: string,
    listNodeProvider: string[],
    timeout: number,
  ): Promise<[string | null, Error | null | undefined]> {
    try {
      if (!isValidSuiAddress(walletAddress)) {
        return [null, Error("@walletAddress is not Sui address")];
      }

      const [provider, , err] = this.getNextProvider(listNodeProvider);
      if (err || !provider) {
        return [null, err];
      }

      const balancePromise = provider?.getBalance({
        owner: walletAddress,
        coinType: SUI_TYPE_ARG,
      });
      const balance = await sendWithTimeout(balancePromise, timeout);
      const balanceBigInt = new Big(balance?.totalBalance || "0");
      const standardBalance = balanceBigInt.div(new Big(10).pow(SUI_DECIMALS));
      return [standardBalance.toString(), null];
    } catch (error: any) {
      logEveryWhere({ message: `Sui getNativeBalance() error: ${error?.message}` });
      return [null, error];
    }
  }

  async getTokenDecimal(
    coinType: string,
    provider: SuiClient,
  ): Promise<number> {
    if (this.mapTokenDecimal[this.formatKey(coinType)]) {
      return this.mapTokenDecimal[this.formatKey(coinType)];
    }

    const metadata = await provider.getCoinMetadata({
      coinType,
    });

    this.mapTokenDecimal[this.formatKey(coinType)] = metadata?.decimals || 0;
    return metadata?.decimals || 0;
  }

  async getTokenBalance(
    walletAddress: string,
    coinType: any,
    listNodeProvider: string[],
    timeout: number,
  ): Promise<[string | null, Error | null]> {
    try {
      if (!isValidSuiAddress(walletAddress)) {
        return [null, Error("@walletAddress is not Sui address")];
      }

      const [provider, , err] = this.getNextProvider(listNodeProvider);
      if (err || !provider) {
        return [null, err];
      }

      const accountBalancePromise = provider?.getBalance({
        owner: walletAddress,
        coinType,
      });
      const accountBalance = await sendWithTimeout(
        accountBalancePromise,
        timeout,
      );
      const decimals = await this.getTokenDecimal(coinType, provider);
      const balanceBigInt = new Big(accountBalance?.totalBalance || "0");
      const standardBalance = balanceBigInt.div(new Big(10).pow(decimals));

      return [standardBalance.toString(), null];
    } catch (error: any) {
      logEveryWhere({ message: `Sui getTokenBalance() error: ${error?.message}` });
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
    gasPrice: string,
  ): Promise<[string | null, string | null, Error | null]> {
    try {
      if (!isValidSuiAddress(recipientAddress)) {
        return [null, null, Error("@recipientAddress is not Sui address")];
      }

      const [provider, , err] = this.getNextProvider(listNodeEndpoint);
      if (err || !provider) {
        return [null, null, err];
      }

      if (tokenType === TOKEN_TYPE.NATIVE_TOKEN) {
        coinType = SUI_TYPE_ARG;
      }
      const decimals = await this.getTokenDecimal(coinType, provider);
      const amountTransfer = new Big(amount).mul(Math.pow(10, decimals));

      const keypair = Ed25519Keypair.fromSecretKey(fromHEX(privateKey));
      const tx = new Transaction();
      const senderAddress = keypair.toSuiAddress();
      tx.setSender(senderAddress);
      tx.transferObjects(
        [
          coinWithBalance({
            balance: BigInt(amountTransfer.toString()),
            type: coinType,
          }),
        ],
        recipientAddress,
      );

      const gasPriceNumber = gasPrice ? Number(gasPrice) : 0;
      if (gasPriceNumber) {
        tx.setGasPrice(gasPriceNumber);
      }
      const result = await provider.signAndExecuteTransaction({
        signer: keypair,
        transaction: tx,
      });
      await sendWithTimeout(
        provider.waitForTransaction({ digest: result.digest }),
        timeout,
      );

      return [result.digest, senderAddress, null];
    } catch (err: any) {
      logEveryWhere({ message: `Sui transferToken() error: ${err?.message}` });
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

      const gasPricePromise = provider.getReferenceGasPrice();
      const gasPrice = await sendWithTimeout(gasPricePromise, timeout);

      this.gasPriceCache.set(cachKey, gasPrice?.toString());
      return [gasPrice?.toString(), null];
    } catch (err: any) {
      logEveryWhere({ message: `getGasPrice() error: ${err?.message}` });
      return [null, err];
    }
  };
}
