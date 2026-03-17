import { Connection, Transaction, VersionedTransaction } from "@solana/web3.js";
import { IExecuteTransactionNodeConfig } from "@/electron/type";
import { IStructuredLogPayload } from "@/electron/type";
import { logEveryWhere } from "@/electron/service/util";
import { sendWithTimeout } from "@/electron/simulator/util";
import { getKeypairFromPrivateKey } from "@/electron/simulator/category/onchain/util";
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
    numberOfTransaction: number,
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

    let txHash: string | null = null;
    let lastErr: Error | null = null;

    for (let i = 0; i < numberOfTransaction; i++) {
      const [signature, err] = await this.executeSingleTransaction(
        connection,
        txBuffer,
        keypair,
        config.shouldWaitTransactionComfirmed || false,
        timeout,
        logInfo,
      );
      if (err) {
        lastErr = err;
        continue;
      }
      txHash = signature;
    }

    if (txHash === null && lastErr) {
      return [null, lastErr];
    }

    return [txHash, null];
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

      try {
        const versionedTx = VersionedTransaction.deserialize(txBuffer as any);
        versionedTx.sign([keypair]);
        signature = await connection.sendRawTransaction(
          versionedTx.serialize(),
          { maxRetries: 5, skipPreflight: true },
        );
      } catch {
        // Fall back to legacy Transaction
        const legacyTx = Transaction.from(txBuffer);
        legacyTx.partialSign(keypair);
        signature = await connection.sendRawTransaction(legacyTx.serialize(), {
          maxRetries: 5,
          skipPreflight: true,
        });
      }

      if (!shouldWaitConfirmed) {
        return [signature, null];
      }

      const startTime = new Date().getTime();
      const confirmation = await sendWithTimeout(
        connection.confirmTransaction(
          { signature, blockhash, lastValidBlockHeight },
          "confirmed",
        ),
        timeout,
      );
      if (confirmation.value.err) {
        return [signature, Error(confirmation.value.err.toString())];
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
