import { lazy, Suspense } from "react";
import { Tabs } from "antd";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "@/hook";
import { PageWrapper } from "./style";

const Proxy = lazy(() => import("@/page/Proxy"));
const Extension = lazy(() => import("@/page/Extension"));
const NodeProvider = lazy(() => import("@/page/NodeProvider"));

const TAB_PROXY = "proxy";
const TAB_EXTENSION = "extension";
const TAB_NODE_PROVIDER = "node_provider";

const Connections = () => {
  const { translate } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get("tab") || TAB_EXTENSION;

  const handleTabChange = (tabKey: string) => {
    const updatedParams = new URLSearchParams(searchParams);
    updatedParams.set("tab", tabKey);
    updatedParams.delete("group");
    updatedParams.delete("mode");
    setSearchParams(updatedParams);
  };

  return (
    <PageWrapper>
      <div className="tab">
        <Tabs
          activeKey={activeTab}
          items={[
            { key: TAB_EXTENSION, label: translate("sidebar.extension") },
            {
              key: TAB_NODE_PROVIDER,
              label: translate("sidebar.nodeProvider"),
            },
            { key: TAB_PROXY, label: translate("sidebar.proxy") },
          ]}
          onChange={handleTabChange}
        />
      </div>

      <Suspense fallback={null}>
        {activeTab === TAB_EXTENSION && <Extension />}
        {activeTab === TAB_NODE_PROVIDER && <NodeProvider />}
        {activeTab === TAB_PROXY && <Proxy />}
      </Suspense>
    </PageWrapper>
  );
};

export default Connections;
