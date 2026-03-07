import { useState, useEffect } from "react";
import { Form, Input, Row, Col, Alert } from "antd";
import { connect } from "react-redux";
import { useLazyQuery } from "@apollo/client/react";
import { useNavigate } from "react-router-dom";
import { RootState } from "@/redux/store";
import { QuerySignIn, QueryLoginAppWithGoogle } from "@/api/auth";
import { useTranslation, useGetPreference, useAuthStorage } from "@/hook";
import { DASHBOARD_LIGHT_MODE_KEY, RESPONSE_CODE } from "@/config/constant";
import { actSetIsFullscreen } from "@/redux/workflowRunner";
import {
  actUserSignIn,
  actSetLastVerifyTime,
  actSetErrorTime,
  actSetErrorCount,
} from "@/redux/auth";
import { actToggleLightMode } from "@/redux/layout";
import { PrimaryButton, GoogleAuthButton } from "@/component/Button";
import { PasswordInput } from "@/component/Input";
import { MESSAGE } from "@/electron/constant";
import { LoginFormWrapper } from "./style";

const LANDING_PAGE_URL = "https://keeperagent.com";

const LoginForm = (props: any) => {
  const { preference, isLightMode, token } = props;
  const [form] = Form.useForm();
  const [isBtnLoading, setBtnLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { translate } = useTranslation();
  const { getPreference } = useGetPreference();
  const { saveAuthToken } = useAuthStorage();
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      navigate("/master-password");
    }
  }, [token, navigate]);

  useEffect(() => {
    getPreference();
  }, []);

  const restoreDashboardLightMode = () => {
    const saved = sessionStorage?.getItem(DASHBOARD_LIGHT_MODE_KEY);
    if (saved !== null) {
      props?.actToggleLightMode(saved === "true");
      sessionStorage?.removeItem(DASHBOARD_LIGHT_MODE_KEY);
    }
  };

  // Login page always dark while visible; restore previous theme when leaving (unmount or after login).
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

  const [actSignIn, signInResponse] = useLazyQuery(QuerySignIn, {
    fetchPolicy: "network-only",
  });

  const [actLoginWithGoogle, loginWithGoogleResponse] = useLazyQuery(
    QueryLoginAppWithGoogle,
  );

  useEffect(() => {
    window?.electron?.on(
      MESSAGE.GET_GOOGLE_AUTH_CODE,
      (event: any, payload: any) => {
        onLoginWithGoogle(payload?.code);
      },
    );
  }, []);

  const onSubmitForm = async () => {
    try {
      const { email, password } = await form.validateFields([
        "email",
        "password",
      ]);
      errorMessage && setErrorMessage(null);

      setBtnLoading(true);
      actSignIn({
        variables: {
          email,
          password,
          isAdmin: false,
          deviceId: preference?.deviceId || "",
        },
      });
    } catch (err: any) {
      console.log(`Login error: ${err?.message}`);
    }
  };

  useEffect(() => {
    const { data, loading, called, error } = signInResponse;
    const resData = (data as any)?.signIn as any;

    if (called && !loading) {
      const userInfo = resData?.data;
      const token = resData?.token;

      if (userInfo && token) {
        errorMessage && setErrorMessage(null);

        restoreDashboardLightMode();
        props.actUserSignIn({
          user: userInfo,
          token,
        });

        saveAuthToken(token, userInfo);

        props?.actSetLastVerifyTime(new Date().getTime());
        props?.actSetErrorTime(0);
        props?.actSetErrorCount(0);
      }

      if (resData?.code === RESPONSE_CODE.PERMISSON_DENIED) {
        setErrorMessage(translate("login.permissionDenied"));
      } else if (resData?.code === RESPONSE_CODE.ERROR) {
        setErrorMessage(translate("login.error"));
      } else if (resData?.code === RESPONSE_CODE.OBJECT_NOT_FOUND) {
        setErrorMessage(translate("login.objectNotFound"));
      }

      setBtnLoading(false);
    }

    if (error) {
      setBtnLoading(false);
      setErrorMessage(translate("login.errorCanNotLogin"));
    }
  }, [signInResponse]);

  useEffect(() => {
    const { data, loading, called, error } = loginWithGoogleResponse;
    const resData = (data as any)?.loginAppWithGoogle as any;

    if (called && !loading) {
      const userInfo = resData?.data;
      const token = resData?.token;

      if (userInfo && token) {
        errorMessage && setErrorMessage(null);

        restoreDashboardLightMode();
        props.actUserSignIn({
          user: userInfo,
          token,
        });
        saveAuthToken(token, userInfo);

        props?.actSetLastVerifyTime(new Date().getTime());
        props?.actSetErrorTime(0);
        props?.actSetErrorCount(0);
      }

      if (resData?.code === RESPONSE_CODE.PERMISSON_DENIED) {
        setErrorMessage(translate("login.permissionDenied"));
      } else if (resData?.code === RESPONSE_CODE.ERROR) {
        setErrorMessage(translate("login.error"));
      } else if (resData?.code === RESPONSE_CODE.OBJECT_NOT_FOUND) {
        setErrorMessage(translate("login.objectNotFound"));
      }
    }

    if (error) {
      console.log(`Login error: ${error.message}`);
    }
  }, [loginWithGoogleResponse.loading]);

  const onLoginWithGoogle = (authorizationCode: string) => {
    actLoginWithGoogle({
      variables: {
        authorizationCode,
        deviceId: preference?.deviceId || "",
      },
    });
  };

  const onOpenLoginWithGoogleLink = () => {
    window?.electron?.send(MESSAGE.OPEN_EXTERNAL_LINK, {
      url: `${LANDING_PAGE_URL}/app-login`,
    });
  };

  const onOpenSignupPage = () => {
    window?.electron?.send(MESSAGE.OPEN_EXTERNAL_LINK, {
      url: `${LANDING_PAGE_URL}/sign-up`,
    });
  };

  const onOpenForgotPasswordPage = () => {
    window?.electron?.send(MESSAGE.OPEN_EXTERNAL_LINK, {
      url: `${LANDING_PAGE_URL}/forgot-password`,
    });
  };

  return (
    <LoginFormWrapper>
      <div className="heading">
        <span>{translate("login.heading")}</span>
      </div>

      <div className="form">
        <Row justify="center">
          <Col span={24}>
            <Form layout="vertical" form={form}>
              <Row justify="center" style={{ marginBottom: "1rem" }}>
                <Col span={24}>
                  <Form.Item
                    label="Email"
                    rules={[
                      {
                        required: true,
                        message: translate("login.emailEmptyError"),
                      },
                      {
                        type: "email",
                        message: translate("login.emailInvalidError"),
                      },
                    ]}
                    normalize={(value: string) => value?.toLocaleLowerCase()}
                    name="email"
                  >
                    <Input
                      placeholder="your@gmail.com"
                      className="custom-input"
                      size="large"
                      allowClear
                      onPressEnter={onSubmitForm}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row
                justify="center"
                style={{ marginBottom: "var(--margin-bottom)" }}
              >
                <Col span={24}>
                  <Form.Item
                    label={translate("password")}
                    rules={[
                      {
                        required: true,
                        message: translate("login.passwordEmptyError"),
                      },
                    ]}
                    colon={true}
                    className="password"
                  >
                    <PasswordInput name="password" extendClass="password" />
                  </Form.Item>
                </Col>
              </Row>

              <Row justify="center">
                <Col span={24}>
                  <PrimaryButton
                    text={translate("login")}
                    onClick={onSubmitForm}
                    loading={isBtnLoading}
                  />
                </Col>
              </Row>

              <div className="oauth-signin">
                <div className="label">
                  <span>{translate("or")}</span>
                </div>

                <GoogleAuthButton
                  onClick={onOpenLoginWithGoogleLink}
                  text="Sign in with Google"
                />
              </div>

              {!isBtnLoading && errorMessage && (
                <Row style={{ marginTop: "2rem", width: "100%" }}>
                  <Alert
                    title={errorMessage}
                    type="error"
                    showIcon
                    style={{ width: "100%", borderColor: "transparent" }}
                  />
                </Row>
              )}
            </Form>
          </Col>
        </Row>
      </div>

      <div className="footer">
        <div className="sign-up" onClick={onOpenSignupPage}>
          {translate("login.needAnAccount")}
        </div>
        <div className="forget-password" onClick={onOpenForgotPasswordPage}>
          {translate("login.forgotPassword")}
        </div>
      </div>
    </LoginFormWrapper>
  );
};

export default connect(
  (state: RootState) => ({
    preference: state?.Preference?.preference,
    isLightMode: state?.Layout?.isLightMode,
    token: state?.Auth?.token,
  }),
  {
    actSetIsFullscreen,
    actUserSignIn,
    actSetLastVerifyTime,
    actSetErrorTime,
    actSetErrorCount,
    actToggleLightMode,
  },
)(LoginForm);
