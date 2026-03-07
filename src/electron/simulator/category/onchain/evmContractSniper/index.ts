import AsyncLock from "async-lock";
import _ from "lodash";
import { ContractSniper } from "./contractSniper";
import { ISnipeContractInput } from "@/electron/type";
import { logEveryWhere } from "@/electron/service/util";

class EVMContractSnipperManager {
  private mapSnipper: Map<string, ContractSniper>;
  private lock: AsyncLock;
  private lockKey: string;

  constructor() {
    this.mapSnipper = new Map();
    this.lock = new AsyncLock();
    this.lockKey = "EVMContractSnipperManager";
  }

  private getListProviderKey = (listNodeEndpoint: string[]): string => {
    return _.sortBy(listNodeEndpoint).join("-");
  };

  private getSnipperKey = (input: ISnipeContractInput, campaignId: number, workflowId: number): string => {
    return `${input.contractAddress}_${input.eventAbi
      }_${this.getListProviderKey(input.listNodeEndpoint)}_${input.fromBlock}_${input.toBlock
      }_${input.blockStep}_${input.confirmationBlock}_${input.listVariable}_${input.profileMode
      }_campaignId_${campaignId}_workflowId_${workflowId}`;
  };

  getContractSniper = async (
    input: ISnipeContractInput,
    mustGetRunningSnipper: boolean,
    campaignId: number,
    workflowId: number,
  ): Promise<ContractSniper> => {
    const snipperKey = this.getSnipperKey(input, campaignId, workflowId);
    const snipper = this.mapSnipper.get(snipperKey);
    if (
      snipper !== undefined &&
      (!mustGetRunningSnipper || (mustGetRunningSnipper && snipper.isRunning))
    ) {
      return snipper;
    }

    logEveryWhere({ message: `Creating contract sniper for event: ${input.eventAbi}` });
    return await this.lock.acquire(this.lockKey, async () => {
      if (snipper) {
        !snipper.isRunning && snipper.start();
        return snipper;
      } else {
        const newSnipper = new ContractSniper(input);
        this.mapSnipper.set(snipperKey, newSnipper);
        if (mustGetRunningSnipper) {
          newSnipper.start();
        }
        return newSnipper;
      }
    });
  };

  stop = (campaignId: number, workflowId: number) => {
    const suffix = `_campaignId_${campaignId}_workflowId_${workflowId}`;
    for (const [key, snipper] of this.mapSnipper) {
      if (key.endsWith(suffix) && snipper.isRunning) {
        snipper.stop();
      }
    }
  };
}

export { EVMContractSnipperManager };
