import { useEffect, ChangeEvent, useState } from "react";
import { Input, Form, Tooltip } from "antd";
import gsap from "gsap";
import {
  HiddenPasswordIconWrapper,
  PasswordInputWrapper,
  IconWrapper,
  TooltipWrapper,
} from "./style";
import { useTranslation } from "@/hook";

const ShowPasswordIcon = () => {
  return (
    <HiddenPasswordIconWrapper>
      <button>
        <svg viewBox="0 0 21 21">
          <circle className="eye" cx="10.5" cy="10.5" r="2.25"></circle>
          <path
            className="top"
            d="M2 10.5C2 10.5 6.43686 15.5 10.5 15.5C14.5631 15.5 19 10.5 19 10.5"
            data-original="M2 10.5C2 10.5 6.43686 5.5 10.5 5.5C14.5631 5.5 19 10.5 19 10.5"
          ></path>
          <path
            className="bottom"
            d="M2 10.5C2 10.5 6.43686 15.5 10.5 15.5C14.5631 15.5 19 10.5 19 10.5"
          ></path>
          <g className="lashes">
            <path d="M10.5 15.5V18"></path>
            <path d="M14.5 14.5L15.25 17"></path>
            <path d="M6.5 14.5L5.75 17"></path>
            <path d="M3.5 12.5L2 15"></path>
            <path d="M17.5 12.5L19 15"></path>
          </g>
        </svg>
      </button>
    </HiddenPasswordIconWrapper>
  );
};

const HiddenPasswordIcon = () => {
  return (
    <HiddenPasswordIconWrapper>
      <button>
        <svg viewBox="0 0 21 21">
          <circle className="eye" cx="10.5" cy="10.5" r="2.25"></circle>
          <path
            className="top"
            d="M2 10.5C2 10.5 6.43686 5.5 10.5 5.5C14.5631 5.5 19 10.5 19 10.5"
          ></path>
          <path
            className="bottom"
            d="M2 10.5C2 10.5 6.43686 15.5 10.5 15.5C14.5631 15.5 19 10.5 19 10.5"
          ></path>
          <g className="lashes">
            <path d="M10.5 15.5V18"></path>
            <path d="M14.5 14.5L15.25 17"></path>
            <path d="M6.5 14.5L5.75 17"></path>
            <path d="M3.5 12.5L2 15"></path>
            <path d="M17.5 12.5L19 15"></path>
          </g>
        </svg>
      </button>
    </HiddenPasswordIconWrapper>
  );
};

type IProps = {
  name?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  onPressEnter?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  allowClear?: boolean;
  width?: string;
  extendClass?: string;
  initialValue?: string;
  shouldHideValue?: boolean;
};

const PasswordInput = (props: IProps) => {
  const {
    name,
    placeholder,
    allowClear,
    width,
    onChange,
    onPressEnter,
    extendClass,
    initialValue,
    shouldHideValue,
  } = props;
  const [currentValue, setCurrentValue] = useState<string>("");
  const { translate } = useTranslation();
  const { timeline } = gsap;

  useEffect(() => {
    setCurrentValue(initialValue || "");
  }, [initialValue]);

  const animationPasswordInput = () => {
    gsap.registerPlugin();

    document
      .querySelectorAll<HTMLDivElement>(`.password-field-${extendClass}`)
      .forEach((field) => {
        const button = field.querySelector<HTMLButtonElement>("button"),
          hiddenIcon = field.querySelector<HTMLButtonElement>("button"),
          time = timeline({
            paused: true,
          })
            .to(field.querySelector<SVGPathElement>("svg .top"), {
              duration: 0.2,
              attr: {
                d: "M2 10.5C2 10.5 6.43686 15.5 10.5 15.5C14.5631 15.5 19 10.5 19 10.5",
              },
            })
            .to(
              hiddenIcon,
              {
                keyframes: [
                  {
                    "--eye-s": 0,
                    "--eye-background": 1,
                    duration: 0.2,
                  },
                  {
                    "--eye-offset": "0",
                    duration: 0.15,
                  },
                ],
              },
              0,
            );

        hiddenIcon?.addEventListener("click", () => {
          const inputPasswordElement = document
            ?.querySelector(`.input-password-${extendClass}`)
            ?.querySelector("input");

          // show password
          if (field.classList.contains("show")) {
            inputPasswordElement?.setAttribute("type", "password");
            field.classList.remove("show");
            time.reverse(0);
            return;
          }

          // hidden password
          inputPasswordElement?.setAttribute("type", "text");
          field.classList.add("show");
          time.play(0);
        });

        field.addEventListener("pointermove", (e) => {
          const rect: any = button?.getBoundingClientRect();
          const fullWidth = rect?.width;
          const halfWidth = fullWidth / 2;
          const fullHeight = rect?.height;
          const halfHeight = fullHeight / 2;
          const x = e.clientX - rect.left - halfWidth,
            y = e.clientY - rect.top - halfHeight;

          hiddenIcon?.style.setProperty(
            "--eye-x",
            (x < -halfWidth ? -halfWidth : x > fullWidth ? fullWidth : x) / 15 +
              "px",
          );

          hiddenIcon?.style.setProperty(
            "--eye-y",
            (y < -halfHeight ? -halfHeight : y > fullHeight ? fullHeight : y) /
              25 +
              "px",
          );
        });

        field.addEventListener("pointerleave", () => {
          hiddenIcon?.style.setProperty("--eye-x", "0px");
          hiddenIcon?.style.setProperty("--eye-y", "0px");
        });
      });
  };

  useEffect(() => {
    animationPasswordInput();
  }, []);

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange && onChange(event?.target?.value);
    setCurrentValue(event?.target?.value);
  };

  return (
    <PasswordInputWrapper style={{ width: width || "auto" }}>
      <Form.Item
        name={name}
        className={`password-field password-field-${extendClass}`}
      >
        <Input.Password
          placeholder={placeholder || "•••••••"}
          iconRender={(visible) => (
            <IconWrapper>
              {shouldHideValue && (
                <Tooltip
                  title={
                    <TooltipWrapper>
                      <div className="title">
                        {translate("input.passwordInputInstruction")}:
                      </div>

                      <div className="item">
                        <span
                          className="circle"
                          style={{
                            backgroundColor: "var(--color-success)",
                          }}
                        />

                        <div className="value">
                          {translate("input.passwordInputNotEmpty")}
                        </div>
                      </div>

                      <div className="item">
                        <span
                          className="circle"
                          style={{
                            backgroundColor: "var(--color-error)",
                          }}
                        />

                        <div className="value">
                          {translate("input.passwordInputEmpty")}
                        </div>
                      </div>
                    </TooltipWrapper>
                  }
                >
                  <span
                    className="circle"
                    style={{
                      backgroundColor: currentValue
                        ? "var(--color-success)"
                        : "var(--color-error)",
                    }}
                  />
                </Tooltip>
              )}

              <span>
                {visible ? <ShowPasswordIcon /> : <HiddenPasswordIcon />}
              </span>
            </IconWrapper>
          )}
          className={`input-password input-password-${extendClass}`}
          allowClear={allowClear}
          onChange={onInputChange}
          onPressEnter={(event: React.KeyboardEvent<HTMLInputElement>) => {
            if (onPressEnter) {
              onPressEnter(event);
            }
          }}
        />
      </Form.Item>
    </PasswordInputWrapper>
  );
};

export default PasswordInput;
