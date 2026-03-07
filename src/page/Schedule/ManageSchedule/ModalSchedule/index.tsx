import { useEffect, useMemo, useState } from "react";
import { Modal, Form, Steps, Row, Button, Alert } from "antd";
import _ from "lodash";
import dayjs from "dayjs";
import { useGetListRunningWorkflow, useTranslation } from "@/hook";
import { updateItemInList, deleteItemInList } from "@/service/util";
import {
  useCreateSchedule,
  useUpdateSchedule,
  useCheckJobExisted,
} from "@/hook";
import { connect } from "react-redux";
import { actSetModalOpen, actSaveSelectedSchedule } from "@/redux/schedule";
import { RootState } from "@/redux/store";
import { ISchedule, IJob, IRunningWorkflow } from "@/electron/type";
import { SCHEDULE_REPEAT, SCHEDULE_REPEAT_PER_DAY } from "@/electron/constant";
import InfoForm from "./InfoForm";
import ListJob from "./ListJob";
import { Wrapper } from "./style";

const defaultScheduleWorkflow: IJob = {
  timeout: 10,
  workflowId: null,
  campaignId: null,
  secretKey: "",
  order: 0,
};
const emptyScheduleWorkflow: IJob[] = [defaultScheduleWorkflow];

interface IProps {
  isModalOpen: boolean;
  actSetModalOpen: (payload: boolean) => void;
  actSaveSelectedSchedule: (payload: ISchedule | null) => void;
  selectedSchedule: ISchedule | null;
  setCurrentStep: (value: number) => void;
  currentStep: number;
  listRunningWorkflow: IRunningWorkflow[];
}

