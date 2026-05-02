import { Connection, Transaction, VersionedTransaction } from "@solana/web3.js";
import { IExecuteTransactionNodeConfig } from "@/electron/type";
import { IStructuredLogPayload } from "@/electron/type";
import { logEveryWhere } from "@/electron/service/util";
import {
  getKeypairFromPrivateKey,
  sendSolanaTransactionWithRetry,
} from "@/electron/simulator/category/onchain/util";
import { SolanaProvider } from "@/electron/simulator/category/onchain/solana";

export class SolanaTransactionExecutor {
  private solanaProvider: SolanaProvider;

  constructor(solanaProvider: SolanaProvider) {
    this.solanaProvider = solanaProvider;
  }

  async executeTransaction(
    config: IExecuteTransactionNodeConfig,
    privateKey: string,
    listNodeEndpoint: string[],
    timeout: number,
    logInfo: IStructuredLogPayload,
  ): Promise<[string | null, Error | null]> {
    const [connection, , errConnection] =
      this.solanaProvider.getNextProvider(listNodeEndpoint);
    if (!connection) {
      return [null, Error("Cannot get provider: " + errConnection?.message)];
    }

    const [keypair, errKeypair] = getKeypairFromPrivateKey(privateKey);
    if (!keypair) {
      return [null, Error("Invalid private key: " + errKeypair?.message)];
    }

    const txBuffer = Buffer.from(config.transactionData, "base64");

    return this.executeSingleTransaction(
      connection,
      txBuffer,
      keypair,
      config.shouldWaitTransactionComfirmed || false,
      timeout,
      logInfo,
    );
  }

  private async executeSingleTransaction(
    connection: Connection,
    txBuffer: Buffer,
    keypair: ReturnType<typeof getKeypairFromPrivateKey>[0] & {},
    shouldWaitConfirmed: boolean,
    timeout: number,
    logInfo: IStructuredLogPayload,
  ): Promise<[string | null, Error | null]> {
    try {
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();

      let signature: string;

      let transactionBinary: Uint8Array;
      try {
        const versionedTx = VersionedTransaction.deserialize(txBuffer as any);
        versionedTx.message.recentBlockhash = blockhash;
        versionedTx.sign([keypair]);
        transactionBinary = versionedTx.serialize();
      } catch {
        // Fall back to legacy Transaction
        const legacyTx = Transaction.from(txBuffer);
        legacyTx.recentBlockhash = blockhash;
        legacyTx.partialSign(keypair);
        transactionBinary = legacyTx.serialize();
      }

      signature = await connection.sendRawTransaction(transactionBinary, {
        maxRetries: 0,
        skipPreflight: true,
      });

      if (!shouldWaitConfirmed) {
        return [signature, null];
      }

      const startTime = new Date().getTime();
      const confirmErr = await sendSolanaTransactionWithRetry(
        connection,
        transactionBinary,
        signature,
        blockhash,
        lastValidBlockHeight,
      );
      if (confirmErr) {
        return [signature, confirmErr];
      }

      const endTime = new Date().getTime();
      logEveryWhere({
        campaignId: logInfo.campaignId,
        workflowId: logInfo.workflowId,
        message: `Solana execute transaction: ${signature}, take: ${(endTime - startTime) / 1000} seconds`,
      });

      return [signature, null];
    } catch (err: any) {
      return [null, err];
    }
  }
}
