import { CloseIcon } from "@/component/Icon";
import { useTranslation } from "@/hook";
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

  if (files.length === 0) return null;

  return (
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
            <div className="card-preview card-preview--image">
              <img src={file.previewUrl} alt={file.name} />
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
  );
};

export default AttachedFiles;
