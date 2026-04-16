import { useState, useMemo, useEffect, useRef } from "react";
import { Tooltip } from "antd";
import { PlusIcon, TrashBoldIcon, CopyBoldIcon } from "@/component/Icon";
import { IFakeProfile, IWorkflowVariable } from "@/electron/type";
import {
  addItemAtIndex,
  updateItemInList,
  deleteItemInList,
} from "@/service/util";
import ColumnConfig from "./ColumnConfig";
import { Wrapper } from "./style";
import { useTranslation } from "@/hook";

type IProps = {
  index: number;
  onChangeProfile: (profile: IFakeProfile, index: number) => void;
  profile: IFakeProfile;
  onRemoveProfile: (profileIndex: number) => void;
  onDuplicateProfile: (profileIndex: number, profile: IFakeProfile) => void;
  activeProfile: number | null;
  setActiveProfile: (value: number | null) => void;
  allowDelete: boolean;
};

const ProfileItem = (props: IProps) => {
  const { translate } = useTranslation();
  const {
    index,
    onChangeProfile,
    profile,
    onRemoveProfile,
    onDuplicateProfile,
    activeProfile,
    setActiveProfile,
    allowDelete,
  } = props;
  const [activeCol, setActiveCol] = useState<number | null>(null);
  const elementRef = useRef<HTMLDivElement>(null);

  const isActive = useMemo(() => {
    return activeProfile === index;
  }, [activeProfile, index]);

  useEffect(() => {
    if (elementRef && isActive) {
      elementRef?.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [isActive]);

  useEffect(() => {
    if (profile?.length === 0) {
      onAddAttribute();
    }
  }, [profile]);

  const onAddAttribute = () => {
    onChangeProfile([...profile, { value: "", variable: "" }], index);
  };

  const onRemoveAttribute = (attributeIndex: number) => {
    const newProfile = deleteItemInList(attributeIndex, profile);
    onChangeProfile(newProfile, index);
  };

  const onDuplicateAttribute = (
    attributeIndex: number,
    attribute: IWorkflowVariable,
  ) => {
    const newProfile = addItemAtIndex(attributeIndex, profile, attribute);
    onChangeProfile(newProfile, index);
  };

  const onChangeAttribute = (
    attributeIndex: number,
    attribute: IWorkflowVariable,
  ) => {
    const newProfile = updateItemInList(attributeIndex, profile, attribute);
    onChangeProfile(newProfile, index);
  };

  return (
    <Wrapper className={profile.length < 2 ? "short" : ""} ref={elementRef}>
      <div className="heading">
        <div className="title">Profile {index + 1}</div>

        <div className="tool">
          <Tooltip title={translate("workflow.duplicate")}>
            <div
              className="icon"
              onClick={() => onDuplicateProfile(index, profile)}
            >
              <CopyBoldIcon />
            </div>
          </Tooltip>

          {allowDelete && (
            <Tooltip title={translate("profile.deleteProfile")}>
              <div
                className="icon delete"
                onClick={() => onRemoveProfile(index)}
              >
                <TrashBoldIcon />
              </div>
            </Tooltip>
          )}
        </div>
      </div>

      <div className="list-attribute">
        {profile?.map(
          (attribute: IWorkflowVariable, attributeIndex: number) => (
            <ColumnConfig
              activeCol={activeCol}
              setActiveCol={setActiveCol}
              activeProfile={activeProfile}
              setActiveProfile={setActiveProfile}
              index={attributeIndex}
              attribute={attribute}
              onChangeAttribute={onChangeAttribute}
              profileIndex={index}
              onChangeProfile={onChangeProfile}
              onDuplicateAttribute={onDuplicateAttribute}
              onRemoveAttribute={onRemoveAttribute}
              key={index}
              allowDelete={profile?.length > 1}
            />
          ),
        )}

        <div className="add" onClick={onAddAttribute}>
          <Tooltip title={translate("workflow.addAttr")}>
            <div className="icon">
              <PlusIcon />
            </div>
          </Tooltip>
        </div>
      </div>
    </Wrapper>
  );
};

export default ProfileItem;
