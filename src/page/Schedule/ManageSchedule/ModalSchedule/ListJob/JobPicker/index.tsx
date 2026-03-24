import { Fragment, useEffect, useState } from "react";
import {
  Select,
  Form,
  Tooltip,
  Tabs,
  InputNumber,
  Input,
  Segmented,
} from "antd";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { useTranslation, useGetListCampaign } from "@/hook";
import {
  ICampaign,
  IWorkflow,
  IJob,
  LLMProvider,
  JobType,
} from "@/electron/type";
import { TrashBoldIcon } from "@/component/Icon";
import { LlmProviderPicker } from "@/component";
import { PasswordInput } from "@/component/Input";
import { EMPTY_STRING } from "@/config/constant";
import { Wrapper, OptionWrapper } from "./style";

const { Option } = Select;

type IProps = {
  listCampaign: ICampaign[];
  job: IJob;
  onChangeJob: (job: IJob, index: number) => void;
  onRemoveJob: (index: number) => void;
  index: number;
  isModalOpen: boolean;
};

const VIEW_MODE = {
  DETAIL: "DETAIL",
  SETTING: "SETTING",
};

let searchCampaignTimeOut: any = null;

const JobPicker = (props: IProps) => {
  const { listCampaign, job, onChangeJob, onRemoveJob, index, isModalOpen } =
    props;

  const [viewMode, setViewMode] = useState(VIEW_MODE.DETAIL);
  const [campaign, setCampaign] = useState<ICampaign | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [previousJob, setPreviousJob] = useState<IJob | null>(null);

  const [form] = Form.useForm();
  const { translate } = useTranslation();
  const { getListCampaign, loading: getListCampaignLoading } =
    useGetListCampaign();

  const jobType = job.type || JobType.WORKFLOW;

  const onSearchCampaign = (text: string) => {
    if (searchCampaignTimeOut) {
      clearTimeout(searchCampaignTimeOut);
    }
    searchCampaignTimeOut = setTimeout(() => {
      getListCampaign({ page: 1, pageSize: 1000, searchText: text });
    }, 200);
  };

  useEffect(() => {
    if (
      previousJob?.campaignId !== job?.campaignId ||
      previousJob?.workflowId !== job?.workflowId ||
      previousJob?.timeout !== job?.timeout ||
      previousJob?.secretKey !== job?.secretKey ||
      previousJob?.prompt !== job?.prompt
    ) {
      form.setFieldsValue({
        campaignId: job?.campaignId,
        workflowId: job?.workflowId,
        timeout: job?.timeout || 0,
        secretKey: job?.secretKey || "",
        prompt: job?.prompt || "",
      });
    }

    if (!initialized) {
      form.setFieldsValue({
        secretKey: "",
      });
      setInitialized(true);
    }

    setPreviousJob(job);
  }, [job, previousJob, initialized]);

  useEffect(() => {
    if (!isModalOpen) {
      setInitialized(false);
    }
  }, [isModalOpen]);

  useEffect(() => {
    setCampaign(
      listCampaign?.find((campaign) => campaign?.id === job?.campaignId) ||
        null,
    );
  }, [listCampaign, job]);

  const onChangeJobType = (type: string) => {
    if (type === JobType.AGENT) {
      onChangeJob(
        {
          ...job,
          type: JobType.AGENT,
          workflowId: null,
          campaignId: null,
          secretKey: "",
          llmProvider: job.llmProvider || LLMProvider.CLAUDE,
        },
        index,
      );
    } else {
      onChangeJob(
        {
          ...job,
          type: JobType.WORKFLOW,
          prompt: undefined,
          llmProvider: undefined,
        },
        index,
      );
    }
  };

  const onChangeCampaign = (campaignId: number) => {
    onChangeJob({ ...job, campaignId }, index);
    setCampaign(
      listCampaign?.find((campaign) => campaign?.id === campaignId) || null,
    );
  };

  const onChangeWorkflow = (value: number) => {
    onChangeJob({ ...job, workflowId: value }, index);
  };

  const onChangeEncryptKey = (value: string) => {
    onChangeJob({ ...job, secretKey: value }, index);
    form.setFieldsValue({ secretKey: value });
  };

  const onChangeTimeout = (value: number | null) => {
    onChangeJob({ ...job, timeout: value || 0 }, index);
  };

  const onChangePrompt = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChangeJob({ ...job, prompt: e.target.value }, index);
  };

  const onChangeProvider = (providerKey: string) => {
    onChangeJob({ ...job, llmProvider: providerKey }, index);
  };

  const onChangeViewMode = (key: string) => {
    setViewMode(key);
  };

  const currentProvider = job.llmProvider || LLMProvider.CLAUDE;

  return (
    <Wrapper>
      <Segmented
        size="small"
        options={[
          {
            label: translate("schedule.typeWorkflow"),
            value: JobType.WORKFLOW,
          },
          { label: translate("schedule.typeAgent"), value: JobType.AGENT },
        ]}
        value={jobType}
        onChange={(jobType) => onChangeJobType(jobType as string)}
        style={{ marginBottom: "1rem" }}
      />

      {jobType === JobType.WORKFLOW ? (
        <Fragment>
          <Tabs
            onChange={onChangeViewMode}
            size="small"
            items={[
              {
                label: translate("schedule.detail"),
                key: VIEW_MODE.DETAIL,
              },
              {
                label: translate("schedule.setting"),
                key: VIEW_MODE.SETTING,
              },
            ]}
            activeKey={viewMode}
          />

          <Form layout="vertical" form={form}>
            {viewMode === VIEW_MODE.DETAIL ? (
              <Fragment>
                <Form.Item
                  label={`${translate("sidebar.campaign")}:`}
                  name="campaignId"
                  rules={[
                    {
                      required: true,
                      message: translate("form.requiredField"),
                    },
                  ]}
                >
                  <Select
                    size="large"
                    className="custom-select"
                    placeholder={translate("schedule.selectCampaign")}
                    showSearch
                    onSearch={onSearchCampaign}
                    filterOption={false}
                    value={job?.campaignId}
                    loading={getListCampaignLoading}
                    onChange={onChangeCampaign}
                    optionLabelProp="label"
                  >
                    {listCampaign?.map((campaign: ICampaign) => (
                      <Option
                        key={campaign?.id}
                        value={campaign?.id}
                        label={campaign?.name}
                      >
                        <OptionWrapper>
                          <div className="name">
                            {campaign?.name || EMPTY_STRING}
                          </div>
                          <div className="description">
                            {campaign?.note || EMPTY_STRING}
                          </div>
                        </OptionWrapper>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  label={`${translate("sidebar.workflow")}:`}
                  name="workflowId"
                  rules={[
                    {
                      required: true,
                      message: translate("form.requiredField"),
                    },
                  ]}
                >
                  <Select
                    size="large"
                    className="custom-select"
                    placeholder={translate("campaign.selectWorkflow")}
                    value={job?.workflowId}
                    onChange={onChangeWorkflow}
                    optionLabelProp="label"
                  >
                    {campaign?.listWorkflow?.map((workflow: IWorkflow) => (
                      <Option
                        key={workflow?.id}
                        value={workflow?.id}
                        label={workflow?.name}
                      >
                        <OptionWrapper>
                          <div className="name">
                            {workflow?.name || EMPTY_STRING}
                          </div>
                          <div className="description">
                            {workflow?.note || EMPTY_STRING}
                          </div>
                        </OptionWrapper>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Fragment>
            ) : (
              <Fragment>
                <Form.Item
                  label={`${translate("schedule.timeout")}:`}
                  name="timeout"
                >
                  <InputNumber
                    placeholder={translate("schedule.timeoutPlaceholder")}
                    className="custom-input-number"
                    size="large"
                    style={{ width: "100%" }}
                    min={1}
                    value={job?.timeout}
                    onChange={onChangeTimeout}
                  />
                </Form.Item>

                <Form.Item
                  label={`${translate("wallet.secretKey")}:`}
                  name="secretKey"
                  className="input-password-wrapper"
                >
                  <PasswordInput
                    name="secretKey"
                    placeholder={translate("wallet.secretKey")}
                    onChange={onChangeEncryptKey}
                    extendClass={`secretKey-${index}`}
                    initialValue={job?.secretKey}
                    shouldHideValue={true}
                  />
                </Form.Item>
              </Fragment>
            )}
          </Form>
        </Fragment>
      ) : (
        <Form layout="vertical" form={form}>
          <Form.Item
            label={`${translate("schedule.agentPrompt")}:`}
            name="prompt"
            rules={[
              { required: true, message: translate("form.requiredField") },
            ]}
          >
            <Input.TextArea
              rows={4}
              placeholder={translate("schedule.agentPrompt")}
              onChange={onChangePrompt}
            />
          </Form.Item>

          <Form.Item label={`${translate("schedule.llmProvider")}:`}>
            <LlmProviderPicker
              value={currentProvider}
              onChange={onChangeProvider}
            />
          </Form.Item>
        </Form>
      )}

      <div className="tool">
        {index > 0 ? (
          <Tooltip title={translate("remove")}>
            <div className="delete" onClick={() => onRemoveJob(index)}>
              <TrashBoldIcon />
            </div>
          </Tooltip>
        ) : null}

        <div className="order">
          <span>{index + 1}</span>
        </div>
      </div>
    </Wrapper>
  );
};

export default connect(
  (state: RootState) => ({
    listCampaign: state?.Campaign?.listCampaign,
    isModalOpen: state?.Schedule?.isModalOpen,
  }),
  {},
)(JobPicker);
