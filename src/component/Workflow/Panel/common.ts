import { ReactElement } from "react";
import { INodeConfig } from "@/electron/type";
import { DEFAULT_TIMEOUT, NODE_ACTION } from "@/electron/simulator/constant";

export type INode = {
  type: string;
  icon: ReactElement;
  config?: INodeConfig;
  version?: string;
};

export const commonNodeConfig = {
  onSuccess: NODE_ACTION.CONTINUE_RUN,
  onError: NODE_ACTION.PAUSE_THREAD,
  timeout: DEFAULT_TIMEOUT / 1000,
};
