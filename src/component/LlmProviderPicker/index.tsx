import { Tooltip } from "antd";
import { IPreference } from "@/electron/type";
import { LLM_PROVIDERS, isProviderConfigured } from "@/config/llmProviders";
import { ProviderRow, ProviderItem } from "./style";

type Props = {
  value?: string;
  onChange?: (value: string) => void;
  listBlackList?: string[];
  preference?: IPreference | null;
};

const LlmProviderPicker = ({
  value,
  onChange,
  listBlackList,
  preference,
}: Props) => {
  const providers = listBlackList?.length
    ? LLM_PROVIDERS.filter((provider) => !listBlackList.includes(provider.key))
    : LLM_PROVIDERS;

  return (
    <ProviderRow>
      {providers.map((provider) => {
        const isDisabled = !isProviderConfigured(provider, preference);
        const tooltipTitle = isDisabled
          ? `${provider.label} API key or model is not configured`
          : provider.label;

        return (
          <Tooltip key={provider.key} title={tooltipTitle}>
            <ProviderItem
              className={[
                value === provider.key ? "active" : "",
                isDisabled ? "disabled" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => !isDisabled && onChange?.(provider.key)}
            >
              <img src={provider.icon} alt={provider.label} />
              <span>{provider.label}</span>
            </ProviderItem>
          </Tooltip>
        );
      })}
    </ProviderRow>
  );
};

export default LlmProviderPicker;
