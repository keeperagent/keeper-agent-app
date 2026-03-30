import { useState, useEffect, useMemo, ComponentType } from "react";
import {
  Table,
  PaginationProps,
  Button,
  Segmented,
  Tooltip,
  Popconfirm,
  Select,
  Dropdown,
} from "antd";
import { connect } from "react-redux";
import HighlighterLib, { HighlighterProps } from "react-highlight-words";
import { useNavigate, useLocation, Link } from "react-router-dom";
import qs from "qs";
import { formatTime, trimText } from "@/service/util";
import { DeleteButton } from "@/component/Button";
import { SearchInput } from "@/component/Input";
import {
  EditIcon,
  BubbleIcon,
  ListIcon,
  EyeOpenIcon,
  DownArrowIcon,
  UpArrowIcon,
} from "@/component/Icon";
import { TotalData } from "@/component";
import { RootState } from "@/redux/store";
import {
  useGetListProfileGroup,
  useDeleteProfileGroup,
  useTranslation,
} from "@/hook";
import {
  actSaveSelectedProfileGroup,
  actSetSortField,
  actSetPageSize,
} from "@/redux/profileGroup";
import { actSaveGetListProfile } from "@/redux/profile";
import { CAMPAIGN_VIEW_MODE, TABLE_PAGE_OPTION } from "@/config/constant";
import { ICampaign, IProfileGroup, ISorter } from "@/electron/type";
import { EMPTY_STRING } from "@/config/constant";
import { SORT_ORDER } from "@/electron/constant";
import ModalProfileGroup from "./ModalProfileGroup";
import ProfileGroupChart from "./ProfileGroupChart";
import {
  ProfileGroupWrapper,
  IconWrapper,
  LinkHoverWrapper,
  ExpandRowWrapper,
  ExpandIconWrapper,
  OptionWrapper,
} from "./style";
import { VIEW_MODE } from "../index";

const Highlighter = HighlighterLib as ComponentType<HighlighterProps>;

let searchTimeOut: any = null;
const GROUP_VIEW_MODE = {
  CHART: "CHART",
  LIST: "LIST",
};

