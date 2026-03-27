import { Fragment, useEffect, useState, ComponentType, ReactNode } from "react";
import { PaginationProps, Table, Popconfirm, Select, Tag, Tooltip } from "antd";
import HighlighterLib, { HighlighterProps } from "react-highlight-words";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { connect } from "react-redux";
import {
  AppLogType,
  AgentTaskStatus,
  AgentScheduleStatus,
  IAppLog,
} from "@/electron/type";
import { formatTimeToDate } from "@/service/util";
import {
  collapseResultToOneLine,
  normalizeAgentMessageContent,
} from "@/service/agentMessageContent";
import { DeleteButton } from "@/component/Button";
import { SearchInput, TotalData } from "@/component";
import { SettingIcon } from "@/component/Icon";
import { RootState } from "@/redux/store";
import { actSetAppLogPageSize } from "@/redux/appLog";
import { useGetListAppLog, useDeleteAppLog, useTranslation } from "@/hook";
import { TABLE_PAGE_OPTION, EMPTY_STRING } from "@/config/constant";
import { MESSAGE } from "@/electron/constant";
import {
  PageWrapper,
  ActorCellWrapper,
  TimeCellWrapper,
  DetailsCellWrapper,
  ResultTooltip,
} from "./style";
import ModalConfigLog from "./ModalConfigLog";

const Highlighter = HighlighterLib as ComponentType<HighlighterProps>;

let searchTimeOut: any = null;
let refreshInterval: any = null;

const formatDuration = (startedAt?: number, finishedAt?: number): string => {
  if (!startedAt || !finishedAt) {
    return "";
  }
  const ms = finishedAt - startedAt;
  if (ms < 1000) {
    return `${ms}ms`;
  }
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainSeconds = seconds % 60;
  return `${minutes}m ${remainSeconds}s`;
};

const LOG_TYPE_TAG_COLOR: Record<AppLogType, string> = {
  [AppLogType.WORKFLOW]: "purple",
  [AppLogType.SCHEDULE]: "blue",
  [AppLogType.TASK]: "cyan",
  [AppLogType.MCP]: "orange",
};

const LOG_TYPE_TAG_LABEL: Record<AppLogType, string> = {
  [AppLogType.WORKFLOW]: "Workflow",
  [AppLogType.SCHEDULE]: "Schedule",
  [AppLogType.TASK]: "Task",
  [AppLogType.MCP]: "MCP",
};

const STATUS_LABEL_MAP: Record<string, string> = {
  running: "Running",
  success: "Success",
  error: "Error",
  skipped: "Skipped",
  retrying: "Retrying",
  DONE: "Done",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
  IN_PROGRESS: "In Progress",
  INIT: "Pending",
  AWAITING_APPROVAL: "Awaiting",
  ASSIGNED: "Assigned",
  approved: "Approved",
  denied: "Denied",
};

const STATUS_TAG_COLOR: Record<string, string> = {
  [AgentScheduleStatus.RUNNING]: "blue",
  [AgentScheduleStatus.SUCCESS]: "green",
  [AgentScheduleStatus.ERROR]: "red",
  [AgentScheduleStatus.SKIPPED]: "default",
  [AgentScheduleStatus.RETRYING]: "gold",
  [AgentTaskStatus.DONE]: "green",
  [AgentTaskStatus.FAILED]: "red",
  [AgentTaskStatus.CANCELLED]: "default",
  [AgentTaskStatus.IN_PROGRESS]: "blue",
  [AgentTaskStatus.INIT]: "blue",
  approved: "green",
  denied: "red",
};

const renderLogStatus = (log: IAppLog) => {
  const status = log.status;
  if (!status) {
    return null;
  }

  const label = STATUS_LABEL_MAP[status] || status;
  const tagColor = STATUS_TAG_COLOR[status];

  return (
    <Tag
      color={tagColor || "default"}
      style={{ fontSize: "1.1rem", margin: 0 }}
    >
      {label}
    </Tag>
  );
};

const resultMarkdownComponents = {
  a: ({ href, children }: { href?: string; children?: ReactNode }) => (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault();
        if (href) {
          window?.electron?.send(MESSAGE.OPEN_EXTERNAL_LINK, { url: href });
        }
      }}
    >
      {children}
    </a>
  ),
};

