import { useLocation } from "react-router-dom";
import qs from "qs";
import ManageGroup from "./ManageGroup";
import ManageIP from "./ManageIP";

const ProxyIP = () => {
  const location = useLocation();
  const { search } = location;
  const { group } = qs.parse(search, {
    ignoreQueryPrefix: true,
  });

  if (group && group !== undefined) {
    return <ManageIP />;
  }

  return <ManageGroup />;
};

export default ProxyIP;
