import { useState } from "react";
import { MESSAGE } from "@/electron/constant";
import { useIpcAction } from "./useIpcAction";

const useGetScreenSize = () => {
  const [size, setSize] = useState({});
  const {
    execute: getScreenSize,
    loading,
    isSuccess,
  } = useIpcAction(MESSAGE.GET_SCREEN_SIZE, MESSAGE.GET_SCREEN_SIZE_RES, {
    onSuccess: (payload) => setSize(payload?.data),
  });
  return { loading, isSuccess, size, getScreenSize };
};

const useCheckDeviceType = () => {
  const [isMacOSArm, setIsMacOSArm] = useState(false);
  const [isMacOSIntel, setIsMacOSIntel] = useState(false);
  const [isWindow, setIsWindow] = useState(false);
  const {
    execute: checkDeviceType,
    loading,
    isSuccess,
  } = useIpcAction(MESSAGE.CHECK_DEVICE_TYPE, MESSAGE.CHECK_DEVICE_TYPE_RES, {
    onSuccess: ({ data }: any) => {
      setIsMacOSArm(data?.isMacOSArm);
      setIsMacOSIntel(data?.isMacOSIntel);
      setIsWindow(data?.isWindow);
    },
  });
  return {
    loading,
    isSuccess,
    isMacOSArm,
    isMacOSIntel,
    isWindow,
    checkDeviceType,
  };
};

export { useGetScreenSize, useCheckDeviceType };
