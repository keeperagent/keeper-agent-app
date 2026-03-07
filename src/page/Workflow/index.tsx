import { useEffect, useState, useMemo, ComponentType } from "react";
import HighlighterLib, { HighlighterProps } from "react-highlight-words";
import qs from "qs";
import _ from "lodash";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import {
  Button,
  PaginationProps,
  Table,
  Tooltip,
  Popconfirm,
  Select,
  Dropdown,
} from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { connect } from "react-redux";
import { actSetPageName } from "@/redux/layout";
import { ICampaign, IWorkflow, ISorter } from "@/electron/type";
import { formatTime, trimText } from "@/service/util";
import { DeleteButton, UploadButton } from "@/component/Button";
import { SearchInput, TotalData, Workflow, ColorPicker } from "@/component";
import { RootState } from "@/redux/store";
import {
  actSaveSelectedWorkflow,
  actSetSortField,
  actSetPageSize,
} from "@/redux/workflow";
import { actSaveSelectedCampaign } from "@/redux/campaign";
import {
  useDeleteWorkflow,
  useGetListWorkflow,
  useGetOneWorkflow,
  useTranslation,
  useCreateWorkflow,
  useUpdateWorkflow,
} from "@/hook";
import {
  EditIcon,
  ScriptIcon,
  CopyBoldIcon,
  DownArrowIcon,
  UpArrowIcon,
} from "@/component/Icon";
import { EMPTY_STRING } from "@/config/constant";
import { SORT_ORDER } from "@/electron/constant";
import {
  PageWrapper,
  IconHighlightWrapper,
  LinkHoverWrapper,
  OptionWrapper,
  ExpandRowWrapper,
  ExpandIconWrapper,
} from "./style";
import ModalWorkflow from "./ModalWorkflow";
import ModalImportWorkflow from "./ModalImportWorkflow";
import ModalExportWorkflow from "./ModalExportWorkflow";

const Highlighter = HighlighterLib as ComponentType<HighlighterProps>;
let searchTimeOut: any = null;

