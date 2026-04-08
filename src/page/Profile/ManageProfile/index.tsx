import { useState, useEffect, useMemo, ComponentType } from "react";
import { Table, PaginationProps, Button, Select, Segmented } from "antd";
import _ from "lodash";
import { useLocation } from "react-router-dom";
import qs from "qs";
import { connect } from "react-redux";
import HighlighterLib, { HighlighterProps } from "react-highlight-words";
import { RootState } from "@/redux/store";
import {
  DownArrowIcon,
  UpArrowIcon,
  EditIcon,
  ExpandLineIcon,
  CollapseLineIcon,
} from "@/component/Icon";
import { SearchInput, PasswordInput } from "@/component/Input";
import { formatTime } from "@/service/util";
import { EMPTY_STRING, TABLE_PAGE_OPTION } from "@/config/constant";
import { WalletAddress, TotalData, SecretText } from "@/component";
import { actSaveSelectedProfile, actSetTableViewMode } from "@/redux/profile";
import { actSetPageSize } from "@/redux/profile";
import { DeleteButton, UploadButton } from "@/component/Button";
import { IProfile, IProfileGroup } from "@/electron/type";
import {
  useGetListProfile,
  useDeleteProfile,
  useGetOneProfileGroup,
  useGetListProfileGroup,
  useTranslation,
} from "@/hook";
import { actSaveSelectedProfileGroup } from "@/redux/profileGroup";
import {
  GroupColumnConfig,
  getResourceGroupColumn,
  RESOURCE_COLUMN_WIDTH,
} from "@/service/variable";
import { removeSpecialCharacter } from "@/component/Workflow/Panel/util";
import ModalProfile from "./ModalProfile";
import ModalProfileName from "./ModalProfileName";
import {
  PageWrapper,
  ExpandIconWrapper,
  ExpandRowWrapper,
  ProfileNameWrapper,
  OptionWrapper,
  IconWrapper,
} from "./style";
import ModalExportProfile from "./ModalExportProfile";

const Highlighter = HighlighterLib as ComponentType<HighlighterProps>;

const { Option } = Select;

const TABLE_VIEW_MODE = {
  EXPAND_ROW: "EXPAND_ROW",
  COLLAPSE_ROW: "COLLAPSE_ROW",
};

let searchTimeOut: any = null;
let searchProfileGroupTimeOut: any = null;

