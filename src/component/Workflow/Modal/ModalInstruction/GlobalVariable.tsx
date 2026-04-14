import { Fragment, useEffect, useState } from "react";
import { Button, Input, Popconfirm, Table } from "antd";
import { DeleteIcon } from "@/component/Icon";
import { useSelector } from "react-redux";
import { Code } from "@/component";
import { ISetting, SETTING_TYPE } from "@/electron/type";
import { useTranslation } from "@/hook";
import {
  useCreateSetting,
  useDeleteSetting,
  useGetListSetting,
  useUpdateSetting,
} from "@/hook/setting";
import { settingSelector } from "@/redux/setting";
import { RootState } from "@/redux/store";

type IEditingValues = {
  variable: string;
  value: string;
  label: string;
};

type INewRowValues = {
  variable: string;
  value: string;
  label: string;
};

const GlobalVariable = () => {
  const { translate } = useTranslation();
  const { getListSetting } = useGetListSetting();
  const listSetting = useSelector(
    (state: RootState) => settingSelector(state).listSetting,
  );

  const [isAddingRow, setIsAddingRow] = useState(false);
  const [newRowValues, setNewRowValues] = useState<INewRowValues>({
    variable: "",
    value: "",
    label: "",
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingValues, setEditingValues] = useState<IEditingValues>({
    variable: "",
    value: "",
    label: "",
  });
  const { createSetting, loading: createLoading } = useCreateSetting({
    onSuccess: () => {
      setIsAddingRow(false);
      setNewRowValues({ variable: "", value: "", label: "" });
    },
  });
  const { updateSetting, loading: updateLoading } = useUpdateSetting({
    onSuccess: () => {
      setEditingId(null);
    },
  });
  const { deleteSetting } = useDeleteSetting();

  const reloadList = () => {
    getListSetting({
      page: 1,
      pageSize: 1000,
      type: SETTING_TYPE.WORKFLOW_GLOBAL_VARIABLE,
    });
  };

  useEffect(() => {
    reloadList();
  }, []);

  const formatVariableName = (rawValue: string) =>
    rawValue.toUpperCase().replace(/\s/g, "");

  const handleStartEdit = (setting: ISetting) => {
    if (editingId !== null) {
      setEditingId(null);
    }
    setEditingId(setting.id!);
    setEditingValues({
      variable: setting.workflowGlobalVariable?.variable || setting.name,
      value: String(setting.workflowGlobalVariable?.value || ""),
      label: setting.workflowGlobalVariable?.label || "",
    });
  };

  const handleSaveNew = () => {
    if (!newRowValues.variable.trim()) {
      return;
    }
    const encodedData = JSON.stringify({
      label: newRowValues.label || "",
      value: newRowValues.value || "",
    });
    createSetting({
      name: newRowValues.variable.trim(),
      type: SETTING_TYPE.WORKFLOW_GLOBAL_VARIABLE,
      data: encodedData,
    });
  };

  const handleSaveEdit = (setting: ISetting) => {
    if (!editingValues.variable.trim()) {
      return;
    }
    const encodedData = JSON.stringify({
      label: editingValues.label || "",
      value: editingValues.value || "",
    });
    updateSetting({
      ...setting,
      name: editingValues.variable.trim(),
      data: encodedData,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleAddRow = () => {
    setIsAddingRow(true);
    setNewRowValues({ variable: "", value: "", label: "" });
  };

  const columns = [
    {
      title: translate("indexTable"),
      dataIndex: "index",
      key: "index",
      width: "6%",
      render: (_: any, record: any) => {
        if (record.isNewRow) {
          return "";
        }
        return record.index;
      },
    },
    {
      title: translate("resource.variableName"),
      dataIndex: "variable",
      key: "variable",
      width: "25%",
      render: (value: string, record: any) => {
        if (record.isNewRow) {
          return (
            <Input
              className="custom-input"
              value={newRowValues.variable}
              placeholder={translate("resource.variableName")}
              onChange={(event) =>
                setNewRowValues({
                  ...newRowValues,
                  variable: formatVariableName(event.target.value),
                })
              }
            />
          );
        }
        if (editingId === record.id) {
          return (
            <Input
              className="custom-input"
              value={editingValues.variable}
              onChange={(event) =>
                setEditingValues({
                  ...editingValues,
                  variable: formatVariableName(event.target.value),
                })
              }
            />
          );
        }
        return (
          <div
            style={{ display: "flex", cursor: "pointer" }}
            onClick={() => handleStartEdit(record.setting)}
          >
            <Code text={value} isWithCopy={true} />
          </div>
        );
      },
    },
    {
      title: translate("value"),
      dataIndex: "value",
      key: "value",
      width: "25%",
      render: (value: string, record: any) => {
        if (record.isNewRow) {
          return (
            <Input
              className="custom-input"
              value={newRowValues.value}
              placeholder={translate("value")}
              onChange={(event) =>
                setNewRowValues({ ...newRowValues, value: event.target.value })
              }
            />
          );
        }
        if (editingId === record.id) {
          return (
            <Input
              className="custom-input"
              value={editingValues.value}
              onChange={(event) =>
                setEditingValues({
                  ...editingValues,
                  value: event.target.value,
                })
              }
            />
          );
        }
        return (
          <span
            style={{ cursor: "pointer", display: "block" }}
            onClick={() => handleStartEdit(record.setting)}
          >
            {value}
          </span>
        );
      },
    },
    {
      title: translate("workflow.variableDescription"),
      dataIndex: "description",
      key: "description",
      width: "25%",
      render: (value: string, record: any) => {
        if (record.isNewRow) {
          return (
            <Input
              className="custom-input"
              value={newRowValues.label}
              placeholder={translate("workflow.variableDescription")}
              onChange={(event) =>
                setNewRowValues({ ...newRowValues, label: event.target.value })
              }
            />
          );
        }
        if (editingId === record.id) {
          return (
            <Input
              className="custom-input"
              value={editingValues.label}
              onChange={(event) =>
                setEditingValues({
                  ...editingValues,
                  label: event.target.value,
                })
              }
            />
          );
        }
        return (
          <span
            style={{ cursor: "pointer", display: "block" }}
            onClick={() => handleStartEdit(record.setting)}
          >
            {value}
          </span>
        );
      },
    },
    {
      title: "",
      key: "action",
      align: "center",
      width: "15%",
      render: (_: any, record: any) => {
        if (record.isNewRow) {
          return (
            <Fragment>
              <Button
                size="small"
                type="primary"
                loading={createLoading}
                onClick={handleSaveNew}
              >
                {translate("save")}
              </Button>

              <Button
                size="small"
                style={{ marginLeft: "var(--margin-left)" }}
                onClick={() => setIsAddingRow(false)}
              >
                {translate("cancel")}
              </Button>
            </Fragment>
          );
        }

        if (editingId === record.id) {
          return (
            <Fragment>
              <Button
                size="small"
                type="primary"
                loading={updateLoading}
                onClick={() => handleSaveEdit(record.setting)}
              >
                {translate("save")}
              </Button>

              <Button
                size="small"
                style={{ marginLeft: 4 }}
                onClick={handleCancelEdit}
              >
                {translate("cancel")}
              </Button>
            </Fragment>
          );
        }
        return (
          <Popconfirm
            title={translate("confirmDelete")}
            onConfirm={() => deleteSetting(record.id)}
          >
            <span style={{ cursor: "pointer" }}>
              <DeleteIcon width={16} height={16} color="var(--color-error)" />
            </span>
          </Popconfirm>
        );
      },
    },
  ];

  const existingRows = listSetting
    .filter(
      (setting: ISetting) =>
        setting.type === SETTING_TYPE.WORKFLOW_GLOBAL_VARIABLE,
    )
    .map((setting: ISetting, index: number) => ({
      id: setting.id,
      index: index + 1,
      variable: setting.workflowGlobalVariable?.variable || setting.name,
      description: setting.workflowGlobalVariable?.label || "",
      value: String(setting.workflowGlobalVariable?.value || ""),
      setting,
      isNewRow: false,
    }));

  const newRowEntry = isAddingRow
    ? [
        {
          id: "new",
          index: "—",
          variable: "",
          description: "",
          value: "",
          isNewRow: true,
        },
      ]
    : [];

  const dataSource = [...newRowEntry, ...existingRows];

  return (
    <Fragment>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "var(--margin-bottom)",
        }}
      >
        <Button type="primary" disabled={isAddingRow} onClick={handleAddRow}>
          {translate("create")}
        </Button>
      </div>

      <Table
        pagination={{ pageSize: 10, pageSizeOptions: [10, 20, 50] }}
        dataSource={dataSource}
        // @ts-ignore
        columns={columns}
        rowKey="id"
        size="middle"
        scroll={{ x: 1000, y: "60vh" }}
        locale={{ emptyText: translate("workflow.globalVariableEmptyText") }}
      />
    </Fragment>
  );
};

export default GlobalVariable;
