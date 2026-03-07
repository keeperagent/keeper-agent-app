import { UploadButtonWrapper } from "./style";
import { useEffect } from "react";
import gsap from "gsap";

interface UploadButtonProps {
  text: string;
  isUploadButton: boolean;
  onClick?: any;
  style?: React.CSSProperties;
}

const UploadButton = (props: UploadButtonProps) => {
  const { text, onClick, isUploadButton, style } = props;

  const animationDownloadButton = () => {
    function getPath(update: number, smoothing: number, pointsNew: any) {
      const points = pointsNew
          ? pointsNew
          : [
              [5, 12],
              [12, update],
              [19, 12],
            ],
        d = points.reduce(
          (acc: string, point: any, i: number, a: any) =>
            i === 0
              ? `M ${point[0]},${point[1]}`
              : `${acc} ${getPoint(point, i, a, smoothing)}`,
          ""
        );
      return `<path d="${d}" />`;
    }

    function getPoint(
      point: number[],
      i: number,
      a: number[][],
      smoothing: number
    ) {
      const cp = (
          current: number[],
          previous: number[],
          next: number[],
          reverse: boolean
        ) => {
          const p = previous || current,
            n = next || current,
            o = {
              length: Math.sqrt(
                Math.pow(n[0] - p[0], 2) + Math.pow(n[1] - p[1], 2)
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

    const $$ = (s: string, o: Document = document): NodeListOf<Element> =>
      o.querySelectorAll(s);

    $$(".button").forEach((button: Element) => {
      const isUpload = button?.classList?.contains("upload");
      const icon = button?.querySelector(".icon") as Element;
      const line = icon?.querySelector(".line") as Element;

      const svgPath = new Proxy(
        {
          y: null,
        },
        {
          set(target: any, key, value) {
            target[key] = value;
            if (target.y !== null && line?.innerHTML) {
              line.innerHTML = getPath(target.y, 0.25, null);
            }
            return true;
          },
          get(target, key) {
            return target[key];
          },
        }
      );

      const timeline = gsap.timeline({
        paused: true,
      });
      let interval: any;

      svgPath.y = 12;

      timeline
        .to(icon, {
          "--arrow-y": 6,
          "--arrow-rotate": isUpload ? 70 : 150,
          ease: "elastic.in(1.1, .8)",
          duration: 0.7,
          onComplete() {
            particles(icon, 2, 10, 18, -60, -120);
          },
        })
        .to(icon, {
          "--arrow-y": 0,
          "--arrow-rotate": isUpload ? 45 : 135,
          ease: "elastic.out(1.1, .8)",
          duration: 0.7,
        });

      timeline
        .to(
          svgPath,
          {
            y: 15,
            duration: 0.15,
          },
          0.65
        )
        .to(
          svgPath,
          {
            y: 12,
            ease: "elastic.out(1.2, .7)",
            duration: 0.6,
          },
          0.8
        );

      button.addEventListener("mouseover", () => {
        timeline.restart();
        interval = setInterval(() => timeline.restart(), 1500);
      });

      button.addEventListener("mouseout", () => {
        timeline.restart();
        clearInterval(interval);
      });
    });

    function particles(
      parent: any,
      quantity: number,
      x: number,
      y: number,
      minAngle: number,
      maxAngle: number
    ) {
      const minScale = 0.07;
      const maxScale = 0.5;

      let dotCounter = 0;
      const maxDotsPerRun = 5; // Set the maximum limit for dots in each animation run

      const initialDotCount = quantity; // Store the initial dot count

      for (let i = quantity - 1; i >= 0; i--) {
        if (dotCounter >= maxDotsPerRun) {
          break; // Stop generating dots if the limit is reached for this animation run
        }

        const angle = minAngle + Math.random() * (maxAngle - minAngle);
        const scale = minScale + Math.random() * (maxScale - minScale) * 0.9;
        const velocity = 12 + Math.random() * (80 - 60);
        const dot = document.createElement("div");

        dot.className = "dot";
        parent?.appendChild(dot);
        dot.style.opacity = "1";
        dot.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;

        const duration = 1.2;
        const gravity = 20;
        const opacityDuration = 0.4;
        const opacityDelay = duration - opacityDuration;

        let elapsed = 0;
        const animateDot = (timestamp: number) => {
          if (elapsed === 0) elapsed = timestamp;
          const progress = (timestamp - elapsed) / (duration * 1000);

          if (progress >= 1) {
            // Dot animation completed, do nothing
          } else {
            const minX = -5;
            const maxX = 20;
            const minY = -5;
            const maxY = 20;

            let xPosition = x + velocity * progress * Math.cos(angle);
            let yPosition =
              y +
              velocity * progress * Math.sin(angle) +
              0.5 * gravity * progress * progress;

            // Constrain xPosition within the range
            xPosition = Math.max(minX, Math.min(maxX, xPosition));

            // Constrain yPosition within the range
            yPosition = Math.max(minY, Math.min(maxY, yPosition));
            const opacity =
              progress < opacityDelay
                ? 1
                : 1 - (progress - opacityDelay) / opacityDuration;
            const dotScale = scale * (1 - progress); // Decrease the dot size over time

            dot.style.transform = `translate(${xPosition}px, ${yPosition}px) scale(${dotScale})`;
            dot.style.opacity = opacity.toString();
            requestAnimationFrame(animateDot);
          }
        };

        requestAnimationFrame(animateDot);
        dotCounter++; // Increment the dot counter for this animation run

        // Check if dotCounter exceeds the initial dot count
        if (dotCounter >= initialDotCount) {
          break;
        }
      }
    }
  };

  useEffect(() => {
    animationDownloadButton();
  }, []);

  return (
    <UploadButtonWrapper style={style}>
      <button
        className={isUploadButton ? "button upload" : "button"}
        onClick={onClick}
      >
        <div className="icon">
          <div className="arrow"></div>
          <svg className="line" viewBox="0 0 24 24">
            <path d="M 5,12 C 6.75,12 8.5,12 12,12 C 15.5,12 17.25,12 19,12"></path>
          </svg>
        </div>

        {text}
      </button>
    </UploadButtonWrapper>
  );
};

export default UploadButton;
