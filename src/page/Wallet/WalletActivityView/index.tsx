import { Fragment, useEffect, useState } from "react";
import { Empty, Pagination, Select, Spin } from "antd";
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

const ellipsisHash = (hash: string) =>
  hash.length > 14 ? `${hash.slice(0, 6)}...${hash.slice(-4)}` : hash;

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
    <div
      className={sign === "-" ? "token-line negative" : "token-line positive"}
    >
      {sign}
      {amount} {label}
      {usdValue ? ` ($${usdValue.toFixed(2)})` : ""}
    </div>
  );
};

const WalletActivityRow = ({
  record,
  searchText,
}: {
  record: IWalletActivity;
  searchText: string;
}) => {
  const explorerUrl = getExplorerTxUrl(record.chain, record.txHash);

  return (
    <div className="activity-row">
      <div className="cell time-cell">
        <span className="time">{formatTimeToDate(record.createAt || 0)}</span>
        {record.txHash ? (
          explorerUrl ? (
            <span
              className="tx-hash link"
              onClick={() => sendOpenExternalLink(explorerUrl)}
            >
              {ellipsisHash(record.txHash)}
            </span>
          ) : (
            <span className="tx-hash">{ellipsisHash(record.txHash)}</span>
          )
        ) : null}
      </div>

      <div className="cell wallet-cell">
        <WalletAddress
          address={record.walletAddress || ""}
          searchText={searchText}
          hideQRCode
        />
      </div>

      <div className="cell action-cell">
        <span className="action-label">
          {ACTION_LABEL[record.actionType || ""] || record.actionType}
        </span>
        {record.protocol && (
          <span className="protocol-label">{capitalize(record.protocol)}</span>
        )}
      </div>

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
    </div>
  );
};

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

          {totalData > 0 && (
            <span style={{ marginLeft: "auto" }}>
              <TotalData text={`${translate("total")} ${totalData}`} />
            </span>
          )}
        </div>

        <Spin spinning={loading}>
          {listWalletActivity?.length ? (
            <div className="activity-list">
              {listWalletActivity?.map((record: IWalletActivity) => (
                <WalletActivityRow
                  key={record.id}
                  record={record}
                  searchText={searchText}
                />
              ))}
            </div>
          ) : (
            <div className="empty">
              <Empty description={translate("walletActivity.noActivity")} />
            </div>
          )}

          {totalData > pageSize && (
            <div className="pagination-wrap">
              <Pagination
                current={page}
                pageSize={pageSize}
                total={totalData}
                pageSizeOptions={TABLE_PAGE_OPTION}
                showSizeChanger
                onChange={onPageChange}
              />
            </div>
          )}
        </Spin>
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
