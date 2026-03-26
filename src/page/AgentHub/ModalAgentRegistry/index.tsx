import { useEffect, useState, useMemo } from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Row,
  Col,
  Select,
  Switch,
  Divider,
  Radio,
} from "antd";
import _ from "lodash";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import {
  IAgentRegistry,
  ICampaign,
  IAgentSkill,
  IPreference,
  INodeEndpointGroup,
  ICampaignProfile,
  LLMProvider,
} from "@/electron/type";
import { DEFAULT_LLM_MODELS, CHAIN_TYPE } from "@/electron/constant";
import {
  useCreateAgentRegistry,
  useUpdateAgentRegistry,
} from "@/hook/agentRegistry";
import { useGetListAgentSkill } from "@/hook/agentSkill";
import {
  useGetListNodeEndpointGroup,
  useGetListCampaignProfile,
  useTranslation,
} from "@/hook";
import { BASE_TOOL_REGISTRY } from "@/electron/appAgent/baseTool/registry";
import { LlmProviderPicker, PasswordInput } from "@/component";
import { listChainConfig } from "@/page/Agent/ChatAgent/WalletView/config";
import { getChainConfig, IChainConfig } from "@/service/util";
import { OptionWrapper, ChainWrapper } from "./style";

const { TextArea } = Input;
const { Option } = Select;

type Props = {
  open: boolean;
  registry: IAgentRegistry | null;
  onClose: () => void;
  listCampaign?: ICampaign[];
  listAgentSkill?: IAgentSkill[];
  listNodeEndpointGroup?: INodeEndpointGroup[];
  listCampaignProfile?: ICampaignProfile[];
  preference?: IPreference | null;
};

const getDefaultModelForProvider = (
  provider: string,
  preference: IPreference | null | undefined,
): string => {
  if (provider === LLMProvider.OPENAI) {
    return preference?.openAIModel || DEFAULT_LLM_MODELS[LLMProvider.OPENAI];
  }

  if (provider === LLMProvider.GEMINI) {
    return (
      preference?.googleGeminiModel || DEFAULT_LLM_MODELS[LLMProvider.GEMINI]
    );
  }

  return preference?.anthropicModel || DEFAULT_LLM_MODELS[LLMProvider.CLAUDE];
};

