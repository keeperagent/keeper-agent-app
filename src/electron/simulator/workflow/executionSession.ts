import { IFlowProfile, IExecutionSession } from "@/electron/type";
import { ISimulator, safeCloseSimulator } from "@/electron/simulator/util";
import { campaignProfileDB } from "@/electron/database/campaignProfile";
import { logEveryWhere } from "@/electron/service/util";

export class ExecutionSession implements IExecutionSession {
  flowProfiles: Map<number, IFlowProfile> = new Map();
  browsers: Map<number, any> = new Map();
  simulators: Map<number, ISimulator> = new Map();

  handoffFlowProfile = (profileId: number, flowProfile: IFlowProfile): void => {
    this.flowProfiles.set(profileId, {
      ...flowProfile,
      nodeID: null,
      edgeID: null,
    });
  };

  saveSimulator = (profileId: number, simulator: ISimulator): void => {
    this.simulators.set(profileId, simulator);
  };

  getSimulator = (profileId: number): ISimulator | null => {
    return this.simulators.get(profileId) || null;
  };

  destroy = async (): Promise<void> => {
    for (const [, simulator] of this.simulators.entries()) {
      await safeCloseSimulator(simulator);
    }
    this.simulators.clear();
    this.browsers.clear();

    // increment round for all surviving profiles
    for (const [profileId, flowProfile] of this.flowProfiles.entries()) {
      try {
        const profile = flowProfile.profile;
        if (profile?.id && profile?.campaignId) {
          await campaignProfileDB.updateCampaignProfile({
            id: profile.id,
            campaignId: profile.campaignId,
            isRunning: false,
            round: (profile.round || 0) + 1,
          });
        }
      } catch (err: any) {
        logEveryWhere({
          message: `ExecutionSession.destroy(): failed to increment round for profile ${profileId}: ${err?.message}`,
        });
      }
    }
    this.flowProfiles.clear();
  };
}
