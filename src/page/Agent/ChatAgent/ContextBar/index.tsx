import { useEffect, useMemo, useState, Fragment } from "react";
import _ from "lodash";
import { connect } from "react-redux";
import {
  Drawer,
  Dropdown,
  Input,
  message,
  Popover,
  Empty,
  Button,
  Tooltip,
} from "antd";
import { RootState } from "@/redux/store";
import {
  useGetListCampaign,
  useGetListNodeEndpointGroup,
  useTranslation,
} from "@/hook";
import {
  useGetListAgentSetting,
  useCreateAgentSetting,
  useDeleteAgentSetting,
} from "@/hook/agentSetting";
import {
  IAgentSetting,
  AGENT_SETTING_TYPE,
  ICampaign,
  INodeEndpointGroup,
} from "@/electron/type";
import { CHAIN_TYPE } from "@/electron/constant";
import { getChainConfig, IChainConfig } from "@/service/util";
import {
  actSaveChainKey,
  actSaveNodeEndpointGroupId,
  actSaveTokenAddress,
  actSaveCampaignId,
  actSaveListProfileId,
  actSaveIsAllWallet,
} from "@/redux/agent";
import { listChainConfig } from "../WalletView/config";
import WalletView from "../WalletView";
import SettingIcon from "@/component/Icon/Setting";
import { CustomizationIcon } from "@/component/Icon";
import {
  ContextBarWrapper,
  OptionWrapper,
  PresetPopoverWrapper,
  DrawerSavePreset,
  DrawerPresetSection,
} from "./style";
import { EMPTY_STRING } from "@/config/constant";

