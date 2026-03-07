import { LOCALE } from "@/language";
import { useTranslation } from "@/hook";
import { Wrapper } from "./style";

const ProxyInstruction = () => {
  const { locale } = useTranslation();

  const enContent = () => (
    <Wrapper>
      <div className="item">
        When running multiple profiles, some applications will check IP to
        restrict access if there are signs of too much spam. Proxies can help
        you solve the above problem.
      </div>
    </Wrapper>
  );

  return locale === LOCALE.EN ? enContent() : enContent();
};

export default ProxyInstruction;
