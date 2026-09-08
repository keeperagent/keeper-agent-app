import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Empty, Modal, Segmented, Slider, Spin, Tooltip, message } from "antd";
import copy from "copy-to-clipboard";
import dayjs from "dayjs";
import ReactECharts from "echarts-for-react";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { CheckIcon, CopyIcon, PlayIcon, StopIcon } from "@/component/Icon";
import { useGetWalletTradeReplay, useTranslation } from "@/hook";
import { ICandle, IReplayPoint, ITradeDetail } from "@/electron/type";
import { Wrapper } from "./style";

type IProps = {
  open: boolean;
  onClose: () => void;
  walletAddress: string;
  chain: string;
  tokenAddress: string;
  tokenSymbol?: string;
  isLightMode: boolean;
  // The single trade the "Detail" button was clicked on — enables the "This trade" view toggle when present
  selectedTradeDetail?: ITradeDetail;
};

type IViewMode = "all" | "single";
// Below this many real candles, the chart pads with invisible trailing slots so candle width/spacing stays consistent instead of stretching to fill the container.
const MIN_VISIBLE_SLOTS = 30;
// Per-candle draw time is derived from candle count, not fixed — a fixed duration made total replay length scale linearly with candle count (400 candles at 350ms each is over two minutes).
const TARGET_TOTAL_DURATION_MS = 5_000;
const MIN_BAR_DURATION_MS = 40;
const MAX_BAR_DURATION_MS = 150;

const pickBarDuration = (candleCount: number): number => {
  if (candleCount <= 0) {
    return MAX_BAR_DURATION_MS;
  }
  const perCandle = TARGET_TOTAL_DURATION_MS / candleCount;
  return Math.min(
    MAX_BAR_DURATION_MS,
    Math.max(MIN_BAR_DURATION_MS, perCandle),
  );
};

const formatUsd = (value: number, signed = false) => {
  const sign = signed && value > 0 ? "+" : "";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) {
    return `${sign}${value < 0 ? "-" : ""}$${(abs / 1_000_000).toFixed(2)}M`;
  }
  if (abs >= 1_000) {
    return `${sign}${value < 0 ? "-" : ""}$${(abs / 1_000).toFixed(2)}K`;
  }
  return `${sign}${value < 0 ? "-" : ""}$${abs.toFixed(2)}`;
};

// A memecoin's per-token price is often sub-cent — a fixed decimal count would just print "0.00" for all of them, so this shows ~3 significant digits instead, however many leading zeros that takes.
const formatAxisPrice = (value: number): string => {
  const abs = Math.abs(value);
  if (abs === 0) {
    return "0";
  }
  if (abs >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }
  if (abs >= 1_000) {
    return `${(value / 1_000).toFixed(2)}K`;
  }
  if (abs >= 1) {
    return value.toFixed(2);
  }
  const decimals = Math.min(10, Math.max(2, -Math.floor(Math.log10(abs)) + 2));
  return value.toFixed(decimals);
};

const pnlClassName = (value: number) => {
  if (value > 0) {
    return "positive";
  }
  if (value < 0) {
    return "negative";
  }
  return "";
};

const ellipsisText = (text: string, headLength = 6, tailLength = 4) =>
  text.length > headLength + tailLength + 3
    ? `${text.slice(0, headLength)}...${text.slice(-tailLength)}`
    : text;

// Fraction of the remaining gap closed per frame — not a fixed duration, since the target itself can move every 40-150ms during fast playback and a fixed-duration animation would just keep getting cut off mid-flight.
const NUMBER_CHASE_RATE = 0.1;
const NUMBER_SETTLE_EPSILON = 0.01;

const useAnimatedNumber = (target: number): number => {
  const [display, setDisplay] = useState(target);
  const displayRef = useRef(target);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const step = () => {
      if (cancelled) {
        return;
      }
      const current = displayRef.current;
      const gap = target - current;
      if (Math.abs(gap) < NUMBER_SETTLE_EPSILON) {
        if (current !== target) {
          displayRef.current = target;
          setDisplay(target);
        }
        return;
      }
      const next = current + gap * NUMBER_CHASE_RATE;
      displayRef.current = next;
      setDisplay(next);
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);

    return () => {
      cancelled = true;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [target]);

  return display;
};

