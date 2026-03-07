import { useTranslation } from "@/hook";
import { LOCALE } from "@/language";
import { Wrapper } from "./style";

const WorkflowInstruction = () => {
  const { locale } = useTranslation();

  const enContent = () => (
    <Wrapper>
      <div className="item">
        This is one of the most important features of KeeperAgent, which helps
        you automate operations with the Chrome emulator.
      </div>

      <div className="item" style={{ marginTop: "1rem" }}>
        In addition to automating web browser operations such as clicking,
        opening websites, entering text into forms, etc., you can also interact
        directly with the blockchain just by dragging and dropping.
      </div>

      <div className="item" style={{ marginTop: "1rem" }}>
        To run a Scenario with active wallet accounts, Twitter accounts, ... or
        to use a static proxy or rotating proxy when running the simulation, you
        need to combine the Scenario with Profile through the feature{" "}
        <span className="highlight-text bold">Campaign</span>
      </div>
    </Wrapper>
  );

  return locale === LOCALE.EN ? enContent() : enContent();
};

export default WorkflowInstruction;
