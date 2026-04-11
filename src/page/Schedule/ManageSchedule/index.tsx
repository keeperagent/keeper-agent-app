import lodash from "lodash";
import cronstrue from "cronstrue";
import { Fragment, useEffect, useMemo, useState, ComponentType } from "react";
import {
  Button,
  PaginationProps,
  Popconfirm,
  Table,
  Segmented,
  Switch,
  message,
  Badge,
  Tooltip,
  Select,
} from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import qs from "qs";
import dayjs from "dayjs";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { SCHEDULE_REPEAT, SORT_ORDER } from "@/electron/constant";
import { DeleteButton } from "@/component/Button";
import { SearchInput, TotalData, Status } from "@/component";
import { actSetPageName } from "@/redux/layout";
import { actSetPageSize } from "@/redux/schedule";
import HighlighterLib, { HighlighterProps } from "react-highlight-words";
import {
  useGetListRunningWorkflow,
  useTranslation,
  useUpdateSchedule,
} from "@/hook";
import {
  useDeleteSchedule,
  useGetListSchedule,
  useUpdatePreference,
  useStopAllWorkflow,
  useRunScheduleNow,
  useGetRunningAgentSchedule,
} from "@/hook";
import {
  AgentScheduleStatus,
  IAppLog,
  IJob,
  IRunningWorkflow,
  ISchedule,
} from "@/electron/type";
import {
  SettingIcon,
  DownArrowIcon,
  UpArrowIcon,
  CollapseLineIcon,
  ExpandLineIcon,
  EyeOpenIcon,
  PlayIcon,
  SpinIcon,
  CalendarIcon,
} from "@/component/Icon";
import {
  actSaveSelectedSchedule,
  actSetTableViewMode,
  actSetSortField,
  actSetActiveAgentRuns,
  actSetModalOpen,
} from "@/redux/schedule";
import {
  formatTime,
  formatDurationBetween,
  formatTimeToDate,
} from "@/service/util";
import ModalSchedule from "./ModalSchedule";
import ScheduleFlow from "./ScheduleFlow";
import CalendarView from "./CalendarView";
import {
  Wrapper,
  ExpandIconWrapper,
  IconWrapper,
  ScheduleNameWrapper,
  ExpandRowWrapper,
} from "./style";
import { VIEW_MODE } from "../index";
import { TABLE_PAGE_OPTION } from "@/config/constant";
import { ScheduleType } from "@/electron/type";

const Highlighter = HighlighterLib as ComponentType<HighlighterProps>;

const ElapsedCounter = ({ startedAt }: { startedAt: number }) => {
  const [elapsed, setElapsed] = useState(Date.now() - startedAt);

  useEffect(() => {
    const timer = setInterval(() => setElapsed(Date.now() - startedAt), 1000);
    return () => clearInterval(timer);
  }, [startedAt]);

  return <span>{formatDurationBetween(startedAt, startedAt + elapsed)}</span>;
};

let searchTimeOut: any = null;
let getDataInterval: any = null;

const TABLE_VIEW_MODE = {
  EXPAND_ROW: "EXPAND_ROW",
  COLLAPSE_ROW: "COLLAPSE_ROW",
  CALENDAR: "CALENDAR",
};
const getRepeatationLabel = (value: string, translate: any) => {
  const mapValue = {
    [SCHEDULE_REPEAT.NO_REPEAT]: translate("schedule.noRepeat"),
    [SCHEDULE_REPEAT.EVERY_DAY]: translate("schedule.everyDay"),
    [SCHEDULE_REPEAT.ODD_DAY]: translate("schedule.oddDay"),
    [SCHEDULE_REPEAT.EVEN_DAY]: translate("schedule.evenDay"),
  };
  return mapValue[value];
};

const historyColorMap: Record<string, string> = {
  [AgentScheduleStatus.SUCCESS]: "var(--color-success)",
  [AgentScheduleStatus.ERROR]: "var(--color-error)",
  [AgentScheduleStatus.RUNNING]: "var(--color-blue)",
  [AgentScheduleStatus.RETRYING]: "var(--color-yellow)",
};

const deriveScheduleLastRunTime = (listJob: IJob[]): number | null => {
  const timestamps = listJob
    .map((job) => job.lastLog?.createAt)
    .filter(Boolean) as number[];

  return timestamps.length ? Math.max(...timestamps) : null;
};

