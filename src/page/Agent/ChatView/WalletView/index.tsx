import _ from "lodash";
import { useEffect, useMemo, useState } from "react";
import {
  Select,
  Row,
  Col,
  Form,
  Input,
  Radio,
  Divider,
  Tooltip,
  message,
} from "antd";
import { connect } from "react-redux";
import copy from "copy-to-clipboard";
import { RootState } from "@/redux/store";
import { CHAIN_TYPE } from "@/electron/constant";
import { useOpenExternalLink } from "@/hook";
import {
  useGetListCampaign,
  useGetListCampaignProfile,
  useGetListNodeEndpointGroup,
  useTranslation,
} from "@/hook";
import {
  useGetCacheEncryptKey,
  useSetCacheEncryptKey,
} from "@/hook/encryptKeyCache";
import {
  ICampaign,
  ICampaignProfile,
  INodeEndpointGroup,
} from "@/electron/type";
import {
  getChainConfig,
  getPortfolioAppImg,
  getPortfolioAppUrl,
  IChainConfig,
} from "@/service/util";
import {
  actSaveChainKey,
  actSaveNodeEndpointGroupId,
  actSaveTokenAddress,
  actSaveCampaignId,
  actSaveListProfileId,
  actSaveIsAllWallet,
} from "@/redux/agent";
import {
  ChainWrapper,
  OptionWrapper,
  WalletViewWrapper,
  RadioWrapper,
  PortfolioAppWrapper,
} from "./style";
import { EMPTY_STRING } from "@/config/constant";
import { PasswordInput } from "@/component/Input";
import { CopyIcon, CheckIcon } from "@/component/Icon";
import { listChainConfig } from "@/page/Agent/config";

let searchNodeEndpointGroupTimeOut: any = null;
let searchCampaignTimeOut: any = null;
let searchCampaignProfileTimeOut: any = null;

const { Option } = Select;
const { TextArea } = Input;

