import { Fragment, useEffect, useState, useMemo } from "react";
import { Tabs, Form, Input, Row, Button, Select, Alert } from "antd";
import _ from "lodash";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { NODE_ACTION } from "@/electron/simulator/constant";
import { ICheckResourceNodeConfig, IResourceGroup } from "@/electron/type";
import { EMPTY_STRING } from "@/config/constant";
import {
  ENCRYPT_MODE,
  IS_RESOURCE_EXIST,
  NODE_STATUS,
} from "@/electron/constant";
import {
  useTranslation,
  useGetListResourceGroup,
  useSaveNodeSecret,
  useGetNodeSecret,
} from "@/hook";
import { getResourceColumn } from "@/service/tableView";
import { Code, TagOption } from "@/component";
import { PasswordInput } from "@/component/Input";
import { actSaveSelectedResourceGroup } from "@/redux/resourceGroup";
import { Wrapper, OptionWrapper } from "./style";
import { TAB_NAME_EN, TAB } from "../util";
import WorkflowVariable from "../../WorkflowVariable";
import { FormLabelWrapper } from "../style";
import CommonSetting from "../CommonSetting";
import SkipSetting from "../SkipSetting";

const { Option } = Select;
let searchGroupTimeOut: any = null;
const { TextArea } = Input;

type Props = {
  onCloseModal: () => any;
  onSaveNodeConfig: (config: ICheckResourceNodeConfig) => void;
  config: ICheckResourceNodeConfig;
  isModalOpen: boolean;
  listResourceGroup: IResourceGroup[];
  nodeId: string;
  workflowId: number;
};

