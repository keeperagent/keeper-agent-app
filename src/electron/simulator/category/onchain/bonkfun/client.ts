import {
  RaydiumLaunchpad,
  LaunchpadConfigInfo,
  ApiV3Token,
} from "./raydiumLaunchpad";
import {
  PublicKey,
  VersionedTransaction,
  Keypair,
  Connection,
} from "@solana/web3.js";
import axios from "axios";
import BN from "bn.js";
import { SOL_MINT_ADDRESS } from "@/electron/constant";
import { logEveryWhere } from "@/electron/service/util";

interface ConfigInfo {
  name: string;
  pubKey: string;
  epoch: number;
  curveType: number;
  index: number;
  migrateFee: string;
  tradeFeeRate: string;
  maxShareFeeRate: string;
  minSupplyA: string;
  maxLockRate: string;
  minSellRateA: string;
  minMigrateRateA: string;
  minFundRaisingB: string;
  protocolFeeOwner: string;
  migrateFeeOwner: string;
  migrateToAmmWallet: string;
  migrateToCpmmWallet: string;
  mintB: string;
}

export type CreateTokenMetadata = {
  name: string;
  symbol: string;
  description: string;
  file?: Blob;
  twitter?: string;
  telegram?: string;
  website?: string;
};

type PriorityFee = {
  unitLimit: number;
  unitPrice: number;
};

const mintHost = "https://launch-mint-v1.raydium.io";
const USD1_ADDRESS = "USD1ttGY1N17NEEHLmELoaybftRBUSErhqYiQzvEmuB";

