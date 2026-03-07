import { Fragment, useEffect, useState, useMemo } from "react";
import { Tabs, Form, Input, Row, Button, Select, Alert } from "antd";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { NODE_ACTION } from "@/electron/simulator/constant";
import { ISelectWalletNodeConfig, IWalletGroup } from "@/electron/type";
import { EMPTY_STRING } from "@/config/constant";
import {
  ENCRYPT_MODE,
  IS_WALLET_EXIST,
  NODE_STATUS,
} from "@/electron/constant";
import { Code, TagOption } from "@/component";
import { PasswordInput } from "@/component/Input";
import {
  useTranslation,
  useGetListWalletGroup,
  useSaveNodeSecret,
  useGetNodeSecret,
} from "@/hook";
import { WALLET_VARIABLE } from "@/electron/constant";
import { Wrapper, OptionWrapper } from "./style";
import { TAB_NAME_EN, TAB } from "../util";
import WorkflowVariable from "../../WorkflowVariable";
import { FormLabelWrapper } from "../style";
import CommonSetting from "../CommonSetting";
import SkipSetting from "../SkipSetting";

const { TextArea } = Input;
const { Option } = Select;
let searchWalletGroupTimeOut: any = null;

type Props = {
  onCloseModal: () => any;
  onSaveNodeConfig: (config: ISelectWalletNodeConfig) => void;
  config: ISelectWalletNodeConfig;
  isModalOpen: boolean;
  listWalletGroup: IWalletGroup[];
  nodeId: string;
  workflowId: number;
};

const SelectWallet = (props: Props) => {
  const { translate, locale } = useTranslation();
  const {
    onCloseModal,
    onSaveNodeConfig,
    config,
    isModalOpen,
    listWalletGroup,
    nodeId,
    workflowId,
  } = props;

  const [activeTab, setActiveTab] = useState(TAB.DETAIL);
  const [isSkip, setIsSkip] = useState(false);
  const [mode, setMode] = useState(ENCRYPT_MODE.NO_ENSCRYPT);
  const [encryptKey, setEncryptKey] = useState(""); // actual encrypt key — only for display, never stored in Redux
  const [form] = Form.useForm();
  const { getListWalletGroup, loading } = useGetListWalletGroup();
  const { saveNodeSecret } = useSaveNodeSecret();
  const { getNodeSecret } = useGetNodeSecret();

  useEffect(() => {
    getListWalletGroup({
      page: 1,
      pageSize: 1000,
    });
  }, []);

  const TAB_NAME = useMemo(() => {
    return TAB_NAME_EN;
  }, [locale]);

  useEffect(() => {
    form.setFieldsValue({
      name: config?.name,
      sleep: config?.sleep,
      compareValue: config?.compareValue,
      fieldName: config?.fieldName || WALLET_VARIABLE.WALLET_ADDRESS,
      walletGroupId: config?.walletGroupId,
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
    if (isModalOpen && workflowId && nodeId) {
      getNodeSecret(workflowId, nodeId).then((key) => {
        setEncryptKey(key);
      });
    }
  }, [isModalOpen, config, form]);

  const onChange = (key: string) => {
    setActiveTab(key);
  };

  const onSubmit = async () => {
    try {
      const {
        compareValue,
        fieldName,
        walletGroupId,
        sleep,
        name,
        onError,
        onSuccess,
        leftSide,
        condition,
        rightSide,
        alertTelegramWhenError,
      } = await form?.validateFields([
        "sleep",
        "name",
        "compareValue",
        "fieldName",
        "privateKey",
        "walletGroupId",
        "onSuccess",
        "onError",
        "leftSide",
        "condition",
        "rightSide",
        "alertTelegramWhenError",
      ]);
      if (workflowId && nodeId) {
        await saveNodeSecret(workflowId, nodeId, encryptKey || "");
      }
      onSaveNodeConfig({
        sleep,
        name,
        status: NODE_STATUS.RUN,
        compareValue,
        fieldName,
        walletGroupId,
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
      });
      onCloseModal();
    } catch {}
  };

  const onSearchWalletGroup = (text: string) => {
    if (searchWalletGroupTimeOut) {
      clearTimeout(searchWalletGroupTimeOut);
    }
    searchWalletGroupTimeOut = setTimeout(() => {
      getListWalletGroup({ page: 1, pageSize: 1000, searchText: text });
    }, 200);
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
                    {translate("workflow.selectWalletHelper")}:
                  </span>
                  <br />
                  <Code
                    text={IS_WALLET_EXIST}
                    isWithCopy={true}
                    style={{ float: "left", marginTop: "0.5rem" }}
                  />
                  <Code
                    text={WALLET_VARIABLE.WALLET_ADDRESS}
                    isWithCopy={true}
                    style={{ float: "left", marginTop: "0.5rem" }}
                  />
                  <Code
                    text={WALLET_VARIABLE.WALLET_PHRASE}
                    isWithCopy={true}
                    style={{ float: "left", marginTop: "0.5rem" }}
                  />
                  <Code
                    text={WALLET_VARIABLE.WALLET_PRIVATE_KEY}
                    isWithCopy={true}
                    style={{ float: "left", marginTop: "0.5rem" }}
                  />
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
                placeholder={translate("workflow.searchWalletPlaceholder")}
                className="custom-input"
                size="large"
                rows={2}
              />
            </Form.Item>

            <Form.Item
              label={`${translate("workflow.searchFromWalletGroup")}:`}
              name="walletGroupId"
              rules={[
                {
                  required: true,
                  message: translate("form.requiredField"),
                },
              ]}
            >
              <Select
                placeholder={translate("wallet.selectWalletGroup")}
                size="large"
                className="custom-select"
                showSearch
                onSearch={onSearchWalletGroup}
                filterOption={false}
                loading={loading}
                optionLabelProp="label"
              >
                {listWalletGroup?.map((group: IWalletGroup) => (
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
                size="large"
                className="custom-select"
                options={[
                  {
                    value: WALLET_VARIABLE.WALLET_ADDRESS,
                    label: translate("wallet.walletAddress"),
                  },
                  {
                    value: WALLET_VARIABLE.WALLET_PRIVATE_KEY,
                    label: translate("wallet.privateKey"),
                  },
                  {
                    value: WALLET_VARIABLE.WALLET_PHRASE,
                    label: "Seed phrase",
                  },
                ]}
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
                label={`${translate("wallet.secretKey")}:`}
                name="encryptKey"
              >
                <PasswordInput
                  name="encryptKey"
                  placeholder={`${translate("wallet.enterSecretKey")}`}
                  extendClass="encryptKey"
                  onChange={setEncryptKey}
                  initialValue={encryptKey}
                  shouldHideValue={true}
                />
              </Form.Item>
            )}
          </Fragment>
        )}

        {activeTab === TAB.SETTING && <CommonSetting hideTimeout={true} />}

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
    listWalletGroup: state?.WalletGroup?.listWalletGroup,
  }),
  {},
)(SelectWallet);
