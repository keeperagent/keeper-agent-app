import { message } from "antd";
import { MESSAGE, RESPONSE_CODE } from "@/electron/constant";
import {
  actSaveGetListProfileGroup,
  actSaveSelectedProfileGroup,
  actSaveCreateProfileGroup,
  actSaveUpdateProfileGroup,
} from "@/redux/profileGroup";
import type { IpcGetListProfileGroupPayload } from "@/electron/ipcTypes";
import { IProfileGroup } from "@/electron/type";
import { useTranslation } from "./useTranslation";
import { useIpcAction } from "./useIpcAction";
import { useState } from "react";

const useGetListProfileGroup = () => {
  const { execute: getListProfileGroup, loading } =
    useIpcAction<IpcGetListProfileGroupPayload>(
      MESSAGE.GET_LIST_PROFILE_GROUP,
      MESSAGE.GET_LIST_PROFILE_GROUP_RES,
      {
        onSuccess: (payload, dispatch) =>
          dispatch(actSaveGetListProfileGroup(payload?.data)),
      },
    );
  return { loading, getListProfileGroup };
};

const useGetOneProfileGroup = () => {
  const { execute, loading } = useIpcAction(
    MESSAGE.GET_ONE_PROFILE_GROUP,
    MESSAGE.GET_ONE_PROFILE_GROUP_RES,
    {
      onSuccess: (payload, dispatch) =>
        dispatch(actSaveSelectedProfileGroup(payload?.data)),
    },
  );
  const getOneProfileGroup = (id: number) => execute({ id });
  return { loading, getOneProfileGroup };
};

const useDeleteProfileGroup = () => {
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.DELETE_PROFILE_GROUP,
    MESSAGE.DELETE_PROFILE_GROUP_RES,
  );
  const deleteProfileGroup = (listGroupId: number[]) =>
    execute({ data: listGroupId });
  return { deleteProfileGroup, loading, isSuccess };
};

const useUpdateProfileGroup = () => {
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.UPDATE_PROFILE_GROUP,
    MESSAGE.UPDATE_PROFILE_GROUP_RES,
    {
      onSuccess: (payload, dispatch) =>
        dispatch(actSaveUpdateProfileGroup(payload?.data)),
    },
  );
  const updateProfileGroup = (data: IProfileGroup) => execute({ data });
  return { updateProfileGroup, loading, isSuccess };
};

const useCreateProfileGroup = () => {
  const { translate } = useTranslation();
  const [createdData, setCreatedData] = useState<IProfileGroup | null>(null);
  const { execute, loading, isSuccess } = useIpcAction(
    MESSAGE.CREATE_PROFILE_GROUP,
    MESSAGE.CREATE_PROFILE_GROUP_RES,
    {
      onSuccess: (payload, dispatch) => {
        if (payload?.code === RESPONSE_CODE.DUPLICATE_ERROR) {
          message.error(translate("dataDuplicate"));
          return;
        }

        setCreatedData(payload?.data);
        dispatch(actSaveCreateProfileGroup(payload?.data));
      },
    },
  );

  const createProfileGroup = (data: IProfileGroup) => execute({ data });
  return { createProfileGroup, loading, isSuccess, createdData };
};

export {
  useGetListProfileGroup,
  useDeleteProfileGroup,
  useUpdateProfileGroup,
  useCreateProfileGroup,
  useGetOneProfileGroup,
};
