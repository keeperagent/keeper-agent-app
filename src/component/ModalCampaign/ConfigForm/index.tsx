import { useRef, useEffect } from "react";
import { Form, Checkbox, InputNumber, Select } from "antd";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { useTranslation, useGetListStaticProxyGroup } from "@/hook";
import { IStaticProxyGroup } from "@/electron/type";
import { EMPTY_STRING } from "@/config/constant";
import { USER_AGENT_CATEGORY } from "@/electron/constant";
import { Wrapper, OptionWrapper } from "./style";

let searchStaticProxyGroupTimeOut: any = null;
const { Option } = Select;

const ConfigForm = (props: any) => {
  const {
    isModalOpen,
    listStaticProxyGroup,
    setIsUseProxy,
    isUseProxy,
    setIsUseRandomUserAgent,
    isUseRandomUserAgent,
  } = props;
  const { translate } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const { getListStaticProxyGroup, loading: staticProxyGroupLoading } =
    useGetListStaticProxyGroup();

  useEffect(() => {
    getListStaticProxyGroup({ page: 1, pageSize: 1000 });
  }, []);

  useEffect(() => {
    if (isModalOpen) {
      setTimeout(() => {
        inputRef?.current?.focus();
      }, 100);
    }
  }, [isModalOpen]);

  const onChangeUseProxy = (event: any) => {
    setIsUseProxy(event?.target?.checked);
  };

  const onChangeRandomUserAgent = (event: any) => {
    setIsUseRandomUserAgent(event?.target?.checked);
  };

  const onSearchStaticProxyGroup = (text: string) => {
    if (searchStaticProxyGroupTimeOut) {
      clearTimeout(searchStaticProxyGroupTimeOut);
    }
    searchStaticProxyGroupTimeOut = setTimeout(() => {
      getListStaticProxyGroup({ page: 1, pageSize: 1000, searchText: text });
    }, 200);
  };

  return (
    <Wrapper>
      <Form.Item
        label={`${translate("campaign.numberOfThread")}:`}
        name="numberOfThread"
        rules={[
          {
            required: true,
            message: translate("form.requiredField"),
          },
        ]}
      >
        <InputNumber
          placeholder={translate("campaign.numberOfThreadPlaceholder")}
          className="custom-input"
          size="large"
          style={{ width: "100%" }}
          min={1}
          // @ts-ignore
          ref={inputRef}
        />
      </Form.Item>

      <Form.Item
        label={`${translate("workflow.numberOfLoop")}:`}
        name="numberOfRound"
        rules={[
          {
            required: true,
            message: translate("form.requiredField"),
          },
        ]}
      >
        <InputNumber
          placeholder={translate("workflow.egNumberOfLoop")}
          className="custom-input"
          size="large"
          style={{ width: "100%" }}
          min={1}
        />
      </Form.Item>

      <Form.Item
        label={`${translate("workflow.sleepBetweenRound")}:`}
        name="sleepBetweenRound"
        rules={[
          {
            required: true,
            message: translate("form.requiredField"),
          },
        ]}
      >
        <InputNumber
          placeholder={translate("workflow.egSleepBetweenRound")}
          className="custom-input"
          size="large"
          style={{ width: "100%" }}
          min={0}
        />
      </Form.Item>

      <Form.Item name="isUseProxy" valuePropName="checked">
        <Checkbox onChange={onChangeUseProxy}>
          {translate("campaign.useProxy")}
        </Checkbox>
      </Form.Item>

      {isUseProxy && (
        <Form.Item
          label={`${translate("workflow.staticProxyGroup")}:`}
          name="proxyGroupId"
          rules={[
            {
              required: true,
              message: translate("form.requiredField"),
            },
          ]}
        >
          <Select
            placeholder={translate("workflow.staticProxyGroupPlaceholder")}
            size="large"
            className="custom-select"
            showSearch
            onSearch={onSearchStaticProxyGroup}
            filterOption={false}
            loading={staticProxyGroupLoading}
            optionLabelProp="label"
          >
            {listStaticProxyGroup?.map((group: IStaticProxyGroup) => (
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
      )}

      <Form.Item
        name="isUseRandomUserAgent"
        valuePropName="checked"
        style={{ marginTop: !isUseProxy ? "-2rem" : "auto" }}
      >
        <Checkbox onChange={onChangeRandomUserAgent}>
          {translate("workflow.isUseRandomUserAgent")}
        </Checkbox>
      </Form.Item>

      {isUseRandomUserAgent && (
        <Form.Item
          label={`${translate("workflow.userAgentType")}:`}
          name="userAgentCategory"
          rules={[
            {
              required: true,
              message: translate("form.requiredField"),
            },
          ]}
          style={{ marginTop: "-1rem" }}
        >
          <Select
            placeholder={translate("workflow.userAgentTypePlaceholder")}
            size="large"
            className="custom-select"
          >
            <Option key={USER_AGENT_CATEGORY?.MACOS}>MacOS</Option>
            <Option key={USER_AGENT_CATEGORY?.WINDOW}>Window</Option>
          </Select>
        </Form.Item>
      )}

      <Form.Item
        name="isSaveProfile"
        valuePropName="checked"
        style={{ marginTop: !isUseRandomUserAgent ? "-2rem" : "auto" }}
      >
        <Checkbox>{translate("campaign.saveProfileFolder")}</Checkbox>
      </Form.Item>
    </Wrapper>
  );
};

export default connect(
  (state: RootState) => ({
    listStaticProxyGroup: state?.StaticProxyGroup?.listStaticProxyGroup,
  }),
  {},
)(ConfigForm);
