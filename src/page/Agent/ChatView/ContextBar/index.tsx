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
import { CheckOutlined } from "@ant-design/icons";
import { RootState } from "@/redux/store";
import {
  useGetListCampaign,
  useGetListNodeEndpointGroup,
  useTranslation,
} from "@/hook";
import {
  useGetListSetting,
  useCreateSetting,
  useUpdateSetting,
  useDeleteSetting,
} from "@/hook/setting";
import {
  ISetting,
  SETTING_TYPE,
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
import { listChainConfig } from "@/page/Agent/config";
import WalletView from "../WalletView";
import PresetItem from "./PresetItem";
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
    chatProfileId,
    setEncryptKey,
    encryptKey,
  } = props;

  const { translate, locale } = useTranslation();
  const { getListNodeEndpointGroup } = useGetListNodeEndpointGroup();
  const { getListCampaign } = useGetListCampaign();
  const { getListSetting } = useGetListSetting();
  const { createSetting } = useCreateSetting({
    onSuccess: (setting) => setActivePresetId(setting.id || null),
  });
  const { updateSetting } = useUpdateSetting();
  const { deleteSetting } = useDeleteSetting();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [presetPopoverOpen, setPresetPopoverOpen] = useState(false);
  const [drawerPresetName, setDrawerPresetName] = useState("");
  const [activePresetId, setActivePresetId] = useState<number | null>(null);

  useEffect(() => {
    getListNodeEndpointGroup({ page: 1, pageSize: 1000 });
    getListCampaign({ page: 1, pageSize: 1000 });
    getListSetting({
      page: 1,
      pageSize: 1000,
      type: SETTING_TYPE.AGENT_PRESET,
      scopeId: chatProfileId,
    });
  }, [chatProfileId]);

  const matchingPreset = useMemo(() => {
    const currentProfileIds = JSON.stringify(listProfileId || []);

    return (
      listAgentSetting?.find((setting: ISetting) => {
        const agentSetting = setting.agentSetting;
        return (
          agentSetting?.chainKey === chainKey &&
          agentSetting?.nodeEndpointGroupId === nodeEndpointGroupId &&
          agentSetting?.campaignId === campaignId &&
          JSON.stringify(agentSetting?.selectedProfileIds || []) ===
            currentProfileIds &&
          agentSetting?.isAllWallet === isAllWallet &&
          (agentSetting?.tokenAddress || "") === (tokenAddress || "")
        );
      }) || null
    );
  }, [
    listAgentSetting,
    chainKey,
    nodeEndpointGroupId,
    campaignId,
    listProfileId,
    isAllWallet,
    tokenAddress,
  ]);

  useEffect(() => {
    if (matchingPreset) {
      setActivePresetId(matchingPreset.id || null);
      setDrawerPresetName(matchingPreset.name || "");
    } else {
      setActivePresetId(null);
      setDrawerPresetName("");
    }
  }, [matchingPreset]);

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

  const truncateAddress = (address: string) => {
    if (!address || address.length <= 10) {
      return address;
    }

    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const onLoadPreset = (setting: ISetting) => {
    const agentSetting = setting.agentSetting;
    props?.actSaveChainKey(agentSetting?.chainKey || "");
    props?.actSaveNodeEndpointGroupId(
      agentSetting?.nodeEndpointGroupId || null,
    );
    props?.actSaveCampaignId(agentSetting?.campaignId || null);
    props?.actSaveIsAllWallet(agentSetting?.isAllWallet !== false);
    props?.actSaveListProfileId(agentSetting?.selectedProfileIds || []);
    props?.actSaveTokenAddress(agentSetting?.tokenAddress || "");
    setActivePresetId(setting.id || null);
    setDrawerPresetName(setting.name || "");
    setPresetPopoverOpen(false);
  };

  const onDeletePreset = (presetId: number) => {
    deleteSetting(presetId);
  };

  const onDrawerSavePreset = () => {
    if (!drawerPresetName.trim()) {
      message.warning(translate("form.requiredField"));
      return;
    }

    const presetData = JSON.stringify({
      chainKey: chainKey || "",
      nodeEndpointGroupId: nodeEndpointGroupId || null,
      campaignId: campaignId || null,
      selectedProfileIds: JSON.stringify(listProfileId || []),
      isAllWallet: isAllWallet !== false,
      tokenAddress: tokenAddress || null,
    });

    const activeSetting = listAgentSetting?.find(
      (setting: ISetting) => setting.id === activePresetId,
    );
    // Same name as the loaded preset → update in place, renamed → create new
    const isUpdate =
      activeSetting && drawerPresetName.trim() === activeSetting.name;

    if (isUpdate) {
      updateSetting({ ...activeSetting, data: presetData });
    } else {
      createSetting({
        name: drawerPresetName.trim(),
        type: SETTING_TYPE.AGENT_PRESET,
        scopeId: chatProfileId,
        data: presetData,
      });
    }
  };

  const presetContent = (
    <PresetPopoverWrapper>
      {listAgentSetting?.length === 0 && (
        <div className="preset-empty">
          <Empty description={translate("agent.noPresets")} />
        </div>
      )}

      {listAgentSetting?.map((setting: ISetting) => (
        <div
          key={setting.id}
          className="preset-item"
          onClick={() => onLoadPreset(setting)}
        >
          <span className="preset-item-name">
            {setting?.name || EMPTY_STRING}
            {setting.id === activePresetId && (
              <CheckOutlined className="preset-check-icon" />
            )}
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
          <span className={`context-chip ${!chainConfig ? "placeholder" : ""}`}>
            {chainConfig && (
              <img className="chip-icon" src={chainConfig?.logo} alt="" />
            )}
            <span className="chip-label">
              {chainConfig?.chainName || EMPTY_STRING}
            </span>
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
              size="medium"
              value={tokenAddress}
              onChange={(event) =>
                props?.actSaveTokenAddress(event.target.value)
              }
              placeholder={translate("agent.enterTokenAddress")}
              style={{ width: "40rem", fontSize: "1.1rem" }}
              allowClear
              autoFocus
              className="custom-input"
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
                      {campaignItem?.note || EMPTY_STRING}
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
            <span className="chip-label">
              {campaign?.name || translate("sidebar.campaign")}
            </span>
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

        {!matchingPreset && (
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
                size="large"
                placeholder={translate("agent.presetName")}
                value={drawerPresetName}
                onChange={(event) => setDrawerPresetName(event.target.value)}
                onPressEnter={onDrawerSavePreset}
                className="custom-input"
              />

              <Button
                onClick={onDrawerSavePreset}
                type="primary"
                size="middle"
                disabled={!drawerPresetName.trim()}
              >
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

          <div className="list-preset">
            {listAgentSetting?.map((setting: ISetting) => (
              <PresetItem
                key={setting.id}
                setting={setting}
                listNodeEndpointGroup={listNodeEndpointGroup}
                listCampaign={listCampaign}
                onLoad={onLoadPreset}
                onDelete={onDeletePreset}
                isActive={setting.id === activePresetId}
              />
            ))}
          </div>
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
    listAgentSetting: state?.Setting?.listSetting,
    chatProfileId: state?.Agent?.chatProfileId,
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
