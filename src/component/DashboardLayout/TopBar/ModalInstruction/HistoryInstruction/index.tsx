import { connect } from "react-redux";
import { useTranslation } from "@/hook";
import { RootState } from "@/redux/store";
import { LOCALE } from "@/language";
import { Wrapper } from "./style";

type IProps = {
  isLightMode: boolean;
};

const NodeProviderInstruction = (_props: IProps) => {
  const { locale } = useTranslation();

  const enContent = () => (
    <Wrapper>
      <div className="item">
        When running the Workflow, you should save the running history of the
        wallets to analyze which wallets are less active each week and which
        wallets are more active. In addition, you can also know which wallets
        have similar activities, thereby adjusting and rearranging how to run
        the Workflow to avoid wallets being marked as Sybil.
      </div>

      <div className="item" style={{ marginTop: "1rem" }}>
        This function needs to be used in conjunction with Processor{" "}
        <span className="highlight-text bold">Save log</span> in Workflow:
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
)(NodeProviderInstruction);
