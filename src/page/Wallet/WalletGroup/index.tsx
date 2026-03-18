import { useState, useEffect, useMemo, ComponentType } from "react";
import {
  Table,
  PaginationProps,
  Button,
  Tooltip,
  Popconfirm,
  Select,
  Dropdown,
} from "antd";
import HighlighterLib, { HighlighterProps } from "react-highlight-words";
import { connect } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { RootState } from "@/redux/store";
import { formatTime, getPortfolioAppImg, trimText } from "@/service/util";
import { DeleteButton } from "@/component/Button";
import { SearchInput } from "@/component/Input";
import {
  EditIcon,
  DownArrowIcon,
  UpArrowIcon,
  EyeOpenIcon,
} from "@/component/Icon";
import { TotalData } from "@/component";
import {
  useGetListWalletGroup,
  useDeleteWalletGroup,
  useTranslation,
  useGetWalletGroupDependency,
} from "@/hook";
import {
  actSaveSelectedWalletGroup,
  actSetModalDependencyOpen,
  actSetSortField,
  actSetPageSize,
} from "@/redux/walletGroup";
import ModalDeleteDependency from "@/component/ModalDeleteDependency";
import { actSaveGetListWallet } from "@/redux/wallet";
import { IProfileGroup, ISorter, IWalletGroup } from "@/electron/type";
import { PORTFOLIO_APP_NAME, SORT_ORDER } from "@/electron/constant";
import { EMPTY_STRING, TABLE_PAGE_OPTION } from "@/config/constant";
import { VIEW_MODE as PROFILE_VIEW_MODE } from "@/page/Profile";
import ModalWalletGroup from "./ModalWalletGroup";
import {
  WalletGroupWrapper,
  PortfolioAppWrapper,
  ExpandIconWrapper,
  ExpandRowWrapper,
  LinkHoverWrapper,
  OptionWrapper,
} from "./style";
import { VIEW_MODE } from "../index";

const Highlighter = HighlighterLib as ComponentType<HighlighterProps>;

let searchTimeOut: any = null;

const renderColumns = (
  onEditWalletGroup: (group: IWalletGroup) => void,
  onViewGroup: (groupID: number) => void,
  searchText: string,
  translate: any,
  locale: string,
) => [
  {
    title: translate("indexTable"),
    dataIndex: "index",
    width: "5%",
  },
  {
    title: translate("walletGroup.name"),
    dataIndex: "name",
    width: "40%",
    render: (value: string, record: IWalletGroup) => (
      <LinkHoverWrapper onClick={() => onViewGroup(record?.id!)}>
        <div className="name">
          <Highlighter
            textToHighlight={record?.name || EMPTY_STRING}
            searchWords={[searchText]}
            highlightClassName="highlight"
          />
        </div>

        <div className="note">
          <Highlighter
            textToHighlight={trimText(record?.note || "", 80)}
            searchWords={[searchText]}
            highlightClassName="highlight"
          />
        </div>
      </LinkHoverWrapper>
    ),
  },
  {
    title: translate("wallet.allNumberWallets"),
    dataIndex: "totalWallet",
    width: "13%",
    render: (value: number) => value || 0,
  },
  {
    title: translate("wallet.portfolio"),
    dataIndex: "portfolioApp",
    width: "13%",
    render: (portfolioApp: string | null) => {
      return portfolioApp ? (
        <PortfolioAppWrapper>
          <div className="icon">
            <img src={getPortfolioAppImg(portfolioApp)} alt="" />
          </div>
          <span className="text">{PORTFOLIO_APP_NAME[portfolioApp]}</span>
        </PortfolioAppWrapper>
      ) : (
        EMPTY_STRING
      );
    },
  },
  {
    title: translate("usedBy"),
    dataIndex: "totalUsed",
    width: "13%",
    render: (value: any, record: IWalletGroup) => {
      const listProfileGroup = record?.listProfileGroup || [];
      const element = (
        <span>
          <span style={{ color: "var(--color-primary)", fontWeight: 600 }}>
            {listProfileGroup?.length}
          </span>{" "}
          <span style={{ fontSize: "1.2rem", marginLeft: "0.5rem" }}>
            {translate("profile.profileGroup")}
          </span>
        </span>
      );
      if (listProfileGroup?.length === 0) {
        return element;
      }

      const items = listProfileGroup?.map(
        (profileGroup: IProfileGroup, index: number) => ({
          key: index,
          label: (
            <OptionWrapper>
              <Link
                to={`/dashboard/profile?group=${profileGroup?.id}&mode=${PROFILE_VIEW_MODE.PROFILE}`}
              >
                <div className="name">
                  {index + 1}. {profileGroup?.name}
                </div>
                <div className="description">
                  {formatTime(Number(profileGroup?.createAt), locale)}
                </div>
              </Link>
            </OptionWrapper>
          ),
        }),
      );

      return (
        <span>
          <Dropdown menu={{ items }} placement="bottomLeft">
            {element}
          </Dropdown>
        </span>
      );
    },
  },
  {
    title: "",
    render: (text: any, record: IWalletGroup) => (
      <div className="list-icon">
        <Tooltip title={translate("view")}>
          <div className="icon" onClick={() => onViewGroup(record?.id!)}>
            <EyeOpenIcon />
          </div>
        </Tooltip>

        <EditIcon onClick={() => onEditWalletGroup(record)} />
      </div>
    ),
  },
];

