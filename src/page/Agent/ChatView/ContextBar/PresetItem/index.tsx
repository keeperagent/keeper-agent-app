import { useMemo } from "react";
import _ from "lodash";
import { Badge } from "antd";
import { ISetting, ICampaign, INodeEndpointGroup } from "@/electron/type";
import { useTranslation } from "@/hook";
import { EMPTY_STRING } from "@/config/constant";
import { listChainConfig } from "@/page/Agent/config";
import { PresetItemWrapper } from "./style";

interface PresetItemProps {
  setting: ISetting;
  listNodeEndpointGroup: INodeEndpointGroup[];
  listCampaign: ICampaign[];
  onLoad: (setting: ISetting) => void;
  onDelete: (id: number) => void;
  isActive?: boolean;
}

const PresetItem = (props: PresetItemProps) => {
  const {
    setting,
    listNodeEndpointGroup,
    listCampaign,
    onLoad,
    onDelete,
    isActive,
  } = props;
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
    <PresetItemWrapper $isActive={isActive}>
      <div
        className="preset-item-info"
        onClick={() => onLoad(setting)}
        title={translate("button.load")}
      >
        <div className="preset-item-name">
          <span>{setting.name}</span>
          {isActive && <Badge status="success" className="preset-active-dot" />}
        </div>

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
