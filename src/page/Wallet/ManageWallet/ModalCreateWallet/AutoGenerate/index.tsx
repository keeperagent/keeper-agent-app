import { connect } from "react-redux";
import { useState, useEffect, useRef } from "react";
import { Form, Button, Select, InputNumber, Progress } from "antd";
import _ from "lodash";
import { RootState } from "@/redux/store";
import { TagOption } from "@/component";
import { actSaveSelectedWalletGroup } from "@/redux/walletGroup";
import { IWalletGroup } from "@/electron/type";
import {
  useGenerateRandomWallet,
  useGetListWalletGroup,
  useTranslation,
} from "@/hook";
import { PasswordInput } from "@/component/Input";
import { EMPTY_STRING } from "@/config/constant";
import { CHAIN_TYPE, PORTFOLIO_APP } from "@/electron/constant";
import { getChainConfig } from "@/service/util";
import { AutoGenerateWrapper, OptionWrapper, ChainWrapper } from "./style";

const { Option } = Select;

let searchWalletGroupTimeOut: any = null;
const ENCRYPT_MODE = {
  NO_ENSCRYPT: "NO_ENSCRYPT",
  ENCRYPT: "ENCRYPT",
};

type IAutoGenerateProps = {
  listWalletGroup: IWalletGroup[];
  selectedWalletGroup: IWalletGroup | null;
  setModalOpen: (value: boolean) => void;
  setShouldRefetch: (value: boolean) => void;
  isModalOpen: boolean;
  actSaveSelectedWalletGroup: (value: IWalletGroup | null) => void;
};

let interval: any = null;

const AutoGenerate = (props: IAutoGenerateProps) => {
  const { translate, locale } = useTranslation();
  const {
    listWalletGroup,
    selectedWalletGroup,
    setModalOpen,
    isModalOpen,
    setShouldRefetch,
  } = props;
  const [isRunning, setRunning] = useState(false);
  const [form] = Form.useForm();
  const inputRef = useRef<any>(null);
  const [mode, setMode] = useState(ENCRYPT_MODE.NO_ENSCRYPT);
  const { getListWalletGroup } = useGetListWalletGroup();

  const { generateRandomWallet, loading, isSuccess, count, left } =
    useGenerateRandomWallet();

  useEffect(() => {
    getListWalletGroup({
      page: 1,
      pageSize: 1000,
    });

    return () => {
      searchWalletGroupTimeOut = null;
    };
  }, []);

  useEffect(() => {
    const { chainType } = form.getFieldsValue(["chainType"]);
    if (chainType) {
      return;
    }

    if (selectedWalletGroup?.portfolioApp === PORTFOLIO_APP.SOL_SCAN) {
      form?.setFieldValue("chainType", CHAIN_TYPE.SOLANA);
    } else if (selectedWalletGroup?.portfolioApp === PORTFOLIO_APP.SUI_VISION) {
      form?.setFieldValue("chainType", CHAIN_TYPE.SUI);
    } else if (
      selectedWalletGroup?.portfolioApp === PORTFOLIO_APP.APTOS_EXPLORER
    ) {
      form?.setFieldValue("chainType", CHAIN_TYPE.APTOS);
    } else {
      form?.setFieldValue("chainType", CHAIN_TYPE.EVM);
    }
  }, [selectedWalletGroup]);

  useEffect(() => {
    if (isModalOpen && !searchWalletGroupTimeOut) {
      setTimeout(() => {
        inputRef?.current?.focus();
      }, 100);
    }

    form.setFieldsValue({
      groupId: selectedWalletGroup?.id,
      total: 100,
      encryptKey: null,
    });
  }, [isModalOpen, selectedWalletGroup]);

  useEffect(() => {
    if (!loading && isSuccess) {
      setModalOpen(false);
      setTimeout(() => {
        setRunning(false);
      }, 1000);

      const { groupId } = form.getFieldsValue(["groupId"]);
      props?.actSaveSelectedWalletGroup(
        _.find(listWalletGroup, { id: groupId }) || null,
      );

      setShouldRefetch(true);
    }
  }, [loading, isSuccess]);

  useEffect(() => {
    if (isRunning) {
      interval = setInterval(() => {
        setShouldRefetch(true);
      }, 5000);
    } else {
      clearInterval(interval);
    }
  }, [isRunning]);

  const onSubmitForm = async () => {
    try {
      const { total, groupId, encryptKey, chainType } =
        await form.validateFields([
          "total",
          "groupId",
          "encryptKey",
          "chainType",
        ]);
      generateRandomWallet({ total, groupId, encryptKey, chainType });
      setRunning(true);
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
    <AutoGenerateWrapper>
      <Form
        layout="vertical"
        form={form}
        style={{ marginTop: "2rem", width: "100%" }}
      >
        <Form.Item
          label={translate("wallet.walletGroup")}
          name="groupId"
          rules={[
            {
              required: true,
              message: translate("form.requiredField"),
            },
          ]}
        >
          <Select
            placeholder={translate("wallet.selectedWalletGroup")}
            size="large"
            className="custom-select"
            allowClear={true}
            showSearch
            onSearch={onSearchWalletGroup}
            filterOption={false}
            optionLabelProp="label"
          >
            {listWalletGroup?.map((group: IWalletGroup) => (
              <Option key={group?.id} value={group?.id} label={group?.name}>
                <OptionWrapper>
                  <div className="name">{group?.name}</div>
                  <div className="description">
                    {group?.note || EMPTY_STRING}
                  </div>
                </OptionWrapper>
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label={`${translate("wallet.blockchainType")}:`}
          name="chainType"
          rules={[
            {
              required: true,
              message: translate("form.requiredField"),
            },
          ]}
        >
          <Select
            placeholder={translate("wallet.egBlockchainType")}
            size="large"
            className="custom-select"
          >
            {getChainConfig(locale)?.map((config: any) => {
              return (
                <Option key={config?.key}>
                  <ChainWrapper>
                    <div className="icon">
                      <img src={config?.image} alt="" />
                    </div>
                    <span className="text">{config?.name}</span>
                  </ChainWrapper>
                </Option>
              );
            })}
          </Select>
        </Form.Item>

        <Form.Item
          label={`${translate("wallet.quantity")}:`}
          name="total"
          rules={[
            {
              required: true,
              message: translate("form.requiredField"),
            },
          ]}
        >
          <InputNumber
            placeholder={`${translate("wallet.quantityCreate")}:`}
            className="custom-input-number"
            size="large"
            style={{ width: "100%" }}
            min={1}
            max={10000}
            ref={inputRef}
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
            label={`${translate("wallet.encryptKey")}`}
            name="encryptKey"
          >
            <PasswordInput
              name="encryptKey"
              placeholder={`${translate("wallet.enterEncryptKey")}`}
              extendClass="encryptKey-auto-generate"
            />
          </Form.Item>
        )}

        {isRunning && count !== count + left && (
          <Progress
            percent={Math.round((count * 100) / (count + left))}
            strokeColor="var(--color-success)"
            trailColor="var(--background-success)"
            strokeLinecap="butt"
            status="active"
            style={{ marginBottom: "2rem" }}
          />
        )}
      </Form>

      <Button type="primary" onClick={onSubmitForm} loading={isRunning}>
        {translate("wallet.startCreate")}
      </Button>
    </AutoGenerateWrapper>
  );
};

export default connect(
  (state: RootState) => ({
    listWalletGroup: state?.WalletGroup?.listWalletGroup,
    selectedWalletGroup: state?.WalletGroup?.selectedWalletGroup,
  }),
  { actSaveSelectedWalletGroup },
)(AutoGenerate);
