import styles from "./Dot.module.css";

export type DotTone = "blue" | "green" | "white" | "muted" | "red";

export interface DotProps {
  tone?: DotTone;
  size?: number;
}

export function Dot({ tone = "white", size = 8 }: DotProps) {
  return (
    <span
      className={styles.dot}
      data-tone={tone}
      style={{ width: size, height: size }}
    />
  );
}
