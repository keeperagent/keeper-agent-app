import { useEffect, useMemo, useState } from "react";
import { Button, Spin, message } from "antd";
import { connect } from "react-redux";
import {
  useGetAgentProfileMemory,
  useSaveAgentProfileMemory,
} from "@/hook/agentProfile";
import { useTranslation } from "@/hook/useTranslation";
import { RootState } from "@/redux/store";
import CodeEditor from "@/component/CodeEditor";
import { MemoryWrapper } from "./style";

type Props = {
  agentProfileId: number;
};

const MemoryTab = ({ agentProfileId }: Props) => {
  const { translate } = useTranslation();
  const [draft, setDraft] = useState("");
  const {
    content,
    loading: loadingGet,
    getAgentProfileMemory,
  } = useGetAgentProfileMemory();
  const {
    saveAgentProfileMemory,
    loading: loadingSave,
    isSuccess: isSaveSuccess,
  } = useSaveAgentProfileMemory();

  useEffect(() => {
    getAgentProfileMemory(agentProfileId);
  }, [agentProfileId]);

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
      getAgentProfileMemory(agentProfileId);
    }
  }, [isSaveSuccess]);

  const onSave = () => {
    if (loadingSave) {
      return;
    }
    saveAgentProfileMemory(agentProfileId, draft);
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

export default connect((_state: RootState) => ({}))(MemoryTab);
