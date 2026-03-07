import { useEffect, useState, Fragment, useMemo } from "react";
import { Tabs, Form, Row, Button } from "antd";
import { IGenerateProfileNodeConfig, IFakeProfile } from "@/electron/type";
import { NODE_STATUS } from "@/electron/constant";
import { useTranslation } from "@/hook";
import { addItemAtIndex, updateItemInList } from "@/service/util";
import { deleteItemInList } from "@/service/util";
import { TAB, TAB_NAME_EN } from "../util";
import ProfileItem from "./ProfileItem";
import { Wrapper } from "./style";
import CommonSetting from "../CommonSetting";

type Props = {
  onCloseModal: () => any;
  onSaveNodeConfig: (config: IGenerateProfileNodeConfig) => void;
  config: IGenerateProfileNodeConfig;
  isModalOpen: boolean;
};

const GenerateProfile = (props: Props) => {
  const { translate, locale } = useTranslation();
  const { onCloseModal, onSaveNodeConfig, config, isModalOpen } = props;
  const [activeProfile, setActiveProfile] = useState<number | null>(null);

  const [activeTab, setActiveTab] = useState(TAB.DETAIL);
  const [form] = Form.useForm();
  const [listProfile, setListProfile] = useState<IFakeProfile[]>([]);

  const TAB_NAME = useMemo(() => {
    return TAB_NAME_EN;
  }, [locale]);

  useEffect(() => {
    if (!config?.listProfile || config?.listProfile?.length === 0) {
      setListProfile([[{ value: "", variable: "" }]]);
    } else {
      setListProfile(config?.listProfile);
    }
  }, [config]);

  useEffect(() => {
    form.setFieldsValue({
      name: config?.name,
      sleep: config?.sleep,
    });
    setActiveTab(TAB.DETAIL);
  }, [isModalOpen, config, form]);

  const onChange = (key: string) => {
    setActiveTab(key);
  };

  const onSubmit = async () => {
    try {
      const { sleep, name } = await form?.validateFields(["sleep", "name"]);
      onSaveNodeConfig({
        sleep,
        name,
        status: NODE_STATUS.RUN,
        listProfile,
      });
      onCloseModal();
    } catch {}
  };

  const onChangeProfile = (profile: IFakeProfile, index: number) => {
    setListProfile(updateItemInList(index, listProfile, profile));
  };

  const onAddProfile = () => {
    setListProfile([...listProfile, []]);

    setTimeout(() => {
      setActiveProfile(listProfile?.length - 1);
    }, 100);
  };

  const onRemoveProfile = (profileIndex: number) => {
    setListProfile(deleteItemInList(profileIndex, listProfile));
  };

  const onDuplicateProfile = (profileIndex: number, profile: IFakeProfile) => {
    setListProfile(addItemAtIndex(profileIndex + 1, listProfile, profile));
  };

  return (
    <Wrapper>
      <Tabs
        onChange={onChange}
        type="card"
        size="small"
        items={[
          {
            label: TAB_NAME[TAB.DETAIL],
            key: TAB.DETAIL,
          },
          {
            label: TAB_NAME[TAB.SETTING],
            key: TAB.SETTING,
          },
          {
            label: TAB_NAME[TAB.SKIP],
            key: TAB.SKIP,
          },
        ]}
        activeKey={activeTab}
      />

      <Form layout="vertical" form={form} initialValues={{ sleep: 0 }}>
        {activeTab === TAB.DETAIL && (
          <Fragment>
            <div className="label">
              <span>{listProfile?.length}</span> profile
              {listProfile?.length > 1 ? "s" : ""}
            </div>
            <div
              className={
                listProfile?.length > 1 ? "list-profile long" : "list-profile"
              }
            >
              {listProfile?.map((profile: IFakeProfile, index: number) => (
                <ProfileItem
                  key={index}
                  onChangeProfile={onChangeProfile}
                  index={index}
                  profile={profile}
                  onRemoveProfile={onRemoveProfile}
                  onDuplicateProfile={onDuplicateProfile}
                  activeProfile={activeProfile}
                  setActiveProfile={setActiveProfile}
                  allowDelete={listProfile?.length > 1}
                />
              ))}
            </div>

            <Row
              justify="center"
              style={{
                marginBottom: "var(--margin-bottom)",
                marginTop: "var(--margin-top)",
              }}
            >
              <Button onClick={onAddProfile} type="dashed">
                {translate("profile.addProfile")}
              </Button>
            </Row>
          </Fragment>
        )}

        {activeTab === TAB.SETTING && (
          <CommonSetting
            hideCondition={true}
            hideTimeout={true}
            hideTelegramCheckbox={true}
          />
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

export default GenerateProfile;
