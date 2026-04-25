import {
  Fragment,
  useEffect,
  useRef,
  useMemo,
  useState,
  useCallback,
} from "react";
import { connect } from "react-redux";
import { FloatButton, Switch, Tooltip } from "antd";
import { Terminal as XTermTerminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { RootState } from "@/redux/store";
import { useTranslation } from "@/hook";
import {
  actSetIsShowLog,
  actSetIsFilterByWorkflow,
  actAppendLog,
  ILogMessage,
} from "@/redux/systemLog";
import { MESSAGE } from "@/electron/constant";
import { ICampaign, IWorkflow } from "@/electron/type";
import {
  TerminalIcon,
  CloseIcon,
  CompressIcon,
  ExpandIcon,
  SearchIcon,
} from "@/component/Icon";
import "@xterm/xterm/css/xterm.css";
import {
  LogViewerWrapper,
  TerminalIconWrapper,
  SearchBarWrapper,
} from "./style";
import { formatLogLine } from "./formatLogLine";

interface IProps {
  isSidebarOpen: boolean;
  isShowLog: boolean;
  isFilterByWorkflow: boolean;
  logs: ILogMessage[];
  selectedCampaign: ICampaign | null;
  selectedWorkflow: IWorkflow | null;
  actSetIsShowLog: (payload: boolean) => void;
  actSetIsFilterByWorkflow: (payload: boolean) => void;
  actAppendLog: (payload: any) => void;
}

const LogViewer = (props: IProps) => {
  const {
    isSidebarOpen,
    isShowLog,
    isFilterByWorkflow,
    logs,
    selectedCampaign,
    selectedWorkflow,
    actSetIsFilterByWorkflow,
  } = props;
  const { translate } = useTranslation();

  const [isFullScreen, setIsFullScreen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstanceRef = useRef<XTermTerminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const disposeRef = useRef<(() => void) | null>(null);
  const listenerAddedRef = useRef(false);
  // ID of the last log written to terminal; used to detect new logs
  const lastSyncedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (listenerAddedRef.current) {
      return;
    }
    listenerAddedRef.current = true;

    const handler = (_event: any, payload: any) => {
      const batch = payload?.data;
      if (Array.isArray(batch)) {
        batch.forEach((logItem: any) => props?.actAppendLog(logItem));
      }
    };
    const unsubscribe = window?.electron?.on(MESSAGE.LOG_BATCH, handler);
    return () => {
      unsubscribe?.();
      listenerAddedRef.current = false;
    };
  }, []);

  // if isFilterByWorkflow and in Campaign/Workflow view, filter by selected campaign and workflow; otherwise show all logs
  const filteredLogs = useMemo(() => {
    if (!isFilterByWorkflow) {
      return [...logs];
    }
    let list = [...logs];
    if (!selectedCampaign && !selectedWorkflow) {
      return list;
    }

    list = list.filter(
      (log) =>
        log?.campaignId === selectedCampaign?.id ||
        (!log?.campaignId && !selectedCampaign),
    );
    list = list.filter((log) => log?.workflowId === selectedWorkflow?.id);

    return list;
  }, [logs, isFilterByWorkflow, selectedCampaign, selectedWorkflow]);

  // filter logs by search text (campaign name, workflow name, thread id, message)
  // if search term is "thread" / "thread:" / "thread," etc. + number, filter only by that thread id
  const displayedLogs = useMemo(() => {
    const trimmed = searchTerm.trim();
    if (!trimmed) {
      return filteredLogs;
    }

    const threadOnlyMatch = trimmed.match(/thread[,:\s]*(\d+)/i);
    if (threadOnlyMatch) {
      const threadNum = threadOnlyMatch[1];
      return filteredLogs.filter(
        (log) => (log?.threadId || "").toString() === threadNum,
      );
    }

    const term = trimmed.toLowerCase();
    return filteredLogs.filter((log) => {
      const campaignName = (log?.campaignName || "").toLowerCase();
      const workflowName = (log?.workflowName || "").toLowerCase();
      const threadId = (log?.threadId || "").toString().toLowerCase();
      const message = (log?.message || "").toLowerCase();
      return (
        campaignName.includes(term) ||
        workflowName.includes(term) ||
        threadId.includes(term) ||
        message.includes(term)
      );
    });
  }, [filteredLogs, searchTerm]);

  const syncLogsToTerminal = useCallback(
    (
      terminal: XTermTerminal,
      list: ILogMessage[],
      lastSyncedIdRef: React.MutableRefObject<string | null>,
    ) => {
      if (list.length === 0) {
        terminal.clear();
        return;
      }

      const lastId = lastSyncedIdRef.current;
      if (lastId === null) {
        // First sync or after full redraw: write all
        terminal.clear();
        const lines = list.map((log) => formatLogLine(log));
        try {
          terminal.write(lines.join("\r\n") + "\r\n");
        } catch {}

        lastSyncedIdRef.current = list[list.length - 1]?.id || null;
        requestAnimationFrame(() => {
          terminal.scrollToBottom();
        });
        return;
      }

      const lastIdx = list.findIndex((log) => log.id === lastId);
      if (lastIdx === -1) {
        // Last synced id not in list (rotated at cap or filter changed): full redraw
        terminal.clear();
        const lines = list.map((log) => formatLogLine(log));
        try {
          terminal.write(lines.join("\r\n") + "\r\n");
        } catch {}

        lastSyncedIdRef.current = list[list.length - 1]?.id || null;
        requestAnimationFrame(() => {
          terminal.scrollToBottom();
        });
        return;
      }

      if (lastIdx === list.length - 1) {
        // Already in sync
        return;
      }

      // New logs after lastIdx: append only
      const newLines = list
        .slice(lastIdx + 1, list.length)
        .map((log) => formatLogLine(log));
      if (newLines.length > 0) {
        try {
          terminal.write(newLines.join("\r\n") + "\r\n");
        } catch {}
      }
      lastSyncedIdRef.current = list[list.length - 1]?.id || null;
      requestAnimationFrame(() => {
        terminal.scrollToBottom();
      });
    },
    [],
  );

  useEffect(() => {
    if (!isShowLog || !terminalRef.current) {
      return;
    }
    const el = terminalRef.current;

    const init = () => {
      const terminal = new XTermTerminal({
        scrollback: 5000,
        fontSize: 13,
        lineHeight: 1.4,
        fontFamily: "JetBrains Mono, monospace",
        cursorBlink: false,
        allowTransparency: true,
        allowProposedApi: false,
        theme: {
          background: "rgba(12, 12, 12, 0)",
          foreground: "#dadada",
          selectionBackground: "rgb(92, 122, 234, 0.3)",
          black: "#1a1a1a",
          red: "#ff5f5f",
          green: "#5faf5f",
          yellow: "#ffd700",
          blue: "#5f87d7",
          magenta: "#d787ff",
          cyan: "#5fffff",
          white: "#dadada",
          brightBlack: "#626262",
          brightRed: "#ff8787",
          brightGreen: "#87d787",
          brightYellow: "#ffff87",
          brightBlue: "#87afff",
          brightMagenta: "#d787ff",
          brightCyan: "#afffff",
          brightWhite: "#ffffff",
        },
      });

      const fitAddon = new FitAddon();
      terminal.loadAddon(fitAddon);

      terminal.open(el);
      terminal.write("\x1b[?25l"); // hide cursor
      terminalInstanceRef.current = terminal;
      fitAddonRef.current = fitAddon;
      lastSyncedIdRef.current = null; // force full redraw on first sync

      syncLogsToTerminal(terminal, displayedLogs, lastSyncedIdRef);
      requestAnimationFrame(() => fitAddon.fit());

      const onResize = () => fitAddon.fit();
      window.addEventListener("resize", onResize);

      disposeRef.current = () => {
        window.removeEventListener("resize", onResize);
        terminal.dispose();
        terminalInstanceRef.current = null;
        fitAddonRef.current = null;
        disposeRef.current = null;
      };
    };

    init();
    return () => {
      disposeRef.current?.();
    };
  }, [isShowLog]);

  useEffect(() => {
    if (!terminalInstanceRef.current || !isShowLog) {
      return;
    }

    syncLogsToTerminal(
      terminalInstanceRef.current,
      displayedLogs,
      lastSyncedIdRef,
    );
  }, [isShowLog, displayedLogs, syncLogsToTerminal, translate]);

  useEffect(() => {
    if (!isShowLog) {
      return;
    }

    // Re-fit after layout settles (transition is 0.3s); run twice so exit fullscreen gets correct height
    const firstFitTimeout = setTimeout(() => fitAddonRef.current?.fit(), 300);
    const secondFitTimeout = setTimeout(() => fitAddonRef.current?.fit(), 600);
    return () => {
      clearTimeout(firstFitTimeout);
      clearTimeout(secondFitTimeout);
    };
  }, [isShowLog, isFullScreen]);

  const onCloseSearch = () => {
    setSearchOpen(false);
    setSearchTerm("");
  };

  return (
    <Fragment>
      {isShowLog && (
        <LogViewerWrapper
          isSidebarOpen={isSidebarOpen}
          isFullScreen={isFullScreen}
        >
          <div className="log-header">
            <span className="log-title">
              {translate("log.systemLog").toUpperCase()}
            </span>

            <div className="log-header-actions">
              {selectedCampaign && selectedWorkflow && (
                <Tooltip title={translate("log.filterByWorkflow")}>
                  <span className="log-filter-toggle">
                    <Switch
                      size="small"
                      checked={isFilterByWorkflow}
                      onChange={(checked) => actSetIsFilterByWorkflow(checked)}
                    />
                  </span>
                </Tooltip>
              )}

              <span
                className={`header-btn${searchOpen ? " active" : ""}`}
                onClick={() => setSearchOpen(!searchOpen)}
              >
                <SearchIcon />
              </span>

              <Tooltip
                title={
                  isFullScreen
                    ? translate("workflow.exitFullscreen")
                    : translate("workflow.fullscreen")
                }
              >
                <span
                  className="header-btn"
                  onClick={() => setIsFullScreen((v) => !v)}
                  role="button"
                  tabIndex={0}
                >
                  {isFullScreen ? <CompressIcon /> : <ExpandIcon />}
                </span>
              </Tooltip>
            </div>
          </div>

          {searchOpen && (
            <SearchBarWrapper>
              <input
                className="search-input"
                placeholder={translate("log.filterPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
                spellCheck={false}
              />

              {searchTerm && (
                <span className="search-count">
                  {displayedLogs.length}{" "}
                  {displayedLogs.length !== 1
                    ? translate("log.results")
                    : translate("log.result")}
                </span>
              )}

              <div className="search-btn" onClick={onCloseSearch}>
                ✕
              </div>
            </SearchBarWrapper>
          )}

          <div className="terminal-wrapper">
            <div ref={terminalRef} className="terminal-container" />
          </div>
        </LogViewerWrapper>
      )}

      <FloatButton
        tooltip={
          !isShowLog ? translate("schedule.viewLog") : translate("close")
        }
        type="primary"
        shape="square"
        onClick={
          !isShowLog
            ? () => props?.actSetIsShowLog(true)
            : () => props?.actSetIsShowLog(false)
        }
        icon={
          <TerminalIconWrapper isActive={isShowLog}>
            {!isShowLog ? <TerminalIcon /> : <CloseIcon />}
          </TerminalIconWrapper>
        }
        style={{ scale: "0.8", right: "1rem", bottom: "1rem", zIndex: 1000 }}
      />
    </Fragment>
  );
};

export default connect(
  (state: RootState) => ({
    isSidebarOpen: state?.Layout?.isSidebarOpen,
    isShowLog: state?.SystemLog?.isShowLog,
    isFilterByWorkflow: state?.SystemLog?.isFilterByWorkflow,
    logs: state?.SystemLog?.logs,
    selectedCampaign: state?.Campaign?.selectedCampaign,
    selectedWorkflow: state?.Workflow?.selectedWorkflow,
  }),
  { actSetIsShowLog, actSetIsFilterByWorkflow, actAppendLog },
)(LogViewer);
