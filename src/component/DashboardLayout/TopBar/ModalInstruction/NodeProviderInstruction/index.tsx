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
        To interact with blockchain (
        <span className="italic">
          for example: get wallet balance, check how many NFTs are in the
          wallet, get Gas price, ...
        </span>
        ) at least one Node provider is required, using multiple Node providers
        will provide better performance if you need to interact a lot with the
        blockchain.
      </div>

      <div className="item" style={{ marginTop: "1rem" }}>
        The Node provider page helps you manage your Node endpoints. You can
        skip this page if you do not use the following functions in the Workflow
        feature: <span className="highlight-text bold">Get gas price</span>,{" "}
        <span className="highlight-text bold">Get balance</span>
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