const renderColumns = (
  listResourceColumn: GroupColumnConfig[],
  isIncludeWallet: boolean,
  searchText: string,
  translate: any,
  onOpenModalProfileName: (profile: IProfile) => void,
): any =>
  [
    {
      title: translate("indexTable"),
      dataIndex: "index",
      width: 60,
    },
    {
      title: translate("profile.profileName"),
      dataIndex: "name",
      width: 150,
      render: (value: string, record: IProfile) => (
        <ProfileNameWrapper onClick={() => onOpenModalProfileName(record)}>
          <div className="name">{value || EMPTY_STRING}</div>
          <div className="icon">
            <EditIcon />
          </div>
        </ProfileNameWrapper>
      ),
    },
    isIncludeWallet
      ? {
          title: translate("wallet.walletAddress"),
          dataIndex: "address",
          width: 550,
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
    ...listResourceColumn,
    {
      title: "",
      dataIndex: "empty",
    },
  ]?.filter((column: any) => column !== null);

const ManageProfile = (props: any) => {
  const { translate, locale } = useTranslation();
  const {
    totalData,
    listProfile,
    listProfileGroup,
    selectedProfileGroup,
    tableViewMode,
    pageSize = TABLE_PAGE_OPTION[0],
  } = props;

  const [isModalOpen, setModalOpen] = useState(false);
  const [isModalProfileNameOpen, setModalProfileNameOpen] = useState(false);
  const [page, onSetPage] = useState(1);
  const [selectedRowKeys, onSetSelectedRowKeys] = useState([]);
  const [searchText, onSetSearchText] = useState("");
  const [shouldRefetch, setShouldRefetch] = useState(false);
  const [isBtnLoading, setBtnLoading] = useState(false);
  const [encryptKey, setEncryptKey] = useState("");
  const [expandedRowKeys, setExpanedRowKeys] = useState<any[]>([]);
  const [isModalExportOpen, setModalExportOpen] = useState(false);

  const location = useLocation();
  const { search } = location;
  const { group, openModal } = qs.parse(search, { ignoreQueryPrefix: true });

  const { getListProfile, loading: getDataLoading } = useGetListProfile();
  const {
    loading: deleteProfileLoading,
    isSuccess,
    deleteProfile,
  } = useDeleteProfile();

  const { getOneProfileGroup, loading: isSelectLoading } =
    useGetOneProfileGroup();
  const { getListProfileGroup } = useGetListProfileGroup();

  useEffect(() => {
    getListProfileGroup({ page: 1, pageSize: 1000 });
  }, []);

  useEffect(() => {
    if (!tableViewMode) {
      props?.actSetTableViewMode(TABLE_VIEW_MODE.COLLAPSE_ROW);
    }
  }, [tableViewMode]);

  useEffect(() => {
    if (group && group !== "undefined") {
      getOneProfileGroup(Number(group));
    } else if (listProfileGroup?.length > 0) {
      onChangeProfileGroup(listProfileGroup[0]?.id);
    }
  }, [group, listProfileGroup]);

  useEffect(() => {
    if (group && group !== "undefined" && openModal === "true") {
      setModalOpen(true);
    }
  }, [group, openModal]);

  useEffect(() => {
    if (!selectedProfileGroup && listProfileGroup?.length > 0) {
      props?.actSaveSelectedProfileGroup(listProfileGroup?.[0]);
    }
  }, [selectedProfileGroup, listProfileGroup]);

  useEffect(() => {
    if (getDataLoading && shouldRefetch) {
      setShouldRefetch(false);
    }
  }, [getDataLoading, shouldRefetch]);

  useEffect(() => {
    clearTimeout(searchTimeOut);
    searchTimeOut = setTimeout(() => {
      getListProfile({
        page,
        pageSize,
        searchText,
        groupId: selectedProfileGroup?.id,
        encryptKey,
      });
    }, 200);
  }, [page, pageSize, searchText, selectedProfileGroup, encryptKey]);

  useEffect(() => {
    if (shouldRefetch) {
      getListProfile({
        page,
        pageSize,
        searchText,
        groupId: selectedProfileGroup?.id,
        encryptKey,
      });
    }
  }, [
    page,
    pageSize,
    encryptKey,
    searchText,
    selectedProfileGroup,
    shouldRefetch,
  ]);

  // delete wallet
  const onDeleteProfile = () => {
    setBtnLoading(true);
    deleteProfile(selectedRowKeys);
  };

  useEffect(() => {
    if (!deleteProfileLoading && isSuccess) {
      onSetSelectedRowKeys([]);
      setShouldRefetch(true);

      setTimeout(() => {
        setBtnLoading(false);
      }, 3000);
    }
  }, [deleteProfileLoading, isSuccess]);

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

  const rowSelection = {
    selectedRowKeys,
    onChange: onRowSelectionChange,
    columnWidth: 50,
  };

  const expandedRowRender = (record: IProfile) => {
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
            <div className="label">{translate("note")}:</div>
            <div className="value">
              {record?.note ? (
                <Highlighter
                  textToHighlight={record?.note || ""}
                  searchWords={[removeSpecialCharacter(searchText)]}
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

  const onOpenModalProfile = () => {
    setModalOpen(true);
  };

  const onOpenModalProfileName = (profile: IProfile) => {
    setModalProfileNameOpen(true);
    props?.actSaveSelectedProfile(profile);
  };

  const onChangeProfileGroup = (groupID: IProfileGroup) => {
    props?.actSaveSelectedProfileGroup(
      _.find(listProfileGroup, { id: groupID }) || null,
    );
  };

  const onSearchProfileGroup = (text: string) => {
    if (searchProfileGroupTimeOut) {
      clearTimeout(searchProfileGroupTimeOut);
    }
    searchProfileGroupTimeOut = setTimeout(() => {
      getListProfileGroup({ page: 1, pageSize: 1000, searchText: text });
    }, 200);
  };

  const dataSource: any[] = useMemo(() => {
    return listProfile?.map((profile: IProfile, index: number) => ({
      ...profile,
      index: (page - 1) * pageSize + index + 1,
    }));
  }, [listProfile, page, pageSize]);

  const onChangeViewMode = (value: string | number) => {
    props?.actSetTableViewMode(value?.toString());
  };

  useEffect(() => {
    if (tableViewMode === TABLE_VIEW_MODE.COLLAPSE_ROW) {
      setExpanedRowKeys([]);
    } else if (tableViewMode === TABLE_VIEW_MODE.EXPAND_ROW) {
      setExpanedRowKeys(dataSource?.map((data: any) => data?.id as any) || []);
    }
  }, [tableViewMode, dataSource]);

  const listResourceColumn = useMemo(() => {
    return getResourceGroupColumn(
      selectedProfileGroup?.listResourceGroupId,
      selectedProfileGroup?.listResourceGroup,
    );
  }, [selectedProfileGroup, searchText]);

  const tableWidth = useMemo(() => {
    let width = 400;
    listResourceColumn?.forEach((column: GroupColumnConfig) => {
      width += column?.children?.length * RESOURCE_COLUMN_WIDTH;
    });

    return width;
  }, [listResourceColumn]);

  const onOpenModalExport = () => {
    setModalExportOpen(true);
  };

  return (
    <PageWrapper>
      <div className="heading">
        <SearchInput
          onChange={onSetSearchText}
          value={searchText}
          placeholder={translate("button.search")}
          style={{
            marginRight: "var(--margin-right)",
            width: "40rem",
          }}
        />

        <Select
          size="large"
          className="custom-select"
          style={{
            marginRight: "var(--margin-right)",
            width: "17rem",
          }}
          value={selectedProfileGroup?.id}
          onChange={onChangeProfileGroup}
          loading={isSelectLoading}
          showSearch
          onSearch={onSearchProfileGroup}
          filterOption={false}
          optionLabelProp="label"
        >
          {listProfileGroup?.map((group: IProfileGroup) => (
            <Option key={group?.id} value={group?.id} label={group?.name}>
              <OptionWrapper>
                <div className="name">{group?.name || EMPTY_STRING}</div>
                <div className="description">{group?.note || EMPTY_STRING}</div>
              </OptionWrapper>
            </Option>
          ))}
        </Select>

        <PasswordInput
          name="encryptKey"
          placeholder={translate("wallet.encryptKey")}
          width="15rem"
          onChange={setEncryptKey}
          extendClass="encryptKey-header"
        />

        <Segmented
          style={{ marginLeft: "var(--margin-right)" }}
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

        <UploadButton
          text="Export"
          onClick={onOpenModalExport}
          isUploadButton={true}
          style={{ marginRight: "var(--margin-right)", marginLeft: "auto" }}
        />

        <Button
          type="primary"
          style={{ marginRight: "var(--margin-right)" }}
          onClick={onOpenModalProfile}
        >
          {translate("button.createNew")}
        </Button>

        <DeleteButton
          text={translate("button.delete")}
          onClick={onDeleteProfile}
          loading={isBtnLoading}
        />
      </div>

      <Table
        virtual
        rowSelection={rowSelection}
        rowKey={(data) => data?.id!}
        dataSource={dataSource}
        columns={renderColumns(
          listResourceColumn,
          typeof selectedProfileGroup?.walletGroupId === "number",
          searchText,
          translate,
          onOpenModalProfileName,
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
          expandedRowKeys,
          columnWidth: 30,
        }}
        scroll={{ x: tableWidth, y: 600 }}
        loading={getDataLoading}
        onChange={onTableChange}
        size="middle"
        bordered
      />

      <ModalProfile
        isModalOpen={isModalOpen}
        setModalOpen={setModalOpen}
        setShouldRefetch={setShouldRefetch}
      />
      <ModalProfileName
        isModalOpen={isModalProfileNameOpen}
        setModalOpen={setModalProfileNameOpen}
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
    listProfile: state?.Profile?.listProfile,
    totalData: state?.Profile?.totalData,
    tableViewMode: state?.Profile?.tableViewMode,
    listProfileGroup: state?.ProfileGroup?.listProfileGroup,
    selectedProfileGroup: state?.ProfileGroup?.selectedProfileGroup,
    pageSize: state?.Profile?.pageSize,
  }),
  {
    actSaveSelectedProfile,
    actSaveSelectedProfileGroup,
    actSetTableViewMode,
    actSetPageSize,
  },
)(ManageProfile);