const labelFormat = (intervalSeconds: number) => {
  if (intervalSeconds >= 86_400) {
    return "MMM D";
  }
  if (intervalSeconds >= 3_600) {
    return "MMM D HH:mm";
  }
  return "HH:mm:ss";
};

// Linear growth reads as mechanical; smoothstep eases in and out.
const easeSmoothstep = (progress: number) =>
  progress * progress * (3 - 2 * progress);

// Part-formed candle at the given progress — close walks from open toward the real close, high/low extend outward at the same rate, clamped to what close has "happened yet".
const formingCandleValues = (
  candle: ICandle,
  progress: number,
): [number, number, number, number] => {
  const eased = easeSmoothstep(progress);
  const close = candle.open + (candle.close - candle.open) * eased;
  const high = Math.max(
    candle.open,
    close,
    candle.open + (candle.high - candle.open) * eased,
  );
  const low = Math.min(
    candle.open,
    close,
    candle.open + (candle.low - candle.open) * eased,
  );
  return [candle.open, close, low, high];
};

const nearestBucketIndex = (candles: ICandle[], timestamp: number): number => {
  let index = 0;
  while (
    index < candles.length - 1 &&
    candles[index + 1].timestamp <= timestamp
  ) {
    index += 1;
  }
  return index;
};

