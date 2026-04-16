import { Fragment, useEffect, useState, useMemo } from "react";
import { Tabs, Form, Input, Row, Button, Select } from "antd";
import _ from "lodash";
import { connect } from "react-redux";
import CodeEditor from "@/component/CodeEditor";
import { RootState } from "@/redux/store";
import { NODE_ACTION } from "@/electron/simulator/constant";
import {
  ISaveResourceNodeConfig,
  IResourceGroup,
  ColumnConfig,
} from "@/electron/type";
import { TagOption } from "@/component";
import { EMPTY_STRING } from "@/config/constant";
import { ENCRYPT_MODE, NODE_STATUS } from "@/electron/constant";
import { PasswordInput } from "@/component/Input";
import {
  useTranslation,
  useGetListResourceGroup,
  useSaveNodeSecret,
  useGetNodeSecret,
} from "@/hook";
import { getResourceColumn } from "@/service/tableView";
import { actSaveSelectedResourceGroup } from "@/redux/resourceGroup";
import { Wrapper, OptionWrapper } from "./style";
import { TAB_NAME_EN, TAB } from "@/component/Workflow/ModalNodeConfig/common/util";
import WorkflowVariable from "@/component/Workflow/WorkflowVariable";
import { FormLabelWrapper } from "@/component/Workflow/ModalNodeConfig/common/sharedStyle";
import CommonSetting from "@/component/Workflow/ModalNodeConfig/common/CommonSetting";
import SkipSetting from "@/component/Workflow/ModalNodeConfig/common/SkipSetting";

const { Option } = Select;
let searchGroupTimeOut: any = null;

type Props = {
  onCloseModal: () => any;
  onSaveNodeConfig: (config: ISaveResourceNodeConfig) => void;
  config: ISaveResourceNodeConfig;
  isModalOpen: boolean;
  listResourceGroup: IResourceGroup[];
  selectedResourceGroup: IResourceGroup | null;
  actSaveSelectedResourceGroup: (value: IResourceGroup | null) => void;
  nodeId: string;
  workflowId: number;
};

