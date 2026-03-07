import { useEffect, useRef, useState } from "react";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { useTranslation } from "@/hook";
import { actSetPageName } from "@/redux/layout";
import { AGENT_LAYOUT_MODE, actSetSplitPercent } from "@/redux/agent";
import { PageWrapper } from "./style";
import TokenChart from "./TokenChart";
import AgentView from "./AgentView";
import WalletView from "./WalletView";

const DEFAULT_SPLIT_PERCENT = 50;

const AgentPage = (props: any) => {
  const { actSetPageName, layoutMode, splitPercent, actSetSplitPercent, setEncryptKey, encryptKey } = props;

  const { translate } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const mainRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<HTMLDivElement | null>(null);
  const agentRef = useRef<HTMLDivElement | null>(null);
  const liveSplitRef = useRef(splitPercent || DEFAULT_SPLIT_PERCENT);
  const rafIdRef = useRef<number | null>(null);
  const isResizingRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);

  useEffect(() => {
    actSetPageName?.(translate("sidebar.askAgent"));
  }, [translate, actSetPageName]);

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

  const isOnlyChat = layoutMode === AGENT_LAYOUT_MODE.ONLY_CHAT;
  const isChatOptimize = layoutMode === AGENT_LAYOUT_MODE.CHAT_OPTIMIZE;

  return (
    <PageWrapper>
      <title>{translate("sidebar.askAgent")}</title>

      <div
        className={`main ${isDragging ? "dragging" : ""} ${isOnlyChat ? "only-chat" : ""}`}
        ref={mainRef}
      >
        {!isOnlyChat && (
          <>
            <div
              className="left-wrapper"
              ref={chartRef}
              style={{ flexBasis: `${splitPercent}%` }}
            >
              <div className="chart-wrapper">
                <TokenChart />
              </div>

              {isChatOptimize && (
                <WalletView
                  setEncryptKey={setEncryptKey}
                  encryptKey={encryptKey}
                />
              )}
            </div>

            <div
              className="resizer"
              onPointerDown={startDrag}
              onDoubleClick={resetSplit}
            />
          </>
        )}

        <div
          className="right-wrapper"
          ref={agentRef}
          style={
            isOnlyChat
              ? { flexBasis: "100%" }
              : { flexBasis: `${100 - splitPercent}%` }
          }
        >
          {!isOnlyChat && !isChatOptimize && (
            <WalletView setEncryptKey={setEncryptKey} encryptKey={encryptKey} />
          )}

          <div
            className="agent-view-wrapper"
            style={{ marginTop: isChatOptimize || isOnlyChat ? "0" : "2rem" }}
          >
            <AgentView encryptKey={encryptKey} />
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
  }),
  { actSetPageName, actSetSplitPercent },
)(AgentPage);
