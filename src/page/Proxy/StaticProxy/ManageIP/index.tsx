import { useState, useEffect, ComponentType } from "react";
import { Table, PaginationProps, Button, Popconfirm, Select } from "antd";
import HighlighterLib, { HighlighterProps } from "react-highlight-words";
import _ from "lodash";
import { connect } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import qs from "qs";
import { RootState } from "@/redux/store";
import { formatTime } from "@/service/util";
import { DeleteButton } from "@/component/Button";
import { SearchInput } from "@/component/Input";
import { EditIcon, BackIcon } from "@/component/Icon";
import { TotalData } from "@/component";
import {
  useGetListStaticProxy,
  useDeleteStaticProxy,
  useTranslation,
  useGetListStaticProxyGroup,
  useGetOneStaticProxyGroup,
} from "@/hook";
import { actSaveSelectedStaticProxy } from "@/redux/staticProxy";
import { actSetPageSize } from "@/redux/staticProxy";
import { IStaticProxy, IStaticProxyGroup } from "@/electron/type";
import { LIST_NETWORK_PROTOCOL } from "@/electron/constant";
import { EMPTY_STRING, TABLE_PAGE_OPTION } from "@/config/constant";
import ModalProxyIp from "./ModalProxyIp";
import { PageWrapper, OptionWrapper } from "./style";

const Highlighter = HighlighterLib as ComponentType<HighlighterProps>;

const { Option } = Select;

let searchTimeOut: any = null;
let searchStaticProxyGroupTimeOut: any = null;

const renderColumns = (
  onEditStaticProxy: (staticProxy: IStaticProxy) => void,
  searchText: string,
  translate: any,
) => [
  {
    title: translate("indexTable"),
    dataIndex: "index",
    width: "6%",
  },
  {
    title: "Proxy",
    dataIndex: "proxy",
    width: "60%",
    render: (value: string, record: IStaticProxy) => {
      const protocol =
        _.find(LIST_NETWORK_PROTOCOL, { value: record?.protocol })?.prefix ||
        "";
      const ip = record?.ip;
      const port = record?.port;
      const str = `${protocol}${ip}:${port}`;

      return (
        <Highlighter
          textToHighlight={str}
          searchWords={[searchText]}
          highlightClassName="highlight"
        />
      );
    },
  },
  {
    title: translate("updatedAt"),
    dataIndex: "updateAt",
    width: "20%",
    render: (value: number) => formatTime(Number(value)),
  },
  {
    title: "",
    render: (text: any, record: IStaticProxy) => (
      <div className="list-icon">
        <EditIcon onClick={() => onEditStaticProxy(record)} />
      </div>
    ),
  },
];

