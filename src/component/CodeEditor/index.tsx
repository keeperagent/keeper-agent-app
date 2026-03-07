import { useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import type { Extension } from "@codemirror/state";

type CodeEditorLanguage = "json" | "javascript" | "markdown";

type CodeEditorProps = {
  value?: string;
  onChange?: (value: string) => void;
  height?: string;
  language?: CodeEditorLanguage;
  readOnly?: boolean;
  fontSize?: number;
  className?: string;
};

const langExtensions: Record<CodeEditorLanguage, () => Extension> = {
  json: json,
  javascript: javascript,
  markdown: markdown,
};

export default function CodeEditor(props: CodeEditorProps) {
  const {
    value = "",
    onChange,
    height = "200px",
    language = "javascript",
    readOnly = false,
    fontSize = 14,
    className,
  } = props;

  const extensions = useMemo(() => [langExtensions[language]()], [language]);

  return (
    <CodeMirror
      value={value}
      height={height}
      theme="dark"
      extensions={extensions}
      onChange={(v) => onChange?.(v)}
      editable={!readOnly}
      basicSetup={{
        lineNumbers: true,
        foldGutter: true,
        highlightActiveLineGutter: true,
        highlightActiveLine: true,
      }}
      style={{ fontSize: `${fontSize}px` }}
      className={className}
    />
  );
}
