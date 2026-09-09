import { Fragment, useEffect, useState } from "react";
import { Button, Empty, Select, Table, Tooltip } from "antd";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { WalletAddress, TotalData } from "@/component";
import { SearchInput } from "@/component/Input";
import { ITradeDetail, IWalletActivity, IWalletGroup } from "@/electron/type";
import {
  WALLET_ACTIVITY_ACTION_TYPE,
  CHAIN_TYPE,
  PORTFOLIO_APP_NAME,
  getExplorerTxUrl,
} from "@/electron/constant";
import {
  formatTime,
  getChainImg,
  getPortfolioAppImg,
  getPortfolioAppUrl,
  getProtocolImg,
} from "@/service/util";
import { EMPTY_STRING, TABLE_PAGE_OPTION } from "@/config/constant";
import {
  useGetListWalletActivity,
  useGetListWalletGroup,
  useTranslation,
  sendOpenExternalLink,
  useTableScrollHeight,
} from "@/hook";
import { actSetPageSize } from "@/redux/walletActivity";
import {
  WalletActivityViewWrapper,
  PortfolioAppWrapper,
  TableSectionWrapper,
} from "./style";
import ModalWalletTradeReplay from "./ModalWalletTradeReplay";

type ITradedToken = {
  walletAddress: string;
  chain: string;
  tokenAddress: string;
  tokenSymbol?: string;
  // The single trade the "Detail" button was clicked on — lets the modal isolate PnL for just this trade instead of the whole position
  selectedTradeDetail?: ITradeDetail;
};

let searchTimeOut: any = null;

const ACTION_LABEL: Partial<Record<string, string>> = {
  [WALLET_ACTIVITY_ACTION_TYPE.SWAP]: "Swap",
  [WALLET_ACTIVITY_ACTION_TYPE.TRANSFER]: "Send",
  [WALLET_ACTIVITY_ACTION_TYPE.ADD_LIQUIDITY]: "Add liquidity",
  [WALLET_ACTIVITY_ACTION_TYPE.REMOVE_LIQUIDITY]: "Remove liquidity",
};

const capitalize = (text: string) =>
  text ? text.charAt(0).toUpperCase() + text.slice(1) : text;

const ellipsisText = (text: string, headLength = 6, tailLength = 4) =>
  text.length > headLength + tailLength + 3
    ? `${text.slice(0, headLength)}...${text.slice(-tailLength)}`
    : text;

const chainKeyToChainType = (chain?: string): CHAIN_TYPE => {
  if (chain === "solana") {
    return CHAIN_TYPE.SOLANA;
  }
  if (chain === "sui") {
    return CHAIN_TYPE.SUI;
  }
  if (chain === "aptos") {
    return CHAIN_TYPE.APTOS;
  }
  return CHAIN_TYPE.EVM;
};

const renderTokenLine = (
  sign: "-" | "+",
  amount?: string,
  symbol?: string,
  address?: string,
  usdValue?: number,
) => {
  if (!amount) {
    return null;
  }
  const label = symbol || (address ? `${address.slice(0, 6)}...` : "");

  return (
    <div className="token-line">
      <span className={sign === "-" ? "amount negative" : "amount positive"}>
        {sign}
        {amount} {label}
      </span>
      {usdValue ? (
        <span className="usd-value">${usdValue.toFixed(2)}</span>
      ) : null}
    </div>
  );
};

const tradeDetailFromRecord = (
  record: IWalletActivity,
  tokenAddress: string,
): ITradeDetail | null => {
  const isBuy = record.token1Address === tokenAddress;
  const inputAmount = Math.abs(Number(record.token0Amount));
  const outputAmount = Math.abs(Number(record.token1Amount));
  const trackedAmount = isBuy ? outputAmount : inputAmount;
  const trackedUsd = isBuy ? record.token1UsdValue : record.token0UsdValue;
  if (
    !trackedAmount ||
    !Number.isFinite(trackedAmount) ||
    trackedUsd === undefined ||
    trackedUsd === null
  ) {
    return null;
  }
  return {
    timestamp: Math.floor((record.createAt || 0) / 1000),
    isBuy,
    inputAmount,
    inputUsd: record.token0UsdValue,
    inputSymbol: record.token0Symbol,
    outputAmount,
    outputUsd: record.token1UsdValue,
    outputSymbol: record.token1Symbol,
    txHash: record.txHash,
  };
};

// The token side a "Detail" button opens PnL for
const detailTargetOf = (record: IWalletActivity): ITradedToken | null => {
  if (record.actionType !== WALLET_ACTIVITY_ACTION_TYPE.SWAP) {
    return null;
  }
  if (!record.walletAddress || !record.chain) {
    return null;
  }

  const tokenAddress = record.token1Address || record.token0Address;
  const tokenSymbol = record.token1Address
    ? record.token1Symbol
    : record.token0Symbol;
  if (!tokenAddress) {
    return null;
  }
  const selectedTradeDetail = tradeDetailFromRecord(record, tokenAddress);
  if (!selectedTradeDetail) {
    return null;
  }
  return {
    walletAddress: record.walletAddress,
    chain: record.chain,
    tokenAddress,
    tokenSymbol,
    selectedTradeDetail,
  };
};

