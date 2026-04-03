import { useEffect } from "react";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { actSetPageName } from "@/redux/layout";
import { useTranslation } from "@/hook";
import { PageWrapper } from "./style";
import StaticProxy from "./StaticProxy";

const ManageProxy = (props: any) => {
  const { translate } = useTranslation();

  useEffect(() => {
    props?.actSetPageName(translate("sidebar.proxy"));
  }, [translate]);

  return (
    <PageWrapper>
      <title>{translate("sidebar.proxy")}</title>
      <StaticProxy />
    </PageWrapper>
  );
};

export default connect((_state: RootState) => ({}), { actSetPageName })(
  ManageProxy,
);
