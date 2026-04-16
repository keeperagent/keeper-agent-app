import _ from "lodash";
import { ChangeEvent, useEffect, useMemo } from "react";
import { Form, Tooltip, Input, Select } from "antd";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { useTranslation } from "@/hook";
import { TrashBoldIcon } from "@/component/Icon";
import { ISelectChainOption, INodeEndpointGroup } from "@/electron/type";
import { useGetListNodeEndpointGroup } from "@/hook";
import { getChainConfig, IChainConfig } from "@/service/util";
import { CHAIN_TYPE } from "@/electron/constant";
import { Wrapper, OptionWrapper, ChainWrapper } from "./style";

let searchNodeEndpointGroupTimeOut: any = null;
const { Option } = Select;

type IProps = {
  chainOption: ISelectChainOption;
  index: number;
  onChangeChainOption: (chainOption: ISelectChainOption, index: number) => void;
  onRemoveChainOption: (index: number) => void;
  listNodeEndpointGroup: INodeEndpointGroup[];
};

const ChainOption = (props: IProps) => {
  const {
    chainOption,
    index,
    onChangeChainOption,
    onRemoveChainOption,
    listNodeEndpointGroup,
  } = props;
  const { locale } = useTranslation();

  const { getListNodeEndpointGroup, loading: isSelectLoading } =
    useGetListNodeEndpointGroup();
  const { translate } = useTranslation();

  useEffect(() => {
    getListNodeEndpointGroup({ page: 1, pageSize: 1000 });
  }, []);

  const onSearchNodeEndpointGroup = (text: string) => {
    if (searchNodeEndpointGroupTimeOut) {
      clearTimeout(searchNodeEndpointGroupTimeOut);
    }
    searchNodeEndpointGroupTimeOut = setTimeout(() => {
      getListNodeEndpointGroup({ page: 1, pageSize: 1000, searchText: text });
    }, 200);
  };

  const onChangeChainName = (event: ChangeEvent<HTMLInputElement>) => {
    onChangeChainOption(
      { ...chainOption, chainName: event?.target?.value },
      index,
    );
  };

  const onChangeTokenName = (event: ChangeEvent<HTMLInputElement>) => {
    onChangeChainOption(
      { ...chainOption, tokenName: event?.target?.value },
      index,
    );
  };

  const onChangeTokenAddress = (event: ChangeEvent<HTMLInputElement>) => {
    onChangeChainOption(
      { ...chainOption, tokenAddress: event?.target?.value },
      index,
    );
  };

  const onChangeMinimumAmount = (event: ChangeEvent<HTMLInputElement>) => {
    onChangeChainOption(
      { ...chainOption, minimumAmount: event?.target?.value },
      index,
    );
  };

  const onChangeChainType = (value: string) => {
    onChangeChainOption(
      {
        ...chainOption,
        chainType: value as CHAIN_TYPE,
        nodeEndpointGroupId: null,
      },
      index,
    );
  };

  const onChangeNodeEndpointGroup = (value: any) => {
    onChangeChainOption({ ...chainOption, nodeEndpointGroupId: value }, index);
  };

  const listValidNodeEndpointGroup = useMemo(() => {
    return listNodeEndpointGroup.filter(
      (item) => item?.chainType === chainOption?.chainType,
    );
  }, [listNodeEndpointGroup, chainOption?.chainType]);

  return (
    <Wrapper>
      <Form.Item
        label={`${translate("wallet.blockchainType")}:`}
        rules={[
          {
            required: true,
            message: translate("form.requiredField"),
          },
        ]}
        name={"blockchainType" + index}
        initialValue={chainOption?.chainType}
      >
        <Select
          placeholder={translate("wallet.egBlockchainType")}
          size="large"
          className="custom-select"
          onChange={onChangeChainType}
          value={chainOption?.chainType}
        >
          {getChainConfig(locale)?.map((config: any) => {
            return (
              <Option key={config?.key} value={config?.key}>
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
        label={`${translate("nodeEndpoint.group")}:`}
        rules={[
          {
            required: true,
            message: translate("form.requiredField"),
          },
        ]}
        name={"nodeEndpointGroupId" + index}
        initialValue={chainOption?.nodeEndpointGroupId}
      >
        <Select
          placeholder={translate("nodeEndpoint.groupPlaceholder")}
          size="large"
          className="custom-select"
          value={chainOption?.nodeEndpointGroupId}
          onChange={onChangeNodeEndpointGroup}
          showSearch
          onSearch={onSearchNodeEndpointGroup}
          filterOption={false}
          loading={isSelectLoading}
          optionLabelProp="label"
        >
          {listValidNodeEndpointGroup?.map((group: INodeEndpointGroup) => {
            const chainConfig = _.find(getChainConfig(locale), {
              key: group?.chainType || CHAIN_TYPE.EVM,
            }) as IChainConfig;

            return (
              <Option
                key={group?.id}
                value={group?.id}
                label={
                  <ChainWrapper>
                    <div className="icon">
                      <img src={chainConfig?.image} alt="" />
                    </div>
                    <span className="text">{group?.name}</span>
                  </ChainWrapper>
                }
              >
                <OptionWrapper>
                  <div className="icon">
                    <img src={chainConfig?.image} alt="" />
                  </div>

                  <div className="content">
                    <div className="name">{group?.name}</div>
                    <div className="description">
                      {translate("nodeProvider.totalNode")}:{" "}
                      {group?.totalNodeEndpoint || 0}
                    </div>
                  </div>
                </OptionWrapper>
              </Option>
            );
          })}
        </Select>
      </Form.Item>

      <Form.Item
        label={`${translate("chainName")}:`}
        rules={[
          {
            required: true,
            message: translate("form.requiredField"),
          },
        ]}
        name={"chainName" + index}
        initialValue={chainOption?.chainName}
      >
        <Input
          value={chainOption?.chainName}
          onChange={onChangeChainName}
          className="custom-input"
          size="large"
          placeholder={translate("workflow.enterChainName")}
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
        label={`${translate("tokenName")}:`}
        rules={[
          {
            required: true,
            message: translate("form.requiredField"),
          },
        ]}
        name={"tokenName" + index}
        initialValue={chainOption?.tokenName}
      >
        <Input
          value={chainOption?.tokenName}
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
        name={"tokenAddress" + index}
        initialValue={chainOption?.tokenAddress}
      >
        <Input
          value={chainOption?.tokenAddress}
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
        name={"minimumAmount" + index}
        initialValue={chainOption?.minimumAmount}
      >
        <Input
          value={chainOption?.minimumAmount}
          onChange={onChangeMinimumAmount}
          className="custom-input"
          size="large"
          placeholder={translate("workflow.enterTokenAddress")}
        />
      </Form.Item>

      {index > 0 && (
        <div className="tool">
          <Tooltip title={translate("remove")}>
            <div className="delete" onClick={() => onRemoveChainOption(index)}>
              <TrashBoldIcon />
            </div>
          </Tooltip>
        </div>
      )}
    </Wrapper>
  );
};

export default connect(
  (state: RootState) => ({
    listNodeEndpointGroup: state?.NodeEndpointGroup?.listNodeEndpointGroup,
  }),
  {},
)(ChainOption);
