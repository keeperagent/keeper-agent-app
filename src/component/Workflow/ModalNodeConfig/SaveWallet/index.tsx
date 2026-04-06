import { Fragment, useEffect, useState, useMemo } from "react";
import { Tabs, Form, Input, Row, Button, Select } from "antd";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { NODE_ACTION } from "@/electron/simulator/constant";
import { ISaveWalletNodeConfig, IWalletGroup } from "@/electron/type";
import { TagOption } from "@/component";
import { EMPTY_STRING } from "@/config/constant";
import { ENCRYPT_MODE, NODE_STATUS } from "@/electron/constant";
import { PasswordInput } from "@/component/Input";
import {
  useTranslation,
  useGetListWalletGroup,
  useSaveNodeSecret,
  useGetNodeSecret,
} from "@/hook";
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
  onSaveNodeConfig: (config: ISaveWalletNodeConfig) => void;
  config: ISaveWalletNodeConfig;
  isModalOpen: boolean;
  listWalletGroup: IWalletGroup[];
  nodeId: string;
  workflowId: number;
};

const SaveWallet = (props: Props) => {
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
  const [encryptKey, setEncryptKey] = useState("");
  const [hasEncryptKey, setHasEncryptKey] = useState(false);
  const [form] = Form.useForm();
  const [mode, setMode] = useState(ENCRYPT_MODE.NO_ENSCRYPT);
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
      address: config?.address,
      phrase: config?.phrase,
      privateKey: config?.privateKey,
      encryptKey: "", // set value show on UI is empty for security purpose
      walletGroup: config?.walletGroup,
      onSuccess: config?.onSuccess || NODE_ACTION.CONTINUE_RUN,
      onError: config?.onError || NODE_ACTION.PAUSE_THREAD,
      leftSide: config?.skipSetting?.leftSide,
      condition: config?.skipSetting?.condition,
      rightSide: config?.skipSetting?.rightSide,
      alertTelegramWhenError: config?.alertTelegramWhenError,
    });
    setActiveTab(TAB.DETAIL);
    setMode(config?.mode || ENCRYPT_MODE.NO_ENSCRYPT);
    setIsSkip(Boolean(config?.skipSetting?.isSkip));

    setEncryptKey("");
    setHasEncryptKey(false);
    if (isModalOpen && workflowId && nodeId) {
      getNodeSecret(workflowId, nodeId).then((hasKey) => {
        setHasEncryptKey(hasKey);
      });
    }
  }, [isModalOpen, config, form]);

  const onChange = (key: string) => {
    setActiveTab(key);
  };

  const onSubmit = async () => {
    try {
      const {
        address,
        phrase,
        privateKey,
        sleep,
        name,
        walletGroup,
        onError,
        onSuccess,
        leftSide,
        condition,
        rightSide,
        alertTelegramWhenError,
      } = await form?.validateFields([
        "sleep",
        "name",
        "address",
        "phrase",
        "privateKey",
        "walletGroup",
        "onSuccess",
        "onError",
        "leftSide",
        "condition",
        "rightSide",
        "alertTelegramWhenError",
      ]);
      if (
        workflowId &&
        nodeId &&
        encryptKey !== undefined &&
        encryptKey !== null
      ) {
        await saveNodeSecret(workflowId, nodeId, encryptKey);
      }
      onSaveNodeConfig({
        sleep,
        name,
        status: NODE_STATUS.RUN,
        address,
        phrase,
        privateKey,
        walletGroup,
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
            <Form.Item
              label={`${translate("workflow.saveWalletInto")}:`}
              name="walletGroup"
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
              label={
                <FormLabelWrapper>
                  <span className="text">
                    {translate("workflow.walletAddress")}:
                  </span>
                  <WorkflowVariable form={form} fieldName="address" />
                </FormLabelWrapper>
              }
              name="address"
            >
              <TextArea
                placeholder={translate("workflow.enterWalletAddress")}
                className="custom-input"
                size="large"
                rows={2}
              />
            </Form.Item>

            <Form.Item
              label={
                <FormLabelWrapper>
                  <span className="text">Phrase:</span>
                  <WorkflowVariable form={form} fieldName="phrase" />
                </FormLabelWrapper>
              }
              name="phrase"
            >
              <TextArea
                placeholder={translate("workflow.phrasePlaceholder")}
                className="custom-input"
                size="large"
                rows={2}
              />
            </Form.Item>

            <Form.Item
              label={
                <FormLabelWrapper>
                  <span className="text">Private key:</span>
                  <WorkflowVariable form={form} fieldName="privateKey" />
                </FormLabelWrapper>
              }
              name="privateKey"
            >
              <TextArea
                placeholder={translate("workflow.privateKeyPlaceholder")}
                className="custom-input"
                size="large"
                rows={2}
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
    listWalletGroup: state?.WalletGroup?.listWalletGroup,
  }),
  {},
)(SaveWallet);
