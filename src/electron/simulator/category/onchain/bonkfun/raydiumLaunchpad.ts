/**
 * Reimplementation of the subset of @raydium-io/raydium-sdk-v2 used by bonkfun.
 * This replaces the ~88MB SDK dependency with raw Solana instructions.
 */
import {
  PublicKey,
  TransactionInstruction,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
  Connection,
  ComputeBudgetProgram,
  AccountMeta,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  NATIVE_MINT,
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddressSync,
  createSyncNativeInstruction,
} from "@solana/spl-token";
import BN from "bn.js";

export interface LaunchpadConfigInfo {
  index: number;
  mintB: PublicKey;
  tradeFeeRate: BN;
  epoch: BN;
  curveType: number;
  migrateFee: BN;
  maxShareFeeRate: BN;
  minSupplyA: BN;
  maxLockRate: BN;
  minSellRateA: BN;
  minMigrateRateA: BN;
  minFundRaisingB: BN;
  protocolFeeOwner: PublicKey;
  migrateFeeOwner: PublicKey;
  migrateToAmmWallet: PublicKey;
  migrateToCpmmWallet: PublicKey;
}

export interface ApiV3Token {
  address: string;
  decimals: number;
  symbol?: string;
  name?: string;
  [key: string]: any;
}

interface PlatformInfo {
  feeRate: BN;
  creatorFeeRate: BN;
  platformVestingScale: BN;
}

interface CreateLaunchpadParams {
  connection: Connection;
  owner: PublicKey;
  programId?: PublicKey;
  mintA: PublicKey;
  mintB?: PublicKey;
  decimals: number;
  name: string;
  symbol: string;
  uri: string;
  configId: PublicKey;
  configInfo: LaunchpadConfigInfo;
  migrateType: "amm" | "cpmm";
  platformId: PublicKey;
  supply: BN;
  totalSellA: BN;
  totalFundRaisingB: BN;
  totalLockedAmount: BN;
  cliffPeriod: BN;
  unlockPeriod: BN;
  slippage: BN;
  buyAmount: BN;
  createOnly: boolean;
  computeBudgetConfig?: {
    units?: number;
    microLamports?: number;
  };
}

export class RaydiumLaunchpad {
  static readonly LAUNCHPAD_PROGRAM = new PublicKey(
    "LanMV9sAd7wArD4vJFi2qDdfnVhFxYSUg6eADduJ3uj",
  );

  static readonly LaunchpadPoolInitParam = {
    supply: new BN(1_000_000_000_000_000),
    totalSellA: new BN(793_100_000_000_000),
    totalFundRaisingB: new BN(85_000_000_000),
    totalFundRaisingBUSD: new BN(12_500_000_000),
    totalLockedAmount: new BN("0"),
    cliffPeriod: new BN("0"),
    unlockPeriod: new BN("0"),
    decimals: 6,
    realA: new BN(0),
    realB: new BN(0),
    protocolFee: new BN(0),
  };

