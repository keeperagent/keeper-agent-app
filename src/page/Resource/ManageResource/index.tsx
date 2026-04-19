import { useState, useEffect, useMemo, ComponentType } from "react";
import { Table, PaginationProps, Button, Select, Popconfirm } from "antd";
import { connect } from "react-redux";
import qs from "qs";
import { useLocation, useNavigate } from "react-router-dom";
import HighlighterLib, { HighlighterProps } from "react-highlight-words";
import { RootState } from "@/redux/store";
import { DownArrowIcon, UpArrowIcon, EditIcon } from "@/component/Icon";
import { SearchInput, PasswordInput } from "@/component/Input";
import { formatTime } from "@/service/util";
import { TotalData } from "@/component";
import { actSaveSelectedResource } from "@/redux/resource";
import { actSetPageSize } from "@/redux/resource";
import { DeleteButton, UploadButton } from "@/component/Button";
import { IResource, IResourceGroup, ColumnConfig } from "@/electron/type";
import {
  useGetListResource,
  useDeleteResource,
  useGetOneResourceGroup,
  useGetListResourceGroup,
  useTranslation,
} from "@/hook";
import { actSaveSelectedResourceGroup } from "@/redux/resourceGroup";
import { getResourceColumn } from "@/service/tableView";
import { EMPTY_STRING, TABLE_PAGE_OPTION } from "@/config/constant";
import ModalImportResource from "./ModalImportResource";
import ModalResource from "./ModalResource";
import {
  PageWrapper,
  ExpandIconWrapper,
  ExpandRowWrapper,
  OptionWrapper,
} from "./style";
import ModalExportResource from "./ModalExportResource";

const Highlighter = HighlighterLib as ComponentType<HighlighterProps>;

const { Option } = Select;

let searchTimeOut: any = null;
let searchResourceGroupTimeOut: any = null;

const renderColumns = (
  listColumn: ColumnConfig[],
  onOpenModalResource: (wallet: IResource) => void,
  searchText: string,
  translate: any,
) => [
  {
    title: translate("indexTable"),
    dataIndex: "index",
    width: 60,
  },
  ...listColumn?.map((config: ColumnConfig) => ({
    title: config?.title!,
    dataIndex: config?.dataIndex!,
    width: config?.width,
    render: (value: string) =>
      value ? (
        <Highlighter
          textToHighlight={value}
          searchWords={[searchText]}
          highlightClassName="highlight"
        />
      ) : (
        EMPTY_STRING
      ),
  })),
  {
    title: "",
    render: (text: any, record: any) => (
      <div className="list-icon">
        <EditIcon onClick={() => onOpenModalResource(record)} />
      </div>
    ),
  },
];

