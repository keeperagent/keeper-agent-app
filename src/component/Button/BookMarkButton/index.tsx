import { useEffect } from "react";
import gsap from "gsap";
import { BookMarkButtonWrapper } from "./style";

interface BookmarkButtonProps {
  text: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

const BookMarkButton = (props: BookmarkButtonProps) => {
  const { text, onClick, style } = props;

  const bookMarkAnimation = () => {
    document.querySelectorAll(".bookmark").forEach((button) => {
      button.addEventListener("pointerdown", () => {
        if (!button.classList.contains("marked")) {
          return;
        }

        gsap.to(button.querySelectorAll(".default, .filled"), {
          attr: {
            d: "M26 6H10V18C10 22.6863 11 28 11 28C11 28 17.5273 19.5 18 19.5C18.4727 19.5 25 28 25 28C25 28 26 22.6863 26 18V6Z",
          },
          duration: 0.15,
        });
      });

      button.addEventListener("click", (e) => {
        e.preventDefault();

        if (button.classList.contains("animated")) {
          return;
        }
        button.classList.add("animated");

        // revert effect to default,
        if (button.classList.contains("marked")) {
          button.classList.remove("marked");
          gsap.fromTo(
            button.querySelectorAll(".default, .filled"),
            {
              attr: {
                d: "M26 6H10V18C10 22.6863 11 28 11 28C11 28 17.5273 19.5 18 19.5C18.4727 19.5 25 28 25 28C25 28 26 22.6863 26 18V6Z",
              },
            },
            {
              keyframes: [
                {
                  attr: {
                    d: "M26 6H10V18C10 22.6863 9 30 9 30C9 30 16.9746 23.5 18 20.5C20.0254 24.5 26 30 27 30C28 30 26 22.6863 26 18V6Z",
                  },
                  duration: 0.15,
                },
                {
                  attr: {
                    d: "M26 6H10V18C10 22.6863 11 28 11 28C11 28 17.5273 19.5 18 19.5C18.4727 19.5 25 28 25 28C25 28 26 22.6863 26 18V6Z",
                  },
                  duration: 0.7,
                  ease: "elastic.out(1, 0.3)",
                  onComplete() {
                    gsap.set(button, {
                      // revert to default color icon
                      "--icon-color": "var(--icon-color-default)",
                    });
                    button.classList.remove("animated");
                  },
                },
              ],
            }
          );
          gsap.to(button, {
            "--default-position": "24px",
            duration: 0.1,
            clearProps: true,
          });
          return;
        }

        gsap.to(button, {
          "--icon-background-height": "0px",
          duration: 0.1,
          delay: 0.2,
        });
        gsap.to(button, {
          "--default-y": "-28px",
          duration: 0.3,
        });
        gsap.to(button.querySelector(".corner"), {
          keyframes: [
            {
              attr: {
                d: "M10 6C10 6 14.8758 6 18 6C21.1242 6 26 6 26 6C26 6 28 8.5 28 10H8C8 8.5 10 6 10 6Z",
              },
              ease: "none",
              duration: 0.125,
            },
            {
              attr: {
                d: "M9.99999 6C9.99999 6 14.8758 6 18 6C21.1242 6 26 6 26 6C26 6 31 10.5 26 14H9.99999C4.99999 10.5 9.99999 6 9.99999 6Z",
              },
              ease: "none",
              duration: 0.15,
            },
            {
              attr: {
                d: "M7.99998 16.5C7.99998 16.5 9.87579 22.5 18 22.5C26.1242 22.5 28 16.5 28 16.5C28 16.5 31 20 26 23.5H9.99998C4.99998 20 7.99998 16.5 7.99998 16.5Z",
              },
              ease: "power1.in",
              duration: 0.125,
              onComplete() {
                // make bg when animated
                gsap.set(button, {
                  "--icon-color": "var(--icon-color-default)",
                });
                gsap.set(button.querySelector(".corner"), {
                  "--duration": "0s",
                  fill: "#8a91b4",
                  delay: 0.05,
                });
              },
            },
            {
              attr: {
                d: "M8 28C8 28 12.8758 28.5 18 25.5C23.1242 28.5 28 27.5 28 27.5C28 27.5 26 24 26 23.5H10C10 25 8 28 8 28Z",
              },
              ease: "none",
              duration: 0.125,

              onComplete() {
                gsap.set(button.querySelector(".corner"), {
                  "--duration": ".5s",
                  onComplete() {
                    button.classList.add("marked");
                  },
                });
              },
            },
            {
              attr: {
                d: "M10 30C10 30 17.8758 23.5 18 23.5C18.1242 23.5 26 30 26 30C26 30 26 23.5 26 23H10C10 24.5 10 30 10 30Z",
              },
              ease: "elastic.out(1, 0.7)",
              duration: 0.3,
              delay: 0.1,
              onComplete() {
                gsap.set(button.querySelector(".corner"), {
                  attr: {
                    d: "M10 6C10 6 14.8758 6 18 6C21.1242 6 26 6 26 6C26 6 26 6 26 6H10C10 6 10 6 10 6Z",
                  },
                  clearProps: true,
                });
                gsap.set(button, {
                  "--icon-color": "#f04949",
                });
                button.classList.remove("animated");
                gsap.set(button, {
                  "--default-y": "0px",
                  "--default-position": "0px",
                  "--icon-background-height": "19px",
                });
              },
            },
          ],
        });
      });
    });
  };

  useEffect(() => {
    bookMarkAnimation();
  }, []);

  return (
    <BookMarkButtonWrapper className="bookmark" style={style} onClick={onClick}>
      <div className="icon">
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
      </div>
      <span className="text">{text}</span>
    </BookMarkButtonWrapper>
  );
};

export default BookMarkButton;
