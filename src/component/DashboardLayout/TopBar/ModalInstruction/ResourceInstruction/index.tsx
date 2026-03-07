import { useMemo } from "react";
import { connect } from "react-redux";
import { CheckIcon } from "@/component/Icon";
import resourceEnLightImg from "@/asset/resource-en-light.png";
import resourceEnDarkImg from "@/asset/resource-en-dark.png";
import { RootState } from "@/redux/store";
import { useTranslation } from "@/hook";
import HoverLink from "@/component/HoverLink";
import { LOCALE } from "@/language";
import { Wrapper } from "./style";

type IProps = {
  isLightMode: boolean;
};

const ResourceInstruction = (props: IProps) => {
  const { isLightMode } = props;
  const { locale } = useTranslation();

  const img = useMemo(() => {
    if (isLightMode) {
      return locale === LOCALE.EN ? resourceEnLightImg : resourceEnLightImg;
    }

    return locale === LOCALE.EN ? resourceEnDarkImg : resourceEnDarkImg;
  }, [isLightMode, locale]);

  const enContent = () => (
    <Wrapper>
      <div className="item">
        Resources is where you can manage Twitter accounts, or any other data by
        importing via Excell. Like{" "}
        <span className="highlight-text bold">Wallet</span>,{" "}
        <span className="highlight-text bold">Resources</span> is the component
        to create the Profile used to run the Workflow.
      </div>

      <div className="item" style={{ marginTop: "1rem" }}>
        To cover many cases, we allows users to import data from up to the first
        10 columns of the Excel file. However, in most cases, just using the
        first 2 to 3 columns is enough. You can download the sample file{" "}
        <HoverLink
          prefixString=""
          postString=""
          textLink="here"
          link="https://github.com/ethers-io/ethers.js"
          isOpenNewTab={true}
        />{" "}
        (Note: you need to keep the column names in the sample file).
      </div>

      <div className="image">
        <img src={img} alt="" />
      </div>

      <div className="item" style={{ marginTop: "1rem" }}>
        Each type of resource will have different information, and you need to
        configure it depending on each situation. The system only retrieves data
        from columns that are fully configured{" "}
        <span className="highlight-text bold">Variable name</span> and{" "}
        <span className="highlight-text bold">Label</span>.
      </div>

      <div
        className="item"
        style={{ display: "flex", alignItems: "center", marginTop: "1rem" }}
      >
        <span>Columns with valid configuration are marked with</span>
        <span className="icon">
          <CheckIcon color="var(--color-success)" />
        </span>
      </div>

      <div className="item" style={{ marginTop: "1rem" }}>
        For example: To import a list of Twitter accounts, you need to fill in
        Twitter account information according to the Excel template file. In
        case each Twitter account you import has 2 pieces of information:{" "}
        <span className="highlight-text bold">Username</span> and{" "}
        <span className="highlight-text bold">Password</span> then you only need
        to configure the first 2 columns. The 2 columns will be configured as
        follows:
        <div className="list" style={{ marginTop: "0.5rem" }}>
          1. <span className="bold">Column 1</span>: Variable name:{" "}
          <span className="bold">TWITTER_USERNAME</span>, Label:{" "}
          <span className="bold">Username</span>
        </div>
        <div className="list">
          2. <span className="bold">Column 2</span>: Variable name:{" "}
          <span className="bold">TWITTER_PASSWORD</span>, Label:{" "}
          <span className="bold">Password</span>
        </div>
      </div>

      <div className="item" style={{ marginTop: "2rem" }}>
        You download the sample file
        <HoverLink
          prefixString=""
          postString=""
          textLink="here"
          link="https://keeper-agent-app-public.s3.us-east-1.amazonaws.com/sample_resource.xlsx"
          isOpenNewTab={true}
        />
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
)(ResourceInstruction);
