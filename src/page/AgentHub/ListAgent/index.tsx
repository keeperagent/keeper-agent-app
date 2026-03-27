import { useEffect, useRef, useState, Fragment } from "react";
import { connect } from "react-redux";
import { Button, Pagination, Spin } from "antd";
import { SearchInput } from "@/component/Input";
import {
  useGetListAgentRegistry,
  useDeleteAgentRegistry,
} from "@/hook/agentRegistry";
import { actSaveSelectedAgentRegistry } from "@/redux/agentRegistry";
import { RootState } from "@/redux/store";
import { IAgentRegistry } from "@/electron/type";
import { useTranslation } from "@/hook/useTranslation";
import AgentRegistryCard from "./AgentRegistryCard";
import ModalAgentRegistry from "./ModalAgentRegistry";
import ChatRegistry from "./ChatRegistry";
import { ChatRegistryPage } from "../style";

const PAGE_SIZE = 12;

const ListAgent = (props: any) => {
  const {
    listAgentRegistry,
    totalData,
    page,
    selectedAgentRegistry,
    actSaveSelectedAgentRegistry,
    onChatRegistryOpenChange,
  } = props;
  const { translate } = useTranslation();

  const { loading, getListAgentRegistry } = useGetListAgentRegistry();
  const { deleteAgentRegistry } = useDeleteAgentRegistry();
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [searchText, setSearchText] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [chatRegistryId, setChatRegistryId] = useState<number | null>(null);

  useEffect(() => {
    getListAgentRegistry({ page: 1, pageSize: PAGE_SIZE });
  }, []);

  useEffect(() => {
    onChatRegistryOpenChange?.(Boolean(chatRegistryId));
  }, [chatRegistryId]);

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
    actSaveSelectedAgentRegistry(null);
    setModalOpen(true);
  };

  const onOpenEdit = (registry: IAgentRegistry) => {
    actSaveSelectedAgentRegistry(registry);
    setModalOpen(true);
  };

  const onCloseModal = () => {
    setModalOpen(false);
    setTimeout(() => {
      actSaveSelectedAgentRegistry(null);
    }, 300);
  };

  const onDelete = (registry: IAgentRegistry) => {
    deleteAgentRegistry(registry.id!);
  };

  const onOpenChat = (registry: IAgentRegistry) => {
    actSaveSelectedAgentRegistry(registry);
    setChatRegistryId(registry.id!);
  };

  const onCloseChat = () => {
    setChatRegistryId(null);
    actSaveSelectedAgentRegistry(null);
  };

  const onPageChange = (newPage: number) => {
    getListAgentRegistry({
      page: newPage,
      pageSize: PAGE_SIZE,
      searchText,
    });
  };

  if (chatRegistryId) {
    return (
      <ChatRegistryPage>
        <ChatRegistry agentRegistryId={chatRegistryId} onBack={onCloseChat} />
      </ChatRegistryPage>
    );
  }

  return (
    <Fragment>
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
        registry={selectedAgentRegistry}
        onClose={onCloseModal}
      />
    </Fragment>
  );
};

export default connect(
  (state: RootState) => ({
    listAgentRegistry: state?.AgentRegistry?.listAgentRegistry || [],
    totalData: state?.AgentRegistry?.totalData || 0,
    page: state?.AgentRegistry?.page || 1,
    selectedAgentRegistry: state?.AgentRegistry?.selectedAgentRegistry || null,
  }),
  { actSaveSelectedAgentRegistry },
)(ListAgent);
