import {
  useEffect,
  useState,
  useMemo,
  ComponentType,
  type ReactNode,
} from "react";
import {
  PaginationProps,
  Table,
  Popconfirm,
  Select,
  Tooltip,
  Popover,
  Segmented,
} from "antd";
import qs from "qs";
import HighlighterLib, { HighlighterProps } from "react-highlight-words";
import { connect } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AgentScheduleStatus,
  AppLogType,
  ICampaign,
  ISchedule,
  IAppLog,
  JobType,
  ScheduleType,
} from "@/electron/type";
import { formatTimeToDate } from "@/service/util";
import { normalizeAgentMessageContent } from "@/service/agentMessageContent";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { DeleteButton } from "@/component/Button";
import { SearchInput, TotalData, Status } from "@/component";
import { SettingIcon } from "@/component/Icon";
import { RootState } from "@/redux/store";
import { actSetAppLogPageSize } from "@/redux/appLog";
import {
  useDeleteAppLog,
  useGetListAppLog,
  useGetListSchedule,
  useTranslation,
} from "@/hook";
import {
  DEFAULT_COLOR_PICKER,
  EMPTY_STRING,
  TABLE_PAGE_OPTION,
} from "@/config/constant";
import { MESSAGE, SCHEDULE_LOG_ACTION } from "@/electron/constant";
import {
  PageWrapper,
  NameWrapper,
  CampaignWorkflowWrapper,
  EventCellWrapper,
  ResultCellPreview,
  ResultMarkdownTooltip,
} from "./style";
import ModalConfigLog from "./ModalConfigLog";

const Highlighter = HighlighterLib as ComponentType<HighlighterProps>;

let searchTimeOut: any = null;
let searchScheduleTimeOut: any = null;
let getDataInterval: any = null;
const { Option } = Select;

type ILogTypeCell = {
  content: string;
  backgroundColor: string;
  textColor: string;
};