const WalletGroup = (props: any) => {
  const { translate, locale } = useTranslation();
  const {
    totalData,
    listWalletGroup,
    sortField,
    pageSize = TABLE_PAGE_OPTION[0],
  } = props;

  const [page, onSetPage] = useState(1);
  const [isBtnLoading, setBtnLoading] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [searchText, onSetSearchText] = useState("");
  const [selectedRowKeys, onSetSelectedRowKeys] = useState<number[]>([]);
  const navigate = useNavigate();

  const listSortField = useMemo(
    () => [
      {
        label: translate("walletGroup.name"),
        value: "name",
      },
      {
        label: translate("createdAt"),
        value: "createAt",
      },
      {
        label: translate("updatedAt"),
        value: "updateAt",
      },
    ],
    [translate],
  );

  const listSortOrder = useMemo(
    () => [
      {
        label: translate("ascending"),
        value: SORT_ORDER.ASC,
      },
      {
        label: translate("descending"),
        value: SORT_ORDER.DESC,
      },
    ],
    [translate],
  );

  const { getListWalletGroup, loading: getDataLoading } =
    useGetListWalletGroup();
  const {
    isSuccess,
    loading,
    deleteWalletGroup,
    hasDependencyError,
    setHasDependencyError,
  } = useDeleteWalletGroup();
  const { getWalletGroupDependency, loading: getDependencyLoading } =
    useGetWalletGroupDependency();

  useEffect(() => {
    if (hasDependencyError && selectedRowKeys?.length > 0) {
      getWalletGroupDependency(selectedRowKeys);
      props?.actSetModalDependencyOpen(true);
    }
  }, [hasDependencyError, selectedRowKeys]);

  useEffect(() => {
    props?.actSaveSelectedWalletGroup(null);

    // reset data
    props?.actSaveGetListWallet({
      data: [],
      page: 1,
      pageSize: 1000,
      totalData: 0,
    });

    return () => {
      setHasDependencyError(false);
    };
  }, []);

  useEffect(() => {
    clearTimeout(searchTimeOut);
    searchTimeOut = setTimeout(() => {
      getListWalletGroup({ page, pageSize, searchText, sortField });
    }, 200);
  }, [searchText, page, pageSize, sortField]);

  const onEditWalletGroup = (group: IWalletGroup) => {
    props?.actSaveSelectedWalletGroup(group);
    setModalOpen(true);
  };

  // delete group
  const onDeleteWalletGroup = () => {
    if (selectedRowKeys.length > 0) {
      deleteWalletGroup(selectedRowKeys);
    }
  };

  useEffect(() => {
    if (!loading && isSuccess && !hasDependencyError) {
      setBtnLoading(true);
      onSetSelectedRowKeys([]);
      setTimeout(() => {
        setBtnLoading(false);
        getListWalletGroup({ page, pageSize, searchText, sortField });
      }, 1700);
    }
  }, [
    loading,
    isSuccess,
    page,
    pageSize,
    searchText,
    hasDependencyError,
    sortField,
  ]);

  const onTableChange = (pagination?: PaginationProps) => {
    pagination?.current !== page && onSetPage(pagination?.current!);
    pagination?.pageSize !== pageSize &&
      props.actSetPageSize(pagination?.pageSize!);
  };

  const onRowSelectionChange = (selectedKeys: any) => {
    onSetSelectedRowKeys(selectedKeys);
  };

  const onOpenModalWalletGroup = () => {
    setModalOpen(true);
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

  const expandedRowRender = (record: IWalletGroup) => {
    return (
      <ExpandRowWrapper>
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

  const renderExpandIcon = ({ expanded, onExpand, record }: any) => {
    return expanded ? (
      <ExpandIconWrapper onClick={(e: any) => onExpand(record, e)}>
        <DownArrowIcon />
      </ExpandIconWrapper>
    ) : (
      <ExpandIconWrapper onClick={(e: any) => onExpand(record, e)}>
        <UpArrowIcon />
      </ExpandIconWrapper>
    );
  };

  const onViewGroup = (groupID: number) => {
    navigate(`/dashboard/wallet?group=${groupID}&mode=${VIEW_MODE.WALLET}`);
  };

  const onChangeSortField = (value: string) => {
    props?.actSetSortField({ field: value } as ISorter);
  };

  const onChangeSortOrder = (value: string) => {
    props?.actSetSortField({ order: value } as ISorter);
  };

  const dataSource: any[] = listWalletGroup?.map(
    (group: IWalletGroup, index: number) => ({
      ...group,
      index: (page - 1) * pageSize + index + 1,
    }),
  );

  return (
    <WalletGroupWrapper>
      <div className="heading">
        <SearchInput
          onChange={onSetSearchText}
          value={searchText}
          placeholder={translate("button.search")}
          style={{ width: "30rem" }}
        />

        <Select
          className="custom-select"
          placeholder={translate("sortBy")}
          allowClear
          size="large"
          options={listSortField}
          style={{ marginLeft: "var(--margin-left)", width: "15rem" }}
          value={sortField?.field || null}
          onChange={onChangeSortField}
          loading={getDataLoading}
        />

        <Select
          className="custom-select"
          placeholder={translate("sortOrder")}
          allowClear
          size="large"
          options={listSortOrder}
          style={{
            marginLeft: "var(--margin-left)",
            width: "15rem",
            marginRight: "auto",
          }}
          value={sortField?.order || null}
          onChange={onChangeSortOrder}
          loading={getDataLoading}
        />

        <Button
          type="primary"
          style={{ marginRight: "var(--margin-right)" }}
          onClick={onOpenModalWalletGroup}
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
              {translate("wallet.confirm.deleteWalletGroup.toWallet")}
            </span>
          }
          onConfirm={onDeleteWalletGroup}
          placement="left"
          disabled={selectedRowKeys?.length === 0}
        >
          <span>
            <DeleteButton
              text={translate("button.delete")}
              loading={isBtnLoading || getDependencyLoading}
              disabled={selectedRowKeys?.length === 0}
            />
          </span>
        </Popconfirm>
      </div>

      <Table
        rowSelection={{
          selectedRowKeys,
          onChange: onRowSelectionChange,
        }}
        rowKey={(data) => data?.id!}
        dataSource={dataSource}
        columns={renderColumns(
          onEditWalletGroup,
          onViewGroup,
          searchText,
          translate,
          locale,
        )}
        pagination={{
          total: totalData,
          pageSize,
          pageSizeOptions: TABLE_PAGE_OPTION,
          current: page,
          showSizeChanger: true,
          size: "small",
          showTotal: onShowTotalData,
          locale: { items_per_page: `/ ${translate("page")}` },
        }}
        expandable={{
          expandedRowRender,
          expandIcon: renderExpandIcon,
        }}
        scroll={{ x: 900, y: "70vh" }}
        loading={getDataLoading}
        onChange={onTableChange}
        size="middle"
      />

      <ModalDeleteDependency />
      <ModalWalletGroup isModalOpen={isModalOpen} setModalOpen={setModalOpen} />
    </WalletGroupWrapper>
  );
};

export default connect(
  (state: RootState) => ({
    listWalletGroup: state?.WalletGroup?.listWalletGroup,
    totalData: state?.WalletGroup?.totalData,
    sortField: state?.WalletGroup?.sortField,
    pageSize: state?.WalletGroup?.pageSize,
  }),
  {
    actSaveSelectedWalletGroup,
    actSaveGetListWallet,
    actSetModalDependencyOpen,
    actSetSortField,
    actSetPageSize,
  },
)(WalletGroup);
