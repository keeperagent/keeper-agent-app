import { ChangeEvent } from "react";
import { Form, Tooltip, Input } from "antd";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { useTranslation } from "@/hook";
import { TrashBoldIcon } from "@/component/Icon";
import { ISelectTokenOption } from "@/electron/type";
import { Wrapper } from "./style";

type IProps = {
  tokenOption: ISelectTokenOption;
  index: number;
  onChangeTokenOption: (tokenOption: ISelectTokenOption, index: number) => void;
  onRemoveTokenOption: (index: number) => void;
};

const TokenOption = (props: IProps) => {
  const { tokenOption, index, onChangeTokenOption, onRemoveTokenOption } =
    props;

  const { translate } = useTranslation();

  const onChangeTokenName = (event: ChangeEvent<HTMLInputElement>) => {
    onChangeTokenOption(
      { ...tokenOption, tokenName: event?.target?.value },
      index
    );
  };

  const onChangeTokenAddress = (event: ChangeEvent<HTMLInputElement>) => {
    onChangeTokenOption(
      { ...tokenOption, tokenAddress: event?.target?.value },
      index
    );
  };

  const onChangeMinimumAmount = (event: ChangeEvent<HTMLInputElement>) => {
    onChangeTokenOption(
      { ...tokenOption, minimumAmount: event?.target?.value },
      index
    );
  };

  return (
    <Wrapper>
      <Form.Item
        label={`${translate("tokenName")}:`}
        rules={[
          {
            required: true,
            message: translate("form.requiredField"),
          },
        ]}
      >
        <Input
          value={tokenOption?.tokenName}
          onChange={onChangeTokenName}
          className="custom-input"
          size="large"
          placeholder={translate("workflow.enterTokenName")}
          onInput={(e) =>
            ((e.target as HTMLInputElement).value = (
              e.target as HTMLInputElement
            )?.value
              .toUpperCase()
              ?.replaceAll(" ", ""))
          }
        />
      </Form.Item>

      <Form.Item
        label={`${translate("tokenAddress")}:`}
        rules={[
          {
            required: true,
            message: translate("form.requiredField"),
          },
        ]}
      >
        <Input
          value={tokenOption?.tokenAddress}
          onChange={onChangeTokenAddress}
          className="custom-input"
          size="large"
          placeholder={translate("workflow.enterTokenAddress")}
        />
      </Form.Item>

      <Form.Item
        label={`${translate("minimumAmount")}:`}
        rules={[
          {
            required: true,
            message: translate("form.requiredField"),
          },
        ]}
      >
        <Input
          value={tokenOption?.minimumAmount}
          onChange={onChangeMinimumAmount}
          className="custom-input"
          size="large"
          placeholder={translate("workflow.enterTokenAddress")}
        />
      </Form.Item>

      {index > 0 && (
        <div className="tool">
          <Tooltip title={translate("remove")}>
            <div className="delete" onClick={() => onRemoveTokenOption(index)}>
              <TrashBoldIcon />
            </div>
          </Tooltip>
        </div>
      )}
    </Wrapper>
  );
};

export default connect((_state: RootState) => ({}), {})(TokenOption);