type IStatusCell = {
  content: string;
  bg: string;
  color: string;
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

const renderScheduleLogType = (
  logType: string | undefined,
  translate: (key: string) => string,
): ILogTypeCell => {
  if (!logType) {
    return {
      content: EMPTY_STRING,
      backgroundColor: "transparent",
      textColor: "var(--color-text-secondary)",
    };
  }

  const workflowLabel = translate("schedule.typeWorkflow");
  const agentLabel = translate("schedule.typeAgent");

  if (logType === SCHEDULE_LOG_ACTION.JOB_START) {
    return {
      content: `${workflowLabel} - ${translate("scheduleLog.eventStart")}`,
      backgroundColor: "var(--background-success)",
      textColor: "var(--color-success)",
    };
  }
  if (logType === SCHEDULE_LOG_ACTION.JOB_COMPLETED) {
    return {
      content: `${workflowLabel} - ${translate("scheduleLog.eventCompleted")}`,
      backgroundColor: "var(--background-blue)",
      textColor: "var(--color-blue)",
    };
  }
  if (logType === SCHEDULE_LOG_ACTION.JOB_TIMEOUT) {
    return {
      content: `${workflowLabel} - ${translate("scheduleLog.eventTimeout")}`,
      backgroundColor: "var(--background-error)",
      textColor: "var(--color-error)",
    };
  }
  if (logType === ScheduleType.AGENT) {
    return {
      content: agentLabel,
      backgroundColor: "var(--background-blue)",
      textColor: "var(--color-blue)",
    };
  }
  if (logType === ScheduleType.WORKFLOW) {
    return {
      content: workflowLabel,
      backgroundColor: "var(--background-pink)",
      textColor: "var(--color-pink)",
    };
  }
  return {
    content: logType,
    backgroundColor: "var(--background-blue)",
    textColor: "var(--color-blue)",
  };
};

const renderAgentStatus = (
  status: AgentScheduleStatus | string | undefined,
  translate: (key: string) => string,
): IStatusCell => {
  const map: Record<string, IStatusCell> = {
    [AgentScheduleStatus.RUNNING]: {
      content: translate("scheduleLog.statusRunning"),
      bg: "var(--background-blue)",
      color: "var(--color-blue)",
    },
    [AgentScheduleStatus.SUCCESS]: {
      content: translate("scheduleLog.statusSuccess"),
      bg: "var(--background-success)",
      color: "var(--color-success)",
    },
    [AgentScheduleStatus.ERROR]: {
      content: translate("scheduleLog.statusError"),
      bg: "var(--background-error)",
      color: "var(--color-error)",
    },
    [AgentScheduleStatus.SKIPPED]: {
      content: translate("scheduleLog.statusSkipped"),
      bg: "var(--color-text-secondary)",
      color: "var(--color-text-primary)",
    },
    [AgentScheduleStatus.RETRYING]: {
      content: translate("scheduleLog.statusRetrying"),
      bg: "var(--background-yellow)",
      color: "var(--color-yellow)",
    },
  };

  const row = map[status || ""];

  if (!status || !row) {
    return {
      content: EMPTY_STRING,
      bg: "",
      color: "",
    };
  }
  return row;
};

const renderColumns = (
  searchText: string,
  translate: any,
  onViewWorkflow: (campaignId: number, workflowId: number) => void,
  onViewCampaign: (campaignId: number) => void,
) => [
  {
    title: translate("indexTable"),
    dataIndex: "index",
    width: 60,
    fixed: "left",
  },
  {
    title: translate("sidebar.schedule"),
    dataIndex: "schedule",
    width: 300,
    render: (schedule: ISchedule, record: IAppLog) => {
      const typeStyled = renderScheduleLogType(record.action, translate);

      return (
        <EventCellWrapper>
          <div className="event-left">
            <Tooltip title={schedule?.name}>
              <span className="schedule-name">{schedule?.name}</span>
            </Tooltip>
            <div className="event-time">
              {formatTimeToDate(Number(record.createAt))}
            </div>
          </div>

          <Status
            content={typeStyled.content}
            style={{
              background: typeStyled.backgroundColor,
              color: typeStyled.textColor,
            }}
          />
        </EventCellWrapper>
      );
    },
  },
  {
    title: `${translate("scheduleLog.result")} / ${translate("scheduleLog.error")}`,
    dataIndex: "result",
    width: 450,
    render: (result: string, record: IAppLog) => {
      if (result) {
        const normalized = normalizeAgentMessageContent(result);

        return (
          <Popover
            overlayStyle={{ maxWidth: "50vw" }}
            content={
              <ResultMarkdownTooltip>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={resultMarkdownComponents}
                >
                  {normalized}
                </ReactMarkdown>
              </ResultMarkdownTooltip>
            }
          >
            <ResultCellPreview style={{ cursor: "pointer" }}>
              {normalized}
            </ResultCellPreview>
          </Popover>
        );
      }

      if (record?.errorMessage) {
        return (
          <Popover
            overlayStyle={{ maxWidth: "50vw" }}
            trigger="click"
            content={
              <ResultMarkdownTooltip>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {record?.errorMessage}
                </ReactMarkdown>
              </ResultMarkdownTooltip>
            }
          >
            <ResultCellPreview
              style={{ color: "var(--color-error)", cursor: "pointer" }}
            >
              {record?.errorMessage}
            </ResultCellPreview>
          </Popover>
        );
      }

      return (
        <span style={{ color: "var(--color-text-secondary)" }}>
          {EMPTY_STRING}
        </span>
      );
    },
  },
  {
    title: translate("scheduleLog.status"),
    dataIndex: "status",
    width: 100,
    align: "center",
    render: (status: string | undefined) => {
      const styled = renderAgentStatus(status, translate);
      if (!styled.bg) {
        return (
          <span style={{ color: "var(--color-text-secondary)" }}>
            {styled.content}
          </span>
        );
      }

      return (
        <span style={{ display: "flex", justifyContent: "center" }}>
          <Status
            content={styled.content}
            style={{ background: styled.bg, color: styled.color }}
          />
        </span>
      );
    },
  },
  {
    title: `${translate("sidebar.campaign")} / ${translate("sidebar.workflow")}`,
    dataIndex: "campaign",
    render: (campaign: ICampaign, record: IAppLog) => {
      const hasCampaign = Boolean(campaign?.id);
      const hasWorkflow = Boolean(
        record?.workflow?.id && record?.workflowId != null,
      );

      if (!hasCampaign && !hasWorkflow) {
        return (
          <span style={{ color: "var(--color-text-secondary)" }}>
            {EMPTY_STRING}
          </span>
        );
      }

      return (
        <CampaignWorkflowWrapper>
          {hasCampaign && (
            <NameWrapper
              className="link campaign-row"
              onClick={() => onViewCampaign(campaign.id!)}
            >
              <div
                className="color"
                style={{
                  backgroundColor: campaign?.color || DEFAULT_COLOR_PICKER,
                }}
              />

              <div className="name campaign-name">
                <Highlighter
                  textToHighlight={campaign?.name || EMPTY_STRING}
                  searchWords={[searchText]}
                  highlightClassName="highlight"
                />
              </div>
            </NameWrapper>
          )}

          {hasWorkflow && (
            <NameWrapper
              className="link workflow-row"
              onClick={() =>
                onViewWorkflow(record.campaignId!, record.workflowId!)
              }
            >
              <div
                className="color"
                style={{
                  backgroundColor:
                    record.workflow?.color || DEFAULT_COLOR_PICKER,
                }}
              />
              <div className="name workflow-name">
                <Highlighter
                  textToHighlight={record.workflow?.name || EMPTY_STRING}
                  searchWords={[searchText]}
                  highlightClassName="highlight"
                />
              </div>
            </NameWrapper>
          )}
        </CampaignWorkflowWrapper>
      );
    },
  },
];

const ManageLog = (props: any) => {
  const {
    totalData,
    listAppLog,
    listSchedule,
    pageSize = TABLE_PAGE_OPTION[0],
  } = props;

  const { translate } = useTranslation();
  const [page, onSetPage] = useState(1);
  const [searchText, onSetSearchText] = useState("");
  const [isBtnLoading, setBtnLoading] = useState(false);
  const [selectedRowKeys, onSetSelectedRowKeys] = useState([]);
  const [shouldRefetch, setShouldRefetch] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [scheduleId, setScheduleId] = useState<null | number>(null);
  const [jobTypeFilter, setJobTypeFilter] = useState<string>("all");
  const navigate = useNavigate();
  const location = useLocation();
  const { search } = location;

  const { getListAppLog, loading: getDataLoading } = useGetListAppLog();
  const { getListSchedule, loading: isGetListScheduleLoading } =
    useGetListSchedule();
  const {
    isSuccess,
    loading: isDeleteLoading,
    deleteAppLog,
  } = useDeleteAppLog();
  const { scheduleId: scheduleIdQuery } = qs.parse(search, {
    ignoreQueryPrefix: true,
  });

  useEffect(() => {
    if (scheduleIdQuery && !isNaN(Number(scheduleIdQuery?.toString()))) {
      setScheduleId(Number(scheduleIdQuery?.toString()));
    }
  }, [scheduleIdQuery]);

  const dataSource: any[] = useMemo(() => {
    return listAppLog?.map((log: IAppLog, index: number) => ({
      ...log,
      index: (page - 1) * pageSize + index + 1,
    }));
  }, [listAppLog, page, pageSize]);

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
    columnWidth: 50,
  };

  const onTableChange = (pagination?: PaginationProps) => {
    pagination?.current !== page && onSetPage(pagination?.current!);
    pagination?.pageSize !== pageSize &&
      props.actSetAppLogPageSize(pagination?.pageSize!);
  };

  const onDeleteLog = () => {
    setBtnLoading(true);
    deleteAppLog(selectedRowKeys);
  };

  const resolvedJobType = jobTypeFilter === "all" ? undefined : jobTypeFilter;

  useEffect(() => {
    clearTimeout(searchTimeOut);
    searchTimeOut = setTimeout(() => {
      getListAppLog({
        page,
        pageSize,
        searchText,
        logType: AppLogType.SCHEDULE,
        scheduleId: scheduleId || undefined,
        jobType: resolvedJobType,
      });
    }, 200);

    clearInterval(getDataInterval);
    getDataInterval = setInterval(() => {
      getListAppLog({
        page,
        pageSize,
        searchText,
        logType: AppLogType.SCHEDULE,
        scheduleId: scheduleId || undefined,
        jobType: resolvedJobType,
      });
    }, 60000);

    return () => {
      clearTimeout(searchTimeOut);
      clearInterval(getDataInterval);
    };
  }, [searchText, page, pageSize, scheduleId, resolvedJobType]);

  useEffect(() => {
    if (getDataLoading && shouldRefetch) {
      setShouldRefetch(false);
    }
  }, [getDataLoading, shouldRefetch]);

  useEffect(() => {
    if (shouldRefetch) {
      getListAppLog({
        page,
        pageSize,
        searchText,
        logType: AppLogType.SCHEDULE,
        scheduleId: scheduleId || undefined,
        jobType: resolvedJobType,
      });
    }
  }, [page, pageSize, searchText, shouldRefetch, scheduleId, resolvedJobType]);

  useEffect(() => {
    if (!isDeleteLoading && isSuccess) {
      onSetSelectedRowKeys([]);
      setShouldRefetch(true);

      setTimeout(() => {
        setBtnLoading(false);
      }, 3000);
    }
  }, [isDeleteLoading, isSuccess]);

  const onViewWorkflow = (campaignId: number, workflowId: number) => {
    navigate(
      `/dashboard/campaign?campaignId=${campaignId}&workflowId=${workflowId}&mode=VIEW_WORKFLOW`,
    );
  };

  const onViewCampaign = (campaignId: number) => {
    navigate(`/dashboard/campaign?campaignId=${campaignId}&mode=VIEW_PROFILE`);
  };

  const onOpenModal = () => {
    setModalOpen(true);
  };

  const onSearchSchedule = (text: string) => {
    if (searchScheduleTimeOut) {
      clearTimeout(searchScheduleTimeOut);
    }
    searchScheduleTimeOut = setTimeout(() => {
      getListSchedule({ page: 1, pageSize: 1000, searchText: text });
    }, 200);
  };

  const onChangeSchedule = (scheduleId: number) => {
    setScheduleId(scheduleId);
  };

  return (
    <PageWrapper>
      <title>Log</title>

      <div className="heading">
        <SearchInput
          onChange={onSetSearchText}
          value={searchText}
          placeholder={translate("button.search")}
          style={{ width: "35rem" }}
        />

        <Select
          size="large"
          className="custom-select"
          style={{
            marginLeft: "var(--margin-left)",
            width: "23rem",
          }}
          value={scheduleId}
          onChange={onChangeSchedule}
          loading={isGetListScheduleLoading}
          showSearch
          onSearch={onSearchSchedule}
          filterOption={false}
          optionLabelProp="label"
          placeholder={translate("schedule.searchSchedulePlaceholder")}
          allowClear={true}
        >
          {listSchedule?.map((schedule: ISchedule) => (
            <Option
              key={schedule?.id}
              value={schedule?.id}
              label={schedule?.name}
            >
              {schedule?.name || EMPTY_STRING}
            </Option>
          ))}
        </Select>

        <Segmented
          style={{ marginLeft: "var(--margin-left)" }}
          options={[
            { label: translate("schedule.filterAll"), value: "all" },
            {
              label: translate("schedule.typeWorkflow"),
              value: JobType.WORKFLOW,
            },
            { label: translate("schedule.typeAgent"), value: JobType.AGENT },
          ]}
          value={jobTypeFilter}
          onChange={(value) => {
            setJobTypeFilter(value);
            onSetPage(1);
          }}
          size="large"
        />

        <Tooltip title={translate("workflow.setting")}>
          <div
            className="setting"
            onClick={onOpenModal}
            style={{ marginLeft: "var(--margin-left)" }}
          >
            <SettingIcon />
          </div>
        </Tooltip>

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
        virtual
        rowSelection={rowSelection}
        rowKey={(data: IAppLog) => data?.id?.toString() || ""}
        dataSource={dataSource}
        // @ts-ignore
        columns={renderColumns(
          searchText,
          translate,
          onViewWorkflow,
          onViewCampaign,
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
        scroll={{ x: 1000, y: 650 }}
        loading={getDataLoading}
        onChange={onTableChange}
        size="middle"
      />

      <ModalConfigLog isModalOpen={isModalOpen} setModalOpen={setModalOpen} />
    </PageWrapper>
  );
};

export default connect(
  (state: RootState) => ({
    listAppLog: state?.AppLog?.listAppLog,
    listSchedule: state?.Schedule?.listSchedule,
    totalData: state?.AppLog?.totalData,
    pageSize: state?.AppLog?.pageSize,
  }),
  { actSetAppLogPageSize },
)(ManageLog);
