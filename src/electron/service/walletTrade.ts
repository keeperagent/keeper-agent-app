import { walletActivityDB } from "@/electron/database/walletActivity";
import { normalizeAddress } from "@/electron/service/walletActivity";
import { getUsdValue } from "@/electron/service/tokenPrice";
import { geckoTerminal } from "@/electron/service/geckoTerminal";
import { logEveryWhere } from "@/electron/service/util";
import { WALLET_ACTIVITY_ACTION_TYPE } from "@/electron/constant";
import {
  ICandle,
  IReplayPoint,
  ITradeDetail,
  IWalletActivity,
  IWalletTrade,
  IWalletTradeReplay,
} from "@/electron/type";

export const buildTradeDetailsForToken = (
  rows: IWalletActivity[],
  tokenAddress: string,
): { tradeDetails: ITradeDetail[]; excludedActivityCount: number } => {
  const tradeDetails: ITradeDetail[] = [];
  let excludedActivityCount = 0;

  for (const row of rows) {
    if (row.actionType !== WALLET_ACTIVITY_ACTION_TYPE.SWAP) {
      excludedActivityCount += 1;
      continue;
    }

    const token0IsTarget = row.token0Address === tokenAddress;
    const token1IsTarget = row.token1Address === tokenAddress;
    if (token0IsTarget === token1IsTarget) {
      continue;
    }

    const isBuy = token1IsTarget; // target received (output) == a buy
    const inputAmount = Math.abs(Number(row.token0Amount));
    const outputAmount = Math.abs(Number(row.token1Amount));
    const trackedAmount = isBuy ? outputAmount : inputAmount;
    const trackedUsd = isBuy ? row.token1UsdValue : row.token0UsdValue;
    if (
      !trackedAmount ||
      !Number.isFinite(trackedAmount) ||
      trackedUsd === undefined ||
      trackedUsd === null
    ) {
      excludedActivityCount += 1;
      continue;
    }

    tradeDetails.push({
      timestamp: Math.floor((row.createAt || 0) / 1000),
      isBuy,
      inputAmount,
      inputUsd: row.token0UsdValue,
      inputSymbol: row.token0Symbol,
      outputAmount,
      outputUsd: row.token1UsdValue,
      outputSymbol: row.token1Symbol,
      txHash: row.txHash,
    });
  }

  tradeDetails.sort((a, b) => a.timestamp - b.timestamp);
  return { tradeDetails, excludedActivityCount };
};

// total PnL = (soldUsd - boughtUsd) + quantity * price. Order-independent
export type FoldedPosition = {
  quantity: number;
  cash: number;
  boughtUsd: number;
  boughtQuantity: number;
  soldUsd: number;
  soldQuantity: number;
  buys: number;
  sells: number;
};

const emptyPosition = (): FoldedPosition => ({
  quantity: 0,
  cash: 0,
  boughtUsd: 0,
  boughtQuantity: 0,
  soldUsd: 0,
  soldQuantity: 0,
  buys: 0,
  sells: 0,
});

// Exported as a single step (not just a fold) so the replay chart can apply it per candle bucket and stay in sync with this accounting.
export const applyTradeDetail = (
  position: FoldedPosition,
  trade: ITradeDetail,
): void => {
  const amount = trade.isBuy ? trade.outputAmount : trade.inputAmount;
  const usd = (trade.isBuy ? trade.outputUsd : trade.inputUsd) || 0;

  if (trade.isBuy) {
    position.quantity += amount;
    position.cash -= usd;
    position.boughtUsd += usd;
    position.boughtQuantity += amount;
    position.buys += 1;
    return;
  }

  position.quantity -= amount;
  position.cash += usd;
  position.soldUsd += usd;
  position.soldQuantity += amount;
  position.sells += 1;
};

export const foldPosition = (tradeDetails: ITradeDetail[]): FoldedPosition => {
  const position = emptyPosition();
  for (const trade of tradeDetails) applyTradeDetail(position, trade);
  return position;
};

// Re-folds trade details per candle bucket so total PnL tracks the scrubber position, not just the end state.
export const replayPnl = (
  tradeDetails: ITradeDetail[],
  candles: ICandle[],
  intervalSeconds: number,
): IReplayPoint[] => {
  if (candles.length === 0) {
    return [];
  }

  const sortedTradeDetails = [...tradeDetails].sort(
    (a, b) => a.timestamp - b.timestamp,
  );
  const position = emptyPosition();

  const points: IReplayPoint[] = [];
  let tradeIndex = 0;

  for (let i = 0; i < candles.length; i += 1) {
    const candle = candles[i];
    // A bucket ends where the next one starts; the last bucket falls back to its own width.
    const cutoff =
      candles[i + 1]?.timestamp || candle.timestamp + intervalSeconds;
    while (
      tradeIndex < sortedTradeDetails.length &&
      sortedTradeDetails[tradeIndex].timestamp < cutoff
    ) {
      applyTradeDetail(position, sortedTradeDetails[tradeIndex]);
      tradeIndex += 1;
    }

    points.push({
      timestamp: candle.timestamp,
      price: candle.close,
      quantity: position.quantity,
      total: position.cash + position.quantity * candle.close,
      boughtUsd: position.boughtUsd,
      soldUsd: position.soldUsd,
      trades: position.buys + position.sells,
    });
  }

  // Trades after the last candle still land on the final point.
  while (tradeIndex < sortedTradeDetails.length) {
    applyTradeDetail(position, sortedTradeDetails[tradeIndex]);
    tradeIndex += 1;
  }
  const lastPoint = points[points.length - 1];
  if (lastPoint) {
    points[points.length - 1] = {
      ...lastPoint,
      quantity: position.quantity,
      total: position.cash + position.quantity * lastPoint.price,
      boughtUsd: position.boughtUsd,
      soldUsd: position.soldUsd,
      trades: position.buys + position.sells,
    };
  }

  return points;
};

