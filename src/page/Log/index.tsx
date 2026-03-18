import { useEffect, useState, useMemo, ComponentType } from "react";
import { PaginationProps, Table, Popconfirm, Select, Tooltip } from "antd";
import { connect } from "react-redux";
import HighlighterLib, { HighlighterProps } from "react-highlight-words";
import { ICampaign, ILog, IWorkflow } from "@/electron/type";
import { formatTime } from "@/service/util";
import { DeleteButton } from "@/component/Button";
import { SearchInput, TotalData } from "@/component";
import { RootState } from "@/redux/store";
import {
  useDeleteUserLog,
  useGetListCampaign,
  useGetListWorkflow,
  useGetListUserLog,
  useTranslation,
} from "@/hook";
import { EMPTY_STRING, TABLE_PAGE_OPTION } from "@/config/constant";
import { SettingIcon } from "@/component/Icon";
import { actSetPageName } from "@/redux/layout";
import { actSetPageSize } from "@/redux/userLog";
import { OptionWrapper, PageWrapper } from "./style";
import ModalConfigLog from "./ModalConfigLog";

const Highlighter = HighlighterLib as ComponentType<HighlighterProps>;

let searchTimeOut: any = null;
const { Option } = Select;

const renderColumns = (searchText: string, translate: any, locale: string) => [
  {
    title: translate("indexTable"),
    dataIndex: "index",
    width: "5%",
  },
  {
    title: translate("content"),
    dataIndex: "content",
    width: "80%",
    render: (value: string) =>
      value ? (
        <Highlighter
          textToHighlight={value}
          searchWords={[searchText]}
          highlightClassName="highlight"
        />
      ) : (
        EMPTY_STRING
      ),
  },
  {
    title: translate("createdAt"),
    dataIndex: "createAt",
    width: "15%",
    render: (value: number) => formatTime(Number(value), locale),
  },
];

let searchCampaignTimeOut: any = null;
let searchWorkflowTimeOut: any = null;