export class BonkFunClient {
  // return [txHash, token address, error]
  createToken = async (
    connection: Connection,
    creator: Keypair,
    useUsd1: boolean,
    createTokenMetadata: CreateTokenMetadata,
    buyAmountSol: bigint,
    slippagePercentage: number,
    priorityFees?: PriorityFee,
  ): Promise<[string | null, string | null, Error | null]> => {
    try {
      const owner = creator.publicKey;
      const programId = RaydiumLaunchpad.LAUNCHPAD_PROGRAM;

      const configRes: {
        data: {
          data: {
            data: {
              key: ConfigInfo;
              mintInfoB: ApiV3Token;
            }[];
          };
        };
      } = await axios.get(`${mintHost}/main/configs`, { timeout: 10000 });
      const listConfig = configRes.data.data.data;
      const config = listConfig?.find(
        (config) =>
          config?.mintInfoB?.address ===
          (useUsd1 ? USD1_ADDRESS : SOL_MINT_ADDRESS),
      );
      const configKey = config?.key;
      if (!configKey) {
        return [null, null, new Error("config not found")];
      }

      const configInfo: LaunchpadConfigInfo = {
        index: configKey.index,
        mintB: new PublicKey(configKey.mintB),
        tradeFeeRate: new BN(configKey.tradeFeeRate),
        epoch: new BN(configKey.epoch),
        curveType: configKey.curveType,
        migrateFee: new BN(configKey.migrateFee),
        maxShareFeeRate: new BN(configKey.maxShareFeeRate),
        minSupplyA: new BN(configKey.minSupplyA),
        maxLockRate: new BN(configKey.maxLockRate),
        minSellRateA: new BN(configKey.minSellRateA),
        minMigrateRateA: new BN(configKey.minMigrateRateA),
        minFundRaisingB: new BN(configKey.minFundRaisingB),
        protocolFeeOwner: new PublicKey(configKey.protocolFeeOwner),
        migrateFeeOwner: new PublicKey(configKey.migrateFeeOwner),
        migrateToAmmWallet: new PublicKey(configKey.migrateToAmmWallet),
        migrateToCpmmWallet: new PublicKey(configKey.migrateToCpmmWallet),
      };

      const configId = new PublicKey(configKey.pubKey);

      let newMintData: any = {
        wallet: owner.toBase58(),
        name: createTokenMetadata?.name,
        symbol: createTokenMetadata?.symbol,
        description: createTokenMetadata?.description || "",
        configId: configId.toString(),
        decimals: RaydiumLaunchpad.LaunchpadPoolInitParam.decimals,
        supply: RaydiumLaunchpad.LaunchpadPoolInitParam.supply, // or custom set up supply
        totalSellA: RaydiumLaunchpad.LaunchpadPoolInitParam.totalSellA, // or custom set up totalSellA
        totalFundRaisingB:
          RaydiumLaunchpad.LaunchpadPoolInitParam.totalFundRaisingB,
        totalLockedAmount:
          RaydiumLaunchpad.LaunchpadPoolInitParam.totalLockedAmount,
        cliffPeriod: RaydiumLaunchpad.LaunchpadPoolInitParam.cliffPeriod,
        unlockPeriod: RaydiumLaunchpad.LaunchpadPoolInitParam.unlockPeriod,
        platformId: new PublicKey(
          "8pCtbn9iatQ8493mDQax4xfEUjhoVBpUWYVQoRU18333",
        ),
        migrateType: "amm",
      };
      if (createTokenMetadata?.website) {
        newMintData = {
          ...newMintData,
          website: createTokenMetadata?.website,
        };
      }
      if (createTokenMetadata?.twitter) {
        newMintData = {
          ...newMintData,
          twitter: createTokenMetadata?.twitter,
        };
      }
      if (createTokenMetadata?.telegram) {
        newMintData = {
          ...newMintData,
          telegram: createTokenMetadata?.telegram,
        };
      }

      const form = new FormData();
      Object.keys(newMintData).forEach((key) => {
        // @ts-ignore
        form.append(key, newMintData[key]);
      });

      form.append(
        "file",
        createTokenMetadata?.file as Blob,
        `${createTokenMetadata?.name}.png`,
      );

      const r: {
        data: {
          id: string;
          success: boolean;
          data: { mint: string; metadataLink: string };
        };
      } = await axios.post(`${mintHost}/create/get-random-mint`, form, {
        headers: {
          "Content-Type": "multipart/form-data",
          "ray-token": `token-${Date.now()}`,
        },
      });

      const mintA = new PublicKey(r.data.data.mint);
      const { transactions } =
        await RaydiumLaunchpad.createLaunchpadTransaction({
          connection,
          owner,
          programId,
          mintA,
          decimals: newMintData.decimals,
          name: newMintData.name,
          symbol: newMintData.symbol,
          uri: r.data.data.metadataLink,
          configId,
          configInfo,
          migrateType: newMintData.migrateType as "amm" | "cpmm",
          platformId: newMintData.platformId,
          slippage: new BN(Math.round(slippagePercentage / 100)),
          buyAmount: new BN(buyAmountSol),
          createOnly: buyAmountSol === 0n,
          supply: newMintData.supply,
          totalSellA: newMintData.totalSellA,
          totalFundRaisingB: newMintData.totalFundRaisingB,
          totalLockedAmount: newMintData.totalLockedAmount,
          cliffPeriod: newMintData.cliffPeriod,
          unlockPeriod: newMintData.unlockPeriod,
          computeBudgetConfig: {
            units: priorityFees?.unitLimit || undefined,
            microLamports: priorityFees?.unitPrice || undefined,
          },
        });

      const transaction = transactions[0];

      // Sign with creator keypair BEFORE sending to server
      transaction.sign([creator]);

      const { data } = await axios.post(`${mintHost}/create/sendTransaction`, {
        txs: [RaydiumLaunchpad.txToBase64(transaction)],
      });

      const txBuf = Buffer.from(data.data.tx, "base64");
      const bothSignedTx = VersionedTransaction.deserialize(txBuf as any);

      const txHash = await connection.sendTransaction(
        bothSignedTx as VersionedTransaction,
        { skipPreflight: false },
      );
      return [txHash, mintA.toBase58(), null];
    } catch (error: any) {
      logEveryWhere({ message: `Bonkfun createToken(): ${error?.message}` });
      return [null, null, error];
    }
  };
}
