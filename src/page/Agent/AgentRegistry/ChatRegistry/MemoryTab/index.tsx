import { useEffect, useMemo, useState } from "react";
import { Button, Input, Spin, message } from "antd";
import {
  useGetAgentRegistryMemory,
  useSaveAgentRegistryMemory,
} from "@/hook/agentRegistry";
import { useTranslation } from "@/hook/useTranslation";
import { MemoryWrapper } from "./style";

const { TextArea } = Input;

type Props = {
  agentRegistryId: number;
};

const MemoryTab = ({ agentRegistryId }: Props) => {
  const { translate } = useTranslation();
  const [draft, setDraft] = useState("");
  const {
    content,
    loading: loadingGet,
    getAgentRegistryMemory,
  } = useGetAgentRegistryMemory();
  const {
    saveAgentRegistryMemory,
    loading: loadingSave,
    isSuccess: isSaveSuccess,
  } = useSaveAgentRegistryMemory();

  useEffect(() => {
    getAgentRegistryMemory(agentRegistryId);
  }, [agentRegistryId]);

  useEffect(() => {
    setDraft(content || "");
  }, [content]);

  const isContentChanged = useMemo(
    () => draft !== (content || ""),
    [draft, content],
  );

  useEffect(() => {
    if (isSaveSuccess) {
      message.success(translate("agent.memorySaved"));
      getAgentRegistryMemory(agentRegistryId);
    }
  }, [isSaveSuccess, translate, getAgentRegistryMemory, agentRegistryId]);

  const onSave = () => {
    if (loadingSave) {
      return;
    }
    saveAgentRegistryMemory(agentRegistryId, draft);
  };

  if (loadingGet && !draft) {
    return (
      <MemoryWrapper>
        <div className="loading-center">
          <Spin />
        </div>
      </MemoryWrapper>
    );
  }

  return (
    <MemoryWrapper>
      <div className="memory-header">
        <span className="memory-title">
          {translate("agent.memoryFileLabel")}
        </span>

        <Button
          type="primary"
          size="small"
          loading={loadingSave}
          disabled={!isContentChanged}
          onClick={onSave}
        >
          {translate("button.save")}
        </Button>
      </div>

      <div className="memory-editor">
        <TextArea
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
          }}
          placeholder={translate("agent.memoryPlaceholder")}
          className="custom-input"
          style={{ height: "100%", resize: "none" }}
        />
      </div>
    </MemoryWrapper>
  );
};

export default MemoryTab;
