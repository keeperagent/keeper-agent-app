import { useTranslation } from "@/hook";
import { LOCALE } from "@/language";
import { Wrapper } from "./style";

const ExtensionInstruction = () => {
  const { locale } = useTranslation();

  const enContent = () => (
    <Wrapper>
      <div className="item">
        When the Workflow needs to interact with an extension (e.g. Metamask
        wallet extension), you can get the extension here. Extensions can be
        downloaded directly from the Chrome Store or imported from the file you
        upload. The easy and recommended way to import extensions is{" "}
        <span className="highlight-text bold">Import from link</span>.
      </div>

      <div className="item" style={{ marginTop: "1rem" }}>
        All data related to the extension is saved locally on your computer.
        KeeperAgent does not save, nor interfere or modify the code of these
        extensions.
      </div>
    </Wrapper>
  );

  return locale === LOCALE.EN ? enContent() : enContent();
};

export default ExtensionInstruction;
