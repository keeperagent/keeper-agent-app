import { INodeConfig } from "@/electron/type";

export type INode = {
  id: string;
  type: string;
  data: { config: INodeConfig };
};

export type IEdge = {
  id: string;
  type: string;
  source: string;
  target: string;
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
  flowPath?: string[];
};
