import type { IResourceGroup, ICampaign, ColumnConfig } from "@/electron/type";

const getResourceColumn = (resourseGroup: IResourceGroup): ColumnConfig[] => {
  let listColumn: ColumnConfig[] = [
    {
      variable: resourseGroup?.col1Variable,
      title: resourseGroup?.col1Label,
      dataIndex: "col1",
    },
    {
      variable: resourseGroup?.col2Variable,
      title: resourseGroup?.col2Label,
      dataIndex: "col2",
    },
    {
      variable: resourseGroup?.col3Variable,
      title: resourseGroup?.col3Label,
      dataIndex: "col3",
    },
    {
      variable: resourseGroup?.col4Variable,
      title: resourseGroup?.col4Label,
      dataIndex: "col4",
    },
    {
      variable: resourseGroup?.col5Variable,
      title: resourseGroup?.col5Label,
      dataIndex: "col5",
    },
    {
      variable: resourseGroup?.col6Variable,
      title: resourseGroup?.col6Label,
      dataIndex: "col6",
    },
    {
      variable: resourseGroup?.col7Variable,
      title: resourseGroup?.col7Label,
      dataIndex: "col7",
    },
    {
      variable: resourseGroup?.col8Variable,
      title: resourseGroup?.col8Label,
      dataIndex: "col8",
    },
    {
      variable: resourseGroup?.col9Variable,
      title: resourseGroup?.col9Label,
      dataIndex: "col9",
    },
    {
      variable: resourseGroup?.col10Variable,
      title: resourseGroup?.col10Label,
      dataIndex: "col10",
    },
  ];

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

  let listColumn: ColumnConfig[] = [
    {
      variable: campaign?.col1Variable,
      title: campaign?.col1Label,
      dataIndex: "col1Value",
    },
    {
      variable: campaign?.col2Variable,
      title: campaign?.col2Label,
      dataIndex: "col2Value",
    },
    {
      variable: campaign?.col3Variable,
      title: campaign?.col3Label,
      dataIndex: "col3Value",
    },
    {
      variable: campaign?.col4Variable,
      title: campaign?.col4Label,
      dataIndex: "col4Value",
    },
    {
      variable: campaign?.col5Variable,
      title: campaign?.col5Label,
      dataIndex: "col5Value",
    },
    {
      variable: campaign?.col6Variable,
      title: campaign?.col6Label,
      dataIndex: "col6Value",
    },
    {
      variable: campaign?.col7Variable,
      title: campaign?.col7Label,
      dataIndex: "col7Value",
    },
    {
      variable: campaign?.col8Variable,
      title: campaign?.col8Label,
      dataIndex: "col8Value",
    },
    {
      variable: campaign?.col9Variable,
      title: campaign?.col9Label,
      dataIndex: "col9Value",
    },
    {
      variable: campaign?.col10Variable,
      title: campaign?.col10Label,
      dataIndex: "col10Value",
    },
  ];

  listColumn = listColumn.filter(
    (config: ColumnConfig) =>
      Boolean(config?.variable) && Boolean(config?.title),
  );

  return listColumn;
};

export { getResourceColumn, getCampaignAdditionalColumn };
