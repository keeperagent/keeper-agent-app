import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import { logEveryWhere } from "@/electron/service/util";

export class SolanaVanityAddressManager {
  private mapSolanaVanityAddress: Map<string, SolanaVanityAddress> = new Map();

  constructor() {
    this.mapSolanaVanityAddress = new Map();
  }

  private getKey = (campaignId: number, workflowId: number): string => {
    return `${campaignId}_${workflowId}`;
  };

  getSolanaVanityAddress = (
    campaignId: number = 0,
    workflowId: number = 0
  ): SolanaVanityAddress => {
    const key = this.getKey(campaignId, workflowId);
    if (this.mapSolanaVanityAddress.has(key)) {
      return this.mapSolanaVanityAddress.get(key)!;
    }

    const solanaVanityAddress = new SolanaVanityAddress();
    this.mapSolanaVanityAddress.set(key, solanaVanityAddress);
    return solanaVanityAddress;
  };
}

export class SolanaVanityAddress {
  private shouldStop: boolean;
  private isRunning: boolean;

  constructor() {
    this.shouldStop = false;
    this.isRunning = false;
  }

  stop = () => {
    if (this.isRunning) {
      this.shouldStop = true;
    }
  };

  generateVanityAddress = async (
    prefix: string,
    suffix: string,
    timeout: number
  ): Promise<[string | null, string | null, Error | null]> => {
    try {
      this.shouldStop = false;
      this.isRunning = true;

      const YIELD_INTERVAL_ATTEMPTS = 500; // keep UI responsive by yielding regularly
      const normalizedPrefix = (prefix || "").trim();
      const normalizedSuffix = (suffix || "").trim();
      const allowedBase58 = /^[1-9A-HJ-NP-Za-km-z]*$/;
      if (
        (normalizedPrefix && !allowedBase58.test(normalizedPrefix)) ||
        (normalizedSuffix && !allowedBase58.test(normalizedSuffix))
      ) {
        this.isRunning = false;
        return [null, null, Error("prefix/suffix must use base58 characters")];
      }

      const maxAddressLength = 44; // base58 length for a Solana pubkey
      if (
        normalizedPrefix.length + normalizedSuffix.length >
        maxAddressLength
      ) {
        this.isRunning = false;
        return [null, null, Error("prefix + suffix too long")];
      }

      const startTime = Date.now();
      let lastLogTime = startTime;
      let attempt = 0;
      while (!this.shouldStop) {
        attempt += 1;
        if (timeout > 0 && Date.now() - startTime > timeout) {
          this.isRunning = false;
          return [null, null, Error("generateVanityAddress() timeout")];
        }

        // log each 10s
        if (Date.now() - lastLogTime >= 10000) {
          const elapsedMinutes = ((Date.now() - startTime) / 60000).toFixed(2);
          logEveryWhere({
            message: `generateVanityAddress() running ... attempts=${attempt}, elapsed ${elapsedMinutes} minutes, prefix=${normalizedPrefix}, suffix=${normalizedSuffix}`,
          });
          await new Promise((resolve) => setTimeout(resolve, 0));
          lastLogTime = Date.now();
        }

        const keypair = Keypair.generate();
        const address = keypair.publicKey.toBase58();

        const hasPrefix =
          !normalizedPrefix || address.startsWith(normalizedPrefix);
        const hasSuffix =
          !normalizedSuffix || address.endsWith(normalizedSuffix);

        if (hasPrefix && hasSuffix) {
          const elapsedMinutes = ((Date.now() - startTime) / 60000).toFixed(2);
          const privateKey = bs58.encode(keypair.secretKey);
          logEveryWhere({
            message: `generateVanityAddress() success, elapsed ${elapsedMinutes} minutes, address=${address}, privateKey: ${privateKey}`,
          });
          this.isRunning = false;
          return [address, privateKey, null];
        }

        // yield periodically even if no log is due, to avoid blocking the UI thread
        if (attempt % YIELD_INTERVAL_ATTEMPTS === 0) {
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      }

      this.shouldStop = false;
      this.isRunning = false;
      logEveryWhere({ message: "generateVanityAddress() stopped by user" });
      return [null, null, null];
    } catch (err: any) {
      this.isRunning = false;
      logEveryWhere({ message: `generateVanityAddress() error: ${err?.message}` });
      return [null, null, err];
    }
  };
}
