import { useState, useEffect, useRef } from "react";
import { Form, Row, Col } from "antd";
import { connect } from "react-redux";
import { useNavigate } from "react-router-dom";
import { RootState } from "@/redux/store";
import { actSetMasterKeyUnlocked } from "@/redux/session";
import { actToggleLightMode } from "@/redux/layout";
import {
  DASHBOARD_LIGHT_MODE_KEY,
  LAST_ROUTE_BEFORE_LOCK_KEY,
} from "@/config/constant";
import {
  useTranslation,
  useCheckMasterPasswordExists,
  useSetupMasterPassword,
  useVerifyMasterPassword,
  useResetMasterPassword,
} from "@/hook";
import ShooptingStarBg from "@/component/ShootingStarBg";
import backgroundImg from "@/asset/dot-bg-1.png";
import { MasterPasswordPageWrapper, MasterPasswordFormWrapper } from "./style";
import LoadingFallback from "@/route/LoadingFallback";
import UnlockForm from "./UnlockForm";
import ResetForm from "./ResetForm";
import CreateForm from "./CreateForm";

enum UnlockView {
  Unlock = "unlock",
  Change = "change",
}

const MasterPasswordPage = (props: any) => {
  const { token, user, isMasterKeyUnlocked, isLightMode } = props;
  const email = user?.email;
  const [createForm] = Form.useForm();
  const [changeForm] = Form.useForm();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [unlockView, setUnlockView] = useState<UnlockView>(UnlockView.Unlock);
  const { translate } = useTranslation();
  const navigate = useNavigate();

  const { isChecking, isSetupMode } = useCheckMasterPasswordExists();
  const {
    loading: setupLoading,
    isSuccess: setupSuccess,
    errorMessage: setupError,
    setupMasterPassword,
  } = useSetupMasterPassword();
  const {
    loading: verifyLoading,
    isSuccess: verifySuccess,
    errorMessage: verifyError,
    verifyMasterPassword,
  } = useVerifyMasterPassword();
  const {
    loading: resetLoading,
    isSuccess: resetSuccess,
    errorMessage: resetError,
    resetMasterPassword,
  } = useResetMasterPassword();

  const isBtnLoading = setupLoading || verifyLoading || resetLoading;

  // Prevent double navigation: success effects set this before dispatching
  // actSetMasterKeyUnlocked, so the isMasterKeyUnlocked effect won't re-fire.
  const didNavigateRef = useRef(false);
  const navigateAfterUnlock = () => {
    if (didNavigateRef.current) {
      return;
    }

    didNavigateRef.current = true;
    const lastRoute = sessionStorage.getItem(LAST_ROUTE_BEFORE_LOCK_KEY);
    sessionStorage.removeItem(LAST_ROUTE_BEFORE_LOCK_KEY);
    navigate(lastRoute || "/dashboard/home");
  };

  const restoreDashboardLightMode = () => {
    const saved = sessionStorage?.getItem(DASHBOARD_LIGHT_MODE_KEY);
    if (saved !== null) {
      props?.actToggleLightMode(saved === "true");
      sessionStorage?.removeItem(DASHBOARD_LIGHT_MODE_KEY);
    }
  };

  // MasterPassword page always dark while visible; restore previous theme when leaving.
  useEffect(() => {
    sessionStorage?.setItem(
      DASHBOARD_LIGHT_MODE_KEY,
      String(Boolean(isLightMode)),
    );
    props?.actToggleLightMode(false);

    return () => {
      restoreDashboardLightMode();
    };
  }, []);

  useEffect(() => {
    if (!token) {
      navigate("/");
    }
  }, [token, navigate]);

  useEffect(() => {
    if (isMasterKeyUnlocked) {
      navigateAfterUnlock();
    }
  }, [isMasterKeyUnlocked]);

  useEffect(() => {
    if (setupSuccess || verifySuccess) {
      props.actSetMasterKeyUnlocked(true);
      navigateAfterUnlock();
    }
  }, [setupSuccess, verifySuccess]);

  useEffect(() => {
    if (resetSuccess) {
      props.actSetMasterKeyUnlocked(true);
      navigateAfterUnlock();
    }
  }, [resetSuccess]);

  useEffect(() => {
    if (setupError) setErrorMessage(setupError);
  }, [setupError]);

  useEffect(() => {
    if (verifyError) setErrorMessage(verifyError);
  }, [verifyError]);

  useEffect(() => {
    if (resetError) setErrorMessage(resetError);
  }, [resetError]);

  const onSubmitCreateForm = async () => {
    try {
      const values = createForm.getFieldsValue();
      const password = values?.masterPassword;
      errorMessage && setErrorMessage(null);

      if (!password) {
        createForm.setFields([
          {
            name: "masterPassword",
            errors: [translate("masterPassword.required")],
          },
        ]);
        return;
      }

      if (isSetupMode) {
        const confirmPassword = values?.confirmPassword;
        if (!confirmPassword) {
          createForm.setFields([
            {
              name: "confirmPassword",
              errors: [translate("masterPassword.confirmRequired")],
            },
          ]);
          return;
        }
        if (password !== confirmPassword) {
          createForm.setFields([
            {
              name: "confirmPassword",
              errors: [translate("masterPassword.mismatch")],
            },
          ]);
          return;
        }
        setupMasterPassword(password, email);
      } else {
        verifyMasterPassword(password, email);
      }
    } catch {}
  };

  const onSubmitChangeForm = async () => {
    setErrorMessage(null);
    const values = changeForm.getFieldsValue();
    const newPwd = values?.newPassword;
    const confirmPwd = values?.confirmNewPassword;

    if (!newPwd) {
      changeForm.setFields([
        {
          name: "newPassword",
          errors: [translate("masterPassword.required")],
        },
      ]);
      return;
    }
    if (!confirmPwd) {
      changeForm.setFields([
        {
          name: "confirmNewPassword",
          errors: [translate("masterPassword.confirmRequired")],
        },
      ]);
      return;
    }
    if (newPwd !== confirmPwd) {
      changeForm.setFields([
        {
          name: "confirmNewPassword",
          errors: [translate("masterPassword.mismatch")],
        },
      ]);
      return;
    }

    resetMasterPassword(newPwd, email);
  };

  if (isChecking) {
    return <LoadingFallback />;
  }

  const showUnlockForm = !isSetupMode && unlockView === UnlockView.Unlock;
  const showChangeForm = !isSetupMode && unlockView === UnlockView.Change;

  return (
    <MasterPasswordPageWrapper>
      <ShooptingStarBg shouldAnimate={false} />

      <div className="main">
        {showUnlockForm && (
          <UnlockForm
            form={createForm}
            onSubmit={onSubmitCreateForm}
            loading={isBtnLoading}
            errorMessage={errorMessage}
            onResetClick={() => setUnlockView(UnlockView.Change)}
          />
        )}

        {!showUnlockForm && (
          <MasterPasswordFormWrapper>
            <div className="heading">
              <span>
                {isSetupMode
                  ? translate("masterPassword.setupHeading")
                  : showChangeForm
                    ? translate("masterPassword.changeHeading")
                    : translate("masterPassword.unlockHeading")}
              </span>
            </div>

            <div className="form">
              <Row justify="center">
                <Col span={24}>
                  {isSetupMode && (
                    <CreateForm
                      form={createForm}
                      onSubmit={onSubmitCreateForm}
                      loading={isBtnLoading}
                      errorMessage={errorMessage}
                    />
                  )}

                  {showChangeForm && (
                    <ResetForm
                      form={changeForm}
                      onSubmit={onSubmitChangeForm}
                      loading={isBtnLoading}
                      errorMessage={errorMessage}
                      onBack={() => {
                        setErrorMessage(null);
                        changeForm.resetFields();
                        setUnlockView(UnlockView.Unlock);
                      }}
                    />
                  )}
                </Col>
              </Row>
            </div>
          </MasterPasswordFormWrapper>
        )}

        <div className="background-1" />
        <div className="background-2" />
      </div>

      <img className="background-3" src={backgroundImg} alt="" />
    </MasterPasswordPageWrapper>
  );
};

export default connect(
  (state: RootState) => ({
    token: state?.Auth?.token,
    user: state?.Auth?.user,
    isMasterKeyUnlocked: state?.Session?.isMasterKeyUnlocked,
    isLightMode: state?.Layout?.isLightMode,
  }),
  {
    actSetMasterKeyUnlocked,
    actToggleLightMode,
  },
)(MasterPasswordPage);