const SaveResource = (props: Props) => {
  const { translate, locale } = useTranslation();
  const {
    onCloseModal,
    onSaveNodeConfig,
    config,
    isModalOpen,
    listResourceGroup,
    selectedResourceGroup,
    nodeId,
    workflowId,
  } = props;

  const defaultBatchValue = "[]";
  const [activeTab, setActiveTab] = useState(TAB.DETAIL);
  const [isSkip, setIsSkip] = useState(false);
  const [encryptKey, setEncryptKey] = useState("");
  const [isEncryptKeyTouched, setIsEncryptKeyTouched] = useState(false);
  const [hasEncryptKey, setHasEncryptKey] = useState(false);
  const [form] = Form.useForm();
  const [mode, setMode] = useState<ENCRYPT_MODE>(ENCRYPT_MODE.NO_ENSCRYPT);
  const [batchValue, setBatchValue] = useState(defaultBatchValue);
  const [isInsertMultipleResource, setIsInsertMultipleResource] =
    useState(false);
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

  useEffect(() => {
    try {
      const currentBatchValue = JSON.parse(batchValue);
      if (Array.isArray(currentBatchValue) && currentBatchValue?.length === 0) {
        const defaultValue: any = {};
        listColumn?.forEach((column: ColumnConfig) => {
          if (column?.variable) {
            defaultValue[column?.variable] = "";
          }
        });
        currentBatchValue.push(defaultValue);
        setBatchValue(JSON.stringify(currentBatchValue, null, 2));
      }
    } catch {}
  }, [listColumn, batchValue]);

  const listFieldName = useMemo(() => {
    return listColumn?.map((column: ColumnConfig) => column?.dataIndex!);
  }, [listColumn]);

  const TAB_NAME = useMemo(() => {
    return TAB_NAME_EN;
  }, [locale]);

  useEffect(() => {
    form.setFieldsValue({
      name: config?.name,
      sleep: config?.sleep,
      col1: config?.col1,
      col2: config?.col2,
      col3: config?.col3,
      col4: config?.col4,
      col5: config?.col5,
      col6: config?.col6,
      col7: config?.col7,
      col8: config?.col8,
      col9: config?.col9,
      col10: config?.col10,
      resourceGroup: config?.resourceGroup,
      encryptKey: "", // set value show on UI is empty for security purpose
      onSuccess: config?.onSuccess || NODE_ACTION.CONTINUE_RUN,
      onError: config?.onError || NODE_ACTION.PAUSE_THREAD,
      leftSide: config?.skipSetting?.leftSide,
      condition: config?.skipSetting?.condition,
      rightSide: config?.skipSetting?.rightSide,
      alertTelegramWhenError: config?.alertTelegramWhenError,
      maxConcurrency: config?.maxConcurrency || 0,
    });
    setActiveTab(TAB.DETAIL);
    setMode((config?.mode as ENCRYPT_MODE) || ENCRYPT_MODE.NO_ENSCRYPT);
    setIsSkip(Boolean(config?.skipSetting?.isSkip));
    setBatchValue(config?.batchValue || defaultBatchValue);
    setIsInsertMultipleResource(Boolean(config?.isInsertMultipleResource));

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
    props?.actSaveSelectedResourceGroup(
      _.find(listResourceGroup, { id: config?.resourceGroup }) || null,
    );
  }, [listResourceGroup, config?.resourceGroup]);

  const onChange = (key: string) => {
    setActiveTab(key);
  };

  const onSubmit = async () => {
    try {
      const {
        sleep,
        name,
        resourceGroup,
        onError,
        onSuccess,
        leftSide,
        condition,
        rightSide,
        alertTelegramWhenError,
        maxConcurrency,
        ...rest
      } = await form?.validateFields([
        "sleep",
        "name",
        "resourceGroup",
        "onSuccess",
        "onError",
        "leftSide",
        "condition",
        "rightSide",
        "alertTelegramWhenError",
        "maxConcurrency",
        ...listFieldName,
      ]);
      if (workflowId && nodeId && isEncryptKeyTouched) {
        await saveNodeSecret(workflowId, nodeId, encryptKey);
      }
      onSaveNodeConfig({
        sleep,
        name,
        status: NODE_STATUS.RUN,
        resourceGroup,
        encryptKey: "", // Never stored in config/Redux; key lives only in NodeSecret table.
        mode,
        onError,
        onSuccess,
        isInsertMultipleResource,
        batchValue,
        skipSetting: {
          leftSide,
          rightSide,
          condition,
          isSkip,
        },
        alertTelegramWhenError,
        retry: 0,
        ...rest,
        maxConcurrency,
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
    props?.actSaveSelectedResourceGroup(
      _.find(listResourceGroup, { id: Number(value) }) || null,
    );
  };

  const handleEditorChange = (value?: string) => {
    setBatchValue(value || "");
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
            <Form.Item
              label={`${translate("workflow.saveResourceInto")}:`}
              name="resourceGroup"
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

            {selectedResourceGroup && (
              <div className="encript">
                <TagOption
                  content={translate("workflow.singleResource")}
                  checked={!isInsertMultipleResource}
                  onClick={() => setIsInsertMultipleResource(false)}
                />

                <TagOption
                  content={translate("workflow.multipleResource")}
                  checked={isInsertMultipleResource}
                  onClick={() => setIsInsertMultipleResource(true)}
                />
              </div>
            )}

            {!isInsertMultipleResource &&
              listColumn?.map((column: ColumnConfig, index: number) => (
                <Form.Item
                  label={
                    <FormLabelWrapper>
                      <span className="text">{column?.title}:</span>
                      <WorkflowVariable
                        form={form}
                        fieldName={column?.dataIndex!}
                      />
                    </FormLabelWrapper>
                  }
                  name={column?.dataIndex!}
                  key={index}
                >
                  <Input
                    placeholder={`${translate("resource.enter")} ${
                      column.title
                    }`}
                    className="custom-input"
                    size="large"
                  />
                </Form.Item>
              ))}

            {isInsertMultipleResource && (
              <Form.Item
                label={
                  <FormLabelWrapper>
                    <span className="text">
                      {translate("workflow.listResourceInJson")}:
                    </span>
                    <WorkflowVariable useJavascriptVariable={true} />
                  </FormLabelWrapper>
                }
              >
                <CodeEditor
                  height="30rem"
                  language="json"
                  value={batchValue}
                  onChange={handleEditorChange}
                  className="code-editor"
                  fontSize={14}
                />
              </Form.Item>
            )}

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
)(SaveResource);
