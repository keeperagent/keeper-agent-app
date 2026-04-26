import { useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { EditorView } from "@codemirror/view";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import { python } from "@codemirror/lang-python";
import type { Extension } from "@codemirror/state";

type CodeEditorLanguage = "json" | "javascript" | "markdown" | "python";

type CodeEditorProps = {
  value?: string;
  onChange?: (value: string) => void;
  height?: string;
  minHeight?: string;
  language?: CodeEditorLanguage;
  readOnly?: boolean;
  lineWrapping?: boolean;
  fontSize?: number;
  className?: string;
  theme?: "dark" | "light";
};

const langExtensions: Record<CodeEditorLanguage, () => Extension> = {
  json: json,
  javascript: javascript,
  markdown: markdown,
  python: python,
};

export default function CodeEditor(props: CodeEditorProps) {
  const {
    value = "",
    onChange,
    height = "200px",
    minHeight,
    language = "javascript",
    readOnly = false,
    lineWrapping = false,
    fontSize = 14,
    className,
    theme: editorTheme = "dark",
  } = props;

  const extensions = useMemo(() => {
    const result: Extension[] = [langExtensions[language]()];
    if (lineWrapping) {
      result.push(EditorView.lineWrapping);
    }
    return result;
  }, [language, lineWrapping]);

  return (
    <CodeMirror
      value={value}
      height={height}
      minHeight={minHeight}
      theme={editorTheme}
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
