import _ from "lodash";
import { useEffect, useMemo, useState, ComponentType } from "react";
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
import { SearchInput, TotalData } from "@/component";
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
} from "@/hook";
import { IRunningWorkflow, ISchedule } from "@/electron/type";
import {
  EditIcon,
  SettingIcon,
  DownArrowIcon,
  UpArrowIcon,
  CollapseLineIcon,
  ExpandLineIcon,
  EyeOpenIcon,
} from "@/component/Icon";
import {
  actSaveSelectedSchedule,
  actSetTableViewMode,
  actSetSortField,
} from "@/redux/schedule";
import { actSetModalOpen } from "@/redux/schedule";
import { formatTime, trimText } from "@/service/util";
import ModalSchedule from "./ModalSchedule";
import ScheduleFlow from "./ScheduleFlow";
import {
  Wrapper,
  ExpandIconWrapper,
  IconWrapper,
  ScheduleNameWrapper,
  ExpandRowWrapper,
} from "./style";
import { VIEW_MODE } from "../index";

const Highlighter = HighlighterLib as ComponentType<HighlighterProps>;

let searchTimeOut: any = null;
let getDataInterval: any = null;

const TABLE_VIEW_MODE = {
  EXPAND_ROW: "EXPAND_ROW",
  COLLAPSE_ROW: "COLLAPSE_ROW",
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

const renderColumns = (
  onToggleActiveStatus: (scheduleId: number, isActive: boolean) => void,
  onEditSchedule: (scheduleJob: ISchedule) => void,
  onEditJob: (schedule: ISchedule) => void,
  translate: any,
  listRunningWorkflow: IRunningWorkflow[],
  onViewLog: (scheduleId: number) => void,
  searchText: string,
) => [
  {
    title: translate("indexTable"),
    dataIndex: "index",
    width: "5%",
  },
  {
    title: translate("name"),
    dataIndex: "name",
    width: "43%",
    render: (name: any, schedule: ISchedule) => {
      return (
        <ScheduleNameWrapper onClick={() => onEditSchedule(schedule)}>
          <div className="name">
            <Highlighter
              textToHighlight={trimText(schedule?.name || "", 45)}
              searchWords={[searchText]}
              highlightClassName="highlight"
            />

            {_.find(listRunningWorkflow, {
              scheduleId: schedule?.id,
            }) && (
              <Tooltip title={translate("running")}>
                <Badge status="success" style={{ marginLeft: "1rem" }} />
              </Tooltip>
            )}
          </div>

          <div className="note">
            <Highlighter
              textToHighlight={trimText(schedule?.note || "", 75)}
              searchWords={[searchText]}
              highlightClassName="highlight"
            />
          </div>
        </ScheduleNameWrapper>
      );
    },
  },

  {
    title: translate("schedule.startTime"),
    dataIndex: "startTime",
    width: "13%",
    render: (text: any, _record: any) => {
      const date = new Date(text);
      return <span>{dayjs(date).format("hh:mm a")}</span>;
    },
  },
  {
    title: translate("schedule.repeatMode"),
    dataIndex: "repeat",
    width: "13%",
    render: (repeat: any) => getRepeatationLabel(repeat, translate),
  },
  {
    title: "Active?",
    dataIndex: "isActive",
    width: "7%",
    align: "center",
    render: (isActive: boolean, record: ISchedule) => (
      <Switch
        checked={isActive}
        size="small"
        onChange={(checked: boolean) =>
          onToggleActiveStatus(record?.id!, checked)
        }
      />
    ),
  },
  {
    title: "",
    render: (text: any, record: ISchedule) => (
      <div className="list-icon">
        <Tooltip title={translate("schedule.viewLog")}>
          <div className="view-icon" onClick={() => onViewLog(record?.id!)}>
            <EyeOpenIcon />
          </div>
        </Tooltip>

        <SettingIcon
          className="setting-icon"
          onClick={() => onEditJob(record)}
        />

        <EditIcon onClick={() => onEditSchedule(record)} />
      </div>
    ),
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
    pageSize = 30,
  } = props;

  const { translate, locale } = useTranslation();
  const [page, onSetPage] = useState(1);
  const [searchText, onSetSearchText] = useState("");
  const [isBtnLoading, setBtnLoading] = useState(false);
  const [selectedRowKeys, onSetSelectedRowKeys] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [expandedRowKeys, setExpanedRowKeys] = useState<any[]>([]);
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

  const {
    loading: isDeleteLoading,
    isSuccess: isDeleteSuccess,
    deleteSchedule,
  } = useDeleteSchedule();
  const { getListRunningWorkflow } = useGetListRunningWorkflow();
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
    return listSchedule?.map((schedule: ISchedule, index: number) => ({
      ...schedule,
      index: (page - 1) * pageSize + index + 1,
    }));
  }, [listSchedule, page, pageSize]);

  const onEditSchedule = (scheduleJob: any) => {
    props?.actSetModalOpen(true);
    props?.actSaveSelectedSchedule(scheduleJob);
  };

  const onEditJob = (scheduleJob: any) => {
    props?.actSetModalOpen(true);
    props?.actSaveSelectedSchedule(scheduleJob);
    setCurrentStep(1);
  };

  const onViewLog = (scheduleId: number) => {
    navigate(
      `/dashboard/schedule?mode=${VIEW_MODE.LOG}&scheduleId=${scheduleId}`,
    );
  };

  const expandedRowRender = (schedule: ISchedule) => {
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

  const renderExpandIcon = ({ expanded, _onExpand, record }: any) => {
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
    isActive: boolean,
  ) => {
    updateSchedule({
      id: scheduleId,
      isActive,
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
          style={{ marginRight: "var(--margin-right)", width: "35rem" }}
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

        <Switch
          style={{ marginRight: "auto", marginLeft: "var(--margin-left)" }}
          checkedChildren="On"
          unCheckedChildren="Off"
          onChange={onToggleSchedule}
          checked={!preference?.isStopAllSchedule}
        />

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

      <Table
        rowSelection={rowSelection}
        rowKey={(data) => data?.id!}
        dataSource={dataSource}
        // @ts-ignore
        columns={renderColumns(
          onToggleActiveStatus,
          onEditSchedule,
          onEditJob,
          translate,
          listRunningWorkflow,
          onViewLog,
          searchText,
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
        scroll={{ x: 900, y: "70vh" }}
        loading={false}
        onChange={onTableChange}
        size="middle"
        expandable={{
          expandedRowRender,
          expandIcon: renderExpandIcon,
          expandedRowKeys,
        }}
      />

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
  }),
  {
    actSetPageName,
    actSaveSelectedSchedule,
    actSetModalOpen,
    actSetTableViewMode,
    actSetSortField,
    actSetPageSize,
  },
)(ManageSchedule);
