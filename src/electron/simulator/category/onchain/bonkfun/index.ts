import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { AxiosProxyConfig } from "axios";
import { SolanaProvider } from "@/electron/simulator/category/onchain/solana";
import {
  BONKFUN_LAUNCH_CURRENCY,
  ILaunchTokenBonkfunNodeConfig,
} from "@/electron/type";
import { getKeypairFromPrivateKey } from "@/electron/simulator/category/onchain/util";
import { logEveryWhere } from "@/electron/service/util";
import { getImageBlob } from "@/electron/simulator/category/onchain/pumpfun/util";
import { BonkFunClient, CreateTokenMetadata } from "./client";

export class Bonkfun {
  private provider: SolanaProvider;

  constructor() {
    this.provider = new SolanaProvider();
  }

  // return [signature, token address, error]
  createToken = async (
    privateKey: string,
    listNodeEndpoint: string[],
    config: ILaunchTokenBonkfunNodeConfig,
    proxy?: AxiosProxyConfig,
  ): Promise<[string | null, string | null, Error | null]> => {
    if (!config?.tokenName) {
      return [null, null, new Error("Token name is required")];
    }
    if (!config?.symbol) {
      return [null, null, new Error("Symbol is required")];
    }
    if (!config?.imageUrl) {
      return [null, null, new Error("Image URL is required")];
    }

    const [connection, , err] = this.provider.getNextProvider(listNodeEndpoint);
    if (!connection || err) {
      return [null, null, Error("cannot get connection " + err?.message)];
    }

    const [sender, errSender] = getKeypairFromPrivateKey(privateKey);
    if (!sender || errSender) {
      return [null, null, errSender];
    }

    const isPairWithUsd1 = Boolean(
      config?.launchCurrency === BONKFUN_LAUNCH_CURRENCY.USD1,
    );

    const [fileBlob, errFileBlob] = await getImageBlob(config?.imageUrl);
    if (errFileBlob) {
      return [null, null, errFileBlob];
    }

    const client = new BonkFunClient();
    const tokenMetadata: CreateTokenMetadata = {
      name: config?.tokenName,
      symbol: config?.symbol,
      description: config?.description || "",
      twitter: config?.twitter || "",
      telegram: config?.telegram || "",
      website: config?.website || "",
      file: fileBlob,
    };

    let buyAmount = 0n;
    if (config?.buyAmountSol) {
      buyAmount = BigInt(
        Number(config?.buyAmountSol) *
          (isPairWithUsd1 ? Math.pow(10, 6) : LAMPORTS_PER_SOL),
      );
    }
    const [txHash, tokenAddress, error] = await client.createToken(
      connection,
      sender,
      Boolean(config?.launchCurrency === BONKFUN_LAUNCH_CURRENCY.USD1),
      tokenMetadata,
      buyAmount,
      config?.slippagePercentage ? Number(config?.slippagePercentage) : 0,
      {
        unitLimit: config?.unitLimit ? Number(config?.unitLimit) : 0,
        unitPrice: config?.unitPrice ? Number(config?.unitPrice) : 0,
      },
      proxy,
    );

    logEveryWhere({
      message: `Bonk.fun token created, token address: ${tokenAddress}, transaction hash: ${txHash}`,
    });
    return [txHash, tokenAddress, error];
  };
}
