import { useMemo, useEffect } from "react";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { useGetListProfileGroup, useTranslation } from "@/hook";
import { IProfileGroup, IResourceGroup } from "@/electron/type";
import BubblePackChart, { BubbleDataNode } from "@/component/BubblePackChart";
import { Wrapper } from "./style";

type IProps = {
  listProfileGroup: IProfileGroup[];
  isLightMode: boolean;
};

const buildTreeData = (
  listProfileGroup: IProfileGroup[],
  recordLabel: string,
): BubbleDataNode => ({
  name: "root",
  nodeType: "root",
  children: listProfileGroup.map((profileGroup: IProfileGroup) => {
    const children: BubbleDataNode[] = [];

    if (profileGroup.walletGroup) {
      const totalWallet = profileGroup.walletGroup.totalWallet || 0;
      children.push({
        name: profileGroup.walletGroup.name || "",
        value: Math.max(totalWallet, 1),
        nodeType: "walletGroup",
        tooltipLabel: `${totalWallet} ${recordLabel}`,
      });
    }

    (profileGroup.listResourceGroup || []).forEach(
      (resourceGroup: IResourceGroup) => {
        const totalResource = (resourceGroup as any).totalResource || 0;
        children.push({
          name: resourceGroup.name || "",
          value: Math.max(totalResource, 1),
          nodeType: "resourceGroup",
          tooltipLabel: `${totalResource} ${recordLabel}`,
        });
      },
    );

    if (children.length === 0) {
      children.push({ name: "", value: 1, nodeType: "walletGroup" });
    }

    // No child smaller than 10% of the largest sibling
    const maxChildValue = Math.max(
      ...children.map((child) => child.value || 1),
    );
    const minChildValue = Math.max(maxChildValue * 0.1, 1);
    children.forEach((child) => {
      child.value = Math.max(child.value || 1, minChildValue);
    });

    return {
      name: profileGroup.name || "",
      nodeType: "profileGroup" as const,
      tooltipLabel: `${profileGroup.totalProfile || 0} profiles`,
      children,
    };
  }),
});

const ProfileGroupChart = (props: IProps) => {
  const { listProfileGroup } = props;
  const { translate } = useTranslation();
  const { getListProfileGroup } = useGetListProfileGroup();

  useEffect(() => {
    getListProfileGroup({ page: 0, pageSize: 10000 });
  }, []);

  const treeData = useMemo(
    () => buildTreeData(listProfileGroup, translate("profile.record")),
    [listProfileGroup, translate],
  );

  if (!listProfileGroup?.length) {
    return null;
  }

  return (
    <Wrapper>
      <BubblePackChart
        treeData={treeData}
        maxSize={listProfileGroup?.length > 10 ? 600 : 450}
        minHeight={400}
      />
    </Wrapper>
  );
};

export default connect(
  (state: RootState) => ({
    listProfileGroup: state?.ProfileGroup?.listProfileGroup,
    totalData: state?.ProfileGroup?.totalData,
    isLightMode: state?.Layout?.isLightMode,
  }),
  {},
)(ProfileGroupChart);
