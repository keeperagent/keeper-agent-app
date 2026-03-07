import { useEffect, useRef } from "react";
import { Form, Input, Select } from "antd";
import { connect } from "react-redux";
import _ from "lodash";
import { RootState } from "@/redux/store";
import { ICampaignProfile, IProfileGroup, IWorkflow } from "@/electron/type";
import {
  useGetListWorkflow,
  useGetListProfileGroup,
  useTranslation,
  useGetListCampaignProfile,
} from "@/hook";
import { PROFILE_TYPE } from "@/electron/constant";
import { TagOption } from "@/component";
import { EMPTY_STRING } from "@/config/constant";
import { Wrapper, OptionWrapper } from "./style";

const { TextArea } = Input;

const { Option } = Select;
let searchProfileGroupTimeOut: any = null;
let searchWorkflowTimeOut: any = null;
let searchCampaignProfileTimeout: any = null;

const InfoForm = (props: any) => {
  const { translate } = useTranslation();
  const {
    listWorkflow,
    listProfileGroup,
    isModalOpen,
    profileType,
    setProfileType,
    listCampaignProfile,
    selectedCampaign,
  } = props;
  const inputRef = useRef<HTMLInputElement>(null);
  const { getListProfileGroup } = useGetListProfileGroup();
  const { getListWorkflow } = useGetListWorkflow();
  const { getListCampaignProfile, loading: searchCampaignProfileLoading } =
    useGetListCampaignProfile();

  useEffect(() => {
    getListProfileGroup({ page: 1, pageSize: 100000 });
    getListWorkflow({ page: 1, pageSize: 100000 });

    return () => {
      searchProfileGroupTimeOut = null;
      searchWorkflowTimeOut = null;
    };
  }, []);

  useEffect(() => {
    if (profileType === PROFILE_TYPE.CUSTOM_SELECT) {
      getListCampaignProfile({
        page: 1,
        pageSize: 300,
        campaignId: selectedCampaign?.id,
      });
    }
  }, [profileType, selectedCampaign]);

  useEffect(() => {
    if (
      isModalOpen &&
      !searchProfileGroupTimeOut &&
      !searchWorkflowTimeOut &&
      !searchCampaignProfileTimeout
    ) {
      setTimeout(() => {
        inputRef?.current?.focus();
      }, 100);
    }
  }, [isModalOpen]);

  const onSearchProfileGroup = (text: string) => {
    if (searchProfileGroupTimeOut) {
      clearTimeout(searchProfileGroupTimeOut);
    }
    searchProfileGroupTimeOut = setTimeout(() => {
      getListProfileGroup({ page: 1, pageSize: 100, searchText: text });
    }, 200);
  };

  const onSearchCampaignProfile = (text: string) => {
    if (searchCampaignProfileTimeout) {
      clearTimeout(searchCampaignProfileTimeout);
    }
    searchCampaignProfileTimeout = setTimeout(() => {
      getListCampaignProfile({
        page: 1,
        pageSize: 10000,
        searchText: text,
        campaignId: selectedCampaign?.id,
      });
    }, 200);
  };

  const onSearchWorkflow = (text: string) => {
    if (searchWorkflowTimeOut) {
      clearTimeout(searchWorkflowTimeOut);
    }
    searchWorkflowTimeOut = setTimeout(() => {
      getListWorkflow({ page: 1, pageSize: 10000, searchText: text });
    }, 200);
  };

  return (
    <Wrapper>
      <Form.Item
        label={`${translate("campaign.name")}:`}
        name="name"
        colon={true}
        rules={[
          {
            required: true,
            message: translate("form.requiredField"),
          },
        ]}
      >
        <Input
          placeholder={translate("campaign.enterName")}
          className="custom-input"
          size="large"
          // @ts-ignore
          ref={inputRef}
        />
      </Form.Item>

      <Form.Item
        label={`${translate("campaign.workflow")}:`}
        name="listWorkflowId"
      >
        <Select
          placeholder={translate("campaign.selectWorkflow")}
          size="large"
          className="custom-select"
          mode="multiple"
          showSearch
          onSearch={onSearchWorkflow}
          filterOption={false}
          optionLabelProp="label"
        >
          {listWorkflow?.map((group: IWorkflow) => (
            <Option key={group?.id} value={group?.id} label={group?.name}>
              <OptionWrapper>
                <div className="name">{group?.name || EMPTY_STRING}</div>
                <div className="description">{group?.note || EMPTY_STRING}</div>
              </OptionWrapper>
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        label={`${translate("profile.profileGroup")}:`}
        name="profileGroupId"
      >
        <Select
          placeholder={translate("campaign.selectProfileGroup")}
          size="large"
          className="custom-select"
          showSearch
          onSearch={onSearchProfileGroup}
          filterOption={false}
          optionLabelProp="label"
          disabled={!_.isEmpty(selectedCampaign)}
        >
          {listProfileGroup?.map((group: IProfileGroup) => (
            <Option key={group?.id} value={group?.id} label={group?.name}>
              <OptionWrapper>
                <div className="name">{group?.name || EMPTY_STRING}</div>
                <div className="description">{group?.note || EMPTY_STRING}</div>
              </OptionWrapper>
            </Option>
          ))}
        </Select>
      </Form.Item>

      <div className="mode">
        <TagOption
          content={translate("campaign.allProfile")}
          checked={profileType === PROFILE_TYPE.ALL_PROFILE}
          onClick={() => setProfileType(PROFILE_TYPE.ALL_PROFILE)}
          style={{ fontSize: "1.1rem" }}
        />

        <TagOption
          content={translate("campaign.customProfile")}
          checked={profileType === PROFILE_TYPE.CUSTOM_SELECT}
          onClick={() => setProfileType(PROFILE_TYPE.CUSTOM_SELECT)}
          style={{ fontSize: "1.1rem" }}
        />
      </div>

      {profileType === PROFILE_TYPE.CUSTOM_SELECT && (
        <Form.Item
          label={`${translate("campaign.profileToRun")}`}
          name="listCampaignProfileId"
          rules={[
            {
              required: true,
              message: translate("form.requiredField"),
            },
          ]}
        >
          <Select
            placeholder={translate("campaign.selectProfile")}
            size="large"
            className="custom-select"
            options={_.uniqBy(
              [
                ...listCampaignProfile,
                ...(selectedCampaign?.listCampaignProfile || []),
              ],
              "id",
            )?.map((campaignProfile: ICampaignProfile) => ({
              value: campaignProfile?.id,
              label: campaignProfile?.name,
            }))}
            mode="multiple"
            showSearch
            onSearch={onSearchCampaignProfile}
            filterOption={false}
            loading={searchCampaignProfileLoading}
          />
        </Form.Item>
      )}

      <Form.Item label={`${translate("describe")}:`} name="note">
        <TextArea
          placeholder={translate("enterDescribe")}
          rows={3}
          className="custom-input"
        />
      </Form.Item>
    </Wrapper>
  );
};

export default connect(
  (state: RootState) => ({
    listProfileGroup: state?.ProfileGroup?.listProfileGroup,
    listWorkflow: state?.Workflow?.listWorkflow,
    listCampaignProfile: state?.CampaignProfile?.listCampaignProfile,
    selectedCampaign: state?.Campaign?.selectedCampaign,
  }),
  {},
)(InfoForm);
