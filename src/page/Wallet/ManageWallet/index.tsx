import { useState, useEffect, useMemo } from "react";
import {
  Table,
  PaginationProps,
  Button,
  Select,
  Tooltip,
  Popconfirm,
  Segmented,
} from "antd";
import { connect } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import qs from "qs";
import { RootState } from "@/redux/store";
import {
  DownArrowIcon,
  UpArrowIcon,
  EditIcon,
  ExpandLineIcon,
  CollapseLineIcon,
} from "@/component/Icon";
import { SearchInput, PasswordInput } from "@/component/Input";
import { WalletAddress, SecretText, TotalData, ColorPicker } from "@/component";
import { actSaveSelectedWallet, actSetTableViewMode } from "@/redux/wallet";
import { actSetPageSize } from "@/redux/wallet";
import { DeleteButton, UploadButton } from "@/component/Button";
import { IWallet, IWalletGroup, ISorter } from "@/electron/type";
import ModalDeleteDependency from "@/component/ModalDeleteDependency";
import {
  useGetListWallet,
  useDeleteWallet,
  useGetListWalletGroup,
  useGetOneWalletGroup,
  useTranslation,
  useUpdateWallet,
  useGetWalletGroupDependency,
} from "@/hook";
import {
  formatTime,
  getPortfolioAppImg,
  getPortfolioAppUrl,
} from "@/service/util";
import { PORTFOLIO_APP_NAME, MESSAGE, SORT_ORDER } from "@/electron/constant";
import {
  actSaveSelectedWalletGroup,
  actSetModalDependencyOpen,
} from "@/redux/walletGroup";
import { EMPTY_STRING, TABLE_PAGE_OPTION } from "@/config/constant";
import ModalCreateWallet from "./ModalCreateWallet";
import ModalImportWallet from "./ModalImportWallet";
import ModalUpdateWallet from "./ModalUpdateWallet";
import {
  ManageWalletWrapper,
  ExpandIconWrapper,
  ExpandRowWrapper,
  PortfolioAppWrapper,
  OptionWrapper,
  IconWrapper,
} from "./style";
import ModalExportWallet from "./ModalExportWallet";
import { VIEW_MODE } from "../index";

const { Option } = Select;

const TABLE_VIEW_MODE = {
  EXPAND_ROW: "EXPAND_ROW",
  COLLAPSE_ROW: "COLLAPSE_ROW",
};

let searchTimeOut: any = null;
let searchWalletGroupTimeOut: any = null;