// Computed fresh each call from the last 100 activity rows — see getTokenActivityForWallet for the accuracy tradeoff that implies. singleTradeDetail skips the DB read and folds just that one trade instead — used to isolate PnL to a single trade in "This trade" view mode.
export const getWalletTrade = async (
  walletAddress: string,
  chain: string,
  tokenAddress: string,
  singleTradeDetail?: ITradeDetail,
): Promise<[IWalletTrade | null, Error | null]> => {
  try {
    const normalizedWallet = normalizeAddress(walletAddress, chain)!;
    const normalizedToken = normalizeAddress(tokenAddress, chain)!;

    let tradeDetails: ITradeDetail[];
    let excludedActivityCount: number;
    let tokenSymbol: string | undefined;

    if (singleTradeDetail) {
      tradeDetails = [singleTradeDetail];
      excludedActivityCount = 0;
      tokenSymbol = singleTradeDetail.isBuy
        ? singleTradeDetail.outputSymbol
        : singleTradeDetail.inputSymbol;
    } else {
      const [rows, err] = await walletActivityDB.getTokenActivityForWallet(
        normalizedWallet,
        chain,
        normalizedToken,
      );
      if (err) {
        return [null, err];
      }

      const built = buildTradeDetailsForToken(rows || [], normalizedToken);
      tradeDetails = built.tradeDetails;
      excludedActivityCount = built.excludedActivityCount;
      tokenSymbol =
        [...(rows || [])]
          .reverse()
          .find((row) => row.token0Address === normalizedToken)?.token0Symbol ||
        [...(rows || [])]
          .reverse()
          .find((row) => row.token1Address === normalizedToken)?.token1Symbol;
    }

    const position = foldPosition(tradeDetails);

    const currentPrice = await getUsdValue(chain, normalizedToken, "1", false);
    const total =
      currentPrice !== undefined
        ? position.cash + position.quantity * currentPrice
        : undefined;

    const result: IWalletTrade = {
      walletAddress: normalizedWallet,
      chain,
      tokenAddress: normalizedToken,
      tokenSymbol,
      quantity: position.quantity,
      boughtUsd: position.boughtUsd,
      soldUsd: position.soldUsd,
      averageBuyPrice:
        position.boughtQuantity > 0
          ? position.boughtUsd / position.boughtQuantity
          : 0,
      averageSellPrice:
        position.soldQuantity > 0
          ? position.soldUsd / position.soldQuantity
          : 0,
      total,
      trades: position.buys + position.sells,
      firstTimestamp: tradeDetails[0]?.timestamp || 0,
      lastTimestamp: tradeDetails[tradeDetails.length - 1]?.timestamp || 0,
      tradeDetails,
      excludedActivityCount,
    };

    return [result, null];
  } catch (err: any) {
    logEveryWhere({ message: `getWalletTrade() error: ${err?.message}` });
    return [null, err];
  }
};

// Candle fetch failures don't fail the call — PnL still returns, with candlesError set.
export const getWalletTradeReplay = async (
  walletAddress: string,
  chain: string,
  tokenAddress: string,
  singleTradeDetail?: ITradeDetail,
): Promise<[IWalletTradeReplay | null, Error | null]> => {
  const [pnl, pnlErr] = await getWalletTrade(
    walletAddress,
    chain,
    tokenAddress,
    singleTradeDetail,
  );
  if (pnlErr || !pnl) {
    return [null, pnlErr || new Error("Failed to compute PnL")];
  }

  const empty: IWalletTradeReplay = {
    ...pnl,
    candles: [],
    replay: [],
    timeframe: "hour",
    aggregate: 1,
    intervalSeconds: 3_600,
  };

  if (pnl.tradeDetails.length === 0) {
    return [empty, null];
  }

  const nowTimestamp = Math.floor(Date.now() / 1000);
  const holding = pnl.quantity > 1e-9;
  const until = holding ? nowTimestamp : pnl.lastTimestamp;
  const spanSeconds = Math.max(until - pnl.firstTimestamp, 60);
  const padSeconds = Math.max(Math.round(spanSeconds * 0.05), 300);
  const fromTimestamp = pnl.firstTimestamp - padSeconds;
  const toTimestamp = Math.min(until + padSeconds, nowTimestamp);

  const [tokenCandles, candlesErr] = await geckoTerminal.getTokenCandles(
    chain,
    tokenAddress,
    fromTimestamp,
    toTimestamp,
  );
  if (candlesErr || !tokenCandles) {
    return [
      {
        ...empty,
        candlesError: candlesErr?.message || "Failed to load candles",
      },
      null,
    ];
  }

  const replay = replayPnl(
    pnl.tradeDetails,
    tokenCandles.candles,
    tokenCandles.intervalSeconds,
  );

  return [
    {
      ...pnl,
      candles: tokenCandles.candles,
      replay,
      timeframe: tokenCandles.timeframe,
      aggregate: tokenCandles.aggregate,
      intervalSeconds: tokenCandles.intervalSeconds,
    },
    null,
  ];
};
