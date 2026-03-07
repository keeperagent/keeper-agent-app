import { useState, useEffect, useMemo, Fragment, ComponentType } from "react";
import {
  Table,
  PaginationProps,
  Button,
  Tooltip,
  Switch,
  message,
  Segmented,
  Popconfirm,
  Select,
  Form,
} from "antd";
import qs from "qs";
import _ from "lodash";
import { useLocation, useNavigate } from "react-router-dom";
import { connect } from "react-redux";
import HighlighterLib, { HighlighterProps } from "react-highlight-words";
import { RootState } from "@/redux/store";
import {
  CLOSE_ALL_PROFILE,
  EMPTY_STRING,
  CAMPAIGN_VIEW_MODE,
  DEFAULT_COLOR_PICKER,
} from "@/config/constant";
import {
  DownArrowIcon,
  UpArrowIcon,
  BackIcon,
  SettingIcon,
  EditIcon,
  ExpandLineIcon,
  CollapseLineIcon,
  StopCircle,
  QuestionIcon,
  CalculatorIcon,
  ScriptIcon,
  ReloadIcon,
} from "@/component/Icon";
import { SearchInput, PasswordInput } from "@/component/Input";
import {
  formatTime,
  getPortfolioAppImg,
  getPortfolioAppUrl,
  trimText,
} from "@/service/util";
import {
  WalletAddress,
  TotalData,
  SecretText,
  Status,
  ColorPicker,
} from "@/component";
import {
  ICampaign,
  ICampaignProfile,
  IFlowProfile,
  IProxyIp,
  ColumnConfig,
  IRunningWorkflow,
  ICampaignProfileColumn,
  IWorkflow,
} from "@/electron/type";
import {
  LIST_NETWORK_PROTOCOL,
  PROXY_TYPE,
  PORTFOLIO_APP_NAME,
  MESSAGE,
  SORT_ORDER,
} from "@/electron/constant";
import {
  useGetListCampaignProfile,
  useDeleteCampaignProfile,
  useGetListResourceGroup,
  useTranslation,
  useOpenCampaignProfileInBrowser,
  useCloseCampaignProfileInBrowser,
  useUpdateCampaignProfile,
  useUpdateCampaign,
  useGetCampaignProfileCalculatedValue,
  useSyncCampaignProfile,
  useSyncWorkflowData,
  useGetCampaignProfileColumnStats,
  useGetCacheSecretKey,
  useSetCacheSecretKey,
} from "@/hook";
import {
  GroupColumnConfig,
  getResourceGroupColumn,
  RESOURCE_COLUMN_WIDTH,
  getCampaignProfileAdditionalColumn,
  PROFILE_COLUMN_WIDTH,
} from "@/service/variable";
import {
  actSaveSelectedCampaignProfile,
  actSetMapOpenProfileId,
  actSetPageSize,
} from "@/redux/campaignProfile";
import {
  actSaveSelectedCampaign,
  actShowProfileStatistic,
} from "@/redux/campaign";
import chromiumImg from "@/asset/chromium.png";
import ModalResetCampaignProfile from "@/component/ModalResetCampaignProfile";
import { DeleteButton, UploadButton } from "@/component/Button";
import ModalConfig from "./ModalConfig";
import ModalProfileName from "./ModalProfileName";
import ModalDeleteProfile from "../ModalDeleteProfile";
import {
  PageWrapper,
  ExpandIconWrapper,
  ExpandRowWrapper,
  OpenBrowserWrapper,
  ProfileNameWrapper,
  PortfolioAppWrapper,
  IconWrapper,
  CloseButtonWrapper,
  CloseIconWrapper,
  StatisticWrapper,
} from "./style";
import ModalCalculate from "./ModalCalculate";
import { renderListWorkflowTooltip } from "../CampaignView";
import ModalExportProfile from "./ModalExportProfile";

const Highlighter = HighlighterLib as ComponentType<HighlighterProps>;

const TABLE_VIEW_MODE = {
  EXPAND_ROW: "EXPAND_ROW",
  COLLAPSE_ROW: "COLLAPSE_ROW",
};

let searchTimeOut: any = null;
let interval: any = null;
let fetchColumnStatsInterval: any = null;

