import { useState, useEffect, useMemo } from "react";
import {
  Modal,
  InputNumber,
  Tag,
  Select,
  Form,
  Button,
  Row,
  Alert,
} from "antd";
import { connect } from "react-redux";
import _ from "lodash";
import { useLocation, useNavigate } from "react-router-dom";
import { RootState } from "@/redux/store";
import {
  useCreateProfile,
  useGetListProfileGroup,
  useTranslation,
} from "@/hook";
import { IProfileGroup, IResourceGroup } from "@/electron/type";
import { actSaveSelectedProfileGroup } from "@/redux/profileGroup";
import ProfileConfigChart from "../../ProfileConfigChart";
import { ModalWrapper } from "./style";
import { VIEW_MODE } from "../../index";
import qs from "qs";

type IModalProfileProps = {
  isModalOpen: boolean;
  setModalOpen: (value: boolean) => void;
  selectedProfileGroup: IProfileGroup | null;
  listProfileGroup: IProfileGroup[];
  actSaveSelectedProfileGroup: (payload: IProfileGroup | null) => void;
  setShouldRefetch: (value: boolean) => void;
};

const ModalProfile = (props: IModalProfileProps) => {
  const { translate } = useTranslation();
  const {
    isModalOpen,
    setModalOpen,
    selectedProfileGroup,
    listProfileGroup,
    setShouldRefetch,
  } = props;
  const [numberOfProfile, setNumberOfProfile] = useState(1);
  const [form] = Form.useForm();
  const { getListProfileGroup } = useGetListProfileGroup();
  const navigate = useNavigate();

  const location = useLocation();
  const { search } = location;
  const { group } = qs.parse(search, { ignoreQueryPrefix: true });

  const {
    createProfile,
    loading: isCreateLoading,
    isSuccess: isCreateSuccess,
  } = useCreateProfile();

  useEffect(() => {
    if (group) {
      props?.actSaveSelectedProfileGroup(
        _.find(
          listProfileGroup,
          (profileGroup: IProfileGroup) => profileGroup?.id === Number(group),
        ) || null,
      );
    }
  }, [group, listProfileGroup]);

  useEffect(() => {
    getListProfileGroup({
      page: 1,
      pageSize: 10000,
    });
  }, []);

  const maxProfile = useMemo(() => {
    const listCount = [
      ..._.map(
        selectedProfileGroup?.listResourceGroup,
        (group: IResourceGroup) => group?.totalResource,
      ),
      selectedProfileGroup?.walletGroup?.totalWallet,
    ];

    return _.max(listCount) || 0;
  }, [selectedProfileGroup]);

  useEffect(() => {
    setNumberOfProfile(Math.round((maxProfile * 25) / 100));
  }, [maxProfile]);

  const onCloseModal = () => {
    setModalOpen(false);
    navigate(
      `/dashboard/profile?group=${selectedProfileGroup?.id}&mode=${VIEW_MODE.PROFILE}`,
    );
  };

  useEffect(() => {
    if (!isCreateLoading && isCreateSuccess) {
      setShouldRefetch(true);
      onCloseModal();
    }
  }, [isCreateLoading, isCreateSuccess]);

  const onSubmitForm = async () => {
    if (selectedProfileGroup) {
      createProfile({
        numberOfProfile,
        walletGroupId: selectedProfileGroup?.walletGroup?.id!,
        listResourceGroupId: selectedProfileGroup?.listResourceGroupId!,
        groupId: selectedProfileGroup?.id!,
      });
    }
  };

  const onClickTag = (value: number) => {
    setNumberOfProfile(Math.round((maxProfile * value) / 100));
  };

  const onChangeInput = (value: number | null) => {
    setNumberOfProfile(value || 0);
  };

  const listOption = maxProfile >= 4 ? [25, 50, 75, 100] : [50, 100];

  return (
    <Modal
      open={isModalOpen}
      title={translate("profile.createNewProfile")}
      onCancel={onCloseModal}
      maskClosable={false}
      footer={
        <Row justify="end">
          <Button onClick={onCloseModal} style={{ marginRight: "1rem" }}>
            {translate("cancel")}
          </Button>
          <Button
            type="primary"
            onClick={onSubmitForm}
            disabled={maxProfile === 0 || numberOfProfile === 0}
            loading={isCreateLoading}
          >
            {translate("button.create")}
          </Button>
        </Row>
      }
      width="45rem"
      destroyOnHidden={true}
    >
      <ModalWrapper>
        <Form layout="vertical" form={form} style={{ marginTop: "2rem" }}>
          <Form.Item label={`${translate("groupName")}:`}>
            <Select
              size="large"
              className="custom-select"
              options={listProfileGroup?.map((group: IProfileGroup) => ({
                value: group?.id,
                label: group?.name,
              }))}
              value={selectedProfileGroup?.id}
              disabled={true}
            />
          </Form.Item>
        </Form>

        <div className="chart">
          <ProfileConfigChart
            listResourceGroup={selectedProfileGroup?.listResourceGroup || []}
            listWalletGroup={
              selectedProfileGroup?.walletGroup
                ? [selectedProfileGroup?.walletGroup]
                : []
            }
          />
        </div>

        <div className="slider">
          <div className="statistic">
            <div className="item">
              <div className="label">{translate("profile.maxProfile")}:</div>
              <div className="value">{maxProfile}</div>
            </div>

            <div className="item">
              <div className="label">
                {translate("profile.numberOfProfile")}:
              </div>

              <div className="option">
                {listOption?.map((value: number, index: number) => (
                  <Tag
                    className={
                      Math.round((maxProfile * value) / 100) === numberOfProfile
                        ? "tag active"
                        : "tag"
                    }
                    key={index}
                    onClick={() => onClickTag(value)}
                  >
                    {value}%
                  </Tag>
                ))}
              </div>

              <div className="value">
                <InputNumber
                  value={numberOfProfile}
                  className="custom-input-number"
                  style={{ width: "100%", marginTop: "1rem" }}
                  onChange={onChangeInput}
                  min={1}
                  max={maxProfile}
                />
              </div>
            </div>
          </div>
        </div>

        {maxProfile === 0 && (
          <Alert
            title={translate("profile.cannotCreateProfileWarning")}
            type="warning"
            showIcon
            closable={false}
          />
        )}
      </ModalWrapper>
    </Modal>
  );
};

export default connect(
  (state: RootState) => ({
    selectedProfile: state?.Profile?.selectedProfile,
    selectedProfileGroup: state?.ProfileGroup?.selectedProfileGroup,
    listProfileGroup: state?.ProfileGroup?.listProfileGroup,
  }),
  { actSaveSelectedProfileGroup },
)(ModalProfile);
