import { useMemo, useEffect, useState, ChangeEvent } from "react";
import { Modal, Form, Select, Input } from "antd";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { getCampaignAdditionalColumn } from "@/service/tableView";
import { ColumnConfig } from "@/electron/type";
import { actSaveSelectedCampaign } from "@/redux/campaign";
import {
  useGetCampaignProfileCalculatedValue,
  useTranslation,
  useUpdateCampaign,
} from "@/hook";
import { EMPTY_STRING } from "@/config/constant";
import { Wrapper } from "./style";

const ModalCalculate = (props: any) => {
  const { isModalOpen, setModalOpen, selectedCampaign, calculatedValue } =
    props;

  const [form] = Form.useForm();
  const { translate } = useTranslation();
  const { updateCampaign, loading, isSuccess } = useUpdateCampaign();
  const [label, setLabel] = useState("");
  const [listColumn, setListColumn] = useState<string[]>([]);

  const { getCampaignProfileCalculatedValue } =
    useGetCampaignProfileCalculatedValue();

  useEffect(() => {
    if (!selectedCampaign) {
      return;
    }
    if (isModalOpen) {
      getCampaignProfileCalculatedValue(
        selectedCampaign?.id!,
        listColumn,
        true
      );
    } else {
      getCampaignProfileCalculatedValue(selectedCampaign?.id!);
    }
  }, [selectedCampaign, listColumn, isModalOpen]);

  useEffect(() => {
    if (!loading && isSuccess) {
      onCloseModal();
    }
  }, [loading, isSuccess]);

  useEffect(() => {
    form.setFieldsValue({
      listColumnForCalculate: selectedCampaign?.listColumnForCalculate || [],
      unitForCalculate: selectedCampaign?.unitForCalculate,
    });

    setLabel(selectedCampaign?.unitForCalculate || "");
    setListColumn(selectedCampaign?.listColumnForCalculate || []);
  }, [isModalOpen, form, selectedCampaign]);

  const onCloseModal = () => {
    setModalOpen(false);
  };

  const listAdditonalColumn = useMemo(() => {
    return getCampaignAdditionalColumn(selectedCampaign);
  }, [selectedCampaign]);

  const onChangeLabel = (event: ChangeEvent<HTMLInputElement>) => {
    setLabel(event?.target?.value);
  };

  const onChangeListColumn = (value: string[]) => {
    setListColumn(value);
  };

  const onSubmit = async () => {
    try {
      const { listColumnForCalculate, unitForCalculate } =
        await form.validateFields([
          "listColumnForCalculate",
          "unitForCalculate",
        ]);

      const updatedData = {
        id: selectedCampaign?.id,
        listColumnForCalculate,
        unitForCalculate,
      };
      updateCampaign(updatedData);
      props?.actSaveSelectedCampaign({
        ...selectedCampaign,
        listColumnForCalculate,
        unitForCalculate,
      });
    } catch {}
  };

  return (
    <Modal
      title={translate("campaign.calculateTotalColumn")}
      open={isModalOpen}
      onCancel={onCloseModal}
      okText={translate("save")}
      cancelText={translate("close")}
      onOk={onSubmit}
      confirmLoading={loading}
    >
      <Wrapper>
        <Form form={form} layout="vertical" style={{ marginTop: "2rem" }}>
          <Form.Item
            label={`${translate("result")}:`}
            style={{ display: "flex" }}
          >
            <div className="info">
              <div className="label">{label || EMPTY_STRING}</div>
              <div className="value">{calculatedValue || EMPTY_STRING}</div>
            </div>
          </Form.Item>

          <Form.Item
            label={`${translate("campaign.listColumnToSum")}:`}
            name="listColumnForCalculate"
            rules={[
              {
                required: true,
                message: translate("form.requiredField"),
              },
            ]}
          >
            <Select
              placeholder={translate("campaign.columnPlaceholder")}
              size="large"
              className="custom-select"
              options={listAdditonalColumn?.map((column: ColumnConfig) => ({
                value: column?.dataIndex,
                label: column?.title,
              }))}
              mode="multiple"
              showSearch={false}
              onChange={onChangeListColumn}
            />
          </Form.Item>

          <Form.Item
            label={`${translate("campaign.unitForCalculate")}:`}
            name="unitForCalculate"
          >
            <Input
              className="custom-input"
              size="large"
              placeholder={translate("campaign.exampleSumColumnLabel")}
              onChange={onChangeLabel}
            />
          </Form.Item>
        </Form>
      </Wrapper>
    </Modal>
  );
};

export default connect(
  (state: RootState) => ({
    selectedCampaign: state?.Campaign?.selectedCampaign,
    calculatedValue: state?.CampaignProfile?.calculatedValue,
  }),
  { actSaveSelectedCampaign }
)(ModalCalculate);