const renderDetails = (log: IAppLog, searchText: string) => {
  let primary = "";
  let secondary = "";
  let secondaryMono = false;
  let fullContent = "";

  if (log.logType === AppLogType.WORKFLOW) {
    primary = log.message || EMPTY_STRING;
    secondary = [log.campaign?.name, log.workflow?.name]
      .filter(Boolean)
      .join(" › ");
    fullContent = normalizeAgentMessageContent(log.message || "");
  } else if (log.logType === AppLogType.SCHEDULE) {
    primary = log.schedule?.name || `Schedule #${log.scheduleId}`;
    const resultText = log.result
      ? normalizeAgentMessageContent(log.result)
      : null;
    fullContent = resultText || log.errorMessage || "";
    secondary = fullContent
      ? collapseResultToOneLine(fullContent)
      : EMPTY_STRING;
  } else if (log.logType === AppLogType.TASK) {
    primary = log.action || "task_event";
    secondary = log.message || EMPTY_STRING;
    fullContent = log.message || "";
  } else if (log.logType === AppLogType.MCP) {
    primary = log.action || "tool_call";
    secondary = log.message || EMPTY_STRING;
    secondaryMono = true;
    fullContent = log.message || "";
  }

  const cell = (
    <DetailsCellWrapper>
      <span className="primary">
        <Highlighter
          textToHighlight={primary}
          searchWords={[searchText]}
          highlightClassName="highlight"
        />
      </span>

      {secondary && (
        <span className={`secondary${secondaryMono ? " mono" : ""}`}>
          <Highlighter
            textToHighlight={secondary}
            searchWords={[searchText]}
            highlightClassName="highlight"
          />
        </span>
      )}
    </DetailsCellWrapper>
  );

  if (!fullContent) {
    return cell;
  }

  return (
    <Tooltip
      overlayStyle={{ maxWidth: "35vw" }}
      title={
        <ResultTooltip>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={resultMarkdownComponents}
          >
            {fullContent}
          </ReactMarkdown>
        </ResultTooltip>
      }
    >
      {cell}
    </Tooltip>
  );
};

const renderActorWithType = (log: IAppLog) => {
  const name = log.actorName || log.actorType;
  const tagColor = LOG_TYPE_TAG_COLOR[log.logType];
  const tagLabel = LOG_TYPE_TAG_LABEL[log.logType] || log.logType;

  return (
    <ActorCellWrapper>
      <div className="actor-row">
        <span className="actor-name">{name || EMPTY_STRING}</span>
      </div>

      <Tag color={tagColor} bordered={false} className="log-type-tag">
        {tagLabel}
      </Tag>
    </ActorCellWrapper>
  );
};

const renderTimeCell = (log: IAppLog) => {
  const duration = formatDuration(log.startedAt, log.finishedAt);
  return (
    <TimeCellWrapper>
      <span className="time-created">
        {formatTimeToDate(log.createAt || 0)}
      </span>

      {duration && <span className="time-duration">took {duration}</span>}
    </TimeCellWrapper>
  );
};

const LOG_TYPE_OPTIONS = [
  { label: "All types", value: "" },
  { label: "Workflow", value: AppLogType.WORKFLOW },
  { label: "Schedule", value: AppLogType.SCHEDULE },
  { label: "Task", value: AppLogType.TASK },
  { label: "MCP", value: AppLogType.MCP },
];

