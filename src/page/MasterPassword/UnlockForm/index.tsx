import { Form, Alert, FormInstance } from "antd";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { useTranslation } from "@/hook";
import { PasswordInput } from "@/component/Input";
import { PrimaryButton } from "@/component/Button";
import { IUser } from "@/types/interface";
import logo from "@/asset/logo.ico";
import {
  UnlockFormWrapper,
  AvatarSection,
  UserName,
  HintText,
  UnlockButtonWrapper,
  ResetLink,
} from "./style";

type UnlockFormProps = {
  form: FormInstance;
  onSubmit: () => void;
  loading: boolean;
  errorMessage: string | null;
  onResetClick: () => void;
  user: IUser | null;
};

const UnlockForm = ({
  form,
  onSubmit,
  loading,
  errorMessage,
  onResetClick,
  user,
}: UnlockFormProps) => {
  const { translate } = useTranslation();
  const displayName = user?.username || user?.email || "User";

  return (
    <UnlockFormWrapper>
      <AvatarSection>
        <img src={logo} alt="logo" className="avatar" />
        <UserName>{displayName}</UserName>
      </AvatarSection>

      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <PasswordInput
          name="masterPassword"
          placeholder={translate("masterPassword.enterPassword")}
          extendClass="unlock-master-password"
          onPressEnter={(event) => {
            event?.preventDefault();
            event?.stopPropagation();
            form.submit();
          }}
        />

        {!loading && errorMessage && (
          <Alert type="error" title={errorMessage} />
        )}

        <HintText>{translate("masterPassword.unlockInfo")}</HintText>

        <UnlockButtonWrapper>
          <PrimaryButton
            text={translate("masterPassword.unlockButton")}
            onClick={onSubmit}
            loading={loading}
          />
        </UnlockButtonWrapper>

        <ResetLink onClick={onResetClick}>
          {translate("masterPassword.resetPasswordLink")}
        </ResetLink>
      </Form>
    </UnlockFormWrapper>
  );
};

export default connect((state: RootState) => ({
  user: state?.Auth?.user || null,
}))(UnlockForm);
