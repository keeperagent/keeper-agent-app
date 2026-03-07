import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { Program, Provider } from "@coral-xyz/anchor";
import {
  createAssociatedTokenAccountInstruction,
  getAccount,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { BN } from "bn.js";
import { DEFAULT_COMMITMENT, calculateWithSlippageBuy, sendTx } from "./util";
import { PumpFun, IDL } from "./idl";
import { GlobalAccount } from "./globalAccount";
import { CreateTokenMetadata, PriorityFee, TransactionResult } from "./types";
import { logEveryWhere } from "@/electron/service/util";

const PROGRAM_ID = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";
const TOKEN_2022_PROGRAM_ID = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
const ASSOCIATED_TOKEN_PROGRAM_ID =
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
const MAYHEM_PROGRAM_ID = "MAyhSmzXzV1pTf7LsNkrNwkWKTo4ougAJ1PPg47MD4e";

const GLOBAL_ACCOUNT_SEED = "global";
const BONDING_CURVE_SEED = "bonding-curve";
const MINT_AUTHORITY_SEED = "mint-authority";
const GLOBAL_PARAMS_SEED = "global-params";
const SOL_VAULT_SEED = "sol-vault";
const MAYHEM_STATE_SEED = "mayhem-state";
const EVENT_AUTHORITY_SEED = "__event_authority";

export class PumpFunClient {
  public program: Program<PumpFun>;

  constructor() {
    this.program = new Program<PumpFun>(IDL as any, {} as Provider);
  }

  createToken = async (
    connection: Connection,
    creator: Keypair,
    mint: Keypair,
    createTokenMetadata: CreateTokenMetadata,
    buyAmountSol: bigint,
    slippageBasisPoints: bigint = 250n,
    priorityFees?: PriorityFee,
  ): Promise<TransactionResult> => {
    const tokenMetadata = await this.createTokenMetadata(createTokenMetadata);
    const createTx = await this.getCreateInstructions(
      creator.publicKey,
      createTokenMetadata.name,
      createTokenMetadata.symbol,
      tokenMetadata.metadataUri,
      mint,
    );

    const newTx = new Transaction().add(createTx);

    if (buyAmountSol > 0) {
      const globalAccount = await this.getGlobalAccount(connection);
      const buyAmount = globalAccount.getInitialBuyPrice(buyAmountSol);
      const buyAmountWithSlippage = calculateWithSlippageBuy(
        buyAmountSol,
        slippageBasisPoints,
      );

      const buyTx = await this.getBuyInstructions(
        connection,
        creator.publicKey,
        mint.publicKey,
        globalAccount.feeRecipient,
        buyAmount,
        buyAmountWithSlippage,
      );

      newTx.add(buyTx);
    }

    const createResults = await sendTx(
      connection,
      newTx,
      creator.publicKey,
      [creator, mint],
      priorityFees,
    );

    return createResults;
  };

  private getCreateInstructions = async (
    creator: PublicKey,
    name: string,
    symbol: string,
    uri: string,
    mint: Keypair,
  ): Promise<Transaction> => {
    const programId = this.program.programId;
    const token2022Program = new PublicKey(TOKEN_2022_PROGRAM_ID);
    const ataProgram = new PublicKey(ASSOCIATED_TOKEN_PROGRAM_ID);
    const mayhemProgram = new PublicKey(MAYHEM_PROGRAM_ID);

    const [mintAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from(MINT_AUTHORITY_SEED)],
      programId,
    );

    const bondingCurvePda = this.getBondingCurvePDA(mint.publicKey);

    const associatedBondingCurve = await getAssociatedTokenAddress(
      mint.publicKey,
      bondingCurvePda,
      true,
      token2022Program,
      ataProgram,
    );

    const [global] = PublicKey.findProgramAddressSync(
      [Buffer.from(GLOBAL_ACCOUNT_SEED)],
      programId,
    );

    const [globalParams] = PublicKey.findProgramAddressSync(
      [Buffer.from(GLOBAL_PARAMS_SEED)],
      mayhemProgram,
    );

    const [solVault] = PublicKey.findProgramAddressSync(
      [Buffer.from(SOL_VAULT_SEED)],
      mayhemProgram,
    );

    const [mayhemState] = PublicKey.findProgramAddressSync(
      [Buffer.from(MAYHEM_STATE_SEED), mint.publicKey.toBuffer()],
      mayhemProgram,
    );

    const mayhemTokenVault = await getAssociatedTokenAddress(
      mint.publicKey,
      solVault,
      true,
      token2022Program,
      ataProgram,
    );

    const [eventAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from(EVENT_AUTHORITY_SEED)],
      programId,
    );

    return this.program.methods
      .createV2(name, symbol, uri, creator, false)
      .accounts({
        mint: mint.publicKey,
        mintAuthority,
        bondingCurve: bondingCurvePda,
        associatedBondingCurve,
        global,
        user: creator,
        systemProgram: SystemProgram.programId,
        tokenProgram: token2022Program,
        associatedTokenProgram: ataProgram,
        mayhemProgramId: mayhemProgram,
        globalParams,
        solVault,
        mayhemState,
        mayhemTokenVault,
        eventAuthority,
        program: programId,
      } as any)
      .signers([mint])
      .transaction();
  };

  private getBuyInstructions = async (
    connection: Connection,
    buyer: PublicKey,
    mint: PublicKey,
    feeRecipient: PublicKey,
    amount: bigint,
    solAmount: bigint,
  ): Promise<Transaction> => {
    const programId = this.program.programId;
    const token2022Program = new PublicKey(TOKEN_2022_PROGRAM_ID);
    const ataProgram = new PublicKey(ASSOCIATED_TOKEN_PROGRAM_ID);
    const feeProgram = new PublicKey(
      "pfeeUxB6jkeY1Hxd7CsFCAjcbHA9rWtchMGdZ6VojVZ",
    );

    const bondingCurvePda = this.getBondingCurvePDA(mint);
    const associatedBondingCurve = await getAssociatedTokenAddress(
      mint,
      bondingCurvePda,
      true,
      token2022Program,
      ataProgram,
    );

    const associatedUser = await getAssociatedTokenAddress(
      mint,
      buyer,
      false,
      token2022Program,
      ataProgram,
    );
    const transaction = new Transaction();

    try {
      await getAccount(connection, associatedUser, DEFAULT_COMMITMENT);
    } catch {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          buyer,
          associatedUser,
          buyer,
          mint,
          token2022Program,
          ataProgram,
        ),
      );
    }

    const [global] = PublicKey.findProgramAddressSync(
      [Buffer.from(GLOBAL_ACCOUNT_SEED)],
      programId,
    );

    const [creatorVault] = PublicKey.findProgramAddressSync(
      [Buffer.from("creator-vault"), buyer.toBuffer()],
      programId,
    );

    const [eventAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from(EVENT_AUTHORITY_SEED)],
      programId,
    );

    const [globalVolumeAccumulator] = PublicKey.findProgramAddressSync(
      [Buffer.from("global_volume_accumulator")],
      programId,
    );

    const [userVolumeAccumulator] = PublicKey.findProgramAddressSync(
      [Buffer.from("user_volume_accumulator"), buyer.toBuffer()],
      programId,
    );

    const [feeConfig] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("fee_config"),
        Buffer.from([
          1, 86, 224, 246, 147, 102, 90, 207, 68, 219, 21, 104, 191, 23, 91,
          170, 81, 137, 203, 151, 245, 210, 255, 59, 101, 93, 43, 182, 253, 109,
          24, 176,
        ]),
      ],
      feeProgram,
    );

    transaction.add(
      await this.program.methods
        .buy(new BN(amount.toString()), new BN(solAmount.toString()), {
          0: false,
        })
        // Casting to any to accommodate generated Anchor types
        .accounts({
          global,
          feeRecipient: feeRecipient,
          mint: mint,
          bondingCurve: bondingCurvePda,
          associatedBondingCurve,
          associatedUser: associatedUser,
          user: buyer,
          systemProgram: SystemProgram.programId,
          tokenProgram: token2022Program,
          creatorVault,
          eventAuthority,
          program: programId,
          globalVolumeAccumulator,
          userVolumeAccumulator,
          feeConfig,
          feeProgram,
        } as any)
        .transaction(),
    );

    return transaction;
  };

  private getGlobalAccount = async (
    connection: Connection,
  ): Promise<GlobalAccount> => {
    const [globalAccountPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from(GLOBAL_ACCOUNT_SEED)],
      new PublicKey(PROGRAM_ID),
    );

    const tokenAccount = await connection.getAccountInfo(
      globalAccountPDA,
      DEFAULT_COMMITMENT,
    );

    return GlobalAccount.fromBuffer(tokenAccount!.data);
  };

  private getBondingCurvePDA = (mint: PublicKey): PublicKey => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from(BONDING_CURVE_SEED), mint.toBuffer()],
      this.program.programId,
    )[0];
  };

  private createTokenMetadata = async (
    metadata: CreateTokenMetadata,
  ): Promise<any> => {
    const formData = new FormData();
    if (metadata?.file instanceof Blob) {
      formData.append("file", metadata?.file, "image.png"); // Add filename
    }

    formData.append("name", metadata?.name);
    formData.append("symbol", metadata?.symbol);
    formData.append("description", metadata?.description);
    formData.append("twitter", metadata?.twitter || "");
    formData.append("telegram", metadata?.telegram || "");
    formData.append("website", metadata?.website || "");
    formData.append("showName", "true");

    try {
      const request = await fetch("https://pump.fun/api/ipfs", {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        body: formData,
        credentials: "same-origin",
      });

      if (request.status === 500) {
        // Try to get more error details
        const errorText = await request.text();
        throw new Error(
          `Server error (500): ${errorText || "No error details available"}`,
        );
      }

      if (!request.ok) {
        throw new Error(`HTTP error! status: ${request.status}`);
      }

      const responseText = await request.text();
      if (!responseText) {
        throw new Error("Empty response received from server");
      }

      try {
        return JSON.parse(responseText);
      } catch {
        throw new Error(`Invalid JSON response: ${responseText}`);
      }
    } catch (error: any) {
      logEveryWhere({
        message: `Error in createTokenMetadata: ${error?.message}`,
      });
      throw error;
    }
  };
}
