import { useEffect, useState } from "react";
import { MESSAGE } from "@/electron/constant";

const useCheckMasterPasswordExists = () => {
  const [isChecking, setIsChecking] = useState(true);
  const [isSetupMode, setIsSetupMode] = useState(false);

  useEffect(() => {
    const handler = (_event: any, payload: any) => {
      setIsChecking(false);
      const exists = payload?.data?.exists;
      setIsSetupMode(!exists);
    };
    const unsubscribe = window?.electron?.on(
      MESSAGE.CHECK_MASTER_PASSWORD_EXISTS_RES,
      handler,
    );
    window?.electron?.send(MESSAGE.CHECK_MASTER_PASSWORD_EXISTS, {});
    return () => {
      unsubscribe?.();
    };
  }, []);

  return { isChecking, isSetupMode };
};

const useSetupMasterPassword = () => {
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handler = (_event: any, payload: any) => {
      setLoading(false);
      if (payload?.success) {
        setIsSuccess(true);
      } else {
        setErrorMessage(payload?.message);
      }
    };
    const unsubscribe = window?.electron?.on(
      MESSAGE.SETUP_MASTER_PASSWORD_RES,
      handler,
    );

    return () => {
      unsubscribe?.();
    };
  }, []);

  const setupMasterPassword = (password: string, email: string) => {
    setLoading(true);
    setIsSuccess(false);
    setErrorMessage(null);
    window?.electron?.send(MESSAGE.SETUP_MASTER_PASSWORD, { password, email });
  };

  return { loading, isSuccess, errorMessage, setupMasterPassword };
};

const useVerifyMasterPassword = () => {
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handler = (_event: any, payload: any) => {
      setLoading(false);
      if (payload?.success) {
        setIsSuccess(true);
        setErrorMessage(null);
      } else {
        setIsFailed(true);
        setErrorMessage(payload?.message);
      }
    };
    const unsubscribe = window?.electron?.on(
      MESSAGE.VERIFY_MASTER_PASSWORD_RES,
      handler,
    );

    return () => {
      unsubscribe?.();
    };
  }, []);

  const verifyMasterPassword = (password: string, email: string) => {
    setLoading(true);
    setIsSuccess(false);
    setIsFailed(false);
    setErrorMessage(null);
    window?.electron?.send(MESSAGE.VERIFY_MASTER_PASSWORD, { password, email });
  };

  return { loading, isSuccess, isFailed, errorMessage, verifyMasterPassword };
};

const useResetMasterPassword = () => {
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handler = (_event: any, payload: any) => {
      setLoading(false);
      if (payload?.success) {
        setIsSuccess(true);
        setErrorMessage(null);
      } else {
        setErrorMessage(payload?.error);
      }
    };
    const unsubscribe = window?.electron?.on(
      MESSAGE.RESET_MASTER_PASSWORD_RES,
      handler,
    );

    return () => {
      unsubscribe?.();
    };
  }, []);

  const resetMasterPassword = (newPassword: string, email: string) => {
    setLoading(true);
    setIsSuccess(false);
    setErrorMessage(null);
    window?.electron?.send(MESSAGE.RESET_MASTER_PASSWORD, {
      newPassword,
      email,
    });
  };

  return {
    loading,
    isSuccess,
    errorMessage,
    resetMasterPassword,
  };
};

export {
  useCheckMasterPasswordExists,
  useSetupMasterPassword,
  useVerifyMasterPassword,
  useResetMasterPassword,
};
