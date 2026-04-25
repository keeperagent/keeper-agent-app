import { useEffect, useMemo, useRef, useState } from "react";
import { connect } from "react-redux";
import { Button, Pagination, Select, Spin } from "antd";
import { SearchInput } from "@/component/Input";
import { PlusIcon } from "@/component/Icon";
import { PrimaryButton } from "@/component/Button";
import {
  useGetListMcpServer,
  useDeleteMcpServer,
  useUpdateMcpServer,
} from "@/hook/mcpServer";
import {
  actSetSortFieldMcpServer,
  actSetModalOpenMcpServer,
  actSaveSelectedMcpServer,
} from "@/redux/mcpServer";
import { RootState } from "@/redux/store";
import { IMcpServer, ISorter } from "@/electron/type";
import { SORT_ORDER } from "@/electron/constant";
import { useTranslation } from "@/hook/useTranslation";
import ModalMcpServer from "./ModalMcpServer";
import ModalMcpServerTools from "./ModalMcpServerTools";
import McpServerItem from "./McpServerItem";
import { Wrapper } from "./style";

const PAGE_SIZE = 9;

const McpServerManager = (props: any) => {
  const { listMcpServer, sortField, page, totalData } = props;
  const { loading, getListMcpServer } = useGetListMcpServer();
  const { deleteMcpServer } = useDeleteMcpServer();
  const { updateMcpServer } = useUpdateMcpServer();
  const { translate } = useTranslation();
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [searchText, setSearchText] = useState("");
  const [toolsModal, setToolsModal] = useState<{
    serverId: number;
    serverName: string;
    config: string;
    disabledTools: string[];
    item: IMcpServer;
  } | null>(null);

  const listSortField = useMemo(
    () => [
      { label: translate("name"), value: "name" },
      { label: translate("description"), value: "description" },
      { label: translate("agent.activeStatus"), value: "isEnabled" },
      { label: translate("createdAt"), value: "createAt" },
      { label: translate("updatedAt"), value: "updateAt" },
    ],
    [translate],
  );
  const listSortOrder = useMemo(
    () => [
      { label: translate("ascending"), value: SORT_ORDER.ASC },
      { label: translate("descending"), value: SORT_ORDER.DESC },
    ],
    [translate],
  );

  const sortSorter =
    sortField && "field" in sortField ? (sortField as ISorter) : undefined;

  const fetchList = (currentPage: number = 1) => {
    getListMcpServer({
      page: currentPage,
      pageSize: PAGE_SIZE,
      searchText: searchText || undefined,
      sortField: sortSorter,
    });
  };

  useEffect(() => {
    fetchList(1);
  }, [sortField]);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      searchTimeoutRef.current = null;
      getListMcpServer({
        page: 1,
        pageSize: PAGE_SIZE,
        searchText: searchText || undefined,
        sortField: sortSorter,
      });
    }, 200);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchText]);

  const onPageChange = (newPage: number) => {
    fetchList(newPage);
  };

  const onChangeSortField = (value: string) => {
    props?.actSetSortFieldMcpServer({ field: value } as ISorter);
  };
  const onChangeSortOrder = (value: string) => {
    props?.actSetSortFieldMcpServer({ order: value } as ISorter);
  };

  const handleAdd = () => {
    props?.actSaveSelectedMcpServer(null);
    props?.actSetModalOpenMcpServer(true);
  };

  const handleEdit = (item: IMcpServer) => {
    props?.actSaveSelectedMcpServer(item);
    props?.actSetModalOpenMcpServer(true);
  };

  const handleDelete = (id: number) => {
    deleteMcpServer(id);
  };

  const handleToggle = (item: IMcpServer) => {
    updateMcpServer({ ...item, isEnabled: !item.isEnabled });
  };

  const handleViewTools = (item: IMcpServer) => {
    if (item.id == null) {
      return;
    }

    setToolsModal({
      serverId: item.id,
      serverName: item.name || "",
      config: item.config || "",
      disabledTools: item.disabledTools || [],
      item,
    });
  };

  const handleToggleTool = (toolName: string, disabled: boolean) => {
    if (!toolsModal) return;
    const updatedDisabled = disabled
      ? [...toolsModal.disabledTools, toolName]
      : toolsModal.disabledTools.filter((t) => t !== toolName);
    setToolsModal({ ...toolsModal, disabledTools: updatedDisabled });
    updateMcpServer({ ...toolsModal.item, disabledTools: updatedDisabled });
  };

  return (
    <Wrapper>
      <div className="actions">
        <SearchInput
          placeholder={translate("button.search")}
          value={searchText}
          onChange={setSearchText}
          style={{ width: "30rem" }}
        />

        <Select
          className="custom-select"
          placeholder={translate("sortBy")}
          allowClear
          size="large"
          options={listSortField}
          style={{ width: "15rem" }}
          value={sortField?.field || null}
          onChange={onChangeSortField}
          loading={loading}
        />

        <Select
          className="custom-select"
          placeholder={translate("sortOrder")}
          allowClear
          size="large"
          options={listSortOrder}
          style={{ width: "15rem" }}
          value={sortField?.order || null}
          onChange={onChangeSortOrder}
          loading={loading}
        />

        <Button type="primary" onClick={handleAdd} className="btn-add">
          {translate("agent.addServer")}
        </Button>
      </div>

      {!loading && listMcpServer?.length === 0 && (
        <div className="empty-state">
          <div className="empty-title">{translate("agent.noMcpServer")}</div>

          <div className="empty-description">
            {translate("agent.addMcpServerDesc")}
          </div>

          <span>
            <PrimaryButton
              icon={<PlusIcon />}
              onClick={handleAdd}
              text={translate("agent.addServer")}
            />
          </span>
        </div>
      )}

      <Spin size="medium" spinning={loading} style={{ minHeight: "70vh" }}>
        <div className="list-item">
          {listMcpServer?.map((item: IMcpServer) => (
            <McpServerItem
              key={item.id}
              item={item}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggle={handleToggle}
              onViewTools={handleViewTools}
            />
          ))}
        </div>

        {totalData > PAGE_SIZE && (
          <div className="pagination-wrap">
            <Pagination
              current={page}
              pageSize={PAGE_SIZE}
              total={totalData}
              showSizeChanger={false}
              onChange={onPageChange}
            />
          </div>
        )}
      </Spin>

      <ModalMcpServer />
      <ModalMcpServerTools
        open={toolsModal != null}
        serverId={toolsModal?.serverId || 0}
        serverName={toolsModal?.serverName || ""}
        config={toolsModal?.config || ""}
        disabledTools={toolsModal?.disabledTools || []}
        onToggleTool={handleToggleTool}
        onClose={() => setToolsModal(null)}
      />
    </Wrapper>
  );
};

export default connect(
  (state: RootState) => ({
    listMcpServer: state?.McpServer?.listMcpServer,
    sortField: state?.McpServer?.sortField,
    page: state?.McpServer?.page || 1,
    totalData: state?.McpServer?.totalData || 0,
  }),
  {
    actSetSortFieldMcpServer,
    actSetModalOpenMcpServer,
    actSaveSelectedMcpServer,
  },
)(McpServerManager);
