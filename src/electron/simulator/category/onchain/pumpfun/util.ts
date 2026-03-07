import {
  Commitment,
  ComputeBudgetProgram,
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionMessage,
  VersionedTransaction,
  VersionedTransactionResponse,
} from "@solana/web3.js";
import fs from "fs-extra";
import { PriorityFee, TransactionResult } from "./types";
import { logEveryWhere } from "@/electron/service/util";

export const DEFAULT_COMMITMENT: Commitment = "finalized";

export const calculateWithSlippageBuy = (
  amount: bigint,
  basisPoints: bigint,
) => {
  return amount + (amount * basisPoints) / 10000n;
};

export const sendTx = async (
  connection: Connection,
  tx: Transaction,
  payer: PublicKey,
  signers: Keypair[],
  priorityFees?: PriorityFee,
): Promise<TransactionResult> => {
  try {
    const newTx = new Transaction();

    if (priorityFees) {
      const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
        units: priorityFees.unitLimit,
      });

      const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: priorityFees.unitPrice,
      });
      newTx.add(modifyComputeUnits);
      newTx.add(addPriorityFee);
    }

    newTx.add(tx);

    const versionedTx = await buildVersionedTx(connection, payer, newTx);
    versionedTx.sign(signers);

    const sig = await connection.sendTransaction(versionedTx, {
      skipPreflight: false,
    });
    logEveryWhere({
      message: `Broadcasting pump.fun transaction: https://solscan.io/tx/${sig}`,
    });

    const txResult = await getTxDetails(connection, sig);
    if (!txResult) {
      return {
        success: false,
        error: "Transaction failed",
      };
    }
    return {
      success: true,
      signature: sig,
      results: txResult,
    };
  } catch (err: any) {
    logEveryWhere({ message: `sendTx() pump.fun error: ${err?.message}` });

    return {
      error: err,
      success: false,
    };
  }
};

export const buildVersionedTx = async (
  connection: Connection,
  payer: PublicKey,
  tx: Transaction,
): Promise<VersionedTransaction> => {
  const latestBlockHash =
    await connection?.getLatestBlockhash(DEFAULT_COMMITMENT);

  const messageV0 = new TransactionMessage({
    payerKey: payer,
    recentBlockhash: latestBlockHash.blockhash,
    instructions: tx.instructions,
  }).compileToV0Message();

  return new VersionedTransaction(messageV0);
};

export const getTxDetails = async (
  connection: Connection,
  sig: string,
): Promise<VersionedTransactionResponse | null> => {
  const latestBlockHash = await connection.getLatestBlockhash();
  await connection.confirmTransaction(
    {
      blockhash: latestBlockHash.blockhash,
      lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      signature: sig,
    },
    "confirmed",
  );

  return connection.getTransaction(sig, {
    maxSupportedTransactionVersion: 0,
    commitment: "confirmed",
  });
};

export const getImageBlob = async (
  imageUrl: string,
): Promise<[Blob | undefined, Error | null]> => {
  try {
    const isHttp = /^https?:\/\//i.test(imageUrl);

    if (isHttp) {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        return [
          undefined,
          new Error(`Failed to fetch image: ${response.status}`),
        ];
      }
      const contentType = response.headers.get("content-type") || "image/png";
      const buffer = Buffer.from(await response.arrayBuffer());
      const fileBlob = new Blob([buffer], { type: contentType });
      return [fileBlob, null];
    }

    // Local file path
    const imageData = fs.readFileSync(imageUrl);
    const fileBlob = new Blob([imageData], { type: "image/png" });
    return [fileBlob, null];
  } catch (err: any) {
    return [undefined, new Error(err?.message)];
  }
};
