import _ from "lodash";
import { useMemo, Fragment } from "react";
import { Modal, Table, Alert } from "antd";
import { useNavigate } from "react-router-dom";
import { connect } from "react-redux";
import { actSetModalDependencyOpen } from "@/redux/walletGroup";
import { RootState } from "@/redux/store";
import { NewTabIcon } from "@/component/Icon";
import { useGetWalletGroupDependency, useTranslation } from "@/hook";
import { ICampaign, IProfileGroup, IWalletGroup } from "@/electron/type";
import { EMPTY_STRING } from "@/config/constant";
import { VIEW_MODE } from "@/page/Profile";
import { Wrapper, IconWrapper } from "./style";

const ModalDeleteDependency = (props: any) => {
  const {
    dependencies,
    isModalDependencyOpen,
    selectedWalletGroup,
    listWalletGroup,
  } = props;
  const { translate } = useTranslation();
  const navigate = useNavigate();

  const listCampaign: ICampaign[] = useMemo(() => {
    let results: ICampaign[] = [];

    Object.keys(dependencies)?.forEach((walletGroupId) => {
      let walletGroup: IWalletGroup = selectedWalletGroup;
      if (!walletGroup) {
        walletGroup = _.find(listWalletGroup, { id: walletGroupId });
      }
      const campaigns = dependencies?.[walletGroupId]?.listCampaign?.map(
        (campaign: ICampaign) => ({
          ...campaign,
          walletGroup: selectedWalletGroup,
        }),
      );
      results = [...results, ...campaigns];
    });

    return results;
  }, [dependencies, selectedWalletGroup, listWalletGroup]);

  const listProfileGroup: IProfileGroup[] = useMemo(() => {
    let results: IProfileGroup[] = [];

    Object.keys(dependencies)?.forEach((walletGroupId) => {
      let walletGroup: IWalletGroup = selectedWalletGroup;
      if (!walletGroup) {
        walletGroup = _.find(listWalletGroup, { id: walletGroupId });
      }
      const profileGroups = dependencies[walletGroupId]?.listProfileGroup?.map(
        (profileGroup: IProfileGroup) => ({
          ...profileGroup,
          walletGroup: selectedWalletGroup,
        }),
      );
      results = [...results, ...profileGroups];
    });

    return results;
  }, [dependencies, selectedWalletGroup, listWalletGroup]);

  const { clearWalletGroupDependency } = useGetWalletGroupDependency();

  const onCloseModal = () => {
    props.actSetModalDependencyOpen(false);
    clearWalletGroupDependency();
  };

  const onOpenProfileGroup = (profileGroupId: number) => {
    navigate(
      `/dashboard/profile?mode=${VIEW_MODE.PROFILE}&group=${profileGroupId}`,
    );
    onCloseModal();
  };

  const onOpenCampaign = (campaignId: number) => {
    navigate(`/dashboard/campaign?campaignId=${campaignId}&mode=VIEW_PROFILE`);
    onCloseModal();
  };

  return (
    <Modal
      open={isModalDependencyOpen}
      onCancel={onCloseModal}
      footer={null}
      title={translate("notification")}
      width="80rem"
    >
      <Wrapper>
        <Alert type="warning" title={translate("wallet.beforeDeleteWallet")} />

        {listCampaign?.length > 0 && (
          <Fragment>
            <div className="title">{translate("wallet.usedByCampaign")}</div>
            <Table
              columns={[
                {
                  title: translate("indexTable"),
                  dataIndex: "index",
                  width: "10%",
                },
                {
                  title: translate("wallet.walletGroup"),
                  dataIndex: "walletGroup",
                  width: "40%",
                },
                {
                  title: translate("sidebar.campaign"),
                  dataIndex: "name",
                  width: "40%",
                },
                {
                  title: translate("detail"),
                  dataIndex: "link",
                  width: "10%",
                  render: (value, record: any) => (
                    <IconWrapper onClick={() => onOpenCampaign(record?.id!)}>
                      <NewTabIcon />
                    </IconWrapper>
                  ),
                },
              ]}
              size="small"
              dataSource={listCampaign?.map((campaign: any, index) => ({
                index: index + 1,
                id: campaign?.id,
                name: campaign?.name || EMPTY_STRING,
                link: "",
                walletGroup: campaign?.walletGroup?.name || EMPTY_STRING,
              }))}
              pagination={false}
              rowKey={(data) => data?.id!}
            />
          </Fragment>
        )}

        {listProfileGroup?.length > 0 && (
          <Fragment>
            <div className="title">
              {translate("wallet.usedByProfileGroup")}
            </div>
            <Table
              columns={[
                {
                  title: translate("indexTable"),
                  dataIndex: "index",
                  width: "10%",
                },
                {
                  title: translate("wallet.walletGroup"),
                  dataIndex: "walletGroup",
                  width: "40%",
                },
                {
                  title: translate("profile.profileGroup"),
                  dataIndex: "name",
                  width: "40%",
                },
                {
                  title: translate("detail"),
                  dataIndex: "link",
                  width: "10%",
                  render: (value, record: any) => (
                    <IconWrapper
                      onClick={() => onOpenProfileGroup(record?.id!)}
                    >
                      <NewTabIcon />
                    </IconWrapper>
                  ),
                },
              ]}
              size="small"
              dataSource={listProfileGroup?.map((profileGroup, index) => ({
                index: index + 1,
                id: profileGroup?.id,
                name: profileGroup?.name || EMPTY_STRING,
                link: "",
                walletGroup: profileGroup?.walletGroup?.name || EMPTY_STRING,
              }))}
              pagination={false}
              rowKey={(data) => data?.id!}
            />
          </Fragment>
        )}
      </Wrapper>
    </Modal>
  );
};

export default connect(
  (state: RootState) => ({
    dependencies: state?.WalletGroup.dependencies,
    isModalDependencyOpen: state?.WalletGroup.isModalDependencyOpen,
    selectedWalletGroup: state.WalletGroup.selectedWalletGroup,
    listWalletGroup: state?.WalletGroup?.listWalletGroup || [],
  }),
  { actSetModalDependencyOpen },
)(ModalDeleteDependency);