const deriveScheduleLastRunStatus = (
  listJob: IJob[],
): AgentScheduleStatus | null => {
  const statuses = listJob
    .map((job) => job.lastLog?.status)
    .filter(Boolean) as AgentScheduleStatus[];

  if (!statuses.length) {
    return null;
  }
  if (statuses.some((status) => status === AgentScheduleStatus.ERROR)) {
    return AgentScheduleStatus.ERROR;
  }
  if (statuses.some((status) => status === AgentScheduleStatus.RUNNING)) {
    return AgentScheduleStatus.RUNNING;
  }
  if (statuses.every((status) => status === AgentScheduleStatus.SUCCESS)) {
    return AgentScheduleStatus.SUCCESS;
  }

  return null;
};

const renderColumns = (
  onToggleActiveStatus: (scheduleId: number, isPaused: boolean) => void,
  onEditSchedule: (scheduleJob: ISchedule) => void,
  translate: any,
  listRunningWorkflow: IRunningWorkflow[],
  onViewLog: (scheduleId: number) => void,
  searchText: string,
  onRunScheduleNow: (scheduleId: number) => void,
  runningAgentScheduleIds: number[],
) => [
  {
    title: translate("indexTable"),
    dataIndex: "index",
    width: 70,
  },
  {
    title: translate("name"),
    dataIndex: "name",
    width: 450,
    render: (_: any, schedule: ISchedule) => {
      return (
        <ScheduleNameWrapper onClick={() => onEditSchedule(schedule)}>
          <div className="name">
            <span className="name-text">
              <Highlighter
                textToHighlight={schedule?.name || ""}
                searchWords={[searchText]}
                highlightClassName="highlight"
              />
            </span>
          </div>
          <div className="note">
            <Highlighter
              textToHighlight={schedule?.note || ""}
              searchWords={[searchText]}
              highlightClassName="highlight"
            />
          </div>
        </ScheduleNameWrapper>
      );
    },
  },

  {
    title: translate("schedule.type"),
    dataIndex: "type",
    width: 120,
    render: (type: string) => {
      const bgMap: Record<string, string> = {
        workflow: "var(--background-pink)",
        agent: "var(--background-blue)",
      };
      const colorMap: Record<string, string> = {
        workflow: "var(--color-pink)",
        agent: "var(--color-blue)",
      };
      const labelMap: Record<string, string> = {
        workflow: translate("schedule.typeWorkflow"),
        agent: translate("schedule.typeAgent"),
      };
      const scheduleType = type || ScheduleType.WORKFLOW;

      return (
        <span style={{ display: "inline-flex" }}>
          <Status
            content={labelMap[scheduleType]}
            style={{
              background: bgMap[scheduleType] || "var(--background-pink)",
              color: colorMap[scheduleType] || "var(--color-text-secondary)",
            }}
          />
        </span>
      );
    },
  },
  {
    title: translate("schedule.scheduleColumn"),
    dataIndex: "schedule",
    width: 210,
    render: (_: any, record: ISchedule) => {
      if (record.type === ScheduleType.AGENT) {
        if (!record.cronExpr) {
          return null;
        }

        let humanReadable = "";
        try {
          humanReadable = cronstrue.toString(record.cronExpr);
        } catch {}

        return (
          <div className="schedule-cell">
            {humanReadable && (
              <span className="cron-human">{humanReadable}</span>
            )}

            {record.nextRunAt && (
              <span className="next-run">
                {translate("schedule.nextRun")}:{" "}
                {dayjs(record.nextRunAt).fromNow()}
              </span>
            )}
          </div>
        );
      }

      const date = new Date(record.startTime!);

      return (
        <div className="schedule-cell">
          <span className="cron-human">{dayjs(date).format("hh:mm a")}</span>
          <span className="repeat-label">
            {getRepeatationLabel(record.repeat || "", translate)}
          </span>
        </div>
      );
    },
  },
  {
    title: translate("schedule.lastStatus"),
    dataIndex: "lastStatus",
    width: 180,
    align: "center",
    render: (_: any, record: ISchedule) => {
      const isWorkflowRunning = Boolean(
        lodash.find(listRunningWorkflow, { scheduleId: record?.id }),
      );
      const lastRunStatus = deriveScheduleLastRunStatus(record.listJob || []);
      const lastRunTime = deriveScheduleLastRunTime(record.listJob || []);
      const lastRunBadgeStatusMap: Record<string, any> = {
        [AgentScheduleStatus.SUCCESS]: "success",
        [AgentScheduleStatus.ERROR]: "error",
        [AgentScheduleStatus.RUNNING]: "processing",
      };

      return (
        <div className="active-cell">
          {(isWorkflowRunning || lastRunStatus) && (
            <Tooltip
              title={`${translate("schedule.lastStatus")}: ${isWorkflowRunning ? translate("running") : lastRunStatus}`}
            >
              <div className="last-run-row">
                <Badge
                  status={
                    isWorkflowRunning
                      ? "processing"
                      : lastRunBadgeStatusMap[lastRunStatus || ""] || "default"
                  }
                />

                {lastRunTime && !isWorkflowRunning && (
                  <span className="last-run-time">
                    {dayjs(lastRunTime).fromNow()}
                  </span>
                )}
              </div>
            </Tooltip>
          )}

          {(record.recentLogs || []).length > 0 && (
            <div className="run-history">
              {(record.recentLogs || []).map((log: IAppLog, i: number) => (
                <Tooltip
                  key={i}
                  title={`${log.status}${log.createAt ? ` · ${dayjs(log.createAt).fromNow()}` : ""}`}
                >
                  <span
                    className="history-dot"
                    style={{
                      backgroundColor:
                        historyColorMap[log.status || ""] ||
                        "var(--color-gray)",
                    }}
                  />
                </Tooltip>
              ))}
            </div>
          )}
        </div>
      );
    },
  },
  {
    title: translate("schedule.active"),
    dataIndex: "isPaused",
    width: 110,
    align: "center",
    render: (isPaused: boolean, record: ISchedule) => (
      <Switch
        checked={!isPaused}
        size="small"
        onChange={(checked: boolean) =>
          onToggleActiveStatus(record?.id!, !checked)
        }
      />
    ),
  },
  {
    title: "",
    render: (_: any, record: ISchedule) => {
      const isAgentSchedule = record.type === ScheduleType.AGENT;
      const isRunning = runningAgentScheduleIds.includes(record?.id!);

      return (
        <div className="list-icon">
          {isAgentSchedule && isRunning && (
            <Tooltip title={translate("running")}>
              <span className="icon spin">
                <SpinIcon />
              </span>
            </Tooltip>
          )}

          {isAgentSchedule && !isRunning && (
            <Tooltip title={translate("schedule.runNow")}>
              <span
                className="icon"
                onClick={() => onRunScheduleNow(record?.id!)}
              >
                <PlayIcon />
              </span>
            </Tooltip>
          )}

          <Tooltip title={translate("schedule.viewLog")}>
            <div className="icon" onClick={() => onViewLog(record?.id!)}>
              <EyeOpenIcon />
            </div>
          </Tooltip>

          <Tooltip title={translate("schedule.editJobs")}>
            <span className="icon" onClick={() => onEditSchedule(record)}>
              <SettingIcon />
            </span>
          </Tooltip>
        </div>
      );
    },
  },
];

