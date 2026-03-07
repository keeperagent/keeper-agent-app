import { useEffect, useState, useMemo, ComponentType } from "react";
import HighlighterLib, { HighlighterProps } from "react-highlight-words";
import _ from "lodash";
import {
  Button,
  PaginationProps,
  Table,
  Tooltip,
  Dropdown,
  Select,
  Segmented,
  Popconfirm,
  Badge,
} from "antd";
import { connect } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ICampaign,
  IRunningWorkflow,
  IWorkflow,
  ISorter,
} from "@/electron/type";
import {
  formatTime,
  formatTimeToDate,
  formatDurationBetween,
  trimText,
} from "@/service/util";
import { DeleteButton } from "@/component/Button";
import {
  SearchInput,
  TotalData,
  ModalCampaign,
  ColorPicker,
} from "@/component";
import { RootState } from "@/redux/store";
import {
  actSaveSelectedCampaign,
  actSetCurrentModalStep,
  actSetModalCampaignOpen,
  actSetSortField,
  actSetTableViewMode,
} from "@/redux/campaign";
import { actSetPageName } from "@/redux/layout";
import { actSetPageSize } from "@/redux/campaign";
import {
  useDeleteCampaign,
  useGetListCampaign,
  useTranslation,
  useUpdateCampaign,
  useGetListRunningWorkflow,
} from "@/hook";
import {
  EditIcon,
  ScriptIcon,
  MixIcon,
  DownArrowIcon,
  UpArrowIcon,
  SettingIcon,
  ExpandLineIcon,
  CollapseLineIcon,
} from "@/component/Icon";
import { EMPTY_STRING, CAMPAIGN_VIEW_MODE } from "@/config/constant";
import { SORT_ORDER } from "@/electron/constant";
import {
  PageWrapper,
  IconHighlightWrapper,
  ExpandRowWrapper,
  ExpandIconWrapper,
  OptionWrapper,
  IconWrapper,
  LinkHoverWrapper,
} from "./style";
import ModalDeleteProfile from "../ModalDeleteProfile";

const Highlighter = HighlighterLib as ComponentType<HighlighterProps>;

let searchTimeOut: any = null;

const TABLE_VIEW_MODE = {
  EXPAND_ROW: "EXPAND_ROW",
  COLLAPSE_ROW: "COLLAPSE_ROW",
};

export const renderListWorkflowTooltip = (
  campaign: ICampaign,
  onViewWorkflow: (campaign: ICampaign, workflowId: number) => void,
  listRunningWorkflow: IRunningWorkflow[],
  icon: JSX.Element,
  translate: any,
  classname?: string,
) => {
  const { listWorkflow = [] } = campaign || {};

  if (listWorkflow?.length === 0) {
    return (
      <IconHighlightWrapper className={`${classname} disable`}>
        {icon}
      </IconHighlightWrapper>
    );
  }

  const items = listWorkflow?.map((workflow: IWorkflow, index: number) => ({
    key: workflow?.id!,
    label: (
      <OptionWrapper onClick={() => onViewWorkflow(campaign, workflow?.id!)}>
        <div className="name">
          {index + 1}. {workflow?.name}
          {_.find(listRunningWorkflow, {
            campaignId: campaign?.id,
            workflowId: workflow?.id,
          }) && (
            <Tooltip title={translate("running")}>
              <Badge status="success" style={{ marginLeft: "1rem" }} />
            </Tooltip>
          )}
        </div>
        <div className="description">
          {trimText(workflow?.note || "", 60) || EMPTY_STRING}
        </div>
      </OptionWrapper>
    ),
  }));

  return (
    <Dropdown menu={{ items }} placement="bottomRight">
      <IconHighlightWrapper className={classname}>{icon}</IconHighlightWrapper>
    </Dropdown>
  );
};

