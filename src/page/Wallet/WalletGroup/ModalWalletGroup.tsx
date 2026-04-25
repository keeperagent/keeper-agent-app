import { useState, useEffect, useRef } from "react";
import { Modal, Form, Input, Select, Checkbox } from "antd";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import {
  actSaveSelectedWalletGroup,
  actSaveCreateWalletGroup,
  actSaveUpdateWalletGroup,
} from "@/redux/walletGroup";
import {
  useUpdateWalletGroup,
  useCreateWalletGroup,
  useTranslation,
} from "@/hook";
import { PORTFOLIO_APP, PORTFOLIO_APP_NAME } from "@/electron/constant";
import debankImg from "@/asset/debank.svg";
import suiImg from "@/asset/chain/sui.png";
import aptosImg from "@/asset/chain/aptos.png";
import solImg from "@/asset/chain/sol.svg";
import { PortfolioAppWrapper } from "./style";

const { TextArea } = Input;
const { Option } = Select;

const portfolioConfig = [
  {
    name: PORTFOLIO_APP_NAME[PORTFOLIO_APP.DEBANK],
    image: debankImg,
    key: PORTFOLIO_APP.DEBANK,
  },
  {
    name: PORTFOLIO_APP_NAME[PORTFOLIO_APP.SOL_SCAN],
    image: solImg,
    key: PORTFOLIO_APP.SOL_SCAN,
  },
  {
    name: PORTFOLIO_APP_NAME[PORTFOLIO_APP.SUI_VISION],
    image: suiImg,
    key: PORTFOLIO_APP.SUI_VISION,
  },
  {
    name: PORTFOLIO_APP_NAME[PORTFOLIO_APP.APTOS_EXPLORER],
    image: aptosImg,
    key: PORTFOLIO_APP.APTOS_EXPLORER,
  },
];

const ModalWalletGroup = (props: any) => {
  const { translate } = useTranslation();
  const { isModalOpen, setModalOpen, selectedWalletGroup } = props;
  const [isBtnLoading, setBtnLoading] = useState(false);
  const [form] = Form.useForm();
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    updateWalletGroup,
    loading: isUpdateLoading,
    isSuccess: isUpdateSuccess,
  } = useUpdateWalletGroup();
  const {
    createWalletGroup,
    loading: isCreateLoading,
    isSuccess: isCreateSuccess,
  } = useCreateWalletGroup();

  useEffect(() => {
    if (isModalOpen) {
      setTimeout(() => {
        inputRef?.current?.focus();
      }, 100);
    }
    form.setFieldsValue({
      name: selectedWalletGroup?.name || "",
      note: selectedWalletGroup?.note || "",
      portfolioApp: selectedWalletGroup?.portfolioApp || PORTFOLIO_APP.DEBANK,
      isQuickMapCampaign: selectedWalletGroup?.isQuickMapCampaign,
    });
  }, [isModalOpen, form, selectedWalletGroup]);

  const onCloseModal = () => {
    setModalOpen(false);
    setBtnLoading(false);

    setTimeout(() => {
      props?.actSaveSelectedWalletGroup(null);
    }, 300);
  };

  useEffect(() => {
    if (!isUpdateLoading && isUpdateSuccess) {
      setBtnLoading(false);
      onCloseModal();
    }
  }, [isUpdateLoading, isUpdateSuccess]);

  useEffect(() => {
    if (!isCreateLoading && isCreateSuccess) {
      setBtnLoading(false);
      onCloseModal();
    }
  }, [isCreateLoading, isCreateSuccess]);

  const onSubmitForm = async () => {
    try {
      const { name, note, portfolioApp, isQuickMapCampaign } =
        await form.validateFields([
          "name",
          "note",
          "portfolioApp",
          "isQuickMapCampaign",
        ]);
      setBtnLoading(true);

      if (selectedWalletGroup) {
        updateWalletGroup({
          name,
          note,
          portfolioApp,
          id: selectedWalletGroup?.id,
        });
      } else {
        createWalletGroup({ name, note, portfolioApp }, isQuickMapCampaign);
      }
    } catch {}
  };

  return (
    <Modal
      open={isModalOpen}
      title={
        !selectedWalletGroup
          ? translate("wallet.createWalletGroup")
          : translate("wallet.editWalletGroup")
      }
      onCancel={onCloseModal}
      mask={{ closable: false }}
      okText={
        !selectedWalletGroup
          ? translate("button.createNew")
          : translate("button.update")
      }
      cancelText={translate("cancel")}
      width="50rem"
      onOk={onSubmitForm}
      confirmLoading={isBtnLoading}
    >
      <Form layout="vertical" form={form} style={{ marginTop: "2rem" }}>
        <Form.Item
          label={`${translate("groupName")}:`}
          name="name"
          rules={[
            {
              required: true,
              message: translate("form.requiredField"),
            },
          ]}
        >
          <Input
            placeholder={translate("enterGroupName")}
            className="custom-input"
            size="large"
            // @ts-ignore
            ref={inputRef}
          />
        </Form.Item>

        <Form.Item label={`${translate("describe")}:`} name="note">
          <TextArea
            placeholder={translate("enterDescribe")}
            rows={3}
            className="custom-input"
          />
        </Form.Item>

        <Form.Item
          label={`${translate("wallet.pageViewPortfolio")}:`}
          name="portfolioApp"
        >
          <Select
            className="custom-select"
            placeholder={translate("wallet.appViewPortfolio")}
            allowClear
            size="large"
          >
            {portfolioConfig?.map((config: any) => {
              return (
                <Option key={config?.key}>
                  <PortfolioAppWrapper>
                    <div className="icon">
                      <img src={config?.image} alt="" />
                    </div>
                    <span className="text">{config?.name}</span>
                  </PortfolioAppWrapper>
                </Option>
              );
            })}
          </Select>
        </Form.Item>

        <Form.Item name="isQuickMapCampaign" valuePropName="checked">
          <Checkbox>{translate("wallet.quickMapCampaign")}</Checkbox>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default connect(
  (state: RootState) => ({
    selectedWalletGroup: state?.WalletGroup?.selectedWalletGroup,
    user: state?.Auth?.user,
  }),
  {
    actSaveSelectedWalletGroup,
    actSaveCreateWalletGroup,
    actSaveUpdateWalletGroup,
  },
)(ModalWalletGroup);
