import _ from "lodash";
import { useState, useEffect, ComponentType } from "react";
import { Table, PaginationProps, Button, Tooltip, Popconfirm } from "antd";
import HighlighterLib, { HighlighterProps } from "react-highlight-words";
import { connect } from "react-redux";
import { useNavigate } from "react-router-dom";
import { RootState } from "@/redux/store";
import {
  formatTime,
  getChainImg,
  IChainConfig,
  trimText,
} from "@/service/util";
import { DeleteButton } from "@/component/Button";
import { SearchInput } from "@/component/Input";
import { EditIcon, EyeOpenIcon } from "@/component/Icon";
import { TotalData } from "@/component";
import {
  useGetListNodeEndpointGroup,
  useDeleteNodeEndpointGroup,
  useTranslation,
} from "@/hook";
import { actSaveSelectedNodeEndpointGroup } from "@/redux/nodeEndpointGroup";
import { actSetPageSize } from "@/redux/nodeEndpointGroup";
import { INodeEndpointGroup } from "@/electron/type";
import { CHAIN_TYPE } from "@/electron/constant";
import { EMPTY_STRING } from "@/config/constant";
import { getChainConfig } from "@/service/util";
import ModalNodeEndpointGroup from "./ModalNodeEndpointGroup";
import { PageWrapper, LinkHoverWrapper, ChainWrapper } from "./style";

const Highlighter = HighlighterLib as ComponentType<HighlighterProps>;

let searchTimeOut: any = null;

const renderColumns = (
  onEditNodeEndpointGroup: (group: INodeEndpointGroup) => void,
  onViewGroup: (groupID: number) => void,
  searchText: string,
  translate: any,
  locale: string,
) => [
  {
    title: translate("indexTable"),
    dataIndex: "index",
    width: "7%",
  },
  {
    title: translate("groupName"),
    dataIndex: "name",
    width: "40%",
    render: (value: string, record: INodeEndpointGroup) => (
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
            textToHighlight={trimText(record?.note || "", 55)}
            searchWords={[searchText]}
            highlightClassName="highlight"
          />
        </div>
      </LinkHoverWrapper>
    ),
  },
  {
    title: translate("wallet.blockchainType"),
    dataIndex: "chainType",
    width: "20%",
    render: (chainType: string) => {
      chainType = chainType || CHAIN_TYPE.EVM;

      return (
        <ChainWrapper>
          <div className="icon">
            <img src={getChainImg(chainType)} alt="" />
          </div>
          <span className="text">
            {(
              _.find(getChainConfig(locale), { key: chainType }) as IChainConfig
            )?.name || EMPTY_STRING}
          </span>
        </ChainWrapper>
      );
    },
  },
  {
    title: translate("nodeProvider.totalNode"),
    dataIndex: "totalNodeEndpoint",
    width: "13%",
    render: (value: number) => value || 0,
  },
  {
    title: translate("updatedAt"),
    dataIndex: "updateAt",
    width: "18%",
    render: (value: number) => formatTime(Number(value)),
  },
  {
    title: "",
    width: "10%",
    render: (text: any, record: INodeEndpointGroup) => (
      <div className="list-icon">
        <Tooltip title={translate("view")}>
          <div className="icon" onClick={() => onViewGroup(record?.id!)}>
            <EyeOpenIcon />
          </div>
        </Tooltip>

        <EditIcon onClick={() => onEditNodeEndpointGroup(record)} />
      </div>
    ),
  },
];

const NodeProviderGroup = (props: any) => {
  const { translate, locale } = useTranslation();
  const { totalData, listNodeEndpointGroup, pageSize = 30 } = props;

  const [page, onSetPage] = useState(1);
  const [isBtnLoading, setBtnLoading] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [searchText, onSetSearchText] = useState("");
  const [selectedRowKeys, onSetSelectedRowKeys] = useState([]);
  const navigate = useNavigate();

  const { getListNodeEndpointGroup, loading: getDataLoading } =
    useGetListNodeEndpointGroup();
  const {
    isSuccess,
    loading: isDeleteLoading,
    deleteNodeEndpointGroup,
  } = useDeleteNodeEndpointGroup();

  useEffect(() => {
    props?.actSaveSelectedNodeEndpointGroup(null);
  }, []);

  useEffect(() => {
    clearTimeout(searchTimeOut);
    searchTimeOut = setTimeout(() => {
      getListNodeEndpointGroup({ page, pageSize, searchText });
    }, 200);
  }, [searchText, page, pageSize]);

  const onEditNodeEndpointGroup = (group: INodeEndpointGroup) => {
    props?.actSaveSelectedNodeEndpointGroup(group);
    setModalOpen(true);
  };

  // delete group
  const onDeleteNodeEndpointGroup = () => {
    setBtnLoading(true);
    deleteNodeEndpointGroup(selectedRowKeys);
  };

  useEffect(() => {
    if (!isDeleteLoading && isSuccess) {
      onSetSelectedRowKeys([]);
      setTimeout(() => {
        setBtnLoading(false);
        getListNodeEndpointGroup({ page, pageSize, searchText });
      }, 1700);

      setTimeout(() => {
        setBtnLoading(false);
      }, 3000);
    }
  }, [isDeleteLoading, isSuccess, page, pageSize, searchText]);

  const onTableChange = (pagination?: PaginationProps) => {
    pagination?.current !== page && onSetPage(pagination?.current!);
    pagination?.pageSize !== pageSize &&
      props.actSetPageSize(pagination?.pageSize!);
  };

  const onRowSelectionChange = (selectedKeys: any) => {
    onSetSelectedRowKeys(selectedKeys);
  };

  const onOpenModalNodeEndpointGroup = () => {
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
    navigate(`/dashboard/node-provider?group=${groupID}`);
  };

  const dataSource: any[] = listNodeEndpointGroup?.map(
    (group: INodeEndpointGroup, index: number) => ({
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
          onClick={onOpenModalNodeEndpointGroup}
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
          onConfirm={onDeleteNodeEndpointGroup}
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
          onEditNodeEndpointGroup,
          onViewGroup,
          searchText,
          translate,
          locale,
        )}
        pagination={{
          total: totalData,
          pageSize,
          pageSizeOptions: ["30", "50", "70"],
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

      <ModalNodeEndpointGroup
        isModalOpen={isModalOpen}
        setModalOpen={setModalOpen}
      />
    </PageWrapper>
  );
};

export default connect(
  (state: RootState) => ({
    listNodeEndpointGroup: state?.NodeEndpointGroup?.listNodeEndpointGroup,
    totalData: state?.NodeEndpointGroup?.totalData,
    pageSize: state?.NodeEndpointGroup?.pageSize,
  }),
  { actSaveSelectedNodeEndpointGroup, actSetPageSize },
)(NodeProviderGroup);
