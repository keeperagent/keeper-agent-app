import { Fragment, useEffect, useState, useMemo } from "react";
import { Tabs, Form, Input, Select, Row, Button } from "antd";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { IAgentProfile, IDebateNodeConfig } from "@/electron/type";
import { DEFAULT_TIMEOUT, NODE_ACTION } from "@/electron/simulator/constant";
import { NODE_STATUS } from "@/electron/constant";
import { useTranslation } from "@/hook";
import { useGetListAgentProfile } from "@/hook/agentProfile";
import { Wrapper } from "./style";
import { TAB_NAME_EN, TAB } from "../util";
import { FormLabelWrapper } from "../style";
import WorkflowVariable from "../../WorkflowVariable";
import CommonSetting from "../CommonSetting";
import SkipSetting from "../SkipSetting";

const { TextArea } = Input;

type Props = {
  onCloseModal: () => any;
  onSaveNodeConfig: (config: IDebateNodeConfig) => void;
  config: IDebateNodeConfig;
  isModalOpen: boolean;
  listAgentProfile: IAgentProfile[];
};

const DEFAULT_JUDGE_PROMPT =
  "You are an impartial judge. Review the debate above and deliver a final verdict. Identify the strongest arguments, acknowledge valid points from both sides, and provide a clear, unbiased conclusion.";