const ManageLog = (props: any) => {
  const {
    totalData,
    listLog,
    listCampaign,
    listWorkflow,
    pageSize = TABLE_PAGE_OPTION[0],
  } = props;

  const { translate, locale } = useTranslation();
  const [page, onSetPage] = useState(1);
  const [searchText, onSetSearchText] = useState("");
  const [isBtnLoading, setBtnLoading] = useState(false);
  const [selectedRowKeys, onSetSelectedRowKeys] = useState([]);
  const [shouldRefetch, setShouldRefetch] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [campaign, setCampaign] = useState<ICampaign | null>(null);
  const [workflow, setWorkflow] = useState<IWorkflow | null>(null);

  useEffect(() => {
    props?.actSetPageName(translate("sidebar.log"));
  }, [translate]);

  const { getListUserLog, loading: getDataLoading } = useGetListUserLog();
  const {
    isSuccess,
    loading: isDeleteLoading,
    deleteUserLog,
  } = useDeleteUserLog();
  const { getListCampaign, loading: getListCampaignLoading } =
    useGetListCampaign();
  const { getListWorkflow, loading: getListWorkflowLoading } =
    useGetListWorkflow();

  const onSearchCampaign = (text: string) => {
    if (searchCampaignTimeOut) {
      clearTimeout(searchCampaignTimeOut);
    }
    searchCampaignTimeOut = setTimeout(() => {
      getListCampaign({ page: 1, pageSize: 1000, searchText: text });
    }, 200);
  };

  const onSearchWorkflow = (text: string) => {
    if (searchWorkflowTimeOut) {
      clearTimeout(searchWorkflowTimeOut);
    }
    searchWorkflowTimeOut = setTimeout(() => {
      getListWorkflow({ page: 1, pageSize: 1000, searchText: text });
    }, 200);
  };

  const dataSource: any[] = useMemo(() => {
    return listLog?.map((log: ILog, index: number) => ({
      ...log,
      index: (page - 1) * pageSize + index + 1,
    }));
  }, [listLog, page, pageSize]);

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

  const onChangeCampaign = (campaignId: number) => {
    setCampaign(
      listCampaign?.find(
        (campaign: ICampaign) => campaign?.id === campaignId,
      ) || null,
    );
  };

  const onChangeWorkflow = (workflowId: number) => {
    setWorkflow(
      listWorkflowToSearch?.find(
        (workflow: IWorkflow) => workflow?.id === workflowId,
      ) || null,
    );
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
    deleteUserLog(selectedRowKeys);
  };

  useEffect(() => {
    clearTimeout(searchTimeOut);
    searchTimeOut = setTimeout(() => {
      getListUserLog({
        page,
        pageSize,
        searchText,
        campaignId: campaign?.id,
        workflowId: workflow?.id,
      });
    }, 200);
  }, [searchText, page, pageSize, campaign, workflow]);

  useEffect(() => {
    if (getDataLoading && shouldRefetch) {
      setShouldRefetch(false);
    }
  }, [getDataLoading, shouldRefetch]);

  useEffect(() => {
    if (shouldRefetch) {
      getListUserLog({
        page,
        pageSize,
        searchText,
        campaignId: campaign?.id,
        workflowId: workflow?.id,
      });
    }
  }, [page, pageSize, searchText, shouldRefetch, campaign, workflow]);

  useEffect(() => {
    if (!isDeleteLoading && isSuccess) {
      onSetSelectedRowKeys([]);
      setShouldRefetch(true);

      setTimeout(() => {
        setBtnLoading(false);
      }, 3000);
    }
  }, [isDeleteLoading, isSuccess]);

  const onOpenModal = () => {
    setModalOpen(true);
  };

  const listWorkflowToSearch = useMemo(() => {
    if (campaign) {
      return campaign?.listWorkflow || [];
    }

    return listWorkflow;
  }, [campaign, listWorkflow]);

  return (
    <PageWrapper>
      <title>{translate("history.statistic")}</title>

      <div className="heading">
        <SearchInput
          onChange={onSetSearchText}
          value={searchText}
          placeholder={translate("button.search")}
          style={{ marginRight: "var(--margin-right)", width: "30rem" }}
        />

        <Select
          size="large"
          className="custom-select"
          placeholder={translate("schedule.selectCampaign")}
          showSearch
          onSearch={onSearchCampaign}
          filterOption={false}
          value={campaign?.id}
          loading={getListCampaignLoading}
          onChange={onChangeCampaign}
          style={{ marginRight: "var(--margin-right)", width: "25rem" }}
          allowClear
          optionLabelProp="label"
        >
          {listCampaign?.map((campaign: ICampaign) => (
            <Option
              key={campaign?.id}
              value={campaign?.id}
              label={campaign?.name}
            >
              <OptionWrapper>
                <div className="name">{campaign?.name || EMPTY_STRING}</div>
                <div className="description">
                  {formatTime(Number(campaign?.createAt), locale)}
                </div>
              </OptionWrapper>
            </Option>
          ))}
        </Select>

        <Select
          size="large"
          className="custom-select"
          placeholder={translate("campaign.selectWorkflow")}
          showSearch
          onSearch={onSearchWorkflow}
          value={workflow?.id}
          onChange={onChangeWorkflow}
          loading={getListWorkflowLoading}
          style={{ marginRight: "var(--margin-right)", width: "25rem" }}
          allowClear
          optionLabelProp="label"
        >
          {listWorkflowToSearch?.map((workflow: IWorkflow) => (
            <Option
              key={workflow?.id}
              value={workflow?.id}
              label={workflow?.name}
            >
              <OptionWrapper>
                <div className="name">{workflow?.name || EMPTY_STRING}</div>
                <div className="description">
                  {workflow?.note || EMPTY_STRING}
                </div>
              </OptionWrapper>
            </Option>
          ))}
        </Select>

        <Tooltip title={translate("workflow.setting")}>
          <div
            className="setting"
            onClick={onOpenModal}
            style={{ marginRight: "auto" }}
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
        rowKey={(data: ILog) => data?.id?.toString() || ""}
        dataSource={dataSource}
        // @ts-ignore
        columns={renderColumns(searchText, translate, locale)}
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
      />

      <ModalConfigLog isModalOpen={isModalOpen} setModalOpen={setModalOpen} />
    </PageWrapper>
  );
};

export default connect(
  (state: RootState) => ({
    listLog: state?.UserLog?.listLog,
    totalData: state?.UserLog?.totalData,
    listCampaign: state?.Campaign?.listCampaign,
    listWorkflow: state?.Workflow?.listWorkflow,
    pageSize: state?.UserLog?.pageSize,
  }),
  { actSetPageName, actSetPageSize },
)(ManageLog);
