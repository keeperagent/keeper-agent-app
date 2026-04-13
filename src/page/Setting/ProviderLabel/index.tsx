import { LLMProvider } from "@/electron/type";
import { LLM_PROVIDERS } from "@/config/llmProviders";
import { Wrapper } from "./style";

type IProps = {
  provider: LLMProvider;
  label: string;
};

const ProviderLabel = ({ provider, label }: IProps) => {
  const providerConfig = LLM_PROVIDERS.find((item) => item.key === provider);
  return (
    <Wrapper>
      {providerConfig && (
        <img src={providerConfig.icon} alt={providerConfig.label} />
      )}
      {label}
    </Wrapper>
  );
};

export { ProviderLabel };
