import { useState, useEffect, ComponentType } from "react";
import { Table, PaginationProps, Button, Tooltip, Popconfirm } from "antd";
import HighlighterLib, { HighlighterProps } from "react-highlight-words";
import { connect } from "react-redux";
import { useNavigate } from "react-router-dom";
import { RootState } from "@/redux/store";
import { formatTime, trimText } from "@/service/util";
import { DeleteButton } from "@/component/Button";
import { SearchInput } from "@/component/Input";
import { EditIcon, EyeOpenIcon } from "@/component/Icon";
import { TotalData } from "@/component";
import {
  useGetListProxyIpGroup,
  useDeleteProxyIpGroup,
  useTranslation,
} from "@/hook";
import { actSaveSelectedProxyIpGroup } from "@/redux/proxyIpGroup";
import { actSetPageSize } from "@/redux/proxyIpGroup";
import { IProxyIpGroup } from "@/electron/type";
import { EMPTY_STRING, TABLE_PAGE_OPTION } from "@/config/constant";
import ModalProxyIpGroup from "./ModalProxyIpGroup";
import { PageWrapper, LinkHoverWrapper } from "./style";
import { VIEW_MODE } from "../../index";

const Highlighter = HighlighterLib as ComponentType<HighlighterProps>;

let searchTimeOut: any = null;

const renderColumns = (
  onEditProxyIpGroup: (group: IProxyIpGroup) => void,
  onViewGroup: (groupID: number) => void,
  searchText: string,
  translate: any,
) => [
  {
    title: translate("indexTable"),
    dataIndex: "index",
    width: "7%",
  },
  {
    title: translate("groupName"),
    dataIndex: "name",
    width: "50%",
    render: (value: string, record: IProxyIpGroup) => (
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
    title: translate("proxyIp.totalIp"),
    dataIndex: "totalProxyIp",
    width: "15%",
    render: (value: number) => value || 0,
  },
  {
    title: translate("updatedAt"),
    dataIndex: "updateAt",
    width: "15%",
    render: (value: number) => formatTime(Number(value)),
  },
  {
    title: "",
    render: (text: any, record: IProxyIpGroup) => (
      <div className="list-icon">
        <Tooltip title={translate("view")}>
          <div className="icon" onClick={() => onViewGroup(record?.id!)}>
            <EyeOpenIcon />
          </div>
        </Tooltip>

        <EditIcon onClick={() => onEditProxyIpGroup(record)} />
      </div>
    ),
  },
];

const ProxyIpGroup = (props: any) => {
  const { translate } = useTranslation();
  const {
    totalData,
    listProxyIpGroup,
    pageSize = TABLE_PAGE_OPTION[0],
  } = props;

  const [page, onSetPage] = useState(1);
  const [isBtnLoading, setBtnLoading] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [searchText, onSetSearchText] = useState("");
  const [selectedRowKeys, onSetSelectedRowKeys] = useState([]);
  const navigate = useNavigate();

  const { getListProxyIpGroup, loading: getDataLoading } =
    useGetListProxyIpGroup();
  const {
    isSuccess,
    loading: deleteLoading,
    deleteProxyIpGroup,
  } = useDeleteProxyIpGroup();

  useEffect(() => {
    props?.actSaveSelectedProxyIpGroup(null);
  }, []);

  useEffect(() => {
    clearTimeout(searchTimeOut);
    searchTimeOut = setTimeout(() => {
      getListProxyIpGroup({ page, pageSize, searchText });
    }, 200);
  }, [searchText, page, pageSize]);

  const onEditProxyIpGroup = (group: IProxyIpGroup) => {
    props?.actSaveSelectedProxyIpGroup(group);
    setModalOpen(true);
  };

  // delete group
  const onDeleteProxyIpGroup = () => {
    setBtnLoading(true);
    deleteProxyIpGroup(selectedRowKeys);
  };

  useEffect(() => {
    if (!deleteLoading && isSuccess) {
      onSetSelectedRowKeys([]);
      setTimeout(() => {
        setBtnLoading(false);
        getListProxyIpGroup({ page, pageSize, searchText });
      }, 1700);

      setTimeout(() => {
        setBtnLoading(false);
      }, 3000);
    }
  }, [deleteLoading, isSuccess, page, pageSize, searchText]);

  const onTableChange = (pagination?: PaginationProps) => {
    pagination?.current !== page && onSetPage(pagination?.current!);
    pagination?.pageSize !== pageSize &&
      props.actSetPageSize(pagination?.pageSize!);
  };

  const onRowSelectionChange = (selectedKeys: any) => {
    onSetSelectedRowKeys(selectedKeys);
  };

  const onOpenModalProxyIpGroup = () => {
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

  const rowSelection = {
    selectedRowKeys,
    onChange: onRowSelectionChange,
  };

  const onViewGroup = (groupID: number) => {
    navigate(`/dashboard/proxy?group=${groupID}&mode=${VIEW_MODE.LIST_IP}`);
  };

  const dataSource: any[] = listProxyIpGroup?.map(
    (group: IProxyIpGroup, index: number) => ({
      ...group,
      index: (page - 1) * pageSize + index + 1,
    }),
  );

  return (
    <PageWrapper>
      <div className="heading">
        <SearchInput
          onChange={onSetSearchText}
          value={searchText}
          placeholder={translate("button.search")}
          style={{ marginRight: "auto", width: "35rem" }}
        />

        <Button
          type="primary"
          style={{ marginRight: "var(--margin-right)" }}
          onClick={onOpenModalProxyIpGroup}
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
              {translate("confirmDelete")}
            </span>
          }
          onConfirm={onDeleteProxyIpGroup}
          placement="left"
          disabled={selectedRowKeys?.length === 0}
        >
          <span>
            <DeleteButton
              text={translate("button.delete")}
              loading={isBtnLoading}
            />
          </span>
        </Popconfirm>
      </div>

      <Table
        rowSelection={rowSelection}
        rowKey={(data) => data?.id!}
        dataSource={dataSource}
        columns={renderColumns(
          onEditProxyIpGroup,
          onViewGroup,
          searchText,
          translate,
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
        scroll={{ x: 900, y: "70vh" }}
        loading={getDataLoading}
        onChange={onTableChange}
        size="middle"
      />

      <ModalProxyIpGroup
        isModalOpen={isModalOpen}
        setModalOpen={setModalOpen}
      />
    </PageWrapper>
  );
};

export default connect(
  (state: RootState) => ({
    listProxyIpGroup: state?.ProxyIpGroup?.listProxyIpGroup,
    totalData: state?.ProxyIpGroup?.totalData,
    pageSize: state?.ProxyIpGroup?.pageSize,
  }),
  { actSaveSelectedProxyIpGroup, actSetPageSize },
)(ProxyIpGroup);