const SelectResource = (props: Props) => {
  const { translate, locale } = useTranslation();
  const {
    onCloseModal,
    onSaveNodeConfig,
    config,
    isModalOpen,
    listResourceGroup,
    nodeId,
    workflowId,
  } = props;

  const [activeTab, setActiveTab] = useState(TAB.DETAIL);
  const [isSkip, setIsSkip] = useState(false);
  const [mode, setMode] = useState(ENCRYPT_MODE.NO_ENSCRYPT);
  const [encryptKey, setEncryptKey] = useState("");
  const [isEncryptKeyTouched, setIsEncryptKeyTouched] = useState(false);
  const [hasEncryptKey, setHasEncryptKey] = useState(false);
  const [selectedResourceGroup, setSelectedResourceGroup] =
    useState<IResourceGroup | null>(null);
  const [form] = Form.useForm();
  const { getListResourceGroup, loading } = useGetListResourceGroup();
  const { saveNodeSecret } = useSaveNodeSecret();
  const { getNodeSecret } = useGetNodeSecret();

  useEffect(() => {
    getListResourceGroup({
      page: 1,
      pageSize: 1000,
    });

    return () => {
      searchGroupTimeOut = null;
    };
  }, []);

  const listColumn = useMemo(() => {
    return getResourceColumn(selectedResourceGroup || {});
  }, [selectedResourceGroup]);

  const TAB_NAME = useMemo(() => {
    return TAB_NAME_EN;
  }, [locale]);

  useEffect(() => {
    form.setFieldsValue({
      name: config?.name,
      sleep: config?.sleep,
      resourceGroupId: config?.resourceGroupId,
      compareValue: config?.compareValue,
      fieldName: config?.fieldName,
      encryptKey: "", // set value show on UI is empty for security purpose
      onSuccess: config?.onSuccess || NODE_ACTION.CONTINUE_RUN,
      onError: config?.onError || NODE_ACTION.PAUSE_THREAD,
      leftSide: config?.skipSetting?.leftSide,
      condition: config?.skipSetting?.condition,
      rightSide: config?.skipSetting?.rightSide,
      alertTelegramWhenError: config?.alertTelegramWhenError,
    });
    setActiveTab(TAB.DETAIL);
    setIsSkip(Boolean(config?.skipSetting?.isSkip));
    setMode(config?.mode || ENCRYPT_MODE.NO_ENSCRYPT);

    setEncryptKey("");
    setIsEncryptKeyTouched(false);
    setHasEncryptKey(false);
    if (isModalOpen && workflowId && nodeId) {
      getNodeSecret(workflowId, nodeId).then((hasKey) => {
        setHasEncryptKey(hasKey);
      });
    }
  }, [isModalOpen, config, form]);

  useEffect(() => {
    setSelectedResourceGroup(
      _.find(listResourceGroup, { id: config?.resourceGroupId }) || null,
    );
  }, [listResourceGroup, config?.resourceGroupId]);

  const onChange = (key: string) => {
    setActiveTab(key);
  };

  const onSubmit = async () => {
    try {
      const {
        sleep,
        name,
        resourceGroupId,
        compareValue,
        fieldName,
        onError,
        onSuccess,
        leftSide,
        condition,
        rightSide,
        alertTelegramWhenError,
      } = await form?.validateFields([
        "sleep",
        "name",
        "resourceGroupId",
        "compareValue",
        "fieldName",
        "onSuccess",
        "onError",
        "leftSide",
        "condition",
        "rightSide",
        "alertTelegramWhenError",
      ]);

      if (workflowId && nodeId && isEncryptKeyTouched) {
        await saveNodeSecret(workflowId, nodeId, encryptKey);
      }
      onSaveNodeConfig({
        sleep,
        name,
        status: NODE_STATUS.RUN,
        resourceGroupId,
        compareValue,
        fieldName,
        encryptKey: "", // Never stored in config/Redux; key lives only in NodeSecret table.
        mode: mode as ENCRYPT_MODE,
        onError,
        onSuccess,
        skipSetting: {
          leftSide,
          rightSide,
          condition,
          isSkip,
        },
        alertTelegramWhenError,
        retry: 0,
      });
      onCloseModal();
    } catch {}
  };

  const onSearchResourceGroup = (text: string) => {
    if (searchGroupTimeOut) {
      clearTimeout(searchGroupTimeOut);
    }
    searchGroupTimeOut = setTimeout(() => {
      getListResourceGroup({ page: 1, pageSize: 1000, searchText: text });
    }, 200);
  };

  const onChangeResourceGroup = (value: string) => {
    setSelectedResourceGroup(
      _.find(listResourceGroup, { id: Number(value) }) || null,
    );
  };

  return (
    <Wrapper>
      <Tabs
        onChange={onChange}
        type="card"
        size="small"
        items={[
          {
            label: TAB_NAME[TAB.DETAIL],
            key: TAB.DETAIL,
          },
          {
            label: TAB_NAME[TAB.SETTING],
            key: TAB.SETTING,
          },
          {
            label: TAB_NAME[TAB.SKIP],
            key: TAB.SKIP,
          },
        ]}
        activeKey={activeTab}
      />

      <Form layout="vertical" form={form} initialValues={{ sleep: 0 }}>
        {activeTab === TAB.DETAIL && (
          <Fragment>
            <Alert
              title={
                <span>
                  <span style={{ marginLeft: "0.5rem" }}>
                    {translate("workflow.selectResourceHelper")}:
                  </span>
                  <br />
                  <Code
                    text={IS_RESOURCE_EXIST}
                    isWithCopy={true}
                    style={{ float: "left", marginTop: "0.5rem" }}
                  />

                  {listColumn?.map((column, index) => (
                    <Code
                      text={column.variable!}
                      isWithCopy={true}
                      style={{ float: "left", marginTop: "0.5rem" }}
                      key={index}
                    />
                  ))}
                </span>
              }
              type="info"
              showIcon
              className="help"
              style={{ marginBottom: "var(--margin-bottom)" }}
            />

            <Form.Item
              label={
                <FormLabelWrapper>
                  <span className="text">Search text:</span>
                  <WorkflowVariable form={form} fieldName="compareValue" />
                </FormLabelWrapper>
              }
              name="compareValue"
              rules={[
                {
                  required: true,
                  message: translate("form.requiredField"),
                },
              ]}
            >
              <TextArea
                placeholder={translate("workflow.enterValueToSearch")}
                className="custom-input"
                size="large"
                rows={1}
              />
            </Form.Item>

            <Form.Item
              label={`${translate("workflow.searchFromResourceGroup")}:`}
              name="resourceGroupId"
              rules={[
                {
                  required: true,
                  message: translate("form.requiredField"),
                },
              ]}
            >
              <Select
                placeholder={translate("workflow.selectResourceGroup")}
                size="large"
                className="custom-select"
                showSearch
                onSearch={onSearchResourceGroup}
                onChange={onChangeResourceGroup}
                filterOption={false}
                loading={loading}
                optionLabelProp="label"
              >
                {listResourceGroup?.map((group: IResourceGroup) => (
                  <Option key={group?.id} value={group?.id} label={group?.name}>
                    <OptionWrapper>
                      <div className="name">{group?.name || EMPTY_STRING}</div>
                      <div className="description">
                        {group?.note || EMPTY_STRING}
                      </div>
                    </OptionWrapper>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label={`${translate("workflow.fieldToSearch")}:`}
              name="fieldName"
              rules={[
                {
                  required: true,
                  message: translate("form.requiredField"),
                },
              ]}
            >
              <Select
                placeholder={translate("workflow.selectColumnToSearch")}
                size="large"
                className="custom-select"
                options={listColumn?.map((column) => ({
                  value: column?.dataIndex,
                  label: column?.title,
                }))}
              />
            </Form.Item>

            <div className="encript">
              <TagOption
                content={translate("wallet.noEncryption")}
                checked={mode === ENCRYPT_MODE.NO_ENSCRYPT}
                onClick={() => setMode(ENCRYPT_MODE.NO_ENSCRYPT)}
              />

              <TagOption
                content={translate("wallet.encryption")}
                checked={mode === ENCRYPT_MODE.ENCRYPT}
                onClick={() => setMode(ENCRYPT_MODE.ENCRYPT)}
              />
            </div>

            {mode === ENCRYPT_MODE.ENCRYPT && (
              <Form.Item
                label={`${translate("wallet.encryptKey")}:`}
                name="encryptKey"
              >
                <PasswordInput
                  name="encryptKey"
                  placeholder={`${translate("wallet.enterEncryptKey")}`}
                  extendClass="encryptKey"
                  onChange={(value) => {
                    setEncryptKey(value);
                    setIsEncryptKeyTouched(true);
                  }}
                  initialValue={hasEncryptKey ? "•" : ""}
                  shouldHideValue={true}
                />
              </Form.Item>
            )}
          </Fragment>
        )}

        {activeTab === TAB.SETTING && (
          <CommonSetting hideTimeout={true} hideRetry={true} />
        )}

        {activeTab === TAB.SKIP && (
          <SkipSetting form={form} setIsSkip={setIsSkip} isSkip={isSkip} />
        )}
      </Form>

      <Row justify="end">
        <Button
          onClick={onCloseModal}
          style={{ marginRight: "var(--margin-right)" }}
        >
          {translate("cancel")}
        </Button>
        <Button onClick={onSubmit} type="primary">
          {translate("button.update")}
        </Button>
      </Row>
    </Wrapper>
  );
};

export default connect(
  (state: RootState) => ({
    selectedResourceGroup: state?.ResourceGroup?.selectedResourceGroup,
    listResourceGroup: state?.ResourceGroup?.listResourceGroup,
  }),
  { actSaveSelectedResourceGroup },
)(SelectResource);
