import { Fragment, useEffect, useState } from "react";
import { Empty, Select, Table, Tooltip } from "antd";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { WalletAddress, TotalData } from "@/component";
import { SearchInput } from "@/component/Input";
import { IWalletActivity, IWalletGroup } from "@/electron/type";
import {
  WALLET_ACTIVITY_ACTION_TYPE,
  getExplorerTxUrl,
} from "@/electron/constant";
import { formatTimeToDate } from "@/service/util";
import { TABLE_PAGE_OPTION } from "@/config/constant";
import {
  useGetListWalletActivity,
  useGetListWalletGroup,
  useTranslation,
  sendOpenExternalLink,
} from "@/hook";
import { actSetPageSize } from "@/redux/walletActivity";
import { WalletActivityViewWrapper } from "./style";

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

const buildColumns = (searchText: string) => [
  {
    key: "time",
    width: 200,
    render: (_: any, record: IWalletActivity) => {
      const explorerUrl = getExplorerTxUrl(record.chain, record.txHash);

      return (
        <div className="cell time-cell">
          <span className="time">{formatTimeToDate(record.createAt || 0)}</span>
          {record.txHash ? (
            <Tooltip title={record.txHash}>
              {explorerUrl ? (
                <span
                  className="hash-text link"
                  onClick={() => sendOpenExternalLink(explorerUrl)}
                >
                  {ellipsisText(record.txHash)}
                </span>
              ) : (
                <span className="hash-text">{ellipsisText(record.txHash)}</span>
              )}
            </Tooltip>
          ) : null}
        </div>
      );
    },
  },
  {
    key: "action",
    width: 140,
    render: (_: any, record: IWalletActivity) => (
      <div className="cell action-cell">
        <span className="action-label">
          {ACTION_LABEL[record.actionType || ""] || record.actionType}
        </span>
        {record.protocol && (
          <span className="protocol-label">{capitalize(record.protocol)}</span>
        )}
      </div>
    ),
  },
  {
    key: "token",
    width: 260,
    render: (_: any, record: IWalletActivity) => (
      <div className="cell token-cell">
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
    width: 400,
    render: (_: any, record: IWalletActivity) => (
      <div className="cell wallet-cell">
        <WalletAddress
          address={record.walletAddress || ""}
          searchText={searchText}
          hideQRCode
        />
        {record.actionType === WALLET_ACTIVITY_ACTION_TYPE.TRANSFER &&
        record.receiverAddress ? (
          <Tooltip title={record.receiverAddress}>
            <span className="hash-text receiver">
              to {ellipsisText(record.receiverAddress)}
            </span>
          </Tooltip>
        ) : null}
      </div>
    ),
  },
  {
    key: "spacer",
  },
];

const WalletActivityView = (props: any) => {
  const {
    listWalletActivity,
    totalData,
    pageSize = TABLE_PAGE_OPTION[0],
    listWalletGroup,
  } = props;

  const { translate } = useTranslation();
  const [page, onSetPage] = useState(1);
  const [searchText, onSetSearchText] = useState("");
  const [walletGroupId, setWalletGroupId] = useState<number | undefined>(
    undefined,
  );

  const { getListWalletActivity, loading } = useGetListWalletActivity();
  const { getListWalletGroup } = useGetListWalletGroup();

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
    if (nextPage !== page) {
      onSetPage(nextPage);
    }
    if (nextPageSize !== pageSize) {
      props.actSetPageSize(nextPageSize);
    }
  };

  const onShowTotalData = () => {
    const text = `${translate("total")} ${totalData} ${translate("data")}`;
    return <TotalData text={text} />;
  };

  return (
    <Fragment>
      <WalletActivityViewWrapper>
        <div className="heading">
          <SearchInput
            onChange={onSetSearchText}
            value={searchText}
            placeholder={translate("walletActivity.searchPlaceholder")}
            style={{ width: "34rem" }}
          />

          <Select
            className="custom-select"
            size="large"
            style={{ width: "20rem" }}
            value={walletGroupId}
            onChange={setWalletGroupId}
            allowClear
            placeholder={translate("walletActivity.allWalletGroup")}
            options={listWalletGroup?.map((group: IWalletGroup) => ({
              label: group.name,
              value: group.id,
            }))}
          />
        </div>

        <Table
          className="activity-table"
          showHeader={false}
          rowKey={(record) => record.id!}
          dataSource={listWalletActivity}
          // @ts-ignore
          columns={buildColumns(searchText)}
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
        />
      </WalletActivityViewWrapper>
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
