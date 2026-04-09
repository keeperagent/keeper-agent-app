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
import { connect } from "react-redux";
import HighlighterLib, { HighlighterProps } from "react-highlight-words";
import { Link, useNavigate } from "react-router-dom";
import { formatTime, trimText } from "@/service/util";
import { DeleteButton } from "@/component/Button";
import { SearchInput } from "@/component/Input";
import {
  EditIcon,
  EyeOpenIcon,
  DownArrowIcon,
  UpArrowIcon,
} from "@/component/Icon";
import { TotalData } from "@/component";
import { RootState } from "@/redux/store";
import {
  useGetListResourceGroup,
  useDeleteResourceGroup,
  useTranslation,
} from "@/hook";
import {
  actSaveSelectedResourceGroup,
  actSetSortField,
  actSetPageSize,
} from "@/redux/resourceGroup";
import { actSaveGetListResource } from "@/redux/resource";
import { IProfileGroup, IResourceGroup, ISorter } from "@/electron/type";
import { EMPTY_STRING, TABLE_PAGE_OPTION } from "@/config/constant";
import { SORT_ORDER } from "@/electron/constant";
import { VIEW_MODE as PROFILE_VIEW_MODE } from "@/page/Profile";
import ModalResourceGroup from "./ModalResourceGroup";
import {
  PageWrapper,
  ExpandIconWrapper,
  ExpandRowWrapper,
  LinkHoverWrapper,
  OptionWrapper,
} from "./style";
import { VIEW_MODE } from "../index";

const Highlighter = HighlighterLib as ComponentType<HighlighterProps>;

let searchTimeOut: any = null;

const renderColumns = (
  onEditResourceGroup: (group: IResourceGroup) => void,
  onViewGroup: (groupID: number) => void,
  searchText: string,
  translate: any,
  locale: string,
) => [
  {
    title: translate("indexTable"),
    dataIndex: "index",
    width: "6%",
  },
  {
    title: translate("resourceGroup.name"),
    dataIndex: "name",
    width: "45%",
    render: (value: string, record: IResourceGroup) => (
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
    title: translate("resource.totalResource"),
    dataIndex: "totalResource",
    width: "15%",
    render: (value: number) => value || 0,
  },
  {
    title: translate("usedBy"),
    dataIndex: "totalUsed",
    width: "15%",
    render: (value: any, record: IResourceGroup) => {
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
    render: (text: any, record: IResourceGroup) => (
      <div className="list-icon">
        <Tooltip title={translate("view")}>
          <div className="icon" onClick={() => onViewGroup(record?.id!)}>
            <EyeOpenIcon />
          </div>
        </Tooltip>

        <EditIcon onClick={() => onEditResourceGroup(record)} />
      </div>
    ),
  },
];

const ResourceGroup = (props: any) => {
  const { translate, locale } = useTranslation();
  const {
    totalData,
    listResourceGroup,
    sortField,
    pageSize = TABLE_PAGE_OPTION[0],
  } = props;

  const [page, onSetPage] = useState(1);
  const [isBtnLoading, setBtnLoading] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [searchText, onSetSearchText] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedRowKeys, onSetSelectedRowKeys] = useState<number[]>([]);
  const navigate = useNavigate();

  const listSortField = useMemo(
    () => [
      {
        label: translate("resourceGroup.name"),
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

  const { getListResourceGroup, loading: getDataLoading } =
    useGetListResourceGroup();
  const { isSuccess, loading, deleteResourceGroup } = useDeleteResourceGroup();

  useEffect(() => {
    props?.actSaveSelectedResourceGroup(null);

    // reset data
    props?.actSaveGetListResource({
      data: [],
      page: 1,
      pageSize: 1000,
      totalData: 0,
    });
  }, []);

  useEffect(() => {
    clearTimeout(searchTimeOut);
    searchTimeOut = setTimeout(() => {
      getListResourceGroup({ page, pageSize, searchText, sortField });
    }, 200);
  }, [searchText, page, pageSize, sortField]);

  // delete group
  const onDeleteResourceGroup = () => {
    if (selectedRowKeys.length > 0) {
      deleteResourceGroup(selectedRowKeys);
    }
  };

  useEffect(() => {
    if (!loading && isSuccess) {
      setBtnLoading(true);
      onSetSelectedRowKeys([]);
      setTimeout(() => {
        setBtnLoading(false);
        getListResourceGroup({ page, pageSize, searchText, sortField });
      }, 1700);
    }
  }, [loading, isSuccess, page, pageSize, searchText, sortField]);

  const onTableChange = (pagination?: PaginationProps) => {
    pagination?.current !== page && onSetPage(pagination?.current!);
    pagination?.pageSize !== pageSize &&
      props.actSetPageSize(pagination?.pageSize!);
  };

  const onRowSelectionChange = (selectedKeys: any) => {
    onSetSelectedRowKeys(selectedKeys);
  };

  const onEditResourceGroup = (group: IResourceGroup) => {
    props?.actSaveSelectedResourceGroup(group);
    setModalOpen(true);
    setCurrentStep(0);
  };

  const onCreateResourceGroup = () => {
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

  const onViewGroup = (groupID: number) => {
    navigate(`/dashboard/resource?group=${groupID}&mode=${VIEW_MODE.RESOURCE}`);
  };

  const expandedRowRender = (record: IResourceGroup) => {
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

  const onChangeSortField = (value: string) => {
    props?.actSetSortField({ field: value } as ISorter);
  };

  const onChangeSortOrder = (value: string) => {
    props?.actSetSortField({ order: value } as ISorter);
  };

  const dataSource: any[] = listResourceGroup?.map(
    (group: IResourceGroup, index: number) => ({
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
          onClick={onCreateResourceGroup}
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
              {translate("resource.confirm.deleteResourceGroup")}
            </span>
          }
          onConfirm={onDeleteResourceGroup}
          placement="left"
          disabled={selectedRowKeys?.length === 0}
        >
          <span>
            <DeleteButton
              text={translate("button.delete")}
              loading={isBtnLoading}
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
          onEditResourceGroup,
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
        scroll={{ x: 900, y: "70vh" }}
        loading={getDataLoading}
        onChange={onTableChange}
        size="middle"
        expandable={{
          expandedRowRender,
          expandIcon: renderExpandIcon,
        }}
      />

      <ModalResourceGroup
        isModalOpen={isModalOpen}
        setModalOpen={setModalOpen}
        setCurrentStep={setCurrentStep}
        currentStep={currentStep}
      />
    </PageWrapper>
  );
};

export default connect(
  (state: RootState) => ({
    listResourceGroup: state?.ResourceGroup?.listResourceGroup,
    totalData: state?.ResourceGroup?.totalData,
    sortField: state?.ResourceGroup?.sortField,
    pageSize: state?.ResourceGroup?.pageSize,
  }),
  {
    actSaveSelectedResourceGroup,
    actSaveGetListResource,
    actSetSortField,
    actSetPageSize,
  },
)(ResourceGroup);
