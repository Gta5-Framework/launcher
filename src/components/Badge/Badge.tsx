import { Dot, type DotTone } from "../Dot";
import styles from "./Badge.module.css";

export interface BadgeProps {
  label: string;
  tone?: DotTone;
}

export function Badge({ label, tone = "green" }: BadgeProps) {
  return (
    <span className={styles.badge} data-tone={tone}>
      <Dot tone={tone} size={8} />
      <span className={styles.label}>{label}</span>
    </span>
  );
}
