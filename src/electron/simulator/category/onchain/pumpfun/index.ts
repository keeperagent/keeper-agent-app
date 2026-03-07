import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { SolanaProvider } from "@/electron/simulator/category/onchain/solana";
import { PumpFunClient } from "./client";
import { ILaunchTokenPumpfunNodeConfig } from "@/electron/type";
import { CreateTokenMetadata } from "./types";
import { getKeypairFromPrivateKey } from "@/electron/simulator/category/onchain/util";
import { logEveryWhere } from "@/electron/service/util";
import { getImageBlob } from "./util";

export class Pumpfun {
  private provider: SolanaProvider;

  constructor() {
    this.provider = new SolanaProvider();
  }

  // return [signature, token address, error]
  createToken = async (
    privateKey: string,
    listNodeEndpoint: string[],
    config: ILaunchTokenPumpfunNodeConfig,
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
      return [null, null, Error("can not get connection " + err?.message)];
    }

    const [sender, errSender] = getKeypairFromPrivateKey(privateKey);
    if (!sender || errSender) {
      return [null, null, errSender];
    }
    const client = new PumpFunClient();
    let tokenMint: Keypair | null = null;

    if (config?.vanityAddressPrivateKey) {
      let err = null;
      [tokenMint, err] = getKeypairFromPrivateKey(
        config?.vanityAddressPrivateKey,
      );
      if (err) {
        return [null, null, err];
      }
    } else {
      tokenMint = Keypair.generate(); // generate token address
    }
    if (tokenMint === null) {
      return [null, null, new Error("can not generate token address")];
    }

    const [fileBlob, errFileBlob] = await getImageBlob(config?.imageUrl);
    if (errFileBlob) {
      return [null, null, errFileBlob];
    }

    const tokenMetadata: CreateTokenMetadata = {
      name: config?.tokenName,
      symbol: config?.symbol,
      description: config?.description || "",
      twitter: config?.twitter || "",
      telegram: config?.telegram || "",
      website: config?.website || "",
      file: fileBlob,
    };
    const result = await client.createToken(
      connection,
      sender,
      tokenMint,
      tokenMetadata,
      config?.buyAmountSol
        ? BigInt(Number(config?.buyAmountSol) * LAMPORTS_PER_SOL)
        : 0n,
      config?.slippagePercentage
        ? BigInt(Math.round(config?.slippagePercentage * 100)) // convert % -> basis points
        : 0n,
      {
        unitLimit: config?.unitLimit ? Number(config?.unitLimit) : 0,
        unitPrice: config?.unitPrice ? Number(config?.unitPrice) : 0,
      },
    );
    if (!result?.success) {
      return [
        null,
        null,
        new Error(result?.error?.toString() || "Transaction failed"),
      ];
    }

    logEveryWhere({
      message: `Pump.fun token created, token address: ${tokenMint?.publicKey?.toBase58()}, transaction hash: ${result?.signature}`,
    });
    return [result?.signature || null, tokenMint?.publicKey?.toBase58(), null];
  };
}