let interval: any = null;
const ManageSchedule = (props: any) => {
  const {
    totalData,
    listSchedule,
    tableViewMode,
    preference,
    listRunningWorkflow,
    sortField,
    pageSize = TABLE_PAGE_OPTION[0],
    runningAgentScheduleIds,
  } = props;

  const { translate, locale } = useTranslation();
  const [page, onSetPage] = useState(1);
  const [searchText, onSetSearchText] = useState("");
  const [isBtnLoading, setBtnLoading] = useState(false);
  const [selectedRowKeys, onSetSelectedRowKeys] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [expandedRowKeys, setExpanedRowKeys] = useState<any[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const navigate = useNavigate();

  useEffect(() => {
    if (!tableViewMode) {
      props?.actSetTableViewMode(TABLE_VIEW_MODE.EXPAND_ROW);
    }
  }, [tableViewMode]);

  const { getListSchedule } = useGetListSchedule();
  const { updateSchedule } = useUpdateSchedule();
  const { updatePreference } = useUpdatePreference();
  const { stopAllWorkflow } = useStopAllWorkflow();
  const { runScheduleNow } = useRunScheduleNow();

  const handleRunScheduleNow = (scheduleId: number) => {
    props.actSetActiveAgentRuns([...runningAgentScheduleIds, scheduleId]);
    runScheduleNow(scheduleId);
  };

  const {
    loading: isDeleteLoading,
    isSuccess: isDeleteSuccess,
    deleteSchedule,
  } = useDeleteSchedule();
  const { getListRunningWorkflow } = useGetListRunningWorkflow();
  const { getRunningAgentSchedule } = useGetRunningAgentSchedule();
  const location = useLocation();
  const { search } = location;
  const { scheduleId } = qs.parse(search, { ignoreQueryPrefix: true });

  useEffect(() => {
    clearTimeout(searchTimeOut);
    searchTimeOut = setTimeout(() => {
      getListSchedule({
        page,
        pageSize,
        searchText,
        sortBy: sortField,
        scheduleId: scheduleId ? Number(scheduleId) : undefined,
      });
    }, 200);

    clearInterval(getDataInterval);
    getDataInterval = setInterval(() => {
      getListSchedule({
        page,
        pageSize,
        searchText,
        sortBy: sortField,
        scheduleId: scheduleId ? Number(scheduleId) : undefined,
      });
    }, 10000);

    return () => {
      clearTimeout(searchTimeOut);
      clearInterval(getDataInterval);
    };
  }, [page, pageSize, searchText, sortField, scheduleId]);

  useEffect(() => {
    setTimeout(() => {
      getListRunningWorkflow();
    }, 5000);

    interval = setInterval(() => {
      getListRunningWorkflow();
    }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    getRunningAgentSchedule();
    const runningScheduleInterval = setInterval(getRunningAgentSchedule, 3000);

    return () => clearInterval(runningScheduleInterval);
  }, []);

  useEffect(() => {
    props?.actSetPageName(translate("sidebar.schedule"));
  }, []);

  useEffect(() => {
    if (!isDeleteLoading && isDeleteSuccess) {
      getListSchedule({ page, pageSize, searchText, sortBy: sortField });
      onSetSelectedRowKeys([]);

      setTimeout(() => {
        setBtnLoading(false);
      }, 3000);
    }
  }, [isDeleteLoading, isDeleteSuccess, page, pageSize, searchText, sortField]);

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
      props.actSetPageSize(pagination?.pageSize!);
  };

  const onOpenModalSchedule = () => {
    props?.actSetModalOpen(true);
  };

  const onDeleteSchedule = () => {
    deleteSchedule(selectedRowKeys);
    setBtnLoading(true);
  };

  const dataSource: any[] = useMemo(() => {
    const filtered =
      typeFilter === "all"
        ? listSchedule
        : listSchedule?.filter(
            (s: ISchedule) => (s.type || ScheduleType.WORKFLOW) === typeFilter,
          );
    return filtered?.map((schedule: ISchedule, index: number) => ({
      ...schedule,
      index: (page - 1) * pageSize + index + 1,
    }));
  }, [listSchedule, page, pageSize, typeFilter]);

  const calendarSchedules: ISchedule[] = useMemo(() => {
    if (typeFilter === "all") {
      return listSchedule || [];
    }

    return (listSchedule || []).filter(
      (schedule: ISchedule) =>
        (schedule.type || ScheduleType.WORKFLOW) === typeFilter,
    );
  }, [listSchedule, typeFilter]);

  const onEditSchedule = (scheduleJob: any) => {
    props?.actSetModalOpen(true);
    props?.actSaveSelectedSchedule(scheduleJob);
  };

  const onViewLog = (scheduleId: number) => {
    navigate(
      `/dashboard/schedule?mode=${VIEW_MODE.LOG}&scheduleId=${scheduleId}`,
    );
  };

  const expandedRowRender = (schedule: ISchedule) => {
    const isRunning = runningAgentScheduleIds.includes(schedule?.id!);
    const hasExecutionData = Boolean(schedule?.lastStartedAt);

    return (
      <ExpandRowWrapper>
        <div className="date">
          <div className="item">
            <div className="label">{translate("createAt")}:</div>
            <div className="value">
              {formatTime(Number(schedule?.createAt), locale)}
            </div>
          </div>

          <div className="item">
            <div className="label">{translate("updateAt")}:</div>
            <div className="value">
              {formatTime(Number(schedule?.updateAt), locale)}
            </div>
          </div>

          {hasExecutionData && (
            <Fragment>
              <div className="item">
                <div className="label">{translate("campaign.startTime")}:</div>
                <div className="value">
                  {formatTimeToDate(schedule.lastStartedAt!)}
                </div>
              </div>

              {isRunning ? (
                <div className="item">
                  <div className="label">
                    {translate("schedule.runningFor")}:
                  </div>
                  <div className="value">
                    <ElapsedCounter startedAt={schedule.lastStartedAt!} />
                  </div>
                </div>
              ) : (
                <Fragment>
                  {schedule.lastEndTime &&
                    schedule.lastEndTime > schedule.lastStartedAt! && (
                      <Fragment>
                        <div className="item">
                          <div className="label">
                            {translate("campaign.endTime")}:
                          </div>
                          <div className="value">
                            {formatTimeToDate(schedule.lastEndTime)}
                          </div>
                        </div>

                        <div className="item">
                          <div className="label">
                            {translate("campaign.duration")}:
                          </div>
                          <div className="value">
                            {formatDurationBetween(
                              schedule.lastStartedAt!,
                              schedule.lastEndTime,
                            )}
                          </div>
                        </div>
                      </Fragment>
                    )}
                </Fragment>
              )}
            </Fragment>
          )}
        </div>

        <ScheduleFlow schedule={schedule} />
      </ExpandRowWrapper>
    );
  };

  const onChangeViewMode = (value: string | number) => {
    props?.actSetTableViewMode(value?.toString());
  };

  useEffect(() => {
    if (tableViewMode === TABLE_VIEW_MODE.COLLAPSE_ROW) {
      setExpanedRowKeys([]);
    } else if (tableViewMode === TABLE_VIEW_MODE.EXPAND_ROW) {
      setExpanedRowKeys(dataSource?.map((data: any) => data?.id!) || []);
    }
  }, [tableViewMode, dataSource]);

  const handleExpand = (expanded: boolean, record: any) => {
    setExpanedRowKeys(
      expanded
        ? expandedRowKeys.filter((rowId: any) => rowId !== record?.id)
        : [...expandedRowKeys, record?.id],
    );
  };

  const renderExpandIcon = ({ expanded, record }: any) => {
    return expanded ? (
      <ExpandIconWrapper onClick={(_e: any) => handleExpand(expanded, record)}>
        <DownArrowIcon />
      </ExpandIconWrapper>
    ) : (
      <ExpandIconWrapper onClick={(_e: any) => handleExpand(expanded, record)}>
        <UpArrowIcon />
      </ExpandIconWrapper>
    );
  };

  const onToggleSchedule = async (checked: boolean) => {
    await updatePreference({
      id: preference?.id,
      isStopAllSchedule: !checked,
    });
    if (!checked) {
      stopAllWorkflow();
    }

    if (checked) {
      message.info(translate("schedule.appReadyToRunJob"));
    } else {
      message.warning(translate("schedule.appStopToRunJob"));
    }
  };

  const onToggleActiveStatus = async (
    scheduleId: number,
    isPaused: boolean,
  ) => {
    updateSchedule({
      id: scheduleId,
      isPaused,
    });
  };

  const listSortField = [
    {
      label: translate("createdAt"),
      value: "createAt",
    },
    {
      label: translate("updatedAt"),
      value: "updateAt",
    },
    {
      label: translate("running"),
      value: "isRunning",
    },
    {
      label: translate("schedule.repeatMode"),
      value: "repeat",
    },
    {
      label: translate("schedule.startTime"),
      value: "startTime",
    },
  ];

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

  const onChangeSortField = (value: string) => {
    props?.actSetSortField({
      ...sortField,
      field: value,
    });
  };

  const onChangeSortOrder = (value: string) => {
    props?.actSetSortField({
      ...sortField,
      order: value,
    });
  };

  return (
    <Wrapper>
      <title>{translate("sidebar.schedule")}</title>

      <div className="heading">
        <SearchInput
          onChange={onSetSearchText}
          value={searchText}
          placeholder={translate("button.search")}
          style={{ marginRight: "var(--margin-right)", width: "30rem" }}
        />

        <Segmented
          options={[
            { label: translate("schedule.filterAll"), value: "all" },
            {
              label: translate("schedule.typeWorkflow"),
              value: ScheduleType.WORKFLOW,
            },
            {
              label: translate("schedule.typeAgent"),
              value: ScheduleType.AGENT,
            },
          ]}
          value={typeFilter}
          onChange={(filterValue) => setTypeFilter(filterValue as string)}
          style={{ marginRight: "var(--margin-right)" }}
          size="large"
        />

        <Segmented
          options={[
            {
              value: TABLE_VIEW_MODE.COLLAPSE_ROW,
              icon: (
                <IconWrapper>
                  <CollapseLineIcon />
                </IconWrapper>
              ),
            },
            {
              value: TABLE_VIEW_MODE.EXPAND_ROW,
              icon: (
                <IconWrapper>
                  <ExpandLineIcon />
                </IconWrapper>
              ),
            },
            {
              value: TABLE_VIEW_MODE.CALENDAR,
              icon: (
                <IconWrapper>
                  <CalendarIcon />
                </IconWrapper>
              ),
            },
          ]}
          value={tableViewMode}
          onChange={onChangeViewMode}
          size="large"
        />

        <Select
          className="custom-select"
          placeholder={translate("sortBy")}
          allowClear
          size="large"
          options={listSortField}
          style={{ width: "14rem", marginLeft: "var(--margin-left)" }}
          value={sortField?.field || null}
          onChange={onChangeSortField}
          loading={false}
        />

        <Select
          className="custom-select"
          placeholder={translate("sortOrder")}
          allowClear
          size="large"
          options={listSortOrder}
          style={{ marginLeft: "var(--margin-left)", width: "14rem" }}
          value={sortField?.order || null}
          onChange={onChangeSortOrder}
          loading={false}
        />

        <Tooltip
          title={
            preference?.isStopAllSchedule
              ? translate("schedule.schedulesPaused")
              : translate("schedule.schedulesActive")
          }
        >
          <Switch
            style={{ marginRight: "auto", marginLeft: "var(--margin-left)" }}
            checkedChildren={translate("schedule.switchOn")}
            unCheckedChildren={translate("schedule.switchOff")}
            onChange={onToggleSchedule}
            checked={!preference?.isStopAllSchedule}
          />
        </Tooltip>

        <Button
          type="primary"
          style={{
            marginRight: "var(--margin-right)",
            marginLeft: "var(--margin-left)",
          }}
          onClick={onOpenModalSchedule}
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
          onConfirm={onDeleteSchedule}
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

      {tableViewMode === TABLE_VIEW_MODE.CALENDAR ? (
        <CalendarView
          listSchedule={calendarSchedules}
          runningAgentScheduleIds={runningAgentScheduleIds || []}
          onEditSchedule={onEditSchedule}
        />
      ) : (
        <Table
          rowSelection={rowSelection}
          rowKey={(data) => data?.id!}
          dataSource={dataSource}
          // @ts-ignore
          columns={renderColumns(
            onToggleActiveStatus,
            onEditSchedule,
            translate,
            listRunningWorkflow,
            onViewLog,
            searchText,
            handleRunScheduleNow,
            runningAgentScheduleIds || [],
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
          virtual
          scroll={{ x: 1400, y: "70vh" }}
          loading={false}
          onChange={onTableChange}
          size="middle"
          expandable={{
            expandedRowRender,
            expandIcon: renderExpandIcon,
            expandedRowKeys,
            columnWidth: 30,
          }}
        />
      )}

      <ModalSchedule
        setCurrentStep={setCurrentStep}
        currentStep={currentStep}
      />
    </Wrapper>
  );
};

export default connect(
  (state: RootState) => ({
    listSchedule: state?.Schedule?.listSchedule,
    totalData: state?.Schedule?.totalData,
    tableViewMode: state?.Schedule?.tableViewMode,
    preference: state?.Preference?.preference,
    listRunningWorkflow: state?.WorkflowRunner?.listRunningWorkflow || [],
    sortField: state?.Schedule?.sortField,
    pageSize: state?.Schedule?.pageSize,
    runningAgentScheduleIds: state?.Schedule?.runningAgentScheduleIds || [],
  }),
  {
    actSetPageName,
    actSaveSelectedSchedule,
    actSetModalOpen,
    actSetTableViewMode,
    actSetSortField,
    actSetPageSize,
    actSetActiveAgentRuns,
  },
)(ManageSchedule);