const StaticProxyList = (props: any) => {
  const { translate } = useTranslation();
  const {
    totalData,
    listStaticProxy,
    listStaticProxyGroup,
    selectedStaticProxyGroup,
    pageSize = TABLE_PAGE_OPTION[0],
  } = props;

  const [page, onSetPage] = useState(1);
  const [isBtnLoading, setBtnLoading] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [searchText, onSetSearchText] = useState("");
  const [selectedRowKeys, onSetSelectedRowKeys] = useState([]);
  const [shouldRefetch, setShouldRefetch] = useState(false);
  const navigate = useNavigate();

  const location = useLocation();
  const { search } = location;
  const { group } = qs.parse(search, { ignoreQueryPrefix: true });

  const { getListStaticProxy, loading: getDataLoading } =
    useGetListStaticProxy();
  const { getListStaticProxyGroup } = useGetListStaticProxyGroup();
  const { getOneStaticProxyGroup, loading: isSelectLoading } =
    useGetOneStaticProxyGroup();
  const {
    isSuccess,
    loading: deleteLoading,
    deleteStaticProxy,
  } = useDeleteStaticProxy();

  useEffect(() => {
    getListStaticProxyGroup({ page: 1, pageSize: 1000 });
  }, []);

  useEffect(() => {
    if (group && group !== "undefined") {
      getOneStaticProxyGroup(Number(group));
    } else if (listStaticProxyGroup?.length > 0) {
      onChangeStaticProxyGroup(listStaticProxyGroup[0]?.id);
    }
  }, [group, listStaticProxyGroup]);

  useEffect(() => {
    props?.actSaveSelectedStaticProxy(null);
  }, []);

  useEffect(() => {
    clearTimeout(searchTimeOut);
    searchTimeOut = setTimeout(() => {
      if (!isNaN(Number(group))) {
        getListStaticProxy({
          page,
          pageSize,
          searchText,
          groupId: Number(group),
        });
      }
    }, 200);
  }, [searchText, page, pageSize, group]);

  useEffect(() => {
    if (shouldRefetch) {
      if (!isNaN(Number(group))) {
        getListStaticProxy({
          page,
          pageSize,
          searchText,
          groupId: Number(group),
        });
      }
    }
  }, [page, pageSize, searchText, shouldRefetch, group]);

  useEffect(() => {
    if (getDataLoading && shouldRefetch) {
      setShouldRefetch(false);
    }
  }, [getDataLoading, shouldRefetch]);

  const onEditStaticProxy = (staticProxy: IStaticProxy) => {
    props?.actSaveSelectedStaticProxy(staticProxy);
    setModalOpen(true);
  };

  // delete static proxy
  const onDeleteStaticProxy = () => {
    setBtnLoading(true);
    deleteStaticProxy(selectedRowKeys);
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

  const onOpenModalStaticProxy = () => {
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

  const dataSource: any[] = listStaticProxy?.map(
    (staticProxy: IStaticProxy, index: number) => ({
      ...staticProxy,
      index: (page - 1) * pageSize + index + 1,
    }),
  );

  const onChangeStaticProxyGroup = (groupID: any) => {
    navigate(`/dashboard/connections?tab=proxy&group=${groupID}`);
  };

  const onSearchStaticProxyGroup = (text: string) => {
    if (searchStaticProxyGroupTimeOut) {
      clearTimeout(searchStaticProxyGroupTimeOut);
    }
    searchStaticProxyGroupTimeOut = setTimeout(() => {
      getListStaticProxyGroup({ page: 1, pageSize: 1000, searchText: text });
    }, 200);
  };

  const onBack = () => {
    navigate(`/dashboard/connections?tab=proxy`);
  };

  const isStaleData =
    listStaticProxy?.length > 0 &&
    listStaticProxy[0]?.groupId !== selectedStaticProxyGroup?.id;

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
          placeholder={translate("proxy.choose.proxyGroup")}
          size="large"
          className="custom-select"
          style={{
            marginRight: "auto",
            width: "17rem",
          }}
          value={selectedStaticProxyGroup?.id}
          onChange={onChangeStaticProxyGroup}
          showSearch
          onSearch={onSearchStaticProxyGroup}
          filterOption={false}
          loading={isSelectLoading}
          optionLabelProp="label"
        >
          {listStaticProxyGroup?.map((group: IStaticProxyGroup) => (
            <Option key={group?.id} value={group?.id} label={group?.name}>
              <OptionWrapper>
                <div className="name">{group?.name || EMPTY_STRING}</div>
                <div className="description">{group?.note || EMPTY_STRING}</div>
              </OptionWrapper>
            </Option>
          ))}
        </Select>

        <Button
          type="primary"
          style={{ marginRight: "var(--margin-right)" }}
          onClick={onOpenModalStaticProxy}
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
          onConfirm={onDeleteStaticProxy}
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
        columns={renderColumns(onEditStaticProxy, searchText, translate)}
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

      <ModalProxyIp
        isModalOpen={isModalOpen}
        setModalOpen={setModalOpen}
        setShouldRefetch={setShouldRefetch}
      />
    </PageWrapper>
  );
};

export default connect(
  (state: RootState) => ({
    listStaticProxy: state?.StaticProxy?.listStaticProxy,
    totalData: state?.StaticProxy?.totalData,
    listStaticProxyGroup: state?.StaticProxyGroup?.listStaticProxyGroup,
    selectedStaticProxyGroup: state?.StaticProxyGroup?.selectedStaticProxyGroup,
    pageSize: state?.StaticProxy?.pageSize,
  }),
  { actSaveSelectedStaticProxy, actSetPageSize },
)(StaticProxyList);
