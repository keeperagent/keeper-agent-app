import { useEffect, useState } from "react";
import { Tabs } from "antd";
import { connect } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import qs from "qs";
import { RootState } from "@/redux/store";
import { actSetPageName } from "@/redux/layout";
import { useTranslation } from "@/hook";
import { WalletPageWrapper } from "./style";
import WalletGroup from "./WalletGroup";
import ManageWallet from "./ManageWallet";

export const VIEW_MODE = {
  WALLET: "WALLET",
  WALLET_GROUP: "WALLET_GROUP",
};

const WalletPage = (props: any) => {
  const [viewMode, setViewMode] = useState(VIEW_MODE.WALLET_GROUP);
  const location = useLocation();
  const { search } = location;
  const { translate } = useTranslation();
  const { mode, groupID } = qs.parse(search, { ignoreQueryPrefix: true });
  const navigate = useNavigate();

  useEffect(() => {
    props?.actSetPageName(translate("sidebar.wallet"));
  }, [translate]);

  useEffect(() => {
    setViewMode(
      mode && mode !== "undefined" ? mode?.toString() : VIEW_MODE.WALLET_GROUP
    );
  }, [mode]);

  const onChangeViewMode = (mode: any) => {
    navigate(`/dashboard/wallet?group=${groupID}&mode=${mode}`);
  };

  return (
    <WalletPageWrapper>
      <div className="tab">
        <Tabs
          activeKey={viewMode}
          items={[
            {
              key: VIEW_MODE.WALLET_GROUP,
              label: translate("wallet.walletGroup"),
            },
            {
              key: VIEW_MODE.WALLET,
              label: translate("wallet.allWallet"),
            },
          ]}
          onChange={onChangeViewMode}
        />
      </div>

      {viewMode === VIEW_MODE.WALLET ? <ManageWallet /> : <WalletGroup />}
    </WalletPageWrapper>
  );
};

export default connect((_state: RootState) => ({}), { actSetPageName })(
  WalletPage
);