const ManageResource = (props: any) => {
  const { translate, locale } = useTranslation();
  const {
    totalData,
    listResource,
    listResourceGroup,
    selectedResourceGroup,
    pageSize = TABLE_PAGE_OPTION[0],
  } = props;

  const [isModalImportOpen, setModalImportOpen] = useState(false);
  const [isModalExportOpen, setModalExportOpen] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [page, onSetPage] = useState(1);
  const [selectedRowKeys, onSetSelectedRowKeys] = useState([]);
  const [searchText, onSetSearchText] = useState("");
  const [shouldRefetch, setShouldRefetch] = useState(false);
  const [isBtnLoading, setBtnLoading] = useState(false);
  const [encryptKey, setEncryptKey] = useState("");
  const navigate = useNavigate();

  const location = useLocation();
  const { search } = location;
  const { group, mode } = qs.parse(search, { ignoreQueryPrefix: true });

  const { getListResource, loading: getDataLoading } = useGetListResource();
  const {
    loading: deleteResourceLoading,
    isSuccess,
    deleteResource,
  } = useDeleteResource();
  const { getOneResourceGroup, loading: isSelectLoading } =
    useGetOneResourceGroup();
  const { getListResourceGroup } = useGetListResourceGroup();

  useEffect(() => {
    if (!selectedResourceGroup && listResourceGroup?.length > 0) {
      props?.actSaveSelectedResourceGroup(listResourceGroup?.[0]);
    }
  }, [selectedResourceGroup, listResourceGroup]);

  useEffect(() => {
    getListResourceGroup({ page: 1, pageSize: 1000 });
  }, []);

  useEffect(() => {
    if (group && group !== "undefined") {
      getOneResourceGroup(Number(group));
    } else if (listResourceGroup?.length > 0) {
      onChangeResourceGroup(listResourceGroup[0]?.id);
    }
  }, [group, listResourceGroup]);

  const listColumn = useMemo(() => {
    return getResourceColumn(selectedResourceGroup || {});
  }, [selectedResourceGroup]);

  useEffect(() => {
    if (getDataLoading && shouldRefetch) {
      setShouldRefetch(false);
    }
  }, [getDataLoading, shouldRefetch]);

  useEffect(() => {
    clearTimeout(searchTimeOut);
    searchTimeOut = setTimeout(() => {
      getListResource({
        page,
        pageSize,
        searchText,
        groupId: selectedResourceGroup?.id,
        encryptKey,
      });
    }, 200);
  }, [page, pageSize, searchText, selectedResourceGroup, encryptKey]);

  useEffect(() => {
    if (shouldRefetch) {
      getListResource({
        page,
        pageSize,
        searchText,
        groupId: selectedResourceGroup?.id,
        encryptKey,
      });
    }
  }, [
    page,
    pageSize,
    encryptKey,
    searchText,
    selectedResourceGroup,
    shouldRefetch,
  ]);

  // delete wallet
  const onDeleteResource = () => {
    setBtnLoading(true);
    deleteResource(selectedRowKeys);
  };

  useEffect(() => {
    if (!deleteResourceLoading && isSuccess) {
      onSetSelectedRowKeys([]);
      setShouldRefetch(true);

      setTimeout(() => {
        setBtnLoading(false);
      }, 3000);
    }
  }, [deleteResourceLoading, isSuccess]);

  const onTableChange = (pagination?: PaginationProps) => {
    pagination?.current !== page && onSetPage(pagination?.current!);
    pagination?.pageSize !== pageSize &&
      props.actSetPageSize(pagination?.pageSize!);
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

  const rowSelection = {
    selectedRowKeys,
    onChange: onRowSelectionChange,
    columnWidth: 50,
  };

  const expandedRowRender = (record: IResource) => {
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

  const onOpenModalImport = () => {
    setModalImportOpen(true);
  };

  const onOpenModalExport = () => {
    setModalExportOpen(true);
  };

  const onOpenModalResource = (wallet: IResource | null) => {
    props?.actSaveSelectedResource(wallet);
    setModalOpen(true);
  };

  const onChangeResourceGroup = (groupID: IResourceGroup) => {
    navigate(`/dashboard/resource?group=${groupID}&mode=${mode}`);
  };

  const onSearchResourceGroup = (text: string) => {
    if (searchResourceGroupTimeOut) {
      clearTimeout(searchResourceGroupTimeOut);
    }
    searchResourceGroupTimeOut = setTimeout(() => {
      getListResourceGroup({ page: 1, pageSize: 1000, searchText: text });
    }, 200);
  };

  const dataSource: any[] = useMemo(() => {
    return listResource?.map((resource: IResource, index: number) => ({
      ...resource,
      index: (page - 1) * pageSize + index + 1,
    }));
  }, [listResource, page, pageSize]);

  const isStaleData =
    listResource?.length > 0 &&
    listResource[0]?.groupId !== selectedResourceGroup?.id;

  return (
    <PageWrapper>
      <div className="heading">
        <SearchInput
          onChange={onSetSearchText}
          value={searchText}
          placeholder={translate("button.search")}
          style={{
            marginRight: "var(--margin-right)",
            width: "35rem",
          }}
        />

        <Select
          placeholder={translate("resource.resourceGroup")}
          size="large"
          className="custom-select"
          style={{
            marginRight: "var(--margin-right)",
            width: "17rem",
          }}
          value={selectedResourceGroup?.id}
          onChange={onChangeResourceGroup}
          loading={isSelectLoading}
          showSearch
          filterOption={false}
          onSearch={onSearchResourceGroup}
          optionLabelProp="label"
        >
          {listResourceGroup?.map((group: IResourceGroup) => (
            <Option key={group?.id} value={group?.id} label={group?.name}>
              <OptionWrapper>
                <div className="name">{group?.name || EMPTY_STRING}</div>
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
          onClick={() => onOpenModalResource(null)}
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
              {translate("campaign.confirm.deleteGroup")}
            </span>
          }
          onConfirm={onDeleteResource}
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
        virtual
        rowSelection={rowSelection}
        rowKey={(data) => data?.id!}
        dataSource={isStaleData ? [] : dataSource}
        columns={renderColumns(
          listColumn,
          onOpenModalResource,
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
        expandable={{
          expandedRowRender,
          expandIcon: renderExpandIcon,
          columnWidth: 30,
        }}
        scroll={{ x: 700, y: 600 }}
        loading={getDataLoading || isStaleData}
        onChange={onTableChange}
        size="middle"
        bordered
      />

      <ModalImportResource
        isModalOpen={isModalImportOpen}
        setModalOpen={setModalImportOpen}
        setShouldRefetch={setShouldRefetch}
      />

      <ModalExportResource
        isModalOpen={isModalExportOpen}
        setModalOpen={setModalExportOpen}
      />

      <ModalResource isModalOpen={isModalOpen} setModalOpen={setModalOpen} />
    </PageWrapper>
  );
};

export default connect(
  (state: RootState) => ({
    listResource: state?.Resource?.listResource,
    totalData: state?.Resource?.totalData,
    listResourceGroup: state?.ResourceGroup?.listResourceGroup,
    selectedResourceGroup: state?.ResourceGroup?.selectedResourceGroup,
    isLightMode: state.Layout.isLightMode,
    pageSize: state?.Resource?.pageSize,
  }),
  { actSaveSelectedResource, actSaveSelectedResourceGroup, actSetPageSize },
)(ManageResource);
