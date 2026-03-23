import { useEffect, useState } from "react";
import { Modal, Form, Input, Row, Col, Select, Switch } from "antd";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import {
  IAgentRegistry,
  ICampaign,
  IAgentSkill,
  IPreference,
  LLMProvider,
} from "@/electron/type";
import { DEFAULT_LLM_MODELS } from "@/electron/constant";
import {
  useCreateAgentRegistry,
  useUpdateAgentRegistry,
} from "@/hook/agentRegistry";
import { useGetListAgentSkill } from "@/hook/agentSkill";
import { useTranslation } from "@/hook/useTranslation";
import { BASE_TOOL_REGISTRY } from "@/electron/appAgent/baseTool/registry";
import { LlmProviderPicker } from "@/component";
import { OptionWrapper } from "./style";

const { TextArea } = Input;
const { Option } = Select;

type Props = {
  open: boolean;
  registry: IAgentRegistry | null;
  onClose: () => void;
  onRefresh: () => void;
  listCampaign?: ICampaign[];
  listAgentSkill?: IAgentSkill[];
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
    onRefresh,
    listCampaign,
    listAgentSkill,
    preference,
  } = props;

  const [llmProvider, setLlmProvider] = useState<string>(LLMProvider.CLAUDE);

  const { translate } = useTranslation();
  const [form] = Form.useForm();
  const { createAgentRegistry, loading: createLoading } =
    useCreateAgentRegistry();
  const { updateAgentRegistry, loading: updateLoading } =
    useUpdateAgentRegistry();
  const { getListAgentSkill } = useGetListAgentSkill();

  const isEdit = Boolean(registry?.id);
  const loading = createLoading || updateLoading;

  useEffect(() => {
    if (open) {
      getListAgentSkill({ page: 1, pageSize: 100 });
    }
  }, [open]);

  useEffect(() => {
    const allowedBaseTools = registry?.allowedBaseTools || [];
    const allowedCampaignIds = registry?.allowedCampaignIds || [];
    const allowedSkillIds = registry?.allowedSkillIds || [];
    const provider = registry?.llmProvider || LLMProvider.CLAUDE;
    const llmModel =
      registry?.llmModel || getDefaultModelForProvider(provider, preference);

    setLlmProvider(provider);
    form.setFieldsValue({
      name: registry?.name,
      description: registry?.description || "",
      llmModel,
      systemPrompt: registry?.systemPrompt || "",
      allowedBaseTools,
      allowedCampaignIds,
      allowedSkillIds,
      isAgentInteractionEnabled: Boolean(registry?.isAgentInteractionEnabled),
      isActive: Boolean(registry?.isActive),
    });
  }, [registry]);

  const onChangeProvider = (newProvider: string) => {
    setLlmProvider(newProvider);
    if (!isEdit) {
      form.setFieldValue(
        "llmModel",
        getDefaultModelForProvider(newProvider, preference),
      );
    }
  };

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
        allowedCampaignIds: values.allowedCampaignIds || [],
        allowedSkillIds: values.allowedSkillIds || [],
        isAgentInteractionEnabled: Boolean(values.isAgentInteractionEnabled),
        isActive: Boolean(values.isActive),
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
      onRefresh();
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
      width="100rem"
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
              label={`${translate("agent.allowedCampaigns")}:`}
              name="allowedCampaignIds"
              tooltip={translate("agent.emptyMeansAllCampaigns")}
            >
              <Select
                mode="multiple"
                size="large"
                className="custom-select"
                placeholder={translate("agent.selectCampaigns")}
                allowClear
                showSearch
                optionFilterProp="label"
                optionLabelProp="label"
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
                rows={17}
                className="custom-input"
              />
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
  preference: state?.Preference?.preference || null,
}))(ModalAgentRegistry);
