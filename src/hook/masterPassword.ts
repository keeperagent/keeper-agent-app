import { useEffect, useState } from "react";
import { MESSAGE } from "@/electron/constant";

const useCheckMasterPasswordExists = () => {
  const [isChecking, setIsChecking] = useState(true);
  const [isSetupMode, setIsSetupMode] = useState(false);

  useEffect(() => {
    window?.electron?.on(
      MESSAGE.CHECK_MASTER_PASSWORD_EXISTS_RES,
      (_event: any, payload: any) => {
        setIsChecking(false);
        const exists = payload?.data?.exists;
        setIsSetupMode(!exists);
      },
    );

    window?.electron?.send(MESSAGE.CHECK_MASTER_PASSWORD_EXISTS, {});

    return () => {
      window?.electron?.removeAllListeners(
        MESSAGE.CHECK_MASTER_PASSWORD_EXISTS_RES,
      );
    };
  }, []);

  return { isChecking, isSetupMode };
};

const useSetupMasterPassword = () => {
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    window?.electron?.on(
      MESSAGE.SETUP_MASTER_PASSWORD_RES,
      (_event: any, payload: any) => {
        setLoading(false);
        if (payload?.success) {
          setIsSuccess(true);
        } else {
          setErrorMessage(payload?.message);
        }
      },
    );

    return () => {
      window?.electron?.removeAllListeners(MESSAGE.SETUP_MASTER_PASSWORD_RES);
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
    window?.electron?.on(
      MESSAGE.VERIFY_MASTER_PASSWORD_RES,
      (_event: any, payload: any) => {
        setLoading(false);
        if (payload?.success) {
          setIsSuccess(true);
          setErrorMessage(null);
        } else {
          setIsFailed(true);
          setErrorMessage(payload?.message);
        }
      },
    );

    return () => {
      window?.electron?.removeAllListeners(MESSAGE.VERIFY_MASTER_PASSWORD_RES);
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
    window?.electron?.on(
      MESSAGE.RESET_MASTER_PASSWORD_RES,
      (_event: any, payload: any) => {
        setLoading(false);
        if (payload?.success) {
          setIsSuccess(true);
          setErrorMessage(null);
        } else {
          setErrorMessage(payload?.error);
        }
      },
    );

    return () => {
      window?.electron?.removeAllListeners(MESSAGE.RESET_MASTER_PASSWORD_RES);
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
