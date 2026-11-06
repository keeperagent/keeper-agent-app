import { Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { IGraphEdge, IGraphNode } from "@/electron/type";
import { PORTFOLIO_APP_NAME } from "@/electron/constant";
import { getPortfolioAppImg, getPortfolioAppUrl } from "@/service/util";
import { useOpenExternalLink, useTranslation } from "@/hook";
import { VIEW_MODE } from "@/page/Wallet/constant";
import { CATEGORY_LIST } from "../constant";
import { displayLabel, entityIdFromNodeId } from "../utils/graphNode";
import { neighborIdsOf } from "../utils/layout";
import { DetailPanelWrapper } from "./style";

type IProps = {
  selectedNode: IGraphNode;
  nodesById: Record<string, IGraphNode>;
  edges: IGraphEdge[];
  isLightMode: boolean;
  nodeDisplayColor: (node: IGraphNode) => string;
  onClose: () => void;
};

const NEIGHBOR_WALLET_DISPLAY_CAP = 50;

const DetailPanel = ({
  selectedNode,
  nodesById,
  edges,
  isLightMode,
  nodeDisplayColor,
  onClose,
}: IProps) => {
  const { translate } = useTranslation();
  const navigate = useNavigate();
  const { openExternalLink } = useOpenExternalLink();

  const onOpenTradeHistory = (walletAddress: string) => {
    navigate(
      `/dashboard/wallet?mode=${VIEW_MODE.WALLET_ACTIVITY}&searchText=${encodeURIComponent(walletAddress)}`,
    );
  };

  const getManageLink = (node: IGraphNode): string => {
    const entityId = entityIdFromNodeId(node.id, node.type);
    switch (node.type) {
      case "CAMPAIGN":
        return `/dashboard/campaign?campaignId=${entityId}`;
      case "WORKFLOW":
        return `/dashboard/workflow?workflowId=${entityId}`;
      case "AGENT":
        return `/dashboard/ask-agent?tab=AGENTS&agentProfileId=${entityId}`;
      case "SCHEDULE":
        return `/dashboard/schedule?scheduleId=${entityId}`;
      case "WALLET_GROUP":
        return `/dashboard/wallet?group=${entityId}&mode=${VIEW_MODE.WALLET}`;
      case "WALLET": {
        const groupEdge = edges.find(
          (edge) => edge.source === node.id && edge.type === "MEMBER_OF",
        );
        if (!groupEdge) {
          return "/dashboard/wallet";
        }
        const groupId = entityIdFromNodeId(groupEdge.target, "WALLET_GROUP");
        return `/dashboard/wallet?group=${groupId}&mode=${VIEW_MODE.WALLET}`;
      }
      case "MCP_SERVER":
        return "/dashboard/ask-agent?tab=MCP_SERVER";
      case "AGENT_SKILL":
        return "/dashboard/ask-agent?tab=SKILLS";
      case "AGENT_TASK":
        return "/dashboard/agent-task";
    }
  };

  const onManageEntity = (node: IGraphNode) => {
    navigate(getManageLink(node));
  };

  const onOpenAgentChat = (node: IGraphNode) => {
    const entityId = entityIdFromNodeId(node.id, node.type);
    navigate(`/dashboard/ask-agent?tab=AGENT&agentProfileId=${entityId}`);
  };

  const getPanelNameClickHandler = (
    node: IGraphNode,
  ): (() => void) | undefined => {
    if (node.type === "WALLET_GROUP") {
      return () => onManageEntity(node);
    }
    if (node.type === "AGENT") {
      return () => onOpenAgentChat(node);
    }
    return undefined;
  };

  const resolveWalletGroupNode = (
    walletNode: IGraphNode,
  ): IGraphNode | null => {
    const groupEdge = edges.find(
      (edge) => edge.source === walletNode.id && edge.type === "MEMBER_OF",
    );
    return groupEdge ? nodesById[groupEdge.target] : null;
  };

  const getPortfolioLink = (
    walletNode: IGraphNode,
    walletGroupNode: IGraphNode | null,
  ): { portfolioApp: string; url: string } | null => {
    const portfolioApp = walletGroupNode?.meta?.portfolioApp;
    if (!portfolioApp) {
      return null;
    }
    if (!walletNode.meta?.isDecrypted) {
      return null;
    }
    return {
      portfolioApp,
      url: getPortfolioAppUrl(walletNode.label, portfolioApp),
    };
  };

  const onViewPortfolio = (url: string) => {
    openExternalLink(url);
  };

  const renderCtaRow = (
    label: string,
    onClick: () => void,
    variant: "primary" | "secondary" = "secondary",
  ) => (
    <div className={`cta-row cta-row-${variant}`} onClick={onClick}>
      <span>{label}</span>
      <span className="cta-arrow">&rarr;</span>
    </div>
  );

  const renderWalletPanel = (node: IGraphNode) => {
    const walletGroupNode = resolveWalletGroupNode(node);

    return (
      <Fragment>
        {walletGroupNode ? (
          <div className="panel-rows">
            <div className="prow">
              <span className="k">
                {translate("relationshipGraph.panel.walletGroup")}
              </span>
              <span className="v">{walletGroupNode.label}</span>
            </div>
          </div>
        ) : null}

        {node.meta?.isDecrypted
          ? renderCtaRow(
              translate("relationshipGraph.panel.openTradeHistory"),
              () => onOpenTradeHistory(node.label),
              "primary",
            )
          : null}
        {renderCtaRow(
          translate("relationshipGraph.panel.manageEntity"),
          () => onManageEntity(node),
          "primary",
        )}
      </Fragment>
    );
  };

  const renderDefaultPanel = (node: IGraphNode) => {
    const neighborIds = neighborIdsOf(node.id, edges);
    const allNeighborNodes = neighborIds
      .map((id) => nodesById[id])
      .filter(Boolean) as IGraphNode[];
    const nonWalletNeighborNodes = allNeighborNodes.filter(
      (neighborNode) => neighborNode.type !== "WALLET",
    );
    const walletNeighborNodes = allNeighborNodes.filter(
      (neighborNode) => neighborNode.type === "WALLET",
    );
    const hiddenWalletCount = Math.max(
      0,
      walletNeighborNodes.length - NEIGHBOR_WALLET_DISPLAY_CAP,
    );
    const neighborNodes = [
      ...nonWalletNeighborNodes,
      ...walletNeighborNodes.slice(0, NEIGHBOR_WALLET_DISPLAY_CAP),
    ];

    return (
      <Fragment>
        <div className="panel-section-label">
          {translate("relationshipGraph.panel.connectedTo")}
        </div>

        {neighborNodes.length === 0 ? (
          <div className="related-item">
            {translate("relationshipGraph.panel.noConnections")}
          </div>
        ) : (
          <div className="related-list">
            {neighborNodes.map((neighborNode) => {
              const neighborCategory = CATEGORY_LIST.find(
                (category) => category.type === neighborNode.type,
              );
              const walletPortfolioLink =
                neighborNode.type === "WALLET"
                  ? getPortfolioLink(
                      neighborNode,
                      node.type === "WALLET_GROUP" ? node : null,
                    )
                  : null;

              return (
                <div className="related-item" key={neighborNode.id}>
                  <span
                    className="swatch"
                    style={{ background: nodeDisplayColor(neighborNode) }}
                  />

                  <span className="related-type">
                    {neighborCategory
                      ? translate(neighborCategory.labelKey)
                      : neighborNode.type}
                  </span>

                  <b>{displayLabel(neighborNode)}</b>

                  {walletPortfolioLink ? (
                    <img
                      className="related-portfolio-icon"
                      src={getPortfolioAppImg(walletPortfolioLink.portfolioApp)}
                      alt={PORTFOLIO_APP_NAME[walletPortfolioLink.portfolioApp]}
                      title={
                        PORTFOLIO_APP_NAME[walletPortfolioLink.portfolioApp]
                      }
                      onClick={(event) => {
                        event.stopPropagation();
                        onViewPortfolio(walletPortfolioLink.url);
                      }}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        )}

        {hiddenWalletCount > 0 ? (
          <div className="related-more">
            {`+${hiddenWalletCount} ${translate("relationshipGraph.panel.moreWallets")}`}
          </div>
        ) : null}

        {renderCtaRow(
          translate("relationshipGraph.panel.manageEntity"),
          () => onManageEntity(node),
          "primary",
        )}
      </Fragment>
    );
  };

  const selectedCategory = CATEGORY_LIST.find(
    (category) => category.type === selectedNode.type,
  );
  // Shown as a small icon next to the address in the header itself (not a
  // separate labeled row below it) when a single wallet is selected.
  const selectedWalletPortfolioLink =
    selectedNode.type === "WALLET"
      ? getPortfolioLink(selectedNode, resolveWalletGroupNode(selectedNode))
      : null;
  const panelNameClickHandler = getPanelNameClickHandler(selectedNode);

  return (
    <DetailPanelWrapper
      style={{
        // Glass effect over a live WebGL canvas — backdrop-filter re-blurs
        // it continuously, so blur/opacity are kept light to limit the cost.
        background: isLightMode
          ? "rgba(242, 242, 242, 0.35)"
          : "rgba(45, 45, 45, 0.35)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
      }}
    >
      <div className="panel-top">
        <div>
          <div className="panel-kind">
            <span
              className="swatch"
              style={{ background: nodeDisplayColor(selectedNode) }}
            />
            {selectedCategory
              ? translate(selectedCategory.labelKey)
              : selectedNode.type}
          </div>
          <div
            className={`panel-name${
              panelNameClickHandler ? " panel-name-clickable" : ""
            }`}
            onClick={panelNameClickHandler}
          >
            {displayLabel(selectedNode)}
            {selectedWalletPortfolioLink ? (
              <img
                className="panel-name-portfolio-icon"
                src={getPortfolioAppImg(
                  selectedWalletPortfolioLink.portfolioApp,
                )}
                alt={
                  PORTFOLIO_APP_NAME[selectedWalletPortfolioLink.portfolioApp]
                }
                title={
                  PORTFOLIO_APP_NAME[selectedWalletPortfolioLink.portfolioApp]
                }
                onClick={(event) => {
                  event.stopPropagation();
                  onViewPortfolio(selectedWalletPortfolioLink.url);
                }}
              />
            ) : null}
          </div>
        </div>
        <div className="panel-close" onClick={onClose}>
          &times;
        </div>
      </div>

      {selectedNode.type === "WALLET"
        ? renderWalletPanel(selectedNode)
        : renderDefaultPanel(selectedNode)}
    </DetailPanelWrapper>
  );
};

export default DetailPanel;
