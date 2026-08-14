import { useEffect } from "react";
import { connect } from "react-redux";
import { useNavigate } from "react-router-dom";
import { RootState } from "@/redux/store";

const RedirectPage = (props: any) => {
  const { children, token } = props;
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      navigate("/dashboard/home");
    }
  }, [token]);

  return children;
};

export default connect(
  (state: RootState) => ({
    token: state?.Auth?.token,
  }),
  {},
)(RedirectPage);