const buildChartOption = (
  candles: ICandle[],
  at: number,
  progress: number,
  tradeDetails: ITradeDetail[],
  intervalSeconds: number,
  isLightMode: boolean,
) => {
  const textColor = isLightMode ? "rgb(56, 60, 64)" : "rgb(255, 255, 255)";
  const gridColor = isLightMode ? "#ebebeb" : "#252525";
  const axisColor = isLightMode ? "#ddd" : "#383838";
  const tooltipBg = isLightMode ? "#fff" : "#1c1c1c";
  const tooltipBorder = isLightMode ? "#e0e0e0" : "#383838";
  const format = labelFormat(intervalSeconds);

  const buyMarkers: { value: [number, number]; usd: number }[] = [];
  const sellMarkers: { value: [number, number]; usd: number }[] = [];
  for (const trade of tradeDetails) {
    const bucketIndex = nearestBucketIndex(candles, trade.timestamp);
    const amount = trade.isBuy ? trade.outputAmount : trade.inputAmount;
    const usd = (trade.isBuy ? trade.outputUsd : trade.inputUsd) || 0;
    const price = amount > 0 ? usd / amount : 0;
    if (trade.isBuy) {
      buyMarkers.push({ value: [bucketIndex, price], usd });
    } else {
      sellMarkers.push({ value: [bucketIndex, price], usd });
    }
  }

  // A category axis always stretches to fill the container regardless of how few candles exist — padding the axis with invisible trailing slots up to a minimum count keeps candle width/spacing consistent instead of a handful of candles being spread across the whole width. Real data always fills the leftmost slots; the padding trails off to the right.
  const paddedSlotCount = Math.max(candles.length, MIN_VISIBLE_SLOTS);
  const paddingCount = paddedSlotCount - candles.length;
  const lastTimestamp = candles[candles.length - 1]?.timestamp || 0;
  const paddedTimestamps = [
    ...candles.map((candle) => candle.timestamp),
    ...Array.from(
      { length: paddingCount },
      (_, index) => lastTimestamp + (index + 1) * intervalSeconds,
    ),
  ];

  // Fixed once from the padded slot count — never recomputed per frame, so bar width cannot drift as more of the chart is revealed.
  const barWidth = Math.max(2, Math.min(14, Math.floor(500 / paddedSlotCount)));

  // Fixed once from the full price range, not auto-scaled per frame, so the vertical scale never shifts as more of the chart is revealed either.
  const prices = candles.flatMap((candle) => [candle.low, candle.high]);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 1;
  const pricePad =
    (maxPrice - minPrice) * 0.08 || Math.abs(maxPrice) * 0.08 || 1;
  const yMin = minPrice - pricePad;
  const yMax = maxPrice + pricePad;
  // Placed below yMin so the axis clips it out — the category slot still exists (fixed position/width), it just draws nothing until its turn to form.
  const hiddenPrice = yMin - (yMax - yMin);

  return {
    backgroundColor: "transparent",
    animation: false,
    grid: { top: 20, right: 8, bottom: 35, left: 10, containLabel: true },
    xAxis: {
      type: "category",
      data: paddedTimestamps,
      axisLabel: {
        formatter: (value: string) =>
          dayjs(Number(value) * 1000).format(format),
        color: textColor,
        fontSize: 11,
      },
      axisLine: { lineStyle: { color: axisColor } },
      axisTick: { show: false },
      splitLine: { show: false },
    },
    yAxis: {
      type: "value",
      min: yMin,
      max: yMax,
      position: "right",
      axisLabel: {
        color: textColor,
        fontSize: 11,
        formatter: (value: number) => formatAxisPrice(value),
      },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: gridColor, width: 0.5 } },
    },
    tooltip: {
      trigger: "axis",
      backgroundColor: tooltipBg,
      borderColor: tooltipBorder,
      textStyle: { color: textColor, fontSize: 12 },
      formatter: (rawParams: any) => {
        const list = Array.isArray(rawParams) ? rawParams : [rawParams];
        const candleParam = list.find(
          (param: any) => param.seriesType === "candlestick",
        );
        if (!candleParam) {
          return "";
        }
        const [open, close, low, high] = candleParam.data as number[];
        const time = dayjs(Number(candleParam.name) * 1000).format(format);
        return [
          time,
          `Open ${formatAxisPrice(open)}`,
          `Close ${formatAxisPrice(close)}`,
          `Low ${formatAxisPrice(low)}`,
          `High ${formatAxisPrice(high)}`,
        ].join("<br/>");
      },
    },
    series: [
      {
        type: "candlestick",
        barWidth,
        data: [
          ...candles.map((candle, index) => {
            if (index < at) {
              return [candle.open, candle.close, candle.low, candle.high];
            }
            if (index === at) {
              return formingCandleValues(candle, progress);
            }
            return [hiddenPrice, hiddenPrice, hiddenPrice, hiddenPrice];
          }),
          ...Array.from({ length: paddingCount }, () => [
            hiddenPrice,
            hiddenPrice,
            hiddenPrice,
            hiddenPrice,
          ]),
        ],
        itemStyle: {
          color: "#3ba55d",
          color0: "#e5484d",
          borderColor: "#3ba55d",
          borderColor0: "#e5484d",
        },
      },
      {
        type: "scatter",
        name: "Buy",
        data: buyMarkers,
        symbol: "triangle",
        symbolSize: 10,
        itemStyle: { color: "#3ba55d" },
        label: {
          show: true,
          position: "top",
          distance: 8,
          color: "#3ba55d",
          fontWeight: 600,
          fontSize: 11,
          formatter: (params: any) => `BUY ${formatUsd(params.data.usd)}`,
        },
      },
      {
        type: "scatter",
        name: "Sell",
        data: sellMarkers,
        symbol: "triangle",
        symbolRotate: 180,
        symbolSize: 10,
        itemStyle: { color: "#e5484d" },
        label: {
          show: true,
          position: "bottom",
          distance: 8,
          color: "#e5484d",
          fontWeight: 600,
          fontSize: 11,
          formatter: (params: any) => `SELL ${formatUsd(params.data.usd)}`,
        },
      },
    ],
  };
};