const buildColumns = (
  searchText: string,
  onOpenTrade: (token: ITradedToken) => void,
  translate: (key: string) => string,
  locale: string,
  mapWalletGroupIdToPortfolioApp: Record<number, string>,
  onViewPortfolio: (walletAddress: string, portfolioApp: string) => void,
) => [
  {
    key: "time",
    title: translate("walletActivity.time"),
    width: 200,
    render: (_: any, record: IWalletActivity) => {
      const explorerUrl = getExplorerTxUrl(record.chain, record.txHash);
      const chainImg = getChainImg(chainKeyToChainType(record.chain));

      return (
        <div className="time-cell">
          <span className="time">
            {formatTime(record.createAt || 0, locale)}
          </span>
          {record.txHash ? (
            <Tooltip title={record.txHash}>
              <span
                className={explorerUrl ? "hash-line link" : "hash-line"}
                onClick={
                  explorerUrl
                    ? () => sendOpenExternalLink(explorerUrl)
                    : undefined
                }
              >
                {chainImg ? (
                  <img className="chain-icon" src={chainImg} alt="" />
                ) : null}
                {ellipsisText(record.txHash)}
              </span>
            </Tooltip>
          ) : null}
        </div>
      );
    },
  },
  {
    key: "action",
    title: translate("walletActivity.action"),
    width: 120,
    render: (_: any, record: IWalletActivity) => {
      const protocolImg = getProtocolImg(record.protocol);

      return (
        <div className="action-cell">
          <span className="action-label">
            {ACTION_LABEL[record.actionType || ""] || record.actionType}
          </span>
          {record.protocol && (
            <span className="protocol-label">
              {protocolImg ? (
                <img className="protocol-icon" src={protocolImg} alt="" />
              ) : null}
              {capitalize(record.protocol)}
            </span>
          )}
        </div>
      );
    },
  },
  {
    key: "token",
    title: translate("walletActivity.token"),
    width: 250,
    render: (_: any, record: IWalletActivity) => (
      <div className="token-cell">
        {renderTokenLine(
          "-",
          record.token0Amount,
          record.token0Symbol,
          record.token0Address,
          record.token0UsdValue,
        )}
        {renderTokenLine(
          "+",
          record.token1Amount,
          record.token1Symbol,
          record.token1Address,
          record.token1UsdValue,
        )}
      </div>
    ),
  },
  {
    key: "wallet",
    title: translate("walletActivity.wallet"),
    width: 150,
    render: (_: any, record: IWalletActivity) => (
      <Fragment>
        <WalletAddress
          address={record.walletAddress || ""}
          searchText={searchText}
          hideQRCode
          trim
        />
        {record.actionType === WALLET_ACTIVITY_ACTION_TYPE.TRANSFER &&
        record.receiverAddress ? (
          <Tooltip title={record.receiverAddress}>
            <span className="hash-text receiver">
              to {ellipsisText(record.receiverAddress)}
            </span>
          </Tooltip>
        ) : null}
      </Fragment>
    ),
  },
  {
    key: "portfolio",
    title: translate("portfolio"),
    width: 110,
    render: (_: any, record: IWalletActivity) => {
      const portfolioApp =
        record.walletGroupId !== undefined
          ? mapWalletGroupIdToPortfolioApp[record.walletGroupId]
          : undefined;
      if (!portfolioApp || !record.walletAddress) {
        return EMPTY_STRING;
      }
      return (
        <PortfolioAppWrapper
          onClick={() => onViewPortfolio(record.walletAddress!, portfolioApp)}
        >
          <div className="icon">
            <img src={getPortfolioAppImg(portfolioApp)} alt="" />
          </div>
          <Tooltip title={translate("wallet.viewPortfolio")}>
            <span className="text">{PORTFOLIO_APP_NAME[portfolioApp]}</span>
          </Tooltip>
        </PortfolioAppWrapper>
      );
    },
  },
  {
    key: "detail",
    width: 100,
    align: "center",
    render: (_: any, record: IWalletActivity) => {
      const detailTarget = detailTargetOf(record);
      if (!detailTarget) {
        return null;
      }
      return (
        <Button size="small" onClick={() => onOpenTrade(detailTarget)}>
          {translate("walletActivity.detail")}
        </Button>
      );
    },
  },
];