const Debate = (props: Props) => {
  const { translate, locale } = useTranslation();
  const {
    onCloseModal,
    onSaveNodeConfig,
    config,
    isModalOpen,
    listAgentProfile,
  } = props;
  const { getListAgentProfile } = useGetListAgentProfile();

  const [activeTab, setActiveTab] = useState(TAB.DETAIL);
  const [isSkip, setIsSkip] = useState(false);
  const [rounds, setRounds] = useState(3);
  const [form] = Form.useForm();

  const TAB_NAME = useMemo(() => {
    return TAB_NAME_EN;
  }, [locale]);

  useEffect(() => {
    getListAgentProfile({ page: 1, pageSize: 999 });
  }, []);

  useEffect(() => {
    setRounds(config?.rounds || 3);
    form.setFieldsValue({
      name: config?.name,
      sleep: config?.sleep,
      onSuccess: config?.onSuccess || NODE_ACTION.CONTINUE_RUN,
      onError: config?.onError || NODE_ACTION.PAUSE_THREAD,
      timeout: config?.timeout || DEFAULT_TIMEOUT / 1000,
      leftSide: config?.skipSetting?.leftSide,
      condition: config?.skipSetting?.condition,
      rightSide: config?.skipSetting?.rightSide,
      alertTelegramWhenError: config?.alertTelegramWhenError,
      retry: config?.retry || 0,
      variable: config?.variable || "DEBATE_OUTPUT",
      topic: config?.topic || "",
      agentAProfileId: config?.agentAProfileId,
      agentAPersona: config?.agentAPersona || "",
      agentBProfileId: config?.agentBProfileId,
      agentBPersona: config?.agentBPersona || "",
      judgeAgentProfileId: config?.judgeAgentProfileId,
      judgePrompt: config?.judgePrompt || DEFAULT_JUDGE_PROMPT,
      includeTranscript: config?.includeTranscript || false,
      maxConcurrency: config?.maxConcurrency || 0,
    });
    setActiveTab(TAB.DETAIL);
    setIsSkip(Boolean(config?.skipSetting?.isSkip));
  }, [isModalOpen, config, form]);

  const onSubmit = async () => {
    try {
      const {
        sleep,
        name,
        onSuccess,
        timeout,
        onError,
        leftSide,
        condition,
        rightSide,
        alertTelegramWhenError,
        retry,
        variable,
        topic,
        agentAProfileId,
        agentAPersona,
        agentBProfileId,
        agentBPersona,
        judgeAgentProfileId,
        judgePrompt,
        includeTranscript,
        maxConcurrency,
      } = await form.validateFields();

      onSaveNodeConfig({
        sleep,
        name,
        timeout,
        status: NODE_STATUS.RUN,
        onError,
        onSuccess,
        skipSetting: { leftSide, rightSide, condition, isSkip },
        alertTelegramWhenError,
        retry,
        variable,
        topic,
        rounds,
        agentAProfileId,
        agentAPersona,
        agentBProfileId,
        agentBPersona,
        judgeAgentProfileId,
        judgePrompt,
        includeTranscript,
        maxConcurrency,
      });
      onCloseModal();
    } catch {}
  };

  const agentProfileOptions = listAgentProfile.map((agentProfile) => ({
    label: agentProfile.name,
    value: agentProfile.id,
  }));

  return (
    <Wrapper>
      <Tabs
        onChange={setActiveTab}
        type="card"
        size="small"
        items={[
          { label: TAB_NAME[TAB.DETAIL], key: TAB.DETAIL },
          { label: TAB_NAME[TAB.SETTING], key: TAB.SETTING },
          { label: TAB_NAME[TAB.SKIP], key: TAB.SKIP },
        ]}
        activeKey={activeTab}
      />

      <Form layout="vertical" form={form} initialValues={{ sleep: 0 }}>
        {activeTab === TAB.DETAIL && (
          <Fragment>
            <Form.Item
              label={`${translate("workflow.variableToSaveResult")}:`}
              name="variable"
              rules={[
                { required: true, message: translate("form.requiredField") },
              ]}
            >
              <Input
                className="custom-input"
                size="large"
                placeholder="DEBATE_OUTPUT"
                onInput={(inputEvent) =>
                  ((inputEvent.target as HTMLInputElement).value = (
                    inputEvent.target as HTMLInputElement
                  ).value
                    .toUpperCase()
                    .replaceAll(" ", ""))
                }
              />
            </Form.Item>

            {/* Step 1 — Topic */}
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <Form.Item
                  label={
                    <FormLabelWrapper>
                      <span className="text">
                        {translate("workflow.debate.topic")}:
                      </span>
                      <WorkflowVariable form={form} fieldName="topic" />
                    </FormLabelWrapper>
                  }
                  name="topic"
                  rules={[
                    {
                      required: true,
                      message: translate("form.requiredField"),
                    },
                  ]}
                >
                  <TextArea
                    className="custom-input"
                    size="large"
                    rows={2}
                    placeholder={translate("workflow.debate.topicPlaceholder")}
                  />
                </Form.Item>
              </div>
            </div>

            {/* Step 2 — Debaters */}
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <div className="step-title">
                  {translate("workflow.debate.debaters")}
                </div>

                <div className="agent-label a">Agent A</div>
                <Form.Item name="agentAProfileId">
                  <Select
                    className="custom-select"
                    size="large"
                    placeholder={translate(
                      "workflow.debate.selectAgentProfile",
                    )}
                    options={agentProfileOptions}
                    showSearch
                    filterOption={false}
                  />
                </Form.Item>

                <Form.Item
                  label={
                    <FormLabelWrapper>
                      <span className="text">
                        {translate("workflow.debate.persona")}:
                      </span>
                      <WorkflowVariable form={form} fieldName="agentAPersona" />
                    </FormLabelWrapper>
                  }
                  name="agentAPersona"
                  rules={[
                    {
                      required: true,
                      message: translate("form.requiredField"),
                    },
                  ]}
                >
                  <TextArea
                    className="custom-input"
                    size="large"
                    rows={2}
                    placeholder={translate(
                      "workflow.debate.agentAPersonaPlaceholder",
                    )}
                  />
                </Form.Item>

                <div className="vs-divider">
                  <span className="vs-text">VS</span>
                </div>

                <div className="agent-label b">Agent B</div>
                <Form.Item name="agentBProfileId">
                  <Select
                    className="custom-select"
                    size="large"
                    placeholder={translate(
                      "workflow.debate.selectAgentProfile",
                    )}
                    options={agentProfileOptions}
                    showSearch
                    filterOption={false}
                  />
                </Form.Item>

                <Form.Item
                  label={
                    <FormLabelWrapper>
                      <span className="text">
                        {translate("workflow.debate.persona")}:
                      </span>
                      <WorkflowVariable form={form} fieldName="agentBPersona" />
                    </FormLabelWrapper>
                  }
                  name="agentBPersona"
                  rules={[
                    {
                      required: true,
                      message: translate("form.requiredField"),
                    },
                  ]}
                >
                  <TextArea
                    className="custom-input"
                    size="large"
                    rows={2}
                    placeholder={translate(
                      "workflow.debate.agentBPersonaPlaceholder",
                    )}
                  />
                </Form.Item>
              </div>
            </div>

            {/* Step 3 — Rounds */}
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <div className="step-title">
                  {translate("workflow.debate.rounds")}
                </div>

                <div className="step-hint">
                  {translate("workflow.debate.roundsHint")}
                </div>

                <div className="rounds-wrapper">
                  {[1, 2, 3, 4, 5].map((roundNumber) => (
                    <div
                      key={roundNumber}
                      className={`round-dot ${rounds === roundNumber ? "active" : ""}`}
                      onClick={() => setRounds(roundNumber)}
                    >
                      {roundNumber}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 4 — Judge */}
            <div className="step">
              <div className="step-number">4</div>
              <div className="step-content">
                <div className="step-title">
                  {translate("workflow.debate.judge")}
                </div>

                <Form.Item name="judgeAgentProfileId">
                  <Select
                    className="custom-select"
                    size="large"
                    placeholder={translate("workflow.debate.judgeProfile")}
                    options={agentProfileOptions}
                    showSearch
                    filterOption={false}
                  />
                </Form.Item>

                <Form.Item
                  label={
                    <FormLabelWrapper>
                      <span className="text">
                        {translate("workflow.debate.judgeInstructions")}:
                      </span>
                      <WorkflowVariable form={form} fieldName="judgePrompt" />
                    </FormLabelWrapper>
                  }
                  name="judgePrompt"
                  rules={[
                    {
                      required: true,
                      message: translate("form.requiredField"),
                    },
                  ]}
                >
                  <TextArea
                    className="custom-input"
                    size="large"
                    rows={2}
                    placeholder={translate(
                      "workflow.debate.judgeInstructionsPlaceholder",
                    )}
                  />
                </Form.Item>

                <Form.Item
                  label={`${translate("workflow.debate.output")}:`}
                  name="includeTranscript"
                >
                  <Select
                    className="custom-select"
                    size="large"
                    options={[
                      {
                        label: translate("workflow.debate.verdictOnly"),
                        value: false,
                      },
                      {
                        label: translate(
                          "workflow.debate.verdictWithTranscript",
                        ),
                        value: true,
                      },
                    ]}
                  />
                </Form.Item>
              </div>
            </div>
          </Fragment>
        )}

        {activeTab === TAB.SETTING && <CommonSetting />}

        {activeTab === TAB.SKIP && (
          <SkipSetting form={form} setIsSkip={setIsSkip} isSkip={isSkip} />
        )}
      </Form>

      <Row justify="end">
        <Button
          onClick={onCloseModal}
          style={{ marginRight: "var(--margin-right)" }}
        >
          {translate("cancel")}
        </Button>
        <Button onClick={onSubmit} type="primary">
          {translate("button.update")}
        </Button>
      </Row>
    </Wrapper>
  );
};

export default connect(
  (state: RootState) => ({
    listAgentProfile: state?.AgentProfile?.listAgentProfile || [],
  }),
  {},
)(Debate);
