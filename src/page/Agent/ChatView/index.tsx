import { useEffect, useRef, useState, Fragment } from "react";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import {
  useTranslation,
  useGetListAgentProfile,
  useGetOneAgentProfile,
} from "@/hook";
import { IAgentProfile } from "@/electron/type";
import { actSetPageName } from "@/redux/layout";
import {
  AGENT_LAYOUT_MODE,
  actSetSplitPercent,
  actSaveSelectedAgentProfile,
} from "@/redux/agent";
import { PageWrapper } from "./style";
import TokenChart from "./TokenChart";
import AgentView from "./AgentView";
import ContextBar from "./ContextBar";

const DEFAULT_SPLIT_PERCENT = 50;

const ChatView = (props: any) => {
  const {
    actSetPageName,
    layoutMode,
    splitPercent,
    actSetSplitPercent,
    selectedAgentProfile,
    listAgentProfile,
    setEncryptKey,
    encryptKey,
  } = props;

  const [isDragging, setIsDragging] = useState(false);
  const mainRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<HTMLDivElement | null>(null);
  const agentRef = useRef<HTMLDivElement | null>(null);
  const liveSplitRef = useRef(splitPercent || DEFAULT_SPLIT_PERCENT);
  const rafIdRef = useRef<number | null>(null);
  const isResizingRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);

  const { translate } = useTranslation();
  const { getListAgentProfile, loading: isProfileSearchLoading } =
    useGetListAgentProfile();
  const { getOneAgentProfile, data: fetchedAgentProfile } =
    useGetOneAgentProfile();
  const searchProfileTimeoutRef = useRef<any>(null);

  useEffect(() => {
    getListAgentProfile({ page: 1, pageSize: 30, isActive: true });
  }, []);

  useEffect(() => {
    actSetPageName?.(translate("sidebar.askAgent"));
  }, [translate, actSetPageName]);

  useEffect(() => {
    if (!listAgentProfile?.length) {
      return;
    }

    if (selectedAgentProfile?.id) {
      const isInList = listAgentProfile.some(
        (profile: IAgentProfile) => profile?.id === selectedAgentProfile?.id,
      );
      if (!isInList) {
        getOneAgentProfile(selectedAgentProfile.id);
      }
      return;
    }

    fallbackToMainProfile();
  }, [listAgentProfile]);

  useEffect(() => {
    if (!fetchedAgentProfile) {
      return;
    }
    if (fetchedAgentProfile.isActive) {
      props.actSaveSelectedAgentProfile(fetchedAgentProfile);
    } else {
      fallbackToMainProfile();
    }
  }, [fetchedAgentProfile]);

  const fallbackToMainProfile = () => {
    const mainProfile = (listAgentProfile || []).find(
      (profile: IAgentProfile) => profile.isMainAgent,
    );
    props.actSaveSelectedAgentProfile(
      mainProfile || listAgentProfile?.[0] || null,
    );
  };

  const onSearchProfile = (text: string) => {
    if (searchProfileTimeoutRef.current) {
      clearTimeout(searchProfileTimeoutRef.current);
    }

    searchProfileTimeoutRef.current = setTimeout(() => {
      getListAgentProfile({
        page: 1,
        pageSize: 30,
        searchText: text,
        isActive: true,
      });
    }, 200);
  };

  const applySplit = (percent: number) => {
    const clamped = Math.min(80, Math.max(20, percent));
    const chart = chartRef.current;
    const agent = agentRef.current;
    if (chart && agent) {
      chart.style.flexBasis = `${clamped}%`;
      agent.style.flexBasis = `${100 - clamped}%`;
    }
    return clamped;
  };

  useEffect(() => {
    liveSplitRef.current = splitPercent;
    applySplit(splitPercent);
  }, [splitPercent]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!isResizingRef.current) return;
      if (
        pointerIdRef.current !== null &&
        event.pointerId !== pointerIdRef.current
      )
        return;

      const rect = mainRef.current?.getBoundingClientRect();
      if (!rect) return;

      const offsetX = event.clientX - rect.left;
      const percent = (offsetX / rect.width) * 100;
      liveSplitRef.current = Math.min(80, Math.max(20, percent));

      if (rafIdRef.current === null) {
        rafIdRef.current = window.requestAnimationFrame(() => {
          applySplit(liveSplitRef.current);
          rafIdRef.current = null;
        });
      }
    };

    const endResize = () => {
      if (pointerIdRef.current !== null && mainRef.current) {
        try {
          mainRef.current.releasePointerCapture(pointerIdRef.current);
        } catch {
          // ignore if capture wasn't set
        }
      }
      pointerIdRef.current = null;

      if (!isResizingRef.current) return;
      isResizingRef.current = false;
      setIsDragging(false);
      document.body.style.userSelect = "";
      if (rafIdRef.current !== null) {
        window.cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      const final = liveSplitRef.current;
      applySplit(final);
      actSetSplitPercent?.(final);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", endResize);
    window.addEventListener("pointercancel", endResize);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", endResize);
      window.removeEventListener("pointercancel", endResize);
      document.body.style.userSelect = "";
      if (rafIdRef.current !== null) {
        window.cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, []);

  const startDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    pointerIdRef.current = event.pointerId;
    try {
      (event.target as HTMLElement)?.setPointerCapture?.(event.pointerId);
    } catch {
      // capture may fail; safe to ignore
    }
    isResizingRef.current = true;
    setIsDragging(true);
    document.body.style.userSelect = "none";
  };

  const resetSplit = () => actSetSplitPercent?.(DEFAULT_SPLIT_PERCENT);

  const isChatOnly = layoutMode === AGENT_LAYOUT_MODE.CHAT_OPTIMIZE;

  return (
    <PageWrapper>
      <title>{translate("sidebar.askAgent")}</title>

      <div
        className={`main ${isDragging ? "dragging" : ""} ${isChatOnly ? "only-chat" : ""}`}
        ref={mainRef}
      >
        {!isChatOnly && (
          <Fragment>
            <div
              className="left-wrapper"
              ref={chartRef}
              style={{ flexBasis: `${splitPercent}%` }}
            >
              <div className="chart-wrapper">
                <TokenChart />
              </div>
            </div>

            <div
              className="resizer"
              onPointerDown={startDrag}
              onDoubleClick={resetSplit}
            />
          </Fragment>
        )}

        <div
          className="right-wrapper"
          ref={agentRef}
          style={
            isChatOnly
              ? { flexBasis: "100%" }
              : { flexBasis: `${100 - splitPercent}%` }
          }
        >
          {Boolean(selectedAgentProfile?.id) && (
            <ContextBar setEncryptKey={setEncryptKey} encryptKey={encryptKey} />
          )}

          <div className="agent-view-wrapper" style={{ marginTop: "0.8rem" }}>
            {Boolean(selectedAgentProfile?.id) && (
              <AgentView
                key={String(selectedAgentProfile?.id)}
                encryptKey={encryptKey}
                onSearchProfile={onSearchProfile}
                isProfileSearchLoading={isProfileSearchLoading}
              />
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default connect(
  (state: RootState) => ({
    layoutMode: state?.Agent?.layoutMode,
    splitPercent: state?.Agent?.splitPercent,
    selectedAgentProfile: state?.Agent?.selectedAgentProfile || null,
    listAgentProfile: state?.AgentProfile?.listAgentProfile || [],
  }),
  { actSetPageName, actSetSplitPercent, actSaveSelectedAgentProfile },
)(ChatView);
