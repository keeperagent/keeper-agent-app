import { useEffect } from "react";
import { connect } from "react-redux";
import { RootState } from "@/redux/store";
import { useNavigate } from "react-router-dom";
import { ShootingStarBg } from "@/component";
import { actUserLogout } from "@/redux/auth";
import bgImg from "@/asset/dot-bg-1.png";
import { Wrapper } from "./style";
import { useTranslation, useAuthStorage } from "@/hook";

const LogoutPage = (props: any) => {
  const { token } = props;
  const navigate = useNavigate();

  const { translate } = useTranslation();
  const { clearAuthToken } = useAuthStorage();

  useEffect(() => {
    setTimeout(() => {
      props?.actUserLogout();
      clearAuthToken();
    }, 1000);
  }, [navigate]);

  useEffect(() => {
    if (!token) {
      navigate("/");
    }
  }, [token, navigate]);

  return (
    <Wrapper>
      <ShootingStarBg shouldAnimate={false} />
      <div className="main">
        <div className="message">{translate("loggingOut")}</div>
        <div className="background" />
      </div>
      <div className="background-3">
        <img src={bgImg} alt="" />
      </div>
    </Wrapper>
  );
};

export default connect(
  (state: RootState) => ({
    token: state?.Auth?.token,
  }),
  { actUserLogout },
)(LogoutPage);