const ContextBar = (props: any) => {
  const {
    chainKey,
    nodeEndpointGroupId,
    tokenAddress,
    campaignId,
    isAllWallet,
    listProfileId,
    listNodeEndpointGroup,
    listCampaign,
    listAgentSetting,
    setEncryptKey,
    encryptKey,
  } = props;

  const { translate, locale } = useTranslation();
  const { getListNodeEndpointGroup } = useGetListNodeEndpointGroup();
  const { getListCampaign } = useGetListCampaign();
  const { getListAgentSetting } = useGetListAgentSetting();
  const { createAgentSetting } = useCreateAgentSetting();
  const { deleteAgentSetting } = useDeleteAgentSetting();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [presetPopoverOpen, setPresetPopoverOpen] = useState(false);
  const [drawerPresetName, setDrawerPresetName] = useState("");

  useEffect(() => {
    getListNodeEndpointGroup({ page: 1, pageSize: 1000 });
    getListCampaign({ page: 1, pageSize: 1000 });
    getListAgentSetting({
      page: 1,
      pageSize: 1000,
      type: AGENT_SETTING_TYPE.AGENT_PRESET,
    });
  }, []);

  const chainConfig = useMemo(() => {
    return _.find(listChainConfig, { dexscreenerKey: chainKey }) || null;
  }, [chainKey]);

  const filteredNodeEndpointGroups = useMemo(() => {
    const chainType = chainConfig?.isEvm ? CHAIN_TYPE.EVM : CHAIN_TYPE.SOLANA;
    return listNodeEndpointGroup?.filter(
      (item: INodeEndpointGroup) => item?.chainType === chainType,
    );
  }, [listNodeEndpointGroup, chainConfig]);

  const nodeEndpointGroup = useMemo(() => {
    return _.find(listNodeEndpointGroup, { id: nodeEndpointGroupId }) || null;
  }, [listNodeEndpointGroup, nodeEndpointGroupId]);

  const campaign = useMemo(() => {
    return _.find(listCampaign, { id: campaignId }) || null;
  }, [listCampaign, campaignId]);

  const walletLabel = useMemo(() => {
    if (isAllWallet) {
      return translate("agent.allWallet");
    }

    const count = listProfileId?.length || 0;
    return count > 0 ? `${count} wallets` : translate("agent.noWallet");
  }, [isAllWallet, listProfileId, translate]);

  const hasMatchingPreset = useMemo(() => {
    const currentProfileIds = JSON.stringify(listProfileId || []);

    return listAgentSetting?.some((setting: IAgentSetting) => {
      const parsed = JSON.parse(setting.data || "{}");

      return (
        parsed.chainKey === chainKey &&
        parsed.nodeEndpointGroupId === nodeEndpointGroupId &&
        parsed.campaignId === campaignId &&
        parsed.selectedProfileIds === currentProfileIds &&
        parsed.isAllWallet === isAllWallet
      );
    });
  }, [
    listAgentSetting,
    chainKey,
    nodeEndpointGroupId,
    campaignId,
    listProfileId,
    isAllWallet,
  ]);

  const truncateAddress = (address: string) => {
    if (!address || address.length <= 10) {
      return address;
    }

    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const onLoadPreset = (setting: IAgentSetting) => {
    const parsed = JSON.parse(setting.data || "{}");
    props?.actSaveChainKey(parsed.chainKey || "");
    props?.actSaveNodeEndpointGroupId(parsed.nodeEndpointGroupId || null);
    props?.actSaveCampaignId(parsed.campaignId || null);
    props?.actSaveIsAllWallet(parsed.isAllWallet !== false);
    const profileIds = JSON.parse(parsed.selectedProfileIds || "[]");
    props?.actSaveListProfileId(profileIds);
    setPresetPopoverOpen(false);
  };

  const onDeletePreset = (presetId: number) => {
    deleteAgentSetting(presetId);
  };

  const onDrawerSavePreset = () => {
    if (!drawerPresetName.trim()) {
      message.warning(translate("form.requiredField"));
      return;
    }

    createAgentSetting({
      name: drawerPresetName.trim(),
      type: AGENT_SETTING_TYPE.AGENT_PRESET,
      data: JSON.stringify({
        chainKey: chainKey || "",
        nodeEndpointGroupId: nodeEndpointGroupId || null,
        campaignId: campaignId || null,
        selectedProfileIds: JSON.stringify(listProfileId || []),
        isAllWallet: isAllWallet !== false,
      }),
    });
    setDrawerPresetName("");
  };

  const presetContent = (
    <PresetPopoverWrapper>
      {listAgentSetting?.length === 0 && (
        <div className="preset-empty">
          <Empty description={translate("agent.noPresets")} />
        </div>
      )}

      {listAgentSetting?.map((setting: IAgentSetting) => (
        <div
          key={setting.id}
          className="preset-item"
          onClick={() => onLoadPreset(setting)}
        >
          <span className="preset-item-name">
            {setting?.name || EMPTY_STRING}
          </span>
        </div>
      ))}
    </PresetPopoverWrapper>
  );

  return (
    <Fragment>
      <ContextBarWrapper>
        <Dropdown
          trigger={["click"]}
          placement="bottomLeft"
          menu={{
            items: listChainConfig?.map((config) => ({
              key: config.dexscreenerKey,
              label: (
                <OptionWrapper>
                  <div className="icon">
                    <img src={config.logo} alt="" />
                  </div>
                  <span className="name">{config.chainName}</span>
                </OptionWrapper>
              ),
            })),
            selectedKeys: chainKey ? [chainKey] : [],
            style: {
              maxHeight: "35rem",
              overflowY: "auto",
              minWidth: "17rem",
              overflowX: "hidden",
            },
            onClick: ({ key }) => {
              props?.actSaveChainKey(key);
              props?.actSaveNodeEndpointGroupId(null);
              props?.actSaveTokenAddress("");
            },
          }}
        >
          <span className="context-chip">
            <img className="chip-icon" src={chainConfig?.logo} alt="" />
            <span className="chip-label">{chainConfig?.chainName}</span>
          </span>
        </Dropdown>

        <Dropdown
          trigger={["click"]}
          placement="bottomLeft"
          menu={{
            items: filteredNodeEndpointGroups?.map(
              (group: INodeEndpointGroup) => {
                const groupChainConfig = _.find(getChainConfig(locale), {
                  key: group?.chainType || CHAIN_TYPE.EVM,
                }) as IChainConfig;

                return {
                  key: String(group.id),
                  label: (
                    <OptionWrapper>
                      {groupChainConfig?.image && (
                        <div className="icon">
                          <img src={groupChainConfig.image} alt="" />
                        </div>
                      )}
                      <span className="name">{group.name}</span>
                    </OptionWrapper>
                  ),
                };
              },
            ),
            selectedKeys: nodeEndpointGroupId
              ? [String(nodeEndpointGroupId)]
              : [],
            style: { maxHeight: "35rem", overflowY: "auto" },
            onClick: ({ key }) =>
              props?.actSaveNodeEndpointGroupId(Number(key)),
          }}
        >
          <Tooltip
            title={
              filteredNodeEndpointGroups?.length === 0
                ? translate("agent.noNodeProvider")
                : ""
            }
          >
            <span
              className={`context-chip ${!nodeEndpointGroup ? "placeholder" : ""}`}
            >
              <span className="chip-label">
                {nodeEndpointGroup?.name || EMPTY_STRING}
              </span>
            </span>
          </Tooltip>
        </Dropdown>

        <Popover
          trigger="click"
          placement="bottomLeft"
          content={
            <Input
              size="small"
              value={tokenAddress}
              onChange={(event) =>
                props?.actSaveTokenAddress(event.target.value)
              }
              placeholder={translate("agent.enterTokenAddress")}
              style={{ width: "22rem" }}
              allowClear
            />
          }
        >
          <span
            className={`context-chip ${!tokenAddress ? "placeholder" : ""}`}
          >
            <span className="chip-label">
              {tokenAddress ? truncateAddress(tokenAddress) : "Token"}
            </span>
          </span>
        </Popover>

        <Dropdown
          trigger={["click"]}
          placement="bottomLeft"
          menu={{
            items: listCampaign?.map((campaignItem: ICampaign) => ({
              key: String(campaignItem.id),
              label: (
                <OptionWrapper>
                  <div className="content">
                    <div className="name">
                      {campaignItem?.name || EMPTY_STRING}
                    </div>
                    <div className="description">
                      {campaign?.note || EMPTY_STRING}
                    </div>
                  </div>
                </OptionWrapper>
              ),
            })),
            selectedKeys: campaignId ? [String(campaignId)] : [],
            style: { maxHeight: "35rem", overflowY: "auto" },
            onClick: ({ key }) => {
              props?.actSaveCampaignId(Number(key));
              props?.actSaveListProfileId([]);
            },
          }}
        >
          <span className={`context-chip ${!campaign ? "placeholder" : ""}`}>
            <span className="chip-label">{campaign?.name}</span>
          </span>
        </Dropdown>

        <span
          className={`context-chip ${isAllWallet && !listProfileId?.length ? "" : ""}`}
        >
          <span className="chip-label">{walletLabel}</span>
        </span>

        <div className="context-actions">
          <Popover
            trigger="click"
            placement="bottomRight"
            open={presetPopoverOpen}
            onOpenChange={setPresetPopoverOpen}
            content={presetContent}
            title="Presets"
          >
            <span className="action-icon" title="Presets">
              <CustomizationIcon width={14} height={14} />
            </span>
          </Popover>

          <span
            className="action-icon"
            title={translate("button.setting")}
            onClick={() => setDrawerOpen(true)}
          >
            <SettingIcon width={14} height={14} />
          </span>
        </div>
      </ContextBarWrapper>

      <Drawer
        title={translate("agent.contextSettings")}
        placement="right"
        size="60rem"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        destroyOnHidden
      >
        <WalletView setEncryptKey={setEncryptKey} encryptKey={encryptKey} />

        {!hasMatchingPreset && (
          <DrawerSavePreset>
            <div className="preset-save-label">
              {translate("agent.saveCurrentSettings")}
            </div>

            <div className="preset-summary">
              <span>{chainConfig?.chainName || EMPTY_STRING}</span>
              <span>{nodeEndpointGroup?.name || EMPTY_STRING}</span>
              <span>{campaign?.name || EMPTY_STRING}</span>
              <span>{walletLabel}</span>
            </div>

            <div className="preset-save-row">
              <Input
                size="medium"
                placeholder={translate("agent.presetName")}
                value={drawerPresetName}
                onChange={(event) => setDrawerPresetName(event.target.value)}
                onPressEnter={onDrawerSavePreset}
                className="custom-input"
              />

              <Button onClick={onDrawerSavePreset} type="primary" size="small">
                {translate("button.save")}
              </Button>
            </div>
          </DrawerSavePreset>
        )}

        <DrawerPresetSection>
          <div className="preset-title">Presets</div>

          {listAgentSetting?.length === 0 && (
            <div className="preset-empty">
              <Empty description={translate("agent.noPresets")} />
            </div>
          )}

          {listAgentSetting?.map((setting: IAgentSetting) => (
            <div key={setting.id} className="preset-item">
              <span
                className="preset-item-name"
                onClick={() => onLoadPreset(setting)}
                title={translate("button.load")}
              >
                {setting.name}
              </span>

              <div className="preset-item-actions">
                <span onClick={() => onLoadPreset(setting)}>
                  {translate("button.load")}
                </span>

                <span
                  className="preset-action-delete"
                  onClick={() => onDeletePreset(setting.id!)}
                >
                  {translate("button.delete")}
                </span>
              </div>
            </div>
          ))}
        </DrawerPresetSection>
      </Drawer>
    </Fragment>
  );
};

export default connect(
  (state: RootState) => ({
    chainKey: state?.Agent?.chainKey,
    nodeEndpointGroupId: state?.Agent?.nodeEndpointGroupId,
    tokenAddress: state?.Agent?.tokenAddress,
    campaignId: state?.Agent?.campaignId,
    listProfileId: state?.Agent?.listProfileId,
    isAllWallet: state?.Agent?.isAllWallet,
    listNodeEndpointGroup: state?.NodeEndpointGroup?.listNodeEndpointGroup,
    listCampaign: state?.Campaign?.listCampaign,
    listAgentSetting: state?.AgentSetting?.listAgentSetting,
  }),
  {
    actSaveChainKey,
    actSaveNodeEndpointGroupId,
    actSaveTokenAddress,
    actSaveCampaignId,
    actSaveListProfileId,
    actSaveIsAllWallet,
  },
)(ContextBar);