const renderColumns = (
  onViewWorkflow: (workflow: IWorkflow) => void,
  onDuplicateWorkflow: (workflow: IWorkflow) => void,
  onEditWorkflow: (workflow: IWorkflow) => void,
  searchText: string,
  translate: any,
  locale: string,
  onUpdateColor: (workflow: IWorkflow, color: string) => void,
) => [
  {
    title: translate("indexTable"),
    dataIndex: "index",
    width: "5%",
  },
  {
    title: "",
    dataIndex: "color",
    width: "3%",
    align: "center",
    render: (color: string, record: IWorkflow) => (
      <ColorPicker
        color={color}
        setColor={(color: string) => onUpdateColor(record, color)}
      />
    ),
  },
  {
    title: translate("workflow.name"),
    dataIndex: "name",
    width: "43%",
    render: (value: string, record: IWorkflow) => (
      <LinkHoverWrapper onClick={() => onEditWorkflow(record)}>
        <div className="name">
          <Highlighter
            textToHighlight={record?.name || EMPTY_STRING}
            searchWords={[searchText]}
            highlightClassName="highlight"
          />
        </div>

        <div className="note">
          <Highlighter
            textToHighlight={trimText(record?.note || "", 70)}
            searchWords={[searchText]}
            highlightClassName="highlight"
          />
        </div>
      </LinkHoverWrapper>
    ),
  },
  {
    title: translate("usedBy"),
    dataIndex: "totalUsed",
    width: "13%",
    render: (value: any, record: IWorkflow) => {
      const listCampaign = record?.listCampaign || [];
      const element = (
        <span>
          <span style={{ color: "var(--color-primary)", fontWeight: 600 }}>
            {listCampaign?.length}
          </span>{" "}
          <span style={{ fontSize: "1.2rem", marginLeft: "0.5rem" }}>
            {translate("campaign")}
          </span>
        </span>
      );
      if (listCampaign?.length === 0) {
        return element;
      }

      const items = listCampaign?.map((campaign: ICampaign, index: number) => ({
        key: index,
        label: (
          <OptionWrapper>
            <Link
              to={`/dashboard/campaign?campaignId=${campaign?.id}&workflowId=${record?.id}&mode=VIEW_WORKFLOW`}
            >
              <div className="name">
                {index + 1}. {campaign?.name}
              </div>
              <div className="description">
                {formatTime(Number(campaign?.createAt), locale)}
              </div>
            </Link>
          </OptionWrapper>
        ),
      }));

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
    title: translate("updatedAt"),
    dataIndex: "updateAt",
    width: "15%",
    render: (value: number) => formatTime(Number(value), locale),
  },
  {
    title: "",
    render: (text: any, record: any) => (
      <div className="list-icon">
        <Tooltip title={translate("workflow.duplicate")}>
          <IconHighlightWrapper onClick={() => onDuplicateWorkflow(record)}>
            <CopyBoldIcon />
          </IconHighlightWrapper>
        </Tooltip>

        <Tooltip title={translate("workflow.viewWorkflow")}>
          <IconHighlightWrapper onClick={() => onEditWorkflow(record)}>
            <ScriptIcon />
          </IconHighlightWrapper>
        </Tooltip>

        <EditIcon onClick={() => onViewWorkflow(record)} />
      </div>
    ),
  },
];

const ManageWorkflow = (props: any) => {
  const { totalData, listWorkflow, sortField, pageSize = 30 } = props;

  const { translate, locale } = useTranslation();
  const [page, onSetPage] = useState(1);
  const [searchText, onSetSearchText] = useState("");
  const [isModalOpen, setModalOpen] = useState(false);
  const [isBtnLoading, setBtnLoading] = useState(false);
  const [selectedRowKeys, onSetSelectedRowKeys] = useState([]);
  const [isModalImportOpen, setModalImportOpen] = useState(false);
  const [isModalExportOpen, setModalExportOpen] = useState(false);
  const [shouldRefetch, setShouldRefetch] = useState(false);

  const listSortField = useMemo(
    () => [
      {
        label: translate("workflow.name"),
        value: "name",
      },
      {
        label: translate("color"),
        value: "color",
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

  const location = useLocation();
  const navigate = useNavigate();
  const { pathname, search } = location;
  const { workflowId } = qs.parse(search, { ignoreQueryPrefix: true });

  const { getListWorkflow, loading: getDataLoading } = useGetListWorkflow();
  const {
    isSuccess,
    loading: isDeleteLoading,
    deleteWorkflow,
  } = useDeleteWorkflow();
  const { createWorkflow } = useCreateWorkflow();
  const { updateWorkflow } = useUpdateWorkflow();
  const { getOneWorkflow } = useGetOneWorkflow();

  useEffect(() => {
    props?.actSetPageName(translate("sidebar.workflow"));
  }, [translate]);

  useEffect(() => {
    props?.actSaveSelectedCampaign(null);
  }, []);

  useEffect(() => {
    if (workflowId) {
      getOneWorkflow(Number(workflowId));
    } else {
      props?.actSaveSelectedWorkflow(null);
    }
  }, [workflowId]);

  const dataSource: any[] = useMemo(() => {
    return listWorkflow?.map((workflow: IWorkflow, index: number) => ({
      ...workflow,
      index: (page - 1) * pageSize + index + 1,
    }));
  }, [listWorkflow, page, pageSize]);

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

  const onViewWorkflow = (workflow: IWorkflow) => {
    props?.actSaveSelectedWorkflow(workflow);
    setModalOpen(true);
  };

  const onDuplicateWorkflow = async (workflow: IWorkflow) => {
    let newWorkflow = _.pick(workflow, [
      "name",
      "note",
      "data",
      "numberOfThread",
      "numberOfRound",
      "color",
      "listVariable",
    ]);
    newWorkflow = {
      ...newWorkflow,
      name: `${newWorkflow?.name} - ${dayjs().format("DD-MM-YYYY HH:mm:ss")}`,
    };
    await createWorkflow(newWorkflow);
  };

  const onUpdateColor = async (workflow: IWorkflow, color: string) => {
    await updateWorkflow({ ...workflow, color });
  };

  const onEditWorkflow = (workflow: IWorkflow) => {
    navigate(`${pathname}?workflowId=${workflow?.id}`);
  };

  const onOpenModalWorkflow = () => {
    setModalOpen(true);
  };

  const onDeleteWorkflowGroup = () => {
    setBtnLoading(true);
    deleteWorkflow(selectedRowKeys);
  };

  useEffect(() => {
    clearTimeout(searchTimeOut);
    searchTimeOut = setTimeout(() => {
      getListWorkflow({ page, pageSize, searchText, sortField });
    }, 200);
  }, [searchText, page, pageSize, sortField]);

  useEffect(() => {
    if (getDataLoading && shouldRefetch) {
      setShouldRefetch(false);
    }
  }, [getDataLoading, shouldRefetch]);

  useEffect(() => {
    if (shouldRefetch) {
      getListWorkflow({ page, pageSize, searchText, sortField });
    }
  }, [page, pageSize, searchText, sortField, shouldRefetch]);

  useEffect(() => {
    if (!isDeleteLoading && isSuccess) {
      onSetSelectedRowKeys([]);
      setShouldRefetch(true);

      setTimeout(() => {
        setBtnLoading(false);
      }, 3000);
    }
  }, [isDeleteLoading, isSuccess]);

  const isWorkflow = useMemo(() => {
    return workflowId !== undefined;
  }, [workflowId]);

  if (isWorkflow) {
    return <Workflow />;
  }

  const onOpenModalImport = () => {
    setModalImportOpen(true);
  };

  const onOpenModalExport = () => {
    setModalExportOpen(true);
  };

  const onChangeSortField = (value: string) => {
    props?.actSetSortField({ field: value } as ISorter);
  };

  const onChangeSortOrder = (value: string) => {
    props?.actSetSortField({ order: value } as ISorter);
  };

  const expandedRowRender = (record: IWorkflow) => {
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

  return (
    <PageWrapper>
      <title>{translate("sidebar.workflow")}</title>

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

        <UploadButton
          text="Import"
          onClick={onOpenModalImport}
          isUploadButton={false}
          style={{ marginRight: "var(--margin-right)" }}
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
          onClick={onOpenModalWorkflow}
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
              {translate("workflow.confirm.deleteGroupWorkflow")}
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
            />
          </span>
        </Popconfirm>
      </div>

      <Table
        rowSelection={rowSelection}
        rowKey={(data) => data?.id!}
        dataSource={dataSource}
        // @ts-ignore
        columns={renderColumns(
          onViewWorkflow,
          onDuplicateWorkflow,
          onEditWorkflow,
          searchText,
          translate,
          locale,
          onUpdateColor,
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
        expandable={{
          expandedRowRender,
          expandIcon: renderExpandIcon,
        }}
        scroll={{ x: 900, y: "70vh" }}
        loading={getDataLoading}
        onChange={onTableChange}
        size="middle"
      />

      <ModalWorkflow isModalOpen={isModalOpen} setModalOpen={setModalOpen} />
      <ModalImportWorkflow
        isModalOpen={isModalImportOpen}
        setModalOpen={setModalImportOpen}
        setShouldRefetch={setShouldRefetch}
      />
      <ModalExportWorkflow
        isModalOpen={isModalExportOpen}
        setModalOpen={setModalExportOpen}
        selectedRowKeys={selectedRowKeys}
      />
    </PageWrapper>
  );
};

export default connect(
  (state: RootState) => ({
    listWorkflow: state?.Workflow?.listWorkflow,
    totalData: state?.Workflow?.totalData,
    sortField: state?.Workflow?.sortField,
    pageSize: state?.Workflow?.pageSize,
  }),
  {
    actSaveSelectedWorkflow,
    actSetPageName,
    actSaveSelectedCampaign,
    actSetSortField,
    actSetPageSize,
  },
)(ManageWorkflow);
