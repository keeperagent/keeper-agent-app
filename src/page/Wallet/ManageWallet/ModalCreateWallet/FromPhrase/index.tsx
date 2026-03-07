import { connect } from "react-redux";
import { useState, useEffect, useRef } from "react";
import { Form, Input, Button, Select, InputNumber, Progress } from "antd";
import _ from "lodash";
import { RootState } from "@/redux/store";
import { actSaveSelectedWalletGroup } from "@/redux/walletGroup";
import { IWalletGroup } from "@/electron/type";
import { TagOption } from "@/component";
import { PasswordInput } from "@/component/Input";
import {
  useGenerateWalletFromPhrase,
  useGetListWalletGroup,
  useTranslation,
} from "@/hook";
import { EMPTY_STRING } from "@/config/constant";
import { CHAIN_TYPE, PORTFOLIO_APP } from "@/electron/constant";
import { getChainConfig } from "@/service/util";
import { FormWrapper, OptionWrapper, ChainWrapper } from "./style";

const { Option } = Select;
const { TextArea } = Input;
let searchWalletGroupTimeOut: any = null;
const ENCRYPT_MODE = {
  NO_ENSCRYPT: "NO_ENSCRYPT",
  ENCRYPT: "ENCRYPT",
};

type IFromPhraseProps = {
  listWalletGroup: IWalletGroup[];
  selectedWalletGroup: IWalletGroup | null;
  setModalOpen: (value: boolean) => void;
  setShouldRefetch: (value: boolean) => void;
  isModalOpen: boolean;
  actSaveSelectedWalletGroup: (value: IWalletGroup | null) => void;
};

const FromPhrase = (props: IFromPhraseProps) => {
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
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState(ENCRYPT_MODE.NO_ENSCRYPT);
  const { getListWalletGroup } = useGetListWalletGroup();

  const { generateWalletFromPhrase, loading, isSuccess, count, left } =
    useGenerateWalletFromPhrase();

  useEffect(() => {
    getListWalletGroup({
      page: 1,
      pageSize: 10000,
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
    if (!loading && isSuccess) {
      setModalOpen(false);
      setTimeout(() => {
        setRunning(false);
      }, 1000);

      const { groupId } = form.getFieldsValue(["groupId"]);
      props?.actSaveSelectedWalletGroup(
        _.find(listWalletGroup, { id: groupId }) || null
      );
      setShouldRefetch(true);
    }
  }, [loading, isSuccess]);

  useEffect(() => {
    if (isModalOpen && !searchWalletGroupTimeOut) {
      setTimeout(() => {
        inputRef?.current?.focus();
      }, 100);
    }

    form.setFieldsValue({
      groupId: selectedWalletGroup?.id,
      total: 100,
      phrase: null,
      encryptKey: null,
    });
  }, [isModalOpen]);

  const onSubmitForm = async () => {
    try {
      const { total, groupId, phrase, encryptKey, chainType } =
        await form.validateFields([
          "total",
          "groupId",
          "phrase",
          "encryptKey",
          "chainType",
        ]);
      generateWalletFromPhrase({
        total,
        groupId,
        phrase,
        encryptKey,
        chainType,
      });
      setRunning(true);
    } catch {}
  };

  const onSearchWalletGroup = (text: string) => {
    if (searchWalletGroupTimeOut) {
      clearTimeout(searchWalletGroupTimeOut);
    }
    searchWalletGroupTimeOut = setTimeout(() => {
      getListWalletGroup({ page: 1, pageSize: 10000, searchText: text });
    }, 200);
  };

  return (
    <FormWrapper>
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
            style={{ width: "100%" }}
            size="large"
            min={1}
            max={10000}
          />
        </Form.Item>

        <Form.Item
          label={`${translate("wallet.phrase")}:`}
          name="phrase"
          rules={[
            {
              required: true,
              message: translate("form.requiredField"),
            },
          ]}
        >
          <TextArea
            placeholder={translate("wallet.enterPhrasePlaceholder")}
            rows={3}
            className="custom-input"
            // @ts-ignore
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
            label={`${translate("wallet.secretKey")}`}
            name="encryptKey"
          >
            <PasswordInput
              name="encryptKey"
              placeholder={`${translate("wallet.enterSecretKey")}`}
              extendClass="encryptKey-from-phrase"
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
    </FormWrapper>
  );
};

export default connect(
  (state: RootState) => ({
    listWalletGroup: state?.WalletGroup?.listWalletGroup,
    selectedWalletGroup: state?.WalletGroup?.selectedWalletGroup,
  }),
  { actSaveSelectedWalletGroup }
)(FromPhrase);
