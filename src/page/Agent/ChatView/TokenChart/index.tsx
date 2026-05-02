import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { AGENT_LAYOUT_MODE } from "@/redux/agent";
import { useTranslation } from "@/hook";
import { Wrapper, ChartFrame } from "./style";

const TokenChart = (props: any) => {
  const { isLightMode, tokenAddress = "", chainKey, layoutMode } = props;
  const { translate } = useTranslation();

  // Dexscreener embed for the specific token pair.
  const theme = isLightMode ? "light" : "dark";
  const trades = layoutMode === AGENT_LAYOUT_MODE.TRADE_OPTIMIZE ? "1" : "0";
  const commonParams = `embed=1&loadChartSettings=0&chartStyle=1&interval=30&trades=${trades}&theme=${theme}&chartTheme=${theme}`;

  const src =
    chainKey && tokenAddress
      ? `https://dexscreener.com/${chainKey}/${tokenAddress}?${commonParams}&tabs=0&info=0`
      : `https://dexscreener.com${chainKey ? `/${chainKey}` : ""}?${commonParams}&tabs=1&info=1`;

  return (
    <Wrapper>
      <ChartFrame
        title={translate("agent.dexscreenerChart")}
        src={src}
        sandbox="allow-scripts allow-same-origin allow-popups"
        allowFullScreen
        loading="lazy"
      />
    </Wrapper>
  );
};

export default connect((state: RootState) => {
  const profileId = state?.Agent?.selectedAgentProfile?.id;
  const context = profileId ? state?.Agent?.agentContextMap?.[profileId] : null;
  return {
    isLightMode: state?.Layout?.isLightMode,
    chainKey: context?.chainKey || "",
    tokenAddress: context?.tokenAddress || "",
    layoutMode: state?.Agent?.layoutMode,
  };
}, {})(TokenChart);
