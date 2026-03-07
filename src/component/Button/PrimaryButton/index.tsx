import { SpinIcon } from "@/component/Icon";
import { PrimaryButtonWrapper } from "./style";

interface PrimaryButtonProps {
  style?: any;
  text: string;
  loading?: boolean;
  onClick?: any;
  icon?: JSX.Element;
  disabled?: boolean;
}

const PrimaryButton = (props: PrimaryButtonProps) => {
  const { style, text, loading, onClick, icon: Icon, disabled } = props;

  return (
    <PrimaryButtonWrapper
      style={style}
      type="button"
      onClick={onClick}
      isLoading={Boolean(loading)}
      disabled={disabled}
    >
      {Icon ? <div className="icon-wrapper">{Icon}</div> : null}

      <span className="text">{text}</span>

      {loading ? (
        <div className="loading">
          <div className="loading-icon">
            <SpinIcon />
          </div>
        </div>
      ) : null}
    </PrimaryButtonWrapper>
  );
};

export default PrimaryButton;
