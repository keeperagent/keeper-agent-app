import { useEffect, useMemo, useState } from "react";
import _ from "lodash";
import { Modal, Steps, Button, Row } from "antd";
import { useTranslation } from "@/hook";
import { MESSAGE } from "@/electron/constant";
import { Wrapper } from "./style";

type IProps = {
  isModalOpen: boolean;
  setModalOpen: (value: boolean) => void;
  isDeleteCampaign: boolean;
};

const ModalDeleteProfile = (props: IProps) => {
  const { isModalOpen, setModalOpen, isDeleteCampaign } = props;

  const [deleteFolderProgress, setDeleteFolderProgress] = useState(0);
  const [deleteProfileProgress, setDeleteProfileProgress] = useState(0);
  const [deleteScheduleProgress, setDeleteScheduleProgress] = useState(0);
  const [deleteCampaignProgress, setDeleteCampaignProgress] = useState(0);

  const { translate } = useTranslation();

  useEffect(() => {
    window?.electron?.on(
      MESSAGE.DELETE_PROFILE_FOLDER_PROGRESS_RES,
      (event: any, payload: any) => {
        setDeleteFolderProgress(payload?.data);
      }
    );
  }, []);

  useEffect(() => {
    window?.electron?.on(
      MESSAGE.DELETE_CAMPAIGN_PROFILE_PROGRESS_RES,
      (event: any, payload: any) => {
        setDeleteProfileProgress(payload?.data);
      }
    );
  }, []);

  useEffect(() => {
    window?.electron?.on(
      MESSAGE.DELETE_JOB_RELATED_TO_CAMPAIGN_RES,
      (_event: any, _payload: any) => {
        setDeleteScheduleProgress(100);
      }
    );
  }, []);

  useEffect(() => {
    window?.electron?.on(
      MESSAGE.DELETE_CAMPAIGN_RES,
      (_event: any, _payload: any) => {
        setDeleteCampaignProgress(100);
      }
    );
  }, []);

  const step = useMemo(() => {
    if (deleteFolderProgress !== 100) {
      return 0;
    }

    if (deleteProfileProgress !== 100) {
      return 1;
    }

    if (deleteScheduleProgress !== 100) {
      return 2;
    }

    return 3;
  }, [deleteFolderProgress, deleteProfileProgress, deleteScheduleProgress]);

  const percentage = useMemo(() => {
    if (deleteFolderProgress !== 100) {
      return deleteFolderProgress;
    }

    if (deleteProfileProgress !== 100) {
      return deleteProfileProgress;
    }

    if (deleteScheduleProgress !== 100) {
      return deleteScheduleProgress;
    }

    return deleteCampaignProgress;
  }, [
    deleteFolderProgress,
    deleteProfileProgress,
    deleteScheduleProgress,
    deleteCampaignProgress,
  ]);

  const allowClose = useMemo(() => {
    if (isDeleteCampaign) {
      return step === 3 && deleteCampaignProgress === 100;
    }

    return step === 2 && deleteProfileProgress === 100;
  }, [isDeleteCampaign, step, deleteCampaignProgress, deleteProfileProgress]);

  const onCloseModal = () => {
    setModalOpen(false);

    setTimeout(() => {
      setDeleteFolderProgress(0);
      setDeleteProfileProgress(0);
    }, 1000);
  };

  const getStepStatus = (index: number) => {
    if (step === index) {
      return "process";
    }
    if (step > index) {
      return "finish";
    }
    return "wait";
  };

  return (
    <Modal
      open={isModalOpen}
      footer={null}
      title={
        isDeleteCampaign
          ? translate("campaign.deleteCampaignProgress")
          : translate("campaign.deleteProfileProgress")
      }
      mask={{ closable: false }}
      closeIcon={null}
    >
      <Wrapper>
        <Steps
          direction="vertical"
          current={step}
          percent={percentage}
          items={_.slice(
            [
              {
                title: (
                  <span className="step-label">
                    {translate("campaign.deleteProfileFolder")}
                  </span>
                ),
                description: `${deleteFolderProgress}%`,
                status: getStepStatus(0),
              },
              {
                title: (
                  <span className="step-label">
                    {translate("campaign.deleteProfileInDatabase")}
                  </span>
                ),
                description: `${deleteProfileProgress}%`,
                status: getStepStatus(1),
              },
              {
                title: (
                  <span className="step-label">
                    {translate("campaign.deleteScheduleByCampaign")}
                  </span>
                ),
                description: `${deleteScheduleProgress}%`,
                status: getStepStatus(2),
              },
              {
                title: (
                  <span className="step-label">
                    {translate("campaign.deleteCampaignInDatabase")}
                  </span>
                ),
                description: `${deleteCampaignProgress}%`,
                status: getStepStatus(3),
              },
            ],
            0,
            isDeleteCampaign ? 4 : 2
          )}
        />

        <Row justify="end">
          <Button type="primary" onClick={onCloseModal} loading={!allowClose}>
            {translate("close")}
          </Button>
        </Row>
      </Wrapper>
    </Modal>
  );
};

export default ModalDeleteProfile;
