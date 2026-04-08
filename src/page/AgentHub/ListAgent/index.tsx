import { useEffect, useRef, useState, Fragment } from "react";
import { connect } from "react-redux";
import { Button, Pagination, Spin } from "antd";
import { SearchInput } from "@/component/Input";
import {
  useGetListAgentProfile,
  useDeleteAgentProfile,
} from "@/hook/agentProfile";
import { actSaveSelectedAgentProfile } from "@/redux/agentProfile";
import { RootState } from "@/redux/store";
import { IAgentProfile } from "@/electron/type";
import { useTranslation } from "@/hook/useTranslation";
import AgentProfileCard from "./AgentProfileCard";
import ModalAgentProfile from "./ModalAgentProfile";
import ChatRegistry from "./ChatRegistry";
import { ChatRegistryPage } from "../style";

const PAGE_SIZE = 12;

const ListAgent = (props: any) => {
  const {
    listAgentProfile,
    totalData,
    page,
    selectedAgentProfile,
    actSaveSelectedAgentProfile,
    onChatRegistryOpenChange,
  } = props;
  const { translate } = useTranslation();

  const { loading, getListAgentProfile } = useGetListAgentProfile();
  const { deleteAgentProfile } = useDeleteAgentProfile();
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [searchText, setSearchText] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [chatProfileId, setChatProfileId] = useState<number | null>(null);

  useEffect(() => {
    getListAgentProfile({ page: 1, pageSize: PAGE_SIZE });
  }, []);

  useEffect(() => {
    onChatRegistryOpenChange?.(Boolean(chatProfileId));
  }, [chatProfileId]);

  const onSearch = (value: string) => {
    setSearchText(value);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      getListAgentProfile({
        page: 1,
        pageSize: PAGE_SIZE,
        searchText: value || undefined,
      });
    }, 300);
  };

  const onOpenCreate = () => {
    actSaveSelectedAgentProfile(null);
    setModalOpen(true);
  };

  const onOpenEdit = (profile: IAgentProfile) => {
    actSaveSelectedAgentProfile(profile);
    setModalOpen(true);
  };

  const onCloseModal = () => {
    setModalOpen(false);
    setTimeout(() => {
      actSaveSelectedAgentProfile(null);
    }, 300);
  };

  const onDelete = (profile: IAgentProfile) => {
    deleteAgentProfile(profile.id!);
  };

  const onOpenChat = (profile: IAgentProfile) => {
    actSaveSelectedAgentProfile(profile);
    setChatProfileId(profile.id!);
  };

  const onCloseChat = () => {
    setChatProfileId(null);
    actSaveSelectedAgentProfile(null);
  };

  const onPageChange = (newPage: number) => {
    getListAgentProfile({
      page: newPage,
      pageSize: PAGE_SIZE,
      searchText,
    });
  };

  if (chatProfileId) {
    return (
      <ChatRegistryPage>
        <ChatRegistry agentProfileId={chatProfileId} onBack={onCloseChat} />
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

        {listAgentProfile.length > 0 && (
          <Button
            className="header-add-btn"
            type="primary"
            onClick={onOpenCreate}
          >
            {translate("agent.addProfile")}
          </Button>
        )}
      </div>

      {loading && listAgentProfile.length === 0 ? (
        <div className="loading-center">
          <Spin />
        </div>
      ) : (
        <Fragment>
          <div className="card-grid">
            {listAgentProfile.map((profile: IAgentProfile) => (
              <AgentProfileCard
                key={profile.id}
                profile={profile}
                onEdit={onOpenEdit}
                onDelete={onDelete}
                onOpenChat={onOpenChat}
              />
            ))}
          </div>

          {listAgentProfile.length === 0 && (
            <div className="empty-state">
              <div className="empty-state__title">
                {translate("agent.noProfileAgents")}
              </div>
              <div className="empty-state__desc">
                {translate("agent.addProfileDesc")}
              </div>

              <Button
                className="header-add-btn"
                type="primary"
                onClick={onOpenCreate}
              >
                {translate("agent.addProfile")}
              </Button>
            </div>
          )}

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

      <ModalAgentProfile
        open={modalOpen}
        profile={selectedAgentProfile}
        onClose={onCloseModal}
      />
    </Fragment>
  );
};

export default connect(
  (state: RootState) => ({
    listAgentProfile: state?.AgentProfile?.listAgentProfile || [],
    totalData: state?.AgentProfile?.totalData || 0,
    page: state?.AgentProfile?.page || 1,
    selectedAgentProfile: state?.AgentProfile?.selectedAgentProfile || null,
  }),
  { actSaveSelectedAgentProfile },
)(ListAgent);
