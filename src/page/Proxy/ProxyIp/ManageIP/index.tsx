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
  useGetListProxyIp,
  useDeleteProxyIp,
  useTranslation,
  useGetListProxyIpGroup,
  useGetOneProxyIpGroup,
} from "@/hook";
import { actSaveSelectedProxyIp } from "@/redux/proxyIp";
import { actSetPageSize } from "@/redux/proxyIp";
import { IProxyIp, IProxyIpGroup } from "@/electron/type";
import { LIST_NETWORK_PROTOCOL } from "@/electron/constant";
import ModalProxyIp from "./ModalProxyIp";
import { PageWrapper, OptionWrapper } from "./style";
import { VIEW_MODE } from "../../index";
import { EMPTY_STRING } from "@/config/constant";

const Highlighter = HighlighterLib as ComponentType<HighlighterProps>;

const { Option } = Select;

let searchTimeOut: any = null;
let searchProxyIpGroupTimeOut: any = null;

const renderColumns = (
  onEditProxyIp: (group: IProxyIp) => void,
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
    render: (value: string, record: IProxyIp) => {
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
    render: (text: any, record: IProxyIp) => (
      <div className="list-icon">
        <EditIcon onClick={() => onEditProxyIp(record)} />
      </div>
    ),
  },
];

const ProxyIp = (props: any) => {
  const { translate } = useTranslation();
  const {
    totalData,
    listProxyIp,
    listProxyIpGroup,
    selectedProxyIpGroup,
    pageSize = 30,
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
  const { group, mode } = qs.parse(search, { ignoreQueryPrefix: true });

  const { getListProxyIp, loading: getDataLoading } = useGetListProxyIp();
  const { getListProxyIpGroup } = useGetListProxyIpGroup();
  const { getOneProxyIpGroup, loading: isSelectLoading } =
    useGetOneProxyIpGroup();
  const {
    isSuccess,
    loading: deleteLoading,
    deleteProxyIp,
  } = useDeleteProxyIp();

  useEffect(() => {
    getListProxyIpGroup({ page: 1, pageSize: 10000 });
  }, []);

  useEffect(() => {
    if (group && group !== "undefined") {
      getOneProxyIpGroup(Number(group));
    } else if (listProxyIpGroup?.length > 0) {
      onChangeProxyIpGroup(listProxyIpGroup[0]?.id);
    }
  }, [group, listProxyIpGroup]);

  useEffect(() => {
    props?.actSaveSelectedProxyIp(null);
  }, []);

  useEffect(() => {
    clearTimeout(searchTimeOut);
    searchTimeOut = setTimeout(() => {
      if (!isNaN(Number(group))) {
        getListProxyIp({ page, pageSize, searchText, groupId: Number(group) });
      }
    }, 200);
  }, [searchText, page, pageSize, group]);

  useEffect(() => {
    if (shouldRefetch) {
      if (!isNaN(Number(group))) {
        getListProxyIp({ page, pageSize, searchText, groupId: Number(group) });
      }
    }
  }, [page, pageSize, searchText, shouldRefetch, group]);

  useEffect(() => {
    if (getDataLoading && shouldRefetch) {
      setShouldRefetch(false);
    }
  }, [getDataLoading, shouldRefetch]);

  const onEditProxyIp = (group: IProxyIp) => {
    props?.actSaveSelectedProxyIp(group);
    setModalOpen(true);
  };

  // delete group
  const onDeleteProxyIp = () => {
    setBtnLoading(true);
    deleteProxyIp(selectedRowKeys);
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

  const onOpenModalProxyIp = () => {
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

  const dataSource: any[] = listProxyIp?.map(
    (group: IProxyIp, index: number) => ({
      ...group,
      index: (page - 1) * pageSize + index + 1,
    }),
  );

  const onChangeProxyIpGroup = (groupID: any) => {
    navigate(
      `/dashboard/proxy?group=${groupID}&mode=${mode || VIEW_MODE.LIST_IP}`,
    );
  };

  const onSearchProxyIpGroup = (text: string) => {
    if (searchProxyIpGroupTimeOut) {
      clearTimeout(searchProxyIpGroupTimeOut);
    }
    searchProxyIpGroupTimeOut = setTimeout(() => {
      getListProxyIpGroup({ page: 1, pageSize: 10000, searchText: text });
    }, 200);
  };

  const onBack = () => {
    navigate(`/dashboard/proxy?mode=${mode}`);
  };

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
          value={selectedProxyIpGroup?.id}
          onChange={onChangeProxyIpGroup}
          showSearch
          onSearch={onSearchProxyIpGroup}
          filterOption={false}
          loading={isSelectLoading}
          optionLabelProp="label"
        >
          {listProxyIpGroup?.map((group: IProxyIpGroup) => (
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
          onClick={onOpenModalProxyIp}
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
          onConfirm={onDeleteProxyIp}
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
        columns={renderColumns(onEditProxyIp, searchText, translate)}
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
    listProxyIp: state?.ProxyIp?.listProxyIp,
    totalData: state?.ProxyIp?.totalData,
    listProxyIpGroup: state?.ProxyIpGroup?.listProxyIpGroup,
    selectedProxyIpGroup: state?.ProxyIpGroup?.selectedProxyIpGroup,
    pageSize: state?.ProxyIp?.pageSize,
  }),
  { actSaveSelectedProxyIp, actSetPageSize },
)(ProxyIp);