const renderColumns = (
  listResourceColumn: GroupColumnConfig[],
  listAdditionalColumn: ColumnConfig[],
  isIncludeWallet: boolean,
  isIncludeStaticProxy: boolean,
  searchText: string,
  onOpenCampaignProfileInBrowser: (campaignProfile: ICampaignProfile) => void,
  onCloseCampaignProfileInBrowser: (campaignProfile?: ICampaignProfile) => void,
  translate: any,
  onOpenModalProfileName: (profile: ICampaignProfile) => void,
  onToggleActiveStatus: (profileId: number, isActive: boolean) => void,
  onViewPortfolio: (walletAddress: string, portfolioApp: string) => void,
  numberOfRound: number,
  mapOpenProfileId: { [key: number]: boolean },
  onUpdateColor: (campaignProfile: ICampaignProfile, color: string) => void,
): any =>
  [
    {
      title: translate("indexTable"),
      dataIndex: "index",
      width: "6rem",
      align: "right",
    },
    {
      title: translate("profile.profileName"),
      dataIndex: "name",
      width: "20rem",
      render: (value: string, record: ICampaignProfile) => (
        <ProfileNameWrapper>
          <div className="name">{trimText(value, 18) || EMPTY_STRING}</div>
          <div className="icon">
            <div
              className="edit"
              onClick={() => onOpenModalProfileName(record)}
            >
              <EditIcon />
            </div>

            <ColorPicker
              color={record?.color || DEFAULT_COLOR_PICKER}
              setColor={(color: string) => onUpdateColor(record, color)}
            />
          </div>
        </ProfileNameWrapper>
      ),
    },
    {
      title: translate("campaign.round"),
      dataIndex: "round",
      width: "8rem",
      align: "right",
    },
    {
      title: translate("status"),
      dataIndex: "isRunning",
      width: "10rem",
      align: "center",
      render: (isRunning: boolean, record: ICampaignProfile) => {
        const { round } = record;
        let text = "";
        if (round === numberOfRound) {
          text = "Done";
        } else {
          text = isRunning ? translate("running") : translate("waiting");
        }

        return (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Status
              content={text}
              isSuccess={isRunning || round === numberOfRound}
            />
          </div>
        );
      },
    },
    isIncludeWallet
      ? {
          title: translate("wallet.walletAddress"),
          dataIndex: "address",
          width: "50rem",
          render: (value: string, record: any) =>
            record?.wallet?.address ? (
              <WalletAddress
                address={record?.wallet?.address}
                searchText={searchText}
              />
            ) : (
              EMPTY_STRING
            ),
        }
      : null,
    isIncludeWallet
      ? {
          title: translate("portfolio"),
          dataIndex: "portfolioApp",
          width: "12rem",
          align: "left",
          render: (value: any, record: ICampaignProfile) => {
            const portfolioApp = record?.walletGroup?.portfolioApp;

            if (!portfolioApp || !record?.wallet?.address) {
              return EMPTY_STRING;
            }

            return (
              <PortfolioAppWrapper
                onClick={() => {
                  onViewPortfolio(
                    record?.wallet?.address || "",
                    record?.walletGroup?.portfolioApp || "",
                  );
                }}
              >
                <div className="icon">
                  <img src={getPortfolioAppImg(portfolioApp)} alt="" />
                </div>

                <Tooltip title={translate("wallet.viewPortfolio")}>
                  <span className="text">
                    {PORTFOLIO_APP_NAME[portfolioApp]}
                  </span>
                </Tooltip>
              </PortfolioAppWrapper>
            );
          },
        }
      : null,
    ...listResourceColumn,
    ...listAdditionalColumn,
    isIncludeStaticProxy
      ? {
          title: "Proxy",
          dataIndex: "proxyIp",
          width: "25rem",
          render: (value: IProxyIp) => {
            const protocol =
              _.find(LIST_NETWORK_PROTOCOL, { value: value?.protocol })
                ?.prefix || "";
            const ip = value?.ip;
            const port = value?.port;
            const str = `${protocol}${ip}:${port}`;
            return str;
          },
        }
      : null,
    {
      title: "Active?",
      dataIndex: "isActive",
      width: "8rem",
      align: "center",
      fixed: "right",
      render: (isActive: boolean, record: ICampaignProfile) => (
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
      title: () => (
        <Tooltip title={translate("closeAllBrowser")}>
          <CloseIconWrapper>
            <StopCircle onClick={() => onCloseCampaignProfileInBrowser()} />
          </CloseIconWrapper>
        </Tooltip>
      ),
      dataIndex: "action",
      width: "11rem",
      align: "center",
      fixed: "right",
      render: (value: any, record: ICampaignProfile) => {
        const profileId = Number(record?.id);

        return mapOpenProfileId[profileId] ? (
          <CloseButtonWrapper>
            <Button
              size="small"
              danger
              type="primary"
              onClick={() => onCloseCampaignProfileInBrowser(record)}
            >
              {translate("close")}
            </Button>
          </CloseButtonWrapper>
        ) : (
          <OpenBrowserWrapper>
            <div
              className="button"
              onClick={() => onOpenCampaignProfileInBrowser(record)}
            >
              <div className="text">{translate("open")}</div>
              <img src={chromiumImg} alt="" />
            </div>
          </OpenBrowserWrapper>
        );
      },
    },
  ]?.filter((column: any) => column !== null);

type IProps = {
  totalData: number;
  listCampaignProfile: ICampaignProfile[];
  selectedCampaign: ICampaign | null;
  selectedWorkflow: IWorkflow | null;
  showProfileStatistic: boolean;
  actSaveSelectedCampaignProfile: (payload: ICampaignProfile | null) => void;
  actSaveSelectedCampaign: (payload: ICampaign | null) => void;
  actShowProfileStatistic: (payload: boolean) => void;
  listRunningWorkflow: IRunningWorkflow[];
  actSetMapOpenProfileId: (payload: { [key: number]: boolean }) => void;
  actSetPageSize: (payload: number) => void;
  mapOpenProfileId: { [key: number]: boolean };
  listColumnStats: ICampaignProfileColumn[];
  pageSize: number;
};

let previousTableViewMode = "";

const ManageCampaignProfile = (props: IProps) => {
  const { translate, locale } = useTranslation();
  const {
    totalData,
    listCampaignProfile,
    selectedCampaign,
    selectedWorkflow,
    listRunningWorkflow,
    mapOpenProfileId,
    showProfileStatistic,
    listColumnStats,
    pageSize = 30,
  } = props;

  const [page, onSetPage] = useState(1);
  const [selectedRowKeys, onSetSelectedRowKeys] = useState([]);
  const [searchText, onSetSearchText] = useState("");
  const [isModalOpen, setModalOpen] = useState(false);
  const [isModalCalculateOpen, setModalCalculateOpen] = useState(false);
  const [isModalResetOpen, setModalResetOpen] = useState(false);
  const [isModalProfileNameOpen, setModalProfileNameOpen] = useState(false);
  const [shouldRefetch, setShouldRefetch] = useState(false);
  const [encryptKey, setEncryptKey] = useState("");
  const [tableViewMode, setTableViewMode] = useState(
    TABLE_VIEW_MODE.COLLAPSE_ROW,
  );
  const [expandedRowKeys, setExpanedRowKeys] = useState<any[]>([]);
  const [isModalDeleteProfileOpen, setModalDeleteProfileOpen] = useState(false);
  const [isModalExportOpen, setModalExportOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { search, pathname } = location;
  const { campaignId } = qs.parse(search, { ignoreQueryPrefix: true });

  const {
    openCampaignProfileInBrowser,
    loading: openSimulatorLoading,
    openCampaignProfileId,
    isSuccess: isOpenCampaignProfileSuccess,
  } = useOpenCampaignProfileInBrowser();
  const {
    closeCampaignProfileInBrowser,
    loading: closeSimulatorLoading,
    closeCampaignProfileId,
    isSuccess: isCloseCampaignProfileSuccess,
  } = useCloseCampaignProfileInBrowser();
  const { getListCampaignProfile, loading: getDataLoading } =
    useGetListCampaignProfile();
  const { getListResourceGroup } = useGetListResourceGroup();
  const { updateCampaign, loading: isUpdateCampaignLoading } =
    useUpdateCampaign();
  const { getCampaignProfileCalculatedValue } =
    useGetCampaignProfileCalculatedValue();
  const { getCampaignProfileColumnStats } = useGetCampaignProfileColumnStats();
  const {
    syncCampaignProfile,
    loading: isSyncLoading,
    isSuccess: isSyncSuccess,
  } = useSyncCampaignProfile();
  const { syncWorkflowData } = useSyncWorkflowData();
  const {
    loading: deleteCampaignProfileLoading,
    isSuccess,
    deleteCampaignProfile,
  } = useDeleteCampaignProfile();
  const { updateCampaignProfile } = useUpdateCampaignProfile();
  const {
    getCacheSecretKey,
    secretKey,
    loading: isGetCacheSecretKeyLoading,
  } = useGetCacheSecretKey();
  const { setCacheSecretKey } = useSetCacheSecretKey();
  const [form] = Form.useForm();

  useEffect(() => {
    if (isGetCacheSecretKeyLoading) {
      return;
    }

    setEncryptKey(secretKey || "");
    form.setFieldsValue({ encryptKey: secretKey || "" });
  }, [isGetCacheSecretKeyLoading, secretKey]);

  useEffect(() => {
    if (selectedCampaign?.id) {
      getCacheSecretKey(selectedCampaign?.id);
    }
  }, [selectedCampaign?.id, selectedWorkflow?.id]);

  useEffect(() => {
    if (isOpenCampaignProfileSuccess || openSimulatorLoading) {
      props?.actSetMapOpenProfileId({ [openCampaignProfileId]: true });
    }
  }, [
    isOpenCampaignProfileSuccess,
    openCampaignProfileId,
    openSimulatorLoading,
  ]);

  useEffect(() => {
    if (selectedCampaign) {
      getCampaignProfileCalculatedValue(selectedCampaign?.id!);
    }
  }, [selectedCampaign]);

  useEffect(() => {
    if (isCloseCampaignProfileSuccess && !closeSimulatorLoading) {
      if (closeCampaignProfileId === CLOSE_ALL_PROFILE) {
        props?.actSetMapOpenProfileId({});
      } else {
        props?.actSetMapOpenProfileId({ [closeCampaignProfileId]: false });
      }
    }
  }, [
    isCloseCampaignProfileSuccess,
    closeCampaignProfileId,
    closeSimulatorLoading,
  ]);

  useEffect(() => {
    if (!shouldRefetch) {
      return;
    }

    setShouldRefetch(false);
    getListCampaignProfile({
      page,
      pageSize,
      searchText,
      campaignId: Number(campaignId?.toString()),
      encryptKey,
      sortField: {
        field: selectedCampaign?.sortField || "",
        order: selectedCampaign?.sortOrder || "",
      },
    });
  }, [
    shouldRefetch,
    campaignId,
    searchText,
    page,
    pageSize,
    encryptKey,
    selectedCampaign,
  ]);

  useEffect(() => {
    syncWorkflowData(0, selectedCampaign?.id!);
    getListResourceGroup({ page: 1, pageSize: 10000 });

    return () => {
      window?.electron?.removeAllListeners(
        MESSAGE.OPEN_CAMPAIGN_PROFILE_IN_BROWSER_RES,
      );
      clearInterval(interval);
      clearInterval(fetchColumnStatsInterval);
    };
  }, []);

  useEffect(() => {
    clearTimeout(searchTimeOut);
    searchTimeOut = setTimeout(() => {
      getListCampaignProfile({
        page,
        pageSize,
        searchText,
        campaignId: Number(campaignId?.toString()),
        encryptKey,
        sortField: {
          field: selectedCampaign?.sortField || "",
          order: selectedCampaign?.sortOrder || "",
        },
      });

      if (interval) {
        clearInterval(interval);
      }
      interval = setInterval(() => {
        getListCampaignProfile({
          page,
          pageSize,
          searchText,
          campaignId: Number(campaignId?.toString()),
          encryptKey,
          sortField: {
            field: selectedCampaign?.sortField || "",
            order: selectedCampaign?.sortOrder || "",
          },
        });
      }, 15 * 1000);
    }, 200);
  }, [page, pageSize, searchText, campaignId, encryptKey, selectedCampaign]);

  useEffect(() => {
    if (fetchColumnStatsInterval) {
      clearInterval(fetchColumnStatsInterval);
    }

    if (!campaignId || !showProfileStatistic) {
      return;
    }

    getCampaignProfileColumnStats(Number(campaignId));
    fetchColumnStatsInterval = setInterval(() => {
      getCampaignProfileColumnStats(Number(campaignId));
    }, 5000);
  }, [showProfileStatistic, campaignId]);

  const onBack = () => {
    navigate(`/dashboard/campaign?mode=${CAMPAIGN_VIEW_MODE.VIEW_CAMPAIGN}`);
  };

  const onOpenModal = () => {
    setModalOpen(true);
  };

  const onOpenModalCalculate = () => {
    setModalCalculateOpen(true);
  };

  const isCampaignProfileEncrypted = (campaignProfile: ICampaignProfile) => {
    const { wallet, listResource = [] } = campaignProfile;
    const isWalletEncrypted = wallet?.isOriginalEncrypted;
    const isResourceEncrypted =
      listResource?.filter((resource) => resource?.isOriginalEncrypted)
        ?.length > 0;
    const isEcrypted = isWalletEncrypted || isResourceEncrypted;
    return isEcrypted;
  };

  const onOpenCampaignProfileInBrowser = (
    campaignProfile: ICampaignProfile,
  ) => {
    if (isCampaignProfileEncrypted(campaignProfile) && !encryptKey) {
      message.error(translate("workflow.missingSecretKey"));
      return;
    }

    const flowProfile: IFlowProfile = {
      profile: campaignProfile,
      threadID: campaignProfile.profileFolder || "", // only use this thread id to open campaign profile directly
      isSaveProfile: true,
      campaignConfig: {
        isUseProxy: selectedCampaign?.isUseProxy,
        proxyService: selectedCampaign?.proxyService,
        proxyType: selectedCampaign?.proxyType,
        defaultOpenUrl: selectedCampaign?.defaultOpenUrl,
        maxProfilePerProxy: selectedCampaign?.maxProfilePerProxy,
        windowWidth: selectedCampaign?.windowWidth,
        windowHeight: selectedCampaign?.windowHeight,
        isFullScreen: selectedCampaign?.isFullScreen,
        totalScreen: 1,
        numberOfRound: selectedCampaign?.numberOfRound || 1,
        campaignId: selectedCampaign?.id,
        isUseBrowser: true,
      },
    };
    openCampaignProfileInBrowser(flowProfile);
  };

  const onCloseCampaignProfileInBrowser = (
    campaignProfile?: ICampaignProfile,
  ) => {
    const flowProfile: IFlowProfile = {
      profile: campaignProfile,
      threadID: campaignProfile?.profileFolder || "",
      campaignConfig: {
        campaignId: selectedCampaign?.id,
      },
    };
    closeCampaignProfileInBrowser(campaignProfile ? flowProfile : undefined);
  };

  // delete wallet
  const onDeleteCampaignProfile = () => {
    deleteCampaignProfile(selectedRowKeys);
  };

  useEffect(() => {
    if (!deleteCampaignProfileLoading && isSuccess) {
      onSetSelectedRowKeys([]);
      setShouldRefetch(true);
    }
  }, [deleteCampaignProfileLoading, isSuccess]);

  useEffect(() => {
    if (deleteCampaignProfileLoading) {
      setModalDeleteProfileOpen(true);
    }
  }, [deleteCampaignProfileLoading]);

  const onTableChange = (pagination?: PaginationProps) => {
    pagination?.current !== page && onSetPage(pagination?.current!);
    pagination?.pageSize !== pageSize &&
      props.actSetPageSize(pagination?.pageSize!);
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

  const onRowSelectionChange = (selectedKeys: any) => {
    onSetSelectedRowKeys(selectedKeys);
  };

  const onOpenModalReset = () => {
    setModalResetOpen(true);
  };

  const onViewPortfolio = (walletAddress: string, portfolioApp: string) => {
    const url = getPortfolioAppUrl(walletAddress, portfolioApp);

    window?.electron?.send(MESSAGE.OPEN_EXTERNAL_LINK, {
      url,
    });
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onRowSelectionChange,
  };

  const onOpenProfileFolder = (campaignProfile: ICampaignProfile) => {
    if (isCampaignProfileEncrypted(campaignProfile) && !encryptKey) {
      return;
    }

    window?.electron?.send(MESSAGE.OPEN_FOLDER, {
      folderPath: campaignProfile?.profileFolderPath,
    });
  };

  const expandedRowRender = (record: ICampaignProfile) => {
    return (
      <ExpandRowWrapper>
        <div className="info">
          {record?.wallet?.id !== undefined && (
            <div className="item">
              <div className="label">Phrase:</div>
              {record?.wallet?.phrase ? (
                <SecretText
                  text={record?.wallet?.phrase}
                  style={{ fontSize: "1.2rem" }}
                />
              ) : (
                EMPTY_STRING
              )}
            </div>
          )}

          {record?.wallet?.id !== undefined && (
            <div className="item">
              <div className="label">{translate("wallet.privateKey")}:</div>
              {record?.wallet?.privateKey ? (
                <SecretText
                  text={record?.wallet?.privateKey}
                  style={{ fontSize: "1.2rem" }}
                />
              ) : (
                EMPTY_STRING
              )}
            </div>
          )}

          <div className="item">
            <div className="label">Profile folder:</div>
            <div
              onClick={() => onOpenProfileFolder(record)}
              style={{ cursor: "pointer" }}
            >
              {isCampaignProfileEncrypted(record) && !encryptKey
                ? EMPTY_STRING
                : record?.profileFolderPath}
            </div>
          </div>

          <div className="item">
            <div className="label">{translate("note")}:</div>
            <div className="value">
              {record?.note ? (
                <Highlighter
                  textToHighlight={record?.note || ""}
                  searchWords={[searchText]}
                  highlightClassName="highlight"
                />
              ) : (
                EMPTY_STRING
              )}
            </div>
          </div>
        </div>

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

  const onToggleActiveStatus = async (profileId: number, isActive: boolean) => {
    await updateCampaignProfile(
      {
        id: profileId,
        isActive,
        campaignId: selectedCampaign?.id,
      },
      encryptKey,
    );
    message.success(translate("updateSuccess"));
  };

  const onUpdateColor = async (
    campaignProfile: ICampaignProfile,
    color: string,
  ) => {
    await updateCampaignProfile({ ...campaignProfile, color }, encryptKey);
  };

  const onOpenModalProfileName = (profile: ICampaignProfile) => {
    setModalProfileNameOpen(true);
    props?.actSaveSelectedCampaignProfile(profile);
  };

  const dataSource: any[] = useMemo(() => {
    return listCampaignProfile?.map(
      (profile: ICampaignProfile, index: number) => ({
        ...profile,
        index: (page - 1) * pageSize + index + 1,
      }),
    );
  }, [listCampaignProfile, page, pageSize]);

  const onChangeViewMode = (value: string | number) => {
    setTableViewMode(value?.toString());
  };

  useEffect(() => {
    if (tableViewMode === previousTableViewMode) {
      return;
    }

    if (tableViewMode === TABLE_VIEW_MODE.COLLAPSE_ROW) {
      setExpanedRowKeys([]);
    } else if (tableViewMode === TABLE_VIEW_MODE.EXPAND_ROW) {
      setExpanedRowKeys(dataSource?.map((data: any) => data?.id!) || []);
    }

    previousTableViewMode = tableViewMode;
  }, [tableViewMode, dataSource]);

  const listResourceColumn = useMemo(() => {
    return getResourceGroupColumn(
      selectedCampaign?.profileGroup?.listResourceGroupId || [],
      selectedCampaign?.profileGroup?.listResourceGroup || [],
    );
  }, [selectedCampaign, searchText]);

  const listAdditionalColumn = useMemo(() => {
    return getCampaignProfileAdditionalColumn(selectedCampaign);
  }, [selectedCampaign]);

  const tableWidth = useMemo(() => {
    let width = 1100;
    width += listAdditionalColumn?.length * PROFILE_COLUMN_WIDTH;
    listResourceColumn?.forEach((column: GroupColumnConfig) => {
      width += column?.children?.length * RESOURCE_COLUMN_WIDTH;
    });

    return width;
  }, [listResourceColumn, listAdditionalColumn]);

  const isIncludeWallet = useMemo(() => {
    return typeof selectedCampaign?.profileGroup?.walletGroupId === "number";
  }, [selectedCampaign]);

  const listSortField = useMemo(() => {
    const listField = [
      {
        label: "Round",
        value: "round",
      },
      {
        label: translate("color"),
        value: "color",
      },
    ];
    if (isIncludeWallet) {
      listField.push({
        label: translate("wallet.walletAddress"),
        value: "walletAddress",
      });
    }

    listAdditionalColumn.forEach((column) => {
      if (column?.title && column?.dataIndex) {
        listField?.push({
          label: column?.title,
          value: column?.dataIndex,
        });
      }
    });

    return listField;
  }, [listResourceColumn, listAdditionalColumn, isIncludeWallet]);

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
    const data = {
      ...selectedCampaign,
      sortField: value,
    };
    updateCampaign(data);
    props?.actSaveSelectedCampaign(data);
  };

  const onChangeSortOrder = (value: string) => {
    const data = {
      ...selectedCampaign,
      sortOrder: value,
    };
    updateCampaign(data);
    props?.actSaveSelectedCampaign(data);
  };

  const onViewWorkflow = (campaign: ICampaign, workflowId: number) => {
    navigate(
      `${pathname}?campaignId=${campaign?.id}&workflowId=${workflowId}&mode=${CAMPAIGN_VIEW_MODE.VIEW_WORKFLOW}`,
    );
  };

  const onSyncCampaignProfile = () => {
    syncCampaignProfile(selectedCampaign?.id!);
  };

  useEffect(() => {
    if (isSyncSuccess && !isSyncLoading) {
      setShouldRefetch(true);
    }
  }, [isSyncLoading, isSyncSuccess]);

  const onOpenModalExport = () => {
    setModalExportOpen(true);
  };

  const onToggleStatistic = () => {
    props?.actShowProfileStatistic(!showProfileStatistic);
  };

  const onChangeEncryptKey = (value: string) => {
    setEncryptKey(value);
    setCacheSecretKey(selectedCampaign?.id || 0, value);
  };

  return (
    <PageWrapper>
      <title>Profile</title>

      <div className="heading">
        <div className="back" onClick={onBack}>
          <div className="icon">
            <BackIcon />
          </div>
          <div className="text">{translate("back")}</div>
        </div>

        <SearchInput
          onChange={onSetSearchText}
          value={searchText}
          placeholder={translate("button.search")}
          style={{
            width: "35rem",
            marginRight: "var(--margin-right)",
          }}
        />

        <Form form={form}>
          <PasswordInput
            name="encryptKey"
            placeholder={translate("wallet.secretKey")}
            width="14rem"
            onChange={onChangeEncryptKey}
            extendClass="encryptKey-header"
          />
        </Form>

        <UploadButton
          text="Export"
          onClick={onOpenModalExport}
          isUploadButton={true}
          style={{ marginRight: "var(--margin-right)", marginLeft: "auto" }}
        />

        <Button
          type="primary"
          style={{ marginRight: "var(--margin-right)" }}
          onClick={onOpenModalReset}
        >
          Reset
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
          onConfirm={onDeleteCampaignProfile}
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

      <StatisticWrapper>
        {[
          selectedCampaign?.col1Variable,
          selectedCampaign?.col2Variable,
          selectedCampaign?.col3Variable,
          selectedCampaign?.col4Variable,
          selectedCampaign?.col5Variable,
          selectedCampaign?.col6Variable,
          selectedCampaign?.col7Variable,
          selectedCampaign?.col8Variable,
          selectedCampaign?.col9Variable,
          selectedCampaign?.col10Variable,
        ]?.filter((item: any) => Boolean(item))?.length > 0 && (
          <Fragment>
            <div className="toggle" onClick={onToggleStatistic}>
              <Tooltip
                placement="top"
                title={translate("campaign.showColumnStatistic")}
              >
                <span>
                  {!showProfileStatistic ? "Show statistic" : "Hide statistic"}
                </span>
              </Tooltip>
            </div>

            <div className="list-item">
              {showProfileStatistic &&
                (listColumnStats?.length > 0 ? (
                  listColumnStats?.map(
                    (column: ICampaignProfileColumn, index: number) => (
                      <div className="stats-info" key={index}>
                        <div className="label">
                          {trimText(column?.label || EMPTY_STRING, 20)}
                        </div>
                        <div className="value">
                          {trimText(column?.value || EMPTY_STRING, 11)}
                        </div>
                      </div>
                    ),
                  )
                ) : (
                  <span style={{ fontSize: "1.3rem" }}>{EMPTY_STRING}</span>
                ))}
            </div>
          </Fragment>
        )}

        <Segmented
          style={{ marginLeft: "auto" }}
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
          style={{
            marginLeft: "var(--margin-left)",
            minWidth: "17rem",
            maxWidth: "17rem",
          }}
          value={selectedCampaign?.sortField || null}
          onChange={onChangeSortField}
          loading={isUpdateCampaignLoading}
        />

        <Select
          className="custom-select"
          placeholder={translate("sortOrder")}
          allowClear
          size="large"
          options={listSortOrder}
          style={{
            marginLeft: "var(--margin-left)",
            minWidth: "14rem",
            maxWidth: "14rem",
          }}
          value={selectedCampaign?.sortOrder || null}
          onChange={onChangeSortOrder}
          loading={isUpdateCampaignLoading}
        />

        <Tooltip placement="top" title={translate("campaign.sorterTooltip")}>
          <span className="question-icon">
            <QuestionIcon />
          </span>
        </Tooltip>

        <Tooltip title={translate("campaign.configSubColumn")}>
          <div className="setting" onClick={onOpenModal}>
            <SettingIcon />
          </div>
        </Tooltip>

        <Tooltip title={translate("campaign.calculateTotalColumn")}>
          <div className="calculator" onClick={onOpenModalCalculate}>
            <CalculatorIcon />
          </div>
        </Tooltip>

        {renderListWorkflowTooltip(
          selectedCampaign!,
          onViewWorkflow,
          listRunningWorkflow,
          <ScriptIcon />,
          translate,
          "calculator",
        )}

        <Tooltip title={translate("campaign.syncProfile")}>
          <div className="calculator" onClick={onSyncCampaignProfile}>
            <ReloadIcon />
          </div>
        </Tooltip>
      </StatisticWrapper>

      <Table
        rowSelection={rowSelection}
        rowKey={(data) => data?.id!}
        dataSource={dataSource}
        columns={renderColumns(
          listResourceColumn,
          listAdditionalColumn,
          isIncludeWallet,
          Boolean(selectedCampaign?.isUseProxy) &&
            selectedCampaign?.proxyType === PROXY_TYPE.STATIC_PROXY,
          searchText,
          onOpenCampaignProfileInBrowser,
          onCloseCampaignProfileInBrowser,
          translate,
          onOpenModalProfileName,
          onToggleActiveStatus,
          onViewPortfolio,
          selectedCampaign?.numberOfRound || -1,
          mapOpenProfileId,
          onUpdateColor,
        )}
        pagination={{
          total: totalData,
          pageSize,
          pageSizeOptions: ["30", "50", "300"],
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
        scroll={{ x: tableWidth, y: "65vh" }}
        loading={getDataLoading}
        onChange={onTableChange}
        size="middle"
        bordered
        style={{
          marginBottom: "var(--margin-bottom-large)",
          marginTop: "var(--margin-top)",
        }}
      />

      <ModalConfig isModalOpen={isModalOpen} setModalOpen={setModalOpen} />
      <ModalResetCampaignProfile
        isModalOpen={isModalResetOpen}
        setModalOpen={setModalResetOpen}
        selectedRowKeys={selectedRowKeys}
        setShouldRefetch={setShouldRefetch}
      />
      <ModalProfileName
        isModalOpen={isModalProfileNameOpen}
        setModalOpen={setModalProfileNameOpen}
        encryptKey={encryptKey}
      />
      <ModalDeleteProfile
        isModalOpen={isModalDeleteProfileOpen}
        setModalOpen={setModalDeleteProfileOpen}
        isDeleteCampaign={false}
      />
      <ModalCalculate
        isModalOpen={isModalCalculateOpen}
        setModalOpen={setModalCalculateOpen}
      />
      <ModalExportProfile
        isModalOpen={isModalExportOpen}
        setModalOpen={setModalExportOpen}
      />
    </PageWrapper>
  );
};

export default connect(
  (state: RootState) => ({
    listCampaignProfile: state?.CampaignProfile?.listCampaignProfile,
    totalData: state?.CampaignProfile?.totalData,
    selectedCampaign: state?.Campaign?.selectedCampaign,
    showProfileStatistic: state?.Campaign?.showProfileStatistic,
    listRunningWorkflow: state?.WorkflowRunner?.listRunningWorkflow,
    mapOpenProfileId: state?.CampaignProfile?.mapOpenProfileId,
    listColumnStats: state?.CampaignProfile?.listColumnStats || [],
    selectedWorkflow: state?.Workflow?.selectedWorkflow,
    pageSize: state?.CampaignProfile?.pageSize,
  }),
  {
    actSaveSelectedCampaignProfile,
    actSaveSelectedCampaign,
    actSetMapOpenProfileId,
    actShowProfileStatistic,
    actSetPageSize,
  },
)(ManageCampaignProfile);
