import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import styles from "./ScaleStage.module.css";

const DESIGN_WIDTH = 1920;
const DESIGN_HEIGHT = 1080;

export interface ScaleStageProps {
  children: ReactNode;
}

/**
 * Renders children on a fixed 1920x1080 canvas (the Figma design's native
 * size) and uniformly scales that canvas to fit whatever window size the
 * app is actually running at. This keeps every absolute-positioned
 * coordinate in the design 1:1 with Figma, regardless of window size.
 */
export function ScaleStage({ children }: ScaleStageProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const updateScale = () => {
      const { width, height } = viewport.getBoundingClientRect();
      setScale(Math.min(width / DESIGN_WIDTH, height / DESIGN_HEIGHT));
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={viewportRef} className={styles.viewport}>
      <div
        className={styles.stage}
        style={{
          width: DESIGN_WIDTH,
          height: DESIGN_HEIGHT,
          transform: `scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
