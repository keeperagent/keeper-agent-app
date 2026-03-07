import { connect } from "react-redux";
import ShooptingStarBg from "@/component/ShootingStarBg";
import { RedirectPage } from "@/component";
import { RootState } from "@/redux/store";
import backgroundImg from "@/asset/dot-bg-1.png";
import LoginForm from "./LoginForm";
import { LoginPageWrapper } from "./style";

const LoginPage = (_props: any) => {
  return (
    <RedirectPage>
      <LoginPageWrapper>
        <ShooptingStarBg shouldAnimate={false} />

        <div className="main">
          <LoginForm />

          <div className="background-1" />
          <div className="background-2" />
        </div>

        <img className="background-3" src={backgroundImg} alt="" />
      </LoginPageWrapper>
    </RedirectPage>
  );
};

export default connect((_state: RootState) => ({}), {})(LoginPage);
