import { IGraphNode } from "@/electron/type";

export const ellipsisAddress = (
  address: string,
  headLength = 6,
  tailLength = 4,
) =>
  address.length > headLength + tailLength + 3
    ? `${address.slice(0, headLength)}...${address.slice(-tailLength)}`
    : address;

export const displayLabel = (node: IGraphNode): string => {
  if (node.type === "WALLET") {
    return ellipsisAddress(node.label);
  }
  return node.label;
};

export const entityIdFromNodeId = (nodeId: string, nodeType: string): string =>
  nodeId.slice(nodeType.length + 1);
