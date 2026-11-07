import { useState, useEffect, useMemo, ComponentType } from "react";
import {
  Table,
  PaginationProps,
  Button,
  Tooltip,
  Popconfirm,
  Select,
} from "antd";
import HighlighterLib, { HighlighterProps } from "react-highlight-words";
import { connect } from "react-redux";
import { useNavigate } from "react-router-dom";
import { RootState } from "@/redux/store";
import { formatTime, trimText } from "@/service/util";
import { DeleteButton } from "@/component/Button";
import { SearchInput } from "@/component/Input";
import {
  EditIcon,
  DownArrowIcon,
  UpArrowIcon,
  EyeOpenIcon,
} from "@/component/Icon";
import { TotalData, AnimatedNumber } from "@/component";
import {
  useGetListWorkflowGroup,
  useDeleteWorkflowGroup,
  useTranslation,
  useTableScrollHeight,
} from "@/hook";
import {
  actSaveSelectedWorkflowGroup,
  actSetSortField,
  actSetPageSize,
} from "@/redux/workflowGroup";
import { IWorkflowGroup, ISorter } from "@/electron/type";
import { SORT_ORDER } from "@/electron/constant";
import { EMPTY_STRING, TABLE_PAGE_OPTION } from "@/config/constant";
import ModalWorkflowGroup from "./ModalWorkflowGroup";
import {
  WorkflowGroupWrapper,
  ExpandIconWrapper,
  ExpandRowWrapper,
  LinkHoverWrapper,
  TableSectionWrapper,
} from "./style";
import { VIEW_MODE } from "../constant";

const Highlighter = HighlighterLib as ComponentType<HighlighterProps>;

let searchTimeOut: any = null;

const renderColumns = (
  onEditWorkflowGroup: (group: IWorkflowGroup) => void,
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
    title: translate("workflowGroup.name"),
    dataIndex: "name",
    width: "35%",
    render: (value: string, record: IWorkflowGroup) => (
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
    title: translate("workflow.totalWorkflow"),
    dataIndex: "totalWorkflow",
    width: "20%",
    render: (value: number) => <AnimatedNumber value={value || 0} />,
  },
  {
    title: translate("updatedAt"),
    dataIndex: "updateAt",
    width: "20%",
    render: (value: number) => formatTime(Number(value), locale),
  },
  {
    title: "",
    render: (text: any, record: IWorkflowGroup) => (
      <div className="list-icon">
        <Tooltip title={translate("view")}>
          <div className="icon" onClick={() => onViewGroup(record?.id!)}>
            <EyeOpenIcon />
          </div>
        </Tooltip>

        <EditIcon onClick={() => onEditWorkflowGroup(record)} />
      </div>
    ),
  },
];

const WorkflowGroup = (props: any) => {
  const { translate, locale } = useTranslation();
  const {
    totalData,
    listWorkflowGroup,
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
        label: translate("workflowGroup.name"),
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

  const { getListWorkflowGroup, loading: getDataLoading } =
    useGetListWorkflowGroup();
  const { isSuccess, loading, deleteWorkflowGroup } = useDeleteWorkflowGroup();
  const { tableSectionRef, scrollHeight: tableScrollHeight } =
    useTableScrollHeight({ deps: [totalData] });

  useEffect(() => {
    props?.actSaveSelectedWorkflowGroup(null);
  }, []);

  useEffect(() => {
    clearTimeout(searchTimeOut);
    searchTimeOut = setTimeout(() => {
      getListWorkflowGroup({ page, pageSize, searchText, sortField });
    }, 200);
  }, [searchText, page, pageSize, sortField]);

  const onEditWorkflowGroup = (group: IWorkflowGroup) => {
    props?.actSaveSelectedWorkflowGroup(group);
    setModalOpen(true);
  };

  const onDeleteWorkflowGroup = () => {
    if (selectedRowKeys.length > 0) {
      deleteWorkflowGroup(selectedRowKeys);
    }
  };

  useEffect(() => {
    if (!loading && isSuccess) {
      setBtnLoading(true);
      onSetSelectedRowKeys([]);
      setTimeout(() => {
        setBtnLoading(false);
        getListWorkflowGroup({ page, pageSize, searchText, sortField });
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

  const onOpenModalWorkflowGroup = () => {
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

  const expandedRowRender = (record: IWorkflowGroup) => {
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
    navigate(`/dashboard/workflow?group=${groupID}&mode=${VIEW_MODE.WORKFLOW}`);
  };

  const onChangeSortField = (value: string) => {
    props?.actSetSortField({ field: value } as ISorter);
  };

  const onChangeSortOrder = (value: string) => {
    props?.actSetSortField({ order: value } as ISorter);
  };

  const dataSource: any[] = listWorkflowGroup?.map(
    (group: IWorkflowGroup, index: number) => ({
      ...group,
      index: (page - 1) * pageSize + index + 1,
    }),
  );

  return (
    <WorkflowGroupWrapper>
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
          onClick={onOpenModalWorkflowGroup}
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
              {translate("workflow.confirm.deleteWorkflowGroup")}
            </span>
          }
          onConfirm={onDeleteWorkflowGroup}
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

      <TableSectionWrapper ref={tableSectionRef}>
        <Table
          rowSelection={{
            selectedRowKeys,
            onChange: onRowSelectionChange,
          }}
          rowKey={(data) => data?.id!}
          dataSource={dataSource}
          columns={renderColumns(
            onEditWorkflowGroup,
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
          scroll={{ x: 900, y: tableScrollHeight }}
          loading={getDataLoading}
          onChange={onTableChange}
          size="middle"
        />
      </TableSectionWrapper>

      <ModalWorkflowGroup
        isModalOpen={isModalOpen}
        setModalOpen={setModalOpen}
      />
    </WorkflowGroupWrapper>
  );
};

export default connect(
  (state: RootState) => ({
    listWorkflowGroup: state?.WorkflowGroup?.listWorkflowGroup,
    totalData: state?.WorkflowGroup?.totalData,
    sortField: state?.WorkflowGroup?.sortField,
    pageSize: state?.WorkflowGroup?.pageSize,
  }),
  {
    actSaveSelectedWorkflowGroup,
    actSetSortField,
    actSetPageSize,
  },
)(WorkflowGroup);
