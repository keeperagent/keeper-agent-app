import { useRef, useEffect, Fragment } from "react";
import { Form, Checkbox, InputNumber, Select } from "antd";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { TagOption } from "@/component";
import { useTranslation, useGetListProxyIpGroup } from "@/hook";
import { IProxyIpGroup, IProxyService } from "@/electron/type";
import { EMPTY_STRING, LIST_PROXY_SERVICE } from "@/config/constant";
import { PROXY_TYPE } from "@/electron/constant";
import { USER_AGENT_CATEGORY } from "@/electron/constant";
import { Wrapper, OptionWrapper } from "./style";

let searchProxyIpGroupTimeOut: any = null;
const { Option } = Select;

const ConfigForm = (props: any) => {
  const {
    isModalOpen,
    listProxyIpGroup,
    setIsUseProxy,
    isUseProxy,
    setProxyType,
    proxyType,
    setIsUseRandomUserAgent,
    isUseRandomUserAgent,
  } = props;
  const { translate } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const { getListProxyIpGroup, loading: proxyIpGroupLoading } =
    useGetListProxyIpGroup();

  useEffect(() => {
    getListProxyIpGroup({ page: 1, pageSize: 10000 });
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

  const onSearchProxyIpGroup = (text: string) => {
    if (searchProxyIpGroupTimeOut) {
      clearTimeout(searchProxyIpGroupTimeOut);
    }
    searchProxyIpGroupTimeOut = setTimeout(() => {
      getListProxyIpGroup({ page: 1, pageSize: 10000, searchText: text });
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
          className="custom-input-number"
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
          className="custom-input-number"
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
          className="custom-input-number"
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
        <div className="mode">
          <TagOption
            content={translate("proxy.rotateProxy")}
            checked={proxyType === PROXY_TYPE.ROTATE_PROXY}
            onClick={() => setProxyType(PROXY_TYPE.ROTATE_PROXY)}
            style={{ fontSize: "1.1rem" }}
          />

          <TagOption
            content={translate("proxy.staticProxy")}
            checked={proxyType === PROXY_TYPE.STATIC_PROXY}
            onClick={() => setProxyType(PROXY_TYPE.STATIC_PROXY)}
            style={{ fontSize: "1.1rem" }}
          />
        </div>
      )}

      {isUseProxy && proxyType === PROXY_TYPE.ROTATE_PROXY && (
        <Fragment>
          <Form.Item
            label={`${translate("workflow.rotateProxyService")}:`}
            name="proxyService"
            rules={[
              {
                required: true,
                message: translate("form.requiredField"),
              },
            ]}
          >
            <Select
              placeholder={translate("workflow.rotateProxyServicePlaceholder")}
              size="large"
              className="custom-select"
            >
              {LIST_PROXY_SERVICE?.map(
                (proxyService: IProxyService) => (
                  <Option key={proxyService?.type}>
                    <span style={{ display: "flex", alignItems: "center" }}>
                      <div
                        className="color"
                        style={{
                          width: "2rem",
                          height: "2rem",
                          borderRadius: "0.5rem",
                          backgroundColor: proxyService.background,
                          marginRight: "1rem",
                        }}
                      />
                      {proxyService?.name}
                    </span>
                  </Option>
                )
              )}
            </Select>
          </Form.Item>

          <Form.Item
            label={`${translate("campaign.maxProfilePerProxy")}:`}
            name="maxProfilePerProxy"
            rules={[
              {
                required: true,
                message: translate("form.requiredField"),
              },
            ]}
            tooltip={translate("campaign.maxProfilePerProxyHelper")}
          >
            <InputNumber
              placeholder={translate("campaign.maxProfilePerProxyPlaceholder")}
              className="custom-input-number"
              size="large"
              style={{ width: "100%" }}
              min={1}
            />
          </Form.Item>
        </Fragment>
      )}

      {isUseProxy && proxyType === PROXY_TYPE.STATIC_PROXY && (
        <Form.Item
          label={`${translate("workflow.staticProxyGroup")}:`}
          name="proxyIpGroupId"
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
            onSearch={onSearchProxyIpGroup}
            filterOption={false}
            loading={proxyIpGroupLoading}
            optionLabelProp="label"
          >
            {listProxyIpGroup?.map((group: IProxyIpGroup) => (
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
    listProxyIpGroup: state?.ProxyIpGroup?.listProxyIpGroup,
  }),
  {}
)(ConfigForm);
