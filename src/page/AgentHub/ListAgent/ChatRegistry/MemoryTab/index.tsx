import { useEffect, useMemo, useState } from "react";
import { Button, Spin, message } from "antd";
import { connect } from "react-redux";
import {
  useGetAgentRegistryMemory,
  useSaveAgentRegistryMemory,
} from "@/hook/agentRegistry";
import { useTranslation } from "@/hook/useTranslation";
import { RootState } from "@/redux/store";
import CodeEditor from "@/component/CodeEditor";
import { MemoryWrapper } from "./style";

type Props = {
  agentRegistryId: number;
  isLightMode: boolean;
};

const MemoryTab = ({ agentRegistryId, isLightMode }: Props) => {
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
  }, [isSaveSuccess]);

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
          size="middle"
          loading={loadingSave}
          disabled={!isContentChanged}
          onClick={onSave}
        >
          {translate("button.save")}
        </Button>
      </div>

      <div className="memory-editor">
        <CodeEditor
          value={draft}
          onChange={setDraft}
          language="markdown"
          height="100%"
          theme="dark"
          fontSize={13}
        />
      </div>
    </MemoryWrapper>
  );
};

export default connect((state: RootState) => ({
  isLightMode: state.Layout.isLightMode,
}))(MemoryTab);
