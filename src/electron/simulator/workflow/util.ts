import _ from "lodash";
import {
  ColumnConfig,
  ICampaign,
  ICampaignProfile,
  INodeConfig,
  IResource,
  IWorkflow,
  IWorkflowVariable,
} from "@/electron/type";
import {
  EXTENSION,
  NODE_TYPE,
  WORKFLOW_TYPE,
  WALLET_VARIABLE,
} from "@/electron/constant";
import { INode, IEdge, EdgeConditionType } from "./common";
import {
  getCampaignAdditionalColumn,
  getResourceColumn,
} from "@/service/tableView";

const updateItemInList = (indexOfData: number, listData: any[], data?: any) => {
  const tempListData = [...listData];

  if (indexOfData !== -1) {
    tempListData.splice(indexOfData, 1, data);
  }

  return tempListData;
};

const getStartNodeId = (nodes: INode[]): string => {
  const startNode = nodes?.find(
    (node: INode) => node.type === NODE_TYPE.START_NODE,
  );
  return startNode?.id || "";
};

const getNextNodeId = (
  currentNodeId: string,
  edges: IEdge[],
  hasError: boolean,
): string | null => {
  const outgoingEdges = edges?.filter(
    (edge: IEdge) => edge.source === currentNodeId,
  );

  if (!outgoingEdges?.length) {
    return null;
  }

  // if node has typed edges, use conditionType to pick the right one
  const hasTypedEdges = outgoingEdges.some((edge: IEdge) => edge.conditionType);
  if (hasTypedEdges) {
    const conditionType = hasError
      ? EdgeConditionType.ON_ERROR
      : EdgeConditionType.ON_SUCCESS;
    const matchedEdge = outgoingEdges.find(
      (edge: IEdge) => edge.conditionType === conditionType,
    );
    return matchedEdge?.target || null;
  }

  // single edge with no conditionType — always follow it
  return outgoingEdges[0]?.target || null;
};

const enhanceConfigWithExtensionID = (
  nodeConfig: INodeConfig,
  mapExtensionID: {
    [extensionKey: string]: string;
  },
) => {
  const workflowType = (nodeConfig?.workflowType as WORKFLOW_TYPE) || "";
  let extensionID: string | undefined;

  if (
    workflowType === WORKFLOW_TYPE.IMPORT_METAMASK_WALLET ||
    workflowType === WORKFLOW_TYPE.UNLOCK_METAMASK_WALLET
  ) {
    extensionID = mapExtensionID[EXTENSION.METAMASK];
  } else if (
    workflowType === WORKFLOW_TYPE.IMPORT_RABBY_WALLET ||
    workflowType === WORKFLOW_TYPE.UNLOCK_RABBY_WALLET ||
    workflowType === WORKFLOW_TYPE.ADD_NETWORK_RABBY_WALLET
  ) {
    extensionID = mapExtensionID[EXTENSION.RABBY_WALLET];
  } else if (
    workflowType === WORKFLOW_TYPE.IMPORT_MARTIAN_WALLET ||
    workflowType === WORKFLOW_TYPE.UNLOCK_MARTIAN_WALLET
  ) {
    extensionID = mapExtensionID[EXTENSION.MARTIAN_WALLET];
  } else if (
    workflowType === WORKFLOW_TYPE.IMPORT_PHANTOM_WALLET ||
    workflowType === WORKFLOW_TYPE.UNLOCK_PHANTOM_WALLET
  ) {
    extensionID = mapExtensionID[EXTENSION.PHANTOM_WALLET];
  }

  if (extensionID) {
    (nodeConfig as any).extensionID = extensionID;
  }

  return nodeConfig;
};

const getVariableFromProfile = (
  profile: ICampaignProfile | null,
  campaign: ICampaign | null,
  workflow: IWorkflow | null,
): IWorkflowVariable[] => {
  if (profile === null) {
    return [];
  }
  const mapVariable: { [key: string]: IWorkflowVariable } = {};

  // only campaign has default wallet variables
  if (campaign) {
    const listWalletVariable: IWorkflowVariable[] = [
      {
        value: profile?.wallet?.address,
        variable: WALLET_VARIABLE.WALLET_ADDRESS,
      },
      {
        value: profile?.wallet?.phrase,
        variable: WALLET_VARIABLE.WALLET_PHRASE,
      },
      {
        value: profile?.wallet?.privateKey,
        variable: WALLET_VARIABLE.WALLET_PRIVATE_KEY,
      },
    ];
    listWalletVariable.forEach((variable: IWorkflowVariable) => {
      if (variable?.variable) {
        mapVariable[variable.variable] = variable;
      }
    });
  }

  // variable from Resource
  profile?.listResource?.forEach((resource: IResource) => {
    const resourceColumn = getResourceColumn(resource?.group!);
    resourceColumn?.forEach((column: ColumnConfig) => {
      if (column?.variable) {
        mapVariable[column.variable] = {
          value: (resource as any)?.[column?.dataIndex!],
          label: column?.title!,
          variable: column?.variable,
        };
      }
    });
  });

  // variable from Campaign
  const additionalColumn = getCampaignAdditionalColumn(campaign);
  additionalColumn?.forEach((column: ColumnConfig) => {
    if (column?.variable) {
      mapVariable[column.variable] = {
        value: (profile as any)?.[column?.dataIndex!],
        label: column?.title!,
        variable: column?.variable,
      };
    }
  });

  // set variable from Workflow config
  workflow?.listVariable?.forEach((variable: IWorkflowVariable) => {
    if (variable?.variable) {
      mapVariable[variable.variable] = {
        value: variable?.value,
        label: variable?.label,
        variable: variable?.variable,
      };
    }
  });

  const listVariable = Object.values(mapVariable);
  return _.sortBy(
    listVariable,
    (variable: IWorkflowVariable) => variable?.variable,
  );
};

export {
  getStartNodeId,
  getNextNodeId,
  updateItemInList,
  enhanceConfigWithExtensionID,
  getVariableFromProfile,
};
