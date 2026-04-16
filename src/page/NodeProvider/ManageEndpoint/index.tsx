import { useState, useEffect, useRef, ComponentType } from "react";
import { Table, PaginationProps, Button, Select, Popconfirm } from "antd";
import HighlighterLib, { HighlighterProps } from "react-highlight-words";
import { connect } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import qs from "qs";
import { RootState } from "@/redux/store";
import { formatTime } from "@/service/util";
import { DeleteButton } from "@/component/Button";
import { SearchInput } from "@/component/Input";
import { EditIcon, BackIcon } from "@/component/Icon";
import { TotalData, Status, DataUpdateAt } from "@/component";
import {
  useGetListNodeEndpoint,
  useDeleteNodeEndpoint,
  useTranslation,
  useGetListNodeEndpointGroup,
  useGetOneNodeEndpointGroup,
} from "@/hook";
import {
  actSaveSelectedNodeEndpoint,
  actSetPageSize,
} from "@/redux/nodeEndpoint";
import { INodeEndpoint, INodeEndpointGroup } from "@/electron/type";
import { EMPTY_STRING, TABLE_PAGE_OPTION } from "@/config/constant";
import ModalEndpoint from "./ModalEndpoint";
import { PageWrapper, OptionWrapper } from "./style";

const Highlighter = HighlighterLib as ComponentType<HighlighterProps>;

const { Option } = Select;
let searchNodeEndpointGroupTimeOut: any = null;
let searchTimeOut: any = null;
const renderColumns = (
  onEditNodeEndpoint: (group: INodeEndpoint) => void,
  searchText: string,
  translate: any,
) => [
  {
    title: translate("indexTable"),
    dataIndex: "index",
    width: "5%",
  },
  {
    title: "Endpoint",
    dataIndex: "endpoint",
    width: "50%",
    render: (value: string) => (
      <Highlighter
        textToHighlight={value}
        searchWords={[searchText]}
        highlightClassName="highlight"
      />
    ),
  },
  {
    title: translate("status"),
    dataIndex: "isActive",
    width: "15%",
    render: (isActive: boolean) => (
      <div style={{ display: "flex", justifyContent: "flex-start" }}>
        <Status
          content={isActive ? translate("active") : translate("inActive")}
          isSuccess={isActive}
        />
      </div>
    ),
  },
  {
    title: translate("updatedAt"),
    dataIndex: "updateAt",
    width: "20%",
    render: (value: number) => formatTime(Number(value)),
  },
  {
    title: "",
    width: "10%",
    render: (text: any, record: INodeEndpoint) => (
      <div className="list-icon">
        <EditIcon onClick={() => onEditNodeEndpoint(record)} />
      </div>
    ),
  },
];

