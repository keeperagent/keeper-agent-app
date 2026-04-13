import { useEffect, Fragment } from "react";
import { useLocation } from "react-router-dom";
import qs from "qs";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { actSetPageName } from "@/redux/layout";
import ManageGroup from "./ManageGroup";
import ManageEndpoint from "./ManageEndpoint";

const NodeProvider = (props: any) => {
  const location = useLocation();
  const { search } = location;
  const { group } = qs.parse(search, {
    ignoreQueryPrefix: true,
  });

  useEffect(() => {
    props?.actSetPageName("Node provider");
  }, []);

  return (
    <Fragment>
      <title>Node provider</title>

      {group ? <ManageEndpoint /> : <ManageGroup />}
    </Fragment>
  );
};

export default connect((_state: RootState) => ({}), { actSetPageName })(
  NodeProvider,
);