const renderColumns = (
  onEditProfileGroup: (group: IProfileGroup) => void,
  onViewGroup: (groupID: number) => void,
  searchText: string,
  translate: any,
  locale: string,
) => [
  {
    title: translate("indexTable"),
    dataIndex: "index",
    width: "6%",
  },
  {
    title: translate("profileGroup.name"),
    dataIndex: "name",
    width: "45%",
    render: (value: string, record: IProfileGroup) => (
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
    title: translate("profileGroup.totalProfile"),
    dataIndex: "totalProfile",
    width: "15%",
    render: (value: number) => value || 0,
  },
  {
    title: translate("usedBy"),
    dataIndex: "totalUsed",
    width: "13%",
    render: (value: any, record: IProfileGroup) => {
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
              to={`/dashboard/campaign?campaignId=${campaign?.id}&mode=${CAMPAIGN_VIEW_MODE.VIEW_PROFILE}`}
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
    title: "",
    render: (text: any, record: IProfileGroup) => (
      <div className="list-icon">
        <Tooltip title={translate("view")}>
          <span className="icon" onClick={() => onViewGroup(record?.id!)}>
            <EyeOpenIcon />
          </span>
        </Tooltip>

        <EditIcon onClick={() => onEditProfileGroup(record)} />
      </div>
    ),
  },
];

const ProfileGroup = (props: any) => {
  const { translate, locale } = useTranslation();
  const {
    totalData,
    listProfileGroup,
    sortField,
    pageSize = TABLE_PAGE_OPTION[0],
  } = props;

  const [page, onSetPage] = useState(1);
  const [isBtnLoading, setBtnLoading] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [searchText, onSetSearchText] = useState("");
  const [selectedRowKeys, onSetSelectedRowKeys] = useState<number[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [viewMode, setViewMode] = useState(GROUP_VIEW_MODE.LIST);
  const navigate = useNavigate();
  const location = useLocation();
  const { search } = location;
  const { groupID, groupMode } = qs.parse(search, {
    ignoreQueryPrefix: true,
  });

  const listSortField = useMemo(
    () => [
      {
        label: translate("profileGroup.name"),
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

  const { getListProfileGroup, loading: getDataLoading } =
    useGetListProfileGroup();
  const { isSuccess, loading, deleteProfileGroup } = useDeleteProfileGroup();

  useEffect(() => {
    setViewMode(
      groupMode && groupMode !== "undefined"
        ? groupMode?.toString()
        : GROUP_VIEW_MODE.LIST,
    );
  }, [groupMode]);

  useEffect(() => {
    props?.actSaveSelectedProfileGroup(null);

    // reset data
    props?.actSaveGetListProfile({
      data: [],
      page: 1,
      pageSize: 1000,
      totalData: 0,
    });
  }, []);

  useEffect(() => {
    clearTimeout(searchTimeOut);
    searchTimeOut = setTimeout(() => {
      getListProfileGroup({ page, pageSize, searchText, sortField });
    }, 200);
  }, [searchText, page, pageSize, sortField]);

  const onEditProfileGroup = (group: IProfileGroup) => {
    props?.actSaveSelectedProfileGroup(group);
    setModalOpen(true);
    setCurrentStep(0);
  };

  // delete group
  const onDeleteProfileGroup = () => {
    if (selectedRowKeys.length > 0) {
      deleteProfileGroup(selectedRowKeys);
    }
  };

  useEffect(() => {
    if (!loading && isSuccess) {
      setBtnLoading(true);
      onSetSelectedRowKeys([]);
      setTimeout(() => {
        setBtnLoading(false);
        getListProfileGroup({ page, pageSize, searchText, sortField });
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

  const onOpenModalProfileGroup = () => {
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

  const expandedRowRender = (record: IProfileGroup) => {
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
    navigate(
      `/dashboard/profile?group=${groupID}&mode=${VIEW_MODE.PROFILE}&groupMode=${groupMode}`,
    );
  };

  const onChangeViewMode = (value: string | number) => {
    navigate(
      `/dashboard/profile?group=${groupID}&mode=${VIEW_MODE.PROFILE_GROUP}&groupMode=${value}`,
    );
  };

  const onChangeSortField = (value: string) => {
    props?.actSetSortField({ field: value } as ISorter);
  };

  const onChangeSortOrder = (value: string) => {
    props?.actSetSortField({ order: value } as ISorter);
  };

  const dataSource: any[] = listProfileGroup?.map(
    (group: IProfileGroup, index: number) => ({
      ...group,
      index: (page - 1) * pageSize + index + 1,
    }),
  );

  return (
    <ProfileGroupWrapper>
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
            marginRight: "var(--margin-right)",
          }}
          value={sortField?.order || null}
          onChange={onChangeSortOrder}
          loading={getDataLoading}
        />

        <Segmented
          options={[
            {
              value: GROUP_VIEW_MODE.LIST,
              icon: (
                <IconWrapper>
                  <ListIcon />
                </IconWrapper>
              ),
            },
            {
              value: GROUP_VIEW_MODE.CHART,
              icon: (
                <IconWrapper>
                  <BubbleIcon />
                </IconWrapper>
              ),
            },
          ]}
          value={viewMode}
          style={{ marginRight: "auto" }}
          onChange={onChangeViewMode}
          size="large"
        />

        <Button
          type="primary"
          style={{ marginRight: "var(--margin-right)" }}
          onClick={onOpenModalProfileGroup}
        >
          {translate("button.createNew")}
        </Button>

        {viewMode === GROUP_VIEW_MODE.LIST && (
          <Popconfirm
            title={
              <span
                style={{
                  width: "30rem",
                  display: "block",
                }}
              >
                {translate("profile.confirm.deleteProfile")}
              </span>
            }
            onConfirm={onDeleteProfileGroup}
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
        )}
      </div>

      {viewMode === GROUP_VIEW_MODE.CHART ? (
        <ProfileGroupChart showEmptyIcon={true} />
      ) : (
        <Table
          rowSelection={{
            selectedRowKeys,
            onChange: onRowSelectionChange,
          }}
          rowKey={(data) => data?.id!}
          dataSource={dataSource}
          columns={renderColumns(
            onEditProfileGroup,
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
          scroll={{ x: 900, y: "70vh" }}
          loading={getDataLoading}
          onChange={onTableChange}
          size="middle"
        />
      )}

      <ModalProfileGroup
        isModalOpen={isModalOpen}
        setModalOpen={setModalOpen}
        setCurrentStep={setCurrentStep}
        currentStep={currentStep}
      />
    </ProfileGroupWrapper>
  );
};

export default connect(
  (state: RootState) => ({
    listProfileGroup: state?.ProfileGroup?.listProfileGroup,
    totalData: state?.ProfileGroup?.totalData,
    sortField: state?.ProfileGroup?.sortField,
    pageSize: state?.ProfileGroup?.pageSize,
  }),
  {
    actSaveSelectedProfileGroup,
    actSaveGetListProfile,
    actSetSortField,
    actSetPageSize,
  },
)(ProfileGroup);
