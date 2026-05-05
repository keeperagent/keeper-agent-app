import { useEffect, useRef, useState, Fragment } from "react";
import { useSearchParams } from "react-router-dom";
import { connect } from "react-redux";
import { Button, Pagination, Spin } from "antd";
import { SearchInput } from "@/component/Input";
import {
  useGetListAgentProfile,
  useGetOneAgentProfile,
  useDeleteAgentProfile,
} from "@/hook/agentProfile";
import { actSaveSelectedAgentProfile } from "@/redux/agentProfile";
import { RootState } from "@/redux/store";
import { IAgentProfile } from "@/electron/type";
import { useTranslation } from "@/hook/useTranslation";
import AgentProfileCard from "./AgentProfileCard";
import AgentProfileDetail from "./AgentProfileDetail";
import ModalAgentProfile from "./ModalAgentProfile";
import { Wrapper } from "./style";

const PAGE_SIZE = 12;

type Props = {
  listAgentProfile: IAgentProfile[];
  totalData: number;
  page: number;
  selectedAgentProfile: IAgentProfile | null;
  actSaveSelectedAgentProfile: (profile: IAgentProfile | null) => void;
  onOpenChat?: (profile: IAgentProfile) => void;
};

const AgentProfileManager = (props: Props) => {
  const {
    listAgentProfile,
    totalData,
    page,
    selectedAgentProfile,
    onOpenChat,
    actSaveSelectedAgentProfile,
  } = props;
  const [searchParams] = useSearchParams();
  const agentProfileId: number | null =
    Number(searchParams.get("agentProfileId")) || null;
  const { translate } = useTranslation();

  const { loading, getListAgentProfile } = useGetListAgentProfile();
  const { getOneAgentProfile, data: fetchedAgentProfile } =
    useGetOneAgentProfile();
  const { deleteAgentProfile } = useDeleteAgentProfile();
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [searchText, setSearchText] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [detailProfileId, setDetailProfileId] = useState<number | null>(null);

  useEffect(() => {
    getListAgentProfile({ page: 1, pageSize: PAGE_SIZE });
  }, []);

  useEffect(() => {
    if (!agentProfileId) {
      return;
    }
    getOneAgentProfile(agentProfileId);
  }, [agentProfileId]);

  useEffect(() => {
    if (!fetchedAgentProfile) {
      return;
    }
    actSaveSelectedAgentProfile(fetchedAgentProfile);
    onOpenDetail(fetchedAgentProfile);
  }, [fetchedAgentProfile]);

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

  const onPageChange = (newPage: number) => {
    getListAgentProfile({
      page: newPage,
      pageSize: PAGE_SIZE,
      searchText,
    });
  };

  const onOpenDetail = (profile: IAgentProfile) => {
    actSaveSelectedAgentProfile(profile);
    setDetailProfileId(profile.id!);
  };

  const onCloseDetail = () => {
    setDetailProfileId(null);
    actSaveSelectedAgentProfile(null);
  };

  if (detailProfileId) {
    return (
      <AgentProfileDetail
        agentProfileId={detailProfileId}
        onBack={onCloseDetail}
        onOpenChat={
          onOpenChat
            ? (profile) => {
                onCloseDetail();
                onOpenChat(profile);
              }
            : undefined
        }
      />
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
                onOpenChat={onOpenDetail}
                onChat={onOpenChat}
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
    </Wrapper>
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
)(AgentProfileManager);
