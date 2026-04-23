import AnimatedNumber from "react-animated-numbers";
import { Tooltip } from "antd";
import { useTranslation } from "@/hook";
import { type TurnUsage } from "@/electron/type";
import { TokenUsageBadgeWrapper } from "./style";

type Props = {
  turnUsage: TurnUsage;
};

const NUMBER_FONT_STYLE: React.CSSProperties = {
  fontSize: 11,
  fontVariantNumeric: "tabular-nums",
};

const TokenUsageBadge = ({ turnUsage }: Props) => {
  const { translate } = useTranslation();

  if (
    !turnUsage ||
    (turnUsage.inputTokens === 0 && turnUsage.outputTokens === 0)
  ) {
    return null;
  }

  const cacheHitRate =
    turnUsage.inputTokens > 0
      ? Math.round((turnUsage.cacheRead / turnUsage.inputTokens) * 100)
      : 0;

  return (
    <TokenUsageBadgeWrapper>
      <Tooltip title={translate("agent.usage.inputTokens")}>
        <span className="usage-item">
          In
          <AnimatedNumber
            animateToNumber={turnUsage.inputTokens}
            includeComma
            fontStyle={NUMBER_FONT_STYLE}
          />
        </span>
      </Tooltip>

      <span className="usage-separator">·</span>

      <Tooltip title={translate("agent.usage.outputTokens")}>
        <span className="usage-item">
          Out
          <AnimatedNumber
            animateToNumber={turnUsage.outputTokens}
            includeComma
            fontStyle={NUMBER_FONT_STYLE}
          />
        </span>
      </Tooltip>

      <span className="usage-separator">·</span>

      <Tooltip title={translate("agent.usage.cacheHitRate")}>
        <span className="usage-item">
          Cache
          <AnimatedNumber
            animateToNumber={cacheHitRate}
            fontStyle={NUMBER_FONT_STYLE}
          />
          %
        </span>
      </Tooltip>
    </TokenUsageBadgeWrapper>
  );
};

export default TokenUsageBadge;
