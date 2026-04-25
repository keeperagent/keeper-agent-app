import { Node, Edge } from "@xyflow/react";
import { INodeConfig } from "@/electron/type";

export interface ReduxAction {
  type: string;
  payload: any;
}

export type IFile = {
  index?: number;
  name: string;
  size: string;
  path: string;
  type: string;
};

export type IElectron = {
  send: (channel: string, data?: any) => void;
  on: (channel: string, callback?: any) => () => void;
  removeAllListeners: (channel: string) => void;
  getPathForFile?: (file: File) => string;
};

export interface IMousePosition {
  x: number;
  y: number;
}

// Workflow
export type INodeData = {
  type: string;
  error?: string;
  config?: INodeConfig;
  version?: string;
};

export type IWorkflowData = {
  nodes: Node[];
  edges: Edge[];
};

export type IUser = {
  _id?: string;
  username?: string;
  password?: string;
  email?: string;
  tierStatus?: ITierStatus;
  refreshToken?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ITierStatus = {
  _id?: string;
  user?: IUser;
  userID?: string;
  pricingTier?: IPricingTier;
  pricingTierID?: string;
  expiredAt?: number;
  isCurrentTier?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type IPricingTier = {
  _id?: string;
  name?: string;
  price?: number;
  order?: number;
  isHighlight?: boolean;
  expireIn?: number;
  permissions?: string[];
  icon?: string;
  createdAt?: string;
  updatedAt?: string;
};