const ActivityLogPage = (props: any) => {
  const { listAppLog, totalData, pageSize = TABLE_PAGE_OPTION[0] } = props;

  const { translate } = useTranslation();
  const [page, onSetPage] = useState(1);
  const [searchText, onSetSearchText] = useState("");
  const [logType, setLogType] = useState<AppLogType | "">("");
  const [selectedRowKeys, onSetSelectedRowKeys] = useState<number[]>([]);
  const [isBtnLoading, setBtnLoading] = useState(false);
  const [shouldRefetch, setShouldRefetch] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);

  const { getListAppLog, loading: getDataLoading } = useGetListAppLog();
  const {
    deleteAppLog,
    loading: isDeleteLoading,
    isSuccess,
  } = useDeleteAppLog();

  const fetchData = () => {
    getListAppLog({
      page,
      pageSize,
      searchText,
      logType: logType || undefined,
    });
  };

  useEffect(() => {
    clearTimeout(searchTimeOut);
    searchTimeOut = setTimeout(fetchData, 200);

    clearInterval(refreshInterval);
    refreshInterval = setInterval(fetchData, 30000);

    return () => {
      clearTimeout(searchTimeOut);
      clearInterval(refreshInterval);
    };
  }, [searchText, page, pageSize, logType]);

  useEffect(() => {
    if (shouldRefetch) {
      setShouldRefetch(false);
      fetchData();
    }
  }, [shouldRefetch]);

  useEffect(() => {
    if (!isDeleteLoading && isSuccess) {
      onSetSelectedRowKeys([]);
      setShouldRefetch(true);
      setTimeout(() => setBtnLoading(false), 3000);
    }
  }, [isDeleteLoading, isSuccess]);

  const dataSource = listAppLog?.map((log: IAppLog, index: number) => ({
    ...log,
    index: (page - 1) * pageSize + index + 1,
  }));

  const onTableChange = (pagination?: PaginationProps) => {
    if (pagination?.current !== page) {
      onSetPage(pagination?.current!);
    }
    if (pagination?.pageSize !== pageSize) {
      props.actSetAppLogPageSize(pagination?.pageSize!);
    }
  };

  const onDeleteLog = () => {
    setBtnLoading(true);
    deleteAppLog(selectedRowKeys);
  };

  const onShowTotalData = () => {
    let text = `${translate("total")} ${totalData} ${translate("data")}`;
    if (selectedRowKeys?.length > 0) {
      text += `. ${selectedRowKeys?.length} ${translate("data")} ${translate("selected")}`;
    }

    return <TotalData text={text} />;
  };

  const columns = [
    {
      title: translate("activityLog.actor"),
      dataIndex: "actorName",
      width: "20%",
      render: (_: any, record: IAppLog) => renderActorWithType(record),
    },
    {
      title: translate("activityLog.details"),
      dataIndex: "message",
      width: "48%",
      render: (_: any, record: IAppLog) => renderDetails(record, searchText),
    },
    {
      title: translate("activityLog.status"),
      dataIndex: "status",
      width: "12%",
      align: "center" as const,
      render: (_: any, record: IAppLog) => renderLogStatus(record),
    },
    {
      title: translate("createdAt"),
      dataIndex: "createAt",
      width: "20%",
      render: (_: any, record: IAppLog) => renderTimeCell(record),
    },
  ];

  return (
    <Fragment>
      <PageWrapper>
        <title>{translate("sidebar.activityLog")}</title>

        <div className="heading">
          <SearchInput
            onChange={onSetSearchText}
            value={searchText}
            placeholder={translate("button.search")}
            style={{ width: "30rem" }}
          />

          <Select
            className="custom-select"
            size="large"
            style={{ width: "16rem" }}
            value={logType}
            onChange={setLogType}
            options={LOG_TYPE_OPTIONS}
          />

          <Tooltip title={translate("workflow.setting")}>
            <div className="setting" onClick={() => setModalOpen(true)}>
              <SettingIcon />
            </div>
          </Tooltip>

          <Popconfirm
            title={
              <span style={{ width: "30rem", display: "block" }}>
                {translate("confirmDelete")}
              </span>
            }
            onConfirm={onDeleteLog}
            placement="left"
            disabled={selectedRowKeys?.length === 0}
          >
            <span style={{ marginLeft: "auto" }}>
              <DeleteButton
                text={translate("button.delete")}
                loading={isBtnLoading}
              />
            </span>
          </Popconfirm>
        </div>

        <Table
          tableLayout="fixed"
          rowSelection={{
            selectedRowKeys,
            onChange: (keys: any) => onSetSelectedRowKeys(keys),
          }}
          rowKey={(record: IAppLog) => record?.id?.toString() || ""}
          dataSource={dataSource}
          columns={columns}
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
          scroll={{ x: 900, y: "75vh" }}
          loading={getDataLoading}
          onChange={onTableChange}
          size="small"
        />

        <ModalConfigLog isModalOpen={isModalOpen} setModalOpen={setModalOpen} />
      </PageWrapper>
    </Fragment>
  );
};

export default connect(
  (state: RootState) => ({
    listAppLog: state?.AppLog?.listAppLog,
    totalData: state?.AppLog?.totalData,
    pageSize: state?.AppLog?.pageSize,
  }),
  { actSetAppLogPageSize },
)(ActivityLogPage);