const WalletView = (props: any) => {
  const {
    listNodeEndpointGroup,
    chainKey,
    nodeEndpointGroupId,
    tokenAddress,
    listCampaign,
    campaignId,
    listCampaignProfile,
    listProfileId,
    isAllWallet,
    setEncryptKey,
    encryptKey,
  } = props;

  const { translate, locale } = useTranslation();
  const [form] = Form.useForm();
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const { getListNodeEndpointGroup, loading: isSelectLoading } =
    useGetListNodeEndpointGroup();
  const { getListCampaign, loading: isSelectCampaignLoading } =
    useGetListCampaign();
  const { getListCampaignProfile, loading: getListCampaignProfileLoading } =
    useGetListCampaignProfile();
  const {
    getCacheEncryptKey,
    cachedEncryptKey,
    hasEncryptKey,
    loading: isGetCacheEncryptKeyLoading,
  } = useGetCacheEncryptKey();
  const { openExternalLink } = useOpenExternalLink();
  const { setCacheEncryptKey } = useSetCacheEncryptKey();

  useEffect(() => {
    getListNodeEndpointGroup({ page: 1, pageSize: 1000 });
    if (!chainKey) {
      props?.actSaveChainKey("solana");
    }
  }, []);

  useEffect(() => {
    if (campaignId) {
      setEncryptKey("");
      form.setFieldsValue({ encryptKey: "" });
      getCacheEncryptKey(campaignId);
    }
  }, [campaignId]);

  useEffect(() => {
    if (isGetCacheEncryptKeyLoading) {
      return;
    }
    setEncryptKey(cachedEncryptKey || "");
  }, [isGetCacheEncryptKeyLoading, cachedEncryptKey]);

  useEffect(() => {
    if (campaignId) {
      getListCampaignProfile({ page: 1, pageSize: 50, campaignId, encryptKey });
    } else {
      props?.actSaveListProfileId([]);
    }
  }, [campaignId, encryptKey]);

  const listValidNodeEndpointGroup = useMemo(() => {
    const chainConfig =
      _.find(listChainConfig, {
        dexscreenerKey: chainKey,
      }) || null;

    let chainType = CHAIN_TYPE.SOLANA;
    if (chainConfig?.isEvm) {
      chainType = CHAIN_TYPE.EVM;
    }

    const listData = listNodeEndpointGroup?.filter(
      (item: any) => item?.chainType === chainType,
    );
    if (listData?.length > 0 && ["solana"]?.includes(chainKey)) {
      props?.actSaveNodeEndpointGroupId(listData[0]?.id);
    }
    return listData;
  }, [listNodeEndpointGroup, chainKey]);

  const onSearchNodeEndpointGroup = (text: string) => {
    if (searchNodeEndpointGroupTimeOut) {
      clearTimeout(searchNodeEndpointGroupTimeOut);
    }
    searchNodeEndpointGroupTimeOut = setTimeout(() => {
      getListNodeEndpointGroup({ page: 1, pageSize: 1000, searchText: text });
    }, 200);
  };

  const onChangeChainKey = (value: string) => {
    props?.actSaveChainKey(value);
    props?.actSaveNodeEndpointGroupId(null);
    props?.actSaveTokenAddress("");
  };

  const onChangeNodeEndpointGroupId = (value: number) => {
    props?.actSaveNodeEndpointGroupId(value);
  };

  const onChangeTokenAddress = (value: string) => {
    props?.actSaveTokenAddress(value);
  };

  const onSearchCampaign = (text: string) => {
    if (searchCampaignTimeOut) {
      clearTimeout(searchCampaignTimeOut);
    }
    searchCampaignTimeOut = setTimeout(() => {
      getListCampaign({ page: 1, pageSize: 1000, searchText: text });
    }, 200);
  };

  const onChangeCampaign = (value: number) => {
    props?.actSaveCampaignId(value);
    props?.actSaveListProfileId([]);
  };

  const onChangeListProfileId = (value: number[]) => {
    props?.actSaveListProfileId(value);
  };

  const onChangeEncryptKey = (value: string) => {
    setEncryptKey(value);
    setCacheEncryptKey(campaignId || 0, value);
  };

  const onChangeIsAllWallet = (value: number) => {
    props?.actSaveIsAllWallet(value === 1);
    if (value === 1) {
      props?.actSaveListProfileId([]);
    }
  };

  const onSearchCampaignProfile = (text: string) => {
    if (searchCampaignProfileTimeOut) {
      clearTimeout(searchCampaignProfileTimeOut);
    }
    searchCampaignProfileTimeOut = setTimeout(() => {
      getListCampaignProfile({
        page: 1,
        pageSize: 50,
        searchText: text,
        encryptKey,
        campaignId,
      });
    }, 200);
  };

  const onCopyAddress = (address: string) => {
    copy(address);
    message.success(translate("copied"));
    setCopiedAddress(address);
    setTimeout(() => {
      setCopiedAddress(null);
    }, 1500);
  };

  const onViewPortfolio = (walletAddress: string, portfolioApp: string) => {
    const url = getPortfolioAppUrl(walletAddress, portfolioApp);
    openExternalLink(url);
  };

  return (
    <WalletViewWrapper>
      <Form layout="vertical" form={form}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={`${translate("agent.chain")}:`}
              rules={[
                {
                  required: true,
                  message: translate("form.requiredField"),
                },
              ]}
            >
              <Select
                size="large"
                className="custom-select"
                placeholder={translate("workflow.selectChain")}
                onChange={onChangeChainKey}
                optionLabelProp="label"
                showSearch
                value={chainKey}
              >
                {listChainConfig?.map((config) => {
                  return (
                    <Option
                      key={config?.dexscreenerKey}
                      value={config?.dexscreenerKey}
                      label={
                        <ChainWrapper>
                          <div className="icon">
                            <img src={config?.logo} alt="" />
                          </div>
                          <span className="text">{config?.chainName}</span>
                        </ChainWrapper>
                      }
                    >
                      <OptionWrapper>
                        <div className="icon">
                          <img src={config?.logo} alt="" />
                        </div>

                        <div className="content">
                          <div className="name">{config?.chainName}</div>
                          {config.chainId !== 0 && (
                            <div className="description">
                              {translate("agent.chainId")}: {config.chainId}
                            </div>
                          )}
                        </div>
                      </OptionWrapper>
                    </Option>
                  );
                })}
              </Select>
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label={`${translate("nodeEndpoint.group")}:`}
              rules={[
                {
                  required: true,
                  message: translate("form.requiredField"),
                },
              ]}
            >
              <Select
                placeholder={translate("nodeEndpoint.groupPlaceholder")}
                size="large"
                className="custom-select"
                showSearch
                onSearch={onSearchNodeEndpointGroup}
                filterOption={false}
                loading={isSelectLoading}
                optionLabelProp="label"
                value={nodeEndpointGroupId}
                onChange={onChangeNodeEndpointGroupId}
              >
                {listValidNodeEndpointGroup?.map(
                  (group: INodeEndpointGroup) => {
                    const chainConfig = _.find(getChainConfig(locale), {
                      key: group?.chainType || CHAIN_TYPE.EVM,
                    }) as IChainConfig;

                    return (
                      <Option
                        key={group?.id}
                        value={group?.id}
                        label={
                          <ChainWrapper>
                            <div className="icon">
                              <img src={chainConfig?.image} alt="" />
                            </div>
                            <span className="text">{group?.name}</span>
                          </ChainWrapper>
                        }
                      >
                        <OptionWrapper>
                          <div className="icon">
                            <img src={chainConfig?.image} alt="" />
                          </div>

                          <div className="content">
                            <div className="name">{group?.name}</div>
                            <div className="description">
                              {translate("nodeProvider.totalNode")}:{" "}
                              {group?.totalNodeEndpoint || 0}
                            </div>
                          </div>
                        </OptionWrapper>
                      </Option>
                    );
                  },
                )}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label={`${translate("tokenAddress")}:`}
          rules={[
            {
              required: true,
              message: translate("form.requiredField"),
            },
          ]}
        >
          <TextArea
            placeholder={translate("agent.enterTokenAddress")}
            className="custom-input"
            size="large"
            rows={1}
            value={tokenAddress}
            onChange={(e) => onChangeTokenAddress(e.target.value)}
            allowClear
          />
        </Form.Item>

        <Divider className="divider" />

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={`${translate("sidebar.campaign")}:`}
              rules={[
                {
                  required: true,
                  message: translate("form.requiredField"),
                },
              ]}
            >
              <Select
                size="large"
                className="custom-select"
                placeholder={translate("schedule.selectCampaign")}
                showSearch
                onSearch={onSearchCampaign}
                filterOption={false}
                value={campaignId}
                loading={isSelectCampaignLoading}
                onChange={onChangeCampaign}
                optionLabelProp="label"
                style={{ transform: "scaleY(0.975)" }}
              >
                {listCampaign?.map((campaign: ICampaign) => (
                  <Option
                    key={campaign?.id}
                    value={campaign?.id}
                    label={campaign?.name}
                  >
                    <OptionWrapper>
                      <div className="content">
                        <div className="name">
                          {campaign?.name || EMPTY_STRING}
                        </div>
                        <div className="description">
                          {campaign?.note || EMPTY_STRING}
                        </div>
                      </div>
                    </OptionWrapper>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item label={`${translate("wallet.encryptKey")}:`}>
              <PasswordInput
                name="encryptKey"
                placeholder={translate("wallet.encryptKey")}
                onChange={onChangeEncryptKey}
                extendClass="encryptKey-agent"
                initialValue={hasEncryptKey ? "•" : ""}
                shouldHideValue={true}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label={
            <RadioWrapper>
              <span className="label">{translate("agent.walletProfiles")}</span>

              <Radio.Group
                size="small"
                options={[
                  { value: 1, label: translate("agent.allWallet") },
                  { value: 0, label: translate("agent.customSelect") },
                ]}
                onChange={(e) => onChangeIsAllWallet(e.target.value)}
                value={isAllWallet ? 1 : 0}
              />
            </RadioWrapper>
          }
          style={{ marginTop: "-1.5rem" }}
        >
          <Select
            placeholder={
              isAllWallet
                ? translate("agent.allWalletProfiles")
                : translate("agent.selectWalletProfiles")
            }
            size="large"
            className="custom-select"
            showSearch
            onSearch={onSearchCampaignProfile}
            filterOption={false}
            loading={getListCampaignProfileLoading}
            optionLabelProp="label"
            value={listProfileId}
            mode="multiple"
            onChange={onChangeListProfileId}
            disabled={isAllWallet}
            style={{ marginBottom: "-1.5rem" }}
          >
            {listCampaignProfile?.map((campaignProfile: ICampaignProfile) => {
              let note = campaignProfile?.note || EMPTY_STRING;
              let isShowWallet = false;
              if (
                campaignProfile?.wallet &&
                !campaignProfile?.wallet?.isEncrypted
              ) {
                note = campaignProfile?.wallet?.address || EMPTY_STRING;
                isShowWallet = true;
              }

              const portfolioApp = campaignProfile?.walletGroup?.portfolioApp;

              if (!portfolioApp || !campaignProfile?.wallet?.address) {
                return EMPTY_STRING;
              }

              return (
                <Option
                  key={campaignProfile?.id}
                  value={campaignProfile?.id}
                  label={campaignProfile?.name}
                >
                  <OptionWrapper>
                    <div className="content">
                      <div className="name">
                        {campaignProfile?.name || EMPTY_STRING}
                      </div>

                      <div className="description">
                        <span>{note}</span>

                        {isShowWallet && (
                          <Tooltip title={translate("copy")} placement="top">
                            {copiedAddress === note ? (
                              <div className="copy-icon copied">
                                <CheckIcon />
                              </div>
                            ) : (
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onCopyAddress(note);
                                }}
                                className="copy-icon"
                              >
                                <CopyIcon />
                              </div>
                            )}
                          </Tooltip>
                        )}

                        {isShowWallet && (
                          <PortfolioAppWrapper
                            onClick={() => {
                              onViewPortfolio(
                                campaignProfile?.wallet?.address || "",
                                campaignProfile?.walletGroup?.portfolioApp ||
                                  "",
                              );
                            }}
                          >
                            <div className="icon">
                              <img
                                src={getPortfolioAppImg(portfolioApp)}
                                alt=""
                              />
                            </div>
                          </PortfolioAppWrapper>
                        )}
                      </div>
                    </div>
                  </OptionWrapper>
                </Option>
              );
            })}
          </Select>
        </Form.Item>
      </Form>
    </WalletViewWrapper>
  );
};

export default connect(
  (state: RootState) => ({
    listNodeEndpointGroup: state?.NodeEndpointGroup?.listNodeEndpointGroup,
    listCampaign: state?.Campaign?.listCampaign,
    listCampaignProfile: state?.CampaignProfile?.listCampaignProfile,
    chainKey: state?.Agent?.chainKey,
    tokenAddress: state?.Agent?.tokenAddress,
    nodeEndpointGroupId: state?.Agent?.nodeEndpointGroupId,
    campaignId: state?.Agent?.campaignId,
    listProfileId: state?.Agent?.listProfileId,
    isAllWallet: state?.Agent?.isAllWallet,
  }),
  {
    actSaveChainKey,
    actSaveNodeEndpointGroupId,
    actSaveTokenAddress,
    actSaveCampaignId,
    actSaveListProfileId,
    actSaveIsAllWallet,
  },
)(WalletView);
