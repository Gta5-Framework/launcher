import type { CSSProperties, ReactNode } from "react";

export interface PositionedProps {
  x: number;
  y: number;
  w?: number;
  h?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

/**
 * Places a child at an exact (x, y[, w, h]) coordinate on the 1920x1080
 * design canvas (see ScaleStage). Keeps the Figma-exact layout out of
 * each component's own CSS so components stay reusable outside the stage.
 */
export function Positioned({ x, y, w, h, className, style, children }: PositionedProps) {
  return (
    <div
      className={className}
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
