import { useMemo } from "react";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { useTranslation } from "@/hook";
import profileEnLightImg from "@/asset/profile-en-light.png";
import profileEnDarkImg from "@/asset/profile-en-dark.png";
import { LOCALE } from "@/language";
import { Wrapper } from "./style";

type IProps = {
  isLightMode: boolean;
};

const ProfileInstruction = (props: IProps) => {
  const { isLightMode } = props;
  const { locale } = useTranslation();

  const img = useMemo(() => {
    if (isLightMode) {
      return locale === LOCALE.EN ? profileEnLightImg : profileEnLightImg;
    }

    return locale === LOCALE.EN ? profileEnDarkImg : profileEnDarkImg;
  }, [isLightMode, locale]);

  const enContent = () => (
    <Wrapper>
      <div className="item">
        Profile is a combination of{" "}
        <span className="bold highlight-text">Wallet</span> and
        <span className="bold highlight-text"> Resources</span>. Each Profile
        will have a maximum of 1 Wallet, but may have multiple Resources
        attached.
      </div>

      <div className="item" style={{ marginTop: "1rem" }}>
        Profiles will be used to run{" "}
        <span className="bold highlight-text">Workflow</span> in the{" "}
        <span className="bold highlight-text">Campaign</span>
      </div>

      <div className="image">
        <img src={img} alt="" />
      </div>

      <div className="item" style={{ marginTop: "1rem" }}>
        For example, from EVM wallet accounts and Resources such as: Twitter
        accounts, you can create Profiles that each Profile will include: 1 EVM
        wallet account, 1 Twitter account
      </div>
    </Wrapper>
  );

  return locale === LOCALE.EN ? enContent() : enContent();
};

export default connect(
  (state: RootState) => ({
    isLightMode: state?.Layout?.isLightMode,
  }),
  {}
)(ProfileInstruction);