const ModalWalletTradeReplay = (props: IProps) => {
  const {
    open,
    onClose,
    walletAddress,
    chain,
    tokenAddress,
    tokenSymbol,
    isLightMode,
    selectedTradeDetail,
  } = props;
  const { translate } = useTranslation();
  const { data, loading, getWalletTradeReplay, reset } =
    useGetWalletTradeReplay();

  const [at, setAt] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [viewMode, setViewMode] = useState<IViewMode>("all");
  const chartRef = useRef<ReactECharts | null>(null);

  // "This trade" isolates PnL to just the clicked row by overriding the DB fetch with that single trade
  const singleTradeDetail =
    viewMode === "single" ? selectedTradeDetail : undefined;

  useEffect(() => {
    if (!open) {
      return;
    }
    if (!walletAddress || !chain || !tokenAddress) {
      return;
    }
    getWalletTradeReplay({
      walletAddress,
      chain,
      tokenAddress,
      singleTradeDetail,
    });
  }, [open, walletAddress, chain, tokenAddress, singleTradeDetail]);

  useEffect(() => {
    if (!open) {
      reset();
      setAt(0);
      setPlaying(false);
    }
  }, [open]);

  useEffect(() => {
    if (!data) {
      return;
    }
    if (data.replay.length > 1) {
      setAt(0);
      setPlaying(true);
    } else {
      setAt(Math.max(data.replay.length - 1, 0));
      setPlaying(false);
    }
  }, [data]);

  const currentPoint: IReplayPoint | undefined = data?.replay[at];

  const stats = useMemo(() => {
    if (currentPoint) {
      return currentPoint;
    }
    if (!data) {
      return null;
    }
    return {
      timestamp: data.lastTimestamp,
      price: 0,
      quantity: data.quantity,
      total: data.total || 0,
      boughtUsd: data.boughtUsd,
      soldUsd: data.soldUsd,
      trades: data.trades,
    };
  }, [currentPoint, data]);

  const visibleTradeDetails = useMemo(() => {
    if (!data || !currentPoint) {
      return [];
    }
    return data.tradeDetails.filter(
      (trade) =>
        trade.timestamp <= currentPoint.timestamp + data.intervalSeconds,
    );
  }, [data, currentPoint]);

  const chartOption = useMemo(() => {
    if (!data) {
      return {};
    }
    return buildChartOption(
      data.candles,
      at,
      playing ? 0 : 1,
      visibleTradeDetails,
      data.intervalSeconds,
      isLightMode,
    );
  }, [data, at, playing, visibleTradeDetails, isLightMode]);

  useEffect(() => {
    if (!playing || !data || data.candles.length === 0) {
      return () => {};
    }

    const barCount = data.replay.length;
    const barDurationMs = pickBarDuration(data.candles.length);
    const started = performance.now();
    let raf = 0;

    const frame = (now: number) => {
      const progress = Math.min((now - started) / barDurationMs, 1);
      const instance = chartRef.current?.getEchartsInstance();
      if (instance) {
        instance.setOption(
          buildChartOption(
            data.candles,
            at,
            progress,
            visibleTradeDetails,
            data.intervalSeconds,
            isLightMode,
          ),
          { notMerge: false },
        );
      }

      if (progress >= 1) {
        const next = at + 1;
        // barCount, not barCount - 1: next === barCount - 1 is still a real,
        // final bar that must be drawn — only next === barCount is past the end.
        if (next >= barCount) {
          setPlaying(false);
        } else {
          setAt(next);
        }
        return;
      }
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [playing, at, data, visibleTradeDetails, isLightMode]);

  const onTogglePlay = () => {
    if (!data) {
      return;
    }
    if (at >= data.replay.length - 1) {
      setAt(0);
    }
    setPlaying(!playing);
  };

  const onScrub = (value: number) => {
    setPlaying(false);
    setAt(value);
  };

  const totalPnl = stats?.total;
  const animatedTotalPnl = useAnimatedNumber(totalPnl || 0);
  const animatedBoughtUsd = useAnimatedNumber(stats?.boughtUsd || 0);
  const animatedSoldUsd = useAnimatedNumber(stats?.soldUsd || 0);
  const animatedHoldingUsd = useAnimatedNumber(
    (stats?.quantity || 0) * (stats?.price || 0),
  );
  const animatedTrades = useAnimatedNumber(stats?.trades || 0);

  const [copiedField, setCopiedField] = useState<"wallet" | "token" | null>(
    null,
  );
  const onCopyValue = (value: string, field: "wallet" | "token") => {
    copy(value);
    message.success(translate("copied"));
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  return (
    <Modal
      open={open}
      title={translate("walletActivity.pnlReplay")}
      footer={null}
      width="110rem"
      onCancel={onClose}
      mask={{ closable: true }}
    >
      <Wrapper>
        <div className="replay-header">
          <div className="header-row">
            <div className="meta-group">
              <div className="meta-chip">
                <span className="meta-label">
                  {translate("walletActivity.wallet")}
                </span>

                <Tooltip title={walletAddress}>
                  <span
                    className="meta-value"
                    onClick={() => onCopyValue(walletAddress, "wallet")}
                  >
                    {ellipsisText(walletAddress)}
                    {copiedField === "wallet" ? (
                      <CheckIcon width={12} height={12} />
                    ) : (
                      <CopyIcon width={12} height={12} />
                    )}
                  </span>
                </Tooltip>
              </div>

              <div className="meta-chip">
                <span className="meta-label">
                  {translate("walletActivity.token")}
                </span>
                <Tooltip title={tokenAddress}>
                  <span
                    className="meta-value"
                    onClick={() => onCopyValue(tokenAddress, "token")}
                  >
                    {tokenSymbol || ellipsisText(tokenAddress)}
                    {copiedField === "token" ? (
                      <CheckIcon width={12} height={12} />
                    ) : (
                      <CopyIcon width={12} height={12} />
                    )}
                  </span>
                </Tooltip>
              </div>

              {selectedTradeDetail ? (
                <Segmented
                  className="view-mode-toggle"
                  value={viewMode}
                  onChange={(value) => setViewMode(value as IViewMode)}
                  options={[
                    {
                      label: translate("walletActivity.allTrades"),
                      value: "all",
                    },
                    {
                      label: translate("walletActivity.thisTrade"),
                      value: "single",
                    },
                  ]}
                />
              ) : null}
            </div>

            {totalPnl !== undefined ? (
              <div className="total-pnl">
                <div className="label">
                  {translate("walletActivity.totalPnl")}
                </div>
                <div className={`value ${pnlClassName(animatedTotalPnl)}`}>
                  {formatUsd(animatedTotalPnl, true)}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {loading ? (
          <div className="empty-state">
            <Spin />
          </div>
        ) : null}

        {!loading && data && data.tradeDetails.length < 1 ? (
          <div className="empty-state">
            <Empty description={translate("walletActivity.notEnoughHistory")} />
          </div>
        ) : null}

        {!loading && data && data.tradeDetails.length >= 1 ? (
          <Fragment>
            {data.candlesError ? (
              <div className="empty-state">
                <Empty
                  description={`${translate("walletActivity.chartUnavailable")}: ${data.candlesError}`}
                />
              </div>
            ) : (
              <div className="chart-container">
                <ReactECharts
                  ref={chartRef}
                  option={chartOption}
                  style={{ height: "100%", width: "100%" }}
                  notMerge={false}
                />
              </div>
            )}

            {data.replay.length > 1 ? (
              <div className="controls">
                <div className="play-toggle" onClick={onTogglePlay}>
                  {playing ? (
                    <StopIcon width={16} height={16} />
                  ) : (
                    <PlayIcon width={16} height={16} />
                  )}
                </div>

                <Slider
                  className="scrubber"
                  min={0}
                  max={Math.max(data.replay.length - 1, 0)}
                  value={at}
                  onChange={onScrub}
                  tooltip={{ formatter: null }}
                />
              </div>
            ) : null}

            {stats ? (
              <div className="stats-grid">
                <div className="stat">
                  <div className="label">
                    {translate("walletActivity.bought")}
                  </div>
                  <div className="value">{formatUsd(animatedBoughtUsd)}</div>
                </div>

                <div className="stat">
                  <div className="label">
                    {translate("walletActivity.sold")}
                  </div>
                  <div className="value">{formatUsd(animatedSoldUsd)}</div>
                </div>

                <div className="stat">
                  <div className="label">
                    {translate("walletActivity.holding")}
                  </div>
                  <div className="value">{formatUsd(animatedHoldingUsd)}</div>
                </div>

                <div className="stat">
                  <div className="label">
                    {translate("walletActivity.trades")}
                  </div>
                  <div className="value">{Math.round(animatedTrades)}</div>
                </div>
              </div>
            ) : null}

            {data.excludedActivityCount > 0 ? (
              <div className="caveat">
                {data.excludedActivityCount}{" "}
                {translate("walletActivity.excludedActivityNote")}
              </div>
            ) : null}
          </Fragment>
        ) : null}
      </Wrapper>
    </Modal>
  );
};

export default connect((state: RootState) => ({
  isLightMode: state?.Layout?.isLightMode,
}))(ModalWalletTradeReplay);