const NodeEndpoint = (props: any) => {
  const { translate } = useTranslation();
  const {
    totalData,
    listNodeEndpoint,
    listNodeEndpointGroup,
    selectedNodeEndpointGroup,
    pageSize = TABLE_PAGE_OPTION[0],
  } = props;

  const [page, onSetPage] = useState(1);
  const [isBtnLoading, setBtnLoading] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const [searchText, onSetSearchText] = useState("");
  const [selectedRowKeys, onSetSelectedRowKeys] = useState([]);
  const [shouldRefetch, setShouldRefetch] = useState(false);
  const navigate = useNavigate();
  const intervalRef = useRef<any>(null);

  const location = useLocation();
  const { search } = location;
  const { group } = qs.parse(search, { ignoreQueryPrefix: true });

  const {
    getListNodeEndpoint,
    loading: getDataLoading,
    isSuccess: getDataSuccess,
  } = useGetListNodeEndpoint();
  const { getListNodeEndpointGroup, loading: isSelectLoading } =
    useGetListNodeEndpointGroup();
  const { getOneNodeEndpointGroup } = useGetOneNodeEndpointGroup();
  const {
    isSuccess,
    loading: deleteLoading,
    deleteNodeEndpoint,
  } = useDeleteNodeEndpoint();

  useEffect(() => {
    if (group && group !== "undefined") {
      getOneNodeEndpointGroup(Number(group));
    }
  }, [group, listNodeEndpointGroup]);

  useEffect(() => {
    getListNodeEndpointGroup({ page: 1, pageSize: 1000 });

    return () => {
      clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    getListNodeEndpoint({
      page,
      pageSize,
      searchText,
      groupId: Number(group),
    });
  }, [searchText, page, pageSize, group]);

  useEffect(() => {
    clearTimeout(searchTimeOut);
    searchTimeOut = setTimeout(() => {
      getListNodeEndpoint({
        page,
        pageSize,
        searchText,
        groupId: Number(group),
      });

      clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        getListNodeEndpoint({
          page,
          pageSize,
          searchText,
          groupId: Number(group),
        });
      }, 60 * 1000);
    }, 200);

    return () => {
      clearInterval(intervalRef.current);
    };
  }, [searchText, page, pageSize, group, shouldRefetch]);

  useEffect(() => {
    if (getDataLoading && shouldRefetch) {
      setShouldRefetch(false);
    }
  }, [getDataLoading, shouldRefetch]);

  useEffect(() => {
    if (!getDataLoading && getDataSuccess) {
      setLastUpdate(new Date().getTime());
    }
  }, [getDataLoading, getDataSuccess]);

  const onEditNodeEndpoint = (group: INodeEndpoint) => {
    props?.actSaveSelectedNodeEndpoint(group);
    setModalOpen(true);
  };

  // delete group
  const onDeleteNodeEndpoint = () => {
    setBtnLoading(true);
    deleteNodeEndpoint(selectedRowKeys);
  };

  useEffect(() => {
    if (!deleteLoading && isSuccess) {
      onSetSelectedRowKeys([]);
      setShouldRefetch(true);

      setTimeout(() => {
        setBtnLoading(false);
      }, 3000);
    }
  }, [deleteLoading, isSuccess]);

  const onTableChange = (pagination?: PaginationProps) => {
    pagination?.current !== page && onSetPage(pagination?.current!);
    pagination?.pageSize !== pageSize &&
      props.actSetPageSize(pagination?.pageSize!);
  };

  const onRowSelectionChange = (selectedKeys: any) => {
    onSetSelectedRowKeys(selectedKeys);
  };

  const onOpenModalEndpoint = () => {
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

  const onRefresh = () => {
    setShouldRefetch(true);
  };

  const dataSource: any[] = listNodeEndpoint?.map(
    (group: INodeEndpoint, index: number) => ({
      ...group,
      index: (page - 1) * pageSize + index + 1,
    }),
  );

  const onChangeNodeEndpointGroup = (groupID: any) => {
    navigate(`/dashboard/connections?tab=node-provider&group=${groupID}`);
  };

  const onSearchNodeEndpointGroup = (text: string) => {
    if (searchNodeEndpointGroupTimeOut) {
      clearTimeout(searchNodeEndpointGroupTimeOut);
    }
    searchNodeEndpointGroupTimeOut = setTimeout(() => {
      getListNodeEndpointGroup({ page: 1, pageSize: 1000, searchText: text });
    }, 200);
  };

  const onBack = () => {
    navigate(`/dashboard/connections?tab=node-provider`);
  };

  const isStaleData =
    listNodeEndpoint.length > 0 &&
    listNodeEndpoint[0]?.groupId !== selectedNodeEndpointGroup?.id;

  return (
    <PageWrapper>
      <div className="heading">
        <div className="back" onClick={onBack}>
          <div className="icon">
            <BackIcon />
          </div>
          <div className="text">{translate("back")}</div>
        </div>

        <SearchInput
          onChange={onSetSearchText}
          value={searchText}
          placeholder={translate("button.search")}
          style={{ marginRight: "var(--margin-right)", width: "35rem" }}
        />

        <Select
          placeholder={translate("nodeEndpoint.group")}
          size="large"
          className="custom-select"
          style={{
            marginRight: "auto",
            width: "17rem",
          }}
          value={selectedNodeEndpointGroup?.id}
          onChange={onChangeNodeEndpointGroup}
          showSearch
          onSearch={onSearchNodeEndpointGroup}
          filterOption={false}
          loading={isSelectLoading}
          optionLabelProp="label"
        >
          {listNodeEndpointGroup?.map((group: INodeEndpointGroup) => (
            <Option key={group?.id} value={group?.id} label={group?.name}>
              <OptionWrapper>
                <div className="name">{group?.name || EMPTY_STRING}</div>
                <div className="description">
                  {translate("nodeProvider.totalNode")}:{" "}
                  {group?.totalNodeEndpoint || 0}
                </div>
              </OptionWrapper>
            </Option>
          ))}
        </Select>

        {lastUpdate !== null && (
          <DataUpdateAt timestamp={lastUpdate} onRefresh={onRefresh} />
        )}

        <Button
          type="primary"
          style={{ marginRight: "var(--margin-right)" }}
          onClick={onOpenModalEndpoint}
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
          onConfirm={onDeleteNodeEndpoint}
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
        dataSource={isStaleData ? [] : dataSource}
        columns={renderColumns(onEditNodeEndpoint, searchText, translate)}
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
        loading={getDataLoading || isStaleData}
        onChange={onTableChange}
        size="middle"
      />

      <ModalEndpoint
        isModalOpen={isModalOpen}
        setModalOpen={setModalOpen}
        setShouldRefetch={setShouldRefetch}
      />
    </PageWrapper>
  );
};

export default connect(
  (state: RootState) => ({
    listNodeEndpoint: state?.NodeEndpoint?.listNodeEndpoint,
    totalData: state?.NodeEndpoint?.totalData,
    listNodeEndpointGroup: state?.NodeEndpointGroup?.listNodeEndpointGroup,
    selectedNodeEndpointGroup:
      state?.NodeEndpointGroup?.selectedNodeEndpointGroup,
    pageSize: state?.NodeEndpoint?.pageSize,
  }),
  { actSaveSelectedNodeEndpoint, actSetPageSize },
)(NodeEndpoint);
