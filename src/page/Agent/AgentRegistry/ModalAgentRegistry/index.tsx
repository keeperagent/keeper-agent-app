import { useEffect, useMemo } from "react";
import { Modal, Form, Input, Button, Row, Select, Switch } from "antd";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import {
  IAgentRegistry,
  ICampaign,
  IAgentSkill,
  LLMProvider,
} from "@/electron/type";
import { DEFAULT_LLM_MODELS } from "@/electron/constant";
import {
  useCreateAgentRegistry,
  useUpdateAgentRegistry,
} from "@/hook/agentRegistry";
import { useGetListAgentSkill } from "@/hook/agentSkill";
import { useTranslation } from "@/hook/useTranslation";
import { BASE_TOOL_KEYS } from "@/electron/appAgent/baseTool/registry";
import { LLM_PROVIDERS } from "@/config/llmProviders";

const { TextArea } = Input;
const { Option } = Select;

const ALL_BASE_TOOL_KEYS = Object.values(BASE_TOOL_KEYS);

type Props = {
  open: boolean;
  registry: IAgentRegistry | null;
  onClose: () => void;
  onRefresh: () => void;
  listCampaign?: ICampaign[];
  listAgentSkill?: IAgentSkill[];
};

const ModalAgentRegistry = (props: Props) => {
  const { open, registry, onClose, onRefresh, listCampaign, listAgentSkill } =
    props;
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
    if (!open) {
      return;
    }

    // Load skills once so user can select allowedSkillIds.
    if (listAgentSkill?.length === 0) {
      getListAgentSkill({ page: 1, pageSize: 100 });
    }

    if (registry) {
      const allowedBaseTools = registry.allowedBaseTools || [];
      const allowedCampaignIds = registry.allowedCampaignIds || [];
      const allowedSkillIds = registry.allowedSkillIds || [];

      form.setFieldsValue({
        name: registry.name,
        description: registry.description || "",
        llmProvider: registry.llmProvider || LLMProvider.CLAUDE,
        llmModel: registry.llmModel || "",
        systemPrompt: registry.systemPrompt || "",
        allowedBaseTools,
        allowedCampaignIds,
        allowedSkillIds,
        isAgentInteractionEnabled: Boolean(registry.isAgentInteractionEnabled),
        isActive: Boolean(registry.isActive),
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        llmProvider: LLMProvider.CLAUDE,
        isActive: true,
        isAgentInteractionEnabled: false,
        allowedBaseTools: [],
        allowedCampaignIds: [],
        allowedSkillIds: [],
      });
    }
  }, [open, registry, form, listAgentSkill, getListAgentSkill]);

  const onSubmit = async () => {
    try {
      const values = await form.validateFields();

      const data: Partial<IAgentRegistry> = {
        name: values.name,
        description: values.description || null,
        llmProvider: values.llmProvider,
        llmModel: values.llmModel || null,
        systemPrompt: values.systemPrompt || null,
        allowedBaseTools: values.allowedBaseTools || [],
        allowedCampaignIds: values.allowedCampaignIds || [],
        allowedSkillIds: values.allowedSkillIds || [],
        isAgentInteractionEnabled: Boolean(values.isAgentInteractionEnabled),
        isActive: Boolean(values.isActive),
      };

      if (isEdit && registry?.id) {
        await updateAgentRegistry({
          ...data,
          id: registry.id,
        } as IAgentRegistry);
      } else {
        await createAgentRegistry(data);
      }

      onClose();
      onRefresh();
    } catch {}
  };

  const selectedProvider = Form.useWatch("llmProvider", form);

  const modelPlaceholder = useMemo(() => {
    const provider = (selectedProvider as LLMProvider) || LLMProvider.CLAUDE;
    return DEFAULT_LLM_MODELS[provider] || "e.g. claude-sonnet-4-6";
  }, [selectedProvider]);

  return (
    <Modal
      title={
        isEdit
          ? translate("agent.editRegistry")
          : translate("agent.createRegistry")
      }
      open={open}
      onCancel={onClose}
      footer={
        <Row justify="end" style={{ gap: "0.8rem" }}>
          <Button onClick={onClose}>{translate("cancel")}</Button>
          <Button type="primary" loading={loading} onClick={onSubmit}>
            {isEdit ? translate("button.update") : translate("button.create")}
          </Button>
        </Row>
      }
      width={560}
      destroyOnClose
    >
      <Form layout="vertical" form={form}>
        <Form.Item
          label={`${translate("agent.registryName")}:`}
          name="name"
          rules={[{ required: true, message: translate("form.requiredField") }]}
        >
          <Input
            placeholder={translate("agent.enterRegistryName")}
            className="custom-input"
            size="large"
          />
        </Form.Item>

        <Form.Item label={`${translate("description")}:`} name="description">
          <TextArea
            placeholder={translate("agent.enterRegistryDesc")}
            rows={3}
            className="custom-input"
          />
        </Form.Item>

        <Form.Item
          label={`${translate("agent.llmProvider")}:`}
          name="llmProvider"
        >
          <Select size="large" className="custom-select">
            {LLM_PROVIDERS.map((option) => (
              <Option key={option.key} value={option.key} label={option.label}>
                {option.label}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label={`${translate("agent.llmModel")} (${translate("optional")}):`}
          name="llmModel"
        >
          <Input
            placeholder={modelPlaceholder}
            className="custom-input"
            size="large"
          />
        </Form.Item>

        <Form.Item
          label={`${translate("agent.systemPrompt")} (${translate("optional")}):`}
          name="systemPrompt"
        >
          <TextArea
            placeholder={translate("agent.systemPromptPlaceholder")}
            rows={5}
            className="custom-input"
          />
        </Form.Item>

        <Form.Item
          label={`${translate("agent.allowedTools")} (${translate("agent.emptyMeansAll")}):`}
          name="allowedBaseTools"
        >
          <Select
            mode="multiple"
            size="large"
            className="custom-select"
            placeholder={translate("agent.selectTools")}
            allowClear
            showSearch
            optionFilterProp="children"
          >
            {ALL_BASE_TOOL_KEYS.map((toolKey) => (
              <Option key={toolKey} value={toolKey}>
                {toolKey}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label={`${translate("agent.skills")} (${translate("agent.emptyMeansAll")}):`}
          name="allowedSkillIds"
        >
          <Select
            mode="multiple"
            size="large"
            className="custom-select"
            allowClear
            showSearch
            optionFilterProp="label"
          >
            {(listAgentSkill || []).map((skill: IAgentSkill) => (
              <Option key={skill.id} value={skill.id} label={skill.name}>
                {skill.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label={`${translate("agent.allowedCampaigns")} (${translate("agent.emptyMeansAll")}):`}
          name="allowedCampaignIds"
        >
          <Select
            mode="multiple"
            size="large"
            className="custom-select"
            placeholder={translate("agent.selectCampaigns")}
            allowClear
            showSearch
            optionFilterProp="label"
          >
            {(listCampaign || []).map((campaign: ICampaign) => (
              <Option
                key={campaign.id}
                value={campaign.id}
                label={campaign.name}
              >
                {campaign.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label={translate("agent.agentInteraction")}
          name="isAgentInteractionEnabled"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          label={translate("agent.isActive")}
          name="isActive"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default connect((state: RootState) => ({
  listCampaign: state?.Campaign?.listCampaign || [],
  listAgentSkill: state?.AgentSkill?.listAgentSkill || [],
}))(ModalAgentRegistry);
