import { useMemo } from "react";
import { connect } from "react-redux";
import { useTranslation } from "@/hook";
import campaignEnLightImg from "@/asset/campaign-en-light.png";
import campaignEnDarkImg from "@/asset/campaign-en-dark.png";
import { RootState } from "@/redux/store";
import { LOCALE } from "@/language";
import { Wrapper } from "./style";

type IProps = {
  isLightMode: boolean;
};

const CampaignInstruction = (props: IProps) => {
  const { isLightMode } = props;
  const { locale } = useTranslation();

  const img = useMemo(() => {
    if (isLightMode) {
      return locale === LOCALE.EN ? campaignEnLightImg : campaignEnLightImg;
    }

    return locale === LOCALE.EN ? campaignEnDarkImg : campaignEnDarkImg;
  }, [isLightMode, locale]);

  const enContent = () => (
    <Wrapper>
      <div className="item">
        A workflow can be run independently on the Workflow page. However, if
        the workflow needs to use Profiles, you need to use it with Campaign.
        Campaign is where these things come together{" "}
        <span className="bold">Workflow - Profile - Extension - Proxy</span>.
      </div>

      <div className="item" style={{ marginTop: "1rem" }}>
        In addition, you can use Telegram to run any Campaign remotely. To use
        the function of running a Campaign via Telegram. All information about
        the bot is only saved locally on your computer. KeeperAgent does not
        save and does not know any information about the Telegram bot and the
        Campaigns or Workflows you run through the Telegram bot.
      </div>

      <div className="image">
        <img src={img} alt="" />
      </div>

      <div className="item" style={{ marginTop: "1rem" }}>
        Normally, a Campaign is only used to run a single Workflow. However, in
        some special cases, a Campaign can still be attached to many different
        workflows.
      </div>

      <div className="item" style={{ marginTop: "1rem" }}>
        For example:{" "}
        <span className="italic bold highlight-text">
          Create a Campaign to run the Token Swap workflow on Uniswap (Ethereum
          network).
        </span>{" "}
        To be able to swap, each wallet corresponding to the Profile needs to
        have a native token. In this case, you can create a Campaign and attach
        it to 2 workflows:
      </div>

      <div className="list" style={{ marginTop: "0.5rem" }}>
        1. <span className="bold">Check native balance</span>: The workflow
        checks the wallet's current native token balance for each Profile
      </div>
      <div className="list">
        2. <span className="bold">Swap token on Uniswap</span>: Token swap
        scenario. In this scenario will check if "Balance ETH" &gt; 0 then
        continue running the Workflow
      </div>
    </Wrapper>
  );

  return locale === LOCALE.EN ? enContent() : enContent();
};

export default connect(
  (state: RootState) => ({
    isLightMode: state?.Layout?.isLightMode,
  }),
  {},
)(CampaignInstruction);
