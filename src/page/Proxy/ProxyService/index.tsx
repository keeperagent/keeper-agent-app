import { useEffect, useState } from "react";
import { Button, PaginationProps, Table, Popconfirm, Row } from "antd";
import { connect } from "react-redux";
import { IProxy, IProxyService } from "@/electron/type";
import { PROXY_SERVICE_TYPE } from "@/electron/constant";
import { DeleteButton } from "@/component/Button";
import {
  SearchInput,
  TotalData,
  Status,
  DataUpdateAt,
  SecretText,
} from "@/component";
import { formatTime } from "@/service/util";
import { RootState } from "@/redux/store";
import { actSaveSelectedProxy, actSetSelectedService } from "@/redux/proxy";
import { actSetPageSize } from "@/redux/proxy";
import { useDeleteProxy, useGetListProxy, useTranslation } from "@/hook";
import { EditIcon } from "@/component/Icon";
import { LIST_PROXY_SERVICE } from "@/config/constant";
import decodoImg from "@/asset/decodo.png";
import brightDataImg from "@/asset/brightdata.png";
import { PageWrapper } from "./style";
import ModalProxy from "./ModalProxy";

export const PROXY_SERVICE_ICON = {
  [PROXY_SERVICE_TYPE.DECODO]: decodoImg,
  [PROXY_SERVICE_TYPE.BRIGHTDATA]: brightDataImg,
};

let searchTimeOut: any = null;
let interval: any = null;

const renderColumns = (
  onEditProxy: (proxy: IProxy) => void,
  searchText: string,
  translate: any,
) => [
  {
    title: translate("indexTable"),
    dataIndex: "index",
    width: "6%",
  },
  {
    title: "API key",
    dataIndex: "apiKey",
    width: "45%",
    render: (value: string) => (
      <SecretText text={value} style={{ fontSize: "1.2rem" }} />
    ),
  },
  {
    title: translate("proxy.status"),
    dataIndex: "isAlive",
    width: "10%",
    align: "center",
    render: (isAlive: boolean) => (
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Status content={isAlive ? "Active" : "Inactive"} isSuccess={isAlive} />
      </div>
    ),
  },
  {
    title: translate("updatedAt"),
    dataIndex: "updateAt",
    width: "15%",
    render: (value: number) => formatTime(Number(value)),
  },
  {
    title: "",
    render: (text: any, record: any) => (
      <div className="list-icon">
        <EditIcon onClick={() => onEditProxy(record)} />
      </div>
    ),
  },
];

const ProxyService = (props: any) => {
  const { translate } = useTranslation();
  const { totalData, listProxy, selectedService, pageSize = 30 } = props;

  const [page, onSetPage] = useState(1);
  const [searchText, onSetSearchText] = useState("");
  const [isModalOpen, setModalOpen] = useState(false);
  const [isBtnLoading, setBtnLoading] = useState(false);
  const [selectedRowKeys, onSetSelectedRowKeys] = useState([]);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const [shouldRefetch, setShouldRefetch] = useState(false);

  const {
    getListProxy,
    loading: getDataLoading,
    isSuccess: getDataSuccess,
  } = useGetListProxy();
  const { isSuccess, loading: isDeleteLoading, deleteProxy } = useDeleteProxy();

  useEffect(() => {
    if (!selectedService) {
      props?.actSetSelectedService(PROXY_SERVICE_TYPE.DECODO);
    }
  }, [selectedService]);

  useEffect(() => {
    clearTimeout(searchTimeOut);
    searchTimeOut = setTimeout(() => {
      getListProxy({ page, pageSize, searchText, type: selectedService });

      if (interval) {
        clearInterval(interval);
      }
      interval = setInterval(() => {
        getListProxy({ page, pageSize, searchText, type: selectedService });
      }, 60 * 1000);
    }, 200);

    return () => {
      clearInterval(interval);
    };
  }, [searchText, page, pageSize, selectedService, shouldRefetch]);

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

  const dataSource: any[] = listProxy?.map((proxy: IProxy, index: number) => ({
    ...proxy,
    index: (page - 1) * pageSize + index + 1,
  }));

  const onRowSelectionChange = (selectedKeys: any) => {
    onSetSelectedRowKeys(selectedKeys);
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

  const onTableChange = (pagination?: PaginationProps) => {
    pagination?.current !== page && onSetPage(pagination?.current!);
    pagination?.pageSize !== pageSize &&
      props.actSetPageSize(pagination?.pageSize!);
  };

  const onEditProxy = (proxy: IProxy) => {
    props?.actSaveSelectedProxy(proxy);
    setModalOpen(true);
  };

  const onOpenModalProxy = () => {
    setModalOpen(true);
  };

  const onDeleteProxy = () => {
    setBtnLoading(true);
    deleteProxy(selectedRowKeys);
  };

  useEffect(() => {
    if (!isDeleteLoading && isSuccess) {
      onSetSelectedRowKeys([]);
      setShouldRefetch(true);

      setTimeout(() => {
        setBtnLoading(false);
      }, 3000);
    }
  }, [isDeleteLoading, isSuccess]);

  const onRefresh = () => {
    setShouldRefetch(true);
  };

  const onToggleServiceType = (type: string) => {
    props?.actSetSelectedService(type);
  };

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
          onClick={onOpenModalProxy}
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
          onConfirm={onDeleteProxy}
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

      <Row justify="space-between" style={{ width: "100%" }}>
        <div className="list-service">
          {LIST_PROXY_SERVICE?.map((service: IProxyService, index: number) => (
            <Status
              content={service?.name}
              isSuccess={true}
              style={{
                background:
                  selectedService === service?.type
                    ? service?.color
                    : service?.background,
                color:
                  selectedService === service?.type ? "white" : service?.color,
                fontWeight: selectedService === service?.type ? 600 : 400,
              }}
              isLarge={true}
              onClick={() => onToggleServiceType(service?.type)}
              key={index}
              externalLink={service?.website}
              icon={
                <img
                  src={PROXY_SERVICE_ICON[service?.type]}
                  alt={service?.name}
                />
              }
            />
          ))}
        </div>

        {lastUpdate !== null && (
          <DataUpdateAt timestamp={lastUpdate} onRefresh={onRefresh} />
        )}
      </Row>

      <Table
        rowSelection={rowSelection}
        rowKey={(data) => data?.id}
        dataSource={dataSource}
        // @ts-ignore
        columns={renderColumns(onEditProxy, searchText, translate)}
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

      <ModalProxy
        isModalOpen={isModalOpen}
        setModalOpen={setModalOpen}
        setShouldRefetch={setShouldRefetch}
      />
    </PageWrapper>
  );
};

export default connect(
  (state: RootState) => ({
    listProxy: state?.Proxy?.listProxy,
    selectedService: state?.Proxy?.selectedService,
    totalData: state?.Proxy?.totalData,
    pageSize: state?.Proxy?.pageSize,
  }),
  { actSaveSelectedProxy, actSetSelectedService, actSetPageSize },
)(ProxyService);
