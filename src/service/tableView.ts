import type { IResourceGroup, ICampaign, ColumnConfig } from "@/electron/type";
import { NUMBER_OF_COLUMN } from "@/electron/constant";

const getResourceColumn = (resourseGroup: IResourceGroup): ColumnConfig[] => {
  let listColumn: ColumnConfig[] = Array.from(
    { length: NUMBER_OF_COLUMN },
    (_, index) => {
      const num = index + 1;
      return {
        variable: (resourseGroup as any)?.[`col${num}Variable`],
        title: (resourseGroup as any)?.[`col${num}Label`],
        dataIndex: `col${num}`,
      };
    },
  );

  listColumn = listColumn.filter(
    (config: ColumnConfig) =>
      Boolean(config?.variable) && Boolean(config?.title),
  );

  return listColumn;
};

const getCampaignAdditionalColumn = (
  campaign: ICampaign | null,
): ColumnConfig[] => {
  if (!campaign) {
    return [];
  }

  let listColumn: ColumnConfig[] = Array.from(
    { length: NUMBER_OF_COLUMN },
    (_, index) => {
      const num = index + 1;
      return {
        variable: (campaign as any)?.[`col${num}Variable`],
        title: (campaign as any)?.[`col${num}Label`],
        dataIndex: `col${num}Value`,
      };
    },
  );

  listColumn = listColumn.filter(
    (config: ColumnConfig) =>
      Boolean(config?.variable) && Boolean(config?.title),
  );

  return listColumn;
};

export { getResourceColumn, getCampaignAdditionalColumn };
