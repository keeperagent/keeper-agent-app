import { useMemo } from "react";
import { IResourceGroup, IWalletGroup } from "@/electron/type";
import BubblePackChart, { BubbleDataNode } from "@/component/BubblePackChart";
import { ChartWrapper } from "./style";

type IChartProps = {
  listWalletGroup: IWalletGroup[];
  listResourceGroup: IResourceGroup[];
};

const ProfileConfigChart = (props: IChartProps) => {
  const { listWalletGroup, listResourceGroup } = props;

  const treeData = useMemo((): BubbleDataNode => {
    const children: BubbleDataNode[] = [];

    listWalletGroup.forEach((walletGroup: IWalletGroup) => {
      const totalWallet = walletGroup?.totalWallet || 0;
      children.push({
        name: walletGroup?.name || "",
        value: totalWallet,
        nodeType: "walletGroup",
        tooltipLabel: `${totalWallet} items`,
      });
    });

    listResourceGroup.forEach((resourceGroup: IResourceGroup) => {
      const totalResource = resourceGroup?.totalResource || 0;
      children.push({
        name: resourceGroup?.name || "",
        value: totalResource,
        nodeType: "resourceGroup",
        tooltipLabel: `${totalResource} items`,
      });
    });

    // No child smaller than 10% of the largest sibling
    const maxChildValue = Math.max(
      ...children.map((child) => child.value || 1),
    );
    const minChildValue = Math.max(maxChildValue * 0.1, 1);
    children.forEach((child) => {
      child.value = Math.max(child.value || 1, minChildValue);
    });

    return { name: "root", nodeType: "root", children };
  }, [listWalletGroup, listResourceGroup]);

  if (!treeData.children?.length) {
    return null;
  }

  return (
    <ChartWrapper>
      <BubblePackChart treeData={treeData} maxSize={200} minHeight={200} />
    </ChartWrapper>
  );
};

export default ProfileConfigChart;
