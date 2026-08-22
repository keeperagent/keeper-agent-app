import {
  Keypair,
  PublicKey,
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import BN from "bn.js";
import {
  PUMP_SDK,
  OnlinePumpSdk,
  getBuyTokenAmountFromSolAmount,
} from "@pump-fun/pump-sdk";
import { SolanaProvider } from "@/electron/simulator/category/onchain/solana";
import { ILaunchTokenPumpfunNodeConfig } from "@/electron/type";
import { CreateTokenMetadata } from "./types";
import { getKeypairFromPrivateKey } from "@/electron/simulator/category/onchain/util";
import { logEveryWhere } from "@/electron/service/util";
import { getImageBlob, sendTx } from "./util";
import { uploadTokenMetadata } from "./metadata";

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
    const [uploadedMetadata, errUpload] =
      await uploadTokenMetadata(tokenMetadata);
    if (errUpload || !uploadedMetadata) {
      return [null, null, errUpload || new Error("Failed to upload metadata")];
    }

    const buyAmountLamports = config?.buyAmountSol
      ? BigInt(Number(config?.buyAmountSol) * LAMPORTS_PER_SOL)
      : 0n;

    try {
      const tx = new Transaction();

      if (buyAmountLamports > 0n) {
        const onlineSdk = new OnlinePumpSdk(connection);
        const [global, feeConfig] = await Promise.all([
          onlineSdk.fetchGlobal(),
          onlineSdk.fetchFeeConfig(),
        ]);

        const solAmount = new BN(buyAmountLamports.toString());
        const amount = getBuyTokenAmountFromSolAmount({
          global,
          feeConfig,
          mintSupply: null,
          bondingCurve: null,
          amount: solAmount,
          quoteMint: PublicKey.default,
        });

        const instructions = await PUMP_SDK.createV2AndBuyInstructions({
          global,
          mint: tokenMint.publicKey,
          name: config.tokenName,
          symbol: config.symbol,
          uri: uploadedMetadata.metadataUri,
          creator: sender.publicKey,
          user: sender.publicKey,
          amount,
          solAmount,
          mayhemMode: false,
          cashback: Boolean(config?.enableCashback),
        });
        instructions.forEach((instruction) => tx.add(instruction));
      } else {
        const instruction = await PUMP_SDK.createV2Instruction({
          mint: tokenMint.publicKey,
          name: config.tokenName,
          symbol: config.symbol,
          uri: uploadedMetadata.metadataUri,
          creator: sender.publicKey,
          user: sender.publicKey,
          mayhemMode: false,
          cashback: Boolean(config?.enableCashback),
        });
        tx.add(instruction);
      }

      const result = await sendTx(
        connection,
        tx,
        sender.publicKey,
        [sender, tokenMint],
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
      return [
        result?.signature || null,
        tokenMint?.publicKey?.toBase58(),
        null,
      ];
    } catch (error: any) {
      return [null, null, new Error(error?.message || "Transaction failed")];
    }
  };
}
