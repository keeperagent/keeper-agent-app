import { Fragment, useEffect, useState, ComponentType, ReactNode } from "react";
import { PaginationProps, Table, Popconfirm, Select, Tooltip } from "antd";
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
import { SearchInput, TotalData, Status } from "@/component";
import { SettingIcon } from "@/component/Icon";
import { RootState } from "@/redux/store";
import { actSetAppLogPageSize } from "@/redux/appLog";
import { useGetListAppLog, useDeleteAppLog, useTranslation } from "@/hook";
import { TABLE_PAGE_OPTION, EMPTY_STRING } from "@/config/constant";
import { MESSAGE } from "@/electron/constant";
import { PageWrapper, DetailsCellWrapper, ResultTooltip } from "./style";
import ModalConfigLog from "./ModalConfigLog";

const Highlighter = HighlighterLib as ComponentType<HighlighterProps>;

let searchTimeOut: any = null;
let refreshInterval: any = null;

const formatDuration = (startedAt?: number, finishedAt?: number): string => {
  if (!startedAt || !finishedAt) {
    return EMPTY_STRING;
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

const renderLogTypeBadge = (logType: AppLogType) => {
  const map: Record<AppLogType, { label: string; bg: string; color: string }> =
    {
      [AppLogType.WORKFLOW]: {
        label: "Workflow",
        bg: "var(--background-pink)",
        color: "var(--color-pink)",
      },
      [AppLogType.SCHEDULE]: {
        label: "Schedule",
        bg: "var(--background-blue)",
        color: "var(--color-blue)",
      },
      [AppLogType.TASK]: {
        label: "Task",
        bg: "var(--background-success)",
        color: "var(--color-success)",
      },
      [AppLogType.MCP]: {
        label: "MCP",
        bg: "var(--background-yellow)",
        color: "var(--color-yellow)",
      },
    };

  const style = map[logType] || {
    label: logType,
    bg: "var(--background-blue)",
    color: "var(--color-blue)",
  };

  return (
    <Status
      content={style.label}
      style={{ background: style.bg, color: style.color }}
    />
  );
};

const renderLogStatus = (log: IAppLog) => {
  const status = log.status;
  if (!status) {
    return (
      <span style={{ color: "var(--color-text-secondary)" }}>
        {EMPTY_STRING}
      </span>
    );
  }

  const statusMap: Record<string, { bg: string; color: string }> = {
    [AgentScheduleStatus.RUNNING]: {
      bg: "var(--background-blue)",
      color: "var(--color-blue)",
    },
    [AgentScheduleStatus.SUCCESS]: {
      bg: "var(--background-success)",
      color: "var(--color-success)",
    },
    [AgentScheduleStatus.ERROR]: {
      bg: "var(--background-error)",
      color: "var(--color-error)",
    },
    [AgentScheduleStatus.SKIPPED]: {
      bg: "var(--color-text-secondary)",
      color: "var(--color-text-primary)",
    },
    [AgentScheduleStatus.RETRYING]: {
      bg: "var(--background-yellow)",
      color: "var(--color-yellow)",
    },
    [AgentTaskStatus.DONE]: {
      bg: "var(--background-success)",
      color: "var(--color-success)",
    },
    [AgentTaskStatus.FAILED]: {
      bg: "var(--background-error)",
      color: "var(--color-error)",
    },
    [AgentTaskStatus.CANCELLED]: {
      bg: "var(--color-text-secondary)",
      color: "var(--color-text-primary)",
    },
    [AgentTaskStatus.IN_PROGRESS]: {
      bg: "var(--background-blue)",
      color: "var(--color-blue)",
    },
    [AgentTaskStatus.INIT]: {
      bg: "var(--background-blue)",
      color: "var(--color-blue)",
    },
    approved: {
      bg: "var(--background-success)",
      color: "var(--color-success)",
    },
    denied: { bg: "var(--background-error)", color: "var(--color-error)" },
  };

  const style = statusMap[status];
  if (!style) {
    return (
      <span style={{ color: "var(--color-text-secondary)" }}>{status}</span>
    );
  }

  return (
    <span style={{ display: "flex", justifyContent: "center" }}>
      <Status
        content={status}
        style={{ background: style.bg, color: style.color }}
      />
    </span>
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
  let tooltip: string | null = null;

  if (log.logType === AppLogType.WORKFLOW) {
    primary = log.message || EMPTY_STRING;
    secondary = [log.campaign?.name, log.workflow?.name]
      .filter(Boolean)
      .join(" › ");
  } else if (log.logType === AppLogType.SCHEDULE) {
    primary = log.schedule?.name || `Schedule #${log.scheduleId}`;
    const resultText = log.result
      ? normalizeAgentMessageContent(log.result)
      : null;
    const errorText = log.errorMessage;
    const rawDetail = resultText || errorText || "";
    secondary = rawDetail ? collapseResultToOneLine(rawDetail) : EMPTY_STRING;
    if (rawDetail.length > secondary.length) {
      tooltip = rawDetail;
    }
  } else if (log.logType === AppLogType.TASK) {
    primary = log.action || "task_event";
    secondary = log.message || EMPTY_STRING;
  } else if (log.logType === AppLogType.MCP) {
    primary = log.action || "tool_call";
    secondary = log.message || EMPTY_STRING;
    secondaryMono = true;
  }

  const primaryNode = (
    <Highlighter
      textToHighlight={primary}
      searchWords={[searchText]}
      highlightClassName="highlight"
    />
  );

  const secondaryNode = tooltip ? (
    <Tooltip
      overlayStyle={{ maxWidth: "50vw" }}
      title={
        <ResultTooltip>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={resultMarkdownComponents}
          >
            {tooltip}
          </ReactMarkdown>
        </ResultTooltip>
      }
    >
      <span className={`secondary${secondaryMono ? " mono" : ""}`}>
        <Highlighter
          textToHighlight={secondary}
          searchWords={[searchText]}
          highlightClassName="highlight"
        />
      </span>
    </Tooltip>
  ) : (
    <span className={`secondary${secondaryMono ? " mono" : ""}`}>
      <Highlighter
        textToHighlight={secondary}
        searchWords={[searchText]}
        highlightClassName="highlight"
      />
    </span>
  );

  return (
    <DetailsCellWrapper>
      <span className="primary">{primaryNode}</span>
      {secondary && secondaryNode}
    </DetailsCellWrapper>
  );
};

const renderActor = (log: IAppLog) => {
  const name = log.actorName || log.actorType;
  if (!name) {
    return (
      <span style={{ color: "var(--color-text-secondary)" }}>
        {EMPTY_STRING}
      </span>
    );
  }
  return <span>{name}</span>;
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
      title: translate("createdAt"),
      dataIndex: "createAt",
      width: "12%",
      render: (createAt: number) => (
        <span
          style={{
            fontSize: "1.2rem",
            color: "var(--color-text-secondary)",
            whiteSpace: "nowrap",
          }}
        >
          {formatTimeToDate(createAt)}
        </span>
      ),
    },
    {
      title: translate("activityLog.type"),
      dataIndex: "logType",
      width: "8%",
      render: (logType: AppLogType) => renderLogTypeBadge(logType),
    },
    {
      title: translate("activityLog.actor"),
      dataIndex: "actorName",
      width: "15%",
      ellipsis: true,
      render: (_: any, record: IAppLog) => renderActor(record),
    },
    {
      title: translate("activityLog.details"),
      dataIndex: "message",
      width: "45%",
      render: (_: any, record: IAppLog) => renderDetails(record, searchText),
    },
    {
      title: translate("activityLog.status"),
      dataIndex: "status",
      width: "10%",
      align: "center" as const,
      render: (_: any, record: IAppLog) => renderLogStatus(record),
    },
    {
      title: translate("activityLog.duration"),
      dataIndex: "startedAt",
      width: "10%",
      align: "right" as const,
      render: (_: any, record: IAppLog) => (
        <span
          style={{ fontSize: "1.2rem", color: "var(--color-text-secondary)" }}
        >
          {formatDuration(record.startedAt, record.finishedAt)}
        </span>
      ),
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
            <span>
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
          scroll={{ x: 900, y: "calc(100vh - 20rem)" }}
          loading={getDataLoading}
          onChange={onTableChange}
          size="middle"
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