const renderColumns = (
  onEditCampaign: (campaign: ICampaign, step: number) => void,
  onViewProfile: (campaign: ICampaign) => void,
  onViewWorkflow: (campaign: ICampaign, workflowId: number) => void,
  searchText: string,
  translate: any,
  locale: string,
  onUpdateColor: (workflow: IWorkflow, color: string) => void,
  listRunningWorkflow: IRunningWorkflow[],
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
    title: translate("campaign.name"),
    dataIndex: "name",
    width: "42%",
    render: (value: string, record: ICampaign) => (
      <LinkHoverWrapper onClick={() => onViewProfile(record)}>
        <div className="name">
          <Highlighter
            textToHighlight={record?.name || EMPTY_STRING}
            searchWords={[searchText]}
            highlightClassName="highlight"
          />

          {_.find(listRunningWorkflow, {
            campaignId: record?.id,
          }) && (
            <Tooltip title={translate("running")}>
              <Badge status="success" style={{ marginLeft: "1rem" }} />
            </Tooltip>
          )}
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
    title: translate("campaign.numberOfProfile"),
    dataIndex: "totalProfile",
    width: "11%",
  },
  {
    title: translate("updatedAt"),
    dataIndex: "updateAt",
    width: "16%",
    render: (value: number) => formatTime(Number(value), locale),
  },
  {
    title: "",
    render: (text: any, record: ICampaign) => (
      <div className="list-icon">
        <Tooltip title={translate("campaign.viewProfile")}>
          <IconHighlightWrapper onClick={() => onViewProfile(record)}>
            <MixIcon />
          </IconHighlightWrapper>
        </Tooltip>

        {renderListWorkflowTooltip(
          record,
          onViewWorkflow,
          listRunningWorkflow,
          <ScriptIcon />,
          translate,
          "",
        )}

        <SettingIcon
          className="setting-icon"
          onClick={() => onEditCampaign(record, 1)}
        />
        <EditIcon onClick={() => onEditCampaign(record, 0)} />
      </div>
    ),
  },
];

