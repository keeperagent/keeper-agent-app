import { useEffect, useRef } from "react";
import { SearchInputWrapper } from "./style";
import gsap from "gsap";

interface SVGLineProxy {
  x: number | null;
}

interface SearchInputProps {
  onChange: any;
  value: string;
  style?: React.CSSProperties;
  placeholder?: string;
  autoFocus?: boolean;
}

const SearchInput = (props: SearchInputProps) => {
  const { onChange, value, style, placeholder, autoFocus } = props;
  const { to, set } = gsap;
  const inputRef = useRef<HTMLInputElement | null>(null);

  const animationSearchInputGsap = () => {
    function delay(fn: (...args: any[]) => void) {
      let timer: any;
      return function (...args: any[]) {
        clearTimeout(timer);
        timer = setTimeout(() => {
          fn(...args);
        }, 500);
      };
    }

    function getPoint(
      point: number[],
      i: number,
      a: number[][],
      smoothing: number,
    ) {
      const cp = (
          current: number[],
          previous: number[],
          next: number[],
          reverse: boolean,
        ) => {
          const p = previous || current,
            n = next || current,
            o = {
              length: Math.sqrt(
                Math.pow(n[0] - p[0], 2) + Math.pow(n[1] - p[1], 2),
              ),
              angle: Math.atan2(n[1] - p[1], n[0] - p[0]),
            },
            angle = o.angle + (reverse ? Math.PI : 0),
            length = o.length * smoothing;
          return [
            current[0] + Math.cos(angle) * length,
            current[1] + Math.sin(angle) * length,
          ];
        },
        cps = cp(a[i - 1], a[i - 2], point, false),
        cpe = cp(point, a[i - 1], a[i + 1], true);
      return `C ${cps[0]},${cps[1]} ${cpe[0]},${cpe[1]} ${point[0]},${point[1]}`;
    }

    function getPath(x: number, smoothing: number): string {
      return [
        [2, 2],
        [12 - x, 12 + x],
        [22, 22],
      ].reduce(
        (acc, point, i, a) =>
          i === 0
            ? `M ${point[0]},${point[1]}`
            : `${acc} ${getPoint(point, i, a, smoothing)}`,
        "",
      );
    }

    const onClearingInput = (
      classList: any,
      elem: any,
      input: any,
      svgLineProxy: SVGLineProxy,
    ) => {
      classList.add("clearing");
      set(elem, {
        "--background": "transparent",
        "--clear-swipe-left": (input.offsetWidth - 16) * -1 + "px",
      });
      to(elem, {
        keyframes: [
          {
            "--clear-rotate": "45deg",
            duration: 0.25,
          },
          {
            "--clear-arrow-x": "2px",
            "--clear-arrow-y": "-2px",
            duration: 0.15,
          },
          {
            "--clear-arrow-x": "-3px",
            "--clear-arrow-y": "3px",
            "--clear-swipe": "-3px",
            duration: 0.15,
            onStart() {
              to(svgLineProxy, {
                x: 3,
                duration: 0.1,
                delay: 0.05,
              });
            },
          },
          {
            "--clear-swipe-x": 1,
            "--clear-x": input.offsetWidth * -1 + "px",
            duration: 0.45,
            onComplete() {
              input.value = "";
              onChange("");
              input.focus();
              to(elem, {
                "--clear-arrow-offset": "4px",
                "--clear-arrow-offset-second": "4px",
                "--clear-line-array": "8.5px",
                "--clear-line-offset": "27px",
                "--clear-long-offset": "24px",
                "--clear-rotate": "0deg",
                "--clear-arrow-o": 1,
                duration: 0,
                delay: 0.7,
                onStart() {
                  classList.remove("clearing");
                },
              });
              to(elem, {
                "--clear-opacity": 0,
                duration: 0.2,
                delay: 0.55,
              });
              to(elem, {
                "--clear-arrow-o": 0,
                "--clear-arrow-x": "0px",
                "--clear-arrow-y": "0px",
                "--clear-swipe": "0px",
                duration: 0.15,
              });
              to(svgLineProxy, {
                x: 0,
                duration: 0.45,
                ease: "elastic.out(1, .75)",
              });
            },
          },
          {
            "--clear-swipe-x": 0,
            "--clear-x": "0px",
            duration: 0.4,
            delay: 0.35,
          },
        ],
      });
      to(elem, {
        "--clear-arrow-offset": "0px",
        "--clear-arrow-offset-second": "8px",
        "--clear-line-array": "28.5px",
        "--clear-line-offset": "57px",
        "--clear-long-offset": "17px",
        duration: 0.2,
      });
    };

    document.querySelectorAll(".input").forEach((elem) => {
      const clear = elem?.querySelector(".clear") as HTMLElement;
      const input = elem?.querySelector("input") as HTMLInputElement;
      const { classList } = elem;
      const svgLine = clear?.querySelector(".line") as SVGPathElement;

      const svgLineProxy: SVGLineProxy = new Proxy(
        {
          x: null,
        },
        {
          set(target: any, key, value) {
            target[key] = value;
            if (target.x !== null) {
              svgLine?.setAttribute("d", getPath(target.x, 0.1925));
            }
            return true;
          },
          get(target, key) {
            return target[key];
          },
        },
      );

      svgLineProxy.x = 0;

      input?.addEventListener(
        "input",
        delay((_e: Event) => {
          if (input.value !== "") {
            // Set background for clear icon when there is input
            to(elem, {
              "--background": "var(--close-background)",
            });
          }

          const bool = (input.value as string).length;
          to(elem, {
            "--clear-scale": bool ? 1 : 0,
            duration: bool ? 0.5 : 0.15,
            ease: bool ? "elastic.out(1, .7)" : "none",
          });
          to(elem, {
            "--clear-opacity": bool ? 1 : 0,
            duration: 0.15,
          });
        }),
      );

      clear?.addEventListener("click", () => {
        onClearingInput(classList, elem, input, svgLineProxy);
      });
    });
  };

  const onInputChange = (event: any) => {
    const { value } = event?.target;
    onChange(value);
  };

  useEffect(() => {
    animationSearchInputGsap();
  }, []);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  return (
    <SearchInputWrapper style={style}>
      <div className="input">
        <div className="text">
          <input
            type="text"
            placeholder={placeholder}
            onChange={onInputChange}
            value={value}
            autoFocus={autoFocus}
            ref={inputRef}
          />
        </div>
        <button className="clear">
          <svg viewBox="0 0 24 24">
            <path
              className="line"
              d="M 2,2 C 3.925,3.925 8.149999999999999,8.15 12,12 C 15.85,15.85 20.075,20.075 22,22"
            ></path>
            <path className="long" d="M9 15L20 4"></path>
            <path className="arrow" d="M13 11V7"></path>
            <path className="arrow" d="M17 11H13"></path>
          </svg>
        </button>
      </div>
    </SearchInputWrapper>
  );
};

export default SearchInput;
