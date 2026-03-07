import { useEffect } from "react";
import { connect } from "react-redux";
import { useNavigate } from "react-router-dom";
import { RootState } from "@/redux/store";

const RedirectPage = (props: any) => {
  const { children, token, user } = props;
  const navigate = useNavigate();

  useEffect(() => {
    const isPaidUser = user?.tierStatus?._id;
    if (token && isPaidUser) {
      navigate("/dashboard/home");
    }
  }, [token]);

  return children;
};

export default connect(
  (state: RootState) => ({
    token: state?.Auth?.token,
    user: state?.Auth?.user,
  }),
  {}
)(RedirectPage);
