import { useMemo } from "react";
import _ from "lodash";
import { IAgentSetting, ICampaign, INodeEndpointGroup } from "@/electron/type";
import { useTranslation } from "@/hook";
import { EMPTY_STRING } from "@/config/constant";
import { listChainConfig } from "../../WalletView/config";
import { PresetItemWrapper } from "./style";

interface PresetItemProps {
  setting: IAgentSetting;
  listNodeEndpointGroup: INodeEndpointGroup[];
  listCampaign: ICampaign[];
  onLoad: (setting: IAgentSetting) => void;
  onDelete: (id: number) => void;
}

const PresetItem = (props: PresetItemProps) => {
  const { setting, listNodeEndpointGroup, listCampaign, onLoad, onDelete } =
    props;
  const { translate } = useTranslation();

  const parsed = useMemo(
    () => JSON.parse(setting.data || "{}"),
    [setting.data],
  );

  const presetChain = useMemo(
    () => _.find(listChainConfig, { dexscreenerKey: parsed.chainKey }),
    [parsed.chainKey],
  );

  const presetNodeGroup = useMemo(
    () => _.find(listNodeEndpointGroup, { id: parsed.nodeEndpointGroupId }),
    [listNodeEndpointGroup, parsed.nodeEndpointGroupId],
  );

  const presetCampaign = useMemo(
    () => _.find(listCampaign, { id: parsed.campaignId }),
    [listCampaign, parsed.campaignId],
  );

  const walletLabel = useMemo(() => {
    const profileIds = JSON.parse(parsed.selectedProfileIds || "[]");
    if (parsed.isAllWallet) {
      return translate("agent.allWallet");
    }
    if (profileIds.length > 0) {
      return `${profileIds.length} wallets`;
    }

    return translate("agent.noWallet");
  }, [parsed.selectedProfileIds, parsed.isAllWallet, translate]);

  return (
    <PresetItemWrapper>
      <div
        className="preset-item-info"
        onClick={() => onLoad(setting)}
        title={translate("button.load")}
      >
        <div className="preset-item-name">{setting.name}</div>

        <div className="preset-item-detail">
          <span>{presetChain?.chainName || EMPTY_STRING}</span>
          <span>{presetNodeGroup?.name || EMPTY_STRING}</span>
          <span>{presetCampaign?.name || EMPTY_STRING}</span>
          <span>{walletLabel}</span>
        </div>
      </div>

      <div className="preset-item-actions">
        <span onClick={() => onLoad(setting)}>{translate("button.load")}</span>

        <span
          className="preset-action-delete"
          onClick={() => onDelete(setting.id!)}
        >
          {translate("button.delete")}
        </span>
      </div>
    </PresetItemWrapper>
  );
};

export default PresetItem;
