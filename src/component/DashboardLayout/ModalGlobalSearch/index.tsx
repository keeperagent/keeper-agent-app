import { Modal, Spin } from "antd";
import { Fragment, useEffect, useState } from "react";
import { connect } from "react-redux";
import { Empty } from "antd";
import { SearchInput } from "@/component/Input";
import { RootState } from "@/redux/store";
import { useGlobalSearch, useTranslation } from "@/hook";
import { actSetModalGlobalSearchOpen } from "@/redux/layout";
import { ModalWrapper } from "./style";
import {
  IGlobalSearchResult,
  IProfileGroup,
  IWorkflow,
  ICampaign,
  ISchedule,
  IProxyIpGroup,
  INodeEndpointGroup,
  IWalletGroup,
  IResourceGroup,
} from "@/electron/type";
import SearchResult from "./SearchResult";
import { CAMPAIGN_VIEW_MODE, EMPTY_STRING } from "@/config/constant";

interface IProps {
  isModalGlobalSearchOpen: boolean;
  actSetModalGlobalSearchOpen: (payload: boolean) => void;
  result: IGlobalSearchResult | null;
}

const ModalGlobalSearch = (props: IProps) => {
  const { isModalGlobalSearchOpen, actSetModalGlobalSearchOpen, result } =
    props;
  const { translate } = useTranslation();
  const { globalSearch, loading } = useGlobalSearch();
  const [searchText, setSearchText] = useState("");

  const onCloseModalGlobalSearch = () => {
    actSetModalGlobalSearchOpen(false);
  };

  useEffect(() => {
    let timeout: any = null;
    timeout = setTimeout(() => {
      globalSearch({ searchText });
    }, 200);

    return () => {
      clearTimeout(timeout);
    };
  }, [searchText]);

  const onSearch = (value: string) => {
    setSearchText(value);
    globalSearch({ searchText: value });
  };

  return (
    <Modal
      open={isModalGlobalSearchOpen}
      width="80rem"
      onCancel={onCloseModalGlobalSearch}
      footer={null}
      style={{ top: "6rem" }}
      title={translate("button.searchAnything")}
    >
      <ModalWrapper>
        <SearchInput
          placeholder={translate("button.search")}
          onChange={onSearch}
          value={searchText}
          style={{
            transform: "scaleY(1.05)",
            marginBottom: "var(--margin-bottom)",
          }}
          autoFocus={isModalGlobalSearchOpen}
        />

        <Spin spinning={loading}>
          {!loading &&
            result?.campaigns?.length === 0 &&
            result?.workflows?.length === 0 &&
            result?.schedules?.length === 0 &&
            result?.walletGroups?.length === 0 &&
            result?.resourceGroups?.length === 0 &&
            result?.profileGroups?.length === 0 &&
            result?.proxyIpGroups?.length === 0 &&
            result?.nodeEndpointGroups?.length === 0 && (
              <div className="empty">
                <Empty />
              </div>
            )}

          <div className="result">
            {result?.campaigns?.length! > 0 && (
              <Fragment>
                <div className="title">{translate("sidebar.campaign")}</div>
                <div className="result-list">
                  {result?.campaigns?.map((campaign: ICampaign) => (
                    <SearchResult
                      key={`campaign-${campaign?.id || ""}`}
                      name={campaign?.name || EMPTY_STRING}
                      description={campaign?.note || EMPTY_STRING}
                      updateAt={campaign?.updateAt || 0}
                      totalData={campaign?.totalProfile || 0}
                      link={`/dashboard/campaign?campaignId=${campaign?.id}&mode=${CAMPAIGN_VIEW_MODE.VIEW_PROFILE}`}
                      totalLabel={translate("campaign.numberOfProfile")}
                    />
                  ))}
                </div>
              </Fragment>
            )}

            {result?.workflows?.length! > 0 && (
              <Fragment>
                <div className="title">{translate("sidebar.workflow")}</div>
                <div className="result-list">
                  {result?.workflows?.map((workflow: IWorkflow) => (
                    <SearchResult
                      key={`workflow-${workflow?.id || ""}`}
                      name={workflow?.name || EMPTY_STRING}
                      description={workflow?.note || EMPTY_STRING}
                      updateAt={workflow?.updateAt || 0}
                      link={`/dashboard/workflow?workflowId=${workflow?.id}`}
                    />
                  ))}
                </div>
              </Fragment>
            )}

            {result?.schedules?.length! > 0 && (
              <Fragment>
                <div className="title">{translate("sidebar.schedule")}</div>
                <div className="result-list">
                  {result?.schedules?.map((schedule: ISchedule) => (
                    <SearchResult
                      key={`schedule-${schedule?.id || ""}`}
                      name={schedule?.name || EMPTY_STRING}
                      description={schedule?.note || EMPTY_STRING}
                      updateAt={schedule?.updateAt || 0}
                      link={`/dashboard/schedule?scheduleId=${schedule?.id}`}
                    />
                  ))}
                </div>
              </Fragment>
            )}

            {result?.profileGroups?.length! > 0 && (
              <Fragment>
                <div className="title">{translate("profile.profileGroup")}</div>
                <div className="result-list">
                  {result?.profileGroups?.map((profileGroup: IProfileGroup) => (
                    <SearchResult
                      key={`profileGroup-${profileGroup?.id || ""}`}
                      name={profileGroup?.name || EMPTY_STRING}
                      description={profileGroup?.note || EMPTY_STRING}
                      updateAt={profileGroup?.updateAt || 0}
                      totalData={profileGroup?.totalProfile || 0}
                      link={`/dashboard/profile?group=${profileGroup?.id}&mode=PROFILE`}
                      totalLabel={translate("profile.allProfile")}
                    />
                  ))}
                </div>
              </Fragment>
            )}

            {result?.walletGroups?.length! > 0 && (
              <Fragment>
                <div className="title">{translate("wallet.walletGroup")}</div>
                <div className="result-list">
                  {result?.walletGroups?.map((walletGroup: IWalletGroup) => (
                    <SearchResult
                      key={`walletGroup-${walletGroup?.id || ""}`}
                      name={walletGroup?.name || EMPTY_STRING}
                      description={walletGroup?.note || EMPTY_STRING}
                      updateAt={walletGroup?.updateAt || 0}
                      totalData={walletGroup?.totalWallet || 0}
                      totalLabel={translate("wallet.allNumberWallets")}
                      link={`/dashboard/wallet?group=${walletGroup?.id}&mode=WALLET`}
                    />
                  ))}
                </div>
              </Fragment>
            )}

            {result?.resourceGroups?.length! > 0 && (
              <Fragment>
                <div className="title">
                  {translate("resource.resourceGroup")}
                </div>
                <div className="result-list">
                  {result?.resourceGroups?.map(
                    (resourceGroup: IResourceGroup) => (
                      <SearchResult
                        key={`resourceGroup-${resourceGroup?.id || ""}`}
                        name={resourceGroup?.name || EMPTY_STRING}
                        description={resourceGroup?.note || EMPTY_STRING}
                        updateAt={resourceGroup?.updateAt || 0}
                        totalData={resourceGroup?.totalResource || 0}
                        totalLabel={translate("resource.totalResource")}
                        link={`/dashboard/resource?group=${resourceGroup?.id}&mode=RESOURCE`}
                      />
                    ),
                  )}
                </div>
              </Fragment>
            )}

            {result?.proxyIpGroups?.length! > 0 && (
              <Fragment>
                <div className="title">{translate("proxy.staticProxy")}</div>
                <div className="result-list">
                  {result?.proxyIpGroups?.map((proxyIpGroup: IProxyIpGroup) => (
                    <SearchResult
                      key={`proxyIpGroup-${proxyIpGroup?.id || ""}`}
                      name={proxyIpGroup?.name || EMPTY_STRING}
                      description={proxyIpGroup?.note || EMPTY_STRING}
                      updateAt={proxyIpGroup?.updateAt || 0}
                      totalData={proxyIpGroup?.totalProxyIp || 0}
                      link={`/dashboard/proxy?group=${proxyIpGroup?.id}&mode=LIST_IP`}
                      totalLabel={translate("proxyIp.totalIp")}
                    />
                  ))}
                </div>
              </Fragment>
            )}

            {result?.nodeEndpointGroups?.length! > 0 && (
              <Fragment>
                <div className="title">Node provider</div>
                <div className="result-list">
                  {result?.nodeEndpointGroups?.map(
                    (nodeEndpointGroup: INodeEndpointGroup) => (
                      <SearchResult
                        key={`nodeEndpointGroup-${nodeEndpointGroup?.id || ""}`}
                        name={nodeEndpointGroup?.name || EMPTY_STRING}
                        description={nodeEndpointGroup?.note || EMPTY_STRING}
                        updateAt={nodeEndpointGroup?.updateAt || 0}
                        totalData={nodeEndpointGroup?.totalNodeEndpoint || 0}
                        link={`/dashboard/node-provider?group=${nodeEndpointGroup?.id}`}
                        totalLabel={translate("nodeProvider.totalNode")}
                      />
                    ),
                  )}
                </div>
              </Fragment>
            )}
          </div>
        </Spin>
      </ModalWrapper>
    </Modal>
  );
};

export default connect(
  (state: RootState) => ({
    isModalGlobalSearchOpen: state.Layout.isModalGlobalSearchOpen,
    result: state.Search.result,
  }),
  { actSetModalGlobalSearchOpen },
)(ModalGlobalSearch);
