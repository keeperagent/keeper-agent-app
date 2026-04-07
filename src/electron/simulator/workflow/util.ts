import _ from "lodash";
import {
  ColumnConfig,
  ICampaign,
  ICampaignProfile,
  ILoopNodeConfig,
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

/* 
  parameters: list nodes, edges, "Start" node ID, "End" node ID
  return path: type array
  workflow:
    1. find all loop nodes
    2. find all cycles
    3. loop through the edges array
    4. if the next node is not in the cycle, push it to the path array
    5. if the next node is in the cycle, get cycle by node ID, get number of loop, push the cycle to the array path
    6. remove the traversed edge from the array
    7. repeat step 3 until the next node is the "End" node
*/

// valid workflow flow must be start with "Start" INode
const createPathWorkflow = (
  edges: IEdge[],
  nodes: INode[],
  startNodeId: string,
  endNodeId: string,
) => {
  let tempEdges: IEdge[] = [...edges];
  let path: string[] = [];
  let currentNodeId: string = startNodeId;

  // find all loop nodes
  const listNodeLoopId = nodes
    ?.filter(
      (node: INode) => node?.data?.config?.workflowType === WORKFLOW_TYPE?.LOOP,
    )
    ?.map((node: INode) => node?.id);

  const listCycles = findAllCycles(startNodeId, edges);

  while (true) {
    const nextEdge = findNextEdge(tempEdges, currentNodeId);
    const edgeWithEndNode = nextEdge.find((edge) => edge.target === endNodeId);
    // if not found next edge
    if (_.isEmpty(nextEdge)) {
      break;
    }

    // is INode is connected with EndNode, then break
    if (edgeWithEndNode) {
      path.push(edgeWithEndNode?.target);
      break;
    }

    // check next node is in cycle
    const circleIndex = listCycles?.findIndex((cycle: string[]) => {
      const hasCycle = nextEdge?.find((edge: IEdge) => {
        return cycle?.includes(edge?.target);
      });
      return hasCycle;
    });

    const currentCycle = listCycles?.[circleIndex];
    if (!currentCycle) {
      const nextNodeId = nextEdge?.[0]?.target;

      path.push(nextNodeId);
      currentNodeId = nextNodeId;
      // Remove the traversed edge from the array
      const edgeIndex = tempEdges.findIndex(
        (edge: IEdge) => edge?.id === nextEdge?.[0]?.id,
      );
      tempEdges.splice(edgeIndex, 1);
    } else {
      // Find the loop node in the cycle
      const currentLoopNodeId = listNodeLoopId?.find((item: string) =>
        currentCycle?.includes(item),
      );
      if (!currentLoopNodeId) {
        continue;
      }

      // get number of loop and cycle
      const numberOfLoop = getNumberOfLoop(nodes, currentLoopNodeId);
      if (numberOfLoop <= 0) {
        continue;
      }

      // get cycle ignore loop node
      const itemToLoop = currentCycle?.filter(
        (item: any) => item !== currentLoopNodeId,
      );

      for (let i = 0; i < numberOfLoop; i++) {
        path = path.concat(itemToLoop);
      }

      // update current node after cycle,
      const sourceLoopNode = edges?.find(
        (edge) => edge?.target === currentLoopNodeId,
      )?.source;
      //  and remove cycle from temp edges
      currentNodeId = sourceLoopNode || "";
      tempEdges = removeCycleTempEdges(tempEdges, currentCycle);

      listCycles.splice(circleIndex, 1); // Remove the cycle from the list
    }
  }

  return path;
};

const removeCycleTempEdges = (edges: IEdge[], cycle: string[]): IEdge[] => {
  const newEdges = edges.filter((edge: IEdge) => {
    return !(cycle.includes(edge.source) && cycle.includes(edge.target));
  });
  return [...newEdges];
};

const findAllCycles = (startNode: string, edges: IEdge[]): string[][] => {
  const graph: { [key: string]: string[] } = {}; // Adjacency list representation of the graph
  const visited: { [key: string]: boolean } = {}; // Keep track of visited nodes
  const cycles: string[][] = []; // Array to store cycles

  // Build the adjacency list
  edges.forEach((edge: IEdge) => {
    const source = edge?.source;
    const target = edge?.target;
    if (!graph[source]) graph[source] = [];
    graph[source].push(target);
  });

  // DFS function to detect cycles
  function dfs(node: string, path: string[]) {
    if (visited[node]) {
      const cycleStartIndex = path.indexOf(node);
      if (cycleStartIndex !== -1) {
        cycles.push(path.slice(cycleStartIndex));
        return;
      }
      return;
    }

    visited[node] = true;
    path.push(node);

    if (graph[node]) {
      graph[node].forEach((neighbor: string) => {
        dfs(neighbor, [...path]);
      });
    }

    visited[node] = false; // Reset visited status to false for backtracking
  }

  // Start the DFS from the given startNode
  dfs(startNode, []);

  return cycles;
};

// a Node can have many Edge
const findNextEdge = (edges: IEdge[], currentNodeId: string): IEdge[] => {
  return edges?.filter((edge: IEdge) => edge?.source === currentNodeId);
};

const getNumberOfLoop = (nodes: INode[], loopNodeId: string) => {
  const loopNode = nodes?.find((node: INode) => node.id === loopNodeId);
  return (loopNode?.data?.config as ILoopNodeConfig)?.loop || 0;
};

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
  createPathWorkflow,
  updateItemInList,
  enhanceConfigWithExtensionID,
  getVariableFromProfile,
};
