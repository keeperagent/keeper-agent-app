import { LLM_PROVIDERS } from "@/config/llmProviders";
import { ProviderRow, ProviderItem } from "./style";

type Props = {
  value?: string;
  onChange?: (value: string) => void;
  listBlackList?: string[];
};

const LlmProviderPicker = ({ value, onChange, listBlackList }: Props) => {
  const providers = listBlackList?.length
    ? LLM_PROVIDERS.filter((provider) => !listBlackList.includes(provider.key))
    : LLM_PROVIDERS;

  return (
    <ProviderRow>
      {providers.map((provider) => (
        <ProviderItem
          key={provider.key}
          className={value === provider.key ? "active" : ""}
          onClick={() => onChange?.(provider.key)}
        >
          <img src={provider.icon} alt={provider.label} />
          <span>{provider.label}</span>
        </ProviderItem>
      ))}
    </ProviderRow>
  );
};

export default LlmProviderPicker;
