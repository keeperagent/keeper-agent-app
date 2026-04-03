import { scheduleDB } from "@/electron/database/schedule";
import { campaignDB } from "@/electron/database/campaign";
import { IGlobalSearchResult } from "@/electron/type";
import { nodeEndpointGroupDB } from "@/electron/database/nodeEndpointGroup";
import { staticProxyGroupDB } from "@/electron/database/staticProxyGroup";
import { profileGroupDB } from "@/electron/database/profileGroup";
import { resourceGroupDB } from "@/electron/database/resourceGroup";
import { walletGroupDB } from "@/electron/database/walletGroup";
import { workflowDB } from "@/electron/database/workflow";

const perPage = 6;

export const globalSearch = async (
  searchText: string,
): Promise<[IGlobalSearchResult | null, Error | null]> => {
  try {
    const [listCampaign] =
      (await campaignDB.getListCampaign(1, perPage, searchText)) || [];
    const [listWorkflow] =
      (await workflowDB.getListWorkflow(1, perPage, searchText)) || [];
    const [listSchedule] =
      (await scheduleDB.getListSchedule(1, perPage, searchText)) || [];
    const [listWalletGroup] =
      (await walletGroupDB.getListWalletGroup(1, perPage, searchText)) || [];
    const [listResourceGroup] =
      (await resourceGroupDB.getListResourceGroup(1, perPage, searchText)) ||
      [];
    const [listProfileGroup] =
      (await profileGroupDB.getListProfileGroup(1, perPage, searchText)) || [];
    const [listStaticProxyGroup] =
      (await staticProxyGroupDB.getListStaticProxyGroup(
        1,
        perPage,
        searchText,
      )) || [];
    const [listNodeEndpointGroup] =
      (await nodeEndpointGroupDB.getListNodeEndpointGroup(
        1,
        perPage,
        searchText,
      )) || [];

    return [
      {
        campaigns: listCampaign?.data || [],
        workflows: listWorkflow?.data || [],
        schedules: listSchedule?.data || [],
        walletGroups: listWalletGroup?.data || [],
        resourceGroups: listResourceGroup?.data || [],
        profileGroups: listProfileGroup?.data || [],
        staticProxyGroups: listStaticProxyGroup?.data || [],
        nodeEndpointGroups: listNodeEndpointGroup?.data || [],
      },
      null,
    ];
  } catch (error) {
    return [null, error as Error | null];
  }
};
