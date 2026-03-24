import { LLM_PROVIDERS } from "@/config/llmProviders";
import { ProviderRow, ProviderItem } from "./style";

type Props = {
  value?: string;
  onChange?: (value: string) => void;
};

const LlmProviderPicker = ({ value, onChange }: Props) => {
  return (
    <ProviderRow>
      {LLM_PROVIDERS.map((provider) => (
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
