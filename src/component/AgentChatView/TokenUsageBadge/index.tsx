import { Tooltip } from "antd";
import { useTranslation } from "@/hook";
import { type TurnUsage } from "@/electron/type";
import { AnimatedNumber } from "@/component";
import { TokenUsageBadgeWrapper } from "./style";

type Props = {
  turnUsage: TurnUsage;
};

const TokenUsageBadge = ({ turnUsage }: Props) => {
  const { translate } = useTranslation();

  if (
    !turnUsage ||
    (turnUsage.inputTokens === 0 && turnUsage.outputTokens === 0)
  ) {
    return null;
  }

  const billedInputTokens = Math.max(
    0,
    turnUsage.inputTokens - turnUsage.cacheRead,
  );

  const cacheHitRate =
    turnUsage.inputTokens > 0
      ? Math.round((turnUsage.cacheRead / turnUsage.inputTokens) * 100)
      : 0;

  return (
    <TokenUsageBadgeWrapper>
      <Tooltip title={translate("agent.usage.inputTokens")}>
        <span className="usage-item">
          In
          <AnimatedNumber value={billedInputTokens} />
        </span>
      </Tooltip>

      <span className="usage-separator">·</span>

      <Tooltip title={translate("agent.usage.outputTokens")}>
        <span className="usage-item">
          Out
          <AnimatedNumber value={turnUsage.outputTokens} />
        </span>
      </Tooltip>

      <span className="usage-separator">·</span>

      <Tooltip title={translate("agent.usage.cacheHitRate")}>
        <span className="usage-item">
          Cache
          <AnimatedNumber value={cacheHitRate} />%
        </span>
      </Tooltip>
    </TokenUsageBadgeWrapper>
  );
};

export default TokenUsageBadge;
