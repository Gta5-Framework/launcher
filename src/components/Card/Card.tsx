import type { ReactNode } from "react";
import styles from "./Card.module.css";

export interface CardProps {
  title: string;
  meta?: string;
  children: ReactNode;
}

export function Card({ title, meta, children }: CardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        {meta && <span className={styles.meta}>{meta}</span>}
      </div>
      <p className={styles.body}>{children}</p>
    </div>
  );
}
