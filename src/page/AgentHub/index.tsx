import { useEffect, useRef, useState, Fragment } from "react";
import { connect } from "react-redux";
import { Button, Pagination, Spin } from "antd";
import { SearchInput } from "@/component/Input";
import {
  useGetListAgentRegistry,
  useDeleteAgentRegistry,
} from "@/hook/agentRegistry";
import { actSaveSelectedAgentRegistry } from "@/redux/agentRegistry";
import { actSetPageName } from "@/redux/layout";
import { RootState } from "@/redux/store";
import { IAgentRegistry } from "@/electron/type";
import { useTranslation } from "@/hook/useTranslation";
import AgentRegistryCard from "./AgentRegistryCard";
import ModalAgentRegistry from "./ModalAgentRegistry";
import ChatRegistry from "./ChatRegistry";
import { Wrapper } from "./style";

const PAGE_SIZE = 12;

const AgentRegistry = (props: any) => {
  const {
    listAgentRegistry,
    totalData,
    page,
    actSaveSelectedAgentRegistry,
    actSetPageName,
  } = props;
  const { translate } = useTranslation();

  const { loading, getListAgentRegistry } = useGetListAgentRegistry();
  const { deleteAgentRegistry } = useDeleteAgentRegistry();
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [searchText, setSearchText] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRegistry, setEditingRegistry] = useState<IAgentRegistry | null>(
    null,
  );
  const [chatRegistryId, setChatRegistryId] = useState<number | null>(null);

  const fetchList = (currentPage: number = 1) => {
    getListAgentRegistry({
      page: currentPage,
      pageSize: PAGE_SIZE,
      searchText: searchText || undefined,
    });
  };

  useEffect(() => {
    actSetPageName(translate("sidebar.agentHub"));
  }, [translate]);

  useEffect(() => {
    fetchList(1);
  }, []);

  const onSearch = (value: string) => {
    setSearchText(value);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      getListAgentRegistry({
        page: 1,
        pageSize: PAGE_SIZE,
        searchText: value || undefined,
      });
    }, 300);
  };

  const onOpenCreate = () => {
    setEditingRegistry(null);
    setModalOpen(true);
  };

  const onOpenEdit = (registry: IAgentRegistry) => {
    setEditingRegistry(registry);
    setModalOpen(true);
  };

  const onCloseModal = () => {
    setModalOpen(false);
    setEditingRegistry(null);
  };

  const onDelete = (registry: IAgentRegistry) => {
    if (registry.id) {
      deleteAgentRegistry(registry.id);
    }
  };

  const onOpenChat = (registry: IAgentRegistry) => {
    actSaveSelectedAgentRegistry(registry);
    if (registry.id) {
      setChatRegistryId(registry.id);
    }
  };

  const onCloseChat = () => {
    setChatRegistryId(null);
    actSaveSelectedAgentRegistry(null);
  };

  const onPageChange = (newPage: number) => {
    getListAgentRegistry({
      page: newPage,
      pageSize: PAGE_SIZE,
      searchText: searchText || undefined,
    });
  };

  if (chatRegistryId) {
    return (
      <ChatRegistry agentRegistryId={chatRegistryId} onBack={onCloseChat} />
    );
  }

  return (
    <Wrapper>
      <div className="header">
        <div className="header-search">
          <SearchInput
            value={searchText}
            onChange={onSearch}
            placeholder={translate("button.search")}
            style={{ width: "100%" }}
          />
        </div>

        {listAgentRegistry.length > 0 && (
          <Button
            className="header-add-btn"
            type="primary"
            onClick={onOpenCreate}
          >
            {translate("agent.addRegistry")}
          </Button>
        )}
      </div>

      {loading && listAgentRegistry.length === 0 ? (
        <div className="loading-center">
          <Spin />
        </div>
      ) : (
        <Fragment>
          <div className="card-grid">
            {listAgentRegistry.map((registry: IAgentRegistry) => (
              <AgentRegistryCard
                key={registry.id}
                registry={registry}
                onEdit={onOpenEdit}
                onDelete={onDelete}
                onOpenChat={onOpenChat}
              />
            ))}

            {listAgentRegistry.length === 0 && (
              <div className="empty-state">
                <div className="empty-state__title">
                  {translate("agent.noRegistryAgents")}
                </div>
                <div className="empty-state__desc">
                  {translate("agent.addRegistryDesc")}
                </div>

                <Button
                  className="header-add-btn"
                  type="primary"
                  onClick={onOpenCreate}
                >
                  {translate("agent.addRegistry")}
                </Button>
              </div>
            )}
          </div>

          {totalData > PAGE_SIZE && (
            <div className="pagination">
              <Pagination
                current={page}
                pageSize={PAGE_SIZE}
                total={totalData}
                onChange={onPageChange}
                showSizeChanger={false}
                size="small"
              />
            </div>
          )}
        </Fragment>
      )}

      <ModalAgentRegistry
        open={modalOpen}
        registry={editingRegistry}
        onClose={onCloseModal}
        onRefresh={() => fetchList(1)}
      />
    </Wrapper>
  );
};

export default connect(
  (state: RootState) => ({
    listAgentRegistry: state?.AgentRegistry?.listAgentRegistry || [],
    totalData: state?.AgentRegistry?.totalData || 0,
    page: state?.AgentRegistry?.page || 1,
  }),
  { actSaveSelectedAgentRegistry, actSetPageName },
)(AgentRegistry);
