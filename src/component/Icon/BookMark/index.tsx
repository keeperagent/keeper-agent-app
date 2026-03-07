import gsap from "gsap";
import { useEffect } from "react";
import { Wrapper } from "./style";

interface BookMarkIconProps {
  style?: React.CSSProperties;
  isActive?: boolean;
  id: string;
}

const BookMarkIcon = (props: BookMarkIconProps) => {
  const { style, isActive, id } = props;

  useEffect(() => {
    const button = document.getElementById(id);
    if (!isActive) {
    }
    if (!button) {
      return;
    }

    if (isActive) {
      gsap.set(button, {
        "--icon-color": "#7FC8A9",
      });
      gsap.set(button, {
        "--default-y": "0px",
        "--default-position": "0px",
        "--icon-background-height": "19px",
      });
    } else {
      gsap.set(button, {
        // revert to default color icon
        "--icon-color": "var(--icon-color-default)",
      });
    }
  }, [isActive, id]);

  return (
    <Wrapper id={id} style={style}>
      <svg viewBox="0 0 36 36">
        <path
          className="filled"
          d="M26 6H10V18V30C10 30 17.9746 23.5 18 23.5C18.0254 23.5 26 30 26 30V18V6Z"
        />
        <path
          className="default"
          d="M26 6H10V18V30C10 30 17.9746 23.5 18 23.5C18.0254 23.5 26 30 26 30V18V6Z"
        />
        <path
          className="corner"
          d="M10 6C10 6 14.8758 6 18 6C21.1242 6 26 6 26 6C26 6 26 6 26 6H10C10 6 10 6 10 6Z"
        />
      </svg>
    </Wrapper>
  );
};

export default BookMarkIcon;
