import { Fragment, useEffect, useState, useMemo } from "react";
import { Tabs, Form, Input, Row, Button, Tooltip, Alert } from "antd";
import { ISelectChainNodeConfig, ISelectChainOption } from "@/electron/type";
import { DEFAULT_TIMEOUT, NODE_ACTION } from "@/electron/simulator/constant";
import { CHAIN_TYPE, SELECT_CHAIN_OUTPUT } from "@/electron/constant";
import { NODE_STATUS } from "@/electron/constant";
import { PlusIcon } from "@/component/Icon";
import { Code } from "@/component";
import { useTranslation } from "@/hook";
import { updateItemInList, deleteItemInList } from "@/service/util";
import CommonSetting from "../CommonSetting";
import SkipSetting from "../SkipSetting";
import { Wrapper } from "./style";
import { TAB_NAME_EN, TAB } from "../util";
import ChainOption from "./ChainOption";
import { FormLabelWrapper } from "../style";
import WorkflowVariable from "../../WorkflowVariable";

type Props = {
  onCloseModal: () => any;
  onSaveNodeConfig: (config: ISelectChainNodeConfig) => void;
  config: ISelectChainNodeConfig;
  isModalOpen: boolean;
};

const SelectChain = (props: Props) => {
  const { translate, locale } = useTranslation();
  const { onCloseModal, onSaveNodeConfig, config, isModalOpen } = props;

  const [activeTab, setActiveTab] = useState(TAB.DETAIL);
  const [isSkip, setIsSkip] = useState(false);
  const [listChainOption, setListChainOption] = useState<ISelectChainOption[]>(
    [],
  );
  const [form] = Form.useForm();

  const TAB_NAME = useMemo(() => {
    return TAB_NAME_EN;
  }, [locale]);

  useEffect(() => {
    form.setFieldsValue({
      name: config?.name,
      sleep: config?.sleep,
      onSuccess: config?.onSuccess || NODE_ACTION.CONTINUE_RUN,
      onError: config?.onError || NODE_ACTION.PAUSE_THREAD,
      timeout: config?.timeout || DEFAULT_TIMEOUT / 1000,
      leftSide: config?.skipSetting?.leftSide,
      condition: config?.skipSetting?.condition,
      rightSide: config?.skipSetting?.rightSide,
      alertTelegramWhenError: config?.alertTelegramWhenError,
      walletAddress: config?.walletAddress,
      maxConcurrency: config?.maxConcurrency || 0,
    });
    setActiveTab(TAB.DETAIL);
    setIsSkip(Boolean(config?.skipSetting?.isSkip));
    setListChainOption(
      config?.listOption?.length > 0
        ? config?.listOption
        : [
            {
              tokenName: "",
              tokenAddress: "",
              minimumAmount: "0",
              chainType: CHAIN_TYPE.EVM,
              nodeEndpointGroupId: null,
              chainName: "",
            },
          ],
    );
  }, [isModalOpen, config, form]);

  const onChange = (key: string) => {
    setActiveTab(key);
  };

  const onSubmit = async () => {
    try {
      const {
        sleep,
        name,
        onSuccess,
        timeout,
        onError,
        leftSide,
        condition,
        rightSide,
        alertTelegramWhenError,
        walletAddress,
        maxConcurrency,
      } = await form?.validateFields([
        "sleep",
        "name",
        "timeout",
        "onSuccess",
        "onError",
        "leftSide",
        "condition",
        "rightSide",
        "alertTelegramWhenError",
        "walletAddress",
        "maxConcurrency",
      ]);
      onSaveNodeConfig({
        sleep,
        name,
        timeout,
        status: NODE_STATUS.RUN,
        onError,
        onSuccess,
        skipSetting: {
          leftSide,
          rightSide,
          condition,
          isSkip,
        },
        alertTelegramWhenError,
        listOption: listChainOption?.filter(
          (option: ISelectChainOption) =>
            option?.tokenName &&
            option?.tokenAddress &&
            option?.chainType &&
            option?.nodeEndpointGroupId !== null,
        ),
        walletAddress,
        maxConcurrency,
      });
      onCloseModal();
    } catch {}
  };

  const onChangeChainOption = (
    tokenOption: ISelectChainOption,
    index: number,
  ) => {
    setListChainOption(updateItemInList(index, listChainOption, tokenOption));
  };

  const onAddTokenOption = () => {
    setListChainOption([
      ...listChainOption,
      {
        tokenName: "",
        tokenAddress: "",
        minimumAmount: "0",
        chainType: CHAIN_TYPE.EVM,
        nodeEndpointGroupId: null,
        chainName: "",
      },
    ]);
  };

  const onRemoveChainOption = (index: number) => {
    setListChainOption(deleteItemInList(index, listChainOption));
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
              label={
                <FormLabelWrapper>
                  <span className="text">{`${translate(
                    "workflow.walletAddress",
                  )}:`}</span>
                  <WorkflowVariable form={form} fieldName="walletAddress" />
                </FormLabelWrapper>
              }
              name="walletAddress"
              rules={[
                {
                  required: true,
                  message: translate("form.requiredField"),
                },
              ]}
            >
              <Input
                placeholder={translate("workflow.walletAddressPlaceholder")}
                className="custom-input"
                size="large"
              />
            </Form.Item>

            <Form.Item label={`${translate("tokenList")}:`}>
              <Fragment>
                <Alert
                  title={
                    <span>
                      <span style={{ marginLeft: "0.5rem" }}>
                        {translate("workflow.selectChainHelper1")}:
                      </span>
                      <br />
                      <Code
                        text={SELECT_CHAIN_OUTPUT.SELECTED_CHAIN_NAME}
                        isWithCopy={true}
                        style={{ float: "left" }}
                      />
                      <Code
                        text={SELECT_CHAIN_OUTPUT.SELECTED_CHAIN_TOKEN_NAME}
                        isWithCopy={true}
                        style={{ float: "left" }}
                      />
                      <Code
                        text={SELECT_CHAIN_OUTPUT.SELECTED_CHAIN_TOKEN_ADDRESS}
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

                <div
                  style={{
                    paddingRight: "1rem",
                    maxHeight: "40rem",
                    overflowY: "scroll",
                  }}
                >
                  {listChainOption?.map(
                    (chainOption: ISelectChainOption, index: number) => (
                      <ChainOption
                        key={index}
                        onChangeChainOption={onChangeChainOption}
                        onRemoveChainOption={onRemoveChainOption}
                        index={index}
                        chainOption={chainOption}
                      />
                    ),
                  )}
                </div>
              </Fragment>
            </Form.Item>

            <div className="add">
              <Tooltip title={translate("add")}>
                <div className="icon" onClick={onAddTokenOption}>
                  <PlusIcon />
                </div>
              </Tooltip>
            </div>
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

export default SelectChain;
