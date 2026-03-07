import _ from "lodash";
import {
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
  ComputeBudgetProgram,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getMint,
  createTransferCheckedInstruction,
  getOrCreateAssociatedTokenAccount,
  TOKEN_2022_PROGRAM_ID,
  Mint,
} from "@solana/spl-token";
import Big from "big.js";
import { TOKEN_TYPE } from "@/electron/constant";
import { logEveryWhere } from "@/electron/service/util";
import { ListNodeEndpoint } from "./evm";
import { sendWithTimeout } from "@/electron/simulator/util";
import { getKeypairFromPrivateKey } from "./util";

export class SolanaProvider {
  private provider: { [key: string]: Connection };
  private mapListNodeEndpoint: { [key: string]: ListNodeEndpoint };
  private mapTokenDecimal: { [key: string]: number };

  constructor() {
    this.provider = {};
    this.mapListNodeEndpoint = {};
    this.mapTokenDecimal = {};
  }

  // generate uniq key from @listNodeEndpoint
  getListProviderKey(listNodeEndpoint: string[]): string {
    return _.sortBy(listNodeEndpoint).join("-");
  }

  getNextProvider(
    listNodeEndpoint: string[]
  ): [Connection | null, string | null, Error | null] {
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
    const nextKeyIndex = (currentIndex + 1) % listEndpoint?.length;
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

  isValidAddress(walletAddress: string): boolean {
    try {
      new PublicKey(walletAddress);
      return true;
    } catch {
      return false;
    }
  }

  getProvider(nodeEndpoint: string): Connection {
    let provider = this.provider[this.formatKey(nodeEndpoint)];
    if (provider) {
      return provider;
    }

    provider = new Connection(nodeEndpoint);
    this.provider[this.formatKey(nodeEndpoint)] = provider;
    return provider;
  }

  async convertTokenAmount(
    listNodeProvider: string[],
    tokenType: string,
    tokenAddress: string,
    rawAmount: string
  ): Promise<[number | null, Error | null]> {
    let tokenAmount = 0;
    if (tokenType === TOKEN_TYPE.SOLANA_TOKEN) {
      const [provider, , err] = this.getNextProvider(listNodeProvider);
      if (err || !provider) {
        return [null, err];
      }
      const tokenDecimal = await this.getTokenDecimal(tokenAddress, provider);
      const balanceBigInt = new Big(rawAmount);
      tokenAmount = balanceBigInt.div(new Big(10).pow(tokenDecimal)).toNumber();
    } else if (tokenType === TOKEN_TYPE.NATIVE_TOKEN) {
      const balanceBigInt = new Big(rawAmount);
      tokenAmount = balanceBigInt
        .div(new Big(LAMPORTS_PER_SOL.toString()))
        .toNumber();
    }

    return [tokenAmount, null];
  }

  async getWalletBalance(
    listNodeProvider: string[],
    tokenType: string,
    walletAddress: string,
    contractAddress: string,
    timeout: number
  ): Promise<[string | null, Error | null | undefined]> {
    let balance = null,
      error = null;
    if (tokenType === TOKEN_TYPE.NATIVE_TOKEN) {
      [balance, error] = await this.getNativeBalance(
        walletAddress,
        listNodeProvider,
        timeout
      );
      return [balance, error];
    } else if (tokenType === TOKEN_TYPE.SOLANA_TOKEN) {
      [balance, error] = await this.getTokenBalance(
        walletAddress,
        contractAddress,
        listNodeProvider,
        timeout
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
    timeout: number
  ): Promise<[string | null, Error | null | undefined]> {
    try {
      if (!this.isValidAddress(walletAddress)) {
        return [null, Error("@walletAddress is not Solana address")];
      }

      const [provider, , err] = this.getNextProvider(listNodeProvider);
      if (err || !provider) {
        return [null, err];
      }

      const publicKey = new PublicKey(walletAddress);
      const balancePromise = provider?.getBalance(publicKey);
      const balance = await sendWithTimeout(balancePromise, timeout);
      const balanceBigInt = new Big(balance.toString());
      const balanceFloat = balanceBigInt.div(
        new Big(LAMPORTS_PER_SOL.toString())
      );
      return [balanceFloat.toString(), null];
    } catch (error: any) {
      logEveryWhere({ message: `Solana getNativeBalance() error: ${error?.message}` });
      return [null, error];
    }
  }

  async getTokenDecimal(
    tokenAddress: string,
    provider: Connection
  ): Promise<number> {
    if (this.mapTokenDecimal[this.formatKey(tokenAddress)]) {
      return this.mapTokenDecimal[this.formatKey(tokenAddress)];
    }

    const tokenPublicKey = new PublicKey(tokenAddress);
    let metadata: Mint | null = null;
    try {
      metadata = await getMint(
        provider,
        tokenPublicKey,
        "finalized",
        TOKEN_PROGRAM_ID
      );
    } catch {
      metadata = null;
    }

    if (metadata === null) {
      try {
        metadata = await getMint(
          provider,
          tokenPublicKey,
          "finalized",
          TOKEN_2022_PROGRAM_ID
        );
      } catch {
        metadata = null;
      }
    }

    if (metadata === null) {
      return 0;
    }

    this.mapTokenDecimal[this.formatKey(tokenAddress)] = metadata?.decimals;
    return metadata?.decimals;
  }

  getTokenBalance = async (
    walletAddress: string,
    tokenAddress: string,
    listNodeProvider: string[],
    _timeout: number
  ): Promise<[string | null, Error | null]> => {
    try {
      if (!this.isValidAddress(walletAddress)) {
        return [null, Error("@walletAddress is not Solana address")];
      }
      if (!this.isValidAddress(tokenAddress)) {
        return [null, Error("@tokenAddress is not Solana address")];
      }

      const [provider, , err] = this.getNextProvider(listNodeProvider);
      if (err || !provider) {
        return [null, err];
      }

      const walletPublicKey = new PublicKey(walletAddress);
      const tokenPublicKey = new PublicKey(tokenAddress);

      const accounts = await provider.getTokenAccountsByOwner(walletPublicKey, {
        mint: tokenPublicKey,
      });
      if (accounts?.value?.length === 0) {
        return ["0", null];
      }
      const balance = await provider.getTokenAccountBalance(
        accounts.value[0].pubkey
      );
      const balanceAmount = balance?.value?.amount || "0";
      const balanceBigInt = new Big(balanceAmount);
      const tokenDecimal = await this.getTokenDecimal(tokenAddress, provider);
      const balanceFloat = balanceBigInt.div(new Big(10).pow(tokenDecimal));

      return [balanceFloat?.toString(), null];
    } catch (error: any) {
      logEveryWhere({ message: `Solana getTokenBalance() error: ${error?.message}` });
      return [null, error];
    }
  };

  transferToken = async (
    privateKey: string,
    recipientAddress: string,
    tokenType: string,
    tokenAddress: string,
    amount: string,
    listNodeEndpoint: string[],
    timeout: number,
    gasPrice: string,
    gasLimit: string
  ): Promise<[string | null, string | null, Error | null]> => {
    try {
      if (!this.isValidAddress(recipientAddress)) {
        return [null, null, Error("@recipientAddress is not Solana address")];
      }

      const [provider, , err] = this.getNextProvider(listNodeEndpoint);
      if (err || !provider) {
        return [null, null, err];
      }

      const [sender, errSender] = getKeypairFromPrivateKey(privateKey);
      if (!sender || errSender) {
        return [null, null, errSender];
      }
      const recipient = new PublicKey(recipientAddress);

      let transaction: Transaction | null = null;
      if (tokenType === TOKEN_TYPE.NATIVE_TOKEN) {
        const amountToTransfer = new Big(amount).mul(LAMPORTS_PER_SOL);
        transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: sender.publicKey,
            toPubkey: recipient,
            lamports: BigInt(amountToTransfer?.toString()),
          })
        );
      } else {
        const tokenPublicKey = new PublicKey(tokenAddress);
        const sourceTokenAccount = await getOrCreateAssociatedTokenAccount(
          provider,
          sender,
          tokenPublicKey,
          sender.publicKey
        );

        const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
          provider,
          sender,
          tokenPublicKey,
          recipient
        );

        const tokenDecimal = await this.getTokenDecimal(tokenAddress, provider);
        const amountTransfer = new Big(amount).mul(Math.pow(10, tokenDecimal));
        transaction = new Transaction().add(
          createTransferCheckedInstruction(
            sourceTokenAccount.address,
            tokenPublicKey,
            recipientTokenAccount.address,
            sender.publicKey,
            BigInt(amountTransfer.toString()),
            tokenDecimal
          )
        );
      }

      if (transaction === null) {
        return [null, null, Error("can not build transaction")];
      }

      let unitLimit = gasLimit ? Number(gasLimit) : 0;
      if (isNaN(unitLimit) || unitLimit < 0) {
        unitLimit = 0;
      }
      if (unitLimit) {
        const instruction = ComputeBudgetProgram.setComputeUnitLimit({
          units: unitLimit,
        });
        transaction.add(instruction);
      }

      let microLamports = gasPrice ? Number(gasPrice) : 0;
      if (isNaN(microLamports) || microLamports < 0) {
        microLamports = 0;
      }
      if (microLamports) {
        const instruction = ComputeBudgetProgram.setComputeUnitPrice({
          microLamports,
        });
        transaction.add(instruction);
      }

      const txHash = await sendWithTimeout(
        sendAndConfirmTransaction(provider, transaction, [sender]),
        timeout
      );
      return [txHash, sender.publicKey.toBase58(), null];
    } catch (err: any) {
      logEveryWhere({ message: `Solana transferToken() error: ${err?.message}` });
      return [null, null, err];
    }
  };

  getPriorityFee = async (
    listNodeEndpoint: string[],
    accounts: string[]
  ): Promise<[number | null, Error | null]> => {
    try {
      const [provider, , err] = this.getNextProvider(listNodeEndpoint);
      if (err || !provider) {
        return [null, err];
      }

      let listFee = await provider.getRecentPrioritizationFees({
        lockedWritableAccounts:
          accounts?.length > 0
            ? accounts?.map((account) => new PublicKey(account))
            : undefined,
      });
      listFee = _.orderBy(listFee, ["prioritizationFee"], ["desc"]);
      listFee = listFee?.filter((fee) => fee?.prioritizationFee > 0);
      const nonZeroFees = listFee?.map((fee) => fee?.prioritizationFee);

      let medianFee = 0;
      if (nonZeroFees.length > 0) {
        const midIndex = Math.floor(nonZeroFees.length / 2);
        if (listFee.length % 2 !== 0) {
          medianFee = nonZeroFees[midIndex];
        } else {
          medianFee = (nonZeroFees[midIndex - 1] + nonZeroFees[midIndex]) / 2;
        }
      }
      return [medianFee, null];
    } catch (err: any) {
      logEveryWhere({ message: `getPriorityFee() error: ${err?.message}` });
      return [null, err];
    }
  };
}
