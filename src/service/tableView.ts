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

  const defaultOrder = Array.from(
    { length: NUMBER_OF_COLUMN },
    (_, index) => `col${index + 1}`,
  );
  const order =
    campaign.columnOrder?.length === NUMBER_OF_COLUMN
      ? campaign.columnOrder
      : defaultOrder;

  const columnMap: Record<string, ColumnConfig> = {};
  Array.from({ length: NUMBER_OF_COLUMN }, (_, index) => {
    const num = index + 1;
    const key = `col${num}`;
    columnMap[key] = {
      variable: (campaign as any)?.[`${key}Variable`],
      title: (campaign as any)?.[`${key}Label`],
      dataIndex: `${key}Value`,
    };
  });

  return order
    .map((key) => columnMap[key])
    .filter(
      (config: ColumnConfig) =>
        Boolean(config?.variable) && Boolean(config?.title),
    );
};

export { getResourceColumn, getCampaignAdditionalColumn };
