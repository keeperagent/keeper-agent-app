import { Fragment, useEffect, useState, useMemo } from "react";
import { Tabs, Form, Input, Row, Button, Alert } from "antd";
import { IRabbyAddNetworkNodeConfig } from "@/electron/type";
import {
  DEFAULT_EXTENSION_TIMEOUT,
  NODE_ACTION,
} from "@/electron/simulator/constant";
import TagOption from "@/component/TagOption";
import { useTranslation } from "@/hook";
import { RABBY_ADD_NETWORK_TYPE } from "@/electron/constant";
import HoverLink from "@/component/HoverLink";
import { Wrapper } from "./style";
import { TAB_NAME_EN, TAB } from "../util";
import CommonSetting from "../CommonSetting";
import SkipSetting from "../SkipSetting";

type Props = {
  onCloseModal: () => any;
  onSaveNodeConfig: (config: IRabbyAddNetworkNodeConfig) => void;
  config: IRabbyAddNetworkNodeConfig;
  isModalOpen: boolean;
};

const RabbyAddNetwork = (props: Props) => {
  const { translate, locale } = useTranslation();
  const { onCloseModal, onSaveNodeConfig, config, isModalOpen } = props;

  const [activeTab, setActiveTab] = useState(TAB.DETAIL);
  const [mode, setMode] = useState(RABBY_ADD_NETWORK_TYPE.FROM_CHAINLIST);
  const [isSkip, setIsSkip] = useState(false);
  const [form] = Form.useForm();

  const TAB_NAME = useMemo(() => {
    return TAB_NAME_EN;
  }, [locale]);

  useEffect(() => {
    form.setFieldsValue({
      name: config?.name,
      sleep: config?.sleep,
      timeout: config?.timeout || DEFAULT_EXTENSION_TIMEOUT / 1000,
      onSuccess: config?.onSuccess || NODE_ACTION.CONTINUE_RUN,
      onError: config?.onError || NODE_ACTION.PAUSE_THREAD,
      leftSide: config?.skipSetting?.leftSide,
      condition: config?.skipSetting?.condition,
      rightSide: config?.skipSetting?.rightSide,
      alertTelegramWhenError: config?.alertTelegramWhenError,
      chainId: config?.chainId,
      networkName: config?.networkName,
      rpcUrl: config?.rpcUrl,
      symbol: config?.symbol,
      blockExplorer: config?.blockExplorer,
      retry: config?.retry || 0,
    });
    setMode(config?.mode || RABBY_ADD_NETWORK_TYPE.FROM_CHAINLIST);
    setActiveTab(TAB.DETAIL);
    setIsSkip(Boolean(config?.skipSetting?.isSkip));
  }, [isModalOpen, config, form]);

  const onChange = (key: string) => {
    setActiveTab(key);
  };

  const onSubmit = async () => {
    try {
      const {
        sleep,
        timeout,
        name,
        onError,
        onSuccess,
        leftSide,
        condition,
        rightSide,
        alertTelegramWhenError,
        chainId,
        networkName,
        rpcUrl,
        symbol,
        blockExplorer,
        retry,
      } = await form?.validateFields([
        "sleep",
        "timeout",
        "name",
        "onSuccess",
        "onError",
        "leftSide",
        "condition",
        "rightSide",
        "alertTelegramWhenError",
        "chainId",
        "networkName",
        "rpcUrl",
        "symbol",
        "blockExplorer",
        "retry",
      ]);
      onSaveNodeConfig({
        sleep,
        timeout,
        name,
        onError,
        onSuccess,
        skipSetting: {
          leftSide,
          rightSide,
          condition,
          isSkip,
        },
        alertTelegramWhenError,
        chainId,
        networkName,
        rpcUrl,
        symbol,
        blockExplorer,
        mode,
        retry,
      });
      onCloseModal();
    } catch {}
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
            <div className="mode">
              <TagOption
                content={translate("workflow.fromChainList")}
                checked={mode === RABBY_ADD_NETWORK_TYPE.FROM_CHAINLIST}
                onClick={() => setMode(RABBY_ADD_NETWORK_TYPE.FROM_CHAINLIST)}
                style={{ fontSize: "1.1rem" }}
              />

              <TagOption
                content={translate("workflow.manually")}
                checked={mode === RABBY_ADD_NETWORK_TYPE.MANUALY}
                onClick={() => setMode(RABBY_ADD_NETWORK_TYPE.MANUALY)}
                style={{ fontSize: "1.1rem" }}
              />
            </div>

            <Form.Item style={{ marginTop: "1.5rem" }}>
              <Alert
                title={
                  <HoverLink
                    prefixString={translate("workflow.youCanGetChainConfig")}
                    postString=""
                    textLink={translate("here")}
                    link="https://chainlist.org?search=80084"
                    isOpenNewTab={true}
                  />
                }
                type="info"
                showIcon
              />
            </Form.Item>

            <Form.Item
              label="Chain ID:"
              name="chainId"
              rules={[
                {
                  required: true,
                  message: translate("form.requiredField"),
                },
              ]}
            >
              <Input
                placeholder={translate("workflow.exampleChainId")}
                className="custom-input"
                size="large"
              />
            </Form.Item>

            {mode === RABBY_ADD_NETWORK_TYPE.MANUALY && (
              <Fragment>
                <Form.Item
                  label={`${translate("workflow.networkName")}:`}
                  name="networkName"
                >
                  <Input
                    placeholder={translate("workflow.exampleNetworkName")}
                    className="custom-input"
                    size="large"
                  />
                </Form.Item>

                <Form.Item label="RPC URL:" name="rpcUrl">
                  <Input
                    placeholder={translate("workflow.exampleRpcUrl")}
                    className="custom-input"
                    size="large"
                  />
                </Form.Item>

                <Form.Item label="Currency symbol:" name="symbol">
                  <Input
                    placeholder={translate("workflow.exampleCurrency")}
                    className="custom-input"
                    size="large"
                  />
                </Form.Item>

                <Form.Item label="Block explorer URL:" name="blockExplorer">
                  <Input
                    placeholder={translate("workflow.exampleBlockExplorer")}
                    className="custom-input"
                    size="large"
                  />
                </Form.Item>
              </Fragment>
            )}
          </Fragment>
        )}

        {activeTab === TAB.SETTING && <CommonSetting />}

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

export default RabbyAddNetwork;
