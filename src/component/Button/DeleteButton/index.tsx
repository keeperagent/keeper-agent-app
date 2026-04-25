import { useEffect, useRef } from "react";
import { DeleteButtonWrapper } from "./style";

// reference: https://dribbble.com/shots/10276145-Trash-Delete-Button

interface DeleteButtonProps {
  disabled?: boolean;
  style?: React.CSSProperties;
  loading?: boolean;
  text: string;
  onClick?: any;
}

const DeleteButton = (props: DeleteButtonProps) => {
  const { style, disabled, loading = false, text, onClick } = props;
  const btnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loading) {
      const deleteBtn = btnRef.current;

      if (deleteBtn && !deleteBtn.classList.contains("delete")) {
        deleteBtn.classList.add("delete");
        setTimeout(() => deleteBtn.classList.remove("delete"), 3200);
      }
    }
  }, [loading]);

  return (
    <DeleteButtonWrapper
      ref={btnRef}
      onClick={onClick}
      style={style}
      disabled={disabled}
      isLoading={loading}
    >
      <div className="trash">
        <div className="top">
          <div className="paper"></div>
        </div>

        <div className="box"></div>
      </div>

      <span>{text}</span>
    </DeleteButtonWrapper>
  );
};

export default DeleteButton;