const ModalAgentRegistry = (props: Props) => {
  const {
    open,
    registry,
    onClose,

    listCampaign,
    listAgentSkill,
    listNodeEndpointGroup,
    listCampaignProfile,
    preference,
  } = props;

  const [llmProvider, setLlmProvider] = useState<string>(LLMProvider.CLAUDE);
  const [secretKeyValue, setSecretKeyValue] = useState<string>("");

  const { translate, locale } = useTranslation();
  const [form] = Form.useForm();
  const { createAgentRegistry, loading: createLoading } =
    useCreateAgentRegistry();
  const { updateAgentRegistry, loading: updateLoading } =
    useUpdateAgentRegistry();
  const { getListAgentSkill } = useGetListAgentSkill();
  const { getListNodeEndpointGroup } = useGetListNodeEndpointGroup();
  const { getListCampaignProfile } = useGetListCampaignProfile();

  const watchedCampaignId = Form.useWatch("campaignId", form);
  const watchedIsAllWallet = Form.useWatch("isAllWallet", form);
  const chainKey = Form.useWatch("chainKey", form) || "";

  const isEdit = Boolean(registry?.id);
  const loading = createLoading || updateLoading;

  useEffect(() => {
    if (open) {
      getListAgentSkill({ page: 1, pageSize: 100 });
      getListNodeEndpointGroup({ page: 1, pageSize: 1000 });
    }
  }, [open]);

  useEffect(() => {
    const allowedBaseTools = registry?.allowedBaseTools || [];
    const allowedSkillIds = registry?.allowedSkillIds || [];
    const provider = registry?.llmProvider || LLMProvider.CLAUDE;
    const llmModel =
      registry?.llmModel || getDefaultModelForProvider(provider, preference);
    setLlmProvider(provider);

    setSecretKeyValue(registry?.secretKey || "");
    form.setFieldsValue({
      name: registry?.name,
      description: registry?.description || "",
      llmModel,
      systemPrompt: registry?.systemPrompt || "",
      allowedBaseTools,
      allowedSkillIds,
      isAgentInteractionEnabled: Boolean(registry?.isAgentInteractionEnabled),
      isActive: Boolean(registry?.isActive),
      chainKey: registry?.chainKey,
      nodeEndpointGroupId: registry?.nodeEndpointGroupId,
      campaignId: registry?.campaignId,
      profileIds: registry?.profileIds || [],
      isAllWallet: Boolean(registry?.isAllWallet),
      maxConcurrentTasks: registry?.maxConcurrentTasks || 3,
    });
  }, [registry]);

  useEffect(() => {
    if (watchedCampaignId) {
      if (watchedCampaignId !== registry?.campaignId) {
        form.setFieldValue("profileIds", []);
      }
      getListCampaignProfile({
        page: 1,
        pageSize: 100,
        campaignId: watchedCampaignId,
      });
    }
  }, [watchedCampaignId]);

  const onChangeProvider = (newProvider: string) => {
    setLlmProvider(newProvider);
    if (!isEdit) {
      form.setFieldValue(
        "llmModel",
        getDefaultModelForProvider(newProvider, preference),
      );
    }
  };

  const onChangeChain = () => {
    form.setFieldValue("nodeEndpointGroupId", null);
  };

  const filteredNodeProviders = useMemo(() => {
    const chainConfig =
      _.find(listChainConfig, { dexscreenerKey: chainKey }) || null;
    const chainType = chainConfig?.isEvm ? CHAIN_TYPE.EVM : CHAIN_TYPE.SOLANA;

    return (listNodeEndpointGroup || []).filter(
      (item) => item?.chainType === chainType,
    );
  }, [listNodeEndpointGroup, chainKey]);

  const onSubmit = async () => {
    try {
      const values = await form.validateFields();

      const data: Partial<IAgentRegistry> = {
        name: values.name,
        description: values.description || "",
        llmProvider,
        llmModel: values.llmModel || "",
        systemPrompt: values.systemPrompt || "",
        allowedBaseTools: values.allowedBaseTools || [],
        allowedSkillIds: values.allowedSkillIds || [],
        isAgentInteractionEnabled: Boolean(values.isAgentInteractionEnabled),
        isActive: Boolean(values.isActive),
        chainKey: values?.chainKey,
        nodeEndpointGroupId: values?.nodeEndpointGroupId,
        campaignId: values?.campaignId,
        profileIds: values?.profileIds || [],
        isAllWallet: Boolean(values.isAllWallet),
        secretKey: values.secretKey || "",
        maxConcurrentTasks: values.maxConcurrentTasks,
      };

      if (isEdit && registry?.id) {
        updateAgentRegistry({
          ...data,
          id: registry.id,
        } as IAgentRegistry);
      } else {
        createAgentRegistry(data);
      }

      onClose();
    } catch {}
  };

  return (
    <Modal
      title={
        isEdit
          ? translate("agent.editRegistry")
          : translate("agent.createRegistry")
      }
      open={open}
      onCancel={onClose}
      onOk={onSubmit}
      okText={isEdit ? translate("button.update") : translate("button.create")}
      cancelText={translate("cancel")}
      confirmLoading={loading}
      width="110rem"
      destroyOnHidden
      style={{ top: "5rem" }}
    >
      <Form layout="vertical" form={form}>
        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              label={`${translate("agent.registryName")}:`}
              name="name"
              rules={[
                { required: true, message: translate("form.requiredField") },
              ]}
            >
              <Input
                placeholder={translate("agent.enterRegistryName")}
                className="custom-input"
                size="large"
              />
            </Form.Item>

            <Form.Item
              label={`${translate("description")}:`}
              name="description"
            >
              <TextArea
                placeholder={translate("agent.enterRegistryDesc")}
                rows={3}
                className="custom-input"
              />
            </Form.Item>

            <Form.Item
              label={`${translate("agent.maxConcurrentTasks")}:`}
              name="maxConcurrentTasks"
              tooltip={translate("agent.maxConcurrentTasksTooltip")}
            >
              <InputNumber
                placeholder={translate("agent.maxConcurrentTasksPlaceholder")}
                className="custom-input"
                size="large"
                min={1}
                style={{ width: "100%" }}
              />
            </Form.Item>

            <Divider style={{ fontSize: "1.2rem" }}>
              {translate("agent.executionContext")}
            </Divider>

            <Row gutter={12}>
              <Col span={12}>
                <Form.Item
                  label={`${translate("agent.chain")}:`}
                  name="chainKey"
                >
                  <Select
                    size="large"
                    className="custom-select"
                    placeholder={translate("workflow.selectChain")}
                    onChange={onChangeChain}
                    showSearch
                    allowClear
                    options={listChainConfig.map((config) => ({
                      value: config.dexscreenerKey,
                      label: config.chainName,
                      logo: config.logo,
                      chainId: config.chainId,
                      isEvm: config.isEvm,
                    }))}
                    optionRender={(option) => (
                      <ChainWrapper>
                        <img src={option.data.logo} alt="" />
                        <OptionWrapper>
                          <div className="name">{option.label}</div>
                          {option.data.isEvm && (
                            <div className="description">
                              Chain ID: {option.data.chainId}
                            </div>
                          )}
                        </OptionWrapper>
                      </ChainWrapper>
                    )}
                    labelRender={(option) => {
                      if (!option.value) {
                        return null;
                      }
                      const config = listChainConfig.find(
                        (item) => item.dexscreenerKey === option.value,
                      );
                      if (!config) {
                        return null;
                      }
                      return (
                        <ChainWrapper>
                          <img src={config.logo} alt="" />
                          <span>{config.chainName}</span>
                        </ChainWrapper>
                      );
                    }}
                  />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  label={`${translate("nodeEndpoint.group")}:`}
                  name="nodeEndpointGroupId"
                >
                  <Select
                    size="large"
                    className="custom-select"
                    placeholder={translate("nodeEndpoint.groupPlaceholder")}
                    showSearch
                    allowClear
                    disabled={!chainKey}
                    options={filteredNodeProviders.map(
                      (group: INodeEndpointGroup) => {
                        const groupChainConfig = _.find(
                          getChainConfig(locale),
                          {
                            key: group?.chainType || CHAIN_TYPE.EVM,
                          },
                        ) as IChainConfig;
                        return {
                          value: group.id,
                          label: group.name,
                          chainImage: groupChainConfig?.image,
                          totalNodeEndpoint: group.totalNodeEndpoint,
                        };
                      },
                    )}
                    optionRender={(option) => (
                      <ChainWrapper>
                        {option.data.chainImage && (
                          <img src={option.data.chainImage} alt="" />
                        )}
                        <OptionWrapper>
                          <div className="name">{option.label}</div>
                          <div className="description">
                            {option.data.totalNodeEndpoint || 0} nodes
                          </div>
                        </OptionWrapper>
                      </ChainWrapper>
                    )}
                    labelRender={(option) => {
                      if (!option.value) {
                        return null;
                      }
                      const group = filteredNodeProviders.find(
                        (item) => item.id === option.value,
                      );
                      const groupChainConfig = _.find(getChainConfig(locale), {
                        key: group?.chainType || CHAIN_TYPE.EVM,
                      }) as IChainConfig;
                      return (
                        <ChainWrapper>
                          {groupChainConfig?.image && (
                            <img src={groupChainConfig.image} alt="" />
                          )}
                          <span>{option.label}</span>
                        </ChainWrapper>
                      );
                    }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label={`${translate("sidebar.campaign")}:`}
              name="campaignId"
            >
              <Select
                size="large"
                className="custom-select"
                placeholder={translate("schedule.selectCampaign")}
                showSearch
                optionFilterProp="label"
                optionLabelProp="label"
                allowClear
              >
                {(listCampaign || []).map((campaign: ICampaign) => (
                  <Option
                    key={campaign.id}
                    value={campaign.id}
                    label={campaign.name}
                  >
                    <OptionWrapper>
                      <div className="name">{campaign.name}</div>
                      {campaign.note && (
                        <div className="description">{campaign.note}</div>
                      )}
                    </OptionWrapper>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label={`${translate("agent.walletProfiles")}:`}>
              <Form.Item name="isAllWallet" noStyle valuePropName="value">
                <Radio.Group size="small" style={{ marginBottom: "0.8rem" }}>
                  <Radio value={true}>{translate("agent.allWallet")}</Radio>
                  <Radio value={false}>{translate("agent.customSelect")}</Radio>
                </Radio.Group>
              </Form.Item>

              <Form.Item name="profileIds" noStyle>
                <Select
                  mode="multiple"
                  size="large"
                  className="custom-select"
                  placeholder={translate("agent.selectWalletProfiles")}
                  showSearch
                  optionFilterProp="label"
                  optionLabelProp="label"
                  allowClear
                  disabled={watchedIsAllWallet !== false}
                >
                  {(listCampaignProfile || []).map(
                    (profile: ICampaignProfile) => (
                      <Option
                        key={profile.id}
                        value={profile.id}
                        label={profile.name}
                      >
                        <OptionWrapper>
                          <div className="name">{profile.name}</div>
                          {profile.note && (
                            <div className="description">{profile.note}</div>
                          )}
                        </OptionWrapper>
                      </Option>
                    ),
                  )}
                </Select>
              </Form.Item>
            </Form.Item>

            <Form.Item
              label={`${translate("wallet.secretKey")}:`}
              tooltip={translate("agent.encryptKeyTooltip")}
            >
              <PasswordInput
                name="secretKey"
                placeholder={
                  isEdit
                    ? translate("agent.encryptKeyEditPlaceholder")
                    : translate("agent.encryptKeyPlaceholder")
                }
                extendClass="agentSecretKey"
                onChange={setSecretKeyValue}
                initialValue={secretKeyValue}
                shouldHideValue={true}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label={`${translate("agent.llmProvider")}:`}>
              <LlmProviderPicker
                value={llmProvider}
                onChange={onChangeProvider}
              />
            </Form.Item>

            <Form.Item
              label={`${translate("agent.llmModel")}:`}
              name="llmModel"
              rules={[
                { required: true, message: translate("form.requiredField") },
              ]}
            >
              <Input className="custom-input" size="large" />
            </Form.Item>

            <Form.Item
              label={`${translate("agent.systemPrompt")}:`}
              name="systemPrompt"
            >
              <TextArea
                placeholder={translate("agent.systemPromptPlaceholder")}
                rows={7}
                className="custom-input"
              />
            </Form.Item>

            <Form.Item
              label={`${translate("agent.allowedTools")}:`}
              name="allowedBaseTools"
              tooltip={translate("agent.emptyMeansAllTools")}
            >
              <Select
                mode="multiple"
                size="large"
                className="custom-select"
                placeholder={translate("agent.selectTools")}
                allowClear
                showSearch
                optionFilterProp="label"
                optionLabelProp="label"
              >
                {BASE_TOOL_REGISTRY.map((tool) => (
                  <Option key={tool.key} value={tool.key} label={tool.name}>
                    <OptionWrapper>
                      <div className="name">{tool.name}</div>
                      <div className="description">{tool.description}</div>
                    </OptionWrapper>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label={`${translate("agent.skills")}:`}
              name="allowedSkillIds"
              tooltip={translate("agent.emptyMeansAllSkills")}
            >
              <Select
                mode="multiple"
                size="large"
                className="custom-select"
                placeholder={translate("agent.selectSkills")}
                allowClear
                showSearch
                optionFilterProp="label"
                optionLabelProp="label"
              >
                {(listAgentSkill || []).map((skill: IAgentSkill) => (
                  <Option key={skill.id} value={skill.id} label={skill.name}>
                    <OptionWrapper>
                      <div className="name">{skill.name}</div>
                      {skill.description && (
                        <div className="description">{skill.description}</div>
                      )}
                    </OptionWrapper>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label={translate("agent.agentInteraction")}
              name="isAgentInteractionEnabled"
              valuePropName="checked"
              tooltip={translate("agent.agentInteractionTooltip")}
            >
              <Switch />
            </Form.Item>

            <Form.Item
              label={translate("agent.isActive")}
              name="isActive"
              valuePropName="checked"
              tooltip={translate("agent.isActiveTooltip")}
            >
              <Switch />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default connect((state: RootState) => ({
  listCampaign: state?.Campaign?.listCampaign || [],
  listAgentSkill: state?.AgentSkill?.listAgentSkill || [],
  listNodeEndpointGroup: state?.NodeEndpointGroup?.listNodeEndpointGroup || [],
  listCampaignProfile: state?.CampaignProfile?.listCampaignProfile || [],
  preference: state?.Preference?.preference || null,
}))(ModalAgentRegistry);
