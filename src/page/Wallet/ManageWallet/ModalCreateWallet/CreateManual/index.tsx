import { useState, useEffect, useRef } from "react";
import { Form, Input, Button, Select } from "antd";
import { connect } from "react-redux";
import _ from "lodash";
import { useCreateWallet, useGetListWalletGroup, useTranslation } from "@/hook";
import { RootState } from "@/redux/store";
import { PasswordInput } from "@/component/Input";
import { TagOption } from "@/component";
import { IWalletGroup } from "@/electron/type";
import { actSaveSelectedWalletGroup } from "@/redux/walletGroup";
import { FormWrapper, OptionWrapper } from "./style";
import { EMPTY_STRING } from "@/config/constant";

const { Option } = Select;
const { TextArea } = Input;
let searchWalletGroupTimeOut: any = null;
const ENCRYPT_MODE = {
  NO_ENSCRYPT: "NO_ENSCRYPT",
  ENCRYPT: "ENCRYPT",
};

type ICreateManualProps = {
  listWalletGroup: IWalletGroup[];
  selectedWalletGroup: IWalletGroup | null;
  setModalOpen: (value: boolean) => void;
  isModalOpen: boolean;
  actSaveSelectedWalletGroup: (value: IWalletGroup | null) => void;
};

const CreateManual = (props: ICreateManualProps) => {
  const { translate } = useTranslation();
  const { listWalletGroup, selectedWalletGroup, setModalOpen, isModalOpen } =
    props;
  const [isBtnLoading, setBtnLoading] = useState(false);
  const [form] = Form.useForm();
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState(ENCRYPT_MODE.NO_ENSCRYPT);
  const { getListWalletGroup } = useGetListWalletGroup();
  const { createWallet, loading, isSuccess } = useCreateWallet();

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
    if (isModalOpen && !searchWalletGroupTimeOut) {
      setTimeout(() => {
        inputRef?.current?.focus();
      }, 100);
    }
  }, [isModalOpen, selectedWalletGroup]);

  useEffect(() => {
    form.setFieldsValue({
      groupId: selectedWalletGroup?.id,
      address: "",
      phrase: "",
      privateKey: "",
      encryptKey: "",
    });
    setMode(ENCRYPT_MODE.NO_ENSCRYPT);
  }, [isModalOpen, selectedWalletGroup, form]);

  useEffect(() => {
    if (!loading && isSuccess) {
      setBtnLoading(false);
      setModalOpen(false);

      const { groupId } = form.getFieldsValue(["groupId"]);
      props?.actSaveSelectedWalletGroup(
        _.find(listWalletGroup, { id: groupId }) || null,
      );
    }
  }, [loading, isSuccess]);

  const onSubmitForm = async () => {
    try {
      const { address, phrase, groupId, privateKey, encryptKey } =
        await form.validateFields([
          "address",
          "phrase",
          "groupId",
          "privateKey",
          "encryptKey",
        ]);
      setBtnLoading(true);
      createWallet({ address, phrase, groupId, privateKey }, encryptKey);
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
            placeholder={translate("wallet.belongWallet")}
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

        <Form.Item label={translate("address")} name="address">
          <Input
            placeholder={translate("wallet.inputAddressPlaceholder")}
            className="custom-input"
            size="large"
            // @ts-ignore
            ref={inputRef}
          />
        </Form.Item>

        <Form.Item label={translate("wallet.phrase")} name="phrase">
          <TextArea
            placeholder={translate("wallet.enterPhrasePlaceholder")}
            rows={3}
            className="custom-input"
          />
        </Form.Item>

        <Form.Item label="Private key:" name="privateKey">
          <TextArea
            placeholder={translate("wallet.enterPrivateKey")}
            rows={3}
            className="custom-input"
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
              extendClass="encryptKey-manual"
            />
          </Form.Item>
        )}
      </Form>

      <Button type="primary" onClick={onSubmitForm} loading={isBtnLoading}>
        {translate("button.createNew")}
      </Button>
    </FormWrapper>
  );
};

export default connect(
  (state: RootState) => ({
    listWalletGroup: state?.WalletGroup?.listWalletGroup,
    selectedWalletGroup: state?.WalletGroup?.selectedWalletGroup,
  }),
  { actSaveSelectedWalletGroup },
)(CreateManual);
