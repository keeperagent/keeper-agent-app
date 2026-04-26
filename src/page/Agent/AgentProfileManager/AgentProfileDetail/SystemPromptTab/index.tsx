import { useEffect, useMemo, useState } from "react";
import { Button, Spin, message } from "antd";
import { IAgentProfile } from "@/electron/type";
import { useUpdateAgentProfile } from "@/hook/agentProfile";
import { useGetMainAgentSystemPrompt } from "@/hook/agentProfile";
import { useTranslation } from "@/hook/useTranslation";
import CodeEditor from "@/component/CodeEditor";
import { SystemPromptWrapper } from "./style";

type Props = {
  profile: IAgentProfile;
};

const SystemPromptTab = ({ profile }: Props) => {
  const { translate } = useTranslation();
  const isMainAgent = Boolean(profile.isMainAgent);

  const [draft, setDraft] = useState(profile.systemPrompt || "");
  const [hasFetched, setHasFetched] = useState(false);

  const { systemPrompt: liveSystemPrompt, fetchSystemPrompt } =
    useGetMainAgentSystemPrompt();

  const {
    updateAgentProfile,
    loading: loadingSave,
    isSuccess: isSaveSuccess,
  } = useUpdateAgentProfile();

  useEffect(() => {
    if (isMainAgent) {
      fetchSystemPrompt();
    }
  }, [profile.id]);

  useEffect(() => {
    if (!isMainAgent) {
      setDraft(profile.systemPrompt || "");
    }
  }, [profile.id]);

  useEffect(() => {
    if (isMainAgent && liveSystemPrompt !== null) {
      setHasFetched(true);
      setDraft(liveSystemPrompt || "");
    }
  }, [liveSystemPrompt]);

  useEffect(() => {
    if (isSaveSuccess) {
      message.success(translate("agent.systemPromptSaved"));
    }
  }, [isSaveSuccess]);

  const isContentChanged = useMemo(
    () => !isMainAgent && draft !== (profile.systemPrompt || ""),
    [draft, profile.systemPrompt, isMainAgent],
  );

  const onSave = () => {
    if (loadingSave) {
      return;
    }
    updateAgentProfile({ ...profile, systemPrompt: draft });
  };

  const isLoading = isMainAgent && !hasFetched;

  if (isLoading) {
    return (
      <SystemPromptWrapper>
        <div className="loading-center">
          <Spin />
        </div>
      </SystemPromptWrapper>
    );
  }

  return (
    <SystemPromptWrapper>
      <div className="prompt-header">
        {!isMainAgent && (
          <Button
            type="primary"
            size="middle"
            loading={loadingSave}
            disabled={!isContentChanged}
            onClick={onSave}
            style={{ marginLeft: "auto" }}
          >
            {translate("button.save")}
          </Button>
        )}
      </div>

      {isMainAgent && (
        <span className="prompt-readonly-note">
          {translate("agent.systemPromptReadOnly")}
        </span>
      )}

      <div className="prompt-editor">
        <CodeEditor
          value={draft}
          onChange={isMainAgent ? undefined : setDraft}
          language="markdown"
          height="100%"
          minHeight="200px"
          theme="dark"
          fontSize={13}
          readOnly={isMainAgent}
          lineWrapping
        />
      </div>
    </SystemPromptWrapper>
  );
};

export default SystemPromptTab;
