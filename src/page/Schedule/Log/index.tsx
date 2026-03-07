import { useEffect, useState, useMemo, ComponentType } from "react";
import { PaginationProps, Table, Popconfirm, Select, Tooltip } from "antd";
import qs from "qs";
import HighlighterLib, { HighlighterProps } from "react-highlight-words";
import { connect } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { ICampaign, ISchedule, IScheduleLog, IWorkflow } from "@/electron/type";
import { formatTimeToDate, trimText } from "@/service/util";
import { DeleteButton } from "@/component/Button";
import { SearchInput, TotalData, Status } from "@/component";
import { SettingIcon } from "@/component/Icon";
import { RootState } from "@/redux/store";
import { actSetSorter, actSetPageSize } from "@/redux/scheduleLog";
import {
  useDeleteScheduleLog,
  useGetListSchedule,
  useGetListScheduleLog,
  useTranslation,
} from "@/hook";
import { DEFAULT_COLOR_PICKER, EMPTY_STRING } from "@/config/constant";
import { SCHEDULE_LOG_TYPE, SORT_ORDER } from "@/electron/constant";
import { PageWrapper, NameWrapper } from "./style";
import ModalConfigLog from "./ModalConfigLog";

const Highlighter = HighlighterLib as ComponentType<HighlighterProps>;

let searchTimeOut: any = null;
let searchScheduleTimeOut: any = null;
let getDataInterval: any = null;
const { Option } = Select;

const renderColumns = (
  searchText: string,
  translate: any,
  locale: string,
  onViewWorkflow: (campaignId: number, workflowId: number) => void,
  onViewCampaign: (campaignId: number) => void,
) => [
  {
    title: translate("indexTable"),
    dataIndex: "index",
    width: "6%",
  },
  {
    title: translate("sidebar.schedule"),
    dataIndex: "schedule",
    width: "30%",
    render: (schedule: ISchedule) =>
      schedule?.name ? trimText(schedule?.name, 30) : EMPTY_STRING,
  },
  {
    title: translate("sidebar.campaign"),
    dataIndex: "campaign",
    width: "30%",
    render: (campaign: ICampaign) => (
      <NameWrapper
        onClick={() => onViewCampaign(campaign?.id!)}
        className="link"
      >
        <div
          className="color"
          style={{ backgroundColor: campaign?.color || DEFAULT_COLOR_PICKER }}
        />
        <div className="name">
          <Highlighter
            textToHighlight={
              campaign?.name ? trimText(campaign?.name, 30) : EMPTY_STRING
            }
            searchWords={[searchText]}
            highlightClassName="highlight"
          />
        </div>
      </NameWrapper>
    ),
  },
  {
    title: translate("sidebar.workflow"),
    dataIndex: "workflow",
    width: "30%",
    render: (workflow: IWorkflow, record: IScheduleLog) => (
      <NameWrapper
        onClick={() => onViewWorkflow(record?.campaignId!, record.workflowId!)}
        className="link"
      >
        <div
          className="color"
          style={{ backgroundColor: workflow?.color || DEFAULT_COLOR_PICKER }}
        />
        <div className="name">
          <Highlighter
            textToHighlight={
              workflow?.name ? trimText(workflow?.name, 30) : EMPTY_STRING
            }
            searchWords={[searchText]}
            highlightClassName="highlight"
          />
        </div>
      </NameWrapper>
    ),
  },
  {
    title: "Type",
    dataIndex: "type",
    width: "10%",
    align: "center",
    render: (type: string) => {
      let content = translate("end");
      let backgroundColor = "var(--background-blue)";
      let textColor = "var(--color-blue)";
      if (type === SCHEDULE_LOG_TYPE.JOB_START) {
        backgroundColor = "var(--background-success)";
        textColor = "var(--color-success)";
        content = translate("start");
      } else if (type === SCHEDULE_LOG_TYPE.JOB_TIMEOUT) {
        backgroundColor = "var(--background-error)";
        textColor = "var(--color-error)";
        content = translate("timeout");
      }

      return (
        <span style={{ display: "flex", justifyContent: "center" }}>
          <Status
            content={content}
            style={{
              background: backgroundColor,
              color: textColor,
            }}
          />
        </span>
      );
    },
  },
  {
    title: translate("createdAt"),
    dataIndex: "createAt",
    width: "20%",
    render: (value: number) => formatTimeToDate(Number(value)),
  },
];