const WalletActivityView = (props: any) => {
  const {
    listWalletActivity,
    totalData,
    pageSize = TABLE_PAGE_OPTION[0],
    listWalletGroup,
  } = props;

  const { translate, locale } = useTranslation();
  const [page, onSetPage] = useState(1);
  const [searchText, onSetSearchText] = useState("");
  const [walletGroupId, setWalletGroupId] = useState<number | undefined>(
    undefined,
  );
  const [selectedTradedToken, setSelectedTradedToken] =
    useState<ITradedToken | null>(null);

  const { getListWalletActivity, loading } = useGetListWalletActivity();
  const { getListWalletGroup } = useGetListWalletGroup();
  const { tableSectionRef, scrollHeight: tableScrollHeight } =
    useTableScrollHeight({ deps: [totalData] });

  useEffect(() => {
    getListWalletGroup({ page: 1, pageSize: 500 });
  }, []);

  const fetchData = () => {
    getListWalletActivity({
      page,
      pageSize,
      searchText,
      walletGroupId,
    });
  };

  useEffect(() => {
    clearTimeout(searchTimeOut);
    searchTimeOut = setTimeout(fetchData, 200);
    return () => clearTimeout(searchTimeOut);
  }, [searchText, page, pageSize, walletGroupId]);

  const onPageChange = (nextPage: number, nextPageSize: number) => {
    if (nextPageSize !== pageSize) {
      props.actSetPageSize(nextPageSize);
      onSetPage(1);
    } else if (nextPage !== page) {
      onSetPage(nextPage);
    }
  };

  const onChangeSearchText = (value: string) => {
    onSetPage(1);
    onSetSearchText(value);
  };

  const onChangeWalletGroupId = (value?: number) => {
    onSetPage(1);
    setWalletGroupId(value);
  };

  const onShowTotalData = () => {
    const text = `${translate("total")} ${totalData} ${translate("data")}`;
    return <TotalData text={text} />;
  };

  const onOpenTrade = (token: ITradedToken) => {
    setSelectedTradedToken(token);
  };

  const onCloseReplayModal = () => {
    setSelectedTradedToken(null);
  };

  const mapWalletGroupIdToPortfolioApp: Record<number, string> = {};
  for (const group of listWalletGroup || []) {
    if (group.id !== undefined && group.portfolioApp) {
      mapWalletGroupIdToPortfolioApp[group.id] = group.portfolioApp;
    }
  }

  const onViewPortfolio = (walletAddress: string, portfolioApp: string) => {
    const url = getPortfolioAppUrl(walletAddress, portfolioApp);
    sendOpenExternalLink(url);
  };

  return (
    <Fragment>
      <WalletActivityViewWrapper>
        <div className="heading">
          <SearchInput
            onChange={onChangeSearchText}
            value={searchText}
            placeholder={translate("walletActivity.searchPlaceholder")}
            style={{ width: "34rem" }}
          />

          <Select
            className="custom-select"
            size="large"
            style={{ width: "20rem" }}
            value={walletGroupId}
            onChange={onChangeWalletGroupId}
            allowClear
            placeholder={translate("walletActivity.allWalletGroup")}
            options={listWalletGroup?.map((group: IWalletGroup) => ({
              label: group.name,
              value: group.id,
            }))}
          />
        </div>

        <TableSectionWrapper ref={tableSectionRef}>
          <Table
            rowKey={(record) => record.id!}
            dataSource={listWalletActivity || []}
            // @ts-ignore
            columns={buildColumns(
              searchText,
              onOpenTrade,
              translate,
              locale,
              mapWalletGroupIdToPortfolioApp,
              onViewPortfolio,
            )}
            loading={loading}
            pagination={{
              total: totalData,
              pageSize,
              current: page,
              pageSizeOptions: TABLE_PAGE_OPTION,
              showSizeChanger: true,
              size: "small",
              showTotal: onShowTotalData,
              locale: { items_per_page: `/ ${translate("page")}` },
            }}
            onChange={(pagination) =>
              onPageChange(
                pagination.current || 1,
                pagination.pageSize || pageSize,
              )
            }
            locale={{
              emptyText: (
                <div className="empty">
                  <Empty description={translate("walletActivity.noActivity")} />
                </div>
              ),
            }}
            scroll={{ y: tableScrollHeight }}
            size="middle"
          />
        </TableSectionWrapper>
      </WalletActivityViewWrapper>

      {selectedTradedToken ? (
        <ModalWalletTradeReplay
          open={Boolean(selectedTradedToken)}
          onClose={onCloseReplayModal}
          walletAddress={selectedTradedToken.walletAddress}
          chain={selectedTradedToken.chain}
          tokenAddress={selectedTradedToken.tokenAddress}
          tokenSymbol={selectedTradedToken.tokenSymbol}
          selectedTradeDetail={selectedTradedToken.selectedTradeDetail}
        />
      ) : null}
    </Fragment>
  );
};

export default connect(
  (state: RootState) => ({
    listWalletActivity: state?.WalletActivity?.listWalletActivity,
    totalData: state?.WalletActivity?.totalData,
    pageSize: state?.WalletActivity?.pageSize,
    listWalletGroup: state?.WalletGroup?.listWalletGroup,
  }),
  { actSetPageSize },
)(WalletActivityView);