let interval: any = null;
const ManageCampaign = (props: any) => {
  const {
    totalData,
    listCampaign,
    sortField,
    tableViewMode,
    listRunningWorkflow,
    pageSize = 30,
  } = props;

  const [page, onSetPage] = useState(1);
  const [searchText, onSetSearchText] = useState("");
  const [selectedRowKeys, onSetSelectedRowKeys] = useState([]);
  const [expandedRowKeys, setExpanedRowKeys] = useState<any[]>([]);
  const [isModalDeleteProfileOpen, setModalDeleteProfileOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { translate, locale } = useTranslation();
  const { pathname } = location;

  useEffect(() => {
    props?.actSetPageName(translate("sidebar.campaign"));
  }, [translate]);

  const listSortField = useMemo(
    () => [
      {
        label: translate("campaign.name"),
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

  const { getListCampaign, loading: getDataLoading } = useGetListCampaign();
  const { updateCampaign } = useUpdateCampaign();
  const {
    isSuccess,
    loading: isDeleteLoading,
    deleteCampaign,
  } = useDeleteCampaign();
  const { getListRunningWorkflow } = useGetListRunningWorkflow();

  useEffect(() => {
    setTimeout(() => {
      getListRunningWorkflow();
    }, 5000);

    clearInterval(interval);
    interval = setInterval(() => {
      getListRunningWorkflow();
    }, 15000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const dataSource: any[] = useMemo(() => {
    return listCampaign?.map((workflow: ICampaign, index: number) => ({
      ...workflow,
      index: (page - 1) * pageSize + index + 1,
    }));
  }, [listCampaign, page, pageSize]);

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

  const onEditCampaign = (campaign: ICampaign, step: number) => {
    props?.actSaveSelectedCampaign(campaign);
    props?.actSetModalCampaignOpen(true);
    props?.actSetCurrentModalStep(step);
  };

  const oCreateCampaign = () => {
    props?.actSaveSelectedCampaign(null);
    props?.actSetModalCampaignOpen(true);
  };

  const onDeleteCampaignGroup = () => {
    deleteCampaign(selectedRowKeys);
  };

  useEffect(() => {
    clearTimeout(searchTimeOut);
    searchTimeOut = setTimeout(() => {
      getListCampaign({ page, pageSize, searchText, sortField });
    }, 200);
  }, [searchText, page, pageSize, sortField]);

  useEffect(() => {
    if (!isDeleteLoading && isSuccess) {
      onSetSelectedRowKeys([]);
      setTimeout(() => {
        getListCampaign({ page, pageSize, searchText, sortField });
      }, 1700);
    }
  }, [isDeleteLoading, isSuccess, page, pageSize, sortField, searchText]);

  useEffect(() => {
    if (isDeleteLoading) {
      setModalDeleteProfileOpen(true);
    }
  }, [isDeleteLoading]);

  const onViewProfile = (campaign: ICampaign) => {
    navigate(
      `${pathname}?campaignId=${campaign?.id}&mode=${CAMPAIGN_VIEW_MODE.VIEW_PROFILE}`,
    );
  };

  const onViewWorkflow = (campaign: ICampaign, workflowId: number) => {
    navigate(
      `${pathname}?campaignId=${campaign?.id}&workflowId=${workflowId}&mode=${CAMPAIGN_VIEW_MODE.VIEW_WORKFLOW}`,
    );
  };

  const expandedRowRender = (campaign: ICampaign) => {
    return (
      <ExpandRowWrapper>
        <div className="info">
          <div className="item">
            <div className="label">{`${translate("profile.profile")}:`}</div>
            <div className="value">
              <Tooltip title={translate("campaign.viewProfile")}>
                <IconHighlightWrapper
                  style={{ marginRight: "0.7rem", marginTop: "0.3rem" }}
                  onClick={() => onViewProfile(campaign)}
                >
                  <MixIcon />
                </IconHighlightWrapper>
              </Tooltip>

              <OptionWrapper onClick={() => onViewProfile(campaign)}>
                <div className="name">{campaign?.profileGroup?.name}</div>
                <div className="description">
                  {campaign?.profileGroup?.note || EMPTY_STRING}
                </div>
              </OptionWrapper>
            </div>
          </div>

          {campaign?.listWorkflow && campaign?.listWorkflow?.length > 0 && (
            <div className="item">
              <div className="label">{translate("campaign.workflow")}:</div>

              {campaign?.listWorkflow?.map(
                (workflow: IWorkflow, index: number) => (
                  <div className="value script" key={index}>
                    <Tooltip title={translate("campaign.viewWorkflow")}>
                      <IconHighlightWrapper
                        style={{ marginRight: "0.7rem", marginTop: "0.3rem" }}
                        onClick={() => onViewWorkflow(campaign, workflow?.id!)}
                      >
                        <ScriptIcon />
                      </IconHighlightWrapper>
                    </Tooltip>

                    <OptionWrapper className="detail">
                      <div
                        className="name"
                        onClick={() => onViewWorkflow(campaign, workflow?.id!)}
                      >
                        {index + 1}. {workflow?.name}
                        {_.find(listRunningWorkflow, {
                          campaignId: campaign?.id,
                          workflowId: workflow?.id,
                        }) && (
                          <Tooltip title={translate("running")}>
                            <Badge
                              status="success"
                              style={{ marginLeft: "1rem" }}
                            />
                          </Tooltip>
                        )}
                      </div>

                      <div
                        className="description"
                        onClick={() => onViewWorkflow(campaign, workflow?.id!)}
                      >
                        {workflow?.note || EMPTY_STRING}
                      </div>
                    </OptionWrapper>

                    <div className="run-time">
                      <div className="label">
                        {translate("campaign.startTime")}:
                      </div>
                      <div className="value">
                        {workflow?.lastRunTime
                          ? formatTimeToDate(workflow?.lastRunTime)
                          : EMPTY_STRING}
                      </div>
                    </div>

                    <div className="run-time">
                      <div className="label">
                        {translate("campaign.endTime")}:
                      </div>
                      <div className="value">
                        {workflow?.lastEndTime
                          ? formatTimeToDate(workflow?.lastEndTime)
                          : EMPTY_STRING}
                      </div>
                    </div>

                    <div className="run-time">
                      <div className="label">
                        {translate("campaign.duration")}:
                      </div>
                      <div className="value">
                        {workflow?.lastRunTime &&
                        workflow?.lastEndTime &&
                        workflow?.lastEndTime > workflow?.lastRunTime
                          ? formatDurationBetween(
                              workflow?.lastRunTime,
                              workflow?.lastEndTime,
                            )
                          : EMPTY_STRING}
                      </div>
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </div>

        <div className="date">
          <div className="item">
            <div className="label">{translate("createAt")}:</div>
            <div className="value">
              {formatTime(Number(campaign?.createAt), locale)}
            </div>
          </div>

          <div className="item">
            <div className="label">{translate("updateAt")}:</div>
            <div className="value">
              {formatTime(Number(campaign?.updateAt), locale)}
            </div>
          </div>
        </div>
      </ExpandRowWrapper>
    );
  };

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

  const onUpdateColor = (campaign: ICampaign, color: string) => {
    updateCampaign({ ...campaign, color });
  };

  const onChangeSortField = (value: string) => {
    props?.actSetSortField({ field: value } as ISorter);
  };

  const onChangeSortOrder = (value: string) => {
    props?.actSetSortField({ order: value } as ISorter);
  };

  return (
    <PageWrapper>
      <title>{translate("sidebar.campaign")}</title>

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
          style={{ marginLeft: "var(--margin-left)", width: "17rem" }}
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
          }}
          value={sortField?.order || null}
          onChange={onChangeSortOrder}
          loading={getDataLoading}
        />

        <Segmented
          style={{ marginLeft: "var(--margin-left)", marginRight: "auto" }}
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
          value={tableViewMode || TABLE_VIEW_MODE.COLLAPSE_ROW}
          onChange={onChangeViewMode}
          size="large"
        />

        <Button
          type="primary"
          style={{ marginRight: "var(--margin-right)" }}
          onClick={oCreateCampaign}
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
          onConfirm={onDeleteCampaignGroup}
          placement="left"
          disabled={selectedRowKeys?.length === 0}
        >
          <span>
            <DeleteButton
              text={translate("button.delete")}
              disabled={selectedRowKeys?.length === 0}
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
          onEditCampaign,
          onViewProfile,
          onViewWorkflow,
          searchText,
          translate,
          locale,
          onUpdateColor,
          listRunningWorkflow,
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
          expandedRowKeys,
        }}
        scroll={{ x: 900, y: "70vh" }}
        loading={getDataLoading}
        onChange={onTableChange}
        size="middle"
      />
      <ModalCampaign isFromWorkflowView={false} />
      <ModalDeleteProfile
        isModalOpen={isModalDeleteProfileOpen}
        setModalOpen={setModalDeleteProfileOpen}
        isDeleteCampaign={true}
      />
    </PageWrapper>
  );
};

export default connect(
  (state: RootState) => ({
    listCampaign: state?.Campaign?.listCampaign,
    totalData: state?.Campaign?.totalData,
    sortField: state?.Campaign?.sortField,
    tableViewMode: state?.Campaign?.tableViewMode,
    listRunningWorkflow: state?.WorkflowRunner?.listRunningWorkflow,
    pageSize: state?.Campaign?.pageSize,
  }),
  {
    actSaveSelectedCampaign,
    actSetCurrentModalStep,
    actSetModalCampaignOpen,
    actSetPageName,
    actSetSortField,
    actSetTableViewMode,
    actSetPageSize,
  },
)(ManageCampaign);
