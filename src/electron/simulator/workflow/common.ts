import { INodeConfig } from "@/electron/type";

export type INode = {
  id: string;
  type: string;
  data: { config: INodeConfig };
};

export enum EdgeConditionType {
  ON_SUCCESS = "ON_SUCCESS",
  ON_ERROR = "ON_ERROR",
}

export type IEdge = {
  id: string;
  type: string;
  source: string;
  target: string;
  conditionType?: EdgeConditionType;
};

export type IWorkflowData = {
  nodes: INode[];
  edges: IEdge[];
};

export type IWorkflowState = {
  numberOfThread?: number;
  numberOfRound?: number;
  mapExtensionID?: { [extensionKey: string]: string };
  nodes?: INode[];
  edges?: IEdge[];
};