  private static readonly METADATA_PROGRAM_ID = new PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
  );

  private static readonly RENT_PROGRAM_ID = new PublicKey(
    "SysvarRent111111111111111111111111111111111",
  );

  private static readonly POOL_SEED = Buffer.from("pool", "utf8");
  private static readonly POOL_VAULT_SEED = Buffer.from("pool_vault", "utf8");
  private static readonly AUTH_SEED = Buffer.from("vault_auth_seed", "utf8");
  private static readonly CPI_EVENT_SEED = Buffer.from(
    "__event_authority",
    "utf8",
  );

  private static readonly FEE_RATE_DENOMINATOR = new BN(1_000_000);
  private static readonly SLIPPAGE_UNIT = new BN(10000);

  private static readonly DISCRIMINATOR_INITIALIZE_V2 = Buffer.from([
    67, 153, 175, 39, 218, 16, 38, 32,
  ]);
  private static readonly DISCRIMINATOR_BUY_EXACT_IN = Buffer.from([
    250, 234, 13, 123, 213, 156, 19, 236,
  ]);

  // PlatformConfig layout byte offsets
  private static readonly PLATFORM_FEE_RATE_OFFSET = 104;
  private static readonly PLATFORM_CREATOR_FEE_RATE_OFFSET = 720;
  private static readonly PLATFORM_VESTING_SCALE_OFFSET = 792;

  // --- PDA derivation ---

  private static getPdaLaunchpadAuth = (programId: PublicKey): PublicKey =>
    PublicKey.findProgramAddressSync([this.AUTH_SEED], programId)[0];

  private static getPdaLaunchpadPoolId = (
    programId: PublicKey,
    mintA: PublicKey,
    mintB: PublicKey,
  ): PublicKey =>
    PublicKey.findProgramAddressSync(
      [this.POOL_SEED, mintA.toBuffer(), mintB.toBuffer()],
      programId,
    )[0];

  private static getPdaLaunchpadVaultId = (
    programId: PublicKey,
    poolId: PublicKey,
    mint: PublicKey,
  ): PublicKey =>
    PublicKey.findProgramAddressSync(
      [this.POOL_VAULT_SEED, poolId.toBuffer(), mint.toBuffer()],
      programId,
    )[0];

  private static getPdaMetadataKey = (mint: PublicKey): PublicKey =>
    PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata", "utf8"),
        this.METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
      ],
      this.METADATA_PROGRAM_ID,
    )[0];

  private static getPdaCpiEvent = (programId: PublicKey): PublicKey =>
    PublicKey.findProgramAddressSync([this.CPI_EVENT_SEED], programId)[0];

  private static getPdaPlatformVault = (
    programId: PublicKey,
    platformId: PublicKey,
    mintB: PublicKey,
  ): PublicKey =>
    PublicKey.findProgramAddressSync(
      [platformId.toBuffer(), mintB.toBuffer()],
      programId,
    )[0];

  private static getPdaCreatorVault = (
    programId: PublicKey,
    creator: PublicKey,
    mintB: PublicKey,
  ): PublicKey =>
    PublicKey.findProgramAddressSync(
      [creator.toBuffer(), mintB.toBuffer()],
      programId,
    )[0];

  // --- Encoding helpers ---

  private static encodeU8 = (value: number): Buffer => {
    const buf = Buffer.alloc(1);
    buf.writeUInt8(value, 0);
    return buf;
  };

  private static encodeU64 = (value: BN): Buffer =>
    value.toArrayLike(Buffer, "le", 8);

  private static encodeStr = (s: string): Buffer => {
    const strBuf = Buffer.from(s, "utf-8");
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32LE(strBuf.length, 0);
    return Buffer.concat([lenBuf, strBuf]);
  };

  // --- Instruction builders ---

  private static buildInitializeV2Instruction = (
    programId: PublicKey,
    payer: PublicKey,
    creator: PublicKey,
    configId: PublicKey,
    platformId: PublicKey,
    auth: PublicKey,
    poolId: PublicKey,
    mintA: PublicKey,
    mintB: PublicKey,
    vaultA: PublicKey,
    vaultB: PublicKey,
    metadataId: PublicKey,
    decimals: number,
    name: string,
    symbol: string,
    uri: string,
    curveType: number,
    totalSellA: BN,
    supply: BN,
    totalFundRaisingB: BN,
    migrateType: "amm" | "cpmm",
    totalLockedAmount: BN,
    cliffPeriod: BN,
    unlockPeriod: BN,
    cpmmCreatorFeeOn: number,
  ): TransactionInstruction => {
    const keys: AccountMeta[] = [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: creator, isSigner: false, isWritable: false },
      { pubkey: configId, isSigner: false, isWritable: false },
      { pubkey: platformId, isSigner: false, isWritable: false },
      { pubkey: auth, isSigner: false, isWritable: false },
      { pubkey: poolId, isSigner: false, isWritable: true },
      { pubkey: mintA, isSigner: true, isWritable: true },
      { pubkey: mintB, isSigner: false, isWritable: false },
      { pubkey: vaultA, isSigner: false, isWritable: true },
      { pubkey: vaultB, isSigner: false, isWritable: true },
      { pubkey: metadataId, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: this.METADATA_PROGRAM_ID, isSigner: false, isWritable: false },
      {
        pubkey: SystemProgram.programId,
        isSigner: false,
        isWritable: false,
      },
      { pubkey: this.RENT_PROGRAM_ID, isSigner: false, isWritable: false },
      {
        pubkey: this.getPdaCpiEvent(programId),
        isSigner: false,
        isWritable: false,
      },
      { pubkey: programId, isSigner: false, isWritable: false },
    ];

    // data1: decimals(u8) + name(str) + symbol(str) + uri(str)
    const data1 = Buffer.concat([
      this.encodeU8(decimals),
      this.encodeStr(name),
      this.encodeStr(symbol),
      this.encodeStr(uri),
    ]);

    // data2: curve params
    // ConstantCurve (type 0): index(u8) + supply(u64) + totalSellA(u64) + totalFundRaisingB(u64) + migrateType(u8)
    // FixedCurve (type 1) / LinearCurve (type 2): index(u8) + supply(u64) + totalFundRaisingB(u64) + migrateType(u8)
    const migrateTypeVal = migrateType === "amm" ? 0 : 1;
    let data2: Buffer;
    if (curveType === 0) {
      data2 = Buffer.concat([
        this.encodeU8(0),
        this.encodeU64(supply),
        this.encodeU64(totalSellA),
        this.encodeU64(totalFundRaisingB),
        this.encodeU8(migrateTypeVal),
      ]);
    } else {
      data2 = Buffer.concat([
        this.encodeU8(curveType),
        this.encodeU64(supply),
        this.encodeU64(totalFundRaisingB),
        this.encodeU8(migrateTypeVal),
      ]);
    }

    // data3: totalLockedAmount(u64) + cliffPeriod(u64) + unlockPeriod(u64) + cpmmCreatorFeeOn(u8)
    const data3 = Buffer.concat([
      this.encodeU64(totalLockedAmount),
      this.encodeU64(cliffPeriod),
      this.encodeU64(unlockPeriod),
      this.encodeU8(cpmmCreatorFeeOn),
    ]);

    return new TransactionInstruction({
      keys,
      programId,
      data: Buffer.concat([
        this.DISCRIMINATOR_INITIALIZE_V2,
        data1,
        data2,
        data3,
      ]),
    });
  };

  private static buildBuyExactInInstruction = (
    programId: PublicKey,
    owner: PublicKey,
    auth: PublicKey,
    configId: PublicKey,
    platformId: PublicKey,
    poolId: PublicKey,
    userTokenAccountA: PublicKey,
    userTokenAccountB: PublicKey,
    vaultA: PublicKey,
    vaultB: PublicKey,
    mintA: PublicKey,
    mintB: PublicKey,
    tokenProgramA: PublicKey,
    tokenProgramB: PublicKey,
    platformClaimFeeVault: PublicKey,
    creatorClaimFeeVault: PublicKey,
    amountB: BN,
    minAmountA: BN,
    shareFeeRate: BN,
  ): TransactionInstruction => {
    const keys: AccountMeta[] = [
      { pubkey: owner, isSigner: true, isWritable: true },
      { pubkey: auth, isSigner: false, isWritable: false },
      { pubkey: configId, isSigner: false, isWritable: false },
      { pubkey: platformId, isSigner: false, isWritable: false },
      { pubkey: poolId, isSigner: false, isWritable: true },
      { pubkey: userTokenAccountA, isSigner: false, isWritable: true },
      { pubkey: userTokenAccountB, isSigner: false, isWritable: true },
      { pubkey: vaultA, isSigner: false, isWritable: true },
      { pubkey: vaultB, isSigner: false, isWritable: true },
      { pubkey: mintA, isSigner: false, isWritable: false },
      { pubkey: mintB, isSigner: false, isWritable: false },
      { pubkey: tokenProgramA, isSigner: false, isWritable: false },
      { pubkey: tokenProgramB, isSigner: false, isWritable: false },
      {
        pubkey: this.getPdaCpiEvent(programId),
        isSigner: false,
        isWritable: false,
      },
      { pubkey: programId, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: platformClaimFeeVault, isSigner: false, isWritable: true },
      { pubkey: creatorClaimFeeVault, isSigner: false, isWritable: true },
    ];

    const data = Buffer.concat([
      this.DISCRIMINATOR_BUY_EXACT_IN,
      this.encodeU64(amountB),
      this.encodeU64(minAmountA),
      this.encodeU64(shareFeeRate),
    ]);

    return new TransactionInstruction({
      keys,
      programId,
      data,
    });
  };

  // --- Curve math ---

  private static ceilDiv = (
    tokenAmount: BN,
    feeNumerator: BN,
    feeDenominator: BN,
  ): BN =>
    tokenAmount
      .mul(feeNumerator)
      .add(feeDenominator)
      .sub(new BN(1))
      .div(feeDenominator);

  private static constantProductGetInitParam = (params: {
    supply: BN;
    totalFundRaising: BN;
    totalSell: BN;
    totalLockedAmount: BN;
    migrateFee: BN;
  }): { virtualA: BN; virtualB: BN; c: BN } => {
    const {
      supply,
      totalFundRaising,
      totalSell,
      totalLockedAmount,
      migrateFee,
    } = params;

    const supplyMinusSellLocked = supply.sub(totalSell).sub(totalLockedAmount);
    const tfMinusMf = totalFundRaising.sub(migrateFee);

    const numerator = tfMinusMf
      .mul(totalSell)
      .mul(totalSell)
      .div(supplyMinusSellLocked);
    const denominator = tfMinusMf
      .mul(totalSell)
      .div(supplyMinusSellLocked)
      .sub(totalFundRaising);
    const x0 = numerator.div(denominator);
    const y0 = totalFundRaising.mul(totalFundRaising).div(denominator);

    return { virtualA: x0, virtualB: y0, c: totalSell };
  };

  private static constantProductBuyExactIn = (
    virtualA: BN,
    virtualB: BN,
    realA: BN,
    realB: BN,
    amountIn: BN,
  ): BN => {
    const inputReserve = virtualB.add(realB);
    const outputReserve = virtualA.sub(realA);
    const numerator = amountIn.mul(outputReserve);
    const denominator = inputReserve.add(amountIn);
    return numerator.div(denominator);
  };

  private static constantProductBuyExactOut = (
    virtualA: BN,
    virtualB: BN,
    realA: BN,
    realB: BN,
    amountOut: BN,
  ): BN => {
    const inputReserve = virtualB.add(realB);
    const outputReserve = virtualA.sub(realA);
    const numerator = amountOut.mul(inputReserve);
    const denominator = outputReserve.sub(amountOut);
    return numerator.div(denominator);
  };

  // --- Fee computation ---

  private static computeTotalFeeRate = (
    protocolFeeRate: BN,
    platformFeeRate: BN,
    shareFeeRate: BN,
    creatorFeeRate: BN,
  ): BN =>
    protocolFeeRate.add(platformFeeRate).add(shareFeeRate).add(creatorFeeRate);

  private static computeFee = (amount: BN, feeRate: BN): BN =>
    this.ceilDiv(amount, feeRate, this.FEE_RATE_DENOMINATOR);

  private static computePreFeeAmount = (postFeeAmount: BN, feeRate: BN): BN => {
    const numerator = postFeeAmount.mul(this.FEE_RATE_DENOMINATOR);
    const denominator = this.FEE_RATE_DENOMINATOR.sub(feeRate);
    return numerator.div(denominator);
  };

  private static computeBuyExactIn = (params: {
    poolInfo: {
      virtualA: BN;
      virtualB: BN;
      realA: BN;
      realB: BN;
      totalSellA: BN;
    };
    amountB: BN;
    protocolFeeRate: BN;
    platformFeeRate: BN;
    shareFeeRate: BN;
    creatorFeeRate: BN;
  }): { amountA: BN; amountB: BN } => {
    const {
      poolInfo,
      amountB,
      protocolFeeRate,
      platformFeeRate,
      shareFeeRate,
      creatorFeeRate,
    } = params;

    const feeRate = this.computeTotalFeeRate(
      protocolFeeRate,
      platformFeeRate,
      shareFeeRate,
      creatorFeeRate,
    );
    const totalFee = this.computeFee(amountB, feeRate);
    const amountLessFeeB = amountB.sub(totalFee);

    const _amountA = this.constantProductBuyExactIn(
      poolInfo.virtualA,
      poolInfo.virtualB,
      poolInfo.realA,
      poolInfo.realB,
      amountLessFeeB,
    );

    const remainingAmountA = poolInfo.totalSellA.sub(poolInfo.realA);

    if (_amountA.gt(remainingAmountA)) {
      const amountLessFeeB = this.constantProductBuyExactOut(
        poolInfo.virtualA,
        poolInfo.virtualB,
        poolInfo.realA,
        poolInfo.realB,
        remainingAmountA,
      );
      const realAmountB = this.computePreFeeAmount(amountLessFeeB, feeRate);
      return { amountA: remainingAmountA, amountB: realAmountB };
    }

    return { amountA: _amountA, amountB };
  };

  // --- Platform config decoding ---

  private static decodePlatformConfig = (data: Buffer): PlatformInfo => {
    const feeRate = new BN(
      data.subarray(
        this.PLATFORM_FEE_RATE_OFFSET,
        this.PLATFORM_FEE_RATE_OFFSET + 8,
      ),
      "le",
    );
    const creatorFeeRate = new BN(
      data.subarray(
        this.PLATFORM_CREATOR_FEE_RATE_OFFSET,
        this.PLATFORM_CREATOR_FEE_RATE_OFFSET + 8,
      ),
      "le",
    );
    const platformVestingScale = new BN(
      data.subarray(
        this.PLATFORM_VESTING_SCALE_OFFSET,
        this.PLATFORM_VESTING_SCALE_OFFSET + 8,
      ),
      "le",
    );
    return { feeRate, creatorFeeRate, platformVestingScale };
  };

  // --- Public API ---

  static txToBase64 = (transaction: VersionedTransaction): string => {
    const serialized = transaction.serialize();
    return Buffer.from(serialized).toString("base64");
  };

  static createLaunchpadTransaction = async (
    params: CreateLaunchpadParams,
  ): Promise<{ transactions: VersionedTransaction[] }> => {
    const {
      connection,
      owner,
      programId = this.LAUNCHPAD_PROGRAM,
      mintA,
      mintB = NATIVE_MINT,
      decimals,
      name,
      symbol,
      uri,
      configId,
      configInfo,
      migrateType,
      platformId,
      supply,
      totalSellA,
      totalFundRaisingB,
      totalLockedAmount,
      cliffPeriod,
      unlockPeriod,
      slippage,
      buyAmount,
      createOnly,
      computeBudgetConfig,
    } = params;

    const instructions: TransactionInstruction[] = [];

    // Derive PDAs
    const auth = this.getPdaLaunchpadAuth(programId);
    const poolId = this.getPdaLaunchpadPoolId(programId, mintA, mintB);
    const vaultA = this.getPdaLaunchpadVaultId(programId, poolId, mintA);
    const vaultB = this.getPdaLaunchpadVaultId(programId, poolId, mintB);
    const metadataId = this.getPdaMetadataKey(mintA);

    // Fetch platform config from chain
    const platformData = await connection.getAccountInfo(platformId);
    if (!platformData) {
      throw new Error("platform id not found: " + platformId.toString());
    }
    const platformInfo = this.decodePlatformConfig(platformData.data);

    // Compute curve init params (ConstantProduct - curveType 0)
    const curveType = configInfo.curveType;
    const initParam = this.constantProductGetInitParam({
      supply,
      totalFundRaising: totalFundRaisingB,
      totalSell: totalSellA,
      totalLockedAmount,
      migrateFee: configInfo.migrateFee,
    });

    const cpmmCreatorFeeOn = 0;

    // Build initializeV2 instruction
    instructions.push(
      this.buildInitializeV2Instruction(
        programId,
        owner,
        owner,
        configId,
        platformId,
        auth,
        poolId,
        mintA,
        mintB,
        vaultA,
        vaultB,
        metadataId,
        decimals,
        name,
        symbol,
        uri || "https://",
        curveType,
        totalSellA,
        supply,
        totalFundRaisingB,
        migrateType,
        totalLockedAmount,
        cliffPeriod,
        unlockPeriod,
        cpmmCreatorFeeOn,
      ),
    );

    // If not createOnly, add buy instructions
    if (!createOnly && buyAmount.gt(new BN(0))) {
      const poolInfo = {
        virtualA: initParam.virtualA,
        virtualB: initParam.virtualB,
        realA: new BN(0),
        realB: new BN(0),
        totalSellA,
      };

      const calculatedAmount = this.computeBuyExactIn({
        poolInfo,
        amountB: buyAmount,
        protocolFeeRate: configInfo.tradeFeeRate,
        platformFeeRate: platformInfo.feeRate,
        shareFeeRate: new BN(0),
        creatorFeeRate: platformInfo.creatorFeeRate,
      });

      // Compute min amount with slippage
      let minMintAAmount: BN;
      if (slippage && !slippage.isZero()) {
        const slippageNumerator = this.SLIPPAGE_UNIT.sub(slippage);
        minMintAAmount = calculatedAmount.amountA
          .mul(slippageNumerator)
          .div(this.SLIPPAGE_UNIT);
      } else {
        minMintAAmount = calculatedAmount.amountA;
      }

      const actualBuyAmount = calculatedAmount.amountB.lt(buyAmount)
        ? calculatedAmount.amountB
        : buyAmount;

      // Create ATA for mintA (the new token)
      const userTokenAccountA = getAssociatedTokenAddressSync(
        mintA,
        owner,
        false,
        TOKEN_PROGRAM_ID,
      );
      instructions.push(
        createAssociatedTokenAccountIdempotentInstruction(
          owner,
          userTokenAccountA,
          owner,
          mintA,
          TOKEN_PROGRAM_ID,
        ),
      );

      // Create ATA for mintB (wrapped SOL), transfer SOL, sync native
      const userTokenAccountB = getAssociatedTokenAddressSync(
        mintB,
        owner,
        false,
        TOKEN_PROGRAM_ID,
      );
      instructions.push(
        createAssociatedTokenAccountIdempotentInstruction(
          owner,
          userTokenAccountB,
          owner,
          mintB,
          TOKEN_PROGRAM_ID,
        ),
      );
      instructions.push(
        SystemProgram.transfer({
          fromPubkey: owner,
          toPubkey: userTokenAccountB,
          lamports: BigInt(buyAmount.toString()),
        }),
      );
      instructions.push(createSyncNativeInstruction(userTokenAccountB));

      // Build buyExactIn instruction
      const platformClaimFeeVault = this.getPdaPlatformVault(
        programId,
        platformId,
        mintB,
      );
      const creatorClaimFeeVault = this.getPdaCreatorVault(
        programId,
        owner,
        mintB,
      );

      instructions.push(
        this.buildBuyExactInInstruction(
          programId,
          owner,
          auth,
          configId,
          platformId,
          poolId,
          userTokenAccountA,
          userTokenAccountB,
          vaultA,
          vaultB,
          mintA,
          mintB,
          TOKEN_PROGRAM_ID,
          TOKEN_PROGRAM_ID,
          platformClaimFeeVault,
          creatorClaimFeeVault,
          actualBuyAmount,
          minMintAAmount,
          new BN(0),
        ),
      );
    }

    // Add compute budget instructions at the beginning
    const finalInstructions: TransactionInstruction[] = [];
    if (computeBudgetConfig?.units) {
      finalInstructions.push(
        ComputeBudgetProgram.setComputeUnitLimit({
          units: computeBudgetConfig.units,
        }),
      );
    }
    if (computeBudgetConfig?.microLamports) {
      finalInstructions.push(
        ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: computeBudgetConfig.microLamports,
        }),
      );
    }
    finalInstructions.push(...instructions);

    // Build VersionedTransaction (V0)
    const { blockhash } = await connection.getLatestBlockhash("finalized");
    const messageV0 = new TransactionMessage({
      payerKey: owner,
      recentBlockhash: blockhash,
      instructions: finalInstructions,
    }).compileToV0Message();

    const transaction = new VersionedTransaction(messageV0);

    return { transactions: [transaction] };
  };
}