const ModalSchedule = (props: IProps) => {
  const {
    isModalOpen,
    selectedSchedule,
    setCurrentStep,
    currentStep,
    listRunningWorkflow,
  } = props;

  const [isBtnLoading, setBtnLoading] = useState(false);
  const [listJob, setListScheduleWorkflow] = useState<IJob[]>([]);
  const [repeatPerDay, setRepeatPerDay] = useState("");
  const [repeatMode, setRepeatMode] = useState("");

  const { translate } = useTranslation();
  const [form] = Form.useForm();
  const { getListRunningWorkflow, loading: isGetListRunningWorkflowLoading } =
    useGetListRunningWorkflow();
  const {
    checkJobExisted,
    loading: isCheckJobExistedLoading,
    existedJob,
  } = useCheckJobExisted();

  const {
    loading: isCreateLoading,
    isSuccess: isCreateSuccess,
    createSchedule,
  } = useCreateSchedule();
  const {
    loading: isUpdateLoading,
    isSuccess: isUpdateSuccess,
    updateSchedule,
  } = useUpdateSchedule();

  useEffect(() => {
    if (isModalOpen) {
      getListRunningWorkflow();
    }
  }, [isModalOpen]);

  const isJobExisted = useMemo(() => {
    const job = _.find(listJob, {
      campaignId: existedJob?.campaignId,
      workflowId: existedJob?.workflowId,
    });

    return job && job?.id !== existedJob?.id;
  }, [existedJob, listJob]);

  useEffect(() => {
    form.setFieldsValue({
      isActive: selectedSchedule ? selectedSchedule?.isActive : true,
      name: selectedSchedule?.name || "",
      alertTelegram: Boolean(selectedSchedule?.alertTelegram),
      pickerTime: selectedSchedule?.startTime
        ? dayjs(selectedSchedule.startTime)
        : null,
      repeat: selectedSchedule?.repeat || SCHEDULE_REPEAT.NO_REPEAT,
      repeatPerDay:
        selectedSchedule?.repeatPerDay || SCHEDULE_REPEAT_PER_DAY.ONCE_PER_DAY,
      durationBetweenRun: selectedSchedule?.durationBetweenRun || 15,
      note: selectedSchedule?.note || "",
    });

    setRepeatPerDay(
      selectedSchedule?.repeatPerDay || SCHEDULE_REPEAT_PER_DAY.ONCE_PER_DAY,
    );
    setRepeatMode(selectedSchedule?.repeat || SCHEDULE_REPEAT.NO_REPEAT);
  }, [isModalOpen, selectedSchedule, form]);

  useEffect(() => {
    if (!selectedSchedule) {
      setListScheduleWorkflow(emptyScheduleWorkflow);
    }

    if (selectedSchedule) {
      setListScheduleWorkflow(
        selectedSchedule?.listJob || emptyScheduleWorkflow,
      );
    }
  }, [isModalOpen, selectedSchedule]);

  useEffect(() => {
    if (!isCreateLoading && isCreateSuccess) {
      setBtnLoading(false);
      onCloseModal();
    }
  }, [isCreateLoading, isCreateSuccess]);

  useEffect(() => {
    if (!isUpdateLoading && isUpdateSuccess) {
      setBtnLoading(false);
      onCloseModal();
    }
  }, [isUpdateLoading, isUpdateSuccess]);

  const onSubmitForm = async () => {
    try {
      const {
        name,
        pickerTime,
        repeat,
        isActive,
        alertTelegram,
        repeatPerDay,
        durationBetweenRun,
        note,
      } = await form.validateFields([
        "name",
        "pickerTime",
        "repeat",
        "isActive",
        "alertTelegram",
        "repeatPerDay",
        "durationBetweenRun",
        "note",
      ]);
      setBtnLoading(true);

      const date = new Date();
      date.setHours(dayjs(pickerTime).hour(), dayjs(pickerTime).minute(), 0, 0);
      const startTime = date.getTime();
      const data = {
        name,
        listJob: listJob?.map((job, index: number) => ({
          ...job,
          order: index,
          onlyRunOnce: repeat === SCHEDULE_REPEAT.NO_REPEAT,
        })),
        repeat,
        startTime,
        isActive,
        alertTelegram,
        repeatPerDay,
        durationBetweenRun,
        note,
      };

      if (selectedSchedule) {
        updateSchedule({ ...data, id: selectedSchedule?.id });
      } else {
        createSchedule(data);
      }
    } catch {}
  };

  const onCloseModal = () => {
    props?.actSetModalOpen(false);
    props?.actSaveSelectedSchedule(null);
    setTimeout(() => {
      setCurrentStep(0);
    }, 100);
  };

  const goBackStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const goNextStep = async () => {
    try {
      await form.validateFields(["repeat", "pickerTime"]);
      setCurrentStep(currentStep + 1);
    } catch {}
  };

  const onChangeJob = (job: IJob, index: number) => {
    checkJobExisted(job?.workflowId!, job?.campaignId!);
    setListScheduleWorkflow(updateItemInList(index, listJob, job));
  };

  const onAddJob = () => {
    setListScheduleWorkflow([...listJob, defaultScheduleWorkflow]);
  };

  const onRemoveJob = (index: number) => {
    setListScheduleWorkflow(deleteItemInList(index, listJob));
  };

  const isScheduleRunning = useMemo(() => {
    return (
      _.find(listRunningWorkflow, {
        scheduleId: selectedSchedule?.id,
      }) !== undefined
    );
  }, [listRunningWorkflow]);

  const isCreateJob = useMemo(() => {
    return _.isEmpty(selectedSchedule);
  }, [selectedSchedule]);

  const onChangeStep = (step: number) => {
    setCurrentStep(step);
  };

  return (
    <Modal
      title={
        isCreateJob
          ? translate("schedule.create")
          : translate("schedule.update")
      }
      open={isModalOpen}
      destroyOnHidden={true}
      maskClosable={false}
      width="47rem"
      style={{ top: "6rem" }}
      onCancel={onCloseModal}
      confirmLoading={isBtnLoading}
      footer={
        <Row justify="end">
          {currentStep === 1 && (
            <Button
              onClick={goBackStep}
              style={{ marginRight: "var(--margin-right)" }}
            >
              {translate("back")}
            </Button>
          )}

          {currentStep === 0 && (
            <Button
              onClick={goNextStep}
              style={{ marginRight: "var(--margin-right)" }}
            >
              {translate("next")}
            </Button>
          )}

          {(currentStep === 1 || selectedSchedule) && (
            <Button
              type="primary"
              onClick={onSubmitForm}
              loading={
                isCreateLoading ||
                isUpdateLoading ||
                isGetListRunningWorkflowLoading ||
                isCheckJobExistedLoading
              }
              disabled={(isScheduleRunning && !isCreateJob) || isJobExisted}
            >
              {selectedSchedule
                ? translate("button.update")
                : translate("button.createNew")}
            </Button>
          )}
        </Row>
      }
    >
      <Wrapper>
        <Steps
          onChange={onChangeStep}
          current={currentStep}
          labelPlacement="vertical"
          items={[
            {
              title: translate("info"),
            },
            {
              title: translate("config"),
            },
          ]}
          size="small"
          style={{ padding: "0 5rem" }}
        />

        {currentStep === 0 && (
          <InfoForm
            form={form}
            setRepeatPerDay={setRepeatPerDay}
            repeatPerDay={repeatPerDay}
            setRepeatMode={setRepeatMode}
            repeatMode={repeatMode}
          />
        )}
        {currentStep === 1 && (
          <ListJob
            onChangeJob={onChangeJob}
            onAddJob={onAddJob}
            onRemoveJob={onRemoveJob}
            listJob={listJob}
          />
        )}

        {isJobExisted && (
          <Alert
            type="error"
            title={
              <span>
                Each Campaign - Workflow pair can only be used in a single
                Schedule. Campaign '<strong>{existedJob?.campaignName}</strong>'
                and Workflow '<strong>{existedJob?.workflowName}</strong>' have
                been used in Schedule '
                <strong>{existedJob?.scheduleName}</strong>'
              </span>
            }
          />
        )}

        {!isCreateJob && isScheduleRunning && (
          <Alert
            type="warning"
            title={translate("schedule.stopWorkflowBeforeUpdateSchedule")}
          />
        )}
      </Wrapper>
    </Modal>
  );
};

export default connect(
  (state: RootState) => ({
    isModalOpen: state?.Schedule?.isModalOpen,
    selectedSchedule: state?.Schedule?.selectedSchedule,
    listRunningWorkflow: state?.WorkflowRunner?.listRunningWorkflow || [],
  }),
  { actSetModalOpen, actSaveSelectedSchedule },
)(ModalSchedule);
