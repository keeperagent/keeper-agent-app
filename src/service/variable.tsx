import _ from "lodash";
import { ICampaign, IResourceGroup, ColumnConfig } from "@/electron/type";
import { EMPTY_STRING } from "@/config/constant";
import { TrimText } from "@/component";
import {
  getCampaignAdditionalColumn,
  getResourceColumn,
} from "@/service/tableView";
import { getMoneyString } from "./util";

export type GroupColumnConfig = {
  title: string | null | undefined;
  width?: string;
  children: ColumnConfig[];
};
export const RESOURCE_COLUMN_WIDTH = 250;
export const PROFILE_COLUMN_WIDTH = 170;

const getResourceGroupColumn = (
  listResourceGroupId: number[],
  listResourceGroup: IResourceGroup[],
): GroupColumnConfig[] => {
  const listColumn: GroupColumnConfig[] = [];
  listResourceGroupId?.forEach((groupId: number, index: number) => {
    const resourceGroup = _.find(listResourceGroup, { id: groupId });
    if (!resourceGroup) {
      return;
    }
    let childColumn = getResourceColumn(resourceGroup);
    childColumn = childColumn?.map((config: ColumnConfig) => ({
      ...config,
      width: `${RESOURCE_COLUMN_WIDTH}px`,
      render: (value: any, record: any) => {
        const text = record?.listResource?.[index]?.[config?.dataIndex as any];
        return text ? <TrimText text={text} maxLength={25} /> : EMPTY_STRING;
      },
    }));

    const groupColumn: GroupColumnConfig = {
      title: resourceGroup?.name,
      children: childColumn,
    };
    listColumn.push(groupColumn);
  });

  return listColumn;
};

const getCampaignProfileAdditionalColumn = (
  campaign: ICampaign | null,
): ColumnConfig[] => {
  if (!campaign) {
    return [];
  }

  let listColumn = getCampaignAdditionalColumn(campaign);
  listColumn = listColumn?.map((config: ColumnConfig) => ({
    ...config,
    width: `${RESOURCE_COLUMN_WIDTH}px`,
    render: (value: any, record: any) => {
      let text = record?.[config?.dataIndex as any];
      if (isNaN(Number(text)) || !/^\d+$/.test(text)) {
        return text ? <TrimText text={text} maxLength={37} /> : EMPTY_STRING;
      }

      text = getMoneyString(text?.toString());
      return text ? <TrimText text={text} maxLength={15} /> : EMPTY_STRING;
    },
  }));

  return listColumn;
};

export {
  getResourceColumn,
  getResourceGroupColumn,
  getCampaignProfileAdditionalColumn,
};
