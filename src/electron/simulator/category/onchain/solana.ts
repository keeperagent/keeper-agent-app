import _ from "lodash";
import {
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  Transaction,
  SystemProgram,
  ComputeBudgetProgram,
  ParsedAccountData,
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
import {
  getKeypairFromPrivateKey,
  sendSolanaTransactionWithRetry,
} from "./util";

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
    listNodeEndpoint: string[],
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
    rawAmount: string,
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
    timeout: number,
  ): Promise<[string | null, Error | null | undefined]> {
    let balance = null,
      error = null;
    if (tokenType === TOKEN_TYPE.NATIVE_TOKEN) {
      [balance, error] = await this.getNativeBalance(
        walletAddress,
        listNodeProvider,
        timeout,
      );
      return [balance, error];
    } else if (tokenType === TOKEN_TYPE.SOLANA_TOKEN) {
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
        new Big(LAMPORTS_PER_SOL.toString()),
      );
      return [balanceFloat.toString(), null];
    } catch (error: any) {
      logEveryWhere({
        message: `Solana getNativeBalance() error: ${error?.message}`,
      });
      return [null, error];
    }
  }

  async getTokenDecimal(
    tokenAddress: string,
    provider: Connection,
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
        TOKEN_PROGRAM_ID,
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
          TOKEN_2022_PROGRAM_ID,
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
    timeout: number,
  ): Promise<[string | null, Error | null]> => {
    try {
      if (!this.isValidAddress(walletAddress)) {
        return [null, Error("@walletAddress is not Solana address")];
      }
      if (!this.isValidAddress(tokenAddress)) {
        return [null, Error("@tokenAddress is not Solana address")];
      }

      const [balances, err] = await this.getTokenBalancesByOwner(
        walletAddress,
        listNodeProvider,
        [tokenAddress],
        timeout,
      );
      if (err) {
        return [null, err];
      }

      return [balances?.[tokenAddress] || "0", null];
    } catch (error: any) {
      logEveryWhere({
        message: `Solana getTokenBalance() error: ${error?.message}`,
      });
      return [null, error];
    }
  };

  async getTokenBalancesByOwner(
    walletAddress: string,
    listNodeProvider: string[],
    tokenAddresses: string[],
    timeout: number,
  ): Promise<[Record<string, string> | null, Error | null]> {
    try {
      if (!this.isValidAddress(walletAddress)) {
        return [null, Error("@walletAddress is not Solana address")];
      }

      const uniqueTokenAddresses = [...new Set(tokenAddresses)].filter((addr) =>
        this.isValidAddress(addr),
      );
      const balancesByMint = Object.fromEntries(
        uniqueTokenAddresses.map((addr) => [addr, "0"]),
      );
      if (!uniqueTokenAddresses.length) {
        return [balancesByMint, null];
      }

      const [provider, , err] = this.getNextProvider(listNodeProvider);
      if (err || !provider) {
        return [null, err];
      }

      const walletPublicKey = new PublicKey(walletAddress);
      const [tokenProgramAccounts, token2022Accounts] = await Promise.all([
        sendWithTimeout(
          provider.getParsedTokenAccountsByOwner(walletPublicKey, {
            programId: TOKEN_PROGRAM_ID,
          }),
          timeout,
        ),
        sendWithTimeout(
          provider.getParsedTokenAccountsByOwner(walletPublicKey, {
            programId: TOKEN_2022_PROGRAM_ID,
          }),
          timeout,
        ),
      ]);

      const parsedAccounts = [
        ...tokenProgramAccounts.value,
        ...token2022Accounts.value,
      ];

      const mintRawTotals = new Map<
        string,
        { amount: Big; decimals: number }
      >();

      parsedAccounts.forEach((accountInfo) => {
        const parsedData = accountInfo.account.data as ParsedAccountData;
        const parsedInfo = parsedData?.parsed?.info;
        const mint = parsedInfo?.mint;
        if (!mint || !this.isValidAddress(mint)) {
          return;
        }
        if (!uniqueTokenAddresses.includes(mint)) {
          return;
        }

        const tokenAmount = parsedInfo?.tokenAmount;
        const rawAmount: string = tokenAmount?.amount || "0";
        const decimals: number = Number(tokenAmount?.decimals || 0);

        const amountBig = new Big(rawAmount);
        const existing = mintRawTotals.get(mint);
        if (existing) {
          existing.amount = existing.amount.plus(amountBig);
        } else {
          mintRawTotals.set(mint, { amount: amountBig, decimals });
        }
      });

      mintRawTotals.forEach(({ amount, decimals }, mint) => {
        balancesByMint[mint] = amount.div(new Big(10).pow(decimals)).toString();
      });

      return [balancesByMint, null];
    } catch (error: any) {
      logEveryWhere({
        message: `Solana getTokenBalancesByOwner() error: ${error?.message}`,
      });
      return [null, error];
    }
  }

  transferToken = async (
    privateKey: string,
    recipientAddress: string,
    tokenType: string,
    tokenAddress: string,
    amount: string,
    listNodeEndpoint: string[],
    timeout: number,
    gasPrice: string,
    gasLimit: string,
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
          }),
        );
      } else {
        const tokenPublicKey = new PublicKey(tokenAddress);
        const sourceTokenAccount = await getOrCreateAssociatedTokenAccount(
          provider,
          sender,
          tokenPublicKey,
          sender.publicKey,
        );

        const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
          provider,
          sender,
          tokenPublicKey,
          recipient,
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
            tokenDecimal,
          ),
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

      const { blockhash, lastValidBlockHeight } =
        await provider.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.sign(sender);
      const transactionBinary = transaction.serialize();

      const signature = await provider.sendRawTransaction(transactionBinary, {
        maxRetries: 0,
        skipPreflight: true,
      });

      const confirmErr = await sendSolanaTransactionWithRetry(
        provider,
        transactionBinary,
        signature,
        blockhash,
        lastValidBlockHeight,
      );
      if (confirmErr) {
        return [signature, sender.publicKey.toBase58(), confirmErr];
      }

      return [signature, sender.publicKey.toBase58(), null];
    } catch (err: any) {
      logEveryWhere({
        message: `Solana transferToken() error: ${err?.message}`,
      });
      return [null, null, err];
    }
  };

  getPriorityFee = async (
    listNodeEndpoint: string[],
    accounts: string[],
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
