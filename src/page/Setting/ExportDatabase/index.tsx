import { Row, Input, Alert, Spin, Form } from "antd";
import { UploadButton } from "@/component/Button";
import { UploadIcon } from "@/component/Icon";
import { Code } from "@/component";
import { useExportDatabase, useChooseFolder, useTranslation } from "@/hook";
import { Wrapper, HelpWrapper, IconWrapper } from "./style";
import { useEffect } from "react";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";

const cacheItemName = "exportDatabaseFolderPath";

const ExportDatabase = (_props: any) => {
  const { translate } = useTranslation();
  const { exportDatabase, loading } = useExportDatabase();
  const { chooseFolder } = useChooseFolder();
  const [form] = Form.useForm();

  useEffect(() => {
    const cacheItem = localStorage.getItem(cacheItemName);
    if (cacheItem) {
      form.setFieldValue("folderPath", cacheItem);
    }
  }, []);

  const onSubmit = async () => {
    try {
      const { folderPath } = await form.validateFields(["folderPath"]);
      exportDatabase(folderPath);
    } catch {}
  };

  const onChooseFolder = async () => {
    const folderPath = await chooseFolder();
    if (folderPath === null) {
      return;
    }

    form.setFieldValue("folderPath", folderPath);
    localStorage.setItem(cacheItemName, folderPath);
    try {
      await form.validateFields(["folderPath"]);
    } catch {}
  };

  return (
    <Spin spinning={loading}>
      <Wrapper>
        <Form layout="vertical" form={form}>
          <Form.Item
            label={`${translate("setting.selectFolderExport")}:`}
            name="folderPath"
            rules={[
              {
                required: true,
                message: translate("form.requiredField"),
              },
            ]}
          >
            <Input
              className="custom-input custom-input__export"
              placeholder={translate("setting.selectFolderExportPlaceholder")}
              size="large"
              addonAfter={
                <IconWrapper onClick={onChooseFolder}>
                  <UploadIcon />
                </IconWrapper>
              }
            />
          </Form.Item>
        </Form>

        <Alert
          title={
            <HelpWrapper>
              <span>{translate("setting.exportHelpText")}</span>{" "}
              <Code text="database.txt" isWithCopy={true} />
            </HelpWrapper>
          }
          type="warning"
          showIcon
          style={{ marginTop: "var(--margin-top)" }}
        />

        <Row justify="end">
          <UploadButton
            text="Export"
            isUploadButton={true}
            style={{ marginTop: "var(--margin-top)" }}
            onClick={onSubmit}
          />
        </Row>
      </Wrapper>
    </Spin>
  );
};

export default connect((_state: RootState) => ({}), {})(ExportDatabase);
