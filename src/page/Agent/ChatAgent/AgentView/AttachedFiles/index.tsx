import { useState } from "react";
import { Modal } from "antd";
import { CloseIcon } from "@/component/Icon";
import { useTranslation, useReadFileAsDataUrl } from "@/hook";
import { AttachedFileCard, AttachedFilesWrapper } from "./style";

export type AttachedFile = {
  path: string;
  name: string;
  extension: string; // e.g. "pdf", "jpg"
  type: "image" | "other";
  previewUrl?: string; // only set when we can show an image preview
  isTemp?: boolean; // true for clipboard-pasted images saved to ka_temp
};

type AttachedFilesProps = {
  files: AttachedFile[];
  onRemove: (index: number) => void;
};

const getDisplayExtension = (file: AttachedFile): string =>
  file.extension ? file.extension.toUpperCase() : "FILE";

const AttachedFiles = ({ files, onRemove }: AttachedFilesProps) => {
  const { translate } = useTranslation();
  const { readFileAsDataUrl } = useReadFileAsDataUrl();
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string>("");

  const handleImageClick = async (file: AttachedFile) => {
    if (file.previewUrl) {
      setPreviewName(file.name);
      setPreviewSrc(file.previewUrl);
      return;
    }
    const dataUrl = await readFileAsDataUrl(file.path);
    if (dataUrl) {
      setPreviewName(file.name);
      setPreviewSrc(dataUrl);
    }
  };

  if (files.length === 0) return null;

  return (
    <>
      <AttachedFilesWrapper>
        {files.map((file, index) => (
          <AttachedFileCard key={`${file.path}-${index}`}>
            <button
              type="button"
              className="card-remove"
              onClick={() => onRemove(index)}
              aria-label={translate("agent.removeAttachment")}
            >
              <CloseIcon width={12} height={12} color="currentColor" />
            </button>

            {file.previewUrl ? (
              <div
                className="card-preview card-preview--image card-preview--clickable"
                onClick={() => handleImageClick(file)}
              >
                <img src={file.previewUrl} alt={file.name} />
              </div>
            ) : file.type === "image" ? (
              <div
                className="card-preview card-preview--other card-preview--clickable"
                onClick={() => handleImageClick(file)}
              >
                <span className="card-extension">
                  {getDisplayExtension(file)}
                </span>
                <span className="card-filename">{file.name}</span>
              </div>
            ) : (
              <div className="card-preview card-preview--other">
                <span className="card-extension">
                  {getDisplayExtension(file)}
                </span>
                <span className="card-filename">{file.name}</span>
              </div>
            )}
          </AttachedFileCard>
        ))}
      </AttachedFilesWrapper>

      <Modal
        open={Boolean(previewSrc)}
        footer={null}
        onCancel={() => setPreviewSrc(null)}
        title={previewName}
        width="auto"
        style={{ top: "5rem", maxWidth: "60vw" }}
      >
        {previewSrc && (
          <img
            src={previewSrc}
            alt={previewName}
            style={{
              maxWidth: "100%",
              borderRadius: "var(--border-radius)",
              margin: "var(--margin-top) 0",
            }}
          />
        )}
      </Modal>
    </>
  );
};

export default AttachedFiles;