const renderColumns = (
  onEditWallet: (wallet: IWallet) => void,
  portfolioApp: string | null,
  onViewPortfolio: (walletAddress: string) => void,
  searchText: string,
  translate: any,
  onUpdateColor: (wallet: IWallet, color: string) => void,
) => [
  {
    title: translate("indexTable"),
    dataIndex: "index",
    width: "7%",
  },
  {
    title: "",
    dataIndex: "color",
    width: "5%",
    align: "center",
    render: (color: string, record: IWallet) => (
      <ColorPicker
        color={color}
        setColor={(color: string) => onUpdateColor(record, color)}
      />
    ),
    sorter: true,
  },
  {
    title: translate("address"),
    dataIndex: "address",
    width: "70%",
    render: (address: string) =>
      address ? (
        <WalletAddress address={address} searchText={searchText} />
      ) : (
        EMPTY_STRING
      ),
  },
  {
    title: translate("wallet.walletGroup"),
    dataIndex: "group",
    width: "25%",
    render: (value: any, record: IWallet) => record.group?.name,
  },
  {
    title: translate("portfolio"),
    dataIndex: "portfolioApp",
    width: "17%",
    align: "left",
    render: (value: any, record: IWallet) => {
      if (!portfolioApp || !record?.address) {
        return EMPTY_STRING;
      }

      return (
        <PortfolioAppWrapper
          onClick={() => {
            onViewPortfolio(record?.address!);
          }}
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
    title: "",
    width: "10%",
    render: (text: any, record: any) => (
      <div className="list-icon">
        <EditIcon onClick={() => onEditWallet(record)} />
      </div>
    ),
  },
];

const ManageWallet = (props: any) => {
  const { translate, locale } = useTranslation();
  const {
    totalData,
    listWallet,
    listWalletGroup,
    selectedWalletGroup,
    tableViewMode,
    pageSize = TABLE_PAGE_OPTION[0],
  } = props;

  const [isModalImportOpen, setModalImportOpen] = useState(false);
  const [isModalExportOpen, setModalExportOpen] = useState(false);
  const [isModalUpdateOpen, setModalUpdateOpen] = useState(false);
  const [isModalCreateOpen, setModalCreateOpen] = useState(false);
  const [page, onSetPage] = useState(1);
  const [sortField, onSetSorterTable] = useState<ISorter>({
    field: "",
    order: "",
  });
  const [selectedRowKeys, onSetSelectedRowKeys] = useState([]);
  const [searchText, onSetSearchText] = useState("");
  const [shouldRefetch, setShouldRefetch] = useState(false);
  const [isBtnLoading, setBtnLoading] = useState(false);
  const [encryptKey, setEncryptKey] = useState("");
  const [expandedRowKeys, setExpanedRowKeys] = useState<any[]>([]);
  const navigate = useNavigate();

  const location = useLocation();
  const { search } = location;
  const { group, mode } = qs.parse(search, { ignoreQueryPrefix: true });

  const { getListWallet, loading: getDataLoading } = useGetListWallet();
  const { getListWalletGroup } = useGetListWalletGroup();
  const {
    loading: deleteWalletLoading,
    isSuccess,
    deleteWallet,
    hasDependencyError,
    setHasDependencyError,
  } = useDeleteWallet();
  const { getWalletGroupDependency, loading: getDependencyLoading } =
    useGetWalletGroupDependency();
  const { getOneWalletGroup, loading: isSelectLoading } =
    useGetOneWalletGroup();
  const { updateWallet } = useUpdateWallet();

  useEffect(() => {
    if (
      hasDependencyError &&
      selectedRowKeys?.length > 0 &&
      selectedWalletGroup?.id
    ) {
      getWalletGroupDependency([selectedWalletGroup?.id]);
      props?.actSetModalDependencyOpen(true);
    }
  }, [hasDependencyError, selectedRowKeys, selectedWalletGroup]);

  useEffect(() => {
    getListWalletGroup({ page: 1, pageSize: 1000 });

    return () => {
      setHasDependencyError(false);
    };
  }, []);

  useEffect(() => {
    if (group && group !== "undefined") {
      getOneWalletGroup(Number(group));
    } else if (listWalletGroup?.length > 0) {
      onChangeWalletGroup(listWalletGroup[0]?.id);
    }
  }, [group, listWalletGroup]);

  useEffect(() => {
    if (getDataLoading && shouldRefetch) {
      setShouldRefetch(false);
    }
  }, [getDataLoading, shouldRefetch]);

  useEffect(() => {
    clearTimeout(searchTimeOut);
    searchTimeOut = setTimeout(() => {
      getListWallet({
        page,
        pageSize,
        searchText,
        groupId: selectedWalletGroup?.id,
        encryptKey,
        sortField,
      });
    }, 200);
  }, [page, pageSize, searchText, selectedWalletGroup, encryptKey, sortField]);

  useEffect(() => {
    if (shouldRefetch) {
      getListWallet({
        page,
        pageSize,
        searchText,
        groupId: selectedWalletGroup?.id,
        encryptKey,
        sortField,
      });
    }
  }, [
    page,
    pageSize,
    searchText,
    selectedWalletGroup,
    shouldRefetch,
    encryptKey,
    sortField,
  ]);

  // delete wallet
  const onDeleteWallet = () => {
    setBtnLoading(true);
    deleteWallet(selectedRowKeys);
  };

  useEffect(() => {
    if (!deleteWalletLoading && isSuccess && !hasDependencyError) {
      onSetSelectedRowKeys([]);
      setShouldRefetch(true);

      setTimeout(() => {
        setBtnLoading(false);
      }, 3000);
    }
  }, [deleteWalletLoading, isSuccess, hasDependencyError]);

  const onTableChange = (
    pagination?: PaginationProps,
    filter?: any,
    sorter?: any,
  ) => {
    pagination?.current !== page && onSetPage(pagination?.current!);
    pagination?.pageSize !== pageSize &&
      props.actSetPageSize(pagination?.pageSize!);
    onSetSorterTable({
      field: sorter?.field || "",
      order: sorter?.order === "descend" ? SORT_ORDER.DESC : SORT_ORDER.ASC,
    });
  };

  const onShowTotalData = () => {
    let text = `${translate("total")} ${totalData} ${translate("data")}`;
    if (selectedRowKeys?.length > 0) {
      text += `. ${selectedRowKeys?.length} ${translate("data")} ${translate(
        "selected",
      )}`;
    }

    return <TotalData text={text} />;
  };

  const onRowSelectionChange = (selectedKeys: any) => {
    onSetSelectedRowKeys(selectedKeys);
  };

  const onSearchWalletGroup = (text: string) => {
    if (searchWalletGroupTimeOut) {
      clearTimeout(searchWalletGroupTimeOut);
    }
    searchWalletGroupTimeOut = setTimeout(() => {
      getListWalletGroup({ page: 1, pageSize: 1000, searchText: text });
    }, 200);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onRowSelectionChange,
  };

  const expandedRowRender = (record: IWallet) => {
    return (
      <ExpandRowWrapper>
        <div className="info">
          <div className="item">
            <div className="label">{translate("wallet.phrase")}:</div>
            {record?.phrase ? (
              <SecretText
                text={record?.phrase}
                style={{ fontSize: "1.2rem" }}
              />
            ) : (
              EMPTY_STRING
            )}
          </div>

          <div className="item">
            <div className="label">{translate("wallet.privateKey")}:</div>
            {record?.privateKey ? (
              <SecretText
                text={record?.privateKey}
                style={{ fontSize: "1.2rem" }}
              />
            ) : (
              EMPTY_STRING
            )}
          </div>
        </div>

        <div className="date">
          <div className="item">
            <div className="label">{translate("createAt")}:</div>
            <div className="value">
              {formatTime(Number(record?.createAt), locale)}
            </div>
          </div>

          <div className="item">
            <div className="label">{translate("updateAt")}:</div>
            <div className="value">
              {formatTime(Number(record?.updateAt), locale)}
            </div>
          </div>
        </div>
      </ExpandRowWrapper>
    );
  };

  const handleExpand = (expanded: boolean, record: any) => {
    setExpanedRowKeys(
      expanded
        ? expandedRowKeys.filter((rowId: any) => rowId !== record?.id)
        : [...expandedRowKeys, record?.id],
    );
  };

  const renderExpandIcon = ({ expanded, record }: any) => {
    return expanded ? (
      <ExpandIconWrapper onClick={(_e: any) => handleExpand(expanded, record)}>
        <DownArrowIcon />
      </ExpandIconWrapper>
    ) : (
      <ExpandIconWrapper onClick={(_e: any) => handleExpand(expanded, record)}>
        <UpArrowIcon />
      </ExpandIconWrapper>
    );
  };

  const onOpenModalImport = () => {
    setModalImportOpen(true);
  };

  const onUpdateColor = async (wallet: IWallet, color: string) => {
    updateWallet({ ...wallet, color }, encryptKey);
  };

  const onEditWallet = (wallet: IWallet) => {
    props?.actSaveSelectedWallet(wallet);
    setModalUpdateOpen(true);
  };

  const onOpenModalExport = () => {
    setModalExportOpen(true);
  };

  const onChangeWalletGroup = (groupID: any) => {
    navigate(
      `/dashboard/wallet?group=${groupID}&mode=${mode || VIEW_MODE.WALLET}`,
    );
  };

  const onViewPortfolio = (walletAddress: string) => {
    const { portfolioApp } = selectedWalletGroup;
    const url = getPortfolioAppUrl(walletAddress, portfolioApp);

    window?.electron?.send(MESSAGE.OPEN_EXTERNAL_LINK, {
      url,
    });
  };

  const dataSource: any[] = useMemo(() => {
    return listWallet?.map((wallet: IWallet, index: number) => ({
      ...wallet,
      index: (page - 1) * pageSize + index + 1,
    }));
  }, [listWallet, page, pageSize]);

  const onChangeViewMode = (value: string | number) => {
    props?.actSetTableViewMode(value?.toString());
  };

  useEffect(() => {
    if (tableViewMode === TABLE_VIEW_MODE.COLLAPSE_ROW) {
      setExpanedRowKeys([]);
    } else if (tableViewMode === TABLE_VIEW_MODE.EXPAND_ROW) {
      setExpanedRowKeys(dataSource?.map((data: any) => data?.id!) || []);
    }
  }, [tableViewMode, dataSource]);

  return (
    <ManageWalletWrapper>
      <div className="heading">
        <SearchInput
          onChange={onSetSearchText}
          value={searchText}
          placeholder={translate("button.search")}
          style={{
            marginRight: "var(--margin-right)",
            width: "30rem",
          }}
        />

        <Select
          placeholder={translate("wallet.selectWalletGroup")}
          size="large"
          className="custom-select"
          style={{
            marginRight: "var(--margin-right)",
            width: "17rem",
          }}
          value={selectedWalletGroup?.id}
          onChange={onChangeWalletGroup}
          showSearch
          onSearch={onSearchWalletGroup}
          filterOption={false}
          loading={isSelectLoading}
          optionLabelProp="label"
        >
          {listWalletGroup?.map((group: IWalletGroup) => (
            <Option key={group?.id} value={group?.id} label={group?.name}>
              <OptionWrapper>
                <div className="name">{group?.name}</div>
                <div className="description">{group?.note || EMPTY_STRING}</div>
              </OptionWrapper>
            </Option>
          ))}
        </Select>

        <PasswordInput
          name="encryptKey"
          placeholder={translate("wallet.encryptKey")}
          width="15rem"
          onChange={setEncryptKey}
          extendClass="encryptKey-header"
        />

        <Segmented
          style={{ marginLeft: "var(--margin-right)" }}
          options={[
            {
              value: TABLE_VIEW_MODE.COLLAPSE_ROW,
              icon: (
                <IconWrapper>
                  <CollapseLineIcon />
                </IconWrapper>
              ),
            },
            {
              value: TABLE_VIEW_MODE.EXPAND_ROW,
              icon: (
                <IconWrapper>
                  <ExpandLineIcon />
                </IconWrapper>
              ),
            },
          ]}
          value={tableViewMode}
          onChange={onChangeViewMode}
          size="large"
        />

        <UploadButton
          text="Import"
          onClick={onOpenModalImport}
          isUploadButton={false}
          style={{ marginRight: "var(--margin-right)", marginLeft: "auto" }}
        />

        <UploadButton
          text="Export"
          onClick={onOpenModalExport}
          isUploadButton={true}
          style={{ marginRight: "var(--margin-right)" }}
        />

        <Button
          type="primary"
          style={{ marginRight: "var(--margin-right)" }}
          onClick={() => setModalCreateOpen(true)}
        >
          {translate("button.createNew")}
        </Button>

        <Popconfirm
          title={
            <span
              style={{
                width: "30rem",
                display: "block",
              }}
            >
              {translate("wallet.confirm.deleteWalletGroup")}
            </span>
          }
          onConfirm={onDeleteWallet}
          placement="left"
          disabled={selectedRowKeys?.length === 0}
        >
          <span>
            <DeleteButton
              text={translate("button.delete")}
              loading={isBtnLoading || getDependencyLoading}
            />
          </span>
        </Popconfirm>
      </div>

      <Table
        rowSelection={rowSelection}
        rowKey={(data) => data?.id!}
        dataSource={dataSource}
        // @ts-ignore
        columns={renderColumns(
          onEditWallet,
          selectedWalletGroup?.portfolioApp,
          onViewPortfolio,
          searchText,
          translate,
          onUpdateColor,
        )}
        pagination={{
          total: totalData,
          pageSize,
          pageSizeOptions: TABLE_PAGE_OPTION,
          current: page,
          showSizeChanger: true,
          size: "small",
          showTotal: onShowTotalData,
          locale: {
            items_per_page: `/ ${translate("page")}`,
          },
        }}
        expandable={{
          expandedRowRender,
          expandIcon: renderExpandIcon,
          expandedRowKeys,
        }}
        scroll={{ x: 700, y: "63vh" }}
        loading={getDataLoading}
        onChange={onTableChange}
        size="middle"
      />

      <ModalImportWallet
        isModalOpen={isModalImportOpen}
        setModalOpen={setModalImportOpen}
        setShouldRefetch={setShouldRefetch}
      />

      <ModalExportWallet
        isModalOpen={isModalExportOpen}
        setModalOpen={setModalExportOpen}
        listWalletId={selectedRowKeys}
      />

      <ModalCreateWallet
        isModalOpen={isModalCreateOpen}
        setModalOpen={setModalCreateOpen}
        setShouldRefetch={setShouldRefetch}
      />

      <ModalUpdateWallet
        isModalOpen={isModalUpdateOpen}
        setModalOpen={setModalUpdateOpen}
        encryptKey={encryptKey}
      />

      <ModalDeleteDependency />
    </ManageWalletWrapper>
  );
};

export default connect(
  (state: RootState) => ({
    listWallet: state?.Wallet?.listWallet,
    totalData: state?.Wallet?.totalData,
    tableViewMode: state?.Wallet?.tableViewMode,
    listWalletGroup: state?.WalletGroup?.listWalletGroup,
    selectedWalletGroup: state?.WalletGroup?.selectedWalletGroup,
    pageSize: state?.Wallet?.pageSize,
  }),
  {
    actSaveSelectedWallet,
    actSaveSelectedWalletGroup,
    actSetTableViewMode,
    actSetModalDependencyOpen,
    actSetPageSize,
  },
)(ManageWallet);
