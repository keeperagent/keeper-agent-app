import { useEffect } from "react";
import { Table } from "antd";
import { useSelector } from "react-redux";
import { Code } from "@/component";
import { ISetting, SETTING_TYPE } from "@/electron/type";
import { useTranslation } from "@/hook";
import { useGetListSetting } from "@/hook/setting";
import { settingSelector } from "@/redux/setting";
import { RootState } from "@/redux/store";

const columns = (translate: any) => [
  {
    title: translate("indexTable"),
    dataIndex: "index",
    key: "index",
    width: "6%",
  },
  {
    title: translate("resource.variableName"),
    dataIndex: "variable",
    key: "variable",
    render: (value: string) => (
      <div style={{ display: "flex" }}>
        <Code text={value} isWithCopy={true} />
      </div>
    ),
    width: "30%",
  },
  {
    title: translate("value"),
    dataIndex: "value",
    key: "value",
    width: "25%",
  },
  {
    title: translate("workflow.variableDescription"),
    dataIndex: "description",
    key: "description",
    width: "30%",
  },
];

const GlobalVariable = () => {
  const { translate } = useTranslation();
  const { getListSetting } = useGetListSetting();
  const listSetting = useSelector(
    (state: RootState) => settingSelector(state).listSetting,
  );

  useEffect(() => {
    getListSetting({
      page: 1,
      pageSize: 1000,
      type: SETTING_TYPE.WORKFLOW_GLOBAL_VARIABLE,
    });
  }, []);

  const dataSource = listSetting
    .filter(
      (setting: ISetting) =>
        setting.type === SETTING_TYPE.WORKFLOW_GLOBAL_VARIABLE,
    )
    .map((setting: ISetting, index: number) => ({
      index: index + 1,
      variable: setting.workflowGlobalVariable?.variable || setting.name,
      description: setting.workflowGlobalVariable?.label || "",
      value: setting.workflowGlobalVariable?.value || "",
    }));

  return (
    <Table
      pagination={{ pageSize: 10, pageSizeOptions: [10, 20, 50] }}
      dataSource={dataSource}
      columns={columns(translate)}
      size="middle"
      scroll={{ x: 1000, y: "67vh" }}
      locale={{ emptyText: translate("workflow.globalVariableEmptyText") }}
    />
  );
};

export default GlobalVariable;