const ManageLog = (props: any) => {
  const {
    totalData,
    listScheduleLog,
    listSchedule,
    sorter,
    pageSize = 50,
  } = props;

  const { translate, locale } = useTranslation();
  const [page, onSetPage] = useState(1);
  const [searchText, onSetSearchText] = useState("");
  const [isBtnLoading, setBtnLoading] = useState(false);
  const [selectedRowKeys, onSetSelectedRowKeys] = useState([]);
  const [shouldRefetch, setShouldRefetch] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [scheduleId, setScheduleId] = useState<null | number>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { search } = location;

  const LIST_SORT_OPTION = useMemo(
    () => [
      {
        label: translate("createdAt"),
        value: "createAt",
      },
      {
        label: translate("sidebar.schedule"),
        value: "scheduleName",
      },
      {
        label: translate("sidebar.campaign"),
        value: "campaignName",
      },
      {
        label: translate("sidebar.workflow"),
        value: "workflowName",
      },
    ],
    [translate],
  );

  const LIST_SORT_ORDER = useMemo(
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

  const { getListScheduleLog, loading: getDataLoading } =
    useGetListScheduleLog();
  const { getListSchedule, loading: isGetListScheduleLoading } =
    useGetListSchedule();
  const {
    isSuccess,
    loading: isDeleteLoading,
    deleteScheduleLog,
  } = useDeleteScheduleLog();
  const { scheduleId: scheduleIdQuery } = qs.parse(search, {
    ignoreQueryPrefix: true,
  });

  useEffect(() => {
    if (scheduleIdQuery && !isNaN(Number(scheduleIdQuery?.toString()))) {
      setScheduleId(Number(scheduleIdQuery?.toString()));
    }
  }, [scheduleIdQuery]);

  const dataSource: any[] = useMemo(() => {
    return listScheduleLog?.map((log: IScheduleLog, index: number) => ({
      ...log,
      index: (page - 1) * pageSize + index + 1,
    }));
  }, [listScheduleLog, page, pageSize]);

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

  const onDeleteLog = () => {
    setBtnLoading(true);
    deleteScheduleLog(selectedRowKeys);
  };

  useEffect(() => {
    clearTimeout(searchTimeOut);
    searchTimeOut = setTimeout(() => {
      getListScheduleLog({
        page,
        pageSize,
        searchText,
        sortField: sorter,
        scheduleId: scheduleId || 0,
      });
    }, 200);

    clearInterval(getDataInterval);
    getDataInterval = setInterval(() => {
      getListScheduleLog({
        page,
        pageSize,
        searchText,
        sortField: sorter,
        scheduleId: scheduleId || 0,
      });
    }, 60000);

    return () => {
      clearTimeout(searchTimeOut);
      clearInterval(getDataInterval);
    };
  }, [searchText, page, pageSize, sorter, scheduleId]);

  useEffect(() => {
    if (getDataLoading && shouldRefetch) {
      setShouldRefetch(false);
    }
  }, [getDataLoading, shouldRefetch]);

  useEffect(() => {
    if (shouldRefetch) {
      getListScheduleLog({
        page,
        pageSize,
        searchText,
        sortField: sorter,
        scheduleId: scheduleId || 0,
      });
    }
  }, [page, pageSize, searchText, shouldRefetch, sorter, scheduleId]);

  useEffect(() => {
    if (!isDeleteLoading && isSuccess) {
      onSetSelectedRowKeys([]);
      setShouldRefetch(true);

      setTimeout(() => {
        setBtnLoading(false);
      }, 3000);
    }
  }, [isDeleteLoading, isSuccess]);

  const onChangeSortField = (value: string) => {
    props?.actSetSorter({
      ...sorter,
      field: value,
    });
  };

  const onChangeSortOrder = (value: string) => {
    props?.actSetSorter({
      ...sorter,
      order: value,
    });
  };

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

        <Select
          className="custom-select"
          placeholder={translate("sortBy")}
          allowClear
          size="large"
          options={LIST_SORT_OPTION}
          style={{ width: "14rem", marginLeft: "var(--margin-left)" }}
          value={sorter?.field || null}
          onChange={onChangeSortField}
          loading={isGetListScheduleLoading}
          optionLabelProp="label"
        />

        <Select
          className="custom-select"
          placeholder={translate("sortOrder")}
          allowClear
          size="large"
          options={LIST_SORT_ORDER}
          style={{ marginLeft: "var(--margin-left)", width: "14rem" }}
          value={sorter?.order || null}
          onChange={onChangeSortOrder}
          loading={isGetListScheduleLoading}
          optionLabelProp="label"
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
        rowSelection={rowSelection}
        rowKey={(data: IScheduleLog) => data?.id?.toString() || ""}
        dataSource={dataSource}
        // @ts-ignore
        columns={renderColumns(
          searchText,
          translate,
          locale,
          onViewWorkflow,
          onViewCampaign,
        )}
        pagination={{
          total: totalData,
          pageSize,
          pageSizeOptions: ["50", "100", "300"],
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

      <ModalConfigLog isModalOpen={isModalOpen} setModalOpen={setModalOpen} />
    </PageWrapper>
  );
};

export default connect(
  (state: RootState) => ({
    listScheduleLog: state?.ScheduleLog?.listScheduleLog,
    listSchedule: state?.Schedule?.listSchedule,
    totalData: state?.ScheduleLog?.totalData,
    sorter: state?.ScheduleLog?.sorter,
    pageSize: state?.ScheduleLog?.pageSize,
  }),
  { actSetSorter, actSetPageSize },
)(ManageLog);
