import { Fragment } from "react";
import { Dot, type DotTone } from "../Dot";
import { Positioned } from "../Positioned";
import styles from "./StatusCard.module.css";

export interface StatusStat {
  label: string;
  value: string;
}

export interface StatusCardProps {
  statusLabel: string;
  stats: StatusStat[];
  dotTone?: DotTone;
}

const STAT_STEP_X = 248;

export function StatusCard({ statusLabel, stats, dotTone = "green" }: StatusCardProps) {
  return (
    <div className={styles.card}>
      <Positioned x={32} y={33} className={styles.statusRow}>
        <Dot tone={dotTone} size={12} />
        <span className={styles.statusLabel}>{statusLabel}</span>
      </Positioned>

      {stats.map((stat, index) => (
        <Fragment key={stat.label}>
          <Positioned x={32 + index * STAT_STEP_X} y={86}>
            <span className={styles.statLabel}>{stat.label}</span>
          </Positioned>
          <Positioned x={32 + index * STAT_STEP_X} y={110}>
            <span className={styles.statValue}>{stat.value}</span>
          </Positioned>
        </Fragment>
      ))}
    </div>
  );
}
